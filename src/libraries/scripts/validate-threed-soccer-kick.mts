import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {
  findSoccerKickParticipants,
  isSoccerFootKickSlot,
  planSoccerKickImpulse,
  soccerKickInRange,
  validSoccerKickRequest,
  SOCCER_KICK_MAX_SPEED,
  THREED_SOCCER_KICK_REJECT_EVENT,
  THREED_SOCCER_KICK_REQUEST_EVENT,
  THREED_SOCCER_KICK_APPLY_EVENT,
  THREED_SOCCER_KICK_RESULT_EVENT,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/physics/soccer-kick-core.ts';
import {
  THREED_ACTION_COLLISION_SAMPLE_EVENT,
  validThreeDActionCollisionSample,
  defaultKickCollisionPoints,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/physics/action-collision-core.ts';
import {
  THREED_MODEL_PLACEMENT_EVENT,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/project-model-instance-core.ts';

assert(isSoccerFootKickSlot('Left Foot Soccer'));
assert(isSoccerFootKickSlot('Kick Soccerball Right'));
assert(!isSoccerFootKickSlot('Header Soccer'));
assert(!isSoccerFootKickSlot('Penalty Kick Soccer'));

const request = {
  version: 1, requestId: '01234567-89ab-4cde-8fab-0123456789ab',
  projectId: 15, characterId: 9, characterMarkerId: 'characters-9',
  ballMarkerId: 'models-placement-2953', action: 'leftFootSoccer',
};
assert(validSoccerKickRequest(request));
assert(!validSoccerKickRequest({ ...request, projectId: 0 }));
assert(!validSoccerKickRequest({ ...request, ballMarkerId: '' }));
assert(!validSoccerKickRequest({ ...request, requestId: 'bad' }));
assert(validSoccerKickRequest({ ...request, timing: 'contact', pointIds: ['left-foot'] }));
for (const invalid of [
  { timing: 'contact' }, { timing: 'contact', pointIds: [] },
  { timing: 'contact', pointIds: ['head'] },
  { timing: 'contact', pointIds: ['left-foot', 'left-foot'] },
  { timing: 'immediate', pointIds: ['left-foot'] },
]) assert(!validSoccerKickRequest({ ...request, ...invalid }), 'Contact requests need a supported, unambiguous point mapping');

const actor = { x: -2, y: 0.5, z: 0 };
const ballPosition = { x: 0, y: 0.5, z: 0 };
assert(soccerKickInRange(actor, ballPosition));
assert(!soccerKickInRange({ x: -5, y: 0.5, z: 0 }, ballPosition));
assert(!soccerKickInRange({ x: -2, y: 3, z: 0 }, ballPosition));
assert(!soccerKickInRange(ballPosition, ballPosition));
assert(!soccerKickInRange({ x: NaN, y: 0, z: 0 }, ballPosition));
assert.equal(planSoccerKickImpulse({ actor, ball: ballPosition,
  velocity: { x: SOCCER_KICK_MAX_SPEED, y: 0, z: 0 }, mass: 0.43 }), null);

const actorMarker = { id: request.characterMarkerId, type: 'characters',
  data: { id: request.characterId, isMovable: true } };
const selectedBall = { id: request.ballMarkerId, type: 'models',
  data: { id: 2953, modelId: 53 }, metadata: { physicsMode: 'ball' } };
const otherBall = { id: 'models-placement-2950', type: 'models',
  data: { id: 2950, modelId: 53 }, metadata: { physicsMode: 'ball' } };
const positions = new Map([[actorMarker.id, actor], [selectedBall.id, ballPosition],
  [otherBall.id, { x: 0, y: 0.5, z: 3 }]]);
const eligibility = {
  request, projectId: 15, controlledCharacterId: 9,
  target: { type: 'models', id: 2953, markerId: selectedBall.id },
  markers: [actorMarker, selectedBall, otherBall],
  activeLayers: new Set(['characters', 'models']),
  positionForMarker: (markerId: string) => positions.get(markerId),
};
assert.deepEqual(findSoccerKickParticipants(eligibility),
  { actorPosition: actor, ballPosition });
assert.equal(findSoccerKickParticipants({ ...eligibility, projectId: 8 }), null);
assert.equal(findSoccerKickParticipants({ ...eligibility, controlledCharacterId: null }), null);
assert.equal(findSoccerKickParticipants({ ...eligibility,
  target: { ...eligibility.target, markerId: otherBall.id } }), null);
assert.equal(findSoccerKickParticipants({ ...eligibility,
  markers: [actorMarker, { ...selectedBall, isVisible: false }, otherBall] }), null);
assert.equal(findSoccerKickParticipants({ ...eligibility,
  activeLayers: new Set(['characters']) }), null);
assert.equal(findSoccerKickParticipants({ ...eligibility,
  positionForMarker: id => id === selectedBall.id ? { x: 7, y: 0.5, z: 0 } : positions.get(id) }), null);

const require = createRequire(import.meta.url);
const R = require(require.resolve('@dimforge/rapier3d-compat', {
  paths: [require.resolve('@react-three/rapier')],
}));
await R.init();
const world = new R.World({ x: 0, y: 0, z: 0 });
const first = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 0.5, 0));
const second = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 0.5, 3));
world.createCollider(R.ColliderDesc.ball(0.5).setMass(0.43), first);
world.createCollider(R.ColliderDesc.ball(0.5).setMass(0.43), second);
world.step();
assert.equal(first.linvel().x, 0, 'No kick before the completed action handoff');
const impulse = planSoccerKickImpulse({ actor, ball: first.translation(),
  velocity: first.linvel(), mass: first.mass() });
assert(impulse);
first.applyImpulse(impulse, true);
world.step();
assert(first.linvel().x > 0, 'The selected physical ball receives a kick');
assert.equal(second.linvel().x, 0, 'Another Project ball instance remains untouched');
assert(Math.hypot(first.linvel().x, first.linvel().z) <= SOCCER_KICK_MAX_SPEED);
assert.equal(planSoccerKickImpulse({ actor, ball: { x: 7, y: 0.5, z: 0 },
  velocity: first.linvel(), mass: first.mass() }), null,
'Ball movement beyond the live interaction range cancels the effect');
world.free();

// Execute the actual Scene event effect with a synthetic window. This proves
// one-shot correlation without mounting React, assets, or a second physics world.
const scenePath = path.resolve('src/components/map/ThreeDScene.tsx');
const sceneSourceText = fs.readFileSync(scenePath, 'utf8');
const sceneSource = ts.createSourceFile(scenePath, sceneSourceText,
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let eventEffect: ts.ArrowFunction | undefined;
const visit = (node: ts.Node) => {
  if (ts.isCallExpression(node) && node.expression.getText(sceneSource) === 'useEffect'
    && node.arguments[0] && ts.isArrowFunction(node.arguments[0])
    && node.arguments[0].getText(sceneSource).includes('const onRequest = (event: Event)')) {
    eventEffect = node.arguments[0];
  }
  ts.forEachChild(node, visit);
};
visit(sceneSource);
const sceneEventEffect = eventEffect as ts.ArrowFunction | undefined;
assert(sceneEventEffect, 'Scene kick event effect must remain available for regression coverage');
const listeners = new Map<string, (event: FakeCustomEvent) => void>();
const events: FakeCustomEvent[] = [];
const fakeWindow = {
  addEventListener(type: string, handler: (event: FakeCustomEvent) => void) { listeners.set(type, handler); },
  removeEventListener(type: string, handler: (event: FakeCustomEvent) => void) { if (listeners.get(type) === handler) listeners.delete(type); },
  dispatchEvent(event: FakeCustomEvent) {
    events.push(event);
    listeners.get(event.type)?.(event);
    return true;
  },
};
class FakeCustomEvent {
  type: string;
  detail: any;
  constructor(type: string, options?: { detail: any }) { this.type = type; this.detail = options?.detail; }
}
const timers = new Map<number, () => void>();
let nextTimer = 1;
const contextRef = { current: {
  projectId: 15, controlledCharacterId: 9 as number | null,
  actionTarget: { ...eligibility.target, name: 'Selected ball', position: { x: 100, y: 100, z: 100 } },
  sceneMarkers: eligibility.markers,
  activeLayers: eligibility.activeLayers,
  visibleMarkerIds: undefined,
} };
const pendingRef: { current: any } = { current: null };
const effectCode = ts.transpileModule(`const effect = ${sceneEventEffect.getText(sceneSource)}; effect;`,
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const effect = vm.runInNewContext(effectCode, {
  window: fakeWindow, CustomEvent: FakeCustomEvent,
  setTimeout: (callback: () => void) => { const id = nextTimer++; timers.set(id, callback); return id; },
  clearTimeout: (id: number) => timers.delete(id),
  soccerKickContextRef: contextRef,
  pendingSoccerKickRef: pendingRef,
  livePositionsRef: { current: positions },
  findSoccerKickParticipants, validSoccerKickRequest,
  THREED_ACTION_COLLISION_SAMPLE_EVENT, validThreeDActionCollisionSample,
  THREED_MODEL_PLACEMENT_EVENT,
  THREED_SOCCER_KICK_REJECT_EVENT,
  THREED_SOCCER_KICK_REQUEST_EVENT,
  THREED_SOCCER_KICK_APPLY_EVENT,
  THREED_SOCCER_KICK_RESULT_EVENT,
});
const cleanup = effect();
fakeWindow.dispatchEvent(new FakeCustomEvent(THREED_SOCCER_KICK_REQUEST_EVENT, { detail: request }));
assert(events.some(event => event.type === 'garden-character-action'
  && event.detail.markerId === request.characterMarkerId));
assert(!events.some(event => event.type === THREED_SOCCER_KICK_APPLY_EVENT),
  'No ball effect before the matching one-shot completion');
const actionTarget = events.find(event => event.type === 'garden-character-action')!.detail.target;
assert.deepEqual(actionTarget.position, ballPosition, 'Animation receives the live ball position, not stale target coordinates');
fakeWindow.dispatchEvent(new FakeCustomEvent('garden-character-action-complete', {
  detail: { characterId: 9, action: 'wrongAction', target: actionTarget },
}));
assert(!events.some(event => event.type === THREED_SOCCER_KICK_APPLY_EVENT));
fakeWindow.dispatchEvent(new FakeCustomEvent('garden-character-action-complete', {
  detail: { characterId: 9, action: request.action, target: actionTarget },
}));
assert.equal(events.filter(event => event.type === THREED_SOCCER_KICK_APPLY_EVENT).length, 1);
fakeWindow.dispatchEvent(new FakeCustomEvent(THREED_SOCCER_KICK_RESULT_EVENT, {
  detail: { requestId: request.requestId, projectId: 15,
    ballMarkerId: request.ballMarkerId, applied: true },
}));
fakeWindow.dispatchEvent(new FakeCustomEvent('garden-character-action-complete', {
  detail: { characterId: 9, action: request.action, target: actionTarget },
}));
assert.equal(events.filter(event => event.type === THREED_SOCCER_KICK_APPLY_EVENT).length, 1,
  'Repeated completion cannot apply another kick');
const nextRequest = { ...request, requestId: 'abcdef01-2345-4789-abcd-abcdef012345' };
fakeWindow.dispatchEvent(new FakeCustomEvent(THREED_SOCCER_KICK_REQUEST_EVENT, { detail: nextRequest }));
const nextTarget = events.filter(event => event.type === 'garden-character-action').at(-1)!.detail.target;
contextRef.current.actionTarget = { ...contextRef.current.actionTarget,
  markerId: otherBall.id, id: 2950 };
fakeWindow.dispatchEvent(new FakeCustomEvent('garden-character-action-complete', {
  detail: { characterId: 9, action: nextRequest.action, target: nextTarget },
}));
assert.equal(events.filter(event => event.type === THREED_SOCCER_KICK_APPLY_EVENT).length, 1,
  'Replacing the selected Model target cancels the pending kick');
assert.equal(pendingRef.current, null);
contextRef.current.actionTarget = { ...contextRef.current.actionTarget, ...eligibility.target };
// A contact action forwards only samples from its exact animated point. Neither
// an unrelated sample nor completion may substitute for a physical hit.
const dispatch = (type: string, detail: any) => fakeWindow.dispatchEvent(new FakeCustomEvent(type, { detail }));
const applyCount = () => events.filter(event => event.type === THREED_SOCCER_KICK_APPLY_EVENT).length;
let contactRequestNumber = 0;
const beginContact = () => {
  const contactRequest = { ...request, requestId: `contact-request-${++contactRequestNumber}`,
    timing: 'contact' as const, pointIds: ['left-foot'] };
  dispatch(THREED_SOCCER_KICK_REQUEST_EVENT, contactRequest);
  const target = events.filter(event => event.type === 'garden-character-action').at(-1)!.detail.target;
  const sample = { version: 1 as const, requestId: contactRequest.requestId, projectId: 15,
    actorMarkerId: request.characterMarkerId, targetMarkerId: request.ballMarkerId,
    action: request.action, clipName: request.action, pointId: 'left-foot',
    sourceNode: 'mixamorigLeftFoot', from: { x: -1, y: 0.5, z: 0 },
    to: { x: 1, y: 0.5, z: 0 }, radius: 0.1 };
  assert(validSoccerKickRequest(contactRequest));
  assert(validThreeDActionCollisionSample(sample));
  return { contactRequest, target, sample };
};
const contact = beginContact();
assert.equal(contact.target.collisionRequest.requestId, contact.contactRequest.requestId,
  'The Character receives the authorized contact request with the animation target');
const beforeContact = applyCount();
for (const changed of [
  { requestId: 'unrelated-request' }, { projectId: 16 },
  { actorMarkerId: 'characters-10' }, { targetMarkerId: otherBall.id },
  { action: 'rightFootSoccer' }, { pointId: 'right-foot' }, { clipName: 'unrelatedAnimation' },
  { to: { x: NaN, y: 0.5, z: 0 } },
]) {
  dispatch(THREED_ACTION_COLLISION_SAMPLE_EVENT, { ...contact.sample, ...changed });
  assert.equal(applyCount(), beforeContact, 'Uncorrelated or invalid collision samples are ignored');
}
dispatch(THREED_ACTION_COLLISION_SAMPLE_EVENT, contact.sample);
assert.equal(applyCount(), beforeContact + 1, 'Matching animated contact sample reaches the ball physics owner');
assert.deepEqual(events.filter(event => event.type === THREED_SOCCER_KICK_APPLY_EVENT).at(-1)!.detail.collision,
  contact.sample, 'The Scene preserves the sampled world-space sweep for the actual collider check');
dispatch(THREED_SOCCER_KICK_RESULT_EVENT, { requestId: contact.contactRequest.requestId,
  projectId: 15, ballMarkerId: request.ballMarkerId, applied: true });
dispatch(THREED_ACTION_COLLISION_SAMPLE_EVENT, contact.sample);
dispatch('garden-character-action-complete', { characterId: 9, action: request.action, target: contact.target });
assert.equal(applyCount(), beforeContact + 1, 'A successful contact cannot apply again on later samples or completion');
assert.equal(pendingRef.current, null);

const missed = beginContact();
const beforeMiss = applyCount();
dispatch('garden-character-action-complete', { characterId: 9, action: request.action, target: missed.target });
assert.equal(applyCount(), beforeMiss, 'A contact kick that misses has no completion-time fallback impulse');
assert.equal(pendingRef.current, null);
assert.equal(events.filter(event => event.type === THREED_SOCCER_KICK_RESULT_EVENT).at(-1)?.detail.reason, 'miss');

const initialContext = { ...contextRef.current };
for (const [label, change] of [
  ['released control', { controlledCharacterId: null }],
  ['hidden Model layer', { activeLayers: new Set(['characters']) }],
  ['hidden Character layer', { activeLayers: new Set(['models']) }],
  ['changed target', { actionTarget: { ...initialContext.actionTarget, markerId: otherBall.id, id: 2950 } }],
  ['removed ball', { sceneMarkers: [actorMarker, otherBall] }],
  ['removed Character', { sceneMarkers: [selectedBall, otherBall] }],
  ['inactive ball', { sceneMarkers: [actorMarker, { ...selectedBall, isActive: false }, otherBall] }],
  ['hidden ball', { visibleMarkerIds: new Set([actorMarker.id, otherBall.id]) }],
  ['changed Project', { projectId: 16 }],
] as const) {
  const guarded = beginContact();
  const before = applyCount();
  Object.assign(contextRef.current, change);
  dispatch(THREED_ACTION_COLLISION_SAMPLE_EVENT, guarded.sample);
  assert.equal(applyCount(), before, `${label} cancels the contact before the physics handoff`);
  assert.equal(pendingRef.current, null, `${label} releases the pending contact request`);
  Object.assign(contextRef.current, initialContext);
}
const moved = beginContact();
const beforeMoved = applyCount();
positions.set(selectedBall.id, { x: 8, y: 0.5, z: 0 });
dispatch(THREED_ACTION_COLLISION_SAMPLE_EVENT, moved.sample);
assert.equal(applyCount(), beforeMoved, 'Live ball movement beyond range cancels the contact handoff');
assert.equal(pendingRef.current, null);
positions.set(selectedBall.id, ballPosition);
assert.equal(timers.size, 0, 'Completed, missed and cancelled contact requests leave no pending timeout');
const placed = beginContact();
const beforePlacement = applyCount();
dispatch(THREED_MODEL_PLACEMENT_EVENT, { projectId: 15, markerId: request.ballMarkerId,
  position: ballPosition });
dispatch(THREED_ACTION_COLLISION_SAMPLE_EVENT, placed.sample);
assert.equal(applyCount(), beforePlacement, 'An explicit ball placement invalidates the contact request');
assert.equal(pendingRef.current, null);

const ecctrlSource = ts.createSourceFile('EcctrlCharacter.tsx', fs.readFileSync('src/components/threed/shared/EcctrlCharacter.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let rejectionHandler: ts.ArrowFunction | undefined;
const findRejectionHandler = (node: ts.Node) => {
  if (ts.isVariableDeclaration(node) && node.name.getText(ecctrlSource) === 'handleCharacterAction'
    && node.initializer && ts.isArrowFunction(node.initializer)) rejectionHandler = node.initializer;
  ts.forEachChild(node, findRejectionHandler);
};
findRejectionHandler(ecctrlSource);
assert(rejectionHandler);
const rejectAction = vm.runInNewContext(ts.transpileModule(`const handler = ${rejectionHandler.getText(ecctrlSource)}; handler;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  character: { id: 9 }, markerId: request.characterMarkerId, playTaskAction: () => false,
  window: fakeWindow, CustomEvent: FakeCustomEvent, THREED_SOCCER_KICK_REJECT_EVENT,
});
fakeWindow.addEventListener('garden-character-action', rejectAction);
fakeWindow.dispatchEvent(new FakeCustomEvent(THREED_SOCCER_KICK_REQUEST_EVENT, {
  detail: { ...request, requestId: 'rejected-animation-request' },
}));
assert.equal(pendingRef.current, null, 'Rejected animation releases the kick immediately');
assert.equal(timers.size, 0, 'Rejected animation must not leave a 30-second wait');
assert.equal(events.filter(event => event.type === THREED_SOCCER_KICK_RESULT_EVENT).at(-1)?.detail.reason, 'animation-rejected');
fakeWindow.removeEventListener('garden-character-action', rejectAction);
cleanup();
let actorResolverEffect: ts.ArrowFunction | undefined;
const findActorResolver = (node: ts.Node) => {
  if (ts.isVariableDeclaration(node) && node.name.getText(sceneSource) === 'getSoccerKickActorPosition'
    && node.initializer && ts.isCallExpression(node.initializer)
    && node.initializer.arguments[0] && ts.isArrowFunction(node.initializer.arguments[0])) {
    actorResolverEffect = node.initializer.arguments[0];
  }
  ts.forEachChild(node, findActorResolver);
};
findActorResolver(sceneSource);
const actorResolverNode = actorResolverEffect as ts.ArrowFunction | undefined;
assert(actorResolverNode);
const resolverCode = ts.transpileModule(`const resolver = ${actorResolverNode.getText(sceneSource)}; resolver;`,
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const resolveActorAtPhysicsStep = vm.runInNewContext(resolverCode, {
  findSoccerKickParticipants,
  soccerKickContextRef: contextRef,
  pendingSoccerKickRef: pendingRef,
  livePositionsRef: { current: positions },
  normalizeSceneLayerType: (type: string) => type,
});
contextRef.current.actionTarget = { ...contextRef.current.actionTarget, ...eligibility.target };
assert.equal(resolveActorAtPhysicsStep(request).x, actor.x);
contextRef.current.sceneMarkers = [selectedBall, otherBall];
assert.equal(resolveActorAtPhysicsStep(request), null, 'Removed actor cannot kick at physics step');
contextRef.current.sceneMarkers = eligibility.markers;
contextRef.current.controlledCharacterId = null;
assert.equal(resolveActorAtPhysicsStep(request), null, 'Released control cancels the queued effect');
contextRef.current.controlledCharacterId = 9;
assert.equal(resolveActorAtPhysicsStep(contact.contactRequest), null,
  'A cancelled or completed contact cannot survive in the physics queue');
pendingRef.current = { request: contact.contactRequest, phase: 'animating' };
assert.equal(resolveActorAtPhysicsStep(contact.contactRequest).x, actor.x);
for (const updatedBall of [
  { ...selectedBall, isActive: false }, { ...selectedBall, isVisible: false },
  { ...selectedBall, metadata: { physicsMode: 'fixed' } },
]) {
  contextRef.current.sceneMarkers = [actorMarker, updatedBall, otherBall];
  assert.equal(resolveActorAtPhysicsStep(contact.contactRequest), null,
    'The ball eligibility must be rechecked after queuing and before a physics impulse');
}
contextRef.current.sceneMarkers = eligibility.markers;
pendingRef.current = null;

console.log('PASS: exact-instance eligibility, bounded Rapier impulse, assisted completion, contact correlation/miss/cancellation, and final actor recheck');

// The actual Character adapter must accept the Scene-validated kick range,
// while generic interactions retain their shorter approach requirement.
const THREE = require('three');
const { createActionCollisionSampler } = require('../services/threed/physics/action-collision-points.ts');
const { planThreeDInteractionApproach, THREED_INTERACTION_FACING_TOLERANCE } = require('../services/threed/orchestration/interaction-core.ts');
let taskCallback: ts.ArrowFunction | undefined;
const findTaskCallback = (node: ts.Node) => {
  if (ts.isVariableDeclaration(node) && node.name.getText(ecctrlSource) === 'playTaskAction'
    && node.initializer && ts.isCallExpression(node.initializer)
    && node.initializer.arguments[0] && ts.isArrowFunction(node.initializer.arguments[0])) taskCallback = node.initializer.arguments[0];
  ts.forEachChild(node, findTaskCallback);
};
findTaskCallback(ecctrlSource);
const taskNode = taskCallback as ts.ArrowFunction | undefined;
assert(taskNode);
const characterModel = new THREE.Object3D();
const leftFoot = new THREE.Bone();
leftFoot.name = 'mixamorigLeftFoot';
characterModel.add(leftFoot);
const mixer = new THREE.AnimationMixer(characterModel);
const kickAction = mixer.clipAction(new THREE.AnimationClip('kick', 1, [
  new THREE.VectorKeyframeTrack('mixamorigLeftFoot.position', [0, 1], [0, 0, 0, 0, 0, 0.8]),
]));
const taskLock = { current: false };
const collisionSamplerRef = { current: null };
const taskActions = new Map([['kick', kickAction]]);
const startTask = vm.runInNewContext(ts.transpileModule(`const start = ${taskNode.getText(ecctrlSource)}; start;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  THREE, console, window: fakeWindow, CustomEvent: FakeCustomEvent,
  setTimeout: () => 1, clearTimeout: () => {},
  mixerRef: { current: mixer }, actionsRef: { current: taskActions }, taskLockedRef: taskLock,
  character: { id: 9, name: 'Test Character', animationSpeed: 1 },
  ecctrlRef: { current: { currPos: { x: 0, y: 1, z: 0 }, currQuat: new THREE.Quaternion() } },
  taskFacingYawRef: { current: null }, taskFacingQuaternionRef: { current: new THREE.Quaternion() },
  taskOrientationTransitionRef: { current: null }, taskCleanupTimerRef: { current: null },
  finishedListenerRef: { current: null }, currentActionRef: { current: null }, lastClipNameRef: { current: null },
  activeTaskRef: { current: null }, lastLocomotionStateRef: { current: 'IDLE' }, playAnimation: () => {},
  actionCollisionRef: collisionSamplerRef,
  model: characterModel, markerId: request.characterMarkerId,
  isControlled: true, layerEnabled: true, characterVisualReady: true, usesShape: false,
  validSoccerKickRequest, createActionCollisionSampler, THREED_SOCCER_KICK_REJECT_EVENT,
  planThreeDInteractionApproach, THREED_INTERACTION_FACING_TOLERANCE, CROSSFADE_DURATION: 0.2,
});
const rangeTarget = { position: { x: 4, y: 1, z: 0 }, soccerKickRequest: true };
assert.equal(startTask('kick', { ...rangeTarget, soccerKickRequest: false }), false);
assert.equal(startTask('kick', rangeTarget), true, 'A Scene-approved 4-unit kick must start rather than wait for a timeout');
assert.equal(taskLock.current, true);
mixer.update(2);
assert.equal(taskLock.current, false, 'One-shot completion restores locomotion control');
console.log('PASS: actual Character kick starts inside the Soccer range and releases its action lock on completion.');

const collisionRequest = { ...request, action: 'kick', timing: 'contact', pointIds: ['left-foot'] };
const straightTarget = { ...rangeTarget, position: { x: 0, y: 1, z: 2 }, collisionRequest };
assert.equal(startTask('kick', straightTarget), true);
assert(collisionSamplerRef.current, 'Direct contact action arms the actual rendered-rig sampler');
mixer.update(2);
assert.equal(collisionSamplerRef.current, null, 'Direct one-shot completion clears collision sampling');
assert.equal(taskLock.current, false);
assert.equal(startTask('kick', { ...straightTarget,
  collisionRequest: { ...collisionRequest, pointIds: ['right-foot'] } }), false,
  'An unavailable rig point cannot silently become an assisted kick');
assert.equal(taskLock.current, false);
assert.equal(events.filter(event => event.type === THREED_SOCCER_KICK_REJECT_EVENT).at(-1)?.detail.reason, 'collision-unavailable');

const turnAction = mixer.clipAction(new THREE.AnimationClip('turn', 1, []));
taskActions.set('turnright', turnAction);
assert.equal(startTask('kick', { ...rangeTarget, collisionRequest }), true);
assert.equal(collisionSamplerRef.current, null, 'Turning toward the ball must not sample a kicking foot');
assert.equal(taskLock.current, true);
mixer.dispatchEvent({ type: 'finished', action: turnAction });
assert(collisionSamplerRef.current, 'The task portion of turn/task/return arms collision sampling');
mixer.dispatchEvent({ type: 'finished', action: kickAction });
assert.equal(collisionSamplerRef.current, null, 'Return-turn locomotion cannot trigger another foot hit');
assert.equal(taskLock.current, true, 'The existing return turn keeps its lock until sequence completion');
mixer.dispatchEvent({ type: 'finished', action: turnAction });
assert.equal(taskLock.current, false);
assert.equal(collisionSamplerRef.current, null);
console.log('PASS: actual Character contact actions resolve rig points, reject missing points, and arm/clear only during the kick in direct and turn/task/return paths.');

// Execute the actual Details action handler: mapped kick buttons choose contact
// only for an eligible ball target; ordinary custom animation stays available.
const detailsPath = 'src/components/map/details/DetailsCard.tsx';
const detailsSource = ts.createSourceFile(detailsPath, fs.readFileSync(detailsPath, 'utf8'),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const uiCallbacks = new Map<string, string>();
let animationButtonHandler: string | undefined;
let kickReadiness: string | undefined;
const findDetailsCallbacks = (node: ts.Node) => {
  if (ts.isVariableDeclaration(node) && node.name.getText(detailsSource) === 'kickReady' && node.initializer) {
    kickReadiness = node.initializer.getText(detailsSource);
  }
  if (ts.isVariableDeclaration(node) && ['contactPointsForAction', 'requestBallKick'].includes(node.name.getText(detailsSource))
    && node.initializer && ts.isArrowFunction(node.initializer)) {
    uiCallbacks.set(node.name.getText(detailsSource), node.initializer.getText(detailsSource));
  }
  if (ts.isJsxAttribute(node) && node.name.getText(detailsSource) === 'onClick'
    && node.initializer && ts.isJsxExpression(node.initializer)
    && node.initializer.expression && ts.isArrowFunction(node.initializer.expression)
    && node.initializer.expression.getText(detailsSource).includes('requestBallKick(action, true)')) {
    animationButtonHandler = node.initializer.expression.getText(detailsSource);
  }
  ts.forEachChild(node, findDetailsCallbacks);
};
findDetailsCallbacks(detailsSource);
assert(animationButtonHandler && kickReadiness && uiCallbacks.size === 2);
const uiEvents: FakeCustomEvent[] = [];
const uiContext: any = {
  defaultKickCollisionPoints, THREED_SOCCER_KICK_REQUEST_EVENT, CustomEvent: FakeCustomEvent,
  window: { dispatchEvent: (event: FakeCustomEvent) => uiEvents.push(event) },
  crypto: { randomUUID: () => `ui-request-${uiEvents.length}` },
  customActionSlots: [
    { actionKey: 'leftFootSoccer', name: 'Kick Left Foot', isActive: true },
    { actionKey: 'rightFootSoccer', name: 'Kick Right Foot', isActive: true },
    { actionKey: 'headerSoccer', name: 'Header Soccer', isActive: true },
    { actionKey: 'passSoccer', name: 'Pass Soccer', isActive: true },
  ],
  customActions: ['leftFootSoccer', 'rightFootSoccer', 'headerSoccer', 'passSoccer'], action: 'leftFootSoccer',
  targetedBall: selectedBall, kickReady: true, actionTarget: eligibility.target,
  projectId: 15, characterId: 9, selected: { id: request.characterMarkerId }, d: { id: 9 },
  pendingKickRequestIdRef: { current: null }, isOrchestrationRunning: false,
  setPendingKickRequestId: () => {}, setKickFeedback: () => {},
  animationAvailability: new Set(['leftfootsoccer', 'rightfootsoccer']), actionTargetCapabilities: null,
  soccerKickInRange, sceneAvailable: true, kickSlot: {}, isSelectedCharacterControlled: true, isEcctrlCharacter: true,
  hasLiveControlledPosition: true, liveControlledCharacterPosition: { position: actor },
  currentActionTargetPosition: ballPosition,
};
vm.createContext(uiContext);
vm.runInContext(ts.transpileModule(
  [...uiCallbacks].map(([name, code]) => `var ${name} = ${code};`).join('\n')
    + `\nvar clickAnimation = ${animationButtonHandler}; var computeKickReady = () => (${kickReadiness});`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, uiContext);
uiContext.clickAnimation({ stopPropagation() {} });
assert.equal(uiEvents.length, 1);
assert.equal(uiEvents[0].type, THREED_SOCCER_KICK_REQUEST_EVENT);
assert.equal(uiEvents[0].detail.timing, 'contact');
assert.deepEqual([...uiEvents[0].detail.pointIds], ['left-foot']);
assert.equal(uiEvents[0].detail.ballMarkerId, request.ballMarkerId);
uiContext.clickAnimation({ stopPropagation() {} });
assert.equal(uiEvents.length, 1, 'Rapid repeated clicks cannot start overlapping contact actions');
uiContext.pendingKickRequestIdRef.current = null;
uiContext.requestBallKick('leftFootSoccer');
assert.equal(uiEvents[1].detail.timing, undefined, 'The assisted Kick selected ball request retains completion timing');
uiContext.pendingKickRequestIdRef.current = null;
uiContext.targetedBall = null;
uiContext.actionTarget = null;
uiContext.clickAnimation({ stopPropagation() {} });
assert.equal(uiEvents[2].type, 'garden-character-action');
assert.equal(uiEvents[2].detail.target, null, 'A custom animation without a ball target remains animation-only');
uiContext.targetedBall = selectedBall;
uiContext.actionTarget = eligibility.target;
uiContext.action = 'rightFootSoccer';
uiContext.clickAnimation({ stopPropagation() {} });
assert.equal(uiEvents.at(-1)!.type, THREED_SOCCER_KICK_REQUEST_EVENT);
assert.equal(uiEvents.at(-1)!.detail.action, 'rightFootSoccer');
assert.deepEqual([...uiEvents.at(-1)!.detail.pointIds], ['right-foot']);
uiContext.pendingKickRequestIdRef.current = null;
for (const action of ['headerSoccer', 'passSoccer']) {
  uiContext.action = action;
  uiContext.clickAnimation({ stopPropagation() {} });
  assert.equal(uiEvents.at(-1)!.type, 'garden-character-action', 'Unmapped header/pass animations do not acquire a kick effect');
  assert.equal(uiEvents.at(-1)!.detail.target, null);
}
assert.equal(uiContext.computeKickReady(), true);
uiContext.action = 'leftFootSoccer';
uiContext.isEcctrlCharacter = false;
uiContext.clickAnimation({ stopPropagation() {} });
assert.equal(uiEvents.at(-1)!.type, 'garden-character-action', 'Garden Character foot actions retain animation-only previews even with a ball target');
assert.equal(uiEvents.at(-1)!.detail.target, null);
uiContext.isEcctrlCharacter = true;
uiContext.isSelectedCharacterControlled = false;
uiContext.kickReady = uiContext.computeKickReady();
assert.equal(uiContext.kickReady, false);
let previousUiEvents = uiEvents.length;
uiContext.requestBallKick('leftFootSoccer', true);
assert.equal(uiEvents.length, previousUiEvents, 'Released control prevents requesting an animated kick');
uiContext.isSelectedCharacterControlled = true;
uiContext.currentActionTargetPosition = { x: 8, y: 0.5, z: 0 };
uiContext.kickReady = uiContext.computeKickReady();
assert.equal(uiContext.kickReady, false);
uiContext.requestBallKick('leftFootSoccer', true);
assert.equal(uiEvents.length, previousUiEvents, 'Out-of-range live target prevents requesting an animated kick');
uiContext.currentActionTargetPosition = ballPosition;
uiContext.kickReady = uiContext.computeKickReady();
uiContext.isOrchestrationRunning = true;
uiContext.requestBallKick('leftFootSoccer', true);
assert.equal(uiEvents.length, previousUiEvents, 'An existing interaction prevents overlapping kick requests');
console.log('PASS: actual Details kick buttons request contact once for the exact ball, preserve assisted timing, and retain untargeted animation playback.');
