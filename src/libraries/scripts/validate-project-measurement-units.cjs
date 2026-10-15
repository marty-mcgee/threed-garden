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
const tx = {update:()=>({set:patch=>({where:()=>({returning:async()=>{
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
  const created = await route.POST(request({name:'New',measurementUnits:'metric'}));
  assert.equal(created.status,200); assert.equal(created.body.data.config.measurementUnits,'metric');
  const saved = await route.PATCH(request({measurementUnits:'imperial'}));
  assert.equal(saved.status,200); assert.equal(current.config.measurementUnits,'imperial');
  assert.equal(current.config.unrelated.retained,true);
  assert.equal(current.config.threeDViewState.design.measurementUnits,'metric','Historical workspace can remain; canonical preference wins');
  assert.equal(current.metersPerSceneUnit,'0.3048');
  await route.PATCH(request({description:'Only description'}));
  assert.equal(current.config.measurementUnits,'imperial');
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
