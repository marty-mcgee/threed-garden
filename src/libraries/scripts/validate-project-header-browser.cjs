// Optional native React/CSS layout check. Local file only: no HTTP server.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-project-header-'));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let child;

async function main() {
  assert(browser, 'Installed Edge is required');
  // Read the active Scene menu shell rather than duplicating its height/overflow classes.
  const scene = fs.readFileSync(path.join(root, 'src/components/map/ThreeDScene.tsx'), 'utf8');
  const menuClass = scene.match(/className="(threed-workspace-panel threed-toolbar-dropdown-surface absolute[^\"]+)"/)[1];
  const boundedScene = scene.includes('ref={sceneMenuBounds.ref}');
  const source = `import React from 'react';import{createRoot}from'react-dom/client';
import{ProjectHeaderMenu}from'./src/components/map/header/ProjectHeaderMenu';
import{ProjectSceneToolbar}from'./src/components/map/header/ProjectSceneToolbar';
import{useToolbarMenuBounds}from'./src/components/map/header/useToolbarMenuBounds';
import{SceneViewPresetsMenu}from'./src/components/map/panels/SceneViewPresetsMenu';
import{SceneLayersMenu}from'./src/components/map/panels/SceneLayersMenu';
function Fixture(){const[opened,setOpened]=React.useState('title');const bounds=useToolbarMenuBounds(opened==='scene','end');
window.__open=setOpened;window.__ready=true;
const presets=Array.from({length:8},(_,i)=>({id:String(i),name:'Saved view '+i}));
const layers=['models','characters','terrains','beds','plants','plantings','farmbots','waterings','designs','environments'];
return <><header style={{height:48}}>App Header</header><div className="bg-background/50 backdrop-blur-sm"><main className="relative h-[calc(100dvh-48px)]">
<div className="threed-project-toolbar flex flex-wrap items-center justify-between gap-2 px-1 py-1">
<ProjectHeaderMenu selectedProjectId="17" projectName="ThreeD Plan Demo: Fun House" isOpen={opened==='title'} onTrigger={()=>setOpened('title')} onDismiss={()=>setOpened('')} environments={[]} />
<div className="flex flex-wrap items-center gap-1"><ProjectSceneToolbar selectedProjectId="17" canEditProject={true} viewMode="design" presentationComplete={true} hasThreeDModule={true} projectAssetCount={64} sceneAddMenuOpen={opened==='add'} onToggleSceneAddMenu={()=>setOpened('add')} setupMenuOpen={false} onSetupMenuOpenChange={()=>{}} onViewModeChange={()=>{}} />
<div className="relative"><button data-testid="scene-trigger" className="h-7" onClick={()=>setOpened('scene')}>Scene</button>{opened==='scene'&&<div data-testid="scene-menu" ref={${boundedScene ? 'bounds.ref' : 'undefined'}} style={${boundedScene ? 'bounds.style' : 'undefined'}} className={${JSON.stringify(menuClass)}}>
<div style={{height:360}}>Scene settings</div>
<SceneViewPresetsMenu viewPresets={presets} selectedPresetId={null} onLoadPreset={()=>{}} onDeletePreset={()=>{}} />
<SceneLayersMenu availableLayers={layers} activeLayers={new Set(layers)} allAvailableLayersVisible={true} availableTypeCounts={{}} getMarkerColor={()=>'#00aa00'} onToggleAllLayers={()=>{}} onToggleLayer={()=>{}} />
</div>}</div></div></div></main></div></>}
createRoot(document.getElementById('root')).render(<Fixture/>);`;
  const bundle = (await require('esbuild').build({
    stdin: { contents: source, resolveDir: root, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    plugins: [{
      name: 'offline-preview',
      setup(build) {
        build.onLoad({ filter: /src[\\/]components[\\/]threed[\\/]design[\\/].*\.tsx$/ }, async args => ({ contents: (await require('next/dist/compiled/babel/core').transformAsync(fs.readFileSync(args.path, 'utf8'), { filename: args.path, configFile: false, babelrc: false, parserOpts: { plugins: ['typescript', 'jsx'] }, plugins: [['babel-plugin-react-compiler', {}]] })).code, loader: 'tsx' }));
        build.onResolve({ filter: /^next\/dynamic$/ }, args => ({ path: args.path, namespace: 'mock' }));
        build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export default()=>()=>null;', loader: 'js' }));
        build.onResolve({ filter: /^next\/link$/ }, args => ({ path: args.path, namespace: 'mock-link' }));
        build.onLoad({ filter: /.*/, namespace: 'mock-link' }, () => ({ resolveDir: root, contents: 'import React from "react";export default p=>React.createElement("a",p,p.children);', loader: 'js' }));
      },
    }],
    logLevel: 'silent',
  })).outputFiles[0].text;
  const cssPath = path.join(root, 'src/app/globals.css');
  const css = (await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process(fs.readFileSync(cssPath, 'utf8'), { from: cssPath })).css;
  const fixture = path.join(temp, 'fixture.html');
  fs.writeFileSync(fixture, `<html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline';img-src data:;font-src data:"><style>${css}</style></head><body><div id="root"></div><script>window.onerror=(message)=>window.__error=String(message);${bundle.replace(/<\/script/gi, '<\\/script')}</script></body></html>`);
  child = spawn(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', `--user-data-dir=${path.join(temp, 'profile')}`, '--remote-debugging-pipe'], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let next = 0, buffer = '';
  const pending = new Map();
  child.on('error', error => { for (const task of pending.values()) task.reject(error); pending.clear(); });
  child.on('exit', code => { for (const task of pending.values()) task.reject(Error('Browser exited: ' + code)); pending.clear(); });
  child.stdio[4].on('data', chunk => {
    buffer += chunk.toString(); let end;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      const task = pending.get(message.id);
      if (task) { pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result); }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++next; pending.set(id, { resolve, reject }); child.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0'); });
  try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const call = (method, params = {}) => send(method, params, sessionId);
    const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value; };
    await call('Page.navigate', { url: pathToFileURL(fixture).href });
    for (let i = 0; i < 80 && !await evaluate('!!window.__ready'); i++) await delay(100);
    assert(await evaluate('!!window.__ready'), 'Fixture mounted: '+await evaluate('window.__error'));
    const failures = [];
    for (const [width, height] of [[1440, 900], [375, 667], [375, 320]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const menu of ['title', 'add', 'scene']) {
        await evaluate(`window.__open(${JSON.stringify(menu)})`);
        await delay(150);
        const fit = await evaluate(`(()=>{const m=document.querySelector('.threed-project-toolbar .threed-workspace-panel');const b=m.getBoundingClientRect();const toolbar=document.querySelector('.threed-project-toolbar').getBoundingClientRect();return {top:b.top,toolbarBottom:toolbar.bottom,bottom:b.bottom,left:b.left,right:b.right,scroll:m.scrollHeight>m.clientHeight+1,anchorRight:document.querySelector('[data-testid=scene-trigger]').getBoundingClientRect().right,nested:[...m.querySelectorAll('[role=group]')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)).length,horizontal:m.scrollWidth>m.clientWidth+1}})()`);
        console.log(JSON.stringify({width,height,menu,...fit}));
        if(Math.abs(fit.top-fit.toolbarBottom)>1)failures.push(menu+' does not meet toolbar at '+width+'x'+height);
        if(fit.bottom>height-7||fit.left<0||fit.right>width)failures.push(menu+' exceeds viewport at '+width+'x'+height);
        if(menu==='scene'&&width===1440&&Math.abs(fit.right-Math.min(fit.anchorRight,width-8))>1)failures.push('Scene lost right alignment');
        if(fit.nested)failures.push(menu+' has nested scrolling');
        if(fit.horizontal)failures.push(menu+' has horizontal overflow');
        if(menu==='scene'&&width===1440&&fit.scroll)failures.push('Desktop Scene unnecessarily scrolls');
        if(menu==='scene'&&height===320){
          await evaluate(`document.querySelector('[data-testid=scene-menu]').scrollTop=10000`);
          assert(await evaluate(`(()=>{const m=document.querySelector('[data-testid=scene-menu]');const last=m.querySelector('[aria-label="Scene layers"] button:last-child');const a=m.getBoundingClientRect(),b=last.getBoundingClientRect();return b.bottom<=a.bottom+1&&b.top>=a.top})()`), 'Last layer remains reachable on a short screen');
        }
      }
    }
    assert.deepEqual(failures, []);
    console.log('PASS: Title/Add/Scene align beneath the toolbar in a blurred Dashboard parent; one bounded scroll owner, no horizontal overflow and last layer reachable. '+temp);
  } finally { await send('Browser.close').catch(() => {}); child.kill(); }
}
const timeout = setTimeout(() => { console.error('Project header fixture timeout: ' + temp); child?.kill(); process.exit(1); }, 60000);
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(timeout));
