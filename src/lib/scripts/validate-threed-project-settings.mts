import assert from 'node:assert/strict';
// @ts-ignore Node source extension.
import { parseThreeDProjectViewState } from '../services/threed/markers/project-view-state-core.ts';
// @ts-ignore Node source extension.
import { resolveCharacterPhysics } from '../services/threed/characters/character-physics.ts';
// @ts-ignore Node source extension.
import { DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY } from '../services/threed/environment-presets.ts';
const saved = {version:1, savedAt:new Date().toISOString(), viewMode:'3d', panelHeight:50, cameraMode:'orbit', threeD:{ cameraPosition:{x:1,y:2,z:3}, cameraTarget:{x:0,y:0,z:0}, activeLayers:['models'], environment:DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY, autoRotate:false, showGrid:false, showLegend:false, showGizmo:true, sunlight:{azimuth:210,elevation:25}, ground:{enabled:true,size:300,height:-0.2}}};
assert.deepEqual(parseThreeDProjectViewState(JSON.parse(JSON.stringify(saved))).threeD, saved.threeD);
assert.throws(() => parseThreeDProjectViewState({...saved, threeD:{...saved.threeD,ground:{enabled:true,size:Infinity,height:0}}}));
const legacy = {...saved,threeD:{...saved.threeD,sunlight:undefined,ground:undefined}};
assert.equal(parseThreeDProjectViewState(legacy).threeD?.ground,undefined);
assert.equal(resolveCharacterPhysics({walkSpeed:4}).walkSpeed,4);
assert.equal(resolveCharacterPhysics({clearance:100}).clearance,0.05);
assert.equal(resolveCharacterPhysics({mass:-1}).mass,resolveCharacterPhysics(null).mass);
console.log('PASS: Environment save round-trip, legacy compatibility, invalid state rejection and bounded Character settings');
