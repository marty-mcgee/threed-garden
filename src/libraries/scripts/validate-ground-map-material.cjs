// Actual Ground Map component with mocked loading/hooks and installed Three/Fiber.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const THREE = require('three');
const { applyProps } = require('@react-three/fiber');
const file = 'src/components/map/ThreeDScene.tsx';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'GroundMapImagePlane');
assert(declaration);
let state = null;
let load;
let effects;
const gl = { capabilities: { getMaxAnisotropy: () => 16 } };
const context = {
  React,
  THREE: {
    ...THREE,
    TextureLoader: class { load(path, success, progress, failure) { load = { path, success, failure }; } },
  },
  useState: () => [state, value => { state = value; }],
  useEffect: fn => effects.push(fn),
  useThree: () => ({ gl }),
  useSceneResourceIssueReporter: () => undefined,
  useSceneResourceStatus: () => {},
  setTimeout: () => 1,
  clearTimeout: () => {},
};
vm.createContext(context);
vm.runInContext(ts.transpileModule(declaration.getText(source), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.React,
  },
}).outputText, context);
const asset = { filePath: '/offline-map.png' };
const transform = { width: 500, length: 300, opacity: 0.9 };
function render() {
  effects = [];
  return context.GroundMapImagePlane({ asset, transform });
}
function material(tree) {
  return React.Children.toArray(tree.props.children).find(child => child.type === 'meshStandardMaterial');
}
const pending = render();
const pendingMaterial = material(pending);
const cleanup = effects[0]();
const texture = new THREE.Texture();
let disposals = 0;
texture.addEventListener('dispose', () => disposals++);
load.success(texture);
const loaded = render();
effects[1]();
const loadedMaterial = material(loaded);
assert.equal(loaded.type, pending.type, 'Ground mesh owner stays stable');
assert.equal(loaded.key, pending.key, 'Ground mesh is not remounted');
assert.equal(loadedMaterial.props.map, texture);
assert.equal(loadedMaterial.props.opacity, 0.9);
assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
assert.equal(texture.anisotropy, 8);

// Reproduce why an unkeyed fallback -> map prop update is insufficient:
// Fiber sets the map, but does not advance the compiled material's version.
const reused = new THREE.MeshStandardMaterial();
applyProps(reused, pendingMaterial.props);
const compiledVersion = reused.version;
applyProps(reused, loadedMaterial.props);
assert.equal(reused.version, compiledVersion);
assert.notEqual(loadedMaterial.key, pendingMaterial.key,
  'Loaded image must get a fresh material instead of retaining the fallback shader');

load.failure();
assert.equal(material(render()).key, pendingMaterial.key, 'Failure restores the plain fallback material');
cleanup();
assert.equal(disposals, 1, 'Owned texture is disposed on cleanup');
const late = new THREE.Texture();
let lateDisposals = 0;
late.addEventListener('dispose', () => lateDisposals++);
load.success(late);
assert.equal(lateDisposals, 1, 'Cancelled late texture is disposed');
console.log('PASS Ground Map: fallback/image material identity, stable mesh, opacity/color-space and texture cleanup (mock loading; installed Three/Fiber).');
