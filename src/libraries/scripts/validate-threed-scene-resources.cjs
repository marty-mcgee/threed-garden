// Execute the actual procedural Scene components with commit/replay scheduling
// and installed Three.js textures. No renderer, API, database or storage access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');

const file = 'src/components/map/ThreeDScene.tsx';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['createGrassTexture', 'ProceduralDaylightBackground', 'InteractiveGround'];
const declarations = names.map(name => {
  const node = source.statements.find(value => ts.isFunctionDeclaration(value) && value.name?.text === name);
  assert(node, `Actual Scene component/helper ${name} must exist`);
  return node.getText(source);
});
const records = [];
class ObservedCanvasTexture extends THREE.CanvasTexture {
  constructor(canvas) {
    super(canvas);
    const record = { texture: this, disposals: 0, canvas };
    this.addEventListener('dispose', () => { record.disposals += 1; });
    records.push(record);
  }
}
function canvas() {
  const commands = [];
  const context = {};
  for (const method of ['fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'ellipse', 'fill']) {
    context[method] = (...args) => commands.push([method, ...args]);
  }
  for (const property of ['fillStyle', 'strokeStyle', 'lineWidth']) {
    Object.defineProperty(context, property, { set(value) { commands.push([property, value]); } });
  }
  for (const method of ['createLinearGradient', 'createRadialGradient']) {
    context[method] = (...args) => {
      const gradient = { method, args, stops: [] };
      commands.push(gradient);
      return { addColorStop(...stop) { gradient.stops.push(stop); } };
    };
  }
  return { width: 0, height: 0, commands, getContext(type) { assert.equal(type, '2d'); return context; } };
}
let active;
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function effect(setup, deps, phase) {
  const index = active.cursor++;
  const previous = active.slots[index];
  active.next[index] = { setup, deps, phase, cleanup: previous?.cleanup };
  if (!previous || !sameDeps(previous.deps, deps)) active.changed.push(index);
}
const context = vm.createContext({
  THREE: { ...THREE, CanvasTexture: ObservedCanvasTexture },
  document: { createElement(type) { assert.equal(type, 'canvas'); return canvas(); } },
  React: { createElement(type, props, ...children) { return { type, props: { ...props, children } }; } },
  Plane: 'Plane',
  useThree(selector) { return selector({ scene: active.scene }); },
  useRef(initial) {
    const index = active.cursor++;
    const value = active.slots[index] ?? { current: initial };
    active.next[index] = value;
    return value;
  },
  useMemo(create, deps) {
    const index = active.cursor++;
    const previous = active.slots[index];
    const value = previous && sameDeps(previous.deps, deps) ? previous : { value: create(), deps };
    active.next[index] = value;
    return value.value;
  },
  useEffect: (setup, deps) => effect(setup, deps, 'passive'),
  useLayoutEffect: (setup, deps) => effect(setup, deps, 'layout'),
});
vm.runInContext(ts.transpileModule(declarations.join('\n'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText, context);

function harness(name, scene = new THREE.Scene()) {
  const host = { scene, slots: [], next: [], cursor: 0, changed: [], materials: new Map(), output: null };
  function render(props = {}, commit = true) {
    host.cursor = 0;
    host.next = [];
    host.changed = [];
    active = host;
    const output = context[name](props);
    active = null;
    if (!commit) return output;
    const refs = new Set();
    function attach(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(attach); return; }
      if (node.type === 'meshStandardMaterial') {
        const ref = node.props.ref;
        assert(ref, 'Procedural grass material has an explicit owner');
        refs.add(ref);
        const material = host.materials.get(ref) ?? new THREE.MeshStandardMaterial();
        material.setValues({ color: node.props.color, roughness: node.props.roughness, metalness: node.props.metalness });
        host.materials.set(ref, material);
        ref.current = material;
      }
      attach(node.props?.children);
    }
    attach(output);
    for (const [ref, material] of host.materials) {
      if (!refs.has(ref)) { ref.current = null; material.dispose(); host.materials.delete(ref); }
    }
    // React releases all changed effects before setting up their successors.
    for (const index of host.changed) host.slots[index]?.cleanup?.();
    host.slots = host.next;
    for (const index of host.changed) host.slots[index].cleanup = host.slots[index].setup();
    host.output = output;
    return output;
  }
  function cleanup(phase) {
    for (const slot of host.slots) {
      if (phase && slot?.phase !== phase) continue;
      slot?.cleanup?.();
      if (slot && 'cleanup' in slot) slot.cleanup = undefined;
    }
  }
  return {
    host, render,
    cleanupEffects: cleanup,
    replay() {
      cleanup();
      for (const slot of host.slots) if (slot?.setup) slot.cleanup = slot.setup();
    },
    unmount() {
      cleanup();
      for (const [ref, material] of host.materials) { ref.current = null; material.dispose(); }
      host.materials.clear();
      host.slots = [];
    },
    material() { return [...host.materials.values()][0]; },
  };
}
const record = texture => {
  const value = records.find(item => item.texture === texture);
  assert(value, 'Expected an owned procedural texture');
  return value;
};
const live = texture => assert.equal(record(texture).disposals, 0, 'Active texture must not have been disposed');
const released = texture => assert.equal(record(texture).disposals, 1, 'Owned texture must be disposed exactly once');
const shared = new THREE.Texture();
let sharedDisposals = 0;
shared.addEventListener('dispose', () => { sharedDisposals += 1; });
const sharedObservers = new Set();
const addSharedListener = shared.addEventListener.bind(shared);
const removeSharedListener = shared.removeEventListener.bind(shared);
shared.addEventListener = (type, listener) => {
  if (type === 'dispose') sharedObservers.add(listener);
  return addSharedListener(type, listener);
};
shared.removeEventListener = (type, listener) => {
  if (type === 'dispose') sharedObservers.delete(listener);
  return removeSharedListener(type, listener);
};

// No effect commit means no GPU-resource ownership, including discarded renders.
const abandoned = harness('ProceduralDaylightBackground');
abandoned.render({}, false);
const abandonedGround = harness('InteractiveGround');
abandonedGround.render({ size: 40 }, false);
assert.equal(records.length, 0, 'Abandoned render must not allocate a procedural texture');

const scene = new THREE.Scene();
scene.background = shared;
const daylight = harness('ProceduralDaylightBackground', scene);
daylight.render();
const firstSky = scene.background;
live(firstSky);
assert.equal(firstSky.mapping, THREE.EquirectangularReflectionMapping);
assert.equal(firstSky.colorSpace, THREE.SRGBColorSpace);
assert.equal(firstSky.image.width, 2048);
assert.equal(firstSky.image.height, 1024);
assert.deepEqual(firstSky.image.commands.find(command => command.method === 'createLinearGradient'), {
  method: 'createLinearGradient', args: [0, 0, 0, 1024],
  stops: [[0, '#397bb8'], [0.42, '#78add4'], [0.72, '#c7d9df'], [1, '#ead8b9']],
});
daylight.render();
assert.equal(scene.background, firstSky, 'Unchanged render must preserve the active texture');
daylight.replay();
const replaySky = scene.background;
released(firstSky);
live(replaySky);
assert.notEqual(replaySky, firstSky, 'Effect replay must acquire a fresh texture');
assert.equal(JSON.stringify(replaySky.image.commands), JSON.stringify(firstSky.image.commands), 'Sky drawing stays deterministic across replay');
daylight.unmount();
released(replaySky);
assert.equal(scene.background, shared, 'A usable shared previous background is restored');
assert.equal(sharedDisposals, 0);
assert.equal(sharedObservers.size, 0, 'Background cleanup removes its previous-texture listener');

// Drei updates/restores its environment in layout effects. Exercise its actual
// helper: departing layout cleanup must finish before the successor captures
// the previous background; passive cleanup would run too late.
const environmentFile = path.join(path.dirname(require.resolve('@react-three/drei/package.json')), 'core/Environment.js');
const environmentSource = ts.createSourceFile(environmentFile, fs.readFileSync(environmentFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const setEnvPropsNode = environmentSource.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'setEnvProps');
assert(setEnvPropsNode, 'Installed Drei environment ownership helper must exist');
const setEnvironment = vm.runInNewContext(`(${setEnvPropsNode.getText(environmentSource)})`, {
  resolveScene: value => value,
  applyProps: require('@react-three/fiber').applyProps,
});
const environmentScene = new THREE.Scene();
environmentScene.background = shared;
const presetTexture = new THREE.Texture();
let presetDisposals = 0;
presetTexture.addEventListener('dispose', () => { presetDisposals += 1; });
let releaseEnvironment = setEnvironment(false, undefined, environmentScene, presetTexture);
for (let index = 0; index < 4; index += 1) {
  const owner = harness('ProceduralDaylightBackground', environmentScene);
  owner.render();
  const sky = environmentScene.background;
  owner.cleanupEffects('layout');
  releaseEnvironment();
  releaseEnvironment = setEnvironment(true, undefined, environmentScene, presetTexture);
  owner.cleanupEffects('passive');
  owner.unmount();
  released(sky);
  assert.equal(environmentScene.background, presetTexture, 'Drei preset remains active after outgoing cleanup');
  releaseEnvironment();
  assert.equal(environmentScene.background, shared, 'Drei cleanup must never restore the disposed procedural sky');
  releaseEnvironment = setEnvironment(false, undefined, environmentScene, presetTexture);
}
releaseEnvironment();
assert.equal(presetDisposals, 0, 'The procedural owner must not dispose the Drei environment texture');

// Cleanup must not overwrite/dispose a newer owner, or later restore an old
// procedural background that was disposed while its successor was active.
const older = harness('ProceduralDaylightBackground', scene);
const newer = harness('ProceduralDaylightBackground', scene);
older.render();
const olderSky = scene.background;
newer.render();
const newerSky = scene.background;
older.unmount();
released(olderSky);
assert.equal(scene.background, newerSky);
live(newerSky);
newer.unmount();
released(newerSky);
assert.equal(scene.background, null, 'Do not restore a disposed previous background');

const disposablePrior = new THREE.Texture();
scene.background = disposablePrior;
const priorOwner = harness('ProceduralDaylightBackground', scene);
priorOwner.render();
const priorSky = scene.background;
disposablePrior.dispose();
priorOwner.unmount();
released(priorSky);
assert.equal(scene.background, null, 'An externally disposed predecessor is also never restored');

scene.background = new THREE.Color('#123456');
const previousColor = scene.background;
const colorOwner = harness('ProceduralDaylightBackground', scene);
colorOwner.render();
const colorSky = scene.background;
colorOwner.unmount();
released(colorSky);
assert.equal(scene.background, previousColor, 'Non-texture backgrounds retain their identity');

const successorOwner = harness('ProceduralDaylightBackground', scene);
successorOwner.render();
const supersededSky = scene.background;
scene.background = shared;
successorOwner.unmount();
released(supersededSky);
assert.equal(scene.background, shared, 'Cleanup preserves an externally assigned successor');
assert.equal(sharedDisposals, 0);

const oldScene = new THREE.Scene();
oldScene.background = previousColor;
const changingScene = harness('ProceduralDaylightBackground', oldScene);
changingScene.render();
const oldSceneSky = oldScene.background;
changingScene.host.scene = scene;
changingScene.render();
released(oldSceneSky);
assert.equal(oldScene.background, previousColor);
const changedSceneSky = scene.background;
live(changedSceneSky);
changingScene.unmount();
released(changedSceneSky);
assert.equal(scene.background, shared);

const ground = harness('InteractiveGround');
ground.render({ size: 40, centerX: 3, centerZ: 7 });
const material = ground.material();
const firstGrass = material.map;
live(firstGrass);
assert.equal(firstGrass.image.width, 512);
assert.equal(firstGrass.image.height, 512);
assert.equal(firstGrass.wrapS, THREE.RepeatWrapping);
assert.equal(firstGrass.wrapT, THREE.RepeatWrapping);
assert.equal(firstGrass.colorSpace, THREE.SRGBColorSpace);
assert.equal(firstGrass.anisotropy, 8);
assert.deepEqual(firstGrass.repeat.toArray(), [10, 10]);
assert.deepEqual(firstGrass.image.commands[0], ['fillStyle', '#426b32']);
assert.equal(firstGrass.image.commands.filter(command => command[0] === 'stroke').length, 4200);
assert.equal(material.color.getHexString(), 'ffffff');
assert.equal(material.roughness, 0.85);
assert.equal(material.metalness, 0);
ground.render({ size: 40, centerX: 4, centerZ: 8 });
assert.equal(material.map, firstGrass, 'Position-only changes must retain the texture');
const beforeAbortedUpdate = records.length;
ground.render({ size: 120 }, false);
assert.equal(records.length, beforeAbortedUpdate, 'Abandoned resize must not allocate a replacement');
assert.equal(material.map, firstGrass);
live(firstGrass);
ground.replay();
const replayGrass = material.map;
released(firstGrass);
live(replayGrass);
assert.notEqual(replayGrass, firstGrass);
ground.render({ size: 2 });
released(replayGrass);
const smallGrass = material.map;
live(smallGrass);
assert.deepEqual(smallGrass.repeat.toArray(), [1, 1]);
assert.equal(JSON.stringify(smallGrass.image.commands), JSON.stringify(firstGrass.image.commands), 'Size changes alter repeat, not procedural pixels');

ground.render({ size: 60, showVisualGround: false });
released(smallGrass);
assert.equal(material.map, null, 'Hidden ground detaches its disposed texture');
assert.equal(ground.material(), undefined);
const hiddenCount = records.length;
ground.render({ size: 80, showVisualGround: false });
assert.equal(records.length, hiddenCount, 'Hidden ground needs no texture allocation');
ground.render({ size: 80, showVisualGround: true });
const visibleMaterial = ground.material();
const visibleGrass = visibleMaterial.map;
live(visibleGrass);
assert.deepEqual(visibleGrass.repeat.toArray(), [20, 20]);
ground.unmount();
released(visibleGrass);
assert.equal(visibleMaterial.map, null);

// A material can acquire a shared successor independently; release only the
// texture this effect created, without clearing or disposing that successor.
const successorGround = harness('InteractiveGround');
successorGround.render({ size: 8 });
const successorMaterial = successorGround.material();
const ownedGrass = successorMaterial.map;
successorMaterial.map = shared;
successorGround.unmount();
released(ownedGrass);
assert.equal(successorMaterial.map, shared);
assert.equal(sharedDisposals, 0);

// Rapid updates release every superseded resource while the Scene stays alive.
const rapidGround = harness('InteractiveGround');
for (let index = 0; index < 12; index += 1) {
  const sky = harness('ProceduralDaylightBackground', scene);
  sky.render();
  const texture = scene.background;
  sky.unmount();
  released(texture);
  rapidGround.render({ size: 8 + index });
  live(rapidGround.material().map);
}
rapidGround.unmount();
assert(records.every(value => value.disposals === 1), 'Every acquired resource must have exactly one release');
assert.equal(scene.background, shared);
assert.equal(sharedDisposals, 0, 'Shared backgrounds/maps never belong to the procedural owners');
assert.equal(sharedObservers.size, 0, 'Rapid changes leave no previous-texture listeners');
console.log('PASS: actual Scene procedural resources cover abandoned render, replay, unchanged render, replacement, hidden ground and unmount');
console.log('PASS: predecessor/successor background and map safety, unchanged texture presentation, rapid changes and shared-resource non-disposal');
console.log('PASS: actual installed Drei environment transitions cannot capture and restore a disposed procedural background');
