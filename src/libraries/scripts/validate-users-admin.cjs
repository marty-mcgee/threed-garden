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

const signup=load('src/libraries/auth/signup-contract.ts',{}, {TextEncoder});
const contracts=load('src/libraries/services/users/contracts.ts',{'@/libraries/auth/signup-contract':signup});
const schema=load('src/libraries/schema/auth/index.ts',{});
const audit=load('src/libraries/schema/auth/user-role-audit.ts',{});
const roles=load('src/libraries/config/user-roles.ts',{});
const dialect=new pg.PgDialect();
let rows,accounts,audits,failAudit,failAccount,session,content,queue=Promise.resolve(),locks=0;
const clone=v=>JSON.parse(JSON.stringify(v));
function reset(){rows=['a','b','c'].map((id,i)=>({id,name:id,email:id+'@example.test',role:i<2?'super_admin':'admin',isActive:true,isDeleted:false,stamp:'1'}));accounts=[];audits=[];failAudit=false;failAccount=false;content=null;}
function select(fields){let table,condition,cap=Infinity,offset=0;const chain={from(t){table=t;return chain},where(c){condition=c;return chain},orderBy(){return chain},limit(v){cap=v;return chain},offset(v){offset=v;return chain},for(){return chain},then(resolve,reject){return Promise.resolve().then(()=>{
 assert.equal(table,schema.User);const q=condition?dialect.sqlToQuery(condition):{sql:'',params:[]};let found=rows;
 if(q.sql.includes('lower('))found=found.filter(r=>r.email.toLowerCase()===q.params[0]&&(!q.sql.includes('<>')||r.id!==q.params[1]));
 else if(q.sql.includes('"id" ='))found=found.filter(r=>r.id===q.params[0]);
 else {
  if(q.sql.includes('"role" ='))found=found.filter(r=>r.role===q.params.find(x=>typeof x==='string'));
  if(q.sql.includes('"is_active" ='))found=found.filter(r=>r.isActive===true);
  if(q.sql.includes('"is_deleted" ='))found=found.filter(r=>r.isDeleted===q.params[q.params.length-1]);
 }
 if(fields.count)return [{count:found.length}];
 if(fields.active)return found.map(r=>({role:r.role,active:r.isActive,deleted:r.isDeleted}));
 if(Object.keys(fields).length===1&&fields.id)return found.slice(0,cap).map(r=>({id:r.id}));
 return found.slice(offset,offset+cap).map(r=>({...r}));
 }).then(resolve,reject)}};return chain;}
function insert(table){return {values(value){const run=()=>{
 if(table===schema.User){const row={...value,id:'new-'+rows.length,stamp:'1'};rows.push(row);return [{id:row.id}];}
 if(table===schema.UserAccounts){if(failAccount)throw Error('account failure');accounts.push(value);return [];}
 assert.equal(table,audit.userRoleAudit);if(failAudit)throw Error('sensitive SQL diagnostic');audits.push(value);return [];
 };return {returning:async()=>run(),then:(resolve,reject)=>Promise.resolve().then(run).then(resolve,reject)};}};}
function update(table){assert.equal(table,schema.User);return {set(value){assert(!('password' in value));return {where(condition){return {async returning(){const row=rows.find(r=>r.id===dialect.sqlToQuery(condition).params[0]);Object.assign(row,value);delete row.updatedAt;row.stamp=String(Number(row.stamp)+1);return [{...row}];}};}};}};}
const db={select,transaction(fn){const run=queue.then(async()=>{const before=clone({rows,accounts,audits});try{return await fn({select,insert,update,async execute(statement){assert.match(dialect.sqlToQuery(statement).sql,/pg_advisory_xact_lock/);locks++;}});}catch(error){({rows,accounts,audits}=before);throw error;}});queue=run.catch(()=>{});return run;}};
const bcrypt={default:{hash:async(p,c)=>{assert.equal(c,12);return 'hash:'+p;}}};
const register=load('src/libraries/auth/register.ts',{'server-only':{},bcryptjs:bcrypt,'@/libraries/db/client':{db},'@/libraries/schema/auth':schema,'@/libraries/config/user-roles':roles,'./signup-contract':signup});
const service=load('src/libraries/services/users/admin.ts',{'server-only':{},bcryptjs:bcrypt,'@/libraries/db/client':{db},'@/libraries/schema/auth':schema,'@/libraries/schema/auth/user-role-audit':audit,'./contracts':contracts,'./content':{findUserContent:async()=>content},'@/libraries/auth/register':register});
const http=load('src/libraries/services/users/http.ts',{'./admin':service,'@/libraries/auth/register':register},{Buffer});
const modules={'@/libraries/auth':{auth:async()=>session},'@/libraries/services/users/admin':service,'@/libraries/services/users/http':http};
const route=load('src/app/api/admin/users/[id]/route.ts',modules),list=load('src/app/api/admin/users/route.ts',modules);
const ctx=id=>({params:Promise.resolve({id})});
const request=(body,method='PATCH',origin='https://example.test')=>new Request('https://example.test/api/admin/users/b',{method,headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
(async()=>{
 reset();assert.equal((await route.GET(null,ctx('b'))).status,401);
 session={user:{id:'c'}};assert.equal((await route.GET(null,ctx('b'))).status,403);
 assert.equal((await list.POST(request({name:'New',email:'new@example.test',password:'password1'},'POST'))).status,403);
 rows[2].role='super_admin';rows[2].isActive=false;assert.equal((await route.GET(null,ctx('b'))).status,403);
 rows[2].isActive=true;rows[2].isDeleted=true;assert.equal((await route.GET(null,ctx('b'))).status,403);reset();session={user:{id:'a'}};
 let response=await route.GET(null,ctx('b')),target=await response.json();assert.equal(response.status,200);assert.deepEqual(Object.keys(target).sort(),['email','id','isActive','isDeleted','name','revision','role']);
 let change={role:'admin',revision:target.revision};
 assert.equal((await route.PATCH(request(change,'PATCH','https://evil.test'),ctx('b'))).status,403);
 assert.equal((await route.PATCH(request({...change,isDeleted:true}),ctx('b'))).status,400);
 failAudit=true;assert.equal((await route.PATCH(request(change),ctx('b'))).status,503);assert.equal(rows[1].role,'super_admin');assert.equal(audits.length,0);failAudit=false;
 assert.equal((await route.PATCH(request(change),ctx('b'))).status,200);assert.equal(audits.length,1);assert.equal((await route.PATCH(request(change),ctx('b'))).status,409);
 target=await service.readAdminUser('a','a');await assert.rejects(()=>service.updateAdminUserRole('a','a',{role:'admin',revision:target.revision}),/last active/);
 reset();const a=await service.readAdminUser('a','a'),b=await service.readAdminUser('b','b');
 const concurrent=await Promise.allSettled([service.updateAdminUserRole('a','a',{role:'admin',revision:a.revision}),service.updateAdminUserRole('b','b',{role:'admin',revision:b.revision})]);assert.equal(concurrent.filter(x=>x.status==='fulfilled').length,1);
 reset();const input={name:'New',email:'NEW@example.test',password:'password1'};
 for(const extra of [{role:'super_admin'},{isDeleted:false},{id:'chosen'}])assert.equal((await list.POST(request({...input,...extra},'POST'))).status,400);
 failAccount=true;assert.equal((await list.POST(request(input,'POST'))).status,503);assert.equal(rows.length,3);failAccount=false;
 const created=await list.POST(request(input,'POST'));assert.equal(created.status,201);const newUser=await created.json();assert.equal(newUser.role,'admin');assert.equal(newUser.isDeleted,false);assert.equal(accounts[0].password,'hash:password1');assert(!JSON.stringify(newUser).includes('password'));
 assert.equal((await list.POST(request(input,'POST'))).status,409);
 let edit={name:'Changed',email:'changed@example.test',role:'super_admin',revision:newUser.revision};
 failAudit=true;assert.equal((await route.PATCH(request(edit),ctx(newUser.id))).status,503);assert.equal(rows[3].name,'New');failAudit=false;
 assert.equal((await route.PATCH(request(edit),ctx(newUser.id))).status,200);target=await service.readAdminUser('a',newUser.id);assert.equal(target.name,'Changed');assert.equal(rows[3].emailVerified,null);
 assert.equal((await route.PATCH(request({...edit,email:'A@example.test',revision:target.revision}),ctx(newUser.id))).status,409);
 const deletion={revision:target.revision,confirmEmail:target.email};content='project';assert.equal((await route.DELETE(request(deletion,'DELETE'),ctx(newUser.id))).status,409);assert.equal(rows[3].isDeleted,false);content=null;
 assert.equal((await route.DELETE(request({...deletion,confirmEmail:'wrong@example.test'},'DELETE'),ctx(newUser.id))).status,400);
 assert.equal((await route.DELETE(request(deletion,'DELETE','https://evil.test'),ctx(newUser.id))).status,403);
 assert.equal((await route.DELETE(request(deletion,'DELETE'),ctx(newUser.id))).status,200);assert.equal(rows.length,4);assert.equal(rows[3].isDeleted,true);assert.equal(accounts.length,1);assert.equal(audits.length,1);
 assert.equal((await list.POST(request({...input,email:target.email},'POST'))).status,409);
 assert.equal((await service.listAdminUsers('a',{})).data.length,3);assert.equal((await service.listAdminUsers('a',{status:'deleted'})).data.length,1);
 assert.equal((await route.PATCH(request({...edit,revision:(await service.readAdminUser('a',newUser.id)).revision}),ctx(newUser.id))).status,404);
 target=await service.readAdminUser('a','a');await assert.rejects(()=>service.softDeleteAdminUser('a','a',{revision:target.revision,confirmEmail:target.email}),/own account/);
 assert(locks>0);console.log('PASS Users CRUD: Super Admin-only create/profile/role/soft-delete, App defaults, atomic rollback, duplicate email, content/self-delete protection, deleted filters and stale revisions (mock persistence).');
})().catch(error=>{console.error(error);process.exitCode=1;});
