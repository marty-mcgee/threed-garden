// Optional Edge check of actual pages/shared CSS with mocked API/auth boundaries.
// Uses a file fixture and debugging pipes: no HTTP/dev server or database access.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-presentation-browser-'));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const mock = `import React from 'react';
export default function Link({children,...props}){return <a {...props}>{children}</a>}
export const usePathname=()=>window.__path;
export const useRouter=()=>({push:href=>window.__destination=href});
export const useSession=()=>({data:null,status:'unauthenticated'});
export const useTheme=()=>({resolvedTheme:document.documentElement.classList.contains('dark')?'dark':'light',setTheme:()=>{}});
export const useWorkspaceSettings=()=>({preferences:{modules:{threed:true,multimedia:true,traffic:true}}});
export const ProjectTemplateDialog=()=>null;
export const SignOutButton=()=>null;
export const ThreeDProjectLoadingPresentation=()=>null;`;
async function main() {
  assert(browser, 'Install Edge to run this optional native check.');
  const source = `import React from 'react';import{createRoot}from'react-dom/client';
import Dashboard from './src/app/dashboard/page';import Layout from './src/app/dashboard/layout';
import Learn from './src/app/learn/page';import LearnLayout from './src/app/learn/layout';
window.fetch=async url=>{if(!String(url).startsWith('/api/map/projects?'))throw Error('Unexpected fixture request: '+url);return {ok:true,json:async()=>({success:true,projects:[{id:123,name:'A long Project name for narrow-screen verification',slug:'long-project-slug-for-layout-verification',description:'Existing Project content',isPublic:true,assetCount:106,sceneAssetCount:44,moduleCounts:{threed:1,multimedia:1,traffic:1}}],pagination:{offset:0,total:1,limit:24}})}};
function Fixture(){const[page,setPage]=React.useState('dashboard');window.__page=value=>{window.__path='/'+value;setPage(value)};window.__path='/'+page;return page==='learn'?<LearnLayout><Learn/></LearnLayout>:<Layout><Dashboard/></Layout>}
createRoot(document.getElementById('root')).render(<Fixture/>);`;
  const bundle = (await require('esbuild').build({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'offline-boundaries',setup(build){
    build.onResolve({filter:/^(next\/link|next\/navigation|next-auth\/react|@\/components\/(themes\/provider|settings\/WorkspaceSettingsProvider|auth\/SignOutButton|map\/panels\/ProjectTemplateDialog|map\/presentation\/ThreeDProjectLoadingPresentation))$/},args=>({path:args.path,namespace:'mock'}));
    build.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:mock,loader:'tsx',resolveDir:root}));
    build.onResolve({filter:/^@\/components\/navigation\/NavDropdown$/},args=>({path:args.path,namespace:'menu'}));
    build.onLoad({filter:/.*/,namespace:'menu'},()=>({contents:'import React from "react";export default()=> <button aria-label="Navigation menu" className="size-8">Menu</button>',loader:'tsx',resolveDir:root}));
  }}],logLevel:'silent'})).outputFiles[0].text;
  const cssPath = path.join(root,'src/app/globals.css');
  const css = (await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(cssPath,'utf8'),{from:cssPath})).css;
  const fixture = path.join(temp,'fixture.html');
  fs.writeFileSync(fixture, `<html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:"><style>${css}</style></head><body><div id="root"></div><script>${bundle.replace(/<\/script/gi,'<\\/script')}</script></body></html>`);
  const child = spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking',`--user-data-dir=${path.join(temp,'profile')}`,'--remote-debugging-pipe'],{windowsHide:true,stdio:['ignore','ignore','ignore','pipe','pipe']});
  let next=0, buffer=''; const pending=new Map();
  child.on('error',error=>{for(const task of pending.values())task.reject(error);pending.clear();});
  child.on('exit',code=>{for(const task of pending.values())task.reject(Error('Browser exited before replying: '+code));pending.clear();});
  child.stdio[4].on('data',chunk=>{buffer+=chunk.toString();let end;while((end=buffer.indexOf('\0'))>=0){const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);const task=pending.get(message.id);if(task){pending.delete(message.id);message.error?task.reject(Error(JSON.stringify(message.error))):task.resolve(message.result);}}});
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});child.stdio[3].write(JSON.stringify({id,method,params,sessionId})+'\0');});
  try {
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    const call=(method,params={})=>send(method,params,sessionId);
    const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;};
    await call('Page.navigate',{url:require('node:url').pathToFileURL(fixture).href});
    for(let i=0;i<100&&!await evaluate('!!window.__page');i++)await delay(100);
    assert(await evaluate('!!window.__page'),'Fixture mounted');
    for(const page of ['dashboard','learn'])for(const theme of ['dark','light'])for(const width of [1440,640,375,320]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await call('Emulation.setTouchEmulationEnabled',{enabled:width<=640});
      await evaluate(`document.documentElement.className=${JSON.stringify(theme)};window.__page(${JSON.stringify(page)})`);await delay(150);
      const metrics=await evaluate(`(()=>{const h=document.querySelector('h1'),header=document.querySelector('.threed-app-header');const overflow=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)}).slice(0,8).map(e=>({tag:e.tagName,text:e.textContent.slice(0,60)}));return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,offenders:overflow,title:h?.textContent,headerHeight:header?.getBoundingClientRect().height,buttons:[...document.querySelectorAll('button')].filter(b=>b.textContent==='Create Project').length,background:getComputedStyle(document.body).backgroundColor}})()`);
      console.log(page,theme,width,JSON.stringify(metrics));assert(!metrics.overflow,'No page overflow: '+JSON.stringify(metrics));assert.equal(metrics.headerHeight,48);assert(metrics.title);
      const appearance=await evaluate(`(()=>{const panel=document.querySelector('.threed-workspace-panel'),h=document.querySelector('h1'),primary=[...document.querySelectorAll('[data-variant="success"]')][0];return {surface:getComputedStyle(panel).backgroundColor,heading:getComputedStyle(h).fontSize,primary:primary&&getComputedStyle(primary).backgroundColor}})()`);
      console.log('Workspace appearance',page,theme,JSON.stringify(appearance));
      if(page==='learn')assert.equal(appearance.heading,'14px','Uses the existing compact workspace header');
      assert(appearance.primary,'Existing green App action is present');
      const key=async key=>{const event={key,code:key,windowsVirtualKeyCode:key==='Enter'?13:9};await call('Input.dispatchKeyEvent',{type:'keyDown',...event,...(key==='Enter'?{text:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',...event});};
      if(page==='dashboard'){
        assert.equal(metrics.buttons,1);assert(await evaluate(`document.querySelector('a[href="/dashboard/scene?projectId=123"]').getBoundingClientRect().top<document.querySelector('#starting-paths-title').getBoundingClientRect().top`));
        await evaluate(`document.querySelector('button:has(svg)').blur();[...document.querySelectorAll('button')].find(b=>b.textContent==='Create Project').focus()`);await key('Tab');
        assert(await evaluate(`document.activeElement.textContent==='Learn ThreeD'&&document.activeElement.matches(':focus-visible')`),'Learn action follows Create in keyboard order');
      }
      if(page==='learn'){
        await evaluate(`document.querySelector('a[href="#draw-room"]').click()`);await delay(60);assert(await evaluate(`document.querySelector('#draw-room').getBoundingClientRect().top>=48`),'Guide clears sticky header');
        await evaluate(`(()=>{const summary=document.querySelector('summary');summary.parentElement.open=false;summary.focus()})()`);await key('Enter');await delay(60);
        assert(await evaluate(`document.querySelector('details').open`),'Troubleshooting opens with keyboard');
        await evaluate(`document.querySelector('details').open=false;document.activeElement.blur();scrollTo(0,0)`);
      }
      const capture=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temp,`${page}-${theme}-${width}.png`),Buffer.from(capture.data,'base64'));
    }
    console.log('PASS native page layout in both themes at 1440/640/375/320px (coarse pointer at narrow widths); guide anchor clearance. Captures: '+temp);
  } finally { await send('Browser.close').catch(()=>{}); child.kill(); }
}
const timeout=setTimeout(()=>{console.error('Native presentation check timed out');process.exit(1);},60000);
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>clearTimeout(timeout));
