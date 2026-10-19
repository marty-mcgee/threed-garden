const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const orm = require('drizzle-orm'), pg = require('drizzle-orm/pg-core');
const table = (name, columns) => pg.pgTable(name, Object.fromEntries(columns.map(key => [key, key === 'id' || key.endsWith('Id') && key !== 'userId' || ['sortOrder','playCount','trackNumber','duration'].includes(key) ? pg.integer(key) : pg.text(key)])));
const tables = {
 multimediaAlbums: table('albums', ['id','userId','title','artist','coverArt','releaseYear','description','sortOrder','status','isPublic','createdAt']),
 multimediaTracks: table('tracks', ['id','userId','albumId','title','duration','trackNumber','fileUrl','fileType','status','playCount','createdAt']),
 multimediaLinks: table('links', ['id','userId','albumId','trackId','title','url','status','displayOrder','createdAt']),
 multimediaMedia: table('media', ['id','userId','albumId','fileUrl','isPrimary']),
 multimediaPlaybackHistory: table('history', ['id','userId','albumId','trackId']), multimediaSpeechVersions: table('versions', ['id']),
};
let userId = 'alice', queue = [], queries = [], writes = [], signed = [], txCount = 0, failUpdate = false;
const dialect = new pg.PgDialect();
const sqlText = value => dialect.sqlToQuery(orm.sql`${value}`).sql;
const db = {
 select() { const query = { from(){return query}, innerJoin(){return query}, leftJoin(){return query}, where(value){queries.push(sqlText(value));return query},
  orderBy(...value){queries.push(value.map(sqlText).join(','));return query}, limit(){return query}, offset(){return query}, for(){return query},
  then(resolve,reject){return Promise.resolve(queue.shift() || []).then(resolve,reject)} };return query; },
 insert(table) {return {values(value){writes.push({table:table[orm.Table.Symbol.Name],value});return {returning:async()=>[{id:20,...value}],then:resolve=>resolve()}}}},
 update(table) {return {set(value){return {where(){return {
  returning:async()=>{writes.push({table:table[orm.Table.Symbol.Name],value});return [{id:20,...value}]},
  then(resolve,reject){return Promise.resolve().then(()=>{if(failUpdate)throw Error('fixture rollback');writes.push({counter:value})}).then(resolve,reject)},
 }}}}}},
 delete() {return {where(){return {returning:async()=>{writes.push({deleted:true});return [{id:1}]}}}}},
 async transaction(fn){txCount++;const baseline=writes.length;try{return await fn(db)}catch(error){writes.splice(baseline);throw error}},
};
class Response {
 constructor(body, options={}) {this.body=body;this.status=options.status||200;this.headers=options.headers||{}};
 static json(body,options){return new Response(body,options)}
 static redirect(url,options={}){return new Response(null,{...options,status:307,headers:{...options.headers,Location:String(url)}})}
}
const mocks = {'next/server':{NextResponse:Response},'@/libraries/auth':{auth:async()=>userId?{user:{id:userId}}:null},
 '@/libraries/db/client':{db},'@/libraries/schema/multimedia':tables,'@/libraries/schema':tables,'drizzle-orm':orm,
 '@/libraries/db/sequence':{ensureTableSequence:async()=>{}},
 '@aws-sdk/client-s3':{S3Client:class{},GetObjectCommand:class{constructor(input){this.input=input}},PutObjectCommand:class{},HeadObjectCommand:class{}},
 '@aws-sdk/s3-request-presigner':{getSignedUrl:async(_,command)=>{signed.push(command.input);return 'https://storage.invalid/signed'}},
};
const env={AWS_REGION:'fixture',S3_BUCKET_NAME:'fixture'};
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {exports,URL,console:{log(){},error:console.error},process:{env},require:name=>{assert.ok(name in mocks,name);return mocks[name]}});return exports;}
const policy = load('src/libraries/services/multimedia/upload-policy.ts');mocks['./upload-policy']=policy;mocks['@/libraries/services/multimedia/upload-policy']=policy;
const access=load('src/libraries/services/multimedia/access.ts');mocks['./access']=access;mocks['@/libraries/services/multimedia/access']=access;
const authority=load('src/libraries/services/multimedia/authority.ts');mocks['./authority']=authority;mocks['@/libraries/services/multimedia/authority']=authority;
const fileAccess=load('src/libraries/services/multimedia/file-access.ts');mocks['@/libraries/services/multimedia/file-access']=fileAccess;
const albums=load('src/app/api/multimedia/albums/route.ts'), tracks=load('src/app/api/multimedia/tracks/route.ts'), links=load('src/app/api/multimedia/links/route.ts');
const media=load('src/app/api/multimedia/media/route.ts');
const files=load('src/app/api/multimedia/files/route.ts'), stream=load('src/app/api/multimedia/stream/[trackId]/route.ts'), playback=load('src/app/api/multimedia/playback/track/route.ts');
const poll=load('src/app/api/multimedia/poll/route.ts'),cron=load('src/app/api/multimedia/cron/route.ts');
const request=(query='',body={})=>({url:'https://app.invalid/api/multimedia/albums?'+query,nextUrl:new URL('https://app.invalid/api/multimedia/files?'+query),json:async()=>body,headers:{get:()=>null}});
const album={id:1,userId:'alice',isPublic:true,status:'published',title:'Visible',sortOrder:1,metadata:{secret:true}};
const track={id:2,albumId:1,userId:'alice',status:'active',title:'Visible',fileUrl:'https://example.invalid/audio.mp3',metadata:{secret:true}};
const key='threed/users/alice/multimedia/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/song.mp3';
(async()=>{
 // Execute the real write/read handlers: valid ranks must survive persistence
 // boundaries, and a title-only update must preserve existing zero/null ranks.
 for(const [api,rank] of [[albums,'sortOrder'],[tracks,'trackNumber'],[links,'displayOrder']]) {
  const fields={title:'Ordered',artist:'Artist',coverArt:'https://example.invalid/cover.png',fileUrl:'https://example.invalid/track.mp3',url:'https://example.invalid',albumId:1};
  for(const value of [-10000,0,10000,undefined]) {
   userId='alice';queue=api===albums?[]:[[album]];writes=[];
   const created=await api.POST(request('',{...fields,...(value===undefined?{}:{[rank]:value})}));
   assert.equal(created.status,200);assert.equal(created.body.data[rank],value??0);
   assert.equal(writes.at(-1).value[rank],value??0);
  }
  for(const saved of [-10000,0,10000,null]) {
   const existing={...fields,id:20,userId:'alice',status:'active',isPublic:true,[rank]:saved};
   for(const change of [{title:'Renamed'},{[rank]:0},{[rank]:-10000},{[rank]:10000}]) {
    queue=api===albums?[[existing]]:[[existing],[album]];writes=[];
    const updated=await api.PUT(request('id=20',change));
    assert.equal(updated.status,200);
    const expected=Object.hasOwn(change,rank)?change[rank]:saved;
    assert.equal(updated.body.data[rank],expected);assert.equal(writes.at(-1).value[rank],expected);
    const stored={...existing,...updated.body.data};queue=[[stored]];
    const reloaded=await api.GET(request('id=20&scope=owner'));
    assert.equal(reloaded.status,200);assert.equal(reloaded.body.data[rank],expected);
    assert.equal(access.publicRecord(api===albums?'album':api===tracks?'track':'link',stored)[rank],expected);
   }
  }
 }
 queue=[];writes=[];
 for(const [api,key] of [[albums,'sortOrder'],[tracks,'trackNumber'],[links,'displayOrder']]){
  for(const invalid of [-10001,10001,0.5,'0',true]){
   for(const method of ['POST','PUT']){
    queue=[];writes=[];const response=await api[method](request('id=1',{[key]:invalid}));
    assert.equal(response.status,400);assert.equal(writes.length,0);
   }
  }
 }

 for(const viewer of [undefined,'alice','bob'])for(const owner of ['alice','bob',null])for(const status of ['active','inactive'])for(const publicFlag of [true,false])for(const albumStatus of ['published','draft','archived']){
  const value={...track,userId:owner,status}, parent={...album,isPublic:publicFlag,status:albumStatus};
  assert.equal(access.canReadTrack(viewer,value,parent),Boolean(viewer&&viewer===owner)||Boolean(owner==='alice'&&status==='active'&&publicFlag&&albumStatus==='published'));
 }
 for(const id of [0,-1,'1x',true,{},Infinity])assert.equal(access.positiveId(id),null);
 assert.equal(access.ownsFileReference('bob','/api/multimedia/files?key='+encodeURIComponent(key)),false);
 assert.ok(!JSON.stringify(access.publicRecord('album',{...album,tracks:[track],links:[{userId:'alice',metadata:{secret:true}}]})).includes('secret'));
 queue=[[]];assert.equal(await authority.ownedParents('bob',1,null),null);assert.ok(queries.at(-1).includes('userId'));
 queue=[[{id:1}],[{albumId:3}]];assert.equal(await authority.ownedParents('alice',1,2),null);
 assert.equal(await authority.ownedParents('alice',false,null),null);
 queue=[[{id:1}],[{albumId:1}],[{id:1}]];assert.equal((await authority.ownedParents('alice',1,2)).trackId,2);
 userId=undefined;queue=[[album],[track],[],[]];let result=await albums.GET(request('id=1&scope=public&includeTracks=true&includeLinks=true&includeMedia=true'));
 assert.equal(result.status,200);assert.equal(result.body.data.userId,undefined);assert.equal(result.body.data.metadata,undefined);assert.equal(result.body.data.tracks[0].metadata,undefined);
 assert.ok(queries.some(q=>q.includes('published')&&q.includes('userId')));
 assert.ok(queries.some(q=>q.includes('EXISTS')&&q.includes('tracks')));
 assert.ok(queries.some(q=>q.includes('trackNumber')&&q.includes('ASC NULLS LAST')&&q.includes('"tracks"."id" asc')));
 assert.ok(queries.some(q=>q.includes('displayOrder')&&q.includes('ASC NULLS LAST')&&q.includes('"links"."id" asc')));
 queue=[[{count:2}],[album]];queries=[];result=await albums.GET(request('scope=public'));assert.equal(result.status,200);assert.ok(queries.at(-1).includes('sortOrder')&&queries.at(-1).includes('NULLS LAST'));
 queue=[[track]];result=await tracks.GET(request('scope=public'));assert.equal(result.body.data[0].userId,undefined);
 for(const scope of ['owner','public']) {
  userId='alice';queries=[];queue=[[{count:1}],[album]];assert.equal((await albums.GET(request('scope='+scope))).status,200);
  assert.ok(queries.at(-1).includes('sortOrder')&&queries.at(-1).includes('ASC NULLS LAST')&&queries.at(-1).includes('"albums"."id" asc'));
  queries=[];queue=[[track]];assert.equal((await tracks.GET(request('scope='+scope+'&albumId=1'))).status,200);
  assert.ok(queries.at(-1).includes('trackNumber')&&queries.at(-1).includes('ASC NULLS LAST'));
 }
 queries=[];queue=[[]];assert.equal((await links.GET(request())).status,200);
 assert.ok(queries.at(-1).includes('displayOrder')&&queries.at(-1).includes('ASC NULLS LAST')&&queries.at(-1).includes('"links"."id" asc'));
 userId='bob';queue=[[]];writes=[];result=await links.POST(request('',{title:'foreign',url:'https://example.invalid',albumId:1}));assert.equal(result.status,400);assert.equal(writes.length,0);
 queue=[[{id:1}],[{albumId:1}],[{id:1}]];userId='alice';result=await links.POST(request('',{title:'owned',url:'https://example.invalid',albumId:1,trackId:2}));assert.equal(result.status,200);assert.equal(writes.at(-1).value.userId,'alice');
 userId='bob';queue=[[{id:5,userId:'bob',albumId:1,trackId:null}],[]];result=await links.PUT(request('id=5',{title:'edit'}));assert.equal(result.status,400);
 userId='alice';writes=[];queue=[[album],[{id:7}]];assert.equal((await albums.DELETE(request('id=1'))).status,409);assert.equal(writes.length,0);
 queue=[[]];assert.equal((await albums.DELETE(request('id=1'))).status,404);assert.equal(writes.length,0);
 queue=[[album],[],[],[],[]];assert.equal((await albums.DELETE(request('id=1'))).status,200);assert.equal(writes.length,1);
 userId='bob';writes=[];
 for(const api of [albums,tracks,media]){result=await api.POST(request('',{title:'foreign',coverArt:'/api/multimedia/files?key='+encodeURIComponent(key),fileUrl:'/api/multimedia/files?key='+encodeURIComponent(key)}));assert.equal(result.status,400);assert.equal(writes.length,0);}
 queue=[[]];assert.equal((await tracks.PUT(request('id=2',{title:'edit'}))).status,404);
 queue=[[]];assert.equal((await media.PUT(request('id=2',{fileName:'edit'}))).status,404);
 // Anonymous exact-public-object delivery; a foreign or unreferenced key never reaches signing.
 // Primary is a presentation flag, not Album Media publication permission.
 const galleryItems=[false,false,true].map((isPrimary,index)=>({id:30+index,albumId:1,userId:'alice',isPrimary,fileUrl:'/api/multimedia/files?key='+encodeURIComponent(key),metadata:{secret:true}}));
 for(const list of [false,true]) {
  userId=undefined;queries=[];queue=list?[[{count:1}],[album],galleryItems]:[[album],galleryItems];
  result=await albums.GET(request('scope=public&includeMedia=true'+(list?'':'&id=1')));
  assert.equal(result.status,200);
  const returned=list?result.body.data[0]:result.body.data;
  assert.equal(returned.media.length,3);assert.equal(returned.media[0].isPrimary,false);
  assert.equal(returned.media[0].userId,undefined);assert.equal(returned.media[0].metadata,undefined);
  const mediaScope=queries.find(q=>q.includes('"media"."albumId"'));
  assert.ok(mediaScope.includes('"media"."userId"'));assert.ok(!mediaScope.includes('isPrimary'));
  assert.ok(queries.some(q=>q.includes('"albums"."isPublic"')&&q.includes('"albums"."status"')));
 }
 userId=undefined;queries=[];queue=[[],[],[{userId:'alice'}]];signed=[];
 result=await files.GET(request('key='+encodeURIComponent(key)));
 assert.equal(result.status,307);assert.equal(signed[0].Key,key);
 const fileScope=queries.at(-1);
 assert.ok(fileScope.includes('"media"."fileUrl"')&&fileScope.includes('"media"."userId" = "albums"."userId"'));
 assert.ok(fileScope.includes('"albums"."isPublic"')&&fileScope.includes('"albums"."status"'));
 assert.ok(!fileScope.includes('isPrimary'));
 queue=[[],[],[{userId:'bob'}]];assert.equal(await fileAccess.isPublicMediaKey(key),false);
 userId=undefined;queue=[[{userId:'alice'}]];signed=[];result=await files.GET(request('key='+encodeURIComponent(key)));assert.equal(result.status,307);assert.equal(signed[0].Key,key);
 for(const viewer of [undefined,'bob']){userId=viewer;queue=[[],[],[]];signed=[];result=await files.GET(request('key='+encodeURIComponent(key)));assert.equal(result.status,404);assert.equal(signed.length,0);}
 queue=[[{userId:'bob'}],[],[]];assert.equal(await fileAccess.isPublicMediaKey(key),false);
 userId='alice';queue=[];assert.equal((await files.GET(request('key='+encodeURIComponent(key)))).status,307);assert.equal(queue.length,0);
 for(const viewer of [undefined,'bob'])for(const albumStatus of ['published','draft']){
  userId=viewer;queue=[[{track,album:{...album,status:albumStatus}}]];result=await stream.GET(request(),{params:Promise.resolve({trackId:'2'})});assert.equal(result.status,albumStatus==='published'?307:404);
 }
 userId='bob';queue=[[{track:{...track,userId:'bob'},album}]];assert.equal((await stream.GET(request(),{params:Promise.resolve({trackId:'2'})})).status,307); // Track owner retains reads.
 queue=[[{track,album:{...album,userId:'bob',isPublic:false}}]];assert.equal((await stream.GET(request(),{params:Promise.resolve({trackId:'2'})})).status,404); // Album ownership is not Track ownership.
 queue=[[{track:{...track,fileUrl:'albums/99/private.mp3'},album}]];assert.equal((await stream.GET(request(),{params:Promise.resolve({trackId:'2'})})).status,404);
 userId='bob';writes=[];queue=[[{...album,status:'draft'}],[track]];result=await playback.POST(request('',{trackId:2,albumId:1}));assert.equal(result.status,404);assert.equal(writes.length,0);
 queue=[[album],[]];result=await playback.POST(request('',{trackId:2,albumId:9}));assert.equal(result.status,404);assert.equal(writes.length,0);
 queue=[[album],[track]];result=await playback.POST(request('',{trackId:2,albumId:1,playDuration:0}));assert.equal(result.status,200);assert.equal(writes[0].value.userId,'bob');assert.equal(writes[0].value.playDuration,0);assert.equal(writes.length,2);
 queue=[[album],[track]];writes=[];failUpdate=true;result=await playback.POST(request('',{trackId:2,albumId:1}));failUpdate=false;assert.equal(result.status,400);assert.equal(writes.length,0);
 userId=undefined;const before=txCount;assert.equal((await playback.POST(request('',{trackId:2,albumId:1}))).status,401);assert.equal(txCount,before);
 assert.equal((await poll.GET()).status,405);assert.equal((await poll.POST()).status,405);
 assert.equal((await cron.GET(request())).status,401);env.CRON_SECRET='fixture';assert.equal((await cron.GET(request())).status,401);
 const cronRequest=request();cronRequest.headers.get=()=> 'Bearer fixture';assert.equal((await cron.GET(cronRequest)).status,503);
 console.log('PASS: Multimedia authority matrix, real SQL scopes, public serializers, parent ownership, private/public object delivery, streaming, atomic listener reports and retired global operations (mocked DB/storage; no live calls).');
})().catch(error=>{console.error(error);process.exitCode=1});
