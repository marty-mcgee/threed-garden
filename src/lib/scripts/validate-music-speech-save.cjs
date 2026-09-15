const fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript'), assert=require('node:assert/strict');
const source=fs.readFileSync('src/components/admin/music/audio/SaveSpeechTrack.tsx','utf8');
const start=source.indexOf('  async function save()');
const end=source.indexOf('\n  return <section',start);
let calls=[],saved=false,uncertain=false, failure=null;
const controllerRef={current:null},uploaded={current:null};
const context={controllerRef,uploaded,albumId:'5',title:'My Speech',speech:{blob:new Blob(['audio']),text:'Original speech',voiceId:'voice'},AbortController,Error,Number,JSON,
 setBusy(){},onBusyChange(){},setError(){},setStatus(){},setSaved:v=>saved=v,setUncertain:v=>uncertain=v,
 fetch:async(url,options)=>{calls.push({url,options});if(url==='/api/music/tracks'&&failure==='network')throw Error('network');return {ok:true,status:200,json:async()=>url==='/api/music/files'?(JSON.parse(options.body).action==='start'?{url:'https://s3.fixture/put',contentType:'audio/mpeg',key:'key'}:{fileUrl:'/api/music/files?key=key',fileType:'audio/mpeg',fileSize:5}):{success:true,data:{id:1}}};}};
Object.defineProperties(context,{saved:{get:()=>saved},uncertain:{get:()=>uncertain}});
vm.createContext(context);
vm.runInContext(ts.transpileModule(source.slice(start,end)+'\nglobalThis.save=save;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
(async()=>{
 await Promise.all([context.save(),context.save()]);assert.equal(calls.length,4);assert.equal(saved,true);
 const data=JSON.parse(calls.at(-1).options.body);assert.equal(data.lyrics,'Original speech');assert.equal(data.metadata.voiceId,'voice');assert.equal(data.metadata.model,'s2.1-pro-free');assert.equal(data.albumId,5);assert.equal(data.fileUrl,'/api/music/files?key=key');
 await context.save();assert.equal(calls.length,4);
 saved=false;failure='network';await context.save();assert.equal(uncertain,true);assert.equal(calls.length,5);await context.save();assert.equal(calls.length,5);
 assert.ok(uploaded.current);console.log('PASS: Speech save uses existing S3/Track APIs, preserves preview provenance, reuses uploaded file and guards duplicate/uncertain registration (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
