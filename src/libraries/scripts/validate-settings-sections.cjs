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
const h=harness();let owner='alice',blocked=false;const memory=new Map(),listeners=new Map();
const storage={getItem(key){if(blocked)throw Error('blocked');return memory.get(key)??null;},setItem(key,value){if(blocked)throw Error('blocked');memory.set(key,value);}};
const module=load('src/components/settings/SettingsSection.tsx',{react:h.react,'react/jsx-runtime':{jsx:element,jsxs:element},'next-auth/react':{useSession:()=>({data:{user:{id:owner}}})}},{localStorage:storage,window:{addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)}});
let section='modules';const render=()=>h.render(()=>module.SettingsSection({section,children:'draft controls'}));
const click=(tree,nested=false)=>{const host={};let prevented=false;tree.props.onClick({currentTarget:host,target:{closest:()=>({parentElement:nested?{}:host})},preventDefault(){prevented=true;}});return prevented;};
assert.equal(render().props.open,true);assert.equal(click(render(),true),false);assert.equal(memory.size,0);
click(render());assert.equal(render().props.open,false);assert.equal(memory.get('threed:settings-sections:v1:alice:modules'),'false');
owner='bob';assert.equal(render().props.open,true);owner='alice';assert.equal(render().props.open,false);
section='scene';assert.equal(render().props.open,false);click(render());assert.equal(render().props.open,true);
memory.set('threed:settings-sections:v1:alice:scene','false');listeners.get('storage')({key:'threed:settings-sections:v1:alice:scene'});assert.equal(render().props.open,false);
blocked=true;click(render());assert.equal(render().props.open,true);blocked=false;
for(const key of ['appearance','previews','navigation','links']){section=key;assert.equal(render().props.open,true);}
section='scene';memory.set('threed:settings-sections:v1:alice:scene','corrupt');render();assert.equal(render().props.open,false);
console.log('PASS Settings disclosure defaults, per-user/section browser persistence, nested-click isolation, cross-tab synchronization and blocked storage fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
