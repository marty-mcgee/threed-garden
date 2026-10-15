import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { newDesign, planToScreen, screenToPlan } from '../services/threed/design/document';
import { DesignGeometryCache } from '../services/threed/design/geometry';
import { sceneUnitsPerMetre, METRES_PER_FOOT, METRES_PER_INCH } from '../services/threed/scene-units';
import { buildDesignColliders } from '@/components/threed/design/DesignScenePhysics';

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} != ${expected}`);
async function main() {
  await RAPIER.init();
  near(12 * METRES_PER_INCH, METRES_PER_FOOT);
  const doc = newDesign();
  doc.nodes = [{ id: 'a', x: 0, z: 0 }, { id: 'b', x: 1, z: 0 }, { id: 'c', x: 1, z: 1 }, { id: 'd', x: 0, z: 1 }];
  // A one-metre-thick square floor is an exact one-metre reference cube.
  doc.floors = [{ id: 'reference', levelId: doc.levels[0].id, vertices: ['a', 'b', 'c', 'd'], thickness: 1, elevation: 1 }];
  for (const view of [{ x: 0, y: 0, scale: 45 }, { x: 173, y: -42, scale: 120 }]) {
    const a = planToScreen(doc.nodes[0], view), b = planToScreen(doc.nodes[2], view);
    near(b.x - a.x, view.scale); near(b.y - a.y, view.scale);
    const point = screenToPlan(b, view); near(point.x, 1); near(point.z, 1);
  }
  for (const unit of [1, 0.3048, 0.01]) {
    const owner = new DesignGeometryCache();
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    try {
      owner.update(doc, null);
      owner.group.scale.setScalar(sceneUnitsPerMetre(unit));
      owner.group.updateMatrixWorld(true);
      const size = new Box3().setFromObject(owner.group, true).getSize(new Vector3());
      for (const dimension of size.toArray()) near(dimension * unit, 1);
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      const meshes = buildDesignColliders(doc, unit);
      assert.equal(meshes.length, 1);
      const collider = world.createCollider(RAPIER.ColliderDesc.trimesh(meshes[0].vertices, meshes[0].indices), body);
      // Ray intersects the cube's top at exactly one physical metre.
      const ray = new RAPIER.Ray({ x: .5 / unit, y: 2 / unit, z: .5 / unit }, { x: 0, y: -1, z: 0 });
      const hit = collider.castRay(ray, 3 / unit, true);
      assert.ok(hit >= 0); near(hit * unit, 1);
    } finally { owner.dispose(); world.free(); }
  }
  console.log('PASS: exact conversions; metre cube plan projection/round-trip, rendered bounds and Rapier surface at metre, foot and centimetre Scene calibrations.');
}
void main();
