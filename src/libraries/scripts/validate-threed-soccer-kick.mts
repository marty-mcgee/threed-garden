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
const pendingRef = { current: null };
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
  soccerKickContextRef: contextRef,
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

console.log('PASS: exact-instance eligibility, bounded Rapier impulse, Scene completion correlation, and final actor recheck');

// The actual Character adapter must accept the Scene-validated kick range,
// while generic interactions retain their shorter approach requirement.
const THREE = require('three');
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
const mixer = new THREE.AnimationMixer(new THREE.Object3D());
const kickAction = mixer.clipAction(new THREE.AnimationClip('kick', 1, []));
const taskLock = { current: false };
const startTask = vm.runInNewContext(ts.transpileModule(`const start = ${taskNode.getText(ecctrlSource)}; start;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  THREE, console, window: fakeWindow, CustomEvent: FakeCustomEvent,
  setTimeout: () => 1, clearTimeout: () => {},
  mixerRef: { current: mixer }, actionsRef: { current: new Map([['kick', kickAction]]) }, taskLockedRef: taskLock,
  character: { id: 9, name: 'Test Character', animationSpeed: 1 },
  ecctrlRef: { current: { currPos: { x: 0, y: 1, z: 0 }, currQuat: new THREE.Quaternion() } },
  taskFacingYawRef: { current: null }, taskFacingQuaternionRef: { current: new THREE.Quaternion() },
  taskOrientationTransitionRef: { current: null }, taskCleanupTimerRef: { current: null },
  finishedListenerRef: { current: null }, currentActionRef: { current: null }, lastClipNameRef: { current: null },
  activeTaskRef: { current: null }, lastLocomotionStateRef: { current: 'IDLE' }, playAnimation: () => {},
  planThreeDInteractionApproach, THREED_INTERACTION_FACING_TOLERANCE, CROSSFADE_DURATION: 0.2,
});
const rangeTarget = { position: { x: 4, y: 1, z: 0 }, soccerKickRequest: true };
assert.equal(startTask('kick', { ...rangeTarget, soccerKickRequest: false }), false);
assert.equal(startTask('kick', rangeTarget), true, 'A Scene-approved 4-unit kick must start rather than wait for a timeout');
assert.equal(taskLock.current, true);
mixer.update(2);
assert.equal(taskLock.current, false, 'One-shot completion restores locomotion control');
console.log('PASS: actual Character kick starts inside the Soccer range and releases its action lock on completion.');
