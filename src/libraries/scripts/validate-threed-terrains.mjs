import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  confirmsTerrainPlacement,
  generateTerrainDefinition,
  parseTerrainDefinition,
  parseTerrainPlacement,
  terrainPlanCells,
  terrainHeightAt,
  terrainSpawnFloorY,
} from '../services/threed/terrains/terrain-core.ts';

const definition = generateTerrainDefinition(17);
assert.equal(definition.heightsM.length, definition.columns * definition.rows);
assert.equal(definition.heightsM[0], 0);
assert.equal(definition.heightsM[definition.columns - 1], 0);
assert.equal(definition.heightsM.at(-1), 0);
assert.deepEqual(generateTerrainDefinition(17), definition);
assert.notDeepEqual(generateTerrainDefinition(18).heightsM, definition.heightsM);

const placement = parseTerrainPlacement({
  id: null,
  threedId: 1,
  terrainId: 2,
  terrainRevision: 1,
  centerXM: 40,
  centerZM: 20,
  rotationYDeg: 90,
  scale: 2,
});
assert.ok(placement);
const savedPlacement = { ...placement, id: 'a4ad70ab-14c5-42b0-b574-97b54e59874b' };
assert.equal(confirmsTerrainPlacement(placement, savedPlacement), true);
assert.equal(confirmsTerrainPlacement(savedPlacement, { ...savedPlacement, centerXM: 41 }), false);
assert.equal(confirmsTerrainPlacement(savedPlacement, { ...savedPlacement, scale: 1 }), false);
assert.equal(confirmsTerrainPlacement(savedPlacement, null), false);
assert.equal(confirmsTerrainPlacement(null, null), true);
assert.equal(confirmsTerrainPlacement(null, savedPlacement), false);
assert.equal(confirmsTerrainPlacement(null, undefined), false);
assert.equal(terrainHeightAt(definition, placement, 40, 20), definition.heightsM[16 * 33 + 16] * 2);
assert.equal(terrainHeightAt(definition, placement, 40, 60), 0);
assert.equal(terrainHeightAt(definition, placement, 40, 61), null);
const secondProjectPlacement = parseTerrainPlacement({
  ...placement,
  centerXM: -35,
  centerZM: 12,
  rotationYDeg: 0,
  scale: 1,
});
assert.ok(secondProjectPlacement);
assert.equal(terrainHeightAt(definition, secondProjectPlacement, -35, 12), definition.heightsM[16 * 33 + 16]);
assert.equal(terrainHeightAt(definition, placement, -35, 12), null);
assert.equal(terrainHeightAt(definition, secondProjectPlacement, -15, 12), 0);
assert.equal(terrainHeightAt(definition, secondProjectPlacement, -15.001, 12) === null, false);
assert.equal(terrainHeightAt(definition, secondProjectPlacement, -14.999, 12), null);
const terrainSurface = { name: 'Shared Terrain', definition, placement };
const raisedFloor = terrainHeightAt(definition, placement, 40, 20);
assert.equal(terrainSpawnFloorY(terrainSurface, 1, { x: 40, y: -5, z: 20 }), raisedFloor);
assert.equal(terrainSpawnFloorY(terrainSurface, 1, { x: 40, y: raisedFloor + 2, z: 20 }), raisedFloor + 2);
assert.equal(terrainSpawnFloorY(terrainSurface, 1, { x: 40, y: 1, z: 61 }), 1);
assert.equal(terrainSpawnFloorY(terrainSurface, 2, { x: 20, y: -5, z: 10 }), raisedFloor / 2);
assert.equal(terrainSpawnFloorY(null, 1, { x: 40, y: 3, z: 20 }), 3);
const cells = terrainPlanCells(definition);
assert.equal(cells.length, 256);
assert.equal(cells[0].x, -definition.widthM / 2);
assert.equal(cells[0].z, -definition.lengthM / 2);
assert.equal(cells.at(-1).x + cells.at(-1).width, definition.widthM / 2);
assert.equal(cells.at(-1).z + cells.at(-1).length, definition.lengthM / 2);
assert.ok(cells.some(cell => cell.height !== 0));

// Execute the actual Scene mesh builder with geometry doubles. The same vertex
// and index buffers are passed to its Rapier collider.
class BufferAttribute {
  constructor(array) { this.array = array; }
}
class BufferGeometry {
  setAttribute(name, attribute) { this.attributes ??= {}; this.attributes[name] = attribute; }
  setIndex(attribute) { this.index = attribute; }
  computeVertexNormals() {}
}
const terrainSceneSource = ts.transpileModule(
  readFileSync(new URL('../../components/map/presentation/ProjectTerrainGround.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } },
).outputText;
const terrainScene = { exports: {} };
runInNewContext(terrainSceneSource, {
  exports: terrainScene.exports,
  require(name) {
    if (name === 'three') return { BufferAttribute, BufferGeometry };
    if (name === 'react' || name === '@react-three/rapier' || name === 'react/jsx-runtime') return {};
    throw new Error(`Unexpected Terrain Scene dependency: ${name}`);
  },
});
const geometry = terrainScene.exports.buildTerrainGeometry({ name: 'Shared Terrain', definition, placement }, 1);
assert.equal(geometry.vertices.length, definition.columns * definition.rows * 3);
assert.equal(geometry.indices.length, (definition.columns - 1) * (definition.rows - 1) * 6);
for (let index = 0; index < definition.heightsM.length; index++) {
  const x = geometry.vertices[index * 3];
  const y = geometry.vertices[index * 3 + 1];
  const z = geometry.vertices[index * 3 + 2];
  assert.ok(Math.abs(y - terrainHeightAt(definition, placement, x, z)) < 0.00002);
  const row = Math.floor(index / definition.columns);
  const column = index % definition.columns;
  if (row === 0 || column === 0 || row === definition.rows - 1 || column === definition.columns - 1) assert.equal(y, 0);
}
assert.equal(geometry.mesh.attributes.position.array, geometry.vertices);
assert.equal(geometry.mesh.index.array, geometry.indices);
assert.throws(() => parseTerrainDefinition({ ...definition, heightsM: [1] }));
assert.throws(() => parseTerrainDefinition({ ...definition, heightsM: [1, ...definition.heightsM.slice(1)] }));
assert.throws(() => parseTerrainPlacement({ ...placement, scale: 0 }));

console.log('ThreeD Terrain definition, independent placement, 2D footprint, mesh heights, border and rejection checks passed.');
