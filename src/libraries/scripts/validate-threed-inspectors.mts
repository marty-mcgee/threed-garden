import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { PhysicsSensorCuboidsEditor } from '../../components/map/details/PhysicsSensorCuboidsEditor';
import { SceneTransformWorkspace } from '../../components/threed/transform/SceneTransformWorkspace';
(globalThis as any).React = React;
const sensor = (id:string,name:string) => ({id,name,behavior:'counter',detection:'movable-ball',groupId:null,position:{x:0,y:1,z:0},width:2,height:2,depth:.35,rotationY:0});
const props = {markerId:1,ownerKey:'15:models:1',ownerPose:{position:{x:0,y:0,z:0},rotation:[0,0,0]},initialMetadata:{physicsSensorCuboids:[sensor('a','Entrance A'),sensor('b','Entrance B')]},saving:false,placementSensorId:null,placementResult:null,onBeginPlacement:()=>{},onCancelPlacement:()=>{},onZoomToSensor:()=>{},onSave:async()=>true,onSelectSensor:()=>{}};
const render = (id:string|null) => renderToStaticMarkup(React.createElement(SceneTransformWorkspace,null,React.createElement(PhysicsSensorCuboidsEditor,{...props,selectedSensorId:id} as any)));
const parent=render(null);
assert(parent.includes('Entrance A') && parent.includes('Entrance B'));
assert(!parent.includes('type="number"'));
const first=render('a');
assert(first.includes('value="Entrance A"') && !first.includes('Entrance B'));
assert(first.includes('Move Sensor') && first.includes('Zoom to Sensor') && first.includes('Transform Sensor'));
assert.equal((first.match(/type="number"/g)||[]).length,7);
const second=render('b');
assert(second.includes('value="Entrance B"') && !second.includes('Entrance A'));
assert(first.indexOf('Save Sensor')<first.indexOf('value="Entrance A"'));
console.log('PASS: parent lists both sensors without forms; each sensor inspector renders only its own seven transform fields and actions.');

// Exercise the actual page handlers with state-setter spies: menu operations
// must not clear selection or dismiss the independent Assets workspace.
const { readFileSync } = await import('node:fs');
const page = readFileSync('src/app/dashboard/scene/page.tsx', 'utf8');
for (const name of ['openProjectAssets', 'openProjectSetup', 'handleEnvironmentControlsOpenChange']) {
  const start = page.indexOf(`const ${name} = useCallback(`);
  assert(start >= 0);
  const bodyStart = page.indexOf('=> {', start) + 4;
  const bodyEnd = page.indexOf('\n  }, [', bodyStart);
  assert(bodyEnd > bodyStart);
  const body = page.slice(bodyStart, bodyEnd);
  const setters = [...new Set(body.match(/\bset[A-Z]\w*/g) ?? [])];
  const calls: [string, unknown][] = [];
  const execute = new Function('open', 'selectedProjectId', ...setters, body);
  execute(true, '15', ...setters.map(setter => (value: unknown) => calls.push([setter, value])));
  assert(!calls.some(([setter]) => setter === 'setSelectedMarker' || setter === 'setSensorInspector' || setter === 'setGroupInspector'), `${name} preserves inspector selection`);
  assert(!calls.some(([setter, value]) => setter === 'setIsProjectAssetsOpen' && value === false), `${name} preserves Assets visibility`);
}
assert(!page.includes('hidden={isProjectSummaryOpen || (viewMode'));
assert(!/hidden=\{isProjectSummaryOpen\}[^>]*>\s*<ProjectAssetsPanel/.test(page));
console.log('PASS: Assets, Tour and Environment handlers preserve inspector selection and independent Assets visibility; summary cannot hide either workspace.');

for (const name of ['onSetupMenuOpenChange', 'onOpenScenarios']) {
  const start = page.indexOf(`${name}={`);
  assert(start >= 0);
  const bodyStart = page.indexOf('=> {', start) + 4;
  const bodyEnd = page.indexOf('\n          }}', bodyStart);
  assert(bodyEnd > bodyStart);
  const body = page.slice(bodyStart, bodyEnd);
  const setters = [...new Set(body.match(/\bset[A-Z]\w*/g) ?? [])];
  const calls: [string, unknown][] = [];
  new Function('open', 'selectedProjectId', ...setters, body)(true, '15', ...setters.map(setter => (value: unknown) => calls.push([setter, value])));
  assert(!calls.some(([setter]) => ['setSelectedMarker', 'setSensorInspector', 'setGroupInspector', 'setIsProjectAssetsOpen'].includes(setter)));
  assert(calls.some(([setter, value]) => setter === 'setIsProjectSetupOpen' && value === false));
  assert(calls.some(([setter, value]) => setter === 'setIsScenariosOpen' && value === (name === 'onOpenScenarios')));
}
const tourSource = readFileSync('src/components/map/panels/ProjectSetupPanel.tsx', 'utf8');
assert(!tourSource.includes('ScenarioGuidance'), 'Scenarios is not nested inside Tour');
console.log('PASS: Setup and Scenarios preserve Assets/inspector state and dismiss the Tour.');
