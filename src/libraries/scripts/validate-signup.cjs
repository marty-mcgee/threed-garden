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


const contract=load('src/libraries/auth/signup-contract.ts',{}, {TextEncoder});
const roles=load('src/libraries/config/user-roles.ts',{});
const schema=load('src/libraries/schema/auth/index.ts',{});
let rows=[],accounts=[],fail=false,queue=Promise.resolve();

function select(){return {from(){return {where(condition){
 const email=new pg.PgDialect().sqlToQuery(condition).params[0];
 return {limit:async()=>rows.filter(row=>row.email.toLowerCase()===email)};
}};}};}
function insert(table){return {values(value){
 if(table===schema.User)return {returning:async()=>{const row={...value,id:String(rows.length+1)};rows.push(row);return [{id:row.id}];}};
 if(fail)throw Error('private SQL error');accounts.push(value);return Promise.resolve();
}};}
const db={transaction(fn){
 const run=queue.then(async()=>{const before=JSON.parse(JSON.stringify({rows,accounts}));
 try{return await fn({execute:async()=>{},select,insert});}
 catch(error){rows=before.rows;accounts=before.accounts;throw error;}});
 queue=run.catch(()=>{});return run;
}};
const service=load('src/libraries/auth/register.ts',{'server-only':{},bcryptjs:{default:{hash:async(password,cost)=>{assert.equal(cost,12);return 'hashed:'+password}}},'@/libraries/db/client':{db},'@/libraries/schema/auth':schema,'@/libraries/config/user-roles':roles,'./signup-contract':contract});
const route=load('src/app/api/auth/register/route.ts',{'@/libraries/auth/signup-contract':contract,'@/libraries/auth/register':service},{Buffer});
const input={name:' New User ',email:'NEW@example.test',password:'safe-password'};
const request=(body,origin='https://example.test')=>new Request('https://example.test/api/auth/register',{method:'POST',headers:{origin},body:JSON.stringify(body)});
(async()=>{
 assert.equal((await route.POST(request(input,'https://evil.test'))).status,403);
 for(const bad of [{...input,role:'super_admin'},{...input,password:'short'},{...input,password:'x'.repeat(73)},{...input,name:' '},{...input,email:'bad'}])assert.equal((await route.POST(request(bad))).status,400);
 assert.equal((await route.POST(request({...input,name:'x'.repeat(5000)}))).status,413);assert.equal(rows.length,0);
 fail=true;assert.equal((await route.POST(request(input))).status,503);assert.equal(rows.length,0);assert.equal(accounts.length,0);fail=false;
 const results=await Promise.all([route.POST(request(input)),route.POST(request({...input,email:'new@example.test'}))]);assert.deepEqual(results.map(r=>r.status),[201,409]);assert.equal(rows.length,1);assert.equal(rows[0].role,'admin');assert.equal(rows[0].isActive,true);assert.equal(rows[0].email,'new@example.test');assert.equal(accounts[0].password,'hashed:safe-password');assert.equal(accounts[0].userId,rows[0].id);assert.equal(accounts[0].provider,'credentials');
 assert.deepEqual(await results[0].json(),{created:true});
 console.log('PASS signup: strict role-free input, origin/body bounds, App Admin default, hash boundary, atomic rollback and duplicate case-insensitive registration (mock DB/hash).');
})().catch(error=>{console.error(error);process.exitCode=1});
