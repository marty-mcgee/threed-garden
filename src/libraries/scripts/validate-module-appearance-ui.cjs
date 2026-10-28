// Actual provider and Settings form with a small hook harness. No browser/database.
const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript'), vm = require('node:vm');
const element = (type, props) => ({ type, props });
function load(file, modules, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, Error, require: key => key === '@/components/settings/SettingsSection' ? {SettingsSection:'settings-section'} : modules[key] ?? require(key), ...globals,
  });
  return exports;
}
const contract = load('src/libraries/config/module-appearance.ts', {});
function harness() {
  const slots = []; let index = 0, dirty = false, component, tree;
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const effects = [];
  const react = {
    createContext: () => ({ Provider: 'Provider' }), useContext: () => null,
    useState(initial) {
      const i = index++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value; if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; } }];
    },
    useRef(initial) { const i = index++; slots[i] ??= { current: initial }; return slots[i]; },
    useCallback(fn, deps) { const i = index++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { fn, deps }; return slots[i].fn; },
    useEffect(fn, deps) {
      const i = index++;
      if (!slots[i] || changed(slots[i].deps, deps)) { effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); }
    },
  };
  return { react, render(fn = component) {
    component = fn;
    for (let pass = 0; pass < 20; pass++) {
      dirty = false; index = 0; tree = component();
      const jobs = effects.splice(0); jobs.forEach(job => job());
      if (!dirty) return tree;
    }
    throw new Error('Render loop');
  } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const find = (node, predicate) => {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } }
  else if (node && typeof node === 'object') return predicate(node) ? node : find(node.props?.children, predicate);
};
const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' ? node : '';

(async()=>{
 const h=harness();let session={status:'authenticated',data:{user:{id:'admin'}}},requests=[];
 const provider=load('src/components/settings/ModuleAppearanceProvider.tsx',{
 react:h.react,'react/jsx-runtime':{jsx:element,jsxs:element},'next-auth/react':{useSession:()=>session},'@/libraries/config/module-appearance':contract,'./module-icons':{moduleIcons:new Proxy({},{get:(_,key)=>key})}
 },{fetch:(url,init={})=>new Promise(resolve=>requests.push({init,resolve})),console});
 const render=()=>h.render(()=>provider.ModuleAppearanceProvider({children:'app'})).props.value;
 assert.equal(render().loaded,false);const first=requests.shift();
 session={status:'authenticated',data:{user:{id:'ordinary'}}};render();const second=requests.shift();
 first.resolve({ok:true,json:async()=>({snapshot:contract.defaultModuleAppearance(),canEdit:true})});await flush();assert.equal(render().canEdit,false);
 second.resolve({ok:true,json:async()=>({snapshot:contract.defaultModuleAppearance(),canEdit:false})});await flush();assert.equal(render().loaded,true);assert.equal(render().canEdit,false);await assert.rejects(()=>render().save(contract.defaultModuleAppearance()));
 session={status:'authenticated',data:{user:{id:'admin'}}};render();requests.shift().resolve({ok:true,json:async()=>({snapshot:contract.defaultModuleAppearance(),canEdit:true})});await flush();assert.equal(render().canEdit,true);
 const changed=contract.defaultModuleAppearance();changed.styles.models.color='red';let saving=render().save(changed);render();assert.equal(render().busy,true);await assert.rejects(()=>render().save(changed));requests.shift().resolve({ok:false,status:409});await assert.rejects(saving,/changed elsewhere/);assert.equal(render().snapshot.styles.models.color,'blue');assert.equal(render().busy,false);
 saving=render().save(changed);requests.shift().resolve({ok:true,json:async()=>({...changed,revision:'d737dc13-bf05-4338-98f7-c74dc1e7a4a0'})});await saving;assert.equal(render().snapshot.styles.models.color,'red');
 const formHarness=harness();let context=render(),confirmed=false;const listeners=new Map();
 const form=load('src/components/settings/ModuleAppearanceSettings.tsx',{
 react:formHarness.react,'react/jsx-runtime':{jsx:element,jsxs:element},'@/components/ui/button':{Button:'button'},'@/libraries/config/module-appearance':contract,'./ModuleAppearanceProvider':{useModuleAppearance:()=>context},'./module-icons':{moduleIcons:new Proxy({},{get:(_,key)=>key})}
 },{window:{addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key),confirm:()=>confirmed}});
 const draw=()=>formHarness.render(()=>form.ModuleAppearanceSettings());let tree=draw();
 const iconControls=node=>Array.isArray(node)?node.flatMap(iconControls):node&&typeof node==='object'?[...(node.type==='select'&&node.props['aria-label']?.endsWith(' icon')?[node.props['aria-label']]:[]),...iconControls(node.props?.children)]:[];
 assert.equal(iconControls(tree).length,44);assert.equal(new Set(iconControls(tree)).size,44,'Every identity appears exactly once, including surface groups');
 for(const [label,icon] of [['Dashboard','Radio'],['Admin','Settings']]) {
  assert.equal(find(tree,n=>n.type==='select'&&n.props['aria-label']===label+' icon').props.value,icon);
  find(tree,n=>n.type==='select'&&n.props['aria-label']===label+' icon').props.onChange({target:{value:'Star'}});tree=draw();
  find(tree,n=>n.type==='select'&&n.props['aria-label']===label+' color').props.onChange({target:{value:'violet'}});tree=draw();
 }
 assert.equal(find(tree,n=>n.type==='select'&&n.props['aria-label']==='Learn icon').props.value,'BookOpen');
 find(tree,n=>n.type==='select'&&n.props['aria-label']==='Learn icon').props.onChange({target:{value:'Leaf'}});tree=draw();
 find(tree,n=>n.type==='select'&&n.props['aria-label']==='Learn color').props.onChange({target:{value:'cyan'}});tree=draw();
 find(tree,n=>n.type==='select'&&n.props['aria-label']==='Models color').props.onChange({target:{value:'violet'}});tree=draw();assert(listeners.has('beforeunload'));
 let submitted;context={...context,save:async value=>{submitted=value;throw Error('Network failure');}};
 await find(draw(),n=>n.type==='button'&&text(n)==='Save Module appearance').props.onClick();tree=draw();assert.equal(submitted.styles.models.color,'violet');assert.equal(find(tree,n=>n.type==='select'&&n.props['aria-label']==='Models color').props.value,'violet');assert(text(tree).includes('Network failure'));
 for(const key of ['dashboard','admin']) assert.deepEqual(JSON.parse(JSON.stringify(submitted.styles[key])),{icon:'Star',color:'violet'});
 assert.equal(submitted.styles.learn.icon,'Leaf');assert.equal(submitted.styles.learn.color,'cyan');assert.equal(find(tree,n=>n.type==='select'&&n.props['aria-label']==='Learn color').props.value,'cyan');
 console.log('PASS Module appearance UI: account isolation, permission gating, duplicate saves, conflicts, successful updates and failed-save draft retention (mock hooks/network).');
})().catch(e=>{console.error(e);process.exitCode=1;});
