// Real NextAuth configuration and declared ownership tables; no live DB/session.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const orm=require('drizzle-orm'),pg=require('drizzle-orm/pg-core');
const cache=new Map();let config,account,compares=0;
const db={select(){return {from(table){return {where(){return {limit:async()=>orm.getTableName(table)==='user_accounts'?[{password:'hashed'}]:account?[account]:[]};}};}};}};
const mocks={
 'server-only':{},'@/libraries/db/client':{db},
 'next-auth':{default:options=>{config=options;return {}; }},
 'next-auth/providers/credentials':{default:options=>options},
 '@auth/drizzle-adapter':{DrizzleAdapter:()=>({createUser:async value=>value})},
 'bcryptjs':{default:{compare:async()=>{compares++;return true;}}},
};
function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename);const exports={};cache.set(filename,exports);
 const resolve=name=>{
  if(name in mocks)return mocks[name];
  if(name.startsWith('.')||name.startsWith('@/')){let p=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(filename),name);p=fs.existsSync(p+'.ts')?p+'.ts':path.join(p,'index.ts');return load(p);}
  return require(name);
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:resolve,console,process:{env:{}},TextEncoder});return exports;
}
(async()=>{
 load('src/libraries/auth/index.ts');
 const authorize=config.providers[0].authorize;
 account={id:'a',name:'Name',email:'a@example.test',isDeleted:false};
 assert.equal((await authorize({email:account.email,password:'password1'})).id,'a');assert.equal(compares,1);
 for(const denied of [true,undefined,null]){account.isDeleted=denied;assert.equal(await authorize({email:account.email,password:'password1'}),null);assert.equal(await config.callbacks.jwt({token:{id:'a'}}),null);}
 assert.equal(compares,1,'Deleted accounts must not reach password comparison');
 account=null;assert.equal(await config.callbacks.jwt({token:{id:'a'}}),null);
 account={id:'a',name:'Edited',email:'edited@example.test',isDeleted:false};
 const token=await config.callbacks.jwt({token:{id:'a',name:'Old',email:'old@example.test'}});assert.equal(token.email,account.email);assert.equal(token.name,account.name);
 account.isDeleted=true;assert.equal(await config.callbacks.jwt({token}),null,'Existing JWT denied after external flag edit');
 const content=load('src/libraries/services/users/content.ts');
 const names=content.userContentTables.map(x=>orm.getTableName(x.table));
 for(const required of ['project','threed_models','multimedia_lyrics','multimedia_albums','multimedia_tracks','threed_watering_schedules'])assert(names.includes(required),required);
 assert.equal(new Set(names).size,names.length);assert(!names.includes('user_accounts'));assert(names.length>50);
 const dialect=new pg.PgDialect();let matches=null,calls=0;
 const tx={select(){return {from(table){return {where(condition){const q=dialect.sqlToQuery(condition);assert.equal(q.params[0],'target');calls++;return {limit:async n=>{assert.equal(n,1);return orm.getTableName(table)===matches?[{owner:'target'}]:[];}};}};}};}};
 assert.equal(await content.findUserContent(tx,'target'),null);assert.equal(calls,names.length);
 matches='threed_models';assert.equal(await content.findUserContent(tx,'target'),'threed models');
 matches='threed_watering_schedules';assert.equal(await content.findUserContent(tx,'target'),'threed watering schedules');
 console.log('PASS User access: actual NextAuth credentials/JWT deletion denial, refreshed profile and '+names.length+' declared content ownership checks (mock DB).');
})().catch(error=>{console.error(error);process.exitCode=1;});
