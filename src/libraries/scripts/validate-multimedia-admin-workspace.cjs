const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
let signedIn=true,calls=[];
const table=(name,fields)=>Object.fromEntries(['id','userId',...fields].map(f=>[f,`${name}.${f}`]));
const tables={multimediaAlbums:table('albums',['title','artist','releaseYear','status','isPublic','sortOrder']),multimediaTracks:table('tracks',['title','albumId','duration','fileType','status','trackNumber']),multimediaMedia:table('media',['fileName','albumId','fileType','fileSize','isPrimary']),multimediaLinks:table('links',['title','albumId','trackId','type','status','displayOrder'])};
const db={select:()=>{const q={from(t){calls.push(['from',t.id]);return q},where(v){calls.push(['where',v]);return q},orderBy(...v){calls.push(['order',...v]);return q},limit(v){calls.push(['limit',v]);return q},offset(v){calls.push(['offset',v]);return Promise.resolve([])},then(resolve){resolve([{total:0}])}};return q}};
const ordering={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/libraries/services/multimedia/ordering.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:ordering});
const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/multimedia/admin-list/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:out,require:name=>{
 if(name==='@/libraries/services/multimedia/ordering')return ordering;
 if(name==='next/server')return{NextResponse:{json:(body,o={})=>({body,status:o.status??200})}};
 if(name==='@/libraries/auth')return{auth:async()=>signedIn?{user:{id:'owner'}}:null};
 if(name==='@/libraries/db/client')return{db};
 if(name==='@/libraries/schema/multimedia')return tables;
 if(name==='drizzle-orm')return{and:(...v)=>v,eq:(...v)=>v,count:()=>0,sql:(strings,...v)=>({strings:Array.from(strings),v})};throw Error(name);
}});
const get=query=>out.GET({nextUrl:new URL('https://app/api/multimedia/admin-list?'+query)});
(async()=>{
 signedIn=false;assert.equal((await get('kind=tracks')).status,401);signedIn=true;
 for(const query of ['kind=unknown','kind=constructor','kind=tracks&sort=lyrics','kind=tracks&direction=DROP','kind=albums&limit=201','kind=media&offset=-1'])assert.equal((await get(query)).status,400);
 assert.equal(calls.length,0);
 for(const query of ['kind=albums&albumId=1','kind=tracks&albumId=1x','kind=media&albumId=0','kind=tracks&trackId=2','kind=links&trackId=-1'])assert.equal((await get(query)).status,400);
 assert.equal(calls.length,0);
 calls=[];assert.equal((await get('kind=links&albumId=4&trackId=7&limit=25')).status,200);
 const parentScopes=calls.filter(c=>c[0]==='where');assert.deepEqual(parentScopes[0],parentScopes[1]);
 assert.ok(JSON.stringify(parentScopes).includes('links.albumId'));assert.ok(JSON.stringify(parentScopes).includes('links.trackId'));assert.ok(JSON.stringify(parentScopes).includes('owner'));
 for(const [kind,sort] of [['albums','artist'],['tracks','duration'],['media','fileSize'],['links','status']]){
 calls=[];assert.equal((await get(`kind=${kind}&sort=${sort}&direction=asc&search=test&limit=50&offset=50`)).status,200);
 const scopes=calls.filter(c=>c[0]==='where');assert.equal(scopes.length,2);assert.deepEqual(scopes[0],scopes[1]);assert.ok(JSON.stringify(scopes).includes(`${kind}.userId`));assert.ok(JSON.stringify(scopes).includes('owner'));
 assert.ok(JSON.stringify(calls.find(c=>c[0]==='order')).includes(`${kind}.${sort}`));assert.ok(JSON.stringify(calls).includes('["offset",50]'));
 }
 for(const [kind,field] of [['albums','sortOrder'],['tracks','trackNumber'],['links','displayOrder'],['media','id']]) {
  calls=[];assert.equal((await get('kind='+kind)).status,200);const order=calls.find(c=>c[0]==='order');assert.ok(JSON.stringify(order).includes(kind+'.'+field));assert.ok(JSON.stringify(order).includes(kind==='media'?'DESC':'ASC'));assert.ok(JSON.stringify(order).includes('NULLS LAST'));assert.equal(order[2],kind+'.id');
  if(kind!=='media')for(const direction of ['asc','desc']){calls=[];assert.equal((await get('kind='+kind+'&sort='+field+'&direction='+direction+'&limit=25&offset=25')).status,200);assert.ok(JSON.stringify(calls.find(c=>c[0]==='order')).includes(direction.toUpperCase()));const scopes=calls.filter(c=>c[0]==='where');assert.deepEqual(scopes[0],scopes[1]);}
 }
 console.log('PASS: Multimedia Admin list auth, module/sort allowlists, shared row/count owner-search scopes and paging (offline).');
})().catch(error=>{console.error(error);process.exitCode=1});
