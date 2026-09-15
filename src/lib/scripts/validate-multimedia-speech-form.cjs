const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/app/admin/multimedia/speech/new/page.tsx','utf8');
const handlers=source.slice(source.indexOf('  async function persist('),source.indexOf('\n  return <div'));
let requests=[],fail=false,audio=null,uncertain=false;
const savedRef={current:null},requestRef={current:null};
const context={exports:{},AbortController,encodeURIComponent,crypto:{randomUUID:()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},savedRef,requestRef,
 title:'Welcome',text:'Hello',voiceId:'a'.repeat(32),uncertain:false,
 setSaved:()=>{},setBusy:()=>{},setError:()=>{},setNotice:()=>{},setTitle:()=>{},setText:()=>{},setVoiceId:()=>{},
 setUncertain:value=>{uncertain=value;context.uncertain=value;},setAudio:value=>audio=value,
 fetch:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});if(fail)throw Error('network');return{ok:true,json:async()=>url.endsWith('/versions')?{data:{status:'ready',storageKey:'saved/key.mp3',versionNumber:1}}:{data:{id:5,revision:requests.length}}};},
};
vm.runInNewContext(ts.transpileModule(handlers+'\nexports.run = saveOrGenerate;', {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,context);
(async()=>{
 await context.exports.run(false);assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/multimedia/speech');assert.equal(audio,null);
 await context.exports.run(true);assert.equal(requests[1].url,'/api/multimedia/speech/5');assert.equal(requests[1].body.revision,1);assert.equal(requests[2].url,'/api/multimedia/speech/5/versions');assert.equal(audio.url,'/api/music/files?key=saved%2Fkey.mp3');
 fail=true;const preview=audio;await context.exports.run(true);assert.equal(audio,preview);assert.equal(uncertain,true);const count=requests.length;await context.exports.run(true);assert.equal(requests.length,count);
 assert.equal(requestRef.current,null);
 console.log('PASS: full-page Speech saves before generation, reuses saved identity/revision, plays durable audio and blocks ambiguous retries (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
