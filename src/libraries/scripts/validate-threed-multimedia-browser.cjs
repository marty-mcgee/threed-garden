// Optional native UI integration. Local file, temporary profile, mocked HTTP/media; no server.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
// Diagnostic comparison: remove only the Design fixture's media provider,
// keeping the same editor, section owner, inputs and assertions.
const isolateDesign = process.argv.includes('--design-without-multimedia');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-multimedia-browser-'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
let child;

async function main() {
  assert(browser, 'Optional browser validation requires installed Edge');
  const source = `
import React,{useState,useCallback} from 'react';
import{createRoot}from'react-dom/client';
import{SceneMultimediaProvider}from'./src/components/map/multimedia/SceneMultimediaProvider';
import{SceneMultimediaDetails}from'./src/components/map/multimedia/SceneMultimediaDetails';
import{ProjectMultimediaOverlay,ProjectMultimediaToolbarButton}from'./src/components/map/panels/ProjectMultimediaOverlay';
import{ProjectMultimediaAssets}from'./src/components/map/panels/ProjectMultimediaAssets';
import{DetailsCard}from'./src/components/map/details/DetailsCard';
import{DesignEditor}from'./src/components/threed/design/DesignEditor';
import{DesignWorkspace}from'./src/components/threed/design/DesignWorkspace';
import{ProjectDetailsSections}from'./src/components/map/details/PersistentDetails';
import{projectArchitectureDraft}from'./src/libraries/services/threed/design/project-architecture';
import{newDesign}from'./src/libraries/services/threed/design/document';
import{DesignGeometryCache}from'./src/libraries/services/threed/design/geometry';
import{parseThreeDProjectViewState}from'./src/libraries/services/threed/markers/project-view-state-core';
import{SceneMultimediaBridge}from'./src/components/map/multimedia/SceneMultimediaBridge';
import{MultimediaSimulationControls}from'./src/components/map/multimedia/MultimediaSimulationControls';
window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));
window.__counts={plays:0,pauses:0,patches:0};window.__session={data:{user:{id:'owner'}},status:'authenticated'};
const state=new WeakMap();const media=e=>{if(!state.has(e))state.set(e,{paused:true,time:0});return state.get(e)};
Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return media(this).paused}});
Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return media(this).time},set(v){media(this).time=v}});
Object.defineProperty(HTMLMediaElement.prototype,'src',{get(){return media(this).src||''},set(v){media(this).src=v}});
HTMLMediaElement.prototype.load=function(){};
HTMLMediaElement.prototype.pause=function(){media(this).paused=true;window.__counts.pauses++;this.dispatchEvent(new Event('pause'))};
HTMLMediaElement.prototype.play=async function(){if(window.__denyPlay){const e=Error('blocked');e.name='NotAllowedError';throw e}media(this).paused=false;window.__counts.plays++;this.dispatchEvent(new Event('play'))};
const markers=[{id:'radio',type:'models',name:'Design: Radio',isActive:true,isVisible:true,data:{id:5,projectMarkerId:105}},
{id:'kate',type:'characters',name:'Kate',isActive:true,isVisible:true,data:{id:9,projectMarkerId:109,isMovable:true}},
{id:'other',type:'models',name:'Other',isActive:true,isVisible:true,data:{id:6,projectMarkerId:106}}];
const scene={projectId:7,allowed:true,ready:true,busy:false,markers,layers:new Set(['models','characters']),settledCharacters:new Set(['kate']),controlledCharacterId:9,target:{markerId:'radio',type:'models',id:5},groups:[],sensorMembers:[],counts:()=>({}),position:()=>({x:0,y:0,z:0})};
const simulation={id:12,name:'Radio playback',revision:1,projectId:7,threedId:3,isActive:true,definition:{version:1,steps:[
{id:'play',action:'playMultimedia',actorMarkerId:'kate',targetMarkerId:'radio',timeoutMs:1000,onFailure:'stop',multimedia:{albumId:28,trackId:21}},
{id:'pause',action:'pauseMultimedia',actorMarkerId:'kate',targetMarkerId:'radio',timeoutMs:1000,onFailure:'stop',multimedia:{albumId:28}}],observations:[]}};
const listeners=new Set();window.__emit=event=>listeners.forEach(listener=>listener(event));
window.__requests=[];window.fetch=async(url,init={})=>{
 window.__requests.push({url,method:init.method||'GET'});
 const p=new URL(url,'https://fixture.invalid').searchParams;
 if(url==='/api/threed/animation-action-slots')return Response.json({success:true,data:[]});
 if(String(url).startsWith('/api/threed/models?'))return Response.json({success:true,data:{id:5,userId:'owner'}});
 if(String(url).startsWith('/api/project/multimedia-albums')){
 if(window.__failProjectAlbums)return Response.json({error:'Mock Album read failed'},{status:503});
 const rows=Number(p.get('offset'))===50?[{id:30,title:'Later Album',artist:'Another artist'}]:[{id:28,title:'TRADE',artist:'Example artist'},{id:29,title:'Project Only',artist:'Project artist'}];
 return Response.json({albums:rows.filter(album=>album.title.toLowerCase().includes((p.get('search')||'').toLowerCase())),hasMore:Number(p.get('offset'))===0&&!p.get('search')});
 }
 if(String(url).startsWith('/api/project/multimedia-preview')){
 const albumId=Number(p.get('albumId'));return Response.json({projectId:Number(p.get('projectId')),albumId,albums:[{id:albumId,title:albumId===29?'Project Only':'TRADE',artist:'Project artist',coverArt:null}],tracks:[31,32].map(id=>({id,albumId,title:'Preview '+id,fileUrl:'https://media.invalid/'+id+'.mp3',fileType:'audio/mpeg',duration:30,trackNumber:id-30})),offset:Number(p.get('offset')||0),hasMore:false});
 }
 if(String(url).startsWith('/api/project/multimedia-playback'))return Response.json({projectId:Number(p.get('projectId')),markerId:p.get('markerId'),sourceType:'model',sourceId:5,albums:[{id:28,title:'TRADE',artist:'Example artist',coverArt:null}],albumId:p.has('albumId')?Number(p.get('albumId')):null,tracks:p.has('albumId')?[21,22].map(id=>({id,albumId:28,title:'Track '+id,fileUrl:'https://media.invalid/'+id+'.mp3',fileType:'audio/mpeg',duration:30,trackNumber:id-20})):[],offset:Number(p.get('offset')||0),hasMore:false});
 if(String(url).startsWith('/api/project/simulations'))return Response.json({success:true,data:{simulation,kickMappings:[]}});
 if(url==='/api/threed/simulation-results'){
 const b=JSON.parse(init.body);
 if(init.method==='POST')return new Promise(resolve=>{window.__capturePending=true;window.__resolveCapture=()=>{window.__capturePending=false;resolve(Response.json({success:true,data:{id:1,runId:b.runId,status:'running',snapshot:{simulationId:b.simulationId},simulationRevision:b.revision}}))}});
 window.__counts.patches++;window.__lastReport=b.report;
 return window.__failResults?Response.json({error:'Mock result failure'},{status:503}):Response.json({success:true,data:{id:1,runId:b.runId,status:b.report.phase}});
 }
 throw Error('Unexpected network boundary '+url);
};
function Fixture(){const[project,setProject]=useState(7),[selected,setSelected]=useState('radio'),[request,setRequest]=useState(0),[stopRequest,setStop]=useState(0),[preview,setPreview]=useState(false),[sessionTick,setSessionTick]=useState(0),[savedPreview,setSavedPreview]=useState(null),[workspaceKey,setWorkspaceKey]=useState(0);const previewRef=React.useRef(null),workspaceCapture=React.useRef(null);window.__sessionChange=value=>{window.__session=value;setSavedPreview(null);setSessionTick(v=>v+1)};
const registerWorkspace=useCallback(capture=>{workspaceCapture.current=capture},[]);
window.__savePreview=()=>{window.__savedPreview=parseThreeDProjectViewState({version:1,savedAt:new Date().toISOString(),viewMode:'3d',panelHeight:50,cameraMode:'orbit',multimedia:{open:preview,...workspaceCapture.current()}}).multimedia};
window.__reopenPreview=()=>{setSavedPreview(window.__savedPreview);setPreview(window.__savedPreview.open);setWorkspaceKey(value=>value+1)};
window.__setProject=value=>{setSavedPreview(null);setProject(value)};window.__select=setSelected;window.__run=()=>setRequest(v=>v+1);window.__stop=()=>setStop(v=>v+1);
const onStatus=useCallback((busy,state,error)=>{window.__simulation={busy,state,error}},[]);
return <SceneMultimediaProvider key={workspaceKey} projectId={project} initialWorkspace={savedPreview||undefined} workspaceSavedAt={savedPreview?'fixture-saved':undefined} onRegisterWorkspace={registerWorkspace} onOpenProjectPreview={()=>setPreview(true)}><main className="relative mx-auto min-h-screen max-w-lg space-y-4 p-4"><h1 className="text-xl font-bold">Project · Design: Radio</h1><div data-testid="multimedia-assets"><ProjectMultimediaAssets projectId={String(project)} search=""/></div><ProjectMultimediaToolbarButton open={preview} onClick={()=>setPreview(value=>!value)} triggerRef={previewRef}/><ProjectMultimediaOverlay open={preview} key={project} projectId={String(project)} onClose={()=>{setPreview(false);previewRef.current?.focus()}}/><SceneMultimediaBridge context={{...scene,projectId:project}} subscribe={fn=>{listeners.add(fn);return()=>listeners.delete(fn)}}/>
{selected&&<DetailsCard key={project+':'+selected} projectId={project} selected={markers.find(marker=>marker.id===selected)} controlledCharacterId={9} onClose={()=>setSelected(null)}/>}
<MultimediaSimulationControls context={{...scene,projectId:project}} subscribeSensors={fn=>{listeners.add(fn);return()=>listeners.delete(fn)}} launch={{simulation,kickMappings:[],saveResults:true,request,stopRequest,onStatus}}/>
</main></SceneMultimediaProvider>};
function DesignFixture(){
 const [model,setModel]=useState({id:'tree-instance',name:'Tree',positionX:16,positionY:2,positionZ:7,scaleMultiplier:1});
 const [modelSelected,setModelSelected]=useState(false);
 window.__model=model;window.__modelSaves=window.__modelSaves||0;
 const saveModel=async(id,value)=>{if(id!==model.id)throw Error('Wrong instance');window.__modelSaves++;if(window.__failModel)return false;setModel(current=>({...current,...value}));return true};
 const images=[{id:model.id,url:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20"%3E%3Crect width="20" height="20" fill="green"/%3E%3C/svg%3E',corners:[{x:model.positionX-model.scaleMultiplier,z:model.positionZ-model.scaleMultiplier},{x:model.positionX+model.scaleMultiplier,z:model.positionZ-model.scaleMultiplier},{x:model.positionX-model.scaleMultiplier,z:model.positionZ+model.scaleMultiplier}]}];
 const [draft,setDraft]=useState(()=>{const d=newDesign();d.nodes=[{id:'a',x:0,z:0},{id:'b',x:3,z:0}];d.walls=[{id:'wall',levelId:'ground',start:'a',end:'b',height:2.4,thickness:.15,elevation:0}];return projectArchitectureDraft({version:1,document:d})});
 const cache=React.useRef(null);if(!cache.current)cache.current=new DesignGeometryCache();
 React.useEffect(()=>{cache.current.update(draft.history.present,draft.selected);window.__designGeometry=cache.current.group},[draft]);
 React.useEffect(()=>()=>cache.current.dispose(),[]);window.__designDraft=draft;
 const visibility=useCallback(()=>{},[]),preview=useCallback(()=>{},[]);
 const select=useCallback(selected=>setDraft(current=>({...current,selected,workspace:{...current.workspace,selectedEntityId:selected,sections:{...current.workspace.sections,...(selected?{'threed:details:v1:design:7:selected-properties':true}:{})}}})),[]);
 const DesignProvider=${isolateDesign ? 'React.Fragment' : 'SceneMultimediaProvider'};
 return <DesignProvider ${isolateDesign ? '' : 'projectId={7}'}><ProjectDetailsSections.Provider value={{sections:draft.workspace.sections,change:(key,open)=>setDraft(current=>({...current,workspace:{...current.workspace,sections:{...current.workspace.sections,[key]:open}}}))}}>
 <div data-testid="project-scene-workspace" style={{height:'90vh',position:'relative'}}><DesignWorkspace active={true} editor={<DesignEditor selectedModel={modelSelected?model:null} selectedModelId={modelSelected?model.id:null} modelImages={images} metersPerSceneUnit={.3048} onSaveModel={saveModel} onModelSelect={()=>{setModelSelected(true);setDraft(current=>({...current,selected:null}))}} scene={{projectId:7,projectName:'Local Design',draft,onChange:setDraft,onSelect:select,onSave:()=>{},saving:false,onPreview:preview,onVisibility:visibility}}/>}><div className="h-full">Scene placeholder; Canvas is outside this input test.</div></DesignWorkspace></div>
 </ProjectDetailsSections.Provider></DesignProvider>;
}
function App(){const[design,setDesign]=useState(false);window.__showDesign=()=>setDesign(true);return design?<DesignFixture/>:<Fixture/>}
createRoot(document.getElementById('root')).render(<App/>);
`;
  const bundle = (await require('esbuild').build({
    stdin: { contents: source, resolveDir: root, loader: 'tsx' },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    plugins: [{
      name: 'mock-session',
      setup(build) {
        build.onResolve({ filter: /^next-auth\/react$/ }, () => ({ path: 'session', namespace: 'fixture' }));
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export function useSession(){return window.__session}' }));
      },
    }],
    logLevel: 'silent',
  })).outputFiles[0].text;
  const cssPath = path.join(root, 'src/app/globals.css');
  const cssInput = fs.readFileSync(cssPath, 'utf8').replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../";');
  const css = (await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process(cssInput, { from: cssPath })).css;
  const fixture = path.join(temp, 'fixture.html');
  fs.writeFileSync(fixture, `<html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src 'none'; font-src data:"><style>${css}</style></head><body><div id="root"></div><script>window.__errors=[];window.addEventListener('error',event=>window.__errors.push(event.message));</script><script>${bundle.replace(/<\/script/gi, '<\\/script')}</script></body></html>`);
  child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--host-resolver-rules=MAP * ~NOTFOUND', `--user-data-dir=${path.join(temp, 'profile')}`, '--remote-debugging-pipe'], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let next = 0, buffer = '';
  const pending = new Map();
  child.on('error', error => { for (const task of pending.values()) task.reject(error); pending.clear(); });
  child.on('exit', code => { for (const task of pending.values()) task.reject(Error('Browser exited: ' + code)); pending.clear(); });
  child.stdio[4].on('data', chunk => {
    buffer += chunk.toString();
    let end;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      const task = pending.get(message.id);
      if (task) { pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result); }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++next; pending.set(id, { resolve, reject });
    child.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
  try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const call = (method, params = {}) => send(method, params, sessionId);
    const evaluate = async expression => {
      const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await delay(50); }
      throw Error('Browser condition timed out: ' + expression + ' | ' + await evaluate('JSON.stringify({text:document.body.innerText,errors:window.__errors,root:!!document.getElementById("root"),counts:window.__counts})') + ' | ' + temp);
    };
    const button = label => `Array.from(document.querySelectorAll('button')).find(e=>e.textContent===${JSON.stringify(label)})`;
    for (const [theme, width] of [['dark', 1440], ['light', 375]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 950, deviceScaleFactor: 1, mobile: false });
      await call('Page.navigate', { url: require('node:url').pathToFileURL(fixture).href });
      await waitFor(`!!document.querySelector('select[aria-label="Scene Album"]')`);
      assert(await evaluate(`document.querySelector('select[aria-label="Scene Album"]').closest('details').getBoundingClientRect().width>200`), 'Actual DetailsCard gives Multimedia a full-width section outside its action row');
      await evaluate(`document.documentElement.className=${JSON.stringify(theme)};document.querySelector('details').open=true;`);
      await evaluate(`const album=document.querySelector('select[aria-label="Scene Album"]');album.value='28';album.dispatchEvent(new Event('change',{bubbles:true}));`);
      await waitFor(`!!document.querySelector('select[aria-label="Scene Track"]')`);
      assert(await evaluate(`document.querySelector('[aria-label="Selected Album information"]').textContent.includes('TRADE')&&document.querySelector('[aria-label="Selected Album information"]').textContent.includes('Example artist')`), 'Radio shows the selected Album information');
      await evaluate(`const track=document.querySelector('select[aria-label="Scene Track"]');track.value='22';track.dispatchEvent(new Event('change',{bubbles:true}));`);
      await evaluate(`${button('Play Multimedia')}.click()`);
      await waitFor('window.__counts.plays===1');
      await waitFor(`document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('Track 22')`);
      await evaluate(`document.querySelector('button[aria-label="Project Multimedia"]').click();window.__mediaElement=document.querySelector('video');true`);
      assert(await evaluate(`document.querySelector('video').closest('#project-multimedia-overlay')!==null`),'The single media element lives inside the menu');
      await evaluate(`window.__denyPlay=true;const retryTrack=document.querySelector('select[aria-label="Scene Track"]');retryTrack.value='21';retryTrack.dispatchEvent(new Event('change',{bubbles:true}));`);
      await evaluate(`${button('Play Multimedia')}.click()`);
      await waitFor(`document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('Click Play to enable Scene audio.')`);
      assert(await evaluate(`document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('Track 21')`), 'Failed switch displays the requested Track');
      await evaluate(`window.__denyPlay=false;${button('Play')}.click()`);
      await waitFor('window.__counts.plays===2');
      assert(await evaluate(`document.querySelector('video').src.endsWith('/21.mp3')`), 'Retry plays the displayed Track');
      await evaluate(`document.querySelector('video').pause();document.querySelector('video').dispatchEvent(new Event('ended'))`);
      await waitFor(`document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('ended')`);
      await evaluate(`${button('Play')}.click()`);
      await waitFor('window.__counts.plays===3');
      await evaluate(`${button('Stop')}.click()`);
      await waitFor(`document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('stopped')`);
      await delay(100);
      assert(await evaluate(`document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('stopped')`));
      await evaluate(`${button('Play')}.click()`);
      await waitFor('window.__counts.plays===4');
      assert.equal(await evaluate('document.querySelectorAll("video").length'), 1);
      await evaluate(`document.querySelector('button[aria-label="Close Project Multimedia"]').click()`);
      await evaluate(`window.__select(null)`); await delay(100);
      assert.equal(await evaluate('document.querySelector("video").paused'), false, 'Closing DetailsCard preserves Project playback');
      await evaluate(`document.querySelector('button[aria-label="Project Multimedia"]').click()`);
      await waitFor(`!!document.querySelector('#project-multimedia-overlay button[aria-pressed="false"]')`);
      assert.equal(await evaluate('window.__counts.plays'),4,'Opening the Project menu never autoplays');
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='More Albums').click()`);
      await waitFor(`document.getElementById('project-multimedia-overlay').textContent.includes('Later Album')`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Previous Albums').click()`);
      await waitFor(`document.getElementById('project-multimedia-overlay').textContent.includes('Project Only')`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent.includes('Project Only')).click()`);
      await waitFor(`!!document.querySelector('select[aria-label="Project Multimedia Track"]')`);
      await evaluate(`const s=document.querySelector('select[aria-label="Project Multimedia Track"]');s.value='31';s.dispatchEvent(new Event('change',{bubbles:true}));`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Play').click()`);
      await waitFor('window.__counts.plays===5');
      assert(await evaluate(`document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('Preview 31')`),'Project-only Album previews without a selected Model');
      assert.equal(await evaluate('document.querySelectorAll("video").length'),1,'Object and Project playback share one media engine');
      await waitFor(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Pause')?.disabled===false`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Next Track').click()`);
      await waitFor(`window.__counts.plays===6&&document.querySelector('select[aria-label="Project Multimedia Track"]')?.value==='32'`);
      await waitFor(`document.querySelector('button[aria-label="Preview Album Project Only"]')?.getAttribute('aria-pressed')==='true'&&document.querySelector('button[aria-label="Preview Album Project Only"]').textContent.includes('Preview 32')`);
      await evaluate(`document.querySelector('button[aria-label="Close Project Multimedia"]').click();document.querySelector('button[aria-label="Preview Album TRADE"]').click()`);
      await waitFor(`document.getElementById('project-multimedia-overlay')&&document.querySelector('button[aria-label="Preview Album TRADE"]').getAttribute('aria-pressed')==='true'`);
      assert.equal(await evaluate('window.__counts.plays'),6,'Asset preview does not autoplay or replace current playback');
      await evaluate(`Array.from(document.querySelectorAll('[aria-label="Project Multimedia player"] button')).find(b=>b.textContent==='Show current Album').click()`);
      await waitFor(`document.querySelector('select[aria-label="Project Multimedia Track"]')?.value==='32'&&document.querySelector('button[aria-label="Preview Album Project Only"]').getAttribute('aria-pressed')==='true'`);
      assert.equal(await evaluate('window.__counts.plays'),6,'Player preview synchronizes current Album/Track without replay');
      await evaluate(`document.querySelector('button[aria-label="Close Project Multimedia"]').click();document.querySelector('button[aria-label="Preview Album Project Only"]').click()`);
      await waitFor(`document.querySelector('select[aria-label="Project Multimedia Track"]')?.value==='32'`);
      await evaluate('window.__savePreview()');
      assert.deepEqual(await evaluate('window.__savedPreview'),{open:true,albumId:29,trackId:32},'Project snapshot captures overlay and selected/current Track');
      await evaluate('window.__reopenPreview()');
      await waitFor(`document.querySelector('select[aria-label="Project Multimedia Track"]')?.value==='32'&&document.querySelector('[aria-label="Project Multimedia player"]').textContent.includes('paused')`);
      assert.equal(await evaluate('window.__counts.plays'),6,'Reopening the saved Project cannot autoplay');
      assert.equal(await evaluate('document.querySelector("video").paused'),true);
      await waitFor(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Play')?.disabled===false`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Play').click()`);
      await waitFor('window.__counts.plays===7');
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Project overlay does not overflow');
      const previewCapture=await call('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(temp,`project-preview-${theme}-${width}.png`),Buffer.from(previewCapture.data,'base64'));
      await evaluate(`window.__mediaElement=document.querySelector('video');true`);
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
      await waitFor(`document.getElementById('project-multimedia-overlay').hidden`);
      assert(await evaluate(`document.activeElement===document.querySelector('button[aria-label="Project Multimedia"]')`),'Escape restores toolbar focus');
      assert.equal(await evaluate('document.querySelector("video").paused'),false,'Closing the menu preserves the Project player');
      assert(await evaluate(`window.__mediaElement===document.querySelector('video')`),'Closing/reopening the menu preserves the same media element');
      assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Project Multimedia player"]').length`),1,'There is one integrated player and no separate floating panel');
      await evaluate('window.__savePreview();window.__reopenPreview()');
      await waitFor(`document.getElementById('project-multimedia-overlay').hidden&&document.querySelector('video').paused`);
      assert.deepEqual(await evaluate('window.__savedPreview'),{open:false,albumId:29,trackId:32},'Closed overlay and retained Track are saved together');
      await evaluate(`window.__failProjectAlbums=true;document.querySelector('button[aria-label="Project Multimedia"]').click();Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Refresh Albums').click()`);
      await waitFor(`document.getElementById('project-multimedia-overlay').textContent.includes('Mock Album read failed')`);
      await evaluate(`window.__failProjectAlbums=false;Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Refresh Albums').click()`);
      await waitFor(`!!Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent.includes('Project Only'))`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent.includes('Project Only')).click()`);
      await waitFor(`!!document.querySelector('select[aria-label="Project Multimedia Track"]')`);
      await evaluate(`window.__sessionChange({data:null,status:'unauthenticated'})`);
      await waitFor(`!document.querySelector('select[aria-label="Project Multimedia Track"]')&&document.querySelector('video').paused`);
      await waitFor(`!!Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent.includes('Project Only'))`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent.includes('Project Only')).click()`);
      await waitFor(`!!document.querySelector('select[aria-label="Project Multimedia Track"]')`);
      await evaluate(`Array.from(document.querySelectorAll('#project-multimedia-overlay button')).find(b=>b.textContent==='Play').click()`);
      await waitFor('window.__counts.plays===8');
      await evaluate(`window.__sessionChange({data:{user:{id:'owner'}},status:'authenticated'})`);
      await waitFor(`!document.querySelector('select[aria-label="Project Multimedia Track"]')&&document.querySelector('video').paused`);
      await evaluate(`document.querySelector('button[aria-label="Close Project Multimedia"]').click()`);
      console.log(`PASS native Project preview ${theme}/${width}: Album paging, no-autoplay Track selection, Model-independent playback, single engine, Escape/focus, error retry and session reset/public browsing (mock HTTP/media).`);
      await evaluate(`window.__select('other')`); await waitFor(`!!document.querySelector('select[aria-label="Scene Album"]')`);
      assert.equal(await evaluate('document.querySelectorAll("video").length'), 1);
      await evaluate('window.__setProject(8)'); await waitFor('document.querySelector("video").paused');
      assert(await evaluate(`document.querySelector('[aria-label="Project Multimedia player"]').hidden`));
      await evaluate('window.__setProject(7);window.__select("radio")');
      await waitFor(`!!document.querySelector('select[aria-label="Scene Album"]')`);
      const before = await evaluate('window.__counts.plays');
      await evaluate('window.__failResults=true;window.__run()');
      await waitFor('window.__capturePending===true');
      assert.equal(await evaluate('window.__counts.plays'), before, 'No command before owner run capture');
      await evaluate('window.__resolveCapture()');
      await waitFor('window.__simulation?.state?.phase==="completed"');
      await waitFor('document.body.innerText.includes("Result not saved")');
      assert.equal(await evaluate('window.__counts.plays'), before + 1);
      assert.equal(await evaluate('window.__lastReport.phase'), 'completed');
      await evaluate(`window.__failResults=false;${button('Retry saving results')}.click()`);
      await waitFor('window.__counts.patches===2');
      assert.equal(await evaluate('window.__counts.plays'), before + 1, 'Result retry never replays commands');
      assert.deepEqual(await evaluate('window.__errors'), []);
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'), 'No page overflow');
      await evaluate("document.querySelector('details').open=true;window.scrollTo(0,0)"); await delay(100);
      const capture = await call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(temp, `${theme}-${width}.png`), Buffer.from(capture.data, 'base64'));
      console.log(`PASS native Multimedia ${theme}/${width}: actual DetailsCard selection/playback, one engine across close/Project switch, real Simulation capture-before-dispatch and completed replies, failed result feedback and save-only retry (mock HTTP/media).`);
      if (width === 375) {
        await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
        await evaluate('window.__showDesign()');
        await waitFor(`!!document.querySelector('[data-testid="home-plan"]')`);
        const clickControl = async label => {
          const point = await evaluate(`(()=>{const b=document.querySelector('[data-testid="design-canvas-tools"] button[aria-label="'+${JSON.stringify(label)}+'"]');if(!b||b.disabled)throw Error('Tool unavailable');b.scrollIntoView({block:'nearest',inline:'nearest'});const r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return{x,y,hit:b.contains(document.elementFromPoint(x,y))}})()`);
          assert(point.hit, `Physical click must reach the ${label} tool`);
          await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
          await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
          await waitFor(`document.querySelector('button[aria-label="'+${JSON.stringify(label)}+'"]').getAttribute('aria-pressed')==='true'`);
        };
        for (const label of ['Wall', 'Floor', 'Roof', 'Door', 'Window', 'Select']) await clickControl(label);
        const summary = `document.querySelector('[data-testid="design-selected-properties"]>summary')`;
        await evaluate(`${summary}.click()`);
        await waitFor(`!document.querySelector('[data-testid="design-selected-properties"]').open`);
        // Native details changes before its queued toggle event updates React state.
        await waitFor(`window.__designDraft.workspace.sections['threed:details:v1:design:7:selected-properties']===false`);
        assert.equal(await evaluate(`window.__designDraft.workspace.sections['threed:details:v1:design:7:selected-properties']`), false);
        const point = await evaluate(`(()=>{const s=document.querySelector('[data-testid="home-plan"]'),r=s.getBoundingClientRect(),g=[...s.children].find(e=>e.hasAttribute('transform')),m=g.transform.baseVal.consolidate().matrix;return{x:r.x+m.e+1.5*m.a,y:r.y+m.f}})()`);
        await call('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
        await call('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
        await waitFor(`window.__designDraft.selected==='wall'&&document.querySelector('[data-testid="design-selected-properties"]').open`);
        await evaluate(`(()=>{const input=document.querySelector('[aria-label="Height (in)"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'120');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await waitFor(`Math.abs(window.__designDraft.history.present.walls[0].height-3.048)<.0001`);
        assert(await evaluate(`(()=>{const wall=window.__designGeometry.getObjectByName('wall');wall.geometry.computeBoundingBox();return Math.abs(wall.geometry.boundingBox.max.y-3.048)<.001})()`), 'Properties edits reach the actual Three geometry owner');
        const beforeNodes = await evaluate('JSON.stringify(window.__designDraft.history.present.nodes)');
        const beforeGeometry = await evaluate(`JSON.stringify(Array.from(window.__designGeometry.getObjectByName('wall').geometry.attributes.position.array))`);
        await call('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
        await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + 40, y: point.y + 40, button: 'left', buttons: 1 });
        await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x + 40, y: point.y + 40, button: 'left', clickCount: 1 });
        await waitFor(`JSON.stringify(window.__designDraft.history.present.nodes)!==${JSON.stringify(beforeNodes)}`);
        assert.notEqual(await evaluate(`JSON.stringify(Array.from(window.__designGeometry.getObjectByName('wall').geometry.attributes.position.array))`), beforeGeometry, 'Plan dragging updates the same Three wall geometry');
        assert.deepEqual(await evaluate('window.__errors'), []);
        const modelPoint = async selector => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
        const pick=await modelPoint('image[aria-label="Select Project Model tree-instance"]');
        await call('Input.dispatchMouseEvent',{type:'mousePressed',...pick,button:'left',clickCount:1});
        await call('Input.dispatchMouseEvent',{type:'mouseReleased',...pick,button:'left',clickCount:1});
        await waitFor(`!!document.querySelector('[aria-label="Model uniform scale"]')&&document.querySelector('[data-testid="design-selected-properties"]').open`);
        assert.equal(await evaluate(`Number(document.querySelector('[aria-label="Model position X (m)"]').value)`),16*.3048);
        const modelBefore=await evaluate('({...window.__model})');
        await call('Input.dispatchMouseEvent',{type:'mousePressed',...pick,button:'left',clickCount:1});
        await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:pick.x+25,y:pick.y+15,button:'left',buttons:1});
        assert.equal(await evaluate('window.__modelSaves'),0,'No persistence during pointer move');
        await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:pick.x+25,y:pick.y+15,button:'left',clickCount:1});
        await waitFor('window.__modelSaves===1&&window.__model.positionX!==16');
        assert.equal(await evaluate('window.__model.positionY'),modelBefore.positionY,'Preserve height');
        const corner=await modelPoint('[data-model-resize="tree-instance"]');
        await call('Input.dispatchMouseEvent',{type:'mousePressed',...corner,button:'left',clickCount:1});
        await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:corner.x+15,y:corner.y+15,button:'left',buttons:1});
        await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:corner.x+15,y:corner.y+15,button:'left',clickCount:1});
        await waitFor('window.__modelSaves===2&&window.__model.scaleMultiplier>1');
        await evaluate(`window.__failModel=true;(()=>{const input=document.querySelector('[aria-label="Model uniform scale"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'3');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await waitFor(`!${button('Save Model')}.disabled`);
        await evaluate(`${button('Save Model')}.click()`);
        await waitFor('window.__modelSaves===3&&document.body.innerText.includes("Your values are retained")');
        assert.equal(await evaluate(`document.querySelector('[aria-label="Model uniform scale"]').value`),'3');
        assert.equal(await evaluate(`(()=>{const original=window.confirm;window.confirm=()=>false;try{return window.dispatchEvent(new Event('threed:design:model-selection',{cancelable:true}))}finally{window.confirm=original}})()`),false,'Declining discard preserves the selected Model draft');
        await evaluate(`window.__failModel=false;${button('Save Model')}.click()`);
        await waitFor('window.__modelSaves===4&&window.__model.scaleMultiplier===3');
        console.log('PASS Model plan: image selection opens Properties, metre conversion, pointer drag and proportional resize save once, preserve height, and failed field edits retain draft for retry. Mock persistence.');
        console.log('PASS native Design sections: real Project-controlled collapse/reopen, plan wall selection reopens Properties, numeric Height and pointer dragging update the same document and actual Three geometry. No Canvas/GPU or persistence claimed.');
      }
    }
    console.log('Design provider isolation: ' + (isolateDesign ? 'Multimedia provider absent' : 'Multimedia provider present'));
    console.log('Artifacts: ' + temp);
  } finally { await send('Browser.close').catch(() => {}); child.kill(); }
}
const timeout = setTimeout(() => { console.error('Native Multimedia timeout: ' + temp); child?.kill(); process.exit(1); }, 60000);
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(timeout));
