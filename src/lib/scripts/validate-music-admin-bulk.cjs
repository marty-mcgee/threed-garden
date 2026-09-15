const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/components/admin/music/shared/MusicRecordsWorkspace.tsx','utf8');
const start=source.indexOf('  async function removeSelected()');
const end=source.indexOf('\n  return { rows',start);
let calls=[],notice='',error='',refreshed=0,confirmed=true;
const lock={current:false};const out={};
vm.runInNewContext(ts.transpileModule(source.slice(start,end)+'\nexports.run=removeSelected;', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:out,rows:[{id:1},{id:2}],selected:new Set([1,2,99]),kind:'tracks',lock,window:{confirm:()=>confirmed},setBusy:()=>{},setError:v=>error=v,setNotice:v=>notice=v,setSelected:()=>{},reload:()=>refreshed++,fetch:async(url)=>{calls.push(url);return{ok:!url.endsWith('=2'),json:async()=>({error:'File retained'})}}});
(async()=>{
 confirmed=false;await out.run();assert.equal(calls.length,0);
 confirmed=true;await out.run();assert.deepEqual(calls,['/api/music/tracks?id=1','/api/music/tracks?id=2']);assert.equal(notice,'1 deleted.');assert.equal(error,'#2: File retained');assert.equal(refreshed,1);assert.equal(lock.current,false);
 lock.current=true;await out.run();assert.equal(calls.length,2);
 console.log('PASS: actual Music bulk handler confirmation, page-scoped selection, partial failures and duplicate exclusion (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
