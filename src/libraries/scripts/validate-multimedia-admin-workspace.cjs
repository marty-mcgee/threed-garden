const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
let signedIn=true,calls=[];
const table=(name,fields)=>Object.fromEntries(['id','userId',...fields].map(f=>[f,`${name}.${f}`]));
const tables={multimediaAlbums:table('albums',['title','artist','releaseYear','status','isPublic','sortOrder']),multimediaTracks:table('tracks',['title','albumId','duration','fileType','status','trackNumber']),multimediaMedia:table('media',['sortOrder','fileName','albumId','fileType','fileSize','isPrimary']),multimediaLinks:table('links',['title','albumId','trackId','type','status','displayOrder'])};
tables.multimediaLyrics=table('lyrics',['title','sortOrder','isActive','updatedAt']);
const db={select:()=>{const q={from(t){calls.push(['from',t.id]);return q},where(v){calls.push(['where',v]);return q},orderBy(...v){calls.push(['order',...v]);return q},limit(v){calls.push(['limit',v]);return q},offset(v){calls.push(['offset',v]);return Promise.resolve([])},then(resolve){resolve([{total:0}])}};return q}};
const ordering={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/libraries/services/multimedia/ordering.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:ordering});
const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/multimedia/admin-list/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:out,require:name=>{
 if(name==='@/libraries/services/multimedia/ordering')return ordering;
 if(name==='next/server')return{NextResponse:{json:(body,o={})=>({body,status:o.status??200})}};
 if(name==='@/libraries/auth')return{auth:async()=>signedIn?{user:{id:'owner'}}:null};
 if(name==='@/libraries/db/client')return{db};
 if(name==='@/libraries/schema/multimedia')return tables;
 if(name==='@/libraries/schema/project')return{project:table('projects',['name'])};
 if(name==='drizzle-orm')return{and:(...v)=>v,eq:(...v)=>v,count:()=>0,sql:(strings,...v)=>({strings:Array.from(strings),v})};throw Error(name);
}});
const get=query=>out.GET({nextUrl:new URL('https://app/api/multimedia/admin-list?'+query)});
(async()=>{
 signedIn=false;assert.equal((await get('kind=tracks')).status,401);signedIn=true;
 for(const query of ['kind=unknown','kind=constructor','kind=tracks&sort=lyrics','kind=tracks&direction=DROP','kind=albums&limit=201','kind=media&offset=-1'])assert.equal((await get(query)).status,400);
 assert.equal(calls.length,0);
 for(const query of ['kind=albums&albumId=1','kind=tracks&albumId=1x','kind=media&albumId=0','kind=tracks&trackId=2','kind=links&trackId=-1','kind=lyrics&albumId=1','kind=lyrics&trackId=1','kind=lyrics&sort=content','kind=lyrics&sort=albums','kind=lyrics&sort=tracks','kind=lyrics&sort=projects'])assert.equal((await get(query)).status,400);
 assert.equal(calls.length,0);
 calls=[];assert.equal((await get('kind=links&albumId=4&trackId=7&limit=25')).status,200);
 const parentScopes=calls.filter(c=>c[0]==='where');assert.deepEqual(parentScopes[0],parentScopes[1]);
 assert.ok(JSON.stringify(parentScopes).includes('links.albumId'));assert.ok(JSON.stringify(parentScopes).includes('links.trackId'));assert.ok(JSON.stringify(parentScopes).includes('owner'));
 for(const [kind,sort] of [['albums','artist'],['tracks','duration'],['media','fileSize'],['links','status']]){
 calls=[];assert.equal((await get(`kind=${kind}&sort=${sort}&direction=asc&search=test&limit=50&offset=50`)).status,200);
 const scopes=calls.filter(c=>c[0]==='where');assert.equal(scopes.length,2);assert.deepEqual(scopes[0],scopes[1]);assert.ok(JSON.stringify(scopes).includes(`${kind}.userId`));assert.ok(JSON.stringify(scopes).includes('owner'));
 assert.ok(JSON.stringify(calls.find(c=>c[0]==='order')).includes(`${kind}.${sort}`));assert.ok(JSON.stringify(calls).includes('["offset",50]'));
 }
 for(const [kind,field] of [['albums','sortOrder'],['tracks','trackNumber'],['links','displayOrder'],['media','sortOrder'],['lyrics','sortOrder']]) {
  calls=[];assert.equal((await get('kind='+kind)).status,200);const order=calls.find(c=>c[0]==='order');assert.ok(JSON.stringify(order).includes(kind+'.'+field));assert.ok(JSON.stringify(order).includes('ASC'));assert.ok(JSON.stringify(order).includes('NULLS LAST'));assert.equal(order[2],kind+'.id');
  for(const direction of ['asc','desc']){calls=[];assert.equal((await get('kind='+kind+'&sort='+field+'&direction='+direction+'&limit=25&offset=25')).status,200);assert.ok(JSON.stringify(calls.find(c=>c[0]==='order')).includes(direction.toUpperCase()));const scopes=calls.filter(c=>c[0]==='where');assert.deepEqual(scopes[0],scopes[1]);}
 }
 // Run the actual generated list/enrichment SELECTs against in-memory fixtures.
 // This shared SQL subset check does not contact PostgreSQL, auth or a live server.
 const {DatabaseSync}=require('node:sqlite'),pg=require('drizzle-orm/pg-core'),orm=require('drizzle-orm'),{drizzle}=require('drizzle-orm/pg-proxy');
 function load(file,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,Map,require:name=>{assert(name in deps,name);return deps[name]}});return exports;}
 const project=pg.pgTable('project',{id:pg.serial('id').primaryKey(),userId:pg.text('user_id'),name:pg.text('name')});
 const schema=load('src/libraries/schema/multimedia/index.ts',{'drizzle-orm':orm,'drizzle-orm/pg-core':pg,'../auth':{user:pg.pgTable('user',{id:pg.text('id').primaryKey()})},'../project':{project,projectMultimedia:pg.pgTable('project_multimedia',{id:pg.serial('id')})}});
 const memory=new DatabaseSync(':memory:');
 try {
  memory.exec(`
   CREATE TABLE multimedia_lyrics (id INTEGER PRIMARY KEY, user_id TEXT, title TEXT, sort_order INTEGER, is_active INTEGER, updated_at TEXT, content TEXT, metadata TEXT);
   CREATE TABLE multimedia_albums (id INTEGER PRIMARY KEY, user_id TEXT, title TEXT, is_public INTEGER, status TEXT);
   CREATE TABLE multimedia_tracks (id INTEGER PRIMARY KEY, user_id TEXT, title TEXT, status TEXT);
   CREATE TABLE project (id INTEGER PRIMARY KEY, user_id TEXT, name TEXT);
   CREATE TABLE multimedia_lyrics_albums (lyrics_id INTEGER, album_id INTEGER, UNIQUE(lyrics_id,album_id));
   CREATE TABLE multimedia_lyrics_tracks (lyrics_id INTEGER, track_id INTEGER, UNIQUE(lyrics_id,track_id));
   CREATE TABLE multimedia_lyrics_projects (lyrics_id INTEGER, project_id INTEGER, UNIQUE(lyrics_id,project_id));
   INSERT INTO multimedia_lyrics VALUES
    (7,'owner','First',0,1,'2026-10-26','Private content','Private metadata'),
    (8,'owner','Second',0,1,'2026-10-26','Private content','Private metadata'),
    (9,'owner','Third',0,0,'2026-10-26','Private content','Private metadata'),
    (10,'other','Foreign',0,1,'2026-10-26','Foreign content','Foreign metadata');
   INSERT INTO multimedia_albums VALUES (11,'owner','Zulu',0,'draft'),(12,'owner','Alpha',1,'published'),(13,'owner','Alpha',0,'draft'),(14,'other','Foreign',1,'published'),(15,NULL,'No owner',1,'published');
   INSERT INTO multimedia_tracks VALUES (21,'owner','Zulu Track','inactive'),(22,'owner','Alpha Track','active'),(23,'other','Foreign Track','active'),(24,NULL,'No owner Track','active');
   INSERT INTO project VALUES (31,'owner','Garden'),(32,'owner','Home'),(33,'other','Foreign Project'),(34,NULL,'No owner Project');
   INSERT INTO multimedia_lyrics_albums VALUES (7,11),(7,13),(7,12),(7,14),(7,15),(7,999),(8,12),(9,11),(10,11);
   INSERT INTO multimedia_lyrics_tracks VALUES (7,21),(7,22),(7,23),(7,24),(7,999),(8,21),(9,22),(10,22);
   INSERT INTO multimedia_lyrics_projects VALUES (7,32),(7,31),(7,33),(7,34),(7,999),(8,31),(9,32),(10,31);
  `);
  let queries=[],owner='owner',beforeQuery;
  const sqlDb=drizzle(async(sql,params)=>{
   queries.push({sql,params});beforeQuery?.(sql);
   const statement=memory.prepare(sql);statement.setReturnArrays(true);
   return{rows:statement.all(Object.fromEntries(params.map((value,index)=>[`$${index+1}`,typeof value==='boolean'?Number(value):value])))};
  });
  const api=load('src/app/api/multimedia/admin-list/route.ts',{
   'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status??200,headers:options.headers})}},
   '@/libraries/auth':{auth:async()=>owner?{user:{id:owner}}:null},'@/libraries/db/client':{db:sqlDb},
   '@/libraries/schema/multimedia':schema,'@/libraries/schema/project':{project},'drizzle-orm':orm,'@/libraries/services/multimedia/ordering':ordering,
  });
  const read=query=>api.GET({nextUrl:new URL('https://fixture/api/multimedia/admin-list?kind=lyrics&'+query)});
  const plain=value=>JSON.parse(JSON.stringify(value));
  const result=await read('limit=2');assert.equal(result.status,200);assert.equal(result.headers['Cache-Control'],'private, no-store');
  assert.equal(result.body.total,3);assert.deepEqual(plain(result.body.data.map(row=>row.id)),[7,8]);
  assert.deepEqual(plain(result.body.data[0].albums),[{id:12,title:'Alpha'},{id:13,title:'Alpha'},{id:11,title:'Zulu'}]);
  assert.deepEqual(plain(result.body.data[0].tracks),[{id:22,title:'Alpha Track'},{id:21,title:'Zulu Track'}],'Owned inactive Track assignments remain visible in Admin');
  assert.deepEqual(plain(result.body.data[0].projects),[{id:31,title:'Garden'},{id:32,title:'Home'}],'Project name maps to title');
  assert.deepEqual(plain(result.body.data[1].albums),[{id:12,title:'Alpha'}]);
  assert.deepEqual(plain(result.body.data[1].tracks),[{id:21,title:'Zulu Track'}]);
  assert.deepEqual(plain(result.body.data[1].projects),[{id:31,title:'Garden'}]);
  assert(!JSON.stringify(result.body).includes('Private'));assert(!JSON.stringify(result.body).includes('Foreign'));
  assert.deepEqual(Object.keys(result.body.data[0]).sort(),['albums','id','isActive','projects','sortOrder','title','tracks','updatedAt']);
  assert.equal(queries.length,5,'One page, one count and three batch reads regardless of page size');
  for(const [index,parent,title] of [[2,'multimedia_albums','title'],[3,'multimedia_tracks','title'],[4,'project','name']]){
   const query=queries[index];assert.match(query.sql,/"multimedia_lyrics"\."id" in \(/);
   assert.deepEqual(query.params,[7,8,'owner','owner'],'Association scope contains only returned IDs and both owners');
   assert(query.sql.includes('"multimedia_lyrics"."user_id" ='));assert(query.sql.includes('"'+parent+'"."user_id" ='));
   assert(query.sql.includes('order by "'+parent+'"."'+title+'" asc, "'+parent+'"."id" asc'));
   assert(!query.sql.includes('"content"'));assert(!query.sql.includes('"metadata"'));
  }
  queries=[];const next=await read('limit=2&offset=2');assert.equal(next.body.total,3);assert.deepEqual(plain(next.body.data.map(row=>row.id)),[9]);assert.equal(queries.length,5);
  assert.deepEqual(plain(next.body.data[0].albums),[{id:11,title:'Zulu'}]);
  queries=[];const empty=await read('offset=100');assert.deepEqual(plain(empty.body),{data:[],total:3});assert.equal(queries.length,2,'Empty pages do not query any junction');
  owner='other';queries=[];const foreign=await read('');assert.deepEqual(plain(foreign.body.data.map(row=>row.id)),[10]);
  for(const key of ['albums','tracks','projects'])assert.deepEqual(plain(foreign.body.data[0][key]),[],'Foreign parent links are never disclosed');
  owner='owner';queries=[];
  beforeQuery=sql=>{if(sql.includes('from "multimedia_lyrics_albums"'))memory.exec("UPDATE multimedia_lyrics SET user_id='other' WHERE id=7");};
  const changedOwner=await read('limit=2');
  for(const key of ['albums','tracks','projects'])assert.deepEqual(plain(changedOwner.body.data.find(row=>row.id===7)[key]),[],'Enrichment rechecks the Lyrics owner after paging');
  beforeQuery=undefined;memory.exec("UPDATE multimedia_lyrics SET user_id='owner' WHERE id=7");
  owner=null;queries=[];assert.equal((await read('')).status,401);assert.equal(queries.length,0);
  owner='owner';beforeQuery=sql=>{if(sql.includes('from "multimedia_lyrics_tracks"'))throw Error('private database details');};
  const failure=await read('');assert.equal(failure.status,503);assert(!JSON.stringify(failure.body).includes('private database details'));assert.equal(failure.body.data,undefined,'No partially enriched page on failure');
 } finally {memory.close();}
 console.log('PASS: Multimedia Admin list auth, sort/search/paging, page-scoped Lyrics association batches, both-owner joins, ordered labels, empty/failed pages and minimal fields (offline SQL fixtures; no live database).');
})().catch(error=>{console.error(error);process.exitCode=1});
