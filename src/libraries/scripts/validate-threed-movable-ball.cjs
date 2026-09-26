// Headless contact regression using the installed Scene physics engine.
const assert = require('node:assert/strict');
const path = require('node:path');
const R = require(require.resolve('@dimforge/rapier3d-compat', {
  paths: [path.dirname(require.resolve('@react-three/rapier'))],
}));
(async () => {
  await R.init();
  const world = new R.World({ x: 0, y: -9.81, z: 0 });
  const floor = world.createRigidBody(R.RigidBodyDesc.fixed());
  world.createCollider(R.ColliderDesc.cuboid(20, 0.1, 20).setTranslation(0, -0.1, 0), floor);
  const ball = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 0.5, 0)
    .setCcdEnabled(true).setLinearDamping(0.35).setAngularDamping(0.35));
  world.createCollider(R.ColliderDesc.ball(0.5).setMass(0.43).setFriction(0.6).setRestitution(0.35), ball);
  const actor = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(-3, 1, 0));
  world.createCollider(R.ColliderDesc.capsule(0.5, 0.4), actor);
  for (let step = 0; step < 180; step++) {
    actor.setNextKinematicTranslation({ x: Math.min(-3 + step * 0.025, 0.5), y: 1, z: 0 });
    world.step();
  }
  assert(ball.translation().x > 0.75, 'Actor contact should push the ball');
  assert(ball.translation().y > 0.35, 'Ball must stay above the floor');
  assert(Math.abs(ball.rotation().z) > 0.01, 'Ball should rotate from contact');
  ball.setEnabled(false);
  const frozen = ball.translation();
  for (let step = 0; step < 30; step++) world.step();
  assert.deepEqual(ball.translation(), frozen, 'Hidden ball remains at its suspended position');
  ball.setEnabled(true);
  world.step();
  assert(Number.isFinite(ball.translation().x));
  world.free();
  console.log('PASS: Character-shaped contact pushes/rotates ball, floor supports it, and hiding suspends motion');
})().catch(error => { console.error(error); process.exitCode = 1; });
