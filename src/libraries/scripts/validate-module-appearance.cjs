// Offline: real contracts, service, routes and navigation; in-memory DB/HTTP adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');
function load(file, modules, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name in modules ? modules[name] : require(name), console, Request, Response, URL, ...globals });
  return exports;
}

const contract=load('src/libraries/config/module-appearance.ts',{});
const authSchema=load('src/libraries/schema/auth/index.ts',{});
const schema=load('src/libraries/schema/settings/index.ts',{'../auth':authSchema});
const {settings,settingsAuditLogs:audits}=schema;
const {User}=authSchema;
const dialect=new pg.PgDialect();
let data={row:null,audits:[]},actor={role:'super_admin',active:true,deleted:false},failAudit=false,session=null,queue=Promise.resolve(),locks=0;
const clone=v=>JSON.parse(JSON.stringify(v));
function select(){let table,condition;const chain={from(t){table=t;return chain;},where(c){condition=c;return chain;},for(kind){assert(['share','update'].includes(kind));locks++;return chain;},then(resolve,reject){return Promise.resolve().then(()=>{const query=dialect.sqlToQuery(condition);if(table===User){assert.equal(query.params[0],'admin-id');return actor?[actor]:[];}assert.equal(table,settings);assert.equal(query.params[0],'app.module-appearance.v1');return data.row?[data.row]:[];}).then(resolve,reject);}};return chain;}
function insert(table){let value;const chain={values(v){value=clone(v);return chain;},onConflictDoNothing(){return chain;},then(resolve,reject){return Promise.resolve().then(()=>{if(table===settings){data.row??={id:1,...value};}else{assert.equal(table,audits);if(failAudit)throw Error('private diagnostic');data.audits.push(value);}}).then(resolve,reject);}};return chain;}
function update(table){assert.equal(table,settings);return {set(value){return {async where(condition){assert.equal(dialect.sqlToQuery(condition).params[0],1);Object.assign(data.row,clone(value));}};}};}
const db={select,transaction(fn){const run=queue.then(async()=>{const before=clone(data);try{return await fn({select,insert,update});}catch(e){data=before;throw e;}});queue=run.catch(()=>{});return run;}};
const service=load('src/libraries/services/settings/module-appearance.ts',{'server-only':{},'@/libraries/db/client':{db},'@/libraries/schema/auth':authSchema,'@/libraries/schema/settings':schema,'@/libraries/config/module-appearance':contract});
const route=load('src/app/api/settings/module-appearance/route.ts',{'@/libraries/auth':{auth:async()=>session},'@/libraries/config/module-appearance':contract,'@/libraries/services/settings/module-appearance':service});
const request=(body,origin='https://example.test')=>new Request('https://example.test/api/settings/module-appearance',{method:'PUT',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
(async()=>{
 const initial=contract.defaultModuleAppearance();
 assert(contract.moduleAppearanceSnapshotSchema.safeParse(initial).success);
 assert.equal(contract.moduleKeys.length,44);
 assert.deepEqual(clone(contract.workspaceSurfaces).map(({label,href,moduleKey})=>({label,href,moduleKey})),[
  {label:'Dashboard',href:'/dashboard',moduleKey:'dashboard'},
  {label:'Admin',href:'/admin',moduleKey:'admin'},
  {label:'Learn',href:'/learn',moduleKey:'learn'},
 ]);
 assert.equal(contract.moduleManagementRoutes.learn,'/admin/learn');
 assert.equal(contract.moduleManagementRoutes.dashboard,undefined);
 assert.equal(contract.moduleManagementRoutes.admin,undefined);
 assert.equal(Object.keys(contract.moduleManagementRoutes).length,42);
 for(const definition of Object.values(contract.moduleDefinitions))assert.equal('route' in definition,false,'Appearance metadata must not mix route types');
 assert.deepEqual(clone(contract.moduleDefinitions.learn),{label:'Learn',icon:'BookOpen',color:'green'});
 assert.deepEqual(clone(initial.styles.learn),{icon:'BookOpen',color:'green'});
 const previous=clone(initial);
 previous.revision='50f2b3ba-b36e-450b-9c98-72afacbcc912';
 // Distinct saved choices exercise preservation of every existing Module, including Users.
 contract.moduleKeys.forEach((key,index)=>{previous.styles[key]={icon:contract.moduleIconNames[index%contract.moduleIconNames.length],color:Object.keys(contract.moduleColors)[index%Object.keys(contract.moduleColors).length]};});
 delete previous.styles.dashboard;delete previous.styles.admin;
 const beforeLearn=clone(previous);delete beforeLearn.styles.learn;
 const legacy=clone(beforeLearn);delete legacy.styles.users;
 const snapshots=[previous,beforeLearn,legacy];
 for(const stored of snapshots){
  const before=clone(stored),read=contract.readStoredModuleAppearance(stored);
  const expected={...clone(stored),styles:{...clone(initial.styles),...clone(stored.styles)}};
  if(!('users' in stored.styles))expected.styles.users=clone(initial.styles.users);
  assert.deepEqual(clone(read),expected);
  assert.deepEqual(stored,before,'compatibility reads must not mutate stored snapshots');
  assert(!contract.moduleAppearanceSnapshotSchema.safeParse(stored).success,'legacy snapshots are read-only compatibility, not accepted writes');
 }
 const current=clone(contract.readStoredModuleAppearance(previous));current.styles.learn={icon:'Star',color:'amber'};
 assert.deepEqual(clone(contract.readStoredModuleAppearance(current)),current,'current Learn choices and revision must survive reads');
 assert.equal(contract.readStoredModuleAppearance({...previous,revision:null}).revision,null);
 const missingUsers=clone(current);delete missingUsers.styles.users;
 const malformed=[
  null,missingUsers,
  {...previous,userId:'admin-id'},
  {...previous,revision:'not-a-revision'},
  {...previous,styles:{...previous.styles,unknown:initial.styles.models}},
  {...legacy,styles:{...legacy.styles,learn:initial.styles.learn}},
  {...previous,styles:{...previous.styles,learn:null}},
  {...previous,styles:{...previous.styles,dashboard:initial.styles.dashboard}},
  {...previous,styles:{...previous.styles,admin:initial.styles.admin}},
  {...previous,styles:{...previous.styles,models:{icon:'script',color:'blue'}}},
  {...legacy,styles:{...legacy.styles,models:{icon:'Box',color:'blue arbitrary-css'}}},
  {...previous,styles:{...previous.styles,users:{icon:'Users',color:'blue',extra:true}}},
 ];
 for(const bad of malformed)assert.throws(()=>contract.readStoredModuleAppearance(bad),'unknown and malformed stored values must not fall back to defaults');
 for(const stored of [...snapshots,current])for(const key of contract.moduleKeys.filter(key=>!['users','learn','dashboard','admin'].includes(key))){
  const incomplete=clone(stored);delete incomplete.styles[key];
  assert.throws(()=>contract.readStoredModuleAppearance(incomplete),`missing ${key} must be rejected`);
 }
 for(const bad of [{...initial,userId:'admin-id'},{...initial,styles:{...initial.styles,models:{icon:'script',color:'blue'}}},{...initial,styles:{...initial.styles,models:{icon:'Box',color:'blue arbitrary-css'}}}]) assert(!contract.moduleAppearanceSnapshotSchema.safeParse(bad).success);
 assert.equal(contract.moduleForPath('/dashboard'),'dashboard');
 assert.equal(contract.moduleForPath('/admin'),'admin');
 assert.equal(contract.moduleForPath('/administrator'),undefined);
 assert.equal(contract.moduleForPath('/dashboard-extra'),undefined);
 assert.equal(contract.moduleForPath('/admin/settings'),undefined);
 assert.equal(contract.moduleForPath('/learn'),'learn');
 assert.equal(contract.moduleForPath('/learn/topics'),'learn');
 assert.equal(contract.moduleForPath('/learning'),undefined);
 assert.equal(contract.moduleForPath('/admin/learn'),'learn');
 assert.equal(contract.moduleForPath('/admin/learn/new'),'learn');
 assert.equal(contract.moduleForPath('/admin/learning'),undefined);
 assert.equal(contract.moduleForPath('/admin/threed/models/5'),'models');
 assert.equal(contract.moduleForPath('/admin/threed/models-extra'),'threed');
 let res=await route.GET();assert.equal(res.status,200);assert.equal((await res.json()).canEdit,false);
 assert.equal((await route.PUT(request(initial))).status,401);assert.equal(data.row,null);
 session={user:{id:'admin-id'}};
 assert.equal((await route.PUT(request(initial,'https://evil.test'))).status,403);
 assert.equal((await route.PUT(request({...initial,userId:'other'}))).status,400);
 for(const invalid of [null,{role:'super_admin',active:true,deleted:true},{role:'admin',active:true},{role:'user',active:true},{role:'super_admin',active:false},{role:'super_admin',active:null}]){actor=invalid;assert.equal((await route.PUT(request(initial))).status,403);assert.equal(data.row,null);}
 actor={role:'super_admin',active:true,deleted:false};
 const changed=clone(initial);changed.styles.models={icon:'Leaf',color:'violet'};
 res=await route.PUT(request(changed));assert.equal(res.status,200);const saved=await res.json();assert(saved.revision);assert.equal(data.audits.length,1);assert(locks>0);
 session=null;res=await route.GET();assert.match(res.headers.get('cache-control'),/no-store/);const publicRead=await res.json();assert.equal(publicRead.snapshot.styles.models.icon,'Leaf');assert.equal(publicRead.canEdit,false);
 session={user:{id:'admin-id'}};assert.equal((await route.PUT(request(initial))).status,409);
 const results=await Promise.all([service.saveModuleAppearance('admin-id',saved).then(()=>true,()=>false),service.saveModuleAppearance('admin-id',saved).then(()=>true,()=>false)]);assert.deepEqual(results,[true,false]);
 const before=clone(data);failAudit=true;res=await route.PUT(request(data.row.value));assert.equal(res.status,503);assert(!JSON.stringify(await res.json()).includes('private diagnostic'));assert.deepEqual(data,before);failAudit=false;
 data.row.isSensitive=true;assert.equal((await route.GET()).status,503);assert.equal((await route.PUT(request(saved))).status,503);
 // Reading an existing installation upgrades the response only. Its first explicit save
 // persists all 42 styles with the original conflict stamp and the ordinary atomic audit.
 for(const stored of snapshots){
  data={row:{id:1,key:'app.module-appearance.v1',scope:'system',type:'json',isSensitive:false,value:clone(stored)},audits:[]};
  const original=clone(data);session=null;
  res=await route.GET();assert.equal(res.status,200);assert.match(res.headers.get('cache-control'),/no-store/);
  const read=await res.json();assert.equal(read.canEdit,false);
  assert.deepEqual(read.snapshot,clone(contract.readStoredModuleAppearance(stored)));
  assert.deepEqual(data,original,'public compatibility reads must not write or audit');
  session={user:{id:'admin-id'}};
  assert.equal((await route.PUT(request(stored))).status,400);
  await assert.rejects(()=>service.saveModuleAppearance('admin-id',stored));
  assert.equal((await route.PUT(request({...read.snapshot,revision:null}))).status,409);
  assert.deepEqual(data,original,'invalid or stale saves must preserve legacy data');
  const submitted=clone(read.snapshot);submitted.styles.dashboard={icon:'Star',color:'amber'};submitted.styles.admin={icon:'Leaf',color:'cyan'};
  res=await route.PUT(request(submitted));assert.equal(res.status,200);const migrated=await res.json();
  assert.notEqual(migrated.revision,stored.revision);assert(contract.moduleAppearanceSnapshotSchema.safeParse(migrated).success);
  assert.deepEqual(migrated.styles,submitted.styles);
  for(const [key,style] of Object.entries(stored.styles))assert.deepEqual(migrated.styles[key],style,`saving surface appearance must retain ${key}`);
  assert.deepEqual(data.row.value,migrated);assert.equal(data.audits.length,1);
  assert.deepEqual(data.audits[0].oldValue,read.snapshot);assert.deepEqual(data.audits[0].newValue,migrated);
  const persisted=clone(data);assert.equal((await route.PUT(request(submitted))).status,409);assert.deepEqual(data,persisted);
  session=null;res=await route.GET();assert.equal(res.status,200);assert.deepEqual((await res.json()).snapshot,migrated);
 }
 for(const bad of [missingUsers,{...previous,styles:{...previous.styles,unknown:initial.styles.models}}]){
  data.row.value=clone(bad);const original=clone(data);
  assert.equal((await route.GET()).status,503);
  session={user:{id:'admin-id'}};assert.equal((await route.PUT(request(current))).status,503);
  assert.deepEqual(data,original,'malformed stored snapshots must not be overwritten');session=null;
 }
 console.log('PASS Module appearance: strict 44-identity writes; exact 42/41/40-identity read compatibility; Learn defaults/routes; saved-style/revision preservation; public reads, active-Super-Admin writes, conflicts and audit rollback (mock persistence).');
})().catch(e=>{console.error(e);process.exitCode=1;});
