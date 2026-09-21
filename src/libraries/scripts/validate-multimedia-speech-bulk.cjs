const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/app/admin/multimedia/speech/page.tsx','utf8');
const handler=source.slice(source.indexOf('  async function archive('),source.indexOf('  const lastPage =',source.indexOf('  async function archive(')));
let calls=[],notice='',error='',busy=false,refresh=0;
const lock={current:false};const exportsObject={};
vm.runInNewContext(ts.transpileModule(handler+'\nexports.run=archive;', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
 exports:exportsObject,lock,archived:false,setBusy:v=>busy=v,setError:v=>error=v,setNotice:v=>notice=v,setSelected:()=>{},setRefresh:fn=>refresh=fn(refresh),
 fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return{ok:!url.endsWith('/2'),json:async()=>({error:'Revision conflict'})};}
});
(async()=>{
 await exportsObject.run([{id:1,title:'One',revision:4,archivedAt:null},{id:2,title:'Two',revision:7,archivedAt:null},{id:3,title:'Three',revision:9,archivedAt:null}]);
 assert.equal(calls.length,3);assert.equal(calls[1].body.revision,7);assert.equal(calls[0].body.archived,true);
 assert.equal(notice,'2 Speech records archived.');assert.equal(error,'Two: Revision conflict');assert.equal(refresh,1);assert.equal(busy,false);assert.equal(lock.current,false);
 lock.current=true;await exportsObject.run([{id:4}]);assert.equal(calls.length,3);
 console.log('PASS: actual Speech bulk handler preserves revisions, reports partial failures, refreshes and excludes duplicate actions (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
