// Capture lifecycle/queue checks with real Three objects and a mocked renderer; no network or GPU.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const frames = new Map();
let frameId = 0;
let encodedPixels;
const canvas = {
  getContext: () => ({
    createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: image => { encodedPixels = image.data; },
  }),
  toDataURL: () => 'data:image/png;base64,aGVsbG8=',
};
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText, {
    exports,
    Uint8Array,
    document: { createElement: () => canvas },
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    require: name => name in dependencies ? dependencies[name] : require(name),
  });
  return exports;
}
const local = load('src/libraries/services/threed/models/model-local-bounds.ts');
const capture = load('src/libraries/services/threed/models/model-plan-capture.ts', { './model-local-bounds': local });
const body = new THREE.Group();
body.position.set(100, 10, -30);
body.rotation.y = .6;
const root = new THREE.Group();
root.scale.setScalar(2);
const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3), new THREE.MeshStandardMaterial());
root.add(mesh);
body.add(root);
body.updateMatrixWorld(true);
const sourceMatrix = root.matrixWorld.toArray();
let geometryDisposed = false;
mesh.geometry.addEventListener('dispose', () => { geometryDisposed = true; });
const initial = {
  target: {},
  viewport: new THREE.Vector4(2, 3, 640, 480),
  scissor: new THREE.Vector4(4, 5, 300, 200),
  scissorTest: true,
  color: new THREE.Color('#123456'),
  alpha: .5,
};
const state = { ...initial };
let disposed = 0;
let rendered = 0;
let fail = false;
const renderer = {
  outputColorSpace: THREE.SRGBColorSpace,
  autoClear: false,
  xr: { enabled: true },
  shadowMap: { autoUpdate: true, enabled: true },
  getContext: () => ({ isContextLost: () => false }),
  getRenderTarget: () => state.target,
  getActiveCubeFace: () => 2,
  getActiveMipmapLevel: () => 1,
  getViewport: output => output.copy(state.viewport),
  getScissor: output => output.copy(state.scissor),
  getScissorTest: () => state.scissorTest,
  getClearColor: output => output.copy(state.color),
  getClearAlpha: () => state.alpha,
  setRenderTarget(target, face, mip) {
    state.target = target;
    if (target?.isWebGLRenderTarget) target.addEventListener('dispose', () => { disposed++; });
    else { assert.equal(face, 2); assert.equal(mip, 1); }
  },
  setViewport: (...values) => { state.viewport = values.length === 1 ? values[0].clone() : new THREE.Vector4(...values); },
  setScissor: value => { state.scissor = value.clone(); },
  setScissorTest: value => { state.scissorTest = value; },
  setClearColor(color, alpha) { state.color = new THREE.Color(color); state.alpha = alpha; },
  render(scene, camera) {
    rendered++;
    scene.updateMatrixWorld(true);
    const clone = scene.children.find(object => object.type === 'Group');
    assert.notEqual(clone, root);
    assert.equal(clone.children[0].geometry, mesh.geometry, 'Capture reuses loaded geometry');
    assert.equal(clone.children[0].material, mesh.material, 'Capture reuses loaded materials');
    assert.equal(camera.up.z, -1);
  },
  readRenderTargetPixels(target, x, y, width, height, pixels) {
    if (fail) throw Error('Mock readback failure');
    pixels[0] = 1;
    pixels[(height - 1) * width * 4] = 2;
  },
};
function restored() {
  assert.equal(state.target, initial.target);
  assert.deepEqual(state.viewport.toArray(), initial.viewport.toArray());
  assert.deepEqual(state.scissor.toArray(), initial.scissor.toArray());
  assert.equal(state.scissorTest, true);
  assert.equal(state.color.getHex(), initial.color.getHex());
  assert.equal(state.alpha, .5);
  assert.equal(renderer.autoClear, false);
  assert.equal(renderer.xr.enabled, true);
  assert.equal(renderer.shadowMap.autoUpdate, true);
  assert.equal(renderer.shadowMap.enabled, true);
  assert.equal(root.parent, body);
  assert.deepEqual(root.matrixWorld.toArray(), sourceMatrix);
  assert.equal(geometryDisposed, false);
}
const image = capture.captureModelPlanImage(renderer, root, body);
assert(Math.abs(image.bounds.halfExtents[0] - 2) < 1e-8);
assert(Math.abs(image.bounds.halfExtents[2] - 3) < 1e-8);
assert.equal(encodedPixels[0], 2, 'GPU rows must flip to negative-Z-up image rows');
assert.equal(disposed, 1);
restored();
fail = true;
assert.throws(() => capture.captureModelPlanImage(renderer, root, body));
assert.equal(disposed, 2);
restored();
fail = false;
const replies = [];
capture.queueModelPlanCapture(renderer, root, body, value => replies.push(value));
const cancel = capture.queueModelPlanCapture(renderer, root, body, () => assert.fail('Cancelled capture published'));
assert.equal(frames.size, 1);
function tick() {
  const [id, callback] = frames.entries().next().value;
  frames.delete(id);
  callback();
}
const before = rendered;
tick();
assert.equal(rendered, before + 1, 'Only one Model may capture in a frame');
assert.equal(replies.length, 1);
cancel();
assert.equal(frames.size, 0);
capture.queueModelPlanCapture(renderer, root, body, value => replies.push(value));
body.remove(root);
tick();
assert.equal(replies.at(-1), null, 'A detached Model cannot publish a stale image');
assert.equal(rendered, before + 1);
mesh.geometry.dispose();
mesh.material.dispose();
console.log('PASS: local capture bounds/orientation, shared resources, complete renderer restoration after success/failure, bounded queue, cancellation and detached-owner rejection. Renderer/DOM are mocked.');
