const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
let signedIn=true,queue=[],writes=[],providerCalls=0,storageCalls=0,providerOk=true,storageOk=true,conditions=[];
const table=name=>new Proxy({}, {get:(_,key)=>`${name}.${String(key)}`});
const speech=table('speech'),versions=table('versions');
const next=()=>{assert.ok(queue.length,'unexpected database query');return queue.shift();};
const db={
 select:()=>{const q={from(){return q},where(c){conditions.push(c);return q},orderBy(){return q},for:async()=>next(),limit:async()=>next()};return q;},
 insert:t=>({values:v=>{writes.push({t,v});return{returning:async()=>[{...v,id:11}]}}}),
 update:t=>({set:v=>{writes.push({t,v});const q={where(){return q},returning:async()=>[{...v,id:11}],then(resolve){resolve([])}};return q;}}),
 transaction:fn=>fn(db),
};
function load(path,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Buffer,Date,AbortSignal,process:{env:{FISH_AUDIO_API_KEY:'fixture',AWS_REGION:'fixture',S3_BUCKET_NAME:'fixture'}},require:name=>{assert.ok(name in mocks,name);return mocks[name]}});return exports;}
const contract=load('src/lib/services/multimedia/speech-draft.ts',{});
const api=load('src/app/api/multimedia/speech/[id]/versions/route.ts',{
 'next/server':{NextRequest:class{constructor(url,opts){this.url=url;Object.assign(this,opts)}},NextResponse:{json:(body,opts={})=>({body,status:opts.status??200})}},
 '@/lib/auth':{auth:async()=>signedIn?{user:{id:'owner'}}:null},'@/lib/db/client':{db},
 '@/lib/schema/multimedia':{multimediaSpeech:speech,multimediaSpeechVersions:versions},
 '@/lib/services/multimedia/speech-draft':contract,
 '@/lib/services/music/upload-policy':{ownerPrefix:id=>`threed/users/${id}/multimedia/`},
 'drizzle-orm':{and:(...v)=>v,eq:(...v)=>v,desc:v=>v,inArray:(...v)=>v,sql:(...v)=>v},
 '@aws-sdk/client-s3':{S3Client:class{async send(){storageCalls++;if(!storageOk)throw Error("storage unavailable");return{ContentLength:3,ContentType:'audio/mpeg'}}},PutObjectCommand:class{},HeadObjectCommand:class{}},
 '@/app/api/music/audio/generate/route':{POST:async()=>{providerCalls++;return{ok:providerOk,arrayBuffer:async()=>Buffer.from('mp3'),json:async()=>({providerStatus:402})}}},
});
const draft={id:5,revision:1,text:'Hello',voiceId:'a'.repeat(32),provider:'fish-audio',model:'s2.1-pro-free',settings:{},archivedAt:null};
const context={params:Promise.resolve({id:'5'})};
const body={revision:1,requestId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'};
const req=b=>({url:'https://app/api/speech',json:async()=>b,signal:new AbortController().signal});
// Drizzle's awaiting of an unbounded select is needed for in-flight checks.
const originalSelect=db.select;db.select=()=>{const q=originalSelect();q.then=resolve=>resolve(next());return q;};
(async()=>{
 signedIn=false;assert.equal((await api.POST(req(body),context)).status,401);signedIn=true;
 assert.equal((await api.POST(req({...body,requestId:'bad'}),context)).status,400);
 queue=[[]];assert.equal((await api.POST(req(body),context)).status,404);
 queue=[[draft],[{id:11,status:'ready'}]];assert.equal((await api.POST(req(body),context)).body.reused,true);assert.equal(providerCalls,0);
 queue=[[{...draft,revision:2}],[]];assert.equal((await api.POST(req(body),context)).status,409);
 queue=[[draft],[],[{createdAt:new Date()}]];assert.equal((await api.POST(req(body),context)).status,409);
 queue=[[draft],[],[],[]];assert.equal((await api.POST(req(body),context)).status,201);assert.equal(providerCalls,1);assert.equal(storageCalls,2);
 const inserted=writes.find(w=>w.t===versions&&w.v.text);
 assert.equal(inserted.v.text,'Hello');assert.ok(inserted.v.storageKey.endsWith('/speech-5-v1.mp3'));
 assert.ok(!writes.some(w=>w.t===speech));
 assert.ok(JSON.stringify(conditions).includes('speech.userId'));
 providerOk=false;queue=[[draft],[],[],[{number:1}]];
 assert.equal((await api.POST(req(body),context)).status,502);
 assert.equal(writes.at(-1).v.providerStatus,402);assert.equal(writes.at(-1).v.status,'failed');
 providerOk=true;storageOk=false;queue=[[draft],[],[],[{number:2}]];
 assert.equal((await api.POST(req(body),context)).status,502);assert.equal(writes.at(-1).v.errorCode,'STORAGE_FAILED');
 storageOk=true;queue=[[draft],[],[{id:8,createdAt:new Date(Date.now()-11*60*1000)}],[{number:3}]];
 assert.equal((await api.POST(req(body),context)).status,201);assert.ok(writes.some(w=>w.v.status==='interrupted'));
 assert.ok(!writes.some(w=>w.t===speech));
 queue=[[draft],[]];assert.equal((await api.PATCH(req({revision:1,versionNumber:1}),context)).status,409);
 queue=[[draft],[{versionNumber:1}]];assert.equal((await api.PATCH(req({revision:1,versionNumber:1}),context)).status,200);
 assert.equal(writes.at(-1).t,speech);assert.equal(writes.at(-1).v.acceptedVersionNumber,1);
 queue=[[{...draft,revision:2}]];assert.equal((await api.PATCH(req({revision:1,versionNumber:1}),context)).status,409);
 assert.equal(queue.length,0);
 console.log('PASS: actual version routes — auth, reservation replay, revision conflicts, in-flight exclusion, saved input/output, provider failure, and explicit acceptance (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
