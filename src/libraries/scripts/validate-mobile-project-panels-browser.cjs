// Optional native React/CSS layout check. Local file only: no HTTP server.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-mobile-panels-'));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let child;

async function main() {
  assert(browser, 'Installed Edge is required');
  const source = `import React from 'react';import{createRoot}from'react-dom/client';import{createPortal}from'react-dom';
import{DesignEditor}from'./src/components/threed/design/DesignEditor';import{DesignWorkspace}from'./src/components/threed/design/DesignWorkspace';
import{ProjectHeaderMenu}from'./src/components/map/header/ProjectHeaderMenu';import{ProjectSceneToolbar}from'./src/components/map/header/ProjectSceneToolbar';
import{projectArchitectureDraft,reconcileArchitectureSelection}from'./src/libraries/services/threed/design/project-architecture';import{validateDesign,newDesign}from'./src/libraries/services/threed/design/document';
const doc=validateDesign({...newDesign(),nodes:[{id:'a',x:1,z:1},{id:'b',x:5,z:1}],walls:[{id:'wall',levelId:'ground',start:'a',end:'b',height:2.4,thickness:.15,elevation:0}]});
window.__mounts=0;function Scene(){const[token]=React.useState(()=>++window.__mounts);return <div data-testid="scene">Scene {token}</div>}
function Fixture(){const[draft,setDraft]=React.useState(()=>projectArchitectureDraft({version:1,document:doc})),[host,setHost]=React.useState(null),[assets,setAssets]=React.useState(false),[readOnly,setReadOnly]=React.useState(false),[containerWidth,setContainerWidth]=React.useState(null),[designActive,setDesignActive]=React.useState(true),[headerOpen,setHeaderOpen]=React.useState(false),[addOpen,setAddOpen]=React.useState(false),[toolsOpen,setToolsOpen]=React.useState(false);
window.__designActive=setDesignActive;window.__draft=draft;window.__readOnly=setReadOnly;window.__containerWidth=setContainerWidth;window.__selectWall=()=>setDraft(d=>({...d,selected:'wall'}));
const change=React.useCallback(update=>setDraft(d=>reconcileArchitectureSelection(update(d))),[]),visibility=React.useCallback(()=>{},[]),preview=React.useCallback(()=>{},[]);
return <main data-testid="project-scene-workspace" style={containerWidth?{width:containerWidth}:undefined} className="relative h-dvh overflow-hidden"><div className="threed-project-toolbar flex max-w-full flex-wrap items-center gap-1"><ProjectHeaderMenu selectedProjectId="15" projectName="A Project with a very long descriptive name that must never force the viewport wider" isOpen={headerOpen} onTrigger={()=>setHeaderOpen(v=>!v)} onDismiss={()=>setHeaderOpen(false)} environments={[]}/><button className="min-h-11 px-3" id="assets-toggle" onClick={()=>setAssets(v=>!v)}>Assets</button><ProjectSceneToolbar selectedProjectId="15" canEditProject={true} viewMode="design" presentationComplete={true} hasThreeDModule={true} projectAssetCount={1} sceneAddMenuOpen={addOpen} onToggleSceneAddMenu={()=>setAddOpen(v=>!v)} setupMenuOpen={toolsOpen} onSetupMenuOpenChange={setToolsOpen} onViewModeChange={()=>{}} onToggleWeather={()=>{}} onToggleMultimedia={()=>{}}/></div>
<section id="project-weather-overlay" className="pointer-events-none absolute right-2 top-[38px] h-96 w-80 max-w-[calc(100%-1rem)] overflow-hidden">Fixture overlay</section>
{host&&createPortal(assets?<div data-testid="assets" className="threed-workspace-panel threed-scene-sidebar-size h-full border p-2"><button id="assets-close" onClick={()=>setAssets(false)}>Close Assets</button><input aria-label="Asset search"/></div>:null,host)}
<DesignWorkspace active={designActive} assetsHostRef={setHost} split={45} onSplitChange={()=>{}} editor={<DesignEditor canSave={!readOnly} scene={{projectId:15,projectName:'Fixture',draft,onChange:change,onSave:async()=>{},saving:false,onPreview:preview,onVisibility:visibility}}/>}><Scene/></DesignWorkspace></main>}
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
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 844, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: pathToFileURL(fixture).href });
    for (let i = 0; i < 80 && !await evaluate('!!window.__draft'); i++) await delay(100);
    assert(await evaluate('!!window.__draft'), 'Actual editor mounts: '+await evaluate('window.__error')); await delay(150);
    await evaluate(`window.__plan=document.querySelector('[data-testid="home-plan"]');window.__scene=document.querySelector('[data-testid="scene"]');void 0;`);
    for (const width of [280, 300, 320, 360, 375, 390, 430, 480, 540, 600, 667, 700, 701, 740, 768, 820, 844, 895, 896, 897, 960, 1024, 1100, 1200, 1280, 1440, 1600, 1920]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: [667, 844, 1024].includes(width) ? 320 : 844, deviceScaleFactor: 1, mobile: false }); await delay(100);
      const state = await evaluate(`(()=>{const plan=document.querySelector('[data-testid="home-plan"]'),scene=document.querySelector('[data-testid="design-scene-column"]'),props=document.querySelector('[data-testid="design-properties-panel"]');return {planWidth:plan.getBoundingClientRect().width,sceneWidth:scene.getBoundingClientRect().width,display:getComputedStyle(props).display,stable:window.__plan===plan&&window.__scene===document.querySelector('[data-testid="scene"]'),mounts:window.__mounts,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
      assert(state.stable && state.mounts === 1, 'Editor/Scene owners persist'); assert(!state.overflow, 'No document overflow');
      if (width <= 896) {
        assert(state.planWidth >= width - 17, 'Phone plan width: ' + JSON.stringify({width,...state})); assert(state.sceneWidth >= width - 17, 'Phone Scene width'); assert.equal(state.display, 'flex');
        assert(await evaluate(`(()=>{const scene=document.querySelector('[data-testid="design-scene-column"]').getBoundingClientRect(),plan=document.querySelector('.threed-design-plan-column').getBoundingClientRect(),props=document.querySelector('[data-testid="design-properties-panel"]').getBoundingClientRect();return plan.top>=scene.bottom-1&&props.top>=plan.bottom-1})()`), 'Canvases precede Properties');
        await evaluate(`document.querySelector('button[aria-controls="design-properties-15"]').click()`); await delay(80);
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-testid="design-properties-panel"]')).display`), 'flex');
        assert.equal(await evaluate('document.activeElement.id'), 'design-properties-15');
        await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Back to canvases').click()`); await delay(80);
        assert.equal(await evaluate('document.activeElement.dataset.testid'), 'design-scene-column');
      } else {
        const panelWidth = Math.max(224, Math.min(288, width * 0.24));
        assert.equal(state.display, 'flex'); assert(Math.abs(state.sceneWidth - (width - panelWidth)) <= 2, 'Fluid desktop Assets dock'); assert(Math.abs(state.planWidth - (width - panelWidth)) <= 2, 'Fluid desktop Properties dock');
      }
      const placement = await evaluate(`(()=>{const shell=document.querySelector('[data-testid="project-scene-workspace"]').getBoundingClientRect(),toolbar=document.querySelector('.threed-project-toolbar').getBoundingClientRect(),panel=document.querySelector('#project-weather-overlay').getBoundingClientRect();return {top:panel.top,bottom:panel.bottom,toolbarBottom:toolbar.bottom,shellBottom:shell.bottom}})()`);
      assert(placement.top >= placement.toolbarBottom - 1 && placement.bottom <= placement.shellBottom + 1, 'Overlay follows wrapped toolbar and available height');
      await evaluate(`document.querySelector('#assets-toggle').click()`); await delay(60);
      assert(await evaluate(`!!document.querySelector('[data-testid="assets"]')`)); assert.equal(await evaluate('window.__mounts'), 1);
      if (width <= 896) assert(await evaluate(`(()=>{const plan=document.querySelector('.threed-design-plan-column').getBoundingClientRect(),assets=document.querySelector('[data-testid="design-assets-host"]').getBoundingClientRect(),props=document.querySelector('[data-testid="design-properties-panel"]').getBoundingClientRect();return assets.top>=plan.bottom-1&&props.top>=assets.bottom-1})()`), 'Assets follow both canvases and precede Properties');
      await evaluate(`document.querySelector('#assets-close').click()`); await delay(60);
      console.log('PASS actual responsive panel layout at ' + width + 'px');
      for (const label of ['Add', 'A Project with']) {
        await evaluate(`Array.from(document.querySelectorAll('.threed-project-toolbar button')).find(b=>b.textContent.trim().startsWith(${JSON.stringify(label)})).click()`); await delay(80);
        assert(await evaluate(`(()=>{const menu=Array.from(document.querySelectorAll('.threed-project-toolbar .threed-workspace-panel')).find(e=>getComputedStyle(e).position==='fixed');if(!menu)return false;const b=menu.getBoundingClientRect();return b.left>=7&&b.right<=innerWidth-7&&b.top>=0&&b.bottom<=innerHeight-7&&menu.scrollHeight>=menu.clientHeight})()`), 'Custom menu stays reachable at ' + width + ': ' + label);
        if (label === 'Add') await evaluate(`Array.from(document.querySelectorAll('.threed-project-toolbar button')).find(b=>b.textContent.trim()==='Add').click()`);
        else { await call('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape'}); await evaluate(`Array.from(document.querySelectorAll('.threed-project-toolbar button')).find(b=>b.textContent.includes('A Project with')).click()`); }
      }
    }
    await call('Emulation.setTouchEmulationEnabled', { enabled: true });
    await call('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true }); await delay(150);
    assert(await evaluate(`matchMedia('(any-pointer: coarse)').matches`), 'Touch emulation enabled');
    assert(await evaluate(`Array.from(document.querySelectorAll('.threed-project-toolbar button')).filter(b=>b.getBoundingClientRect().width>0).every(b=>b.getBoundingClientRect().width>=44&&b.getBoundingClientRect().height>=44)`), 'Touch toolbar targets are at least 44px');
    const toolsPoint = await evaluate(`(()=>{const box=Array.from(document.querySelectorAll('.threed-project-toolbar button')).find(b=>b.textContent.trim()==='Tools').getBoundingClientRect();return {x:box.left+box.width/2,y:box.top+box.height/2}})()`);
    await call('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...toolsPoint});
    await call('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...toolsPoint}); await delay(150);
    assert(await evaluate(`(()=>{const menu=document.querySelector('[role="menu"]');if(!menu)return false;const box=menu.getBoundingClientRect();return box.left>=0&&box.right<=innerWidth&&box.bottom<=innerHeight&&Array.from(menu.querySelectorAll('[role="menuitem"]')).every(item=>item.getBoundingClientRect().height>=43.9)})()`), 'Radix Tools menu is bounded with touch targets: '+await evaluate(`(()=>{const m=document.querySelector('[role=menu]');return JSON.stringify({box:m?.getBoundingClientRect().toJSON(),width:innerWidth,height:innerHeight,items:Array.from(m?.querySelectorAll('[role=menuitem]')??[]).map(e=>e.getBoundingClientRect().height)})})()`));
    await call('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape'}); await delay(100);
    await call('Emulation.setTouchEmulationEnabled', { enabled: false });
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 844, deviceScaleFactor: 1, mobile: false });
    await evaluate('window.__containerWidth(375)'); await delay(150);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-testid="design-properties-panel"]')).display`), 'flex');
    assert(await evaluate(`document.querySelector('[data-testid="home-plan"]').getBoundingClientRect().width >= 358`), 'Narrow embedded workspace uses its own width, not device width');
    await evaluate(`document.querySelector('button[aria-controls="design-properties-15"]').click()`); await delay(100);
    assert.equal(await evaluate('document.activeElement.id'), 'design-properties-15');
    await evaluate('window.__containerWidth(null)'); await delay(100);
    for (const height of [240, 320, 480, 667, 844, 1080]) {
      await call('Emulation.setDeviceMetricsOverride', { width: 375, height, deviceScaleFactor: 1, mobile: false }); await delay(100);
      await evaluate(`document.querySelector('button[aria-controls="design-properties-15"]').click()`); await delay(60);
      const fit = await evaluate(`(()=>{const plan=document.querySelector('[data-testid="home-plan"]').getBoundingClientRect(),panel=document.querySelector('[data-testid="design-properties-panel"]').getBoundingClientRect(),shell=document.querySelector('[data-testid="project-scene-workspace"]').getBoundingClientRect();return {planHeight:plan.height,panelHeight:panel.height,fieldsHeight:document.querySelector('[data-testid="design-controls"]').clientHeight,bottom:panel.bottom,limit:shell.bottom}})()`);
      assert(fit.planHeight > 0 && fit.panelHeight > 0 && fit.fieldsHeight > 0, 'Canvases and scrollable fields remain usable at height ' + height + ': ' + JSON.stringify(fit));
      await evaluate(`document.querySelector('button[aria-controls="design-properties-15"]').click()`);
    }
    await call('Emulation.setDeviceMetricsOverride', { width: 375, height: 844, deviceScaleFactor: 1, mobile: false });
    await evaluate(`window.__selectWall();document.querySelector('button[aria-controls="design-properties-15"]').click()`); await delay(120);
    assert(await evaluate(`(()=>{const e=document.querySelector('input[aria-label="Height (in)"]');e.focus();e.select();return !!e})()`));
    await call('Input.insertText', { text: '96' }); await delay(100);
    assert(Math.abs(await evaluate('window.__draft.history.present.walls[0].height') - 2.4384) < 1e-6, 'Field edit updates existing draft');
    await evaluate(`document.querySelector('button[aria-controls="design-properties-15"]').click();document.querySelector('button[aria-controls="design-properties-15"]').click()`); await delay(100);
    assert.equal(await evaluate(`document.querySelector('input[aria-label="Height (in)"]').value`), '96'); assert.equal(await evaluate('window.__draft.selected'), 'wall');
    for (const width of [1024, 375]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false }); await delay(100);
      assert.equal(await evaluate(`document.querySelector('input[aria-label="Height (in)"]').value`), '96');
      assert.equal(await evaluate('window.__draft.selected'), 'wall');
      assert(await evaluate(`window.__plan===document.querySelector('[data-testid="home-plan"]')&&window.__scene===document.querySelector('[data-testid="scene"]')&&window.__mounts===1`));
    }
    await evaluate('window.__designActive(false)'); await delay(100);
    await evaluate(`document.querySelector('#assets-toggle').click()`); await delay(80);
    assert(await evaluate(`(()=>{const scene=document.querySelector('[data-testid="design-scene-column"]').getBoundingClientRect(),assets=document.querySelector('[data-testid="design-assets-host"]').getBoundingClientRect();return assets.top>=scene.bottom-1})()`), 'Single Scene view also places Assets below canvas');
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 844, deviceScaleFactor: 1, mobile: false }); await delay(100);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-testid="design-assets-host"]')).position`), 'absolute');
    assert(await evaluate(`document.querySelector('[data-testid="design-scene-column"]').getBoundingClientRect().width>=1438`), 'Desktop single Scene retains full width');
    await evaluate(`document.querySelector('#assets-close').click();window.__designActive(true)`); await delay(100);
    await call('Emulation.setDeviceMetricsOverride', { width: 375, height: 844, deviceScaleFactor: 1, mobile: false }); await delay(100);
    assert(await evaluate(`window.__plan===document.querySelector('[data-testid="home-plan"]')&&window.__scene===document.querySelector('[data-testid="scene"]')&&window.__mounts===1`), 'View changes retain Scene and plan owners');
    await evaluate('window.__readOnly(true)'); await delay(80);
    assert(await evaluate(`document.querySelector('input[aria-label="Height (in)"]').matches(':disabled')`));
    const capture = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(temp, 'mobile-properties.png'), Buffer.from(capture.data, 'base64'));
    console.log('PASS native draft/selection retention and read-only guard; real editor/CSS, fixture Scene/Assets. ' + temp);
  } finally { await send('Browser.close').catch(() => {}); child.kill(); }
}
const timeout = setTimeout(() => { console.error('Mobile panel fixture timeout: ' + temp); child?.kill(); process.exit(1); }, 60000);
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(timeout));
