const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,context={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,URL,...context});return exports;}
const editor=load('src/libraries/services/multimedia/editor.ts');
const policy=load('src/libraries/services/multimedia/upload-policy.ts');
const access=load('src/libraries/services/multimedia/access.ts',{require:name=>{assert.equal(name,'./upload-policy');return policy}});
const source=fs.readFileSync('src/components/admin/multimedia/shared/MultimediaRecordPage.tsx','utf8');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const artwork=load('src/components/admin/multimedia/shared/AlbumArtwork.tsx',{require:name=>{
 if(name==='react')return React;if(name==='react/jsx-runtime')return require('react/jsx-runtime');
 if(name==='@/components/ui/button')return {Button:({children,...props})=>React.createElement('button',props,children)};
 throw Error(name);
}}).AlbumArtwork;
const artHtml=renderToStaticMarkup(React.createElement(artwork,{url:'/cover.png',title:'Album',artist:'Artist',unsaved:true}));
assert.ok(artHtml.includes('src="/cover.png"'));assert.ok(artHtml.includes('Unsaved artwork preview'));
const emptyArt=renderToStaticMarkup(React.createElement(artwork,{url:'',title:'Album',artist:'Artist',unsaved:false}));assert.ok(emptyArt.includes('No cover art'));
assert.ok(source.indexOf('<AlbumArtwork') < source.indexOf('<Tabs value={tab}'), 'artwork is outside tab contents');
assert.ok(source.includes('url={String(draft.coverArt'));assert.ok(source.includes('key={String(draft.coverArt)}'), 'URL changes reset failed previews');
const start=source.indexOf('  async function save('),end=source.indexOf('\n  function reload()',start);
let draft=editor.multimediaDraft('albums'),baseline=draft,saving=false,uncertain=false,notice='',error='',calls=[],record=null;
draft={...draft,title:'Album',artist:'Artist',coverArt:'https://example.invalid/cover.jpg'};
let mode='ok',id=undefined;
const lock={current:false},leaving={current:false},routes=[];
const context={kind:'albums',lock,leaving,positiveId:access.positiveId,multimediaDraft:editor.multimediaDraft,multimediaPayload:editor.multimediaPayload,
setPreviewError(){},setSaving:value=>saving=value,setUncertain:value=>uncertain=value,setError:value=>error=value,setNotice:value=>notice=value,setRecord:value=>record=value,setDraft:value=>draft=value,setBaseline:value=>baseline=value,
router:{replace:value=>routes.push(value)},fetch:async(url,options)=>{calls.push({url,options});if(mode==='network')throw Error('offline fixture');return {ok:mode==='ok',status:mode==='ok'?200:400,json:async()=>mode==='ok'?{success:true,data:{id:id??9,...draft,userId:'owner',metadata:{private:true}}}:{error:'Owned parent unavailable'}}},Error,JSON};
Object.defineProperties(context,{id:{get:()=>id},draft:{get:()=>draft},baseline:{get:()=>baseline},blocked:{get:()=>saving||uncertain},validation:{get:()=>''},dirty:{get:()=>JSON.stringify(draft)!==JSON.stringify(baseline)}});
vm.createContext(context);vm.runInContext(ts.transpileModule(source.slice(start,end)+'\nglobalThis.save=save;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
const event={preventDefault(){}};
function componentFunction(file, name) {
 const text=fs.readFileSync(file,'utf8'), parsed=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let found;
 function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(parsed)===name)found=node.initializer;ts.forEachChild(node,visit)}
 visit(parsed);assert.ok(found, name);return found.getText(parsed);
}
(async()=>{
 // Embedded Project editors must not silently assign a rank on a title-only save.
 for(const [kind,rank,file] of [
  ['tracks','trackNumber','src/components/admin/multimedia/tracks/MultimediaTracksCRUD.tsx'],
  ['links','displayOrder','src/components/admin/multimedia/links/MultimediaLinksCRUD.tsx'],
 ])for(const saved of [-10000,0,10000,null]) {
  let form, sent;
  const item={id:4,title:'Original',fileUrl:'https://example.invalid/a.mp3',fileType:'audio/mpeg',url:'https://example.invalid',albumId:1,[rank]:saved};
  const embedded={pageHeader:false,uploaded:null,editingTrack:item,editingLink:item,onModuleUpdate:undefined,
   setUploaded(){},setEditingTrack(){},setEditingLink(){},setFormData:value=>form=value,setIsSubmitting(){},showToast(){},
   fetchTracks:async()=>{},fetchLinks:async()=>{},console,
   fetch:async(_url,options)=>{sent=JSON.parse(options.body);return {json:async()=>({success:true})}},
  };
  Object.defineProperty(embedded,'formData',{get:()=>form});vm.createContext(embedded);
  vm.runInContext(ts.transpileModule('globalThis.open='+componentFunction(file,'openEditDialog')+';globalThis.save='+componentFunction(file,'handleUpdate'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,embedded);
  embedded.open(item);assert.equal(form[rank],saved);form.title='Renamed';await embedded.save();assert.equal(sent[rank],saved);
 }
 for(const kind of ['albums','tracks','media','links']){
  const record={id:2,title:'Title',artist:'Artist',coverArt:'https://example.invalid/cover.jpg',albumId:1,trackId:null,url:'https://example.invalid',fileName:'Clip',fileUrl:'https://example.invalid/clip.mp4',fileType:'video/mp4',metadata:{private:true}};
  const original=editor.multimediaDraft(kind,record),changed={...original,[kind==='media'?'fileName':'title']:'Changed'};
  const payload=editor.multimediaPayload(kind,changed,original);assert.deepEqual(Object.keys(payload),[kind==='media'?'fileName':'title']);assert.equal(payload.metadata,undefined);
  const rank = kind==='albums'?'sortOrder':kind==='tracks'?'trackNumber':kind==='links'?'displayOrder':null;
  if(rank){
    for(const value of [-10000,0,10000]){const payload=editor.multimediaPayload(kind,{...original,[rank]:String(value)},original);assert.equal(payload[rank],value);assert.deepEqual(Object.keys(payload),[rank]);}
    for(const value of [-10001,10001,1.5]) assert.throws(()=>editor.multimediaPayload(kind,{...original,[rank]:String(value)},original));
    assert.equal(editor.multimediaDraft(kind)[rank],'0');assert.equal(original[rank],'');
  }
 }
 const albumDraft={...draft,sortOrder:'2.3'};assert.throws(()=>editor.multimediaPayload('albums',albumDraft));
 assert.throws(()=>editor.multimediaPayload('tracks',{...editor.multimediaDraft('tracks'),title:'Track',fileUrl:'https://example.invalid/t.mp3',albumId:'1x'}));

 assert.throws(()=>editor.multimediaPayload('links',{...editor.multimediaDraft('links'),title:'Link',url:'javascript:alert(1)'}));
 await Promise.all([context.save(event),context.save(event)]);assert.equal(calls.length,1);assert.equal(routes[0],'/admin/multimedia/albums/9');assert.equal(record.id,9);assert.equal(notice,'Saved.');assert.equal(saving,false);
 id=9;leaving.current=false;draft={...baseline,title:'Updated'};calls=[];await context.save(event);assert.equal(calls[0].options.method,'PUT');assert.deepEqual(JSON.parse(calls[0].options.body),{title:'Updated'});
 mode='reject';draft={...baseline,title:'Retained draft'};const before=draft;await context.save(event);assert.equal(draft,before);assert.equal(uncertain,false);assert.equal(error,'Owned parent unavailable');assert.equal(lock.current,false);
 mode='network';await context.save(event);assert.equal(uncertain,true);const count=calls.length;await context.save(event);assert.equal(calls.length,count);assert.equal(draft,before);
 // Execute the actual parent lookup effect, including late response after cancellation.
 const picker=fs.readFileSync('src/components/admin/multimedia/shared/OwnedMultimediaPicker.tsx','utf8');const effectStart=picker.indexOf('  useEffect(() => {')+'  useEffect('.length;const effectEnd=picker.indexOf(', [kind, value, albumId, onValidityChange]);',effectStart);
 const effect=picker.slice(effectStart,effectEnd);let valid=null,selected='',resolve;
 const effectContext={kind:'tracks',value:'2',albumId:1,AbortController,setPending(){},setSelected:v=>selected=v,onValidityChange:v=>valid=v,fetch:()=>new Promise(r=>resolve=r)};
 vm.createContext(effectContext);vm.runInContext('globalThis.run='+effect,effectContext);const cleanup=effectContext.run();assert.equal(valid,false);cleanup();resolve({ok:true,json:async()=>({success:true,data:{id:2,title:'Late',albumId:1}})});await new Promise(r=>setImmediate(r));assert.equal(valid,false);assert.equal(selected,'');
 effectContext.run();resolve({ok:true,json:async()=>({success:true,data:{id:2,title:'Wrong Album',albumId:99}})});await new Promise(r=>setImmediate(r));assert.equal(valid,false);assert.ok(selected.includes('unavailable'));
 for(const kind of ['albums','tracks','media','links'])for(const route of ['new','[id]']){const path=`src/app/admin/multimedia/${kind}/${route}/page.tsx`;const text=fs.readFileSync(path,'utf8');assert.ok(text.includes('positiveId'));assert.ok(text.includes('notFound()'));assert.ok(text.includes(route==='[id]' && kind==='albums' ? 'LegacyAlbumDetail' : route==='[id]' && kind==='tracks' ? 'LegacyTrackPlayer' : 'MultimediaRecordPage'));}
 // Restored legacy handlers must retain current API envelopes, ownership and ranks.
 const legacyAlbum='src/components/admin/multimedia/albums/LegacyAlbumDetail.tsx';
 let legacyCalls=[],closed=false;
 const legacyContext={isSubmitting:false,formData:{title:'Track',fileUrl:'/track.mp3',trackNumber:'0',duration:'60',status:'active'},editingTrack:{id:7},albumId:28,
 setIsSubmitting(){},showToast(){},setIsDialogOpen:value=>closed=!value,resetForm(){},fetchTracks:async()=>{},fetchAlbum:async()=>{},
 fetch:async(url,options)=>{legacyCalls.push({url,options});return {json:async()=>({success:true})};}};
 vm.createContext(legacyContext);vm.runInContext(ts.transpileModule('globalThis.submit='+componentFunction(legacyAlbum,'handleSubmit'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,legacyContext);
 await legacyContext.submit(event);assert.equal(legacyCalls[0].url,'/api/multimedia/tracks?id=7');assert.equal(JSON.parse(legacyCalls[0].options.body).trackNumber,0);assert.equal(closed,true);
 legacyContext.editingTrack=null;await legacyContext.submit(event);assert.equal(legacyCalls[1].url,'/api/multimedia/tracks');assert.equal(legacyCalls[1].options.method,'POST');
 let loadedTrack,loadedAlbum,loadedTracks,loadedIndex;
 const legacyPlayer={trackId:'7',setTrack:v=>loadedTrack=v,setAlbum:v=>loadedAlbum=v,setTracks:v=>loadedTracks=v,setCurrentTrackIndex:v=>loadedIndex=v,setLoading(){},console,
 fetch:async url=>{assert.ok(url.includes('scope=owner'));return {ok:true,json:async()=>({success:true,data:url.includes('/tracks?')?{id:7,albumId:28}:{id:28,tracks:[{id:6},{id:7}]}})}}};
 vm.createContext(legacyPlayer);vm.runInContext(ts.transpileModule('globalThis.read='+componentFunction('src/components/admin/multimedia/tracks/LegacyTrackPlayer.tsx','fetchTrack'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,legacyPlayer);await legacyPlayer.read();
 assert.equal(loadedTrack.id,7);assert.equal(loadedAlbum.id,28);assert.equal(loadedTracks.length,2);assert.equal(loadedIndex,1);
 for(const kind of ['albums','tracks']) assert.ok(fs.readFileSync('src/app/admin/multimedia/'+kind+'/[id]/edit/page.tsx','utf8').includes('MultimediaRecordPage'));
 assert.ok(source.includes('scope=owner'));assert.ok(source.includes('admin-editor-panel'));assert.ok(source.includes('admin-editor-actions'));assert.ok(source.includes('beforeunload'));assert.ok(source.includes("document.addEventListener('click'"));
 console.log('PASS: actual editor save handlers, allowlisted changed-key drafts, numeric/URL validation, duplicate and uncertain-save guards, owned parent lookup/cancellation, strict route boundaries and Blueprint hooks (mocked network).');
})().catch(error=>{console.error(error);process.exitCode=1});

const newMediaDraft=editor.multimediaDraft('media');assert.equal(newMediaDraft.isPublic,false);assert.equal(newMediaDraft.isActive,true);
const hiddenMedia=editor.multimediaDraft('media',{id:1,isPublic:false,isActive:false});assert.equal(hiddenMedia.isPublic,false);assert.equal(hiddenMedia.isActive,false);
