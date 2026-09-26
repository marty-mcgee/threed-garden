const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
let signedIn=true, queue=[], deletes=0, objects=[], fail=false;
const table=name=>new Proxy({}, {get:(_,key)=>name+'.'+key});
const db={select:()=>({from(){return this},where(){return this},limit:async()=>queue.shift()}),delete:()=>({where(){return this},returning:async()=>{deletes++;return [{id:7}]}})};
const mocks={'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}},'@/libraries/auth':{auth:async()=>signedIn?{user:{id:'owner'}}:null},'@/libraries/db/client':{db},'@/libraries/schema/multimedia':{multimediaTracks:table('tracks'),multimediaAlbums:table('albums'),multimediaMedia:table('media'),multimediaSpeechVersions:table('speechVersions')},'drizzle-orm':{eq:(...v)=>v,ne:(...v)=>v,and:(...v)=>v},'@/libraries/db/sequence':{},'@aws-sdk/client-s3':{S3Client:class{async send(command){if(fail)throw Error();objects.push(command.input)}},DeleteObjectCommand:class{constructor(input){this.input=input}}}};
function load(path){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,console,process:{env:{AWS_REGION:'fixture',S3_BUCKET_NAME:'fixture'}},require:name=>{assert.ok(name in mocks,name);return mocks[name]}});return exports;}
mocks['@/libraries/services/multimedia/upload-policy']=load('src/libraries/services/multimedia/upload-policy.ts');
const api=load('src/app/api/multimedia/tracks/route.ts');
const key='threed/users/owner/multimedia/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/song.wav';
const track={id:7,fileUrl:'/api/multimedia/files?key='+encodeURIComponent(key)};
const run=()=>api.DELETE({url:'https://app/api/multimedia/tracks?id=7'});
(async()=>{
 signedIn=false;assert.equal((await run()).status,401);signedIn=true;
 queue=[[]];assert.equal((await run()).status,404);assert.equal(deletes,0);
 queue=[[track],[],[],[],[]];assert.equal((await run()).body.fileCleanup,'deleted');assert.equal(objects[0].Key,key);assert.equal(deletes,1);
 for(let i=0;i<4;i++){queue=[[track],[],[],[],[]];queue[i+1]=[{id:9}];assert.equal((await run()).body.fileCleanup,'shared');}assert.equal(objects.length,1);
 fail=true;queue=[[track],[],[],[],[]];const before=deletes;assert.equal((await run()).status,502);assert.equal(deletes,before);
 queue=[[{...track,fileUrl:track.fileUrl.replace('owner','other')}]];assert.equal((await run()).status,409);
 queue=[[{...track,fileUrl:'https://example.com/song.wav'}]];assert.equal((await run()).body.fileCleanup,'unmanaged');assert.equal(objects.length,1);
 console.log('PASS: Track deletion auth, missing Track, S3 removal, shared references, foreign keys, unmanaged URLs and retry on S3 failure (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
