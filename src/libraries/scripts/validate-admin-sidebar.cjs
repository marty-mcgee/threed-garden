// Offline route and actual Sidebar interaction checks; no server or persistence API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, ...globals, require(name) { if (!(name in dependencies)) throw Error(name); return dependencies[name]; } });
  return exports;
}
const icons = new Proxy({}, { get: (_, name) => name });
const nav = load('src/components/admin/layout/admin-navigation.ts', { 'lucide-react': icons });
const contract = load('src/libraries/config/module-appearance.ts', {zod: require('zod')});
const appearance = contract.defaultModuleAppearance();
appearance.styles.models = {icon:'Leaf',color:'rose'};
const {ModuleIcon} = load('src/components/settings/ModuleAppearanceProvider.tsx', {
  react: {createContext:()=>({}),useContext:()=>({snapshot:appearance})},
  'react/jsx-runtime':{jsx:(type,props)=>({type,props})},
  'next-auth/react':{}, '@/libraries/config/module-appearance':contract,
  './module-icons':{moduleIcons:icons},
});
for (const section of nav.navSections) {
  for (const item of [...section.items,...section.items.flatMap(item=>item.children??[])]) {
    const key = contract.moduleKeys.find(key=>contract.moduleDefinitions[key].route===item.href);
    if (key) { assert.equal(item.moduleKey,key,item.href); assert.equal(item.icon,undefined,item.href); }
    else assert(item.icon,item.href);
  }
}
const destinations = nav.navSections.flatMap(section => section.items.flatMap(item => item.children ?? [item]));
assert.equal(new Set(destinations.map(item => item.href)).size, destinations.length);
for (const item of destinations) {
  assert.equal(nav.activeAdminHref(item.href), item.href);
  assert(fs.existsSync('src/app' + item.href + '/page.tsx'), item.href);
}
for (const [route, expected] of [
  ['/admin/threed/models/builder', '/admin/threed/models/builder'],
  ['/admin/threed/models/15', '/admin/threed/models'],
  ['/admin/threed/simulation-results/4', '/admin/threed/simulation-results'],
  ['/admin/threed/simulations/4/view', '/admin/threed/simulations'],
  ['/admin/users', '/admin/users'],
  ['/admin/users/new', '/admin/users/new'],
  ['/admin/users/example-id', '/admin/users'],
  ['/admin/projects/new', '/admin/projects/new'],
  ['/admin/projects/16', '/admin/projects'],
  ['/admin/multimedia/speech/3', '/admin/multimedia/speech'],
  ['/admin/threed/models-extra', null],
]) assert.equal(nav.activeAdminHref(route), expected);
for (const value of ['broken', 'null', '[]', '{"ThreeD":"yes","unknown":true}']) assert.equal(Object.keys(nav.readSidebarToggles(value)).length, 0);
assert.equal(nav.readSidebarToggles('{"ThreeD":false,"/admin/threed/models":true}').ThreeD, false);
let states=[], cursor=0, effects=[], effectsToRun=[], pathname='/admin/threed/models/15', owner='alice';
const memory = new Map(); let blocked=false;
const storage={getItem(key){if(blocked)throw Error('blocked');return memory.get(key)??null;},setItem(key,value){if(blocked)throw Error('blocked');memory.set(key,value);}};
const listeners = new Map();
const jsx=(type,props)=>({type,props:props??{}});
const react={useState(initial){const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useEffect(effect,deps){const i=cursor++;if(!effects[i]||deps.some((v,j)=>v!==effects[i][j])){effects[i]=deps;effectsToRun.push(effect);}}};
const preferences={modules:{threed:true,traffic:true,multimedia:true}};
const {AdminSidebar}=load('src/components/admin/layout/AdminSidebar.tsx',{
  react,'react/jsx-runtime':{jsx,jsxs:jsx},'next/link':{default:'link'},'next/navigation':{usePathname:()=>pathname},
  'next-auth/react':{useSession:()=>({data:{user:{id:owner}}})},'lucide-react':icons,
  '@/components/settings/ModuleAppearanceProvider':{ModuleIcon},
  '@/components/ui/button':{Button:'button'},'@/components/settings/WorkspaceSettingsProvider':{useWorkspaceSettings:()=>({preferences})},
  '@/components/auth/SignOutButton':{SignOutButton:'signout'},'@/libraries/utils':{cn:(...values)=>values.filter(Boolean).join(' ')},'./admin-navigation':nav,
},{localStorage:storage,window:{addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener(){}}});
const props={isCollapsed:false,onToggle(){}};
function render(){cursor=0;const tree=AdminSidebar(props);const pending=effectsToRun.splice(0);pending.forEach(fn=>fn());return pending.length?render():tree;}
function all(node,predicate){if(Array.isArray(node))return node.flatMap(n=>all(n,predicate));if(!node||typeof node!=='object')return[];return [...(predicate(node)?[node]:[]),...all(node.props?.children,predicate)];}
const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):'';
function button(tree,label){return all(tree,n=>n.type==='button'&&text(n)===label)[0];}
let tree=render();
function renderedIcons(tree) {
  return all(tree,n=>typeof n.type==='function'&&n.type.name==='NavigationModuleIcon').map(node=>{
    const icon=node.type(node.props);
    return icon?.type===ModuleIcon?ModuleIcon(icon.props):icon;
  });
}
assert(renderedIcons(tree).some(icon=>icon?.type==='Leaf'&&icon.props.className.includes('text-rose-500')));
appearance.styles.models={icon:'Drone',color:'cyan'};
assert(renderedIcons(render()).some(icon=>icon?.type==='Drone'&&icon.props.className.includes('text-cyan-500')));
assert(renderedIcons(tree).some(icon=>icon?.type==='Plus')); // Create remains a utility action.
assert(button(tree,'Users'));assert.equal(button(tree,'ThreeD').props['aria-expanded'],true);
button(tree,'ThreeD').props.onClick();tree=render();assert.equal(button(tree,'ThreeD').props['aria-expanded'],false);
pathname='/admin/threed/models/builder';tree=render();assert.equal(button(tree,'ThreeD').props['aria-expanded'],false);
states=[];effects=[];tree=render();assert.equal(button(tree,'ThreeD').props['aria-expanded'],false); // reload
button(tree,'ThreeD').props.onClick();tree=render();button(tree,'Models').props.onClick();tree=render();assert.equal(button(tree,'Models').props['aria-expanded'],false);
pathname='/admin/threed/model-files';tree=render();assert.equal(button(tree,'Models').props['aria-expanded'],false);
owner='bob';tree=render();assert.equal(button(tree,'Models').props['aria-expanded'],true);
owner='alice';tree=render();assert.equal(button(tree,'Models').props['aria-expanded'],false);
blocked=true;button(tree,'ThreeD').props.onClick();tree=render();assert.equal(button(tree,'ThreeD').props['aria-expanded'],false);blocked=false;
listeners.get('storage')({key:'threed:admin-sidebar:v1:alice',newValue:'{"ThreeD":true}'});tree=render();assert.equal(button(tree,'ThreeD').props['aria-expanded'],true);
preferences.modules.threed=false;tree=render();assert.equal(button(tree,'ThreeD'),undefined);preferences.modules.threed=true;
props.isMobile=true;props.isOpen=false;tree=render();assert.equal(tree.props.hidden,true);props.isOpen=true;tree=render();assert.equal(tree.props.hidden,false);
props.isMobile=false;props.isCollapsed=true;tree=render();assert(all(tree,n=>n.props?.['aria-label']==='Open ThreeD navigation').length===1);
assert(renderedIcons(tree).some(icon=>icon?.type===appearance.styles.threed.icon&&icon.props.className.includes(contract.moduleColors[appearance.styles.threed.color])));
props.isCollapsed=false;pathname='/admin/users/new';owner='new-user-menu-check';tree=render();
const addUser=all(tree,n=>n.type==='link'&&text(n)==='Add User')[0];
assert.equal(addUser.props.href,'/admin/users/new');assert.equal(addUser.props['aria-current'],'page');
assert.equal(all(tree,n=>n.type==='link'&&text(n)==='All Users')[0].props['aria-current'],undefined);
assert.equal(button(tree,'Users').props['aria-expanded'],true);
assert.equal(nav.navSections.find(section=>section.title==='Users').items[1].icon,'Plus');
const creationItems=nav.navSections.flatMap(section=>section.items.flatMap(item=>[item,...(item.children??[])])).filter(item=>item.action==='create');
assert.equal(creationItems.map(item=>item.title).join(','),'Add User,Add Project,Add Model,Add Simulation,Add Speech');
for(const item of creationItems)assert.equal(nav.activeAdminHref(item.href),item.href);
const selectedButton=all(tree,n=>n.type==='button'&&text(n)==='Add User')[0];
assert.equal(selectedButton.props.variant,'secondary');assert(selectedButton.props.className.includes('ring-primary/40'));
pathname='/admin/users';tree=render();
assert.equal(all(tree,n=>n.type==='button'&&text(n)==='Add User')[0].props.variant,'ghost');
assert.equal(all(tree,n=>n.type==='link'&&text(n)==='Add User')[0].props['aria-current'],undefined);
button(tree,'ThreeD').props.onClick();tree=render();
if(button(tree,'Models').props['aria-expanded']!==true){button(tree,'Models').props.onClick();tree=render();}
assert.equal(all(tree,n=>n.type==='button'&&text(n)==='Add Model')[0].props.variant,'ghost');
pathname='/admin/threed/models/new';tree=render();
assert.equal(all(tree,n=>n.type==='link'&&text(n)==='Add Model')[0].props['aria-current'],'page');
assert.equal(all(tree,n=>n.type==='button'&&text(n)==='Add Model')[0].props.variant,'secondary');
console.log('PASS: Saved module icons/colors, explicit module ownership, collapsed icons, utility icons, Admin route inventory, specific active matching, persistent section/subgroup choices, account isolation, optional storage, storage events, module filtering and mobile visibility.');
