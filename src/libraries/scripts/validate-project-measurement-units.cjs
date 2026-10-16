// Offline route/service checks. Database and authentication are mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function load(file, overrides = {}) {
  file = path.resolve(file);
  if (!Object.keys(overrides).length && cache.has(file)) return cache.get(file);
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code, {module, exports:module.exports, console:{error(){}}, URL, TextEncoder, crypto:require('node:crypto').webcrypto, require(name) {
    if (name in overrides) return overrides[name];
    if (name.startsWith('.') || name.startsWith('@/')) {
      let target = name.startsWith('@/') ? path.resolve('src',name.slice(2)) : path.resolve(path.dirname(file),name);
      if (!path.extname(target)) target += '.ts';
      return load(target);
    }
    return require(name);
  }}, {filename:file});
  if (!Object.keys(overrides).length) cache.set(file,module.exports);
  return module.exports;
}
const units = load('src/libraries/services/project/measurement-units.ts');
assert.equal(units.readProjectMeasurementUnits({}), 'imperial');
const legacy = {threeDViewState:{design:{measurementUnits:'metric'}}};
assert.equal(units.readProjectMeasurementUnits(legacy), 'metric');
assert.equal(units.readProjectMeasurementUnits({...legacy,measurementUnits:'imperial'}), 'imperial');
assert.throws(()=>units.parseMeasurementUnits('yards'));
assert.equal(units.formatProjectSceneLength(1,.3048,'imperial'),'1.0 ft');
assert.equal(units.formatProjectSceneLength(1,1,'metric'),'1.0 m');

const session = load('src/libraries/services/map/threed-project-session-core.ts');
const design = load('src/libraries/services/threed/design/project-architecture.ts');
const workspace = load('src/libraries/services/threed/design/workspace-state.ts');
const before = design.projectArchitectureDraft();
const docJSON = JSON.stringify(before.history.present);
const result = session.buildThreeDProjectSession({success:true,data:{},projectContext:{projectId:17,measurementUnits:'metric',metersPerSceneUnit:1,viewState:{design:{...workspace.defaultDesignWorkspace(),measurementUnits:'imperial'}}}},'17');
assert.equal(result.success,true);
const hydrated = design.hydrateArchitectureDraft(undefined, undefined, {...result.session.savedViewState.design,measurementUnits:result.session.measurementUnits});
assert.equal(hydrated.workspace.measurementUnits,'metric');
assert.equal(design.architectureIsDirty(hydrated),false);
assert.equal(JSON.stringify(hydrated.history.present), docJSON);
const edited = {...hydrated, workspace:{...hydrated.workspace,measurementUnits:'imperial'}};
assert.equal(design.architectureIsDirty(edited),true);
assert.equal(design.hydrateArchitectureDraft(edited,undefined,hydrated.workspace),edited,'Reload cannot erase a pending preference edit');
assert.equal(session.buildThreeDProjectSession({success:true,data:{},projectContext:{projectId:16}},'16').session.measurementUnits,'imperial');
const capturedWorkspace = {...hydrated.workspace};
const acknowledged = design.acknowledgeArchitecture(edited, {version:1,document:hydrated.history.present}, capturedWorkspace);
assert.equal(design.architectureIsDirty(acknowledged),true,'Preference changed during Save stays unsaved');
const inventory = load('src/libraries/services/threed/design/asset-inventory.ts');
const room = {...hydrated.history.present, nodes:[{id:'a',x:0,z:0},{id:'b',x:3,z:0}], walls:[{id:'wall',levelId:'ground',start:'a',end:'b',height:2,thickness:.1,elevation:0}]};
const original = JSON.stringify(room);
assert.equal(inventory.architectureAssets(room,'','metric')[0].dimensions,'3 m long / 2 m high');
assert.ok(inventory.architectureAssets(room,'','imperial')[0].dimensions.includes('ft'));
assert.equal(JSON.stringify(room),original);

let current = {id:17,userId:'owner',name:'Project',config:{...legacy,unrelated:{retained:true}},metersPerSceneUnit:'0.3048'};
let authenticated = true, owned = true, fail = false, writes = 0;
const copy = x=>JSON.parse(JSON.stringify(x));
const tx = {select:()=>({from:()=>({where:()=>({limit:()=>({for:async()=>owned?[copy(current)]:[]})})})}),update:()=>({set:patch=>({where:()=>({returning:async()=>{
  if(fail) throw new Error('mock failure');
  const config = patch.config ? {...current.config,...JSON.parse(patch.config.values.find(v=>typeof v==='string'))} : current.config;
  current={...current,...patch,config}; writes++; return [current];
}})})})};
const db = {
  select:()=>({from:()=>({where:()=>({limit:async()=>owned?[copy(current)]:[]})})}),
  insert:()=>({values:values=>({returning:async()=>{writes++;return [{id:18,...values}];}})}),
  transaction:async callback=>callback(tx),
};
const route = load('src/app/api/project/route.ts', {
  'next/server':{NextResponse:{json:(body,init={})=>({status:init.status??200,body})}},
  '@/libraries/auth':{auth:async()=>authenticated?{user:{id:'owner'}}:null},
  '@/libraries/db/client':{db},
  '@/libraries/schema/project':{project:{id:'id',userId:'userId',config:{column:'config'}},projectThreedMarkers:{}},
  'drizzle-orm':{eq:()=>{},and:()=>{},desc:()=>{},sql:(strings,...values)=>({strings,values})},
  '@/libraries/services/threed/markers/map-coordinate-core':{ThreeDMapCoordinateError:class extends Error{}},
});
const request = body=>({url:'https://offline.invalid/api/project?id=17',json:async()=>body});
(async()=>{
  const created = await route.POST(request({name:'New',description:'New Setup',isActive:false,isPublic:true,measurementUnits:'metric'}));
  assert.equal(created.status,200); assert.equal(created.body.data.config.measurementUnits,'metric');
  assert.equal(created.body.data.userId,'owner');assert.equal(created.body.data.isActive,false);assert.equal(created.body.data.isPublic,true);assert.equal(created.body.data.description,'New Setup');
  assert(!('threeDViewState' in created.body.data.config));assert(!('threeDArchitecture' in created.body.data.config));
  const saved = await route.PATCH(request({measurementUnits:'imperial'}));
  assert.equal(saved.status,200); assert.equal(current.config.measurementUnits,'imperial');
  assert.equal(current.config.unrelated.retained,true);
  assert.equal(current.config.threeDViewState.design.measurementUnits,'metric','Historical workspace can remain; canonical preference wins');
  assert.equal(current.metersPerSceneUnit,'0.3048');
  await route.PATCH(request({description:'Only description'}));
  assert.equal(current.config.measurementUnits,'imperial');
  fail=false;
  const previousConfigTestState=copy(current);
  const configuration=load('src/libraries/services/project/configuration.ts');
  const savedView={version:1,savedAt:'2026-10-15T12:00:00.000Z',viewMode:'design',panelHeight:45,cameraMode:'stationary',
    overlayPositions:{details:{x:.7,y:.2}}, workspace:{selectedMarkerId:'models-ball',panel:'assets',assetSearch:'ball',assetType:'models'},
    threeD:{cameraPosition:{x:10,y:8,z:10},cameraTarget:{x:0,y:0,z:0},cameraFov:55,activeLayers:['models','designs'],availableLayers:['models','designs'],environment:'park',autoRotate:false,showGrid:false,showGizmo:false,viewPresets:[{id:'wide',name:'Wide',position:{x:10,y:8,z:10},target:{x:0,y:0,z:0},layers:['models'],createdAt:'2026-10-15T12:00:00.000Z'}]}};
  current.config={measurementUnits:'imperial',threeDViewState:savedView,threeDArchitecture:{version:1,document:room},unrelated:{retained:true}};
  const baseline=copy(current.config),expected=configuration.projectConfigurationStamp(baseline);
  const edited=await route.PATCH(request({name:'Unified Project Save',description:'Details and configuration together',isPublic:true,isActive:false,configuration:{expected,changes:{measurementUnits:'metric',viewMode:'combined',threeD:{showGrid:true,environment:'studio'}}}}));
  assert.equal(edited.status,200);assert.equal(current.config.measurementUnits,'metric');assert.equal(current.config.threeDViewState.viewMode,'combined');
  assert.equal(current.name,'Unified Project Save');assert.equal(current.description,'Details and configuration together');assert.equal(current.isPublic,true);assert.equal(current.isActive,false);
  assert.equal(current.config.threeDViewState.threeD.showGrid,true);assert.equal(current.config.threeDViewState.threeD.environment,'studio');
  assert.deepEqual(copy(current.config.threeDArchitecture),baseline.threeDArchitecture);
  assert.deepEqual(copy(current.config.threeDViewState.threeD.cameraPosition),savedView.threeD.cameraPosition);
  assert.deepEqual(copy(current.config.threeDViewState.threeD.viewPresets),savedView.threeD.viewPresets);
  assert.deepEqual(copy(current.config.threeDViewState.workspace),savedView.workspace);
  assert.deepEqual(copy(current.config.threeDViewState.overlayPositions),savedView.overlayPositions);
  assert.equal(current.config.unrelated.retained,true);assert.equal(current.metersPerSceneUnit,'0.3048');
  const savedState=copy(current),countAfter=writes;
  assert.equal((await route.PATCH(request({name:'Must not save on conflict',configuration:{expected,changes:{viewMode:'2d'}}}))).status,409);
  for(const changes of [{viewMode:'bad'},{threeD:{cameraPosition:{x:0,y:0,z:0}}},{threeD:{ground:{enabled:true,size:0,height:0}}},{threeD:{sunlight:{azimuth:0,elevation:95}}},{threeD:{activeLayers:['unknown']}},{privateOwner:'someone'},{threeD:null}]) {
    const rejected=await route.PATCH(request({configuration:{expected:configuration.projectConfigurationStamp(current.config),changes}}));
    assert.equal(rejected.status,400);
  }
  assert.equal(writes,countAfter);assert.deepEqual(copy(current),savedState);
  owned=false;assert.equal((await route.PATCH(request({configuration:{expected,changes:{measurementUnits:'metric'}}}))).status,404);owned=true;
  authenticated=false;assert.equal((await route.PATCH(request({configuration:{expected,changes:{measurementUnits:'metric'}}}))).status,401);authenticated=true;
  fail=true;assert.equal((await route.PATCH(request({configuration:{expected:configuration.projectConfigurationStamp(current.config),changes:{measurementUnits:'imperial'}}}))).status,500);fail=false;
  assert.deepEqual(copy(current),savedState);
  const empty={unrelated:true};const patch=configuration.projectConfigurationPatch(empty,{expected:configuration.projectConfigurationStamp(empty),changes:{measurementUnits:'metric'}});
  assert.deepEqual(copy(patch),{measurementUnits:'metric'});
  assert.throws(()=>configuration.projectConfigurationPatch(empty,{expected:configuration.projectConfigurationStamp(empty),changes:{viewMode:'design'}}),/Save Project once/);
  console.log('PASS: actual Admin configuration PATCH, owner/auth/row lock boundaries, validation, stale-write conflicts, failure and architecture/camera/cards/presets/unrelated-config preservation. Mocked DB only.');
  current=previousConfigTestState;
  const count = writes;
  assert.equal((await route.PATCH(request({measurementUnits:'yards'}))).status,400);
  assert.equal((await route.POST(request({name:'Invalid',measurementUnits:null}))).status,400);
  owned=false; assert.equal((await route.PATCH(request({measurementUnits:'metric'}))).status,404);
  authenticated=false; assert.equal((await route.PATCH(request({measurementUnits:'metric'}))).status,401);
  assert.equal(writes,count);
  owned=authenticated=true; fail=true;
  assert.equal((await route.PATCH(request({measurementUnits:'metric'}))).status,500);
  assert.equal(current.config.measurementUnits,'imperial');
  console.log('PASS: Project units defaults/legacy precedence, calibrated formatting, session hydration/dirty/isolation, mocked Admin create/update/auth/validation/failure and unrelated config preservation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
