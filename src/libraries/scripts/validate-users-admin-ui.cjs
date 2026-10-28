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
 const h=harness();let session={status:'authenticated',data:{user:{id:'a'}}},requests=[],timers=[],listeners=new Map();
 const form=load('src/components/admin/users/UsersWorkspace.tsx',{
  react:h.react,'react/jsx-runtime':{jsx:element,jsxs:element},'next/link':{default:'link'},'next-auth/react':{useSession:()=>session},'lucide-react':{Users:'users-icon'},
  '@/components/admin/layout/AdminWorkspaceHeader':{AdminWorkspaceHeader:'header'},'@/components/ui/button':{Button:'button'},'@/components/ui/input':{Input:'input'},
  '@/components/ui/badge':{Badge:'badge'},
  '@/components/ui/table':Object.fromEntries(['Table','TableBody','TableCell','TableHead','TableHeader','TableRow'].map(key=>[key,key])),
  '@/components/settings/ModuleAppearanceProvider':{ModuleIcon:'module-icon'},
  '@/components/admin/threed/models/ModelFieldHelp':{ModelFieldHelp:'help'}
 },{URLSearchParams,AbortController,console,setTimeout:fn=>{timers.push(fn);return fn},clearTimeout:fn=>{timers=timers.filter(x=>x!==fn)},fetch:(url,init={})=>new Promise(resolve=>requests.push({url,init,resolve})),
  window:{addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key),confirm:()=>true,location:{assign(){}}},document:{addEventListener(){},removeEventListener(){}}});
 let targetId='b',createNew=false;
 const render=()=>h.render(()=>form.UsersWorkspace({userId:targetId,createNew}));
 const tick=()=>{timers.splice(0).forEach(fn=>fn())};
 const button=(tree,label)=>find(tree,n=>n.type==='button'&&text(n)===label);
 render();tick();let request=requests.shift();
 const row={id:'b',name:'Target',email:'b@example.test',role:'admin',isActive:true,isDeleted:false,revision:'a'.repeat(64)};
 request.resolve({ok:true,json:async()=>row});await flush();let tree=render();assert(button(tree,'Save Changes').props.disabled);
 find(tree,n=>n.type==='select').props.onChange({target:{value:'super_admin'}});tree=render();assert(!button(tree,'Save Changes').props.disabled);assert(listeners.has('beforeunload'));
 button(tree,'Save Changes').props.onClick();tree=render();assert(button(tree,'Saving...').props.disabled);request=requests.shift();assert.deepEqual(JSON.parse(request.init.body),{name:row.name,email:row.email,role:'super_admin',revision:row.revision});
 request.resolve({ok:false,json:async()=>({error:'Audit unavailable'})});await flush();tree=render();assert(text(tree).includes('Audit unavailable'));assert.equal(find(tree,n=>n.type==='select').props.value,'super_admin');
 button(tree,'Discard').props.onClick();tree=render();assert.equal(find(tree,n=>n.type==='select').props.value,'admin');assert(button(tree,'Save Changes').props.disabled);
 session={status:'authenticated',data:{user:{id:'ordinary'}}};tree=render();assert(!text(tree).includes(row.email));tick();request=requests.shift();request.resolve({ok:false,json:async()=>({error:'An active Super Admin account is required.'})});await flush();tree=render();assert(!text(tree).includes(row.email));assert(text(tree).includes('active Super Admin'));
 targetId=undefined;session={status:'authenticated',data:{user:{id:'a'}}};render();tick();request=requests.shift();request.resolve({ok:true,json:async()=>({data:[row],total:1,page:1})});await flush();tree=render();
 const filter=find(tree,n=>n.type==='select'&&n.props['aria-label']==='Filter by role');
 assert.deepEqual(Array.from(filter.props.children,option=>option.props.value),['all','admin','super_admin','user']);
 assert(find(tree,n=>n.type==='Table'));assert(find(tree,n=>n.type==='module-icon'));assert(!text(tree).includes('No Users found.'));

 // Existing User deletion: typed confirmation, server failure retention, and read-only result.
 targetId='b';render();tick();request=requests.shift();request.resolve({ok:true,json:async()=>row});await flush();tree=render();
 button(tree,'Delete User').props.onClick();tree=render();assert(button(tree,'Confirm Delete User').props.disabled);
 find(tree,n=>n.type==='input'&&n.props['aria-label']==='Confirm User email').props.onChange({target:{value:row.email}});tree=render();
 button(tree,'Confirm Delete User').props.onClick();button(tree,'Confirm Delete User').props.onClick();assert.equal(requests.length,1);request=requests.shift();assert.equal(request.init.method,'DELETE');assert.deepEqual(JSON.parse(request.init.body),{revision:row.revision,confirmEmail:row.email});
 request.resolve({ok:false,json:async()=>({error:'User owns content'})});await flush();tree=render();assert(text(tree).includes('User owns content'));assert.equal(find(tree,n=>n.props?.['aria-label']==='Confirm User email').props.value,row.email);
 button(tree,'Confirm Delete User').props.onClick();request=requests.shift();request.resolve({ok:true,json:async()=>({...row,isDeleted:true})});await flush();tree=render();assert(!button(tree,'Delete User'));assert(find(tree,n=>n.props?.['aria-label']==='User name').props.disabled);assert(button(tree,'Save Changes').props.disabled);
 // Creation uses the existing Users API without signing the Super Admin out/in.
 targetId=undefined;createNew=true;render();tick();request=requests.shift();assert.equal(request.url,'/api/admin/users/a');request.resolve({ok:true,json:async()=>({...row,id:'a',role:'super_admin'})});await flush();tree=render();
 assert(button(tree,'Create User').props.disabled);
 for(const [label,value] of [['User name','New'],['User email','new@example.test'],['Initial password','password1']]){find(tree,n=>n.props?.['aria-label']===label).props.onChange({target:{value}});tree=render();}
 button(tree,'Create User').props.onClick();button(tree,'Create User').props.onClick();assert.equal(requests.length,1);request=requests.shift();assert.equal(request.init.method,'POST');assert.deepEqual(JSON.parse(request.init.body),{name:'New',email:'new@example.test',password:'password1'});
 request.resolve({ok:false,json:async()=>({error:'Email in use'})});await flush();tree=render();assert(text(tree).includes('Email in use'));assert.equal(find(tree,n=>n.props?.['aria-label']==='User name').props.value,'New');
 button(tree,'Create User').props.onClick();request=requests.shift();request.resolve({ok:true,json:async()=>({...row,id:'new'})});await flush();tree=render();assert.equal(find(tree,n=>n.props?.['aria-label']==='Initial password').props.value,'');button(tree,'Create User').props.onClick();assert.equal(requests.length,0);
 console.log('PASS Users UI: profile/role drafts, create payload and duplicate guard, confirmed soft-delete failure/success, deleted read-only fields and account isolation (mock hooks/network).');
})().catch(error=>{console.error(error);process.exitCode=1;});
