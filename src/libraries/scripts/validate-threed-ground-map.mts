import assert from 'node:assert/strict';
import {
  DEFAULT_PROJECT_GROUND_MAP_TRANSFORM,
  parseProjectGroundMapTransform,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/ground-maps/project-ground-map-core.ts';
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { parseThreeDProjectViewState } from '../services/threed/markers/project-view-state-core.ts';

let groups = 0;
function group(name: string, test: () => void) { test(); groups += 1; console.log(`✓ ${name}`); }

const aligned = { visualMode: 'image', groundMapId: 12, centerX: 30, centerZ: -40,
  width: 280, length: 150, height: -0.05, rotationY: 18, opacity: 0.8 } as const;

group('Ground Map defaults preserve the procedural legacy ground', () => {
  assert.equal(DEFAULT_PROJECT_GROUND_MAP_TRANSFORM.visualMode, 'procedural');
  assert.equal(DEFAULT_PROJECT_GROUND_MAP_TRANSFORM.groundMapId, null);
});
group('Ground Map image alignment accepts bounded Project-feet transforms', () => {
  assert.deepEqual(parseProjectGroundMapTransform(aligned), aligned);
});
group('Ground Map alignment rejects unknown modes, IDs, ranges and fields', () => {
  for (const value of [
    { ...aligned, visualMode: 'tiles' }, { ...aligned, groundMapId: 0 },
    { ...aligned, width: 0 }, { ...aligned, opacity: 2 }, { ...aligned, extra: true },
  ]) assert.throws(() => parseProjectGroundMapTransform(value), /invalid_ground_map_transform/);
});
group('Project Save and Restore retains exact Ground Map alignment', () => {
  const parsed = parseThreeDProjectViewState({
    version: 1, savedAt: new Date().toISOString(), viewMode: '3d', panelHeight: 50, cameraMode: 'orbit',
    threeD: { cameraPosition: { x: 1, y: 2, z: 3 }, cameraTarget: { x: 0, y: 0, z: 0 },
      activeLayers: [], environment: 'default-daylight', autoRotate: false, showGrid: false,
      showLegend: false, showGizmo: true, groundMap: aligned },
  });
  assert.deepEqual(parsed.threeD?.groundMap, aligned);
});

console.log(`Validated ${groups} ThreeD Ground Map groups.`);
