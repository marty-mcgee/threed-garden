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
 const legacy=clone(initial);delete legacy.styles.users;
 assert.equal(contract.readStoredModuleAppearance(legacy).styles.users.icon,'Users');
 assert(!contract.moduleAppearanceSnapshotSchema.safeParse(legacy).success);
 for(const bad of [{...initial,userId:'admin-id'},{...initial,styles:{...initial.styles,models:{icon:'script',color:'blue'}}},{...initial,styles:{...initial.styles,models:{icon:'Box',color:'blue arbitrary-css'}}}]) assert(!contract.moduleAppearanceSnapshotSchema.safeParse(bad).success);
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
 console.log('PASS Module appearance: strict choices, public global reads, active-Super-Admin writes, origin, conflicts, audit rollback and redaction (mock persistence).');
})().catch(e=>{console.error(e);process.exitCode=1;});
