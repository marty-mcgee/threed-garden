// Optional Edge DOM/WebGL check; local file, mocked auth/API, software rendering, no server.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-assembly-workspace-'));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function main() {
  assert(browser, 'Edge is required for this optional native check');
  const source = "import React from 'react';import{createRoot}from'react-dom/client';\nimport{AssemblyCompositionWorkspace}from'./src/components/threed/assemblies/AssemblyCompositionWorkspace';\nimport{AssemblyGroupsList}from'./src/components/admin/threed/assemblies/AssemblyGroupsList';\nimport{ModuleAppearanceProvider}from'./src/components/settings/ModuleAppearanceProvider';\nimport{defaultModuleAppearance}from'./src/libraries/config/module-appearance';\nwindow.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));window.__saved={};for(let i=1;i<=135;i++){const id=String(i).padStart(8,'0')+'-0000-4000-8000-000000000001';window.__saved[id]={formatVersion:1,id,ownerId:'owner-fixture',name:'Record '+String(i).padStart(3,'0'),revision:1,components:[{id:'part',modelId:12,label:'Part',transform:{position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0},scale:1}}]}}window.__deletes=0;window.__posts=0;window.confirm=()=>true;\nwindow.fetch=async(url,init={})=>{if(url==='/api/settings/module-appearance'){const snapshot=defaultModuleAppearance();snapshot.styles.assemblyGroups={icon:'Star',color:'amber'};return Response.json({snapshot,canEdit:false})}\nif(String(url).startsWith('/api/threed/models?')){if(init.method&&init.method!=='GET')throw Error('Preview must never write Models');const id=new URL(url,'https://fixture.invalid').searchParams.get('id');if(id){window.__modelReads=(window.__modelReads||0)+1;if(window.__failModelRead)return Response.json({success:false,error:'Unavailable Model'},{status:403})}return Response.json({success:true,data:id?{id:12,modelName:'FarmBot: Box',modelType:'procedural',filePath:'',scale:1,metadata:{activeSource:'shape',fallbackShape:'box'}}:[{id:12,modelName:'FarmBot: Box',modelType:'procedural'}],pagination:{total:1}})}\nif(String(url).startsWith('/api/threed/assembly-groups')){\nconst p=new URL(url,'https://fixture.invalid').searchParams,id=p.get('id');\nif(init.method==='DELETE'){window.__deletes++;if(window.__failDelete)return Response.json({success:false,error:'Delete conflict'},{status:409});delete window.__saved[id];return Response.json({success:true,data:{id}})}\nif(init.method==='POST'){window.__posts++;window.__payload=JSON.parse(init.body);if(window.__failSave)return Response.json({success:false,error:'Conflict: draft retained'},{status:409});const b=window.__payload,d={...b.definition,revision:b.expectedRevision+1};return new Promise(resolve=>{window.__releaseSave=()=>{window.__saved[d.id]=d;resolve(Response.json({success:true,data:d}))}})}\nif(id)return Response.json({success:true,data:window.__saved[id]});\nconst rows=Object.values(window.__saved).map(d=>({id:d.id,name:d.name,revision:d.revision,updatedAt:'2026-11-01T12:00:00Z'})).filter(d=>d.name.toLowerCase().includes((p.get('search')||'').toLowerCase()));const offset=Number(p.get('offset')||0),limit=Number(p.get('limit')||25);return Response.json({success:true,data:{items:rows.slice(offset,offset+limit),total:rows.length,offset,limit}})}\nthrow Error('Unexpected request '+url)};\nwindow.__downloads=[];URL.createObjectURL=blob=>{window.__downloads.push(blob);return 'blob:fixture'};URL.revokeObjectURL=()=>{};const originalClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(!this.download)originalClick.call(this)};\nfunction Fixture(){const[path,setPath]=React.useState('/admin/threed/assembly-groups');window.__path=path;window.__navigate=setPath;const leaf=path.split('/').pop(),list=leaf==='assembly-groups';return <div className=\"flex h-dvh flex-col\"><header className=\"h-12 shrink-0\">Admin</header><main className=\"min-h-0 flex-1 overflow-hidden p-2\"><ModuleAppearanceProvider>{list?<AssemblyGroupsList/>:<AssemblyCompositionWorkspace key={path} recordId={leaf==='new'?undefined:leaf}/>}</ModuleAppearanceProvider></main><footer className=\"h-5 shrink-0\">Admin footer</footer></div>}\ncreateRoot(document.getElementById('root')).render(<Fixture/>);window.__mounted=true;";
  const canvasProbe = { name: 'canvas-probe', setup(build) {
    build.onLoad({ filter: /[\\/]SafeCanvas\.tsx$/ }, args => ({
      contents: fs.readFileSync(args.path, 'utf8').replace('<RenderGuard />', '<RenderGuard /><AssemblyProbe />') + '\nimport * as AssemblyThree from "three";window.__assemblyThree=AssemblyThree;function AssemblyProbe(){const state=useThree();useEffect(()=>{window.__assemblyState=state;},[state]);return null}',
      loader: 'tsx',
      resolveDir: path.dirname(args.path),
    }));
  } };
  const bundle = (await require('esbuild').build({
    stdin: { contents: source, resolveDir: root, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"', 'import.meta.url': '"https://fixture.invalid/offline-module.js"' },
    plugins: [canvasProbe, {name:'mock-session',setup(build){build.onResolve({filter:/^(next\/navigation|next\/link)$/},args=>({path:args.path,namespace:'navigation'}));build.onLoad({filter:/.*/,namespace:'navigation'},args=>({contents:args.path==='next/link'?'import React from "react";export default function Link({children,...props}){return <a {...props} onClick={e=>{e.preventDefault();window.__navigate(props.href)}}>{children}</a>}':'export const usePathname=()=>window.__path;export const useRouter=()=>({push:href=>window.__navigate(href),replace:href=>window.__navigate(href)});',loader:'tsx',resolveDir:root}));build.onResolve({filter:/ModuleAlbumsButton$/},()=>({path:'albums',namespace:'albums'}));build.onLoad({filter:/.*/,namespace:'albums'},()=>({contents:'export const ModuleAlbumsButton=()=>null',loader:'js'}));build.onResolve({filter:/^next-auth\/react$/},()=>({path:'session',namespace:'mock'}));build.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const useSession=()=>({data:{user:{id:"owner-fixture"}},status:"authenticated"})',loader:'js'}))}}],
    logLevel: 'silent',
  })).outputFiles[0].text;
  const cssPath = path.join(root, 'src/app/globals.css');
  const css = (await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process(fs.readFileSync(cssPath, 'utf8'), { from: cssPath })).css;
  const fixture = path.join(temp, 'fixture.html');
  fs.writeFileSync(fixture, `<html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><style>${css}</style></head><body><div id="root"></div><script>${bundle.replace(/<\/script/gi, '<\\/script')}</script></body></html>`);
  const child = spawn(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--in-process-gpu', `--user-data-dir=${path.join(temp, 'profile')}`, '--remote-debugging-pipe'], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let next = 0;
  let buffer = '';
  const exceptions = [];
  const pending = new Map();
  child.on('error', error => { for (const task of pending.values()) task.reject(error); pending.clear(); });
  child.on('exit', code => { for (const task of pending.values()) task.reject(Error('Browser exited: ' + code)); pending.clear(); });
  child.stdio[4].on('data', chunk => {
    buffer += chunk.toString();
    let end;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
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
    await call('Runtime.enable');
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
    await call('Page.navigate', { url: require('node:url').pathToFileURL(fixture).href });
    const waitFor=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50)}throw Error('Timed out: '+expression+' '+await evaluate('document.body.innerText')+' '+JSON.stringify(exceptions))};
    const click=async label=>evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==="+JSON.stringify(label)+").click()");
    const change=async(selector,value)=>evaluate("(()=>{const e=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+JSON.stringify(value)+");e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    const field = async (label, value) => evaluate("(()=>{const e=[...document.querySelectorAll('label')].find(l=>l.textContent==="+JSON.stringify(label)+").querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+JSON.stringify(value)+");e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    const nativeClick = async ({ x, y }) => {
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    };
    const nativeTool = async label => {
      const point = await evaluate(`(() => {
        const toolbar = document.querySelector('[aria-label="Assembly canvas tools"]');
        const button = [...toolbar.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)} || b.getAttribute('aria-label') === ${JSON.stringify(label)});
        button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const rect = button.getBoundingClientRect();
        const x = rect.x + rect.width / 2;
        const y = rect.y + rect.height / 2;
        return {
          x,
          y,
          disabled: button.matches(':disabled'),
          hit: button.contains(document.elementFromPoint(x, y)),
          hitTarget: document.elementFromPoint(x, y)?.outerHTML.slice(0, 250),
        };
      })()`);
      assert(!point.disabled, `Native ${label} click is blocked by disabled state`);
      assert(point.hit, `Native ${label} click is intercepted: ${JSON.stringify(point)}`);
      await nativeClick(point);
    };
    await waitFor('!!window.__navigate');
    for(const width of [1440,375]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await evaluate("document.documentElement.className="+JSON.stringify(width===1440?'dark':'light'));await evaluate("window.__navigate('/admin/threed/assembly-groups')");
      await waitFor("!!document.querySelector('input[aria-label=\"Search Assembly Groups\"]')");await change('input[aria-label="Search Assembly Groups"]','');
      await waitFor("!!document.querySelector('table tbody tr a')");
      assert(await evaluate("document.querySelector('h1').textContent==='Assembly Groups'"));
      for (let page = 0; page < 5; page++) {
        await click('Next');
        const firstRecord = 'Record ' + String((page + 1) * 25 + 1).padStart(3, '0');
        await waitFor(`document.querySelector('table').textContent.includes(${JSON.stringify(firstRecord)})`);
      }
      await waitFor("document.querySelector('table').textContent.includes('Record 126')");
      const listCapture=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temp,'assembly-list-'+width+'.png'),Buffer.from(listCapture.data,'base64'));
      await evaluate("document.querySelector('a[href$=\"/new\"]').click()");await waitFor("!!document.querySelector('button[aria-label=\"Add FarmBot: Box\"]')");
      const layout=await evaluate("(()=>{const f=document.querySelector('[aria-label=\"Assembly actions\"]');return{first:f.querySelector('button').textContent.trim(),green:f.classList.contains('bg-emerald-50'),newInFooter:f.textContent.includes('New Assembly'),modelsLink:!!document.querySelector('a[href=\"/admin/threed/models\"]'),headerAdd:[...document.querySelectorAll('header button')].some(b=>b.textContent.includes('New Assembly')),overflow:document.documentElement.scrollWidth>innerWidth}})()");
      assert.equal(layout.first,'Save Changes');assert(layout.green&&layout.headerAdd);assert(!layout.newInFooter&&!layout.modelsLink&&!layout.overflow);
      const sections = await evaluate("(()=>{const controls=document.querySelector('[aria-label=\"Assembly controls\"]'),canvas=document.querySelector('[aria-label=\"Assembly 3D canvas\"]'),a=controls.getBoundingClientRect(),b=canvas.getBoundingClientRect();return{order:[...controls.querySelectorAll(':scope>section')].map(s=>s.getAttribute('aria-label')),siblings:controls.parentElement===canvas.parentElement&&canvas.parentElement.children.length===2,controls:{x:a.x,y:a.y,right:a.right,height:a.height},canvas:{x:b.x,y:b.y,width:b.width,height:b.height},footerHelp:!!canvas.querySelector(':scope>p')}})()");
      assert.deepEqual(sections.order, ['Assembly details', 'Available Models', 'Assembly components', 'Component transform']);
      assert(sections.siblings && !sections.footerHelp);
      const spacing = await evaluate(`(() => {
        const controls = document.querySelector('[aria-label="Assembly controls"]');
        const panels = [...controls.querySelectorAll(':scope>section')];
        return {
          rootGap: getComputedStyle(document.querySelector('main main')).rowGap,
          gridGap: getComputedStyle(controls.parentElement).columnGap,
          padding: panels.map(panel => ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].map(key => getComputedStyle(panel)[key])),
          headerInsets: panels.slice(1).map(panel => panel.querySelector('h2 svg').getBoundingClientRect().left - document.querySelector('input[aria-label="Search Models"]').getBoundingClientRect().left),
          gaps: panels.slice(1).map((panel, index) => panel.getBoundingClientRect().top - panels[index].getBoundingClientRect().bottom),
        };
      })()`);
      assert.equal(spacing.rootGap, '8px');
      assert.equal(spacing.gridGap, '8px');
      assert(spacing.padding.flat().every(value => parseFloat(value) <= 8), 'Control panels must retain compact internal padding');
      assert(spacing.headerInsets.every(value => Math.abs(value) < 1), 'Collapse headers must align with the field edges without inherited SVG-button padding');
      assert(spacing.gaps.every(value => Math.abs(value - 8) < 1), 'Every control section must have the same compact separation');
      assert(await evaluate("!document.querySelector('[aria-label=\"Assembly 3D canvas\"]').innerText.includes('Add Models from the library')"), 'Placement instructions must live in Help, not in a bottom canvas banner');
      const tools = await evaluate(`(() => {
        const canvas = document.querySelector('[aria-label="Assembly 3D canvas"]');
        const toolbar = canvas.querySelector('[aria-label="Assembly canvas tools"]');
        const viewport = canvas.querySelector('canvas').getBoundingClientRect();
        const bar = toolbar.getBoundingClientRect();
        const style = getComputedStyle(toolbar);
        return {
          overlay: toolbar.parentElement.contains(canvas.querySelector('canvas')),
          position: style.position,
          background: style.backgroundColor,
          topInset: bar.top - viewport.top,
          rightInset: viewport.right - bar.right,
          width: bar.width,
          viewportWidth: viewport.width,
          viewportTop: viewport.top,
          sectionTop: canvas.getBoundingClientRect().top,
        };
      })()`);
      assert(tools.overlay && tools.position === 'absolute');
      assert.notEqual(tools.background, 'rgba(0, 0, 0, 0)', 'Tools must have one shared group background');
      assert(Math.abs(tools.topInset - 8) < 1 && Math.abs(tools.rightInset - 8) < 1, 'Tools must retain compact canvas insets');
      assert(Math.abs(tools.viewportTop - tools.sectionTop) <= 1, 'Canvas must not retain an empty toolbar header strip');
      assert(tools.width <= tools.viewportWidth - 16 + 1, 'Tools must fit inside narrow viewports');
      if (width === 1440) {
        assert(Math.abs(sections.controls.y - sections.canvas.y) < 1, 'Canvas must start beside Assembly name');
        assert(sections.canvas.x >= sections.controls.right && sections.canvas.width > 1000, 'Canvas must occupy remaining width without a right inspector');
        assert(Math.abs(sections.controls.height - sections.canvas.height) < 1, 'Controls and Canvas must fill the same workspace height');
        assert(Math.abs(sections.canvas.x - sections.controls.right - 8) < 1, 'Controls and Canvas must retain compact, even separation');
        assert(tools.width < tools.viewportWidth / 2, 'Desktop toolbar must fit its controls instead of spanning the Canvas');
      }
      await evaluate("document.querySelector('button[aria-label=\"Assembly Groups help\"]').click()");await waitFor("[...document.querySelectorAll('[role=\"tooltip\"]')].some(t=>t.textContent.includes('Add Models from the library'))");await evaluate("document.querySelector('button[aria-label=\"Assembly Groups help\"]').click()");
      await nativeTool('Assembly canvas help');
      await waitFor("[...document.querySelectorAll('[role=\"tooltip\"]')].some(t=>t.textContent.includes('Drag empty space to orbit'))");
      assert(await evaluate("[...document.querySelectorAll('[role=\"tooltip\"]')].some(t=>t.textContent.includes('Add Models from the library'))"));
      await nativeTool('Assembly canvas help');
      await waitFor("![...document.querySelectorAll('[role=\"tooltip\"]')].some(t=>t.textContent.includes('Drag empty space to orbit'))");
      await nativeTool('Rotate');
      await waitFor("[...document.querySelectorAll('[aria-label=\"Assembly canvas tools\"] button')].find(b=>b.textContent.trim()==='Rotate').getAttribute('aria-pressed')==='true'");
      if(width===1440)await evaluate('window.__failModelRead=true');
      await evaluate("document.querySelector('button[aria-label=\"Add FarmBot: Box\"]').click()");await evaluate("document.querySelector('button[aria-label=\"Add FarmBot: Box\"]').click()");await change('label:has(input) input','Created '+width);
      if (width === 1440) {
        await waitFor("!!document.querySelector('[aria-label=\"Assembly 3D canvas\"] [role=\"alert\"]')");
        assert.equal(await evaluate("document.querySelectorAll('[aria-label=\"Assembly components\"] button[aria-pressed]').length"),2,'Failed asset reads must retain occurrences');
        await evaluate('window.__failModelRead=false');await click('Retry Models');
        await waitFor("!!window.__assemblyState?.scene.children.length&&!document.querySelector('[aria-label=\"Assembly 3D canvas\"]').innerText.includes('Loading')");
        await evaluate("window.__assemblyCanvas=document.querySelector('[aria-label=\"Assembly 3D canvas\"] canvas');window.__assemblyIds=[];window.__assemblyState.scene.traverse(o=>{if(o.userData.assemblyComponentId)window.__assemblyIds.push(o.userData.assemblyComponentId)});");
        assert.equal(await evaluate('window.__assemblyIds.length'), 2);
        await field('Position X', '3');
        await waitFor("window.__assemblyState.scene.getObjectByName('assembly-component:'+window.__assemblyIds[1]).position.x===3");
        await nativeTool('Fit all'); await delay(400);
        await nativeTool('Move');
        await waitFor("[...document.querySelectorAll('[aria-label=\"Assembly canvas tools\"] button')].find(b=>b.textContent.trim()==='Move').getAttribute('aria-pressed')==='true'");
        const project = "const T=window.__assemblyThree,s=window.__assemblyState,r=s.gl.domElement.getBoundingClientRect();";
        const first = await evaluate("(()=>{"+project+"const o=s.scene.getObjectByName('assembly-component:'+window.__assemblyIds[0]),p=new T.Vector3(0,.7,0).applyMatrix4(o.matrixWorld).project(s.camera);return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2}})()");
        await nativeClick(first);
        await waitFor("document.querySelector('[aria-label=\"Assembly components\"] button[aria-pressed=\"true\"]').textContent.startsWith('1.')");
        await waitFor("(()=>{let c;window.__assemblyState.scene.traverse(o=>{if(o.isTransformControls)c=o});return c?.getMode()==='translate'&&c.object?.name==='assembly-component:'+window.__assemblyIds[0]})()");
        await delay(100);
        const handlePoint = async mode => evaluate("(()=>{"+project+"let c;s.scene.traverse(o=>{if(o.isTransformControls)c=o});const h=c.gizmo.gizmo["+JSON.stringify(mode)+"].children.find(o=>o.name==='Y'&&o.isMesh&&o.visible);const p=new T.Box3().setFromObject(h).getCenter(new T.Vector3()).project(s.camera);return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2}})()");
        const drag = async (point, dx, dy) => {
          await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
          await call('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
          for (let i = 1; i <= 5; i++) { await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + dx * i / 5, y: point.y + dy * i / 5, button: 'left', buttons: 1 }); await delay(20); }
          await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x + dx, y: point.y + dy, button: 'left', clickCount: 1 });
        };
        await drag(await handlePoint('translate'), 0, -40);
        await waitFor("Number([...document.querySelectorAll('label')].find(l=>l.textContent==='Position Y').querySelector('input').value)>.1");
        assert.equal(await evaluate("window.__assemblyState.scene.getObjectByName('assembly-component:'+window.__assemblyIds[1]).position.y"), 0, 'Moving one occurrence changed its sibling');
        await nativeTool('Rotate');
        await waitFor("(()=>{let c;window.__assemblyState.scene.traverse(o=>{if(o.isTransformControls)c=o});return c?.getMode()==='rotate'})()");
        await nativeTool('Scale'); await delay(100);
        await drag(await handlePoint('scale'), 0, -20);
        await waitFor("Number([...document.querySelectorAll('label')].find(l=>l.textContent==='Scale').querySelector('input').value)>1.01");
        assert(await evaluate("(()=>{const o=window.__assemblyState.scene.getObjectByName('assembly-component:'+window.__assemblyIds[0]);return o.scale.x===o.scale.y&&o.scale.y===o.scale.z})()"), 'Gizmo must retain uniform scale');
        await field('Rotation Z (°)', '90');
        await waitFor("Math.abs(window.__assemblyState.scene.getObjectByName('assembly-component:'+window.__assemblyIds[0]).rotation.z-Math.PI/2)<1e-8");
        await evaluate('window.__beforeFocus=window.__assemblyState.camera.position.clone()');
        await nativeTool('Focus selected'); await delay(400);
        assert(await evaluate('window.__assemblyState.camera.position.distanceTo(window.__beforeFocus)>.001'), 'Physical Focus selected click must move the camera');
        await evaluate('window.__beforeFit=window.__assemblyState.camera.position.clone()');
        await nativeTool('Fit all'); await delay(400);
        assert(await evaluate('window.__assemblyState.camera.position.distanceTo(window.__beforeFit)>.001'), 'Physical Fit all click must move the camera');
        assert(await evaluate("window.__assemblyCanvas===document.querySelector('[aria-label=\"Assembly 3D canvas\"] canvas')"), 'Selection/fields/gizmo/camera must retain Canvas');
        await click('Export Draft');
        const visual = await evaluate('window.__downloads.at(-1).text().then(JSON.parse)');
        assert(visual.components[0].transform.position.y > .1);
        assert(visual.components[0].transform.scale > 1.01);
        assert(Math.abs(visual.components[0].transform.rotation.z - Math.PI/2) < 1e-8);
        // Retain the existing repeated-component Save assertions below.
        await evaluate("document.querySelector('[aria-label=\"Assembly components\"] button:nth-child(2)').click()");
      }
      await evaluate("(()=>{const e=[...document.querySelectorAll('label')].find(l=>l.textContent==='Position Y').querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'7');e.dispatchEvent(new Event('input',{bubbles:true}))})()");
      await evaluate(`window.__collapseCanvas = document.querySelector('[aria-label="Assembly 3D canvas"] canvas');
        window.__collapsePosition = [...document.querySelectorAll('label')].find(l => l.textContent === 'Position Y').querySelector('input');
        window.__collapseSearch = document.querySelector('input[aria-label="Search Models"]');
        window.__collapseReads = window.__modelReads;
        window.__collapsePosts = window.__posts;`);
      for (const [index, label] of ['Available Models', 'Assembly components', 'Component transform'].entries()) {
        const trigger = `[aria-label="${label}"] h2 button`;
        assert.equal(await evaluate(`document.querySelector(${JSON.stringify(trigger)}).getAttribute('aria-expanded')`), 'true');
        const point = await evaluate(`(() => {
          const button = document.querySelector(${JSON.stringify(trigger)});
          button.scrollIntoView({ block: 'nearest' });
          const rect = button.getBoundingClientRect();
          return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };
        })()`);
        await nativeClick(point);
        await waitFor(`document.querySelector(${JSON.stringify(trigger)}).getAttribute('aria-expanded') === 'false'`);
        assert(await evaluate(`document.activeElement === document.querySelector(${JSON.stringify(trigger)})`), 'Pointer toggle must retain keyboard focus on the panel header');
        assert(await evaluate(`document.getElementById(document.querySelector(${JSON.stringify(trigger)}).getAttribute('aria-controls')).hidden`));
        assert(await evaluate(`window.__collapseCanvas === document.querySelector('[aria-label="Assembly 3D canvas"] canvas') && window.__collapsePosition.isConnected && window.__collapsePosition.value === '7' && window.__collapseSearch.isConnected`), 'Collapsing must preserve Canvas and draft input nodes');
        const key = index === 1 ? ' ' : 'Enter';
        const code = index === 1 ? 'Space' : 'Enter';
        const windowsVirtualKeyCode = index === 1 ? 32 : 13;
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, text: index === 1 ? ' ' : '\r' });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
        await waitFor(`document.querySelector(${JSON.stringify(trigger)}).getAttribute('aria-expanded') === 'true'`);
      }
      assert(await evaluate('window.__collapseReads === window.__modelReads && window.__collapsePosts === window.__posts'), 'Panel toggles must not reload assets or save');
      await evaluate("document.querySelector('[aria-label=\"Component transform\"] h2 button').click()");
      await evaluate('window.__failSave=true');await click('Save Changes');await waitFor("document.body.innerText.includes('Conflict: draft retained')");assert.equal(await evaluate("document.querySelector('label:has(input) input').value"),'Created '+width);
      assert(await evaluate("document.querySelector('[aria-label=\"Assembly actions\"] [role=\"status\"]').textContent.includes('Conflict: draft retained') && !document.querySelector('main main > p[role=\"status\"]')"), 'Status feedback must stay in the bottom action bar');
      await evaluate('window.__failSave=false');await click('Save Changes');await waitFor('!!window.__releaseSave');const posts=await evaluate('window.__posts');await evaluate("document.querySelector('[aria-label=\"Assembly actions\"] button').click()");assert.equal(await evaluate('window.__posts'),posts);
      const saved=await evaluate('window.__payload.definition');if(width===1440){assert(saved.components[0].transform.position.y>.1);assert(saved.components[0].transform.scale>1.01);assert(Math.abs(saved.components[0].transform.rotation.z-Math.PI/2)<1e-8)}assert.equal(saved.components[1].transform.position.y,7);assert.notEqual(saved.components[0].id,saved.components[1].id);
      await evaluate('window.__releaseSave();window.__releaseSave=null');await waitFor("window.__path.endsWith("+JSON.stringify(saved.id)+")&&document.querySelector('[data-testid=\"assembly-draft-status\"]').textContent.includes('Revision 1')");
      assert(await evaluate("document.querySelector('[aria-label=\"Assembly actions\"] [role=\"status\"]').textContent.includes('revision 1')"));
      await click('All Assembly Groups');await waitFor("!!document.querySelector('input[aria-label=\"Search Assembly Groups\"]')");await change('input[aria-label="Search Assembly Groups"]','Created '+width);await waitFor("!!document.querySelector('a[aria-label=\"Edit Created "+width+"\"]')");await evaluate("document.querySelector('a[aria-label=\"Edit Created "+width+"\"]').click()");await waitFor("document.querySelector('label:has(input) input')?.value==='Created "+width+"'");
      await change('label:has(input) input','Edited '+width);await click('Export Draft');assert(await evaluate("document.querySelector('[data-testid=\"assembly-draft-status\"]').textContent.includes('modified')"));await click('Save Changes');await waitFor('!!window.__releaseSave');assert.equal(await evaluate('window.__payload.expectedRevision'),1);await evaluate('window.__releaseSave();window.__releaseSave=null');await waitFor("document.body.innerText.includes('revision 2')");
      await change('label:has(input) input','Unsaved');await evaluate('window.confirm=()=>false');await click('Reload');assert.equal(await evaluate("document.querySelector('label:has(input) input').value"),'Unsaved');await evaluate('window.confirm=()=>true');await click('Reload');await waitFor("document.querySelector('label:has(input) input').value==='Edited "+width+"'");
      await evaluate("(()=>{const input=document.querySelector('input[aria-label=\"Import assembly draft\"]'),dt=new DataTransfer();dt.items.add(new File(['invalid'],'bad.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()");await waitFor("document.body.innerText.includes('not a valid assembly draft')");assert.equal(await evaluate("document.querySelector('label:has(input) input').value"),'Edited '+width);
      await evaluate("(async()=>{const input=document.querySelector('input[aria-label=\"Import assembly draft\"]'),dt=new DataTransfer();dt.items.add(new File([await window.__downloads.at(-1).text()],'copy.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()");await waitFor("document.body.innerText.includes('Draft loaded')");await click('Save Changes');await waitFor('!!window.__releaseSave');assert.equal(await evaluate('window.__payload.expectedRevision'),0);const copyId=await evaluate('window.__payload.definition.id');assert.notEqual(copyId,saved.id);await evaluate('window.__releaseSave();window.__releaseSave=null');await waitFor("window.__path.endsWith("+JSON.stringify(copyId)+")&&document.body.innerText.includes('Assembly opened')");
      await waitFor("!!document.querySelector('[aria-label=\"Assembly 3D canvas\"] canvas')&&!document.querySelector('[aria-label=\"Assembly 3D canvas\"]').innerText.includes('Loading')");
      const capture=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temp,'assembly-'+width+'.png'),Buffer.from(capture.data,'base64'));
      await click('All Assembly Groups');await waitFor("!!document.querySelector('input[aria-label=\"Search Assembly Groups\"]')");await change('input[aria-label="Search Assembly Groups"]','Edited '+width);await waitFor("!!document.querySelector('button[aria-label=\"Delete Edited "+width+"\"]')");const before=await evaluate('Object.keys(window.__saved).length');await evaluate('window.__failDelete=true');await evaluate("document.querySelector('button[aria-label=\"Delete Edited "+width+"\"]').click()");await waitFor("document.body.innerText.includes('Delete conflict')");assert.equal(await evaluate('Object.keys(window.__saved).length'),before);await evaluate('window.__failDelete=false');await evaluate("document.querySelector('button[aria-label=\"Delete Edited "+width+"\"]').click()");await waitFor('Object.keys(window.__saved).length==='+String(before-1));
    }
    assert.deepEqual(await evaluate('window.__errors'),[]);
    console.log('PASS: actual WebGL picking, native Move/Scale handles, field rotation, retained Canvas, failed Model read/retry, visual transform Save, table records beyond 100, search/paging, Add/Edit routes, header creation action, first-left Save Changes, green action bar, Save conflict/duplicate guards, reload/export retention and revision-checked deletion (mock HTTP only). Artifacts: '+temp);
  } finally { await send('Browser.close').catch(() => {}); }
}
const timeout = setTimeout(() => { console.error('Presentation browser check timed out'); process.exit(1); }, 120000);
main().then(() => clearTimeout(timeout), error => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
