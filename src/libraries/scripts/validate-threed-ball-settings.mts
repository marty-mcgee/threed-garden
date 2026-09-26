import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
// @ts-ignore Node source extension.
import { resolveBallPhysics } from '../services/threed/models/ball-physics.ts';
const defaults = resolveBallPhysics(null);
assert.equal(resolveBallPhysics({mass: -1, damping: NaN}).mass, defaults.mass);
assert.equal(resolveBallPhysics({mass: 3}).mass, 3);
const require = createRequire(import.meta.url);
const R = require(require.resolve('@dimforge/rapier3d-compat', {paths:[path.dirname(require.resolve('@react-three/rapier'))]}));
await R.init();
function roll(damping: number) {
 const world = new R.World({x:0,y:-9.81,z:0});
 world.createCollider(R.ColliderDesc.cuboid(100,0.1,100).setTranslation(0,-0.1,0));
 const ball = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,0.22,0).setLinvel(3,0,0).setAngvel({x:0,y:0,z:-3/0.22}).setLinearDamping(damping).setAngularDamping(damping));
 world.createCollider(R.ColliderDesc.ball(0.22).setMass(defaults.mass).setFriction(defaults.friction),ball);
 for(let i=0;i<300;i++) world.step();
 const distance = ball.translation().x; world.free(); return distance;
}
assert(roll(defaults.damping) < roll(0.35)*0.6, 'New damping must materially reduce rolling distance');
function smallBallContact(clearance: number) {
 const world = new R.World({x:0,y:-9.81,z:0});
 world.createCollider(R.ColliderDesc.cuboid(20,0.1,20).setTranslation(0,-0.1,0));
 const ball = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,0.13,0));
 world.createCollider(R.ColliderDesc.ball(0.13).setMass(1),ball);
 const actor = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(-2,0.9+clearance,0));
 world.createCollider(R.ColliderDesc.capsule(0.6,0.3),actor);
 for(let i=0;i<120;i++) {
  actor.setNextKinematicTranslation({x:-2+i*0.025,y:0.9+clearance,z:0});
  world.step();
 }
 const distance = ball.translation().x; world.free(); return distance;
}
assert(smallBallContact(0.05)>0.3, 'Lower capsule must push the small ball');
assert(Math.abs(smallBallContact(0.3))<0.01, 'Old suspension misses the small ball');
console.log('PASS: bounded ball settings and shorter rolling distance');
