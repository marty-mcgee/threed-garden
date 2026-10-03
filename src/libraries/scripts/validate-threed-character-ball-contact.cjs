// Actual Scene metadata + installed Ecctrl filter + installed Rapier queries.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const ts = require('typescript'), vm = require('node:vm');
const R = require(require.resolve('@dimforge/rapier3d-compat', { paths: [path.dirname(require.resolve('@react-three/rapier'))] }));
const compile = code => ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const scene = ts.createSourceFile('scene.tsx', fs.readFileSync('src/components/map/ThreeDScene.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let metadataExpression;
function findMetadata(node) {
  if (ts.isJsxAttribute(node) && node.name.getText(scene) === 'userData' && node.initializer?.expression?.getText(scene).includes('isMovableBall')) metadataExpression = node.initializer.expression.getText(scene);
  ts.forEachChild(node, findMetadata);
}
findMetadata(scene); assert(metadataExpression, 'Actual Model body metadata must exist');
function metadata(ball) {
  const context = { markerIdentity: { moduleType: 'models', assetId: 16 }, instanceMarkerId: 1601, isMovableBall: ball };
  vm.createContext(context); vm.runInContext(compile(`var result = ${metadataExpression};`), context);
  return JSON.parse(JSON.stringify(context.result));
}
const dist = path.join(path.dirname(require.resolve('ecctrl')), '');
const controllerFile = fs.readdirSync(dist).find(file => file.endsWith('.js') && fs.readFileSync(path.join(dist, file), 'utf8').includes('const ecctrlRayFilter ='));
assert(controllerFile, 'Installed Ecctrl ground filter must exist');
const controller = ts.createSourceFile('controller.js', fs.readFileSync(path.join(dist, controllerFile), 'utf8'), ts.ScriptTarget.Latest, true);
let filterExpression;
function findFilter(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(controller) === 'ecctrlRayFilter') filterExpression = node.initializer.arguments[0].getText(controller);
  ts.forEachChild(node, findFilter);
}
findFilter(controller); assert(filterExpression);
const context = {}; vm.createContext(context); vm.runInContext(`var filter = ${filterExpression};`, context);
const filter = context.filter;
(async () => {
  await R.init();
  for (const radius of [0.2, 0.35, 0.5]) {
    const world = new R.World({ x: 0, y: -9.81, z: 0 });
    try {
      const floor = world.createRigidBody(R.RigidBodyDesc.fixed());
      floor.userData = metadata(false);
      const floorCollider = world.createCollider(R.ColliderDesc.cuboid(10, 0.1, 10).setTranslation(0, -0.1, 0), floor);
      const ball = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0.05, radius, 0));
      const ballCollider = world.createCollider(R.ColliderDesc.ball(radius).setMass(1), ball);
      const character = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 2, 0));
      world.createCollider(R.ColliderDesc.capsule(0.6, 0.3), character);
      const probe = { x: 0, y: 1.4, z: 0 }, down = { x: 0, y: -1, z: 0 };
      const ray = new R.Ray(probe, down);
      function hits() {
        return [world.castRayAndGetNormal(ray, 2, false, R.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, character, filter),
          world.castShape(probe, character.rotation(), down, new R.Ball(0.15), 0, 2, false, R.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, character, filter)];
      }
      // Control case proves this geometry can select the ball as support.
      ball.userData = { threeDPhysics: metadata(true).threeDPhysics };
      world.step();
      assert(hits().every(hit => hit?.collider.handle === ballCollider.handle), 'Unexcluded ball can become support');
      ball.userData = metadata(true);
      assert(hits().every(hit => hit?.collider.handle === floorCollider.handle), 'Actual Scene policy must keep Character support on the field');
      assert.equal(ball.userData.ecctrl?.excludeCharacterRay, true);
      assert.equal(ball.userData.ecctrl?.excludeRay, undefined, 'Do not exclude vehicle or generic rays');
      assert.equal(filter(floorCollider), true, 'Fixed Models remain walkable');
      assert.deepEqual(ball.userData.threeDPhysics, { identity: { moduleType: 'models', assetId: 16 }, projectMarkerId: 1601, isMovableBall: true });
      // Physical contacts remain active: a capsule touching the ball must still
      // produce a Rapier contact even though Character support probes ignore it.
      character.setTranslation({ x: -(radius + 0.25), y: 0.95, z: 0 }, true);
      character.setLinvel({ x: 2, y: 0, z: 0 }, true);
      for (let step = 0; step < 15; step++) world.step();
      assert(ball.translation().x > 0.08, 'Capsule contact must still push the physical ball');
      assert(ball.isEnabled() && !ballCollider.isSensor(), 'Ball remains an ordinary physical body');
    } finally { world.free(); }
  }
  console.log('PASS: actual Scene metadata and installed Ecctrl/Rapier ray/shape probes skip small/medium/large balls, retain field support and physical capsule pushing, preserve sensor identity and avoid vehicle-ray exclusion');
})().catch(error => { console.error(error); process.exitCode = 1; });
