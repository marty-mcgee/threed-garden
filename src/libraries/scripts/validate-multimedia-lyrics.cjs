// Execute real schema, parser, service and route against offline persistence doubles.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const pg=require('drizzle-orm/pg-core'),orm=require('drizzle-orm');
function load(file,deps={}){const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,TextEncoder,Buffer,URL,require:name=>{assert(name in deps,name);return deps[name]}});return out;}
const user=pg.pgTable('user',{id:pg.text('id').primaryKey()});
const project=pg.pgTable('project',{id:pg.serial('id').primaryKey(),userId:pg.text('user_id'),name:pg.text('name')});
const schema=load('src/libraries/schema/multimedia/index.ts',{'drizzle-orm':orm,'drizzle-orm/pg-core':pg,'../auth':{user},'../project':{project,projectMultimedia:pg.pgTable('project_multimedia',{id:pg.serial('id')})}});
const lyrics=schema.multimediaLyrics,config=pg.getTableConfig(lyrics);
assert.equal(config.name,'multimedia_lyrics');
assert(config.columns.find(c=>c.name==='user_id').notNull);
assert(!config.columns.some(c=>['project_id','album_id','track_id'].includes(c.name)),'Lyrics have no mandatory parent');
assert(schema.multimediaTracks.lyrics,'Legacy Track lyrics stays intact');
for(const [table,parent] of [[schema.multimediaLyricsProjects,'project_id'],[schema.multimediaLyricsAlbums,'album_id'],[schema.multimediaLyricsTracks,'track_id']]){
 const c=pg.getTableConfig(table);assert(c.uniqueConstraints.some(u=>u.columns.map(c=>c.name).join()===`lyrics_id,${parent}`));
 assert.equal(c.foreignKeys.length,2);assert(c.foreignKeys.every(fk=>fk.onDelete==='cascade'));
 const source=c.foreignKeys.find(fk=>fk.reference().columns[0].name==='lyrics_id');assert.equal(source.reference().foreignTable,lyrics);
}
const input=load('src/libraries/services/multimedia/lyrics-input.ts');
const standalone=input.parseLyricsInput({title:' Standalone '});assert.equal(standalone.title,'Standalone');assert.equal(standalone.projectIds.length,0);assert.equal(standalone.sortOrder,0);
assert.equal(input.parseLyricsInput({title:'Reusable',trackIds:[3,2,3],albumIds:[1],projectIds:[17]}).trackIds.join(),'2,3');
for(const bad of [{title:''},{title:'x',userId:'other'},{title:'x',sortOrder:10001},{title:'x',sortOrder:1.5},{title:'x',isActive:'true'},{title:'x',metadata:[]},{title:'x',metadata:{huge:'x'.repeat(17000)}},{title:'x',content:'x'.repeat(100001)},{title:'x',trackIds:[0]},{title:'x',albumIds:Array(101).fill(1)}])assert.throws(()=>input.parseLyricsInput(bad));
const serviceModule=load('src/libraries/services/multimedia/lyrics-service.ts',{'drizzle-orm':orm,'@/libraries/schema/project':{project},'@/libraries/schema/multimedia':schema,'./lyrics-input':input});
const dialect=new pg.PgDialect();let logs=[],committed=[],mode='ok';
const name=t=>pg.getTableConfig(t).name;
const compile=s=>dialect.sqlToQuery(s);
function select(){let table,clause;const q={from(t){table=t;return q},where(c){clause=c;return q},limit(){return q},offset(){return q},orderBy(){return q},innerJoin(){return q},for(lock){logs.push({op:'lock',table:name(table),lock,...compile(clause)});return Promise.resolve((mode==='foreign'&&table===schema.multimediaTracks)||(mode==='missing'&&table===lyrics)?[]:[{id:table===lyrics?7:1}])},then(resolve,reject){logs.push({op:'select',table:name(table),...compile(clause)});return Promise.resolve(mode==='missing'&&table===lyrics?[]:[{id:7,title:'Saved',metadata:{}}]).then(resolve,reject)}};return q;}
function transactionContext(staged){return{select,insert(table){let values;const q={values(v){values=v;return q},returning(){staged.push({op:'insert',table:name(table),values});return Promise.resolve([{id:7}])},then(resolve,reject){if(mode==='fail-link'&&table===schema.multimediaLyricsTracks)return Promise.reject(Error('fixture failure')).then(resolve,reject);staged.push({op:'insert',table:name(table),values});return Promise.resolve([]).then(resolve,reject)}};return q},update(table){return{set(values){return{where(c){return{returning(){staged.push({op:'update',table:name(table),values,...compile(c)});return Promise.resolve([{id:7}])}}}}}}},delete(table){return{where(c){return{then(resolve,reject){staged.push({op:'delete',table:name(table),...compile(c)});return Promise.resolve([]).then(resolve,reject)},returning(){return Promise.resolve(mode==='missing'?[]:[{id:7}])}}}}}};}
const db={select,async transaction(fn){const staged=[];const value=await fn(transactionContext(staged));committed.push(...staged);return value;},delete:transactionContext([]).delete};
const service=serviceModule.lyricsService(db);
(async()=>{
 await service.save('owner-a',standalone);assert.equal(committed.length,1);assert.equal(committed[0].values.userId,'owner-a');
 committed=[];logs=[];
 const assigned=input.parseLyricsInput({title:'Linked',projectIds:[1],albumIds:[1],trackIds:[1]});
 await service.save('owner-a',assigned,7);
 assert.equal(logs.filter(x=>x.op==='lock').length,4);
 assert(logs.every(x=>x.params.includes('owner-a')));
 assert.equal(logs[0].lock,'update');assert(logs.slice(1).every(x=>x.lock==='share'));
 assert.equal(committed.filter(x=>x.op==='delete').length,3);assert.equal(committed.filter(x=>x.op==='insert').length,3);
 for(const m of ['foreign','missing','fail-link']){mode=m;committed=[];await assert.rejects(()=>service.save('owner-a',assigned,7));assert.equal(committed.length,0,'No partial commit on '+m);}
 mode='ok';logs=[];await service.get('owner-a',7);assert.equal(logs.length,4);assert(logs.every(x=>x.params.includes('owner-a')));
 mode='missing';logs=[];await assert.rejects(()=>service.get('owner-a',7),serviceModule.LyricsNotFound);assert.equal(logs.length,1);
 // Compile the actual Track-linked queries with Drizzle; the transport is an offline double.
 const {drizzle}=require('drizzle-orm/pg-proxy');
 let trackReadable=true,linkedRows=[],trackQueries=[];
 const trackDb=drizzle(async(sql,params)=>{
  trackQueries.push({sql,params});
  return {rows:sql.includes('from "multimedia_tracks"')?(trackReadable?[[82]]:[]):linkedRows};
 });
 const trackService=serviceModule.lyricsService(trackDb);
 linkedRows=Array.from({length:11},(_,index)=>[100+index,`Lyrics ${index}`,`Verse ${index}\nSecond line`]);
 const firstPage=await trackService.forTrack('owner-a',82,20);
 assert.equal(firstPage.hasMore,true);assert.equal(firstPage.data.length,10);
 assert.equal(firstPage.data[0].content,'Verse 0\nSecond line');
 assert.equal(firstPage.data[9].id,109);assert.equal(Object.keys(firstPage.data[0]).sort().join(),'content,id,title');
 assert.equal(trackQueries.length,2);
 assert.match(trackQueries[0].sql,/"multimedia_tracks"\."id" = \$1/);
 assert.match(trackQueries[0].sql,/"multimedia_tracks"\."user_id" = \$2/);
 assert.deepEqual(trackQueries[0].params,[82,'owner-a',1]);
 const linkedQuery=trackQueries[1];
 assert.match(linkedQuery.sql,/inner join "multimedia_lyrics_tracks" on "multimedia_lyrics_tracks"\."lyrics_id" = "multimedia_lyrics"\."id"/);
 assert.match(linkedQuery.sql,/inner join "multimedia_tracks" on "multimedia_tracks"\."id" = "multimedia_lyrics_tracks"\."track_id"/);
 assert.match(linkedQuery.sql,/"multimedia_lyrics_tracks"\."track_id" = \$1/);
 assert.match(linkedQuery.sql,/"multimedia_tracks"\."user_id" = \$2/);
 assert.match(linkedQuery.sql,/"multimedia_lyrics"\."user_id" = \$3/);
 assert.match(linkedQuery.sql,/"multimedia_lyrics"\."is_active" = \$4/);
 assert.match(linkedQuery.sql,/order by "multimedia_lyrics"\."sort_order" asc, "multimedia_lyrics"\."id" asc limit \$5 offset \$6/);
 assert.deepEqual(linkedQuery.params,[82,'owner-a','owner-a',true,11,20]);
 assert.equal(linkedQuery.sql.slice(0,linkedQuery.sql.indexOf(' from ')),'select "multimedia_lyrics"."id", "multimedia_lyrics"."title", "multimedia_lyrics"."content"');
 for(const size of [10,1,0]){
  linkedRows=linkedRows.slice(0,size);
  const page=await trackService.forTrack('owner-a',82,0);
  assert.equal(page.hasMore,false);assert.equal(page.data.length,size);
 }
 trackReadable=false;trackQueries=[];
 await assert.rejects(()=>trackService.forTrack('owner-a',82,0),serviceModule.LyricsNotFound);
 assert.equal(trackQueries.length,1,'Non-owned or missing Tracks stop before reading linked Lyrics');
 let owner='owner-a',writes=[],reads=[];
 let trackError=null;
 const stub={save:async(...args)=>{writes.push(args);return{id:7}},get:async(...args)=>{reads.push(args);return{id:7}},forTrack:async(...args)=>{reads.push(args);if(trackError)throw trackError;return{data:[{id:7,title:'Lyrics',content:'Verse\nLine two'}],hasMore:false}},remove:async()=>{throw new serviceModule.LyricsNotFound()},options:async(...args)=>{reads.push(args);return{data:[],total:0}}};
 const api=load('src/app/api/multimedia/lyrics/route.ts',{'next/server':{NextResponse:{json:(body,options)=>({body,...options})}},'@/libraries/auth':{auth:async()=>owner?{user:{id:owner}}:null},'@/libraries/db/client':{db:{}},'@/libraries/services/multimedia/lyrics-input':input,'@/libraries/services/multimedia/lyrics-service':{...serviceModule,lyricsService:()=>stub}});
 const req=(query='',body='{}')=>({nextUrl:new URL('https://fixture/api/multimedia/lyrics?'+query),text:async()=>body});
 owner=null;for(const method of ['GET','POST','PUT','DELETE'])assert.equal((await api[method](req())).status,401);assert.equal(writes.length+reads.length,0);owner='owner-a';
 owner=null;assert.equal((await api.GET(req('trackId=82'))).status,401);assert.equal(reads.length,0);owner='owner-a';
 assert.equal((await api.POST(req('',JSON.stringify({title:'Autonomous'})))).status,201);assert.equal(writes[0][0],'owner-a');assert.equal(writes[0][1].trackIds.length,0);
 assert.equal((await api.POST(req('',JSON.stringify({title:'x',userId:'other'})))).status,400);
 assert.equal((await api.POST(req('','not json'))).status,400);assert.equal((await api.POST(req('','x'.repeat(1048577)))).status,413);
 assert.equal((await api.PUT(req('',JSON.stringify({title:'x'})))).status,400);
 assert.equal((await api.DELETE(req('id=7'))).status,404);
 assert.equal((await api.GET(req('options=constructor'))).status,400);
 for(const kind of ['projects','albums','tracks'])assert.equal((await api.GET(req('options='+kind))).status,200);
 reads=[];
 const trackReply=await api.GET(req('trackId=82'));
 assert.equal(trackReply.status,200);assert.equal(trackReply.headers['Cache-Control'],'private, no-store');
 assert.deepEqual(JSON.parse(JSON.stringify(trackReply.body)),{success:true,data:[{id:7,title:'Lyrics',content:'Verse\nLine two'}],hasMore:false});
 assert.deepEqual(reads,[['owner-a',82,0]]);
 for(const query of ['trackId=0','trackId=-1','trackId=1.2','trackId=','trackId=x','trackId=2147483648','trackId=82&offset=-1','trackId=82&offset=1.2','trackId=82&offset=','trackId=82&offset=x','trackId=82&offset=2147483648']){
  const before=reads.length;assert.equal((await api.GET(req(query))).status,400,query);assert.equal(reads.length,before,'Invalid input never calls persistence');
 }
 assert.equal((await api.GET(req('trackId=2147483647&offset=2147483647'))).status,200);
 assert.deepEqual(reads.at(-1),['owner-a',2147483647,2147483647]);
 trackError=new serviceModule.LyricsNotFound();assert.equal((await api.GET(req('trackId=82'))).status,404);
 trackError=Error('private database details');const failedTrack=await api.GET(req('trackId=82'));assert.equal(failedTrack.status,503);assert(!JSON.stringify(failedTrack.body).includes('private database details'));
 console.log('PASS: autonomous Lyrics schema, junctions, bounded CRUD, owner/parent locks, transactional assignments, private Track-linked reads with owner/active joins, stable paged order and minimal fields, actual route auth/validation/errors. Offline doubles and query compilation; no live database.');
})().catch(e=>{console.error(e);process.exitCode=1});
