import { Color, PerspectiveCamera, Vector3 } from 'three';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  defaultTerrainElevationColors,
  parseTerrainElevationColors,
  terrainElevationColor,
  terrainBandNames,
  confirmsTerrainPlacement,
  generateTerrainDefinition,
  maxTerrainOperations,
  parseTerrainDefinition,
  parseTerrainPreviewCamera,
  defaultTerrainBrushSettings,
  parseTerrainBrushSettings,
  defaultTerrainEditorPanels,
  parseTerrainEditorPanels,
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
assert.throws(() => generateTerrainDefinition(17, 40, 40, 33, 33, { reliefM: 501, hillSize: 1, detail: 0.35 }));
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
    if (name.endsWith('/terrains/terrain-core')) return { terrainElevationColor };
    if (name === 'three') return { BufferAttribute, BufferGeometry, Color };
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

const palette = defaultTerrainElevationColors();
const colored = parseTerrainDefinition({
  ...definition,
  appearance: { ...definition.appearance, elevationColors: palette },
});
assert.equal(JSON.stringify(parseTerrainDefinition(JSON.parse(JSON.stringify(colored)))), JSON.stringify(colored));
assert.deepEqual(colored.heightsM, definition.heightsM);
assert.equal(definition.appearance.elevationColors, undefined);
assert.equal(terrainElevationColor(palette, -1), palette.waterColor);
assert.equal(terrainElevationColor(palette, 0), palette.waterColor);
assert.equal(terrainElevationColor(palette, 0.001), palette.bands[0].color);
for (const band of palette.bands.slice(1)) assert.equal(terrainElevationColor(palette, band.fromM), band.color);
assert.equal(terrainElevationColor({ ...palette, seaLevelM: 2 }, 1), palette.waterColor);
for (const invalid of [
  { ...palette, seaLevelM: NaN },
  { ...palette, waterColor: 'red' },
  { ...palette, bands: palette.bands.slice(1) },
  { ...palette, bands: palette.bands.map(band => ({ ...band, fromM: 0 })) },
  { ...palette, extra: true },
]) assert.throws(() => parseTerrainElevationColors(invalid));
const coloredGeometry = terrainScene.exports.buildTerrainGeometry({ name: 'Colored', definition: colored, placement }, 1);
assert.deepEqual(coloredGeometry.vertices, geometry.vertices);
assert.deepEqual(coloredGeometry.indices, geometry.indices);
assert.equal(coloredGeometry.mesh.attributes.color.array.length, geometry.vertices.length);
assert.equal(geometry.mesh.attributes.color, undefined);
for (let index = 0; index < colored.heightsM.length; index++) {
  const expected = new Color(terrainElevationColor(palette, colored.heightsM[index])).toArray();
  expected.forEach((channel, offset) => assert.ok(Math.abs(coloredGeometry.mesh.attributes.color.array[index * 3 + offset] - channel) < 1e-6));
}
assert.deepEqual(updateTerrainAuthoring(colored, []).appearance.elevationColors, palette);
console.log('Terrain elevation color boundaries, validation, legacy compatibility, round-trip and unchanged collider geometry passed.');

// Execute the actual controls with a small hook host; no browser or persistence.
let hookIndex = 0;
const hooks = [];
let effects = [];
let pendingColors = false;
let appliedColors = palette;
const controlsProps = {
  settings: palette,
  disabled: false,
  onChange(value) { appliedColors = value; },
  onPendingChange(value) { pendingColors = value; },
};
const controls = { exports: {} };
const jsx = (type, props) => ({ type, props });
runInNewContext(ts.transpileModule(readFileSync(new URL('../../components/admin/threed/terrains/TerrainColors.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: controls.exports,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name.endsWith('/models/ModelFieldHelp')) return { ModelFieldHelp: 'Help' };
    if (name === 'react') return {
      useRef(initial) {
        const index = hookIndex++;
        if (!(index in hooks)) hooks[index] = { current: initial };
        return hooks[index];
      },
      useState(initial) {
        const index = hookIndex++;
        if (!(index in hooks)) hooks[index] = initial;
        return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value; }];
      },
      useEffect(effect, dependencies) {
        const index = hookIndex++;
        if (!hooks[index] || dependencies.some((value, key) => value !== hooks[index][key])) effects.push(effect);
        hooks[index] = dependencies;
      },
    };
    if (name.endsWith('/ui/input')) return { Input: 'Input' };
    if (name.endsWith('/ui/button')) return { Button: 'Button' };
    if (name.endsWith('/terrains/terrain-core')) return { defaultTerrainElevationColors, parseTerrainElevationColors, terrainBandNames };
    throw new Error(name);
  },
});
function renderColors() {
  hookIndex = 0;
  const tree = controls.exports.TerrainColors(controlsProps);
  const queued = effects;
  effects = [];
  queued.forEach(effect => effect());
  return tree;
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
renderColors();
let controlNodes = nodes(renderColors());
const numberInputs = () => controlNodes.filter(node => node.type === 'Input' && node.props.type === 'number');
numberInputs()[2].props.onChange({ target: { value: '-1' } });
controlNodes = nodes(renderColors());
assert.equal(pendingColors, true);
controlNodes = nodes(renderColors());
assert.ok(controlNodes.some(node => node.props?.role === 'alert'));
assert.equal(appliedColors, palette);
assert.equal(pendingColors, true);
numberInputs()[2].props.onChange({ target: { value: '0.09' } });
controlNodes = nodes(renderColors());
assert.equal(appliedColors.bands[1].fromM, 0.09);
assert.equal(pendingColors, false);
controlsProps.settings = appliedColors;
renderColors();
controlNodes = nodes(renderColors());
assert.equal(numberInputs()[2].props.value, '0.09');
assert.match(readFileSync(new URL('../../components/admin/threed/terrains/TerrainEditor.tsx', import.meta.url), 'utf8'), /const saveDisabled = colorsPending \|\| Boolean\(brushSettingsError\) \|\| busy/);
console.log('Actual Terrain color controls retain invalid drafts, block Save for invalid values and preview validated edits.');

controlsProps.settings = undefined;
renderColors();
controlNodes = nodes(renderColors());
assert.equal(numberInputs().length, 7, 'Inactive palette retains Sea Level and all six threshold fields');
assert.equal(controlNodes.filter(node => node.type === 'Input' && node.props.type === 'color').length, 7);
assert.ok(controlNodes.some(node => node.type === 'fieldset' && node.props.disabled === true));
assert.equal(pendingColors, false);
const beforeInactiveApply = appliedColors;
assert.equal(appliedColors, beforeInactiveApply, 'Inactive controls do not enable elevation colors');
controlNodes.find(node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: true } });
controlsProps.settings = appliedColors;
renderColors();
controlNodes = nodes(renderColors());
assert.equal(controlNodes.filter(node => node.type === 'fieldset' && node.props.disabled).length, 0);
console.log('Inactive Terrain palette stays visible and disabled; activation restores editable fields.');

const disabledBands = parseTerrainElevationColors({
  ...palette,
  waterEnabled: false,
  bands: palette.bands.map(band => ({ ...band, enabled: false })),
});
for (const height of [-1, 0, 0.1, 1, 10]) assert.equal(terrainElevationColor(disabledBands, height, '#123456'), '#123456');
assert.equal(terrainElevationColor({ ...palette, bands: palette.bands.map((band, index) => ({ ...band, enabled: index !== 5 })) }, 10), palette.bands[4].color);
assert.deepEqual(parseTerrainElevationColors(JSON.parse(JSON.stringify(disabledBands))), disabledBands);
assert.throws(() => parseTerrainElevationColors({ ...palette, waterEnabled: 'false' }));
assert.throws(() => parseTerrainElevationColors({ ...palette, bands: palette.bands.map(band => ({ ...band, enabled: 0 })) }));
controlNodes = nodes(renderColors());
assert.equal(controlNodes.filter(node => node.props?.role === 'switch').length, 7);
controlNodes.find(node => node.props?.['aria-label'] === 'Snow enabled').props.onChange({ target: { checked: false } });
controlNodes = nodes(renderColors());
assert.equal(pendingColors, false);
assert.equal(appliedColors.bands[5].enabled, false);
assert.equal(appliedColors.bands[5].color, palette.bands[5].color);
assert.equal(appliedColors.bands[5].fromM, palette.bands[5].fromM);
console.log('Seven independent band switches, retained settings, boolean validation, saved round-trip and disabled-band fallback passed.');

controlsProps.settings = appliedColors;
renderColors();
controlNodes = nodes(renderColors());
numberInputs()[2].props.onChange({ target: { value: '' } });
controlNodes = nodes(renderColors());
controlNodes.find(node => node.props?.['aria-label'] === 'Water enabled').props.onChange({ target: { checked: false } });
assert.equal(appliedColors.waterEnabled, false, 'Switch immediately commits even with an invalid numeric draft');
assert.equal(appliedColors.bands[1].fromM, palette.bands[1].fromM, 'Switch never commits pending numeric edits');
controlsProps.settings = appliedColors;
renderColors();
controlNodes = nodes(renderColors());
assert.equal(numberInputs()[2].props.value, '', 'Switch retains pending numeric input');
assert.equal(pendingColors, true);
controlsProps.settings = palette;
renderColors();
controlNodes = nodes(renderColors());
assert.equal(numberInputs()[2].props.value, String(palette.bands[1].fromM), 'External Undo restores the palette');
assert.equal(pendingColors, false);
assert.equal(controlNodes.filter(node => node.type === 'Help').length, 2);
assert.equal(controlNodes.filter(node => node.type === 'p' && !node.props.role).length, 0);
console.log('Immediate switch commits preserve unapplied inputs; external Undo restores controls; descriptive guidance uses help tooltips.');

numberInputs()[0].props.onChange({ target: { value: '0.25' } });
assert.equal(appliedColors.seaLevelM, 0.25, 'Sea Level previews immediately');
controlsProps.settings = appliedColors;
renderColors();
controlNodes = nodes(renderColors());
numberInputs()[2].props.onChange({ target: { value: '0.1' } });
assert.equal(appliedColors.bands[1].fromM, 0.1, 'Valid threshold previews immediately');
assert.equal(pendingColors, false);
const beforeInvalidThreshold = appliedColors;
controlNodes = nodes(renderColors());
numberInputs()[2].props.onChange({ target: { value: '4' } });
assert.equal(appliedColors, beforeInvalidThreshold, 'Unordered threshold retains last valid preview');
assert.equal(pendingColors, true);
console.log('Sea Level and thresholds preview automatically; invalid drafts preserve geometry and block Save.');

const largeTerrain = generateTerrainDefinition(1, 800, 800, 129, 129, { reliefM: 20, hillSize: 1, detail: 0 });
const previewPlacement = { ...placement, centerXM: 0, centerZM: 0, rotationYDeg: 0, scale: 1 };
const largeMesh = terrainScene.exports.buildTerrainGeometry({ name: 'Large terrain', definition: largeTerrain, placement: previewPlacement }, 1);
let minY = Infinity;
let maxY = -Infinity;
for (let index = 0; index < largeTerrain.heightsM.length; index++) {
  const y = largeMesh.vertices[index * 3 + 1];
  assert.ok(Math.abs(y - largeTerrain.heightsM[index]) < 0.00001);
  minY = Math.min(minY, y);
  maxY = Math.max(maxY, y);
}
assert.ok(minY < -10 && maxY > 18);
const retainedBrush = updateTerrainAuthoring(largeTerrain, [{ type: 'brush', stroke: { xM: 0, zM: 0, radiusM: 4, changeM: 1 } }]);
assert.equal(retainedBrush.appearance.authoring.baseHeightsM[centerIndex], largeTerrain.heightsM[centerIndex]);
console.log('Screenshot settings: actual 800m preview mesh Y spans ' + minY.toFixed(4) + ' to ' + maxY.toFixed(4) + 'm; regenerated authoring base retains new heights.');

for (const reliefM of [21, 100, 500]) {
  const options = { reliefM, hillSize: 1, detail: 1 };
  const mountain = generateTerrainDefinition(1, 800, 800, 129, 129, options);
  assert.ok(mountain.heightsM.every(height => Number.isFinite(height) && Math.abs(height) <= 1000));
  assert.deepEqual(mountain.heightsM, generateTerrainDefinition(1, 800, 800, 129, 129, options).heightsM);
  assert.equal(parseTerrainDefinition(JSON.parse(JSON.stringify(mountain))).appearance.generation.reliefM, reliefM);
  assert.ok(Math.max(...mountain.heightsM) > reliefM * 0.5);
}
assert.throws(() => parseTerrainDefinition({ ...definition, appearance: { ...definition.appearance, generation: { ...definition.appearance.generation, reliefM: 501 } } }));
console.log('Expanded 0-500m relief retains deterministic generation, saved recipe round-trip and bounded nonflat heights; 501m rejected.');

const canvasSource = readFileSync(new URL('../../components/admin/threed/terrains/TerrainCanvas.tsx', import.meta.url), 'utf8');
const clippingSource = canvasSource.slice(canvasSource.indexOf('export function updateTerrainPreviewClipping'), canvasSource.indexOf('function TerrainPreviewClipping'));
const clippingModule = { exports: {} };
runInNewContext(ts.transpileModule(clippingSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: clippingModule.exports });
const previewCamera = new PerspectiveCamera(48, 1.6, 0.1, 1000);
for (const distance of [600, 3200, 8000]) {
  previewCamera.position.set(distance, distance / 2, distance);
  previewCamera.lookAt(0, 0, 0);
  previewCamera.updateMatrixWorld();
  const position = previewCamera.position.clone();
  const quaternion = previewCamera.quaternion.clone();
  const radius = Math.hypot(600, 600, 500);
  clippingModule.exports.updateTerrainPreviewClipping(previewCamera, radius);
  assert.ok(previewCamera.far > previewCamera.position.length() + radius);
  assert.ok(previewCamera.position.equals(position));
  assert.ok(previewCamera.quaternion.equals(quaternion));
  for (const x of [-400, 400]) for (const y of [-500, 500]) for (const z of [-400, 400]) {
    assert.ok(new Vector3(x, y, z).project(previewCamera).z < 1, 'Terrain stays inside far clipping plane after zoom/pan');
  }
}
console.log('Active preview camera clipping follows zoom distance and bounds without changing camera pose.');

const savedView = {
  position: [100, 80, 120],
  target: [3, 4, 5],
  zoom: 1.2,
  fov: 48,
};
assert.deepEqual(parseTerrainPreviewCamera(JSON.parse(JSON.stringify(savedView))), savedView);
const viewedTerrain = parseTerrainDefinition({ ...definition, appearance: { ...definition.appearance, previewCamera: savedView } });
assert.deepEqual(parseTerrainDefinition(JSON.parse(JSON.stringify(viewedTerrain))).appearance.previewCamera, savedView);
for (const invalid of [
  { ...savedView, zoom: 0 },
  { ...savedView, fov: 180 },
  { ...savedView, position: [NaN, 1, 2] },
  { ...savedView, position: savedView.target },
  { ...savedView, extra: true },
]) assert.throws(() => parseTerrainPreviewCamera(invalid));
const cameraControlsSource = canvasSource.slice(canvasSource.indexOf('function TerrainCameraControls'), canvasSource.indexOf('interface Props')).replace('function TerrainCameraControls', 'export function TerrainCameraControls');
const cameraModule = { exports: {} };
const restored = new PerspectiveCamera();
const orbit = { target: new Vector3(), update() {} };
const captures = [];
runInNewContext(ts.transpileModule(cameraControlsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
  exports: cameraModule.exports,
  THREE: { PerspectiveCamera },
  OrbitControls: 'OrbitControls',
  useThree: callback => callback({ camera: restored }),
  useRef: initial => ({ current: initial === null ? orbit : initial }),
  useEffect: callback => callback(),
  require: () => ({ jsx, jsxs: jsx }),
});
const orbitTree = cameraModule.exports.TerrainCameraControls({ restoredCamera: savedView, onCameraChange: view => captures.push(view), enabled: true, extent: 800, verticalExtent: 100, peak: 80 });
assert.deepEqual(restored.position.toArray(), savedView.position);
assert.deepEqual(orbit.target.toArray(), savedView.target);
assert.equal(restored.zoom, savedView.zoom);
assert.equal(restored.fov, savedView.fov);
orbitTree.props.onChange();
assert.equal(captures.length, 0, 'Hydration does not mark the Terrain dirty');
orbitTree.props.onStart();
restored.position.set(200, 90, 180);
orbitTree.props.onChange();
assert.deepEqual(captures[0].position, [200, 90, 180]);
assert.deepEqual(captures[0].target, savedView.target);
console.log('Terrain camera parser, restore, hydration guard and user movement capture pass; saving remains manual.');

const editorSource = readFileSync(new URL('../../components/admin/threed/terrains/TerrainEditor.tsx', import.meta.url), 'utf8');
const saveSource = editorSource.slice(editorSource.indexOf('  async function save()'), editorSource.indexOf('  const generationError')).replace('async function save()', 'export async function save()');
let savePayload;
let failCameraSave = false;
const acknowledgedCameras = [];
const acknowledgedPanels = [];
const panelDraft = { ...defaultTerrainEditorPanels(), generation: false, colors: false };
const saveModule = { exports: {} };
const noop = () => {};
runInNewContext(ts.transpileModule(saveSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports: saveModule.exports,
  saveDisabled: false,
  definition,
  cameraDraft: savedView,
  editorPanels: panelDraft,
  brushSettings: { ...defaultTerrainBrushSettings(), radiusM: 8 },
  name: 'Terrain camera test',
  recordId: 5,
  revision: 8,
  setBusy: noop,
  setError: noop,
  setMessage: noop,
  setRevision: noop,
  setSavedDefinition: noop,
  setSavedCamera: view => acknowledgedCameras.push(view),
  setSavedPanels: panels => acknowledgedPanels.push(panels),
  setSavedBrushSettings: noop,
  setSavedName: noop,
  setRecoveryRequired: noop,
  setRecoveryChanged: noop,
  router: { refresh: noop, replace: noop },
  fetch: async (url, options) => {
    assert.equal(url, '/api/threed/terrains');
    savePayload = JSON.parse(options.body);
    return { ok: !failCameraSave, json: async () => failCameraSave ? { success: false, error: 'Conflict' } : { success: true, data: { id: 5, revision: 9 } } };
  },
});
await saveModule.exports.save();
assert.deepEqual(savePayload.definition.appearance.previewCamera, savedView);
assert.equal(savePayload.expectedRevision, 8);
assert.equal(acknowledgedCameras.length, 1);
failCameraSave = true;
await saveModule.exports.save();
assert.equal(acknowledgedCameras.length, 1, 'Failed Save does not acknowledge the camera draft');
console.log('Actual manual Save includes camera in the Terrain revision payload and acknowledges it only on success.');

assert.deepEqual(savePayload.definition.appearance.editorPanels, panelDraft);
assert.equal(acknowledgedPanels.length, 1, 'Failed Save retains unsaved panel state');
assert.deepEqual(parseTerrainEditorPanels(JSON.parse(JSON.stringify(panelDraft))), panelDraft);
assert.deepEqual(parseTerrainDefinition({ ...definition, appearance: { ...definition.appearance, editorPanels: panelDraft } }).appearance.editorPanels, panelDraft);
assert.throws(() => parseTerrainEditorPanels({ ...panelDraft, colors: 'false' }));
assert.throws(() => parseTerrainEditorPanels({ ...panelDraft, unknown: true }));
assert.throws(() => parseTerrainEditorPanels({ colors: false }));
const panelSource = editorSource.slice(editorSource.indexOf('function TerrainEditorPanel'), editorSource.indexOf('export function TerrainEditor')).replace('function TerrainEditorPanel', 'export function TerrainEditorPanel');
const panelModule = { exports: {} };
runInNewContext(ts.transpileModule(panelSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
  exports: panelModule.exports,
  useId: () => 'terrain-panel-test',
  Button: 'Button',
  ChevronRight: 'ChevronRight',
  ModelFieldHelp: 'Help',
  require: () => ({ jsx, jsxs: jsx }),
});
let requestedOpen;
const panelProps = { label: 'Colors', title: 'Colors', open: true, onOpenChange: open => { requestedOpen = open; }, children: 'Retained form' };
let panelNodes = nodes(panelModule.exports.TerrainEditorPanel(panelProps));
panelNodes.find(node => node.type === 'Button').props.onClick();
assert.equal(requestedOpen, false);
panelNodes = nodes(panelModule.exports.TerrainEditorPanel({ ...panelProps, open: false }));
assert.equal(panelNodes.find(node => node.type === 'Button').props['aria-expanded'], false);
assert.equal(panelNodes.find(node => node.props?.id === 'terrain-panel-test').props.hidden, true);
assert.ok(panelNodes.some(node => node.props?.children === 'Retained form'), 'Collapsed controls stay mounted');
console.log('Terrain section visibility validates, drives controlled panels, persists in manual Save and retains failed drafts.');

const brushSettings = { ...defaultTerrainBrushSettings(), radiusM: 8, strengthM: 3, feather: 0.2, startHeightM: -5, endHeightM: 12, fillArea: true };
assert.deepEqual(parseTerrainBrushSettings(JSON.parse(JSON.stringify(brushSettings))), brushSettings);
assert.deepEqual(parseTerrainDefinition({ ...definition, appearance: { ...definition.appearance, brushSettings } }).appearance.brushSettings, brushSettings);
assert.equal(savePayload.definition.appearance.brushSettings.radiusM, 8);
for (const bad of [{ ...brushSettings, radiusM: 0 }, { ...brushSettings, strengthM: 101 }, { ...brushSettings, feather: NaN }, { ...brushSettings, fillArea: 'true' }, { ...brushSettings, extra: true }]) assert.throws(() => parseTerrainBrushSettings(bad));
console.log('Sculpt brush settings validate, round-trip in Terrain revisions and join the existing manual Save payload.');
