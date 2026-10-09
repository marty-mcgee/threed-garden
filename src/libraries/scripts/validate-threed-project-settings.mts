import assert from 'node:assert/strict';
// @ts-ignore Node source extension.
import { parseThreeDProjectViewState } from '../services/threed/markers/project-view-state-core.ts';
// @ts-ignore Node source extension.
import { resolveCharacterPhysics } from '../services/threed/characters/character-physics.ts';
// @ts-ignore Node source extension.
import { DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY } from '../services/threed/environment-presets.ts';
const saved = {version:1, savedAt:new Date().toISOString(), viewMode:'3d', panelHeight:50, cameraMode:'orbit', threeD:{ cameraPosition:{x:1,y:2,z:3}, cameraTarget:{x:0,y:0,z:0}, activeLayers:['models'], environment:DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY, autoRotate:false, showGrid:false, showLegend:false, showGizmo:true, sunlight:{azimuth:210,elevation:25}, ground:{enabled:true,size:300,height:-0.2}}};
assert.deepEqual(parseThreeDProjectViewState(JSON.parse(JSON.stringify(saved))).threeD, saved.threeD);
for (const viewMode of ['3d', '2d', 'combined', 'design']) {
  const restored = parseThreeDProjectViewState(JSON.parse(JSON.stringify({ ...saved, viewMode })));
  assert.equal(restored.viewMode, viewMode);
  assert.deepEqual(restored.threeD, saved.threeD, 'Design mode must preserve the saved Scene state.');
}
assert.throws(() => parseThreeDProjectViewState({ ...saved, viewMode: 'unknown' }));
const overlayPositions = { simulations: { x: 0.3, y: 0.5 }, scenarios: { x: 0, y: 1 }, tour: { x: 1, y: 0 }, sensorGroup: { x: 0.1, y: 0.2 }, sensors: { x: 1, y: 0.4 } };
assert.deepEqual(parseThreeDProjectViewState(JSON.parse(JSON.stringify({ ...saved, overlayPositions }))).overlayPositions, overlayPositions);
assert.equal(parseThreeDProjectViewState(saved).overlayPositions, undefined);
assert.equal(parseThreeDProjectViewState(saved).projectTourOpen, undefined);
for (const projectTourOpen of [true, false]) {
  assert.equal(parseThreeDProjectViewState({ ...saved, projectTourOpen }).projectTourOpen, projectTourOpen);
}
assert.throws(() => parseThreeDProjectViewState({ ...saved, projectTourOpen: 'true' }));
assert.deepEqual(parseThreeDProjectViewState({ ...saved, overlayPositions: {} }).overlayPositions, {});
for (const bad of [{ unknown: { x: 0, y: 0 } }, { tour: { x: -1, y: 0 } }, { tour: { x: 0, y: Infinity } }, { tour: { x: '0', y: 0 } }]) {
  assert.throws(() => parseThreeDProjectViewState({ ...saved, overlayPositions: bad }));
}
assert.throws(() => parseThreeDProjectViewState({...saved, threeD:{...saved.threeD,ground:{enabled:true,size:Infinity,height:0}}}));
const legacy = {...saved,threeD:{...saved.threeD,sunlight:undefined,ground:undefined}};
assert.equal(parseThreeDProjectViewState(legacy).threeD?.ground,undefined);
assert.equal(resolveCharacterPhysics({walkSpeed:4}).walkSpeed,4);
assert.equal(resolveCharacterPhysics({clearance:100}).clearance,0.05);
assert.equal(resolveCharacterPhysics({mass:-1}).mass,resolveCharacterPhysics(null).mass);
console.log('PASS: Environment save round-trip, legacy compatibility, invalid state rejection and bounded Character settings');

const workspace = {selectedMarkerId:'models-example', panel:'assets', assetSearch:'ball', assetType:'models'};
const preset = {id:'view-1',name:'Field',position:{x:3,y:4,z:5},target:{x:0,y:0,z:0},layers:['models'],createdAt:saved.savedAt};
const expanded = {...saved, workspace, threeD:{...saved.threeD,showControls:true,viewPresets:[preset]}};
assert.deepEqual(parseThreeDProjectViewState(JSON.parse(JSON.stringify(expanded))).workspace,workspace);
assert.deepEqual(parseThreeDProjectViewState(expanded).threeD?.viewPresets,[preset]);
assert.equal(parseThreeDProjectViewState(saved).workspace,undefined);
assert.equal(parseThreeDProjectViewState(saved).threeD?.showControls,undefined);
for (const bad of [{...workspace,panel:'placement'}, {...workspace,assetSearch:'x'.repeat(201)}, {...workspace,selectedMarkerId:12}]) {
  assert.throws(()=>parseThreeDProjectViewState({...saved,workspace:bad}));
}
assert.throws(()=>parseThreeDProjectViewState({...expanded,threeD:{...expanded.threeD,showControls:'true'}}));
assert.throws(()=>parseThreeDProjectViewState({...expanded,threeD:{...expanded.threeD,viewPresets:[preset,preset]}}));
assert.throws(()=>parseThreeDProjectViewState({...expanded,threeD:{...expanded.threeD,viewPresets:[{...preset,position:{x:Infinity,y:0,z:0}}]}}));
console.log('PASS: Workspace/Controls/named-view round trip, legacy compatibility and bounded validation');

// Execute the actual page capture expression under both Save entry-point states.
const { readFileSync } = await import('node:fs');
const ts = (await import('typescript')).default;
const pageSource = ts.createSourceFile('page.tsx', readFileSync(new URL('../../app/dashboard/scene/page.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let captureExpression = '';
function findWorkspace(node: import('typescript').Node) {
  if (ts.isPropertyAssignment(node) && node.name.getText(pageSource) === 'workspace' && ts.isObjectLiteralExpression(node.initializer)) captureExpression = node.initializer.getText(pageSource);
  ts.forEachChild(node, findWorkspace);
}
findWorkspace(pageSource);
assert(captureExpression, 'Project Save workspace capture must exist');
const capture = new Function('isProjectSummaryOpen', 'isProjectAssetsOpen', 'selectedMarker', 'projectAssetSearch', 'projectAssetType', 'isModelLibraryOpen', `return (${captureExpression});`);
for (const assetsOpen of [true,false]) {
  for (const modelsOpen of [true,false]) {
    const toolbar = capture(false,assetsOpen,{id:'models-example'},'ball','models',modelsOpen);
    const dropdown = capture(true,assetsOpen,{id:'models-example'},'ball','models',modelsOpen);
    assert.deepEqual(dropdown,toolbar,'Temporary dropdown visibility must not change saved workspace');
    assert.equal(dropdown.panel,assetsOpen ? 'assets' : modelsOpen ? 'models' : 'none');
    assert.deepEqual(parseThreeDProjectViewState({...saved,workspace:dropdown}).workspace,toolbar);
  }
}
console.log('PASS: Actual dropdown/toolbar Save captures preserve identical underlying workspace');

for (const physicsDebug of [true, false]) {
  const state = {...saved, threeD:{...saved.threeD,physicsDebug}};
  assert.equal(parseThreeDProjectViewState(JSON.parse(JSON.stringify(state))).threeD?.physicsDebug,physicsDebug);
}
assert.equal(parseThreeDProjectViewState(saved).threeD?.physicsDebug ?? false,false);
assert.throws(()=>parseThreeDProjectViewState({...saved,threeD:{...saved.threeD,physicsDebug:1}}));
console.log('PASS: Physics Debug true/false persistence, legacy default and invalid value rejection');

const scenario = {
  panelOpen:true,
  selected:{id:17,projectId:15,name:'Soccer Practice',threedName:'ThreeD Soccer',setup:{version:1,kind:'soccer',environmentMarkerId:'models-field-1',sensorGroupId:'goals'}},
  guide:{kind:'soccer',environmentId:'models-field-1',groupId:'goals',farmbotId:''},
};
const scenarioRuntime = {projectId:15,active:{projectId:15,name:'Soccer Practice',kind:'soccer',environmentName:'Practice Pitch',groupId:'goals',groupName:'Imported sensors'},instructionVisible:true,sensorsVisible:true};
const withScenario = {...saved,scenario,threeD:{...saved.threeD,scenarioRuntime}};
const restoredScenario = parseThreeDProjectViewState(JSON.parse(JSON.stringify(withScenario)));
assert.deepEqual(restoredScenario.scenario,scenario);
assert.deepEqual(restoredScenario.threeD?.scenarioRuntime,scenarioRuntime);
assert.equal(parseThreeDProjectViewState(saved).scenario,undefined);
assert.equal(parseThreeDProjectViewState(saved).threeD?.scenarioRuntime,undefined);
for (const bad of [
  {...scenario,selected:{...scenario.selected,id:0}},
  {...scenario,selected:{...scenario.selected,setup:{...scenario.selected.setup,kind:'unknown'}}},
  {...scenario,guide:{...scenario.guide,environmentId:'x'.repeat(201)}},
  {...scenario,panelOpen:'true'},
]) assert.throws(()=>parseThreeDProjectViewState({...saved,scenario:bad}));
for (const bad of [
  {...scenarioRuntime,active:{...scenarioRuntime.active,projectId:0}},
  {...scenarioRuntime,projectId:0},
  {...scenarioRuntime,instructionVisible:'true'},
  {...scenarioRuntime,active:null,instructionVisible:true},
]) assert.throws(()=>parseThreeDProjectViewState({...saved,threeD:{...saved.threeD,scenarioRuntime:bad}}));
console.log('PASS: Scenario selection, Guide choices, started status and overlays round-trip with legacy and invalid-state handling');
