// Actual Layer synchronization effects, with the installed Rapier body's default state.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), vm = require('node:vm');
const R = require(require.resolve('@dimforge/rapier3d-compat', { paths: [path.dirname(require.resolve('@react-three/rapier'))] }));
function effect(file, ref) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let fn, initial;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === ref) initial = node.initializer.arguments[0].getText(source);
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.arguments[0].getText(source).includes(ref)) fn = node.arguments[0].getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source); assert(fn); assert.equal(initial, 'true', 'Initial synchronization must reflect default body state, not hidden Layer state');
  return fn;
}
(async () => {
  const fixed = effect('src/components/map/ThreeDScene.tsx', 'previousSceneEnabledRef');
  const character = effect('src/components/threed/shared/EcctrlCharacter.tsx', 'previousLayerEnabledRef');
  await R.init();
  for (const dynamic of [false, true]) {
    const world = new R.World({ x: 0, y: 0, z: 0 });
    const body = world.createRigidBody(dynamic ? R.RigidBodyDesc.dynamic() : R.RigidBodyDesc.fixed());
    const collider = world.createCollider(R.ColliderDesc.cuboid(1, 1, 1), body);
    const context = { sceneEnabled: false, layerEnabled: false, previousSceneEnabledRef: { current: true }, previousLayerEnabledRef: { current: true }, rigidBodyRef: { current: body }, ecctrlRef: { current: { body, collider } } };
    vm.createContext(context); vm.runInContext('var sync = ' + (dynamic ? character : fixed), context);
    assert(body.isEnabled()); context.sync(); assert.equal(body.isEnabled(), false, 'Initially hidden Layer disables the body');
    world.step(); assert.equal(world.castRay(new R.Ray({ x: -3, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), 6, true), null);
    context.sceneEnabled = context.layerEnabled = true; context.sync(); assert(body.isEnabled());
    context.sceneEnabled = context.layerEnabled = false; context.sync(); assert.equal(body.isEnabled(), false);
    context.sync(); assert.equal(body.isEnabled(), false);
    world.free();
  }
  console.log('PASS actual Layer effects disable initially hidden fixed/Character bodies and retain toggling.');
})().catch(error => { console.error(error); process.exitCode = 1; });
