import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  confirmsTerrainPlacement,
  generateTerrainDefinition,
  maxTerrainOperations,
  parseTerrainDefinition,
  parseTerrainPlacement,
  sculptTerrainDefinition,
  shapeTerrainPathDefinition,
  terrainPlanCells,
  terrainHeightAt,
  terrainSpawnFloorY,
  updateTerrainAuthoring,
} from '../services/threed/terrains/terrain-core.ts';

const definition = generateTerrainDefinition(17);
assert.equal(definition.heightsM.length, definition.columns * definition.rows);
assert.equal(definition.heightsM[0], 0);
assert.equal(definition.heightsM[definition.columns - 1], 0);
assert.equal(definition.heightsM.at(-1), 0);
assert.deepEqual(generateTerrainDefinition(17), definition);
assert.notDeepEqual(generateTerrainDefinition(18).heightsM, definition.heightsM);
assert.deepEqual(generateTerrainDefinition(17, 40, 40, 33, 33, { reliefM: 2, hillSize: 1, detail: 0.35 }), definition);
assert.notDeepEqual(generateTerrainDefinition(17, 40, 40, 33, 33, { reliefM: 4, hillSize: 1, detail: 0.35 }).heightsM, definition.heightsM);
assert.notDeepEqual(generateTerrainDefinition(17, 40, 40, 33, 33, { reliefM: 2, hillSize: 2, detail: 0.35 }).heightsM, definition.heightsM);
assert.notDeepEqual(generateTerrainDefinition(17, 40, 40, 33, 33, { reliefM: 2, hillSize: 1, detail: 0 }).heightsM, definition.heightsM);
assert.ok(generateTerrainDefinition(17, 40, 40, 33, 33, { reliefM: 0, hillSize: 1, detail: 0 }).heightsM.every(height => height === 0));
assert.throws(() => generateTerrainDefinition(17, 40, 40, 33, 33, { reliefM: 21, hillSize: 1, detail: 0.35 }));
const centerIndex = Math.floor(definition.rows / 2) * definition.columns + Math.floor(definition.columns / 2);
const raisedDefinition = sculptTerrainDefinition(definition, 0, 0, 4, 1);
assert.equal(raisedDefinition.heightsM[centerIndex], Number((definition.heightsM[centerIndex] + 1).toFixed(4)));
assert.equal(definition.heightsM[centerIndex], generateTerrainDefinition(17).heightsM[centerIndex]);
assert.equal(raisedDefinition.heightsM[0], 0);
assert.equal(raisedDefinition.heightsM.at(-1), 0);
assert.equal(raisedDefinition.heightsM[1 * definition.columns + 1], definition.heightsM[1 * definition.columns + 1]);
const loweredDefinition = sculptTerrainDefinition(raisedDefinition, 0, 0, 4, -1);
assert.equal(loweredDefinition.heightsM[centerIndex], definition.heightsM[centerIndex]);
assert.throws(() => sculptTerrainDefinition(definition, 0, 0, 0, 1));
const flat = parseTerrainDefinition({ ...definition, heightsM: definition.heightsM.map(() => 0) });
const levelPath = shapeTerrainPathDefinition(flat, [{ xM: -8, zM: 0 }, { xM: 8, zM: 0 }], 4, 3, 3, 0.5);
assert.equal(levelPath.heightsM[centerIndex], 3);
assert.equal(levelPath.heightsM[0], 0);
assert.equal(flat.heightsM[centerIndex], 0);
const slopePath = shapeTerrainPathDefinition(flat, [{ xM: -8, zM: 0 }, { xM: 0, zM: 8 }, { xM: 8, zM: 0 }], 3, -2, 2, 0.5);
assert.equal(slopePath.heightsM[16 * 33 + 16], 0);
assert.ok(slopePath.heightsM[16 * 33 + 10] < 0);
assert.ok(slopePath.heightsM[16 * 33 + 22] > 0);
assert.equal(slopePath.heightsM[0], 0);
assert.throws(() => shapeTerrainPathDefinition(flat, [{ xM: 0, zM: 0 }], 3, 0, 2, 0.5));
assert.throws(() => shapeTerrainPathDefinition(flat, [{ xM: -8, zM: 0 }, { xM: 8, zM: 0 }], 3, 0, 2, 2));
const savedDrawing = {
  id: 'a4ad70ab-14c5-42b0-b574-97b54e59874b',
  mode: 'straight',
  points: [{ xM: -8, zM: 0 }, { xM: 8, zM: 0 }],
  radiusM: 4,
  startHeightM: 3,
  endHeightM: 3,
  feather: 0.5,
  hidden: false,
};
const drawnTerrain = updateTerrainAuthoring(flat, [{ type: 'path', drawing: savedDrawing }]);
assert.equal(drawnTerrain.heightsM[centerIndex], 3);
assert.deepEqual(parseTerrainDefinition(JSON.parse(JSON.stringify(drawnTerrain))).appearance.authoring.operations[0].drawing, savedDrawing);
const revisedDrawing = updateTerrainAuthoring(drawnTerrain, [{ type: 'path', drawing: { ...savedDrawing, startHeightM: 5, endHeightM: 5 } }]);
assert.equal(revisedDrawing.heightsM[centerIndex], 5);
const hiddenDrawing = updateTerrainAuthoring(revisedDrawing, [{ type: 'path', drawing: { ...savedDrawing, hidden: true } }]);
assert.equal(hiddenDrawing.heightsM[centerIndex], 3);
assert.equal(hiddenDrawing.appearance.authoring.operations[0].drawing.hidden, true);
const deletedDrawing = updateTerrainAuthoring(hiddenDrawing, []);
assert.deepEqual(deletedDrawing.heightsM, flat.heightsM);
// Saved generation recipes reproduce the base without changing the Seed.
const recipe = definition.appearance.generation;
assert.deepEqual(parseTerrainDefinition(JSON.parse(JSON.stringify(definition))).appearance.generation, recipe);
assert.deepEqual(generateTerrainDefinition(recipe.seed, definition.widthM, definition.lengthM, definition.columns, definition.rows, recipe).heightsM, definition.heightsM);
assert.equal(parseTerrainDefinition({ ...definition, appearance: { color: '#58823f' } }).appearance.generation, undefined);
assert.throws(() => parseTerrainDefinition({ ...definition, appearance: { ...definition.appearance, generation: { ...recipe, detail: 2 } } }));
assert.throws(() => generateTerrainDefinition(1, 40, 40, 1000, 99), /2 to 129/);
const plateauDrawing = {
  ...savedDrawing,
  mode: 'freeform',
  points: [
    { xM: -8, zM: -8 },
    { xM: 8, zM: -8 },
    { xM: 8, zM: 8 },
    { xM: -8, zM: 8 },
  ],
  radiusM: 2,
  fillArea: true,
};
const plateau = updateTerrainAuthoring(flat, [{ type: 'path', drawing: plateauDrawing }]);
assert.equal(plateau.heightsM[centerIndex], 3);
assert.equal(plateau.heightsM[definition.columns + 1], 0);
assert.equal(plateau.heightsM[0], 0);
assert.equal(updateTerrainAuthoring(flat, [{ type: 'path', drawing: { ...plateauDrawing, fillArea: false } }]).heightsM[centerIndex], 0);
assert.deepEqual(parseTerrainDefinition(JSON.parse(JSON.stringify(plateau))), plateau);
assert.deepEqual(updateTerrainAuthoring(plateau, [{ type: 'path', drawing: { ...plateauDrawing, hidden: true } }]).heightsM, plateau.heightsM);
assert.deepEqual(updateTerrainAuthoring(plateau, []).heightsM, flat.heightsM);
for (const invalid of [
  { ...plateauDrawing, mode: 'straight' },
  { ...plateauDrawing, points: plateauDrawing.points.slice(0, 2) },
  { ...plateauDrawing, endHeightM: 4 },
]) {
  assert.throws(() => parseTerrainDefinition({ ...plateau, appearance: { ...plateau.appearance, authoring: { baseHeightsM: flat.heightsM, operations: [{ type: 'path', drawing: invalid }] } } }));
}
const regenerated = updateTerrainAuthoring(generateTerrainDefinition(19), plateau.appearance.authoring.operations);
assert.equal(regenerated.appearance.generation.seed, 19);
assert.deepEqual(regenerated.appearance.authoring.operations, plateau.appearance.authoring.operations);
assert.equal(regenerated.heightsM[centerIndex], 3);
const smallTerrain = generateTerrainDefinition(1, 4, 4, 3, 3);
const brushOperations = Array.from({ length: maxTerrainOperations }, () => ({
  type: 'brush',
  stroke: { xM: 0, zM: 0, radiusM: 1, changeM: 0.01 },
}));
const fullySculpted = updateTerrainAuthoring(smallTerrain, brushOperations);
assert.equal(parseTerrainDefinition(JSON.parse(JSON.stringify(fullySculpted))).appearance.authoring.operations.length, maxTerrainOperations);
assert.throws(() => updateTerrainAuthoring(fullySculpted, [...brushOperations, brushOperations[0]]), /up to 256/);

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
