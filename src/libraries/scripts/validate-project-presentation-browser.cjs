// Optional real Edge DOM/CSS check; local file, mocked Scene readiness, no server/GPU.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-project-presentation-'));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function main() {
  assert(browser, 'Edge is required for this optional native check');
  const source = `import React from 'react';import{createRoot}from'react-dom/client';
import{ProjectPresentationBoundary}from'./src/components/map/presentation/ProjectPresentationBoundary';
import{SceneResourceFeedback}from'./src/components/map/presentation/SceneResourceFeedback';
window.__mounts=0;window.__clicks=0;
function Contents({status}){React.useEffect(()=>{window.__mounts++},[]);return <>
<div className="absolute inset-0 bg-green-700" data-scene>Persistent Scene</div>
<aside className="absolute inset-y-0 left-0 z-50 w-48 bg-background">Project Assets</aside>
<div className="absolute right-0 top-0 z-[90] bg-background"><button id="properties" onClick={()=>window.__clicks++}>Design Properties</button><button>Multimedia</button></div>
<div data-intro style={{opacity:status.started?1:0,transition:'opacity 100ms linear'}} onTransitionEnd={()=>window.__status({complete:true})}>Scene introduction</div>
{status.failed&&<button id="failure">Renderer stopped: save before reloading</button>}
<SceneResourceFeedback physicsFailed={status.failed} warningsDismissed={false} resourceFailed={false} visibleResourceIssues={[]} onDismissWarnings={()=>{}} scenePostProduction={status.complete} sceneLoadingProgress={status.progress} sceneLoadingLabel="Preparing Project Characters" sceneProductionStarted={status.started} resourcesPending={!status.complete}/>
</>}
function Fixture(){const[project,setProject]=React.useState('17'),[mapOnly,setMapOnly]=React.useState(false),[status,setStatus]=React.useState({progress:45,complete:false,failed:false,started:false});
window.__status=patch=>setStatus(current=>({...current,...patch}));window.__project=id=>{setStatus({progress:35,complete:false,failed:false,started:false});setProject(id)};window.__map=setMapOnly;
return <><header style={{height:48}}>App Header</header><ProjectPresentationBoundary projectId={project} mapOnly={mapOnly}><Contents status={status}/></ProjectPresentationBoundary></>}
createRoot(document.getElementById('root')).render(<Fixture/>);`;
  const bundle = (await require('esbuild').build({
    stdin: { contents: source, resolveDir: root, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  })).outputFiles[0].text;
  const cssPath = path.join(root, 'src/app/globals.css');
  const css = (await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process(fs.readFileSync(cssPath, 'utf8'), { from: cssPath })).css;
  const fixture = path.join(temp, 'fixture.html');
  fs.writeFileSync(fixture, `<html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><style>${css}</style></head><body><div id="root"></div><script>${bundle.replace(/<\/script/gi, '<\\/script')}</script></body></html>`);
  const child = spawn(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', `--user-data-dir=${path.join(temp, 'profile')}`, '--remote-debugging-pipe'], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let next = 0;
  let buffer = '';
  const pending = new Map();
  child.on('error', error => { for (const task of pending.values()) task.reject(error); pending.clear(); });
  child.on('exit', code => { for (const task of pending.values()) task.reject(Error('Browser exited: ' + code)); pending.clear(); });
  child.stdio[4].on('data', chunk => {
    buffer += chunk.toString();
    let end;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      const task = pending.get(message.id);
      if (task) { pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result); }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++next;
    pending.set(id, { resolve, reject });
    child.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
  try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const call = (method, params = {}) => send(method, params, sessionId);
    const evaluate = async expression => {
      const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      assert(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    await call('Page.navigate', { url: require('node:url').pathToFileURL(fixture).href });
    for (let index = 0; index < 100 && !await evaluate('!!window.__status'); index++) await delay(100);
    assert(await evaluate('!!window.__status'), 'Fixture mounted');
    for (const width of [1440, 375]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await evaluate(`window.__project('project-${width}')`);
      await delay(150);
      assert.equal(await evaluate(`document.querySelector('[data-testid="project-scene-workspace"]').getAttribute('aria-busy')`), 'true');
      const metrics = await evaluate(`(()=>{const loader=document.querySelector('[role="progressbar"]').closest('.absolute');const r=loader.getBoundingClientRect();const point=document.elementFromPoint(innerWidth-10,60);document.querySelector('#properties').focus();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,covers:loader.contains(point),focused:document.activeElement.id,opacity:getComputedStyle(document.querySelector('[data-scene]').parentElement).opacity,mounts:window.__mounts}})()`);
      assert.equal(metrics.top, 48);
      assert.equal(metrics.bottom, 900);
      assert.equal(metrics.width, width);
      assert(metrics.covers, 'Preparation covers higher-z Project overlays');
      assert.notEqual(metrics.focused, 'properties', 'Preparing controls cannot receive keyboard focus');
      assert.equal(metrics.opacity, '0');
      assert.equal(metrics.mounts, 1, 'Project changes do not remount persistent children');
      await evaluate('window.__status({progress:88})');
      await delay(50);
      assert.equal(await evaluate(`document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')`), '88');
      await evaluate('window.__status({started:true})');
      await delay(350);
      assert.equal(await evaluate(`document.querySelector('[data-testid="project-scene-workspace"]').getAttribute('aria-busy')`), 'false', 'Scene transition completes beneath the hidden preparation wrapper');
      await evaluate(`document.querySelector('#properties').focus();document.querySelector('#properties').click()`);
      assert.equal(await evaluate('document.activeElement.id'), 'properties');
      assert(await evaluate('window.__clicks>0'));
      await evaluate('window.__status({complete:false,progress:50})');
      await delay(50);
      assert.equal(await evaluate(`!!document.querySelector('[role="progressbar"]')`), false, 'Later edits do not replay presentation');
      await evaluate(`window.__project('failed-${width}');window.__status({failed:true})`);
      await delay(100);
      assert.equal(await evaluate(`document.querySelector('[data-testid="project-scene-workspace"]').getAttribute('aria-busy')`), 'false');
      await evaluate(`window.__project('map-${width}');window.__map(true)`);
      await delay(100);
      assert.equal(await evaluate(`document.querySelector('[data-testid="project-scene-workspace"]').getAttribute('aria-busy')`), 'false');
      await evaluate('window.__map(false)');
      await delay(50);
      assert.equal(await evaluate(`document.querySelector('[data-testid="project-scene-workspace"]').getAttribute('aria-busy')`), 'true');
    }
    console.log('PASS: desktop/mobile full-workspace preparation, progress, retained mounts, keyboard blocking, Scene transition completion, post-load editing, failure and 2D-only access. Artifacts: ' + temp);
  } finally { await send('Browser.close').catch(() => {}); }
}
const timeout = setTimeout(() => { console.error('Presentation browser check timed out'); process.exit(1); }, 60000);
main().then(() => clearTimeout(timeout), error => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
