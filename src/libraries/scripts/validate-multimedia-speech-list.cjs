const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
let calls=[], signedIn=true;
const table=new Proxy({}, {get:(_,key)=>String(key)});
const db={select:()=>{const q={from(){return q},where(value){calls.push(['where',value]);return q},orderBy(...value){calls.push(['order',...value]);return q},limit(value){calls.push(['limit',value]);return q},offset(value){calls.push(['offset',value]);return Promise.resolve([])},then(resolve){resolve([{total:0}])}};return q}};
const output={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/multimedia/speech/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:output,require:name=>{
 if(name==='next/server')return{NextResponse:{json:(body,opts={})=>({body,status:opts.status??200})}};
 if(name==='@/libraries/auth')return{auth:async()=>signedIn?{user:{id:'owner'}}:null};
 if(name==='@/libraries/db/client')return{db};
 if(name==='@/libraries/schema/multimedia')return{multimediaSpeech:table};
 if(name==='drizzle-orm')return Object.fromEntries(['and','eq','asc','desc','ilike','isNull','isNotNull','count'].map(key=>[key,(...args)=>[key,...args]]));
 if(name.includes('speech-draft')||name.includes('speech-errors'))return{};
 throw Error(name);
}});
const get=query=>output.GET({nextUrl:new URL('https://app/api/speech?'+query)});
(async()=>{
 signedIn=false;assert.equal((await get('')).status,401);signedIn=true;
 for(const query of ['sort=unknown','sort=toString','direction=bad','limit=101','offset=-1'])assert.equal((await get(query)).status,400);
 assert.equal(calls.length,0);
 for(const field of ['title','id','acceptedVersionNumber','updatedAt']){
 calls=[];assert.equal((await get(`sort=${field}&direction=asc&limit=50&offset=50`)).status,200);
 assert.equal(JSON.stringify(calls.find(c=>c[0]==='order')),JSON.stringify(['order',['asc',field],['desc','id']]));
 assert.ok(JSON.stringify(calls).includes('["eq","userId","owner"]'));
 assert.ok(JSON.stringify(calls).includes('["offset",50]'));
 }
 console.log('PASS: Speech list owner scope, sorting allowlist, deterministic ordering and bounded server pagination (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
