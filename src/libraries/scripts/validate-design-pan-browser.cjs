// Optional actual-React mouse check. File fixture + debugging pipes; no HTTP server or database.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-design-pan-'));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let child;
async function main() {
  const source = `import React from 'react';import{createRoot}from'react-dom/client';
import{DesignEditor}from'./src/components/threed/design/DesignEditor';
import{DesignWorkspace}from'./src/components/threed/design/DesignWorkspace';
import{ProjectDetailsSections}from'./src/components/map/details/PersistentDetails';
import{projectArchitectureDraft,reconcileArchitectureSelection}from'./src/libraries/services/threed/design/project-architecture';
import{validateDesign,newDesign}from'./src/libraries/services/threed/design/document';
const doc=validateDesign({...newDesign(),nodes:[{id:'a',x:1,z:1},{id:'b',x:5,z:1}],walls:[{id:'wall',levelId:'ground',start:'a',end:'b',height:2.4,thickness:.15,elevation:0}]});
function Fixture(){const[draft,setDraft]=React.useState(()=>projectArchitectureDraft({version:1,document:doc})),[preview,setPreview]=React.useState(null);
const visibility=React.useCallback(()=>{},[]),change=React.useCallback(update=>setDraft(current=>reconcileArchitectureSelection(update(current))),[]);
window.__draft=draft;window.__preview=preview;
return <ProjectDetailsSections.Provider value={{sections:draft.workspace.sections,change:(key,open)=>change(current=>({...current,workspace:{...current.workspace,sections:{...current.workspace.sections,[key]:open}}}))}}>
<main data-testid="project-scene-workspace" className="relative h-dvh overflow-hidden"><div className="threed-project-toolbar h-9">Project fixture</div>
<DesignWorkspace active split={30} onSplitChange={()=>{}} editor={<DesignEditor scene={{projectId:15,projectName:'Offline Project',draft,onChange:change,onSave:async()=>{},saving:false,onPreview:setPreview,onVisibility:visibility}}/>}><div>Existing Scene placeholder</div></DesignWorkspace></main></ProjectDetailsSections.Provider>}
window.__events=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture'])document.addEventListener(name,e=>{if(e.target.closest?.('[data-testid="home-plan"]'))window.__events.push({name,target:e.target.tagName,entity:e.target.closest?.('[data-entity]')?.getAttribute('data-entity'),buttons:e.buttons,x:e.clientX,y:e.clientY})});
createRoot(document.getElementById('root')).render(<Fixture/>);`;
  const bundle = (await require('esbuild').build({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'offline-preview',setup(build){
    build.onLoad({filter:/src[\\/]components[\\/]threed[\\/]design[\\/].*\.tsx$/},async args=>({contents:(await require('@babel/core').transformAsync(fs.readFileSync(args.path,'utf8'),{filename:args.path,configFile:false,babelrc:false,parserOpts:{plugins:['typescript','jsx']},plugins:[['babel-plugin-react-compiler',{}]]})).code,loader:'tsx'}));
    build.onResolve({filter:/^next\/dynamic$/},args=>({path:args.path,namespace:'mock'}));
    build.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export default()=>()=>null;',loader:'js'}));
  }}],logLevel:'silent'})).outputFiles[0].text;
  const cssPath = path.join(root,'src/app/globals.css');
  const css = (await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(cssPath,'utf8'),{from:cssPath})).css;
  const fixture = path.join(temp,'fixture.html');
  fs.writeFileSync(fixture, `<html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:"><style>${css}</style></head><body><div id="root"></div><script>${bundle.replace(/<\/script/gi,'<\\/script')}</script></body></html>`);
  assert(browser,'Installed Edge is required.');
  child = spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking',`--user-data-dir=${path.join(temp,'profile')}`,'--remote-debugging-pipe'],{windowsHide:true,stdio:['ignore','ignore','ignore','pipe','pipe']});
  let next=0, buffer=''; const pending=new Map();
  child.on('error',error=>{for(const task of pending.values())task.reject(error);pending.clear();});
  child.on('exit',code=>{for(const task of pending.values())task.reject(Error('Browser exited: '+code));pending.clear();});
  child.stdio[4].on('data',chunk=>{buffer+=chunk.toString();let end;while((end=buffer.indexOf('\0'))>=0){const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);const task=pending.get(message.id);if(task){pending.delete(message.id);message.error?task.reject(Error(JSON.stringify(message.error))):task.resolve(message.result);}}});
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});child.stdio[3].write(JSON.stringify({id,method,params,sessionId})+'\0');});
  try {
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    const call=(method,params={})=>send(method,params,sessionId);
    const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;};
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:require('node:url').pathToFileURL(fixture).href});
    for(let i=0;i<80&&!await evaluate('!!window.__draft');i++)await delay(100);
    assert(await evaluate('!!window.__draft'),'Fixture mounts');await delay(250);
    const rect=await evaluate(`(()=>{const r=document.querySelector('[data-testid="home-plan"]').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()`);
    const mouse=async(type,x,y,buttons=0)=>{await call('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'?'none':'left',buttons,clickCount:1});await delay(40)};
    const point={x:rect.x+rect.width*.7,y:rect.y+rect.height*.65};
    const before=await evaluate('window.__draft.workspace.plan');
    console.log('Before',JSON.stringify({rect,point,view:before,hit:await evaluate(`document.elementFromPoint(${point.x},${point.y})?.outerHTML.slice(0,300)`)}));
    await mouse('mouseMoved',point.x,point.y);await mouse('mousePressed',point.x,point.y,1);
    for(let i=1;i<=4;i++)await mouse('mouseMoved',point.x+20*i,point.y+10*i,1);
    await mouse('mouseReleased',point.x+80,point.y+40);
    const after=await evaluate('window.__draft.workspace.plan');
    console.log('After',JSON.stringify({view:after,events:await evaluate('window.__events')}));
    const capture=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temp,'pan.png'),Buffer.from(capture.data,'base64'));
    assert.equal(after.x,before.x+80,'Native background drag updates Project plan X');
    assert.equal(after.y,before.y+40,'Native background drag updates Project plan Y');
    console.log('PASS native DesignEditor/DesignWorkspace mouse panning; actual React and App CSS, mocked Project state and Scene. '+temp);
  } finally { await send('Browser.close').catch(()=>{}); child.kill(); }
}
const timeout=setTimeout(()=>{console.error('Native Design pan timeout: '+temp);child?.kill();process.exit(1);},60000);
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>clearTimeout(timeout));
