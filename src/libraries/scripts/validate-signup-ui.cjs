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
 const h=harness();let posts=[],signins=[],navigated=false;
 const form=load('src/app/auth/sign-up/page.tsx',{
 react:h.react,'react/jsx-runtime':{jsx:element,jsxs:element},'next/navigation':{useRouter:()=>({push(){navigated=true},refresh(){}})},'next-auth/react':{signIn:async(provider,input)=>{signins.push(input);return {error:'failed',ok:false}}},
 '@/components/ui/card':{Card:'card',CardContent:'content',CardHeader:'header',CardTitle:'title'},'@/components/ui/button':{Button:'button'},'@/components/ui/input':{Input:'input'},'@/components/ui/label':{Label:'label'},'next/link':{default:'link'}
 },{fetch:async(url,init)=>{posts.push({url,init});return {ok:true,json:async()=>({created:true})}}});
 const render=()=>h.render(()=>form.default());let tree=render();
 for(const [id,value] of Object.entries({name:'New',email:'NEW@example.test',password:'password123',confirmPassword:'password123'})){find(tree,n=>n.type==='input'&&n.props.id===id).props.onChange({target:{value}});tree=render();}
 await find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=render();
 assert.equal(posts.length,1);assert.equal(posts[0].url,'/api/auth/register');assert(!('role' in JSON.parse(posts[0].init.body)));assert.equal(signins.length,1);assert.equal(signins[0].email,'new@example.test');assert(!('action' in signins[0]));assert(!navigated);assert(text(tree).includes('account was created'));assert(find(tree,n=>n.type==='button').props.disabled);
 await find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(posts.length,1);
 console.log('PASS signup form: registration precedes sign-in, role-free payload, normalized email, login-failure recovery and duplicate-submit guard (mock network/hooks).');
})().catch(error=>{console.error(error);process.exitCode=1});
