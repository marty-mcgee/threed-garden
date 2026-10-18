// Optional native shared-UI regression. File + debugging pipe; no HTTP server/live data.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'threed-ui-primitives-'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
let child;
async function main() {
  assert(browser, 'Installed Edge is required for this optional native check');
  const source = `import React from 'react';import{createRoot}from'react-dom/client';
import{Button}from'./src/components/ui/button';import{Input}from'./src/components/ui/input';
import{Label}from'./src/components/ui/label';import{Textarea}from'./src/components/ui/textarea';
import{Card,CardContent}from'./src/components/ui/card';
import{Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription,DialogClose}from'./src/components/ui/dialog';
import{DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem}from'./src/components/ui/dropdown-menu';
import{ContextMenu,ContextMenuTrigger,ContextMenuContent,ContextMenuItem}from'./src/components/ui/context-menu';
import{Select,SelectTrigger,SelectContent,SelectItem,SelectValue}from'./src/components/ui/select';
import{Tabs,TabsList,TabsTrigger,TabsContent}from'./src/components/ui/tabs';
import{Switch}from'./src/components/ui/switch';import{Slider}from'./src/components/ui/slider';
import{ModelFieldHelp}from'./src/components/admin/threed/models/ModelFieldHelp';
window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));
function Fixture(){const[draft,setDraft]=React.useState('kept'),[actions,setActions]=React.useState(0),[on,setOn]=React.useState(false),[choice,setChoice]=React.useState('alpha'),[slide,setSlide]=React.useState([2]);window.__ready=true;
return <main className="p-4 text-foreground"><Card className="threed-workspace-panel max-w-xl"><CardContent className="space-y-4 pt-4">
<div className="flex items-center gap-2"><h2 className="text-sm font-semibold">Example</h2><ModelFieldHelp label="Example">Existing App help, keyboard and focus behavior.</ModelFieldHelp></div>
<div className="flex flex-wrap gap-2"><Button variant="success" onClick={()=>setActions(v=>v+1)}>Enabled</Button><Button disabled onClick={()=>setActions(v=>v+1)}>Disabled</Button>
<Dialog><DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Review changes</DialogTitle><DialogDescription>Local fixture only.</DialogDescription><Input aria-label="Dialog input"/><DialogClose asChild><Button>Done</Button></DialogClose></DialogContent></Dialog>
<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={()=>setActions(v=>v+1)}>Menu action</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
<ContextMenu><ContextMenuTrigger asChild><div data-testid="context-target" tabIndex={0} className="rounded border p-3 text-xs">Context target</div></ContextMenuTrigger><ContextMenuContent><ContextMenuItem onSelect={()=>setActions(v=>v+1)}>Context action</ContextMenuItem></ContextMenuContent></ContextMenu>
<Select value={choice} onValueChange={setChoice}><SelectTrigger aria-label="Choice"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="alpha">Alpha</SelectItem><SelectItem value="beta">Beta</SelectItem></SelectContent></Select>
<Tabs defaultValue="one"><TabsList><TabsTrigger value="one">One</TabsTrigger><TabsTrigger value="two">Two</TabsTrigger></TabsList><TabsContent value="one"><Label htmlFor="draft">Draft</Label><Input id="draft" aria-label="Draft" value={draft} onChange={e=>setDraft(e.target.value)}/></TabsContent><TabsContent value="two">Second panel</TabsContent></Tabs>
<div className="flex items-center gap-2"><Switch aria-label="Toggle" checked={on} onCheckedChange={setOn}/><Label>Toggle</Label></div>
<Slider aria-label="Amount" value={slide} onValueChange={setSlide} min={0} max={10}/><Textarea aria-label="Notes" defaultValue="Retained notes"/>
<p data-testid="actions" className="text-xs">Actions: {actions}</p></CardContent></Card></main>}
createRoot(document.getElementById('root')).render(<Fixture/>);`;
  const bundle = (await require('esbuild').build({ stdin: { contents: source, resolveDir: root, loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' })).outputFiles[0].text;
  const cssPath = path.join(root, 'src/app/globals.css');
  // Match source inputs across a Git checkout and a disposable copy: automatic
  // discovery otherwise includes different ignored documentation/tool trees.
  const cssInput = fs.readFileSync(cssPath, 'utf8').replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../";');
  const css = (await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process(cssInput, { from: cssPath })).css;
  fs.writeFileSync(path.join(temp, 'app.css'), css);
  const fixture = path.join(temp, 'fixture.html');
  fs.writeFileSync(fixture, `<html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:"><style>${css}</style></head><body><div id="root"></div><script>${bundle.replace(/<\/script/gi, '<\\/script')}</script></body></html>`);
  child = spawn(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', `--user-data-dir=${path.join(temp, 'profile')}`, '--remote-debugging-pipe'], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let next = 0, buffer = ''; const pending = new Map();
  child.on('error', error => { for (const task of pending.values()) task.reject(error); pending.clear(); });
  child.on('exit', code => { for (const task of pending.values()) task.reject(Error('Browser exited: ' + code)); pending.clear(); });
  child.stdio[4].on('data', chunk => { buffer += chunk.toString(); let end; while ((end = buffer.indexOf('\0')) >= 0) { const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1); const task = pending.get(message.id); if (task) { pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result); } } });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++next; pending.set(id, { resolve, reject }); child.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0'); });
  try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const call = (method, params = {}) => send(method, params, sessionId);
    const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value; };
    const key = async (key, code = key) => { await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code }); await delay(100); };
    const click = async (selector, button = 'left') => { const r = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e?.scrollIntoView({block:'nearest'});const r=e?.getBoundingClientRect();return r&&{x:r.x+r.width/2,y:r.y+r.height/2}})()`); assert(r, selector); await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...r }); await call('Input.dispatchMouseEvent', { type: 'mousePressed', ...r, button, buttons: button === 'left' ? 1 : 2, clickCount: 1 }); await call('Input.dispatchMouseEvent', { type: 'mouseReleased', ...r, button, buttons: 0, clickCount: 1 }); await delay(250); };
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
    for (const theme of ['dark', 'light']) for (const width of [1440, 375]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await call('Page.navigate', { url: require('node:url').pathToFileURL(fixture).href });
      for (let i = 0; i < 80 && !await evaluate('!!window.__ready'); i++) await delay(100);
      assert(await evaluate('!!window.__ready')); await evaluate(`document.documentElement.className=${JSON.stringify(theme)}`); await delay(150);
      await click('button:disabled'); assert.equal(await evaluate('document.querySelector("[data-testid=actions]").textContent'), 'Actions: 0');
      await click('[data-slot="dialog-trigger"]'); assert.equal(await evaluate('document.activeElement?.getAttribute("aria-label")'), 'Dialog input');
      for (let i = 0; i < 5; i++) { await key('Tab'); assert(await evaluate('!!document.activeElement.closest("[role=dialog]")'), 'Dialog traps keyboard focus'); }
      await key('Escape'); await delay(150); assert.equal(await evaluate('document.querySelectorAll("[role=dialog]").length'), 0); assert.equal(await evaluate('document.activeElement?.textContent'), 'Open dialog');
      await click('[data-slot="dropdown-menu-trigger"]'); await click('[role="menuitem"]');
      await click('[data-testid="context-target"]', 'right'); await click('[data-slot="context-menu-item"]');
      assert.equal(await evaluate('document.querySelector("[data-testid=actions]").textContent'), 'Actions: 2');
      await click('[role="combobox"]'); await click('[role="option"][data-state="unchecked"]'); assert.match(await evaluate('document.querySelector("[role=combobox]").textContent'), /Beta/);
      await click('input[aria-label="Draft"]'); await call('Input.insertText', { text: 'changed' }); await click('[role="tab"][data-state="inactive"]'); assert.match(await evaluate('document.querySelector("[role=tabpanel][data-state=active]").textContent'), /Second panel/); await click('[role="tab"][data-state="inactive"]'); assert.match(await evaluate('document.querySelector("input[aria-label=Draft]").value'), /changed/);
      await click('[role="switch"]'); assert.equal(await evaluate('document.querySelector("[role=switch]").getAttribute("aria-checked")'), 'true');
      await evaluate('document.querySelector("[role=slider]").focus({preventScroll:true})'); await key('ArrowRight'); assert.equal(await evaluate('document.querySelector("[role=slider]").getAttribute("aria-valuenow")'), '3');
      await evaluate('document.querySelector(".threed-field-help").focus({preventScroll:true})'); await delay(300);
      if (await evaluate('document.querySelector(".threed-field-help").getAttribute("data-state")') === 'closed') { await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await delay(150); }
      assert.match(await evaluate('document.querySelector("[role=tooltip]")?.textContent || ""'), /Existing App help/); await key('Escape'); await delay(150);
      assert(!await evaluate('document.documentElement.scrollWidth>innerWidth'), 'No page overflow'); assert.deepEqual(await evaluate('window.__errors'), []);
      await evaluate('document.activeElement?.blur();window.scrollTo(0,0)'); await delay(200);
      const capture = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(temp, `${theme}-${width}.png`), Buffer.from(capture.data, 'base64'));
      console.log(`PASS native primitives ${theme}/${width}: dialog/focus, menus, select, tabs/draft, switch, slider, help, disabled controls`);
    }
    console.log('Artifacts: ' + temp);
  } finally { await send('Browser.close').catch(() => {}); child.kill(); }
}
const timeout = setTimeout(() => { console.error('Native UI timeout: ' + temp); child?.kill(); process.exit(1); }, 60000);
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(timeout));
