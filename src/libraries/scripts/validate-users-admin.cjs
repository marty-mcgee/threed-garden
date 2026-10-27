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


const contracts=load('src/libraries/services/users/contracts.ts',{});
const authSchema=load('src/libraries/schema/auth/index.ts',{});
const auditSchema=load('src/libraries/schema/auth/user-role-audit.ts',{});
const dialect=new pg.PgDialect();
let rows=[],audits=[],failAudit=false,queue=Promise.resolve(),session=null,locks=0;
const reset=()=>{rows=[{id:'a',name:'Admin',email:'a@example.test',role:'super_admin',isActive:true,stamp:'1'},{id:'b',name:'Other',email:'b@example.test',role:'super_admin',isActive:true,stamp:'1'},{id:'c',name:'User',email:'c@example.test',role:'admin',isActive:true,stamp:'1'}];audits=[];failAudit=false;};
function select(fields){let condition;const chain={from(){return chain},where(c){condition=c;return chain},orderBy(){return chain},limit(){return chain},offset(){return chain},for(){return chain},then(resolve,reject){return Promise.resolve().then(()=>{
 const q=condition?dialect.sqlToQuery(condition):{params:[]};
 let found=q.params.length===1?rows.filter(r=>r.id===q.params[0]):q.params.includes('super_admin')?rows.filter(r=>r.role==='super_admin'&&r.isActive===true):rows;
 if(fields.count)return [{count:found.length}];
 if(fields.active)return found.map(r=>({role:r.role,active:r.isActive}));
 return found.map(r=>({...r}));
 }).then(resolve,reject)}};return chain;}

function update() {
 return {set(value){
  assert.deepEqual(Object.keys(value).sort(),['role','updatedAt']);
  return {where(condition){return {async returning(){
   const row=rows.find(r=>r.id===dialect.sqlToQuery(condition).params[0]);
   row.role=value.role;row.stamp=String(Number(row.stamp)+1);return [{...row}];
  }}}};
 }};
}
function insert(){return {async values(value){if(failAudit)throw Error('sensitive SQL diagnostic');audits.push(value);}};}
const db={select,transaction(fn){
 const run=queue.then(async()=>{
  const before=JSON.parse(JSON.stringify({rows,audits}));
  try{return await fn({select,update,insert,async execute(statement){assert.match(dialect.sqlToQuery(statement).sql,/pg_advisory_xact_lock/);locks++;}});}
  catch(error){rows=before.rows;audits=before.audits;throw error;}
 });queue=run.catch(()=>{});return run;
}};
const service=load('src/libraries/services/users/admin.ts',{'server-only':{},'@/libraries/db/client':{db},'@/libraries/schema/auth':authSchema,'@/libraries/schema/auth/user-role-audit':auditSchema,'./contracts':contracts});
const http=load('src/libraries/services/users/http.ts',{'./admin':service});
const dependencies={'@/libraries/auth':{auth:async()=>session},'@/libraries/services/users/admin':service,'@/libraries/services/users/http':http};
const route=load('src/app/api/admin/users/[id]/route.ts',dependencies);
const ctx=id=>({params:Promise.resolve({id})});
const patch=(value,origin='https://example.test')=>new Request('https://example.test/api/admin/users/b',{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(value)});
(async()=>{
 reset();assert.equal((await route.GET(null,ctx('b'))).status,401);
 session={user:{id:'c'}};assert.equal((await route.GET(null,ctx('b'))).status,403);
 rows[2].role='super_admin';rows[2].isActive=false;assert.equal((await route.GET(null,ctx('b'))).status,403);reset();
 session={user:{id:'a'}};
 let result=await route.GET(null,ctx('b'));assert.equal(result.status,200);assert.match(result.headers.get('cache-control'),/no-store/);let target=await result.json();assert.deepEqual(Object.keys(target).sort(),['email','id','isActive','name','revision','role']);
 let change={role:'admin',revision:target.revision};
 assert.equal((await route.PATCH(patch(change,'https://evil.test'),ctx('b'))).status,403);
 assert.equal((await route.PATCH(patch({...change,isActive:false}),ctx('b'))).status,400);
 assert.equal((await route.PATCH(patch({...change,role:'superadmin'}),ctx('b'))).status,400);
 failAudit=true;result=await route.PATCH(patch(change),ctx('b'));assert.equal(result.status,503);assert(!JSON.stringify(await result.json()).includes('sensitive SQL'));assert.equal(rows[1].role,'super_admin');assert.equal(audits.length,0);failAudit=false;
 result=await route.PATCH(patch(change),ctx('b'));assert.equal(result.status,200);assert.equal(audits.length,1);assert.equal(audits[0].actorUserId,'a');
 assert.equal((await route.PATCH(patch(change),ctx('b'))).status,409);
 target=await service.readAdminUser('a','a');await assert.rejects(()=>service.updateAdminUserRole('a','a',{role:'admin',revision:target.revision}),/last active Super Admin/);
 reset();const a=await service.readAdminUser('a','a'),b=await service.readAdminUser('b','b');
 const concurrent=await Promise.allSettled([service.updateAdminUserRole('a','a',{role:'admin',revision:a.revision}),service.updateAdminUserRole('b','b',{role:'admin',revision:b.revision})]);
 assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);assert.equal(rows.filter(r=>r.role==='super_admin'&&r.isActive).length,1);assert(locks>0);
 assert(!contracts.userListQuerySchema.safeParse({page:0}).success);
 console.log('PASS Users roles: active-Super-Admin reads/writes, strict input, origin, projection, stale revisions, last-Super-Admin serialization and atomic audit rollback (mock DB).');
})().catch(error=>{console.error(error);process.exitCode=1;});
