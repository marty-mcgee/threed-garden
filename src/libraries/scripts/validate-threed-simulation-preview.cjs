const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript'), THREE = require('three');
const jsx = (type, props) => ({ type, props }), proxy = new Proxy({}, { get: (_, name) => String(name) });
function load(file, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, console, URLSearchParams, AbortController, AbortSignal, DOMException, setTimeout, clearTimeout, crypto: require('node:crypto'), ...globals, require(name) {
      if (name in deps) return deps[name]; if (name === 'three') return THREE;
      const target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
      assert(name.startsWith('.') || name.startsWith('@/'), name);
      return load(fs.existsSync(target) ? target : target + '.ts', deps, globals);
    } }); return exports;
}
const root = 'src/components/admin/threed/simulations/';
const contract = load('src/libraries/services/threed/simulations/simulation-preview-contract.ts');
const row = { sourceAssetId: 9, markerType: 'characters', positionX: '-12.5', positionY: '.2', positionZ: '8', data: { rotation: 90, scale: .5, scaleMultiplier: 2 }, isVisible: true };
const pose = contract.simulationMarkerPreview(row);
assert.equal(JSON.stringify(pose.position), '[-12.5,0.2,8]'); assert.equal(pose.rotation[1], Math.PI / 2);
for (const bad of [{ ...row, positionX: null }, { ...row, sourceAssetId: 0 }, { ...row, positionZ: 'Infinity' }, { ...row, data: { scale: 0 } }, { ...row, data: { rotation: 'bad' } }]) assert.equal(contract.simulationMarkerPreview(bad), null);
assert.equal(contract.simulationMarkerPreview({ ...row, isVisible: false }).visible, false);
const timelineModule = load(root + 'simulation-preview-timeline.ts');
const clips = [{ action: 'run', clipName: 'Run', duration: 1 }, { action: 'custom_kick', clipName: 'Kick', duration: 1 }, { action: 'talk', clipName: 'Talk', duration: 1 }];
const mapping = { modelId: 11, assignments: [], inherited: [], animations: [], slots: [{ actionKey: 'custom_kick', name: 'Kick Soccer Ball Right Foot', isActive: true }] };
const steps = [{ id: 'run', action: 'runToTarget', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 30000, onFailure: 'stop' }, { id: 'kick', action: 'kickBall', actorMarkerId: 'kate', targetMarkerId: 'ball', timeoutMs: 30000, onFailure: 'stop' }];
assert.equal(timelineModule.simulationPreviewAction(steps[0], clips, mapping).action, 'run');
assert.equal(timelineModule.simulationPreviewAction(steps[1], clips, mapping).action, 'custom_kick');
assert.equal(timelineModule.simulationPreviewAction(steps[1], clips, { ...mapping, slots: [{ ...mapping.slots[0], isActive: false }] }), undefined);
let timers = [], states = [];
const timed = load(root + 'simulation-preview-timeline.ts', {}, { setTimeout: fn => { const timer = { fn, cleared: false }; timers.push(timer); return timer; }, clearTimeout: timer => { if (timer) timer.cleared = true; } });
const timeline = new timed.SimulationPreviewTimeline(state => states.push(state));
timeline.play(steps); const first = states.at(-1).requestId;
timeline.finish('stale'); assert.equal(states.at(-1).index, 0);
timeline.finish(first); assert.equal(states.at(-1).index, 1);
const last = states.at(-1).requestId; timeline.stop(); timeline.finish(last); assert.equal(states.at(-1).phase, 'stopped');
timeline.play(steps); const newFirst = states.at(-1).requestId; assert.notEqual(first, newFirst);
timeline.finish(newFirst); timeline.finish(states.at(-1).requestId); assert.equal(states.at(-1).phase, 'finished');
timeline.play(steps); timers.at(-1).fn(); assert.equal(states.at(-1).phase, 'failed'); assert(states.at(-1).message.includes('timed out'));

// Actual Three.js completion drives one preview cycle; cleanup cancels callbacks.
const player = load('src/libraries/utils/character-preview-action.ts');
const mesh = new THREE.Object3D(), mixer = new THREE.AnimationMixer(mesh), clip = new THREE.AnimationClip('Run', 1, [new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [0, 1])]);
let finished = 0;
const cancel = player.playCharacterPreviewAction(mixer, clip, () => finished++); mixer.update(.5); assert.equal(finished, 0); mixer.update(.6); assert.equal(finished, 1); mixer.update(2); assert.equal(finished, 1); cancel();
const cancelEarly = player.playCharacterPreviewAction(mixer, clip, () => finished++); cancelEarly(); mixer.update(2); assert.equal(finished, 1);

// Execute Garden's actual opt-in effect: no task dispatch, registration or physics adapter.
const source = fs.readFileSync('src/components/threed/shared/GardenCharacter.tsx', 'utf8'), ast = ts.createSourceFile('Garden.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect, findClip;
let resourceWait;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect' && node.arguments[0]?.getText(ast).includes('playCharacterPreviewAction(')) effect = node.arguments[0];
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'findClip') findClip = node;
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'waitForResources') resourceWait = node.initializer;
  ts.forEachChild(node, visit);
}
visit(ast); assert(effect && findClip);
let callbacks = [], failures = [], cleanup;
const gardenContext = { THREE, previewMode: true, previewActions: true, usesShape: false, character: { model: { filePath: 'rig.fbx' } }, model: mesh,
  previewContact: { current: null },
  mixerRef: { current: mixer }, animationsRef: { current: [clip] }, animMapRef: { current: null }, previewAction: { id: 'one', action: 'run' },
  playCharacterPreviewAction: player.playCharacterPreviewAction, playCharacterPreviewIdle: player.playCharacterPreviewIdle, onPreviewActionFinished: id => callbacks.push(id), onPreviewState: message => failures.push(message), onPreviewActions() {} };
const gardenCode = ts.transpileModule(findClip.getText(ast) + '\nvar effect = ' + effect.getText(ast) + '; cleanup = effect();', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(gardenCode, gardenContext); cleanup = gardenContext.cleanup; mixer.update(1.1); assert.deepEqual(callbacks, ['one']); cleanup();
gardenContext.previewAction = { id: 'two', action: 'missing' }; vm.runInNewContext(gardenCode, gardenContext); assert(failures.at(-1).includes('unavailable'));

// Initial/restored default playback loops, including clips previously cached as one-shot.
gardenContext.previewAction = null;
gardenContext.character.defaultAnimation = 'run';
vm.runInNewContext(gardenCode, gardenContext);
assert.equal(mixer.clipAction(clip).loop, THREE.LoopRepeat);
assert.equal(mixer.clipAction(clip).clampWhenFinished, false);
mixer.update(2.5); assert.equal(mesh.position.x, .5); assert.deepEqual(callbacks, ['one']);
gardenContext.cleanup();
const idle = new THREE.AnimationClip('Idle', 1, [new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [2, 4])]);
gardenContext.animationsRef.current.push(idle);
gardenContext.character.defaultAnimation = 'unavailable-default';
vm.runInNewContext(gardenCode, gardenContext);
assert.equal(mesh.position.x, 2); mixer.update(2.5); assert.equal(mesh.position.x, 3);
assert.deepEqual(callbacks, ['one']); gardenContext.cleanup();

// Execute the actual Canvas motion callback with real Three.js transforms.
const canvasSource = fs.readFileSync(root + 'SimulationPreviewCanvas.tsx', 'utf8');
const canvasAst = ts.createSourceFile('Canvas.tsx', canvasSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let motion;
function findMotion(node) { if (ts.isCallExpression(node) && node.expression.getText(canvasAst) === 'useFrame') motion = node.arguments[0]; ts.forEachChild(node, findMotion); }
findMotion(canvasAst); assert(motion);
const moving = new THREE.Group(), arrivals = [];
const motionContext = { request: { id: 'approach', action: 'run', approach: true }, target: [4, 0, 0], owner: { current: moving }, completed: { current: '' }, character: { rotation: 0 }, onFinished: id => arrivals.push(id), remaining: { current: 0 }, velocity: { current: new THREE.Vector3() }, visual: { current: new THREE.Group() } };
vm.runInNewContext(ts.transpileModule('var tick = ' + motion.getText(canvasAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, motionContext);
for (let i = 0; i < 30; i++) motionContext.tick(null, .1);
assert(Math.abs(moving.position.x - 3.2) < .001); assert.equal(moving.rotation.y, Math.PI / 2); assert.deepEqual(arrivals, ['approach']);
motionContext.request = null; motionContext.tick(null, .1); assert(Math.abs(moving.position.x - 3.2) < .001);
gardenContext.previewAction = { id: 'approach', action: 'run', approach: true };
vm.runInNewContext(gardenCode, gardenContext); mixer.update(3); assert.deepEqual(callbacks, ['one']); gardenContext.cleanup();

// Actual target-owner callback: misses/stale samples cannot kick, contact starts motion once.
let contactCallback;
function findContact(node) { if (ts.isVariableDeclaration(node) && node.name.getText(canvasAst) === 'sampleContact') contactCallback = node.initializer.arguments[0]; ts.forEachChild(node, findContact); }
findContact(canvasAst); assert(contactCallback);
const core = load('src/libraries/services/threed/physics/action-collision-core.ts');
const ball = new THREE.Group(); ball.position.x = 1;
const ballVisual = new THREE.Group(); ball.add(ballVisual); ballVisual.add(new THREE.Mesh(new THREE.SphereGeometry(.3), new THREE.MeshBasicMaterial()));
const ballOwner = { body: ball, visual: ballVisual, velocity: new THREE.Vector3(), remaining: { current: 0 } };
const contacts = [], sample = { version: 1, requestId: 'preview-kick-1', projectId: 16, actorMarkerId: 'kate', targetMarkerId: 'ball', action: 'kick', clipName: 'Kick', pointId: 'right-foot', sourceNode: 'RightFoot', from: { x: .5, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, radius: .1 };
const contactContext = { Box3: THREE.Box3, Vector3: THREE.Vector3, sweptPointHitsSphere: core.sweptPointHitsSphere,
  active: { current: { id: sample.requestId, kick: { context: sample, pointIds: ['right-foot'] } } }, kicked: { current: new Set() },
  owners: { current: new Map([['ball', ballOwner], ['kate', { body: new THREE.Group() }]]) }, onContact: id => contacts.push(id) };
vm.runInNewContext(ts.transpileModule('var contact = ' + contactCallback.getText(canvasAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, contactContext);
contactContext.contact({ ...sample, requestId: 'old-preview' }); assert.equal(ballOwner.velocity.length(), 0);
contactContext.contact({ ...sample, from: { x: 9, y: 0, z: 0 }, to: { x: 10, y: 0, z: 0 } }); assert.equal(ballOwner.velocity.length(), 0);
contactContext.contact(sample); assert.equal(ballOwner.velocity.x, 4.5); assert.deepEqual(contacts, [sample.requestId]);
ballOwner.velocity.x = 2; contactContext.contact(sample); assert.equal(ballOwner.velocity.x, 2, 'Repeated contact does not restart the kick');
Object.assign(motionContext, { owner: { current: ball }, visual: { current: ballVisual }, remaining: ballOwner.remaining, velocity: { current: ballOwner.velocity }, request: null });
motionContext.tick(null, .1); assert(ball.position.x > 1); assert(ballVisual.rotation.z < 0); assert(ballOwner.velocity.x < 2);
ballOwner.velocity.set(0, 0, 0); ballOwner.remaining.current = 0; const stoppedX = ball.position.x; motionContext.tick(null, .1); assert.equal(ball.position.x, stoppedX);

function runtime() {
  const slots = []; let cursor = 0, effects = [], changed = false, body, value;
  const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { const value = typeof next === 'function' ? next(slots[i].value) : next; if (!Object.is(value, slots[i].value)) { slots[i].value = value; changed = true; } }]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(callback, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: callback() }; }); },
    useCallback(callback, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { deps, callback }; return slots[i].callback; },
  };
  const render = () => { let n = 0; do { assert(++n < 30, 'No render/effect loop'); changed = false; cursor = 0; effects = []; value = body(); effects.forEach(effect => effect()); } while (changed); return value; };
  return { react, render, mount(fn) { body = fn; return render(); }, get value() { return value; }, async flush() { for (let i = 0; i < 4; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } }, unmount() { slots.forEach(slot => slot?.cleanup?.()); } };
}
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
(async () => {
  const data = load(root + 'simulation-preview-data.ts');
  const requests = [], savedModel = { id: 11, modelName: 'Farmer', modelType: 'fbx', filePath: 'rig.fbx', scale: '0.25', rotationY: '15', metadata: { activeSource: 'character' }, files: [], materialAssignments: [], textureFallbacks: [{ fileName: 'Farmer.png', filePath: 'https://fixture.invalid/saved/Farmer.png', isActive: true }] };
  const source = { id: 9, name: 'Kate', modelId: 11, scale: 1, status: 'active' };
  const marker = { markerId: 'kate', markerType: 'characters', name: 'Kate', preview: pose };
  const request = async (url, init) => {
    requests.push({ url, init }); assert.equal(init.cache, 'no-store'); assert(!init.method, 'Preview performs GET reads only');
    const value = url.includes('animation-assignments') ? mapping : url.includes('characters?') ? source : savedModel;
    return Response.json({ success: true, data: value });
  };
  const controller = new AbortController();
  const assets = await data.loadSimulationPreviewAssets([marker, { ...marker, markerId: 'joey' }], controller.signal, request);
  assert.equal(requests.filter(r => r.url === '/api/threed/models?id=11').length, 1, 'Shared Model is read once');
  assert.equal(assets[0].character.scale, 1); assert.equal(assets[0].character.rotation, 90); assert.equal(assets[0].character.model.scale, '0.25');
  assert.equal(assets[0].character.movementType, 'stationary'); assert.equal(assets[0].character.interactable, false);
  assert.equal(assets[0].character.model.textureFallbacks[0].filePath, savedModel.textureFallbacks[0].filePath, 'Character preview retains authorized saved filename references');
  const resourceModule = load('src/libraries/services/threed/models/model-load-completion.ts'), resourceManager = new THREE.LoadingManager(), resourceMessages = [];
  const wait = vm.runInNewContext(ts.transpileModule('(' + resourceWait.getText(ast) + ')', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText,
    { modelLoadCompletion: resourceModule.modelLoadCompletion, resourceManager, previewMode: true, previewActions: true, reportResourceIssue: null, onPreviewResourceIssue: (...args) => resourceMessages.push(args) });
  resourceManager.itemStart('missing.png'); resourceManager.itemError('missing.png'); resourceManager.itemEnd('missing.png');
  assert.equal(await wait(), false, 'Missing secondary images preserve geometry without caching incomplete resources');
  assert(resourceMessages.some(([url, message]) => url === 'missing.png' && message === 'Could not load'));
  const strictManager = new THREE.LoadingManager(), strictWait = resourceModule.modelLoadCompletion(strictManager);
  strictManager.itemStart('missing.png'); strictManager.itemError('missing.png'); strictManager.itemEnd('missing.png');
  await assert.rejects(strictWait(), /Required Model resources/, 'Export readiness remains strict');
  const wrong = await data.loadSimulationPreviewAssets([marker], controller.signal, async () => Response.json({ success: true, data: { id: 99 } })); assert(wrong[0].error.includes('unavailable'));
  const hidden = await data.loadSimulationPreviewAssets([{ ...marker, preview: { ...pose, visible: false } }], controller.signal, request); assert(hidden[0].error.includes('hidden'));
  const aborted = new AbortController(); aborted.abort(); await assert.rejects(data.loadSimulationPreviewAssets([marker], aborted.signal, request), /cancelled/);
  const publicModel = await data.loadSimulationPreviewAssets([marker], controller.signal, async url => url.includes('target=model')
    ? Response.json({ success: false, error: 'Model not found' }, { status: 404 })
    : Response.json({ success: true, data: url.includes('animation-assignments') ? { ...mapping, modelId: null, inherited: [{ actionKey: 'run', mode: 'assigned', animationId: 999 }] } : url.includes('characters?') ? source : savedModel }));
  assert(!publicModel[0].error, 'Accessible public Models do not require private Model assignments');
  assert.equal(publicModel[0].mapping.inherited.length, 0, 'Wrong/default Model inheritance is cleared');

  // Camera controls operate on the retained camera/target, without asset reloads.
  const cameraRt = runtime(), camera = new THREE.PerspectiveCamera(45, 1, .1, 1000), target = new THREE.Vector3(), center = new THREE.Vector3(-12, 2, 8);
  let fits = 0, invalidations = 0, frame = null;
  const bounds = { refresh() { return this; }, clip() { return this; }, fit() { fits++; return this; }, getSize() { return { center, distance: 20 }; } };
  const cameraReact = { ...cameraRt.react, useRef(value) { const ref = cameraRt.react.useRef(value); if (value === null) ref.current ??= { target, update() {} }; return ref; } };
  const canvasModule = load(root + 'SimulationPreviewCanvas.tsx', { react: { ...cameraReact, Component: class {} }, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@react-three/fiber': { useThree: () => ({ camera, invalidate: () => invalidations++ }) },
    '@react-three/drei': { useBounds: () => bounds, OrbitControls: 'OrbitControls' }, '@/components/threed/shared/GardenCharacter': proxy, '@/components/threed/markers/ModelMarker3D': proxy,
    '../models/model-preview-events': proxy }, { requestAnimationFrame: fn => { frame = fn; return 1; }, cancelAnimationFrame: () => { frame = null; } });
  const cameraTools = { current: null }; cameraRt.mount(() => canvasModule.SimulationPreviewCamera({ tools: cameraTools, framingKey: 'initial' })); frame();
  assert(camera.position.distanceTo(center.clone().addScaledVector(new THREE.Vector3(4, 2, 6).normalize(), 20)) < 1e-9);
  camera.position.set(100, 50, 40); cameraTools.current.fit(); assert.equal(fits, 1);
  cameraTools.current.reset(); assert(target.distanceTo(center) < 1e-9); assert.equal(invalidations, 3);
  cameraRt.unmount(); assert.equal(cameraTools.current, null);

  const rt = runtime(), deferred = [];
  const deps = { react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/dynamic': { default: () => 'PreviewCanvas' }, 'next/link': { default: 'Link' }, 'lucide-react': proxy,
    '@/components/ui/button': proxy, '../models/ModelFieldHelp': proxy, './simulation-preview-timeline': timelineModule,
    './simulation-preview-data': { loadSimulationPreviewAssets: (_markers, signal) => new Promise(resolve => deferred.push({ signal, resolve })) } };
  const component = load(root + 'SimulationPreview.tsx', deps);
  let props = { definition: { version: 1, steps, observations: [] }, choices: { markers: [marker, { markerId: 'ball', markerType: 'models', name: 'Ball', preview: { ...pose, sourceAssetId: 11 } }], groups: [] }, context: '15:1', loading: false, error: '', busy: false };
  rt.mount(() => component.SimulationPreview(props));
  const old = deferred.at(-1); props = { ...props, context: '16:2' }; rt.render(); assert(old.signal.aborted, 'Context change cancels old data');
  old.resolve(assets); await rt.flush(); assert.equal(nodes(rt.value).find(n => n.type === 'PreviewCanvas').props.assets.length, 0, 'Stale response ignored');
  deferred.at(-1).resolve([assets[0], { marker: props.choices.markers[1], model: savedModel }]); await rt.flush();
  const canvas = () => nodes(rt.value).find(n => n.type === 'PreviewCanvas');
  canvas().props.onClips('kate', clips); canvas().props.onState('kate', null); canvas().props.onState('ball', null); rt.render();
  const play = () => nodes(rt.value).find(n => n.type === 'Button' && nodes(n.props.children).some(child => child.type === 'Play'));
  assert.equal(play().props.disabled, false); play().props.onClick(); rt.render();
  assert.equal(canvas().props.request.action, 'run'); const requestId = canvas().props.request.id;
  canvas().props.onFinished('stale'); rt.render(); assert.equal(canvas().props.request.id, requestId);
  canvas().props.onFinished(requestId); rt.render(); assert.equal(canvas().props.request.action, 'custom_kick');
  const stop = nodes(rt.value).find(n => n.props?.['aria-label'] === 'Stop preview'); stop.props.onClick(); rt.render(); assert.equal(canvas().props.request, null);
  play().props.onClick(); rt.render(); props = { ...props, definition: { ...props.definition, steps: [...steps].reverse() } }; rt.render(); assert.equal(canvas().props.request, null, 'Draft changes stop preview');
  props = { ...props, busy: true }; rt.render(); assert(play().props.disabled); rt.unmount();
  console.log('PASS: Admin preview private transforms/exact reads, shared resources, stale cancellation, Action mapping, one-shot mixer completion, sequential timeline/Stop/timeout/draft guards; no world or Results writes (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
