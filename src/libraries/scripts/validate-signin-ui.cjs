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
 const h=harness();let calls=[],pending=[],navigation=[];
 const form=load('src/app/auth/sign-in/page.tsx',{
 react:h.react,'react/jsx-runtime':{jsx:element,jsxs:element},'lucide-react':{},'next/navigation':{useRouter:()=>({push:path=>navigation.push(path),refresh(){}})},'next-auth/react':{signIn:(provider,input)=>{calls.push({provider,input});return new Promise(resolve=>pending.push(resolve));}},
 '@/components/ui/card':{Card:'card',CardContent:'content',CardHeader:'header'},'@/components/ui/button':{Button:'button'},'@/components/ui/input':{Input:'input'},'@/components/ui/label':{Label:'label'},'next/link':{default:'link'}
 });
 const render=()=>h.render(()=>form.default());let tree=render();
 for(const [id,value] of Object.entries({email:'me@example.test',password:'secret123'})){find(tree,n=>n.type==='input'&&n.props.id===id).props.onChange({target:{value}});tree=render();}
 find(tree,n=>n.props?.['aria-label']==='Show password').props.onClick();tree=render();assert.equal(find(tree,n=>n.props?.id==='password').props.type,'text');
 const submit=find(tree,n=>n.type==='form').props.onSubmit;const first=submit({preventDefault(){}});await submit({preventDefault(){}});assert.equal(calls.length,1);assert.equal(calls[0].provider,'credentials');assert.equal(calls[0].input.redirect,false);
 pending.shift()({ok:false,error:'CredentialsSignin'});await first;tree=render();assert.equal(navigation.length,0);assert(find(tree,n=>n.props?.role==='alert'));assert.equal(find(tree,n=>n.props?.id==='email').props.value,'me@example.test');
 const retry=find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});pending.shift()({ok:true});await retry;assert.deepEqual(navigation,['/admin']);
 console.log('PASS sign-in: password visibility, duplicate-submit guard, accessible failure with retry and existing NextAuth/Admin navigation (mock hooks/auth).');
})().catch(error=>{console.error(error);process.exitCode=1;});
