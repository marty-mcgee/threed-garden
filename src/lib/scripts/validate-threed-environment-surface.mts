import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { BufferGeometry, Float32BufferAttribute, Group, Mesh } from 'three';
// @ts-ignore Node strip-types requires the explicit source extension.
import { buildEnvironmentSurfaceCollider } from '../services/threed/models/environment-surface-collider.ts';
const require = createRequire(import.meta.url);
const R = require(require.resolve('@dimforge/rapier3d-compat', { paths: [path.dirname(require.resolve('@react-three/rapier'))] }));
await R.init();
// One merged mesh: raised floor and vertical wall, with empty playable space.
const geometry = new BufferGeometry();
geometry.setAttribute('position', new Float32BufferAttribute([
  -5,1,-5, 5,1,5, 5,1,-5, -5,1,-5, -5,1,5, 5,1,5,
  5,1,-5, 5,4,-5, 5,4,5, 5,1,-5, 5,4,5, 5,1,5,
], 3));
const body = new Group();
const mesh = new Mesh(geometry);
body.add(mesh);
const surface = buildEnvironmentSurfaceCollider(mesh, body);
assert(surface);
assert.equal(surface.indices.length, 12);
body.position.set(10,3,2);
body.rotation.y = 0.7;
const transformed = buildEnvironmentSurfaceCollider(mesh, body);
assert(transformed);
for (let i=0;i<surface.vertices.length;i++) assert(Math.abs(surface.vertices[i]-transformed.vertices[i]) < 1e-5);
const world = new R.World({x:0,y:-9.81,z:0});
world.createCollider(R.ColliderDesc.trimesh(surface.vertices, surface.indices));
const ball = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,3,0).setCcdEnabled(true));
world.createCollider(R.ColliderDesc.ball(0.25),ball);
for(let i=0;i<240;i++) world.step();
assert(Math.abs(ball.translation().y-1.25)<0.025, `Ball should rest on raised floor: ${ball.translation().y}`);
assert(Math.abs(ball.translation().x)<0.01, 'No enclosing box should eject ball sideways');
world.free();
geometry.setIndex([0,1,999]);
assert.equal(buildEnvironmentSurfaceCollider(mesh,body),null);
geometry.setIndex(null);
geometry.getAttribute('position').setX(0,NaN);
assert.equal(buildEnvironmentSurfaceCollider(mesh,body),null);
geometry.dispose();
console.log('PASS: merged floor/wall triangle surface supports resting ball; transforms and invalid geometry guarded');
