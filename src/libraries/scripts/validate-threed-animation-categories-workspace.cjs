// Actual workspace handlers with mocked React and network; no database or browser.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const states = [], effects = [], exported = {}; let cursor = 0, calls = [], failId = null;
const rows = Array.from({ length: 55 }, (_, i) => ({ id: i + 1, name: `Action ${String(i+1).padStart(2,'0')}`, slotUsage: i === 0 ? 1 : 0, clipUsage: 2 }));
const element = (type, props) => ({ type, props });
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/animations/ThreeDAnimationCategoriesWorkspace.tsx','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
 exports: exported, AbortController, confirm: () => true,
 fetch: async (url, init = {}) => { calls.push({url,...init}); const failure = init.method === 'DELETE' && url.endsWith(`id=${failId}`); return { ok: !failure, json: async () => failure ? { error: 'Referenced slot' } : { success: true, data: init.method ? {} : rows } }; },
 require: name => name === 'react' ? { useMemo: fn => fn(), useEffect: fn => { if (effects.length < 2) effects.push(fn); }, useState(initial) { const index=cursor++; if (!(index in states)) states[index]=initial; return [states[index], value => { states[index]=typeof value === 'function' ? value(states[index]) : value; }]; } } : name === './AnimationCategories' ? { useAnimationCategories: () => ({ categories: [{id:1,name:'Tasks'},{id:2,name:'Sports'}], error:'' }) } : name === 'react/jsx-runtime' ? { jsx:element,jsxs:element } : new Proxy({}, { get:(_,key)=>key }),
});
function render() { cursor=0; return exported.ThreeDAnimationCategoriesWorkspace(); }
function find(node,predicate) { if(Array.isArray(node)) { for(const child of node) { const hit=find(child,predicate); if(hit) return hit; } } else if(node && typeof node==='object') return predicate(node) ? node : find(node.props?.children,predicate); }
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 render(); effects[0](); await flush(); let tree=render();
 assert(find(tree,n=>n.props?.['aria-label']==='Select Action 01').props.disabled,'Referenced slot selection is disabled');
 assert(!find(tree,n=>n.props?.['aria-label']==='Select Action 26'),'Pagination limits visible rows');
 find(tree,n=>n.props?.children==='Next').props.onClick(); tree=render();
 assert(find(tree,n=>n.props?.['aria-label']==='Select Action 26'));
 find(tree,n=>n.props?.['aria-label']==='Select Categories without Slot references on this page').props.onChange({target:{checked:true}});
 failId=26; tree=render(); find(tree,n=>Array.isArray(n.props?.children) && n.props.children[0]==='Delete selected (').props.onClick(); await flush();
 const deleted=calls.filter(call=>call.method==='DELETE'); assert.equal(deleted.length,25); assert(deleted.every(call=>Number(call.url.split('=')[1])>=26 && Number(call.url.split('=')[1])<=50));
 assert(states[12].includes('Referenced slot'),'Partial failure is retained separately from success'); assert(states[11].includes('24')); assert.equal(states[7].size,0);
 tree=render(); find(tree,n=>n.props?.['aria-label']==='Search Animation Categories').props.onChange({target:{value:'Action 02'}}); tree=render(); assert.equal(states[4],0); assert(!find(tree,n=>n.props?.['aria-label']==='Select Action 01'));
 find(tree,n=>Array.isArray(n.props?.children) && n.props.children[0]==='Name').props.onClick(); tree=render(); assert.equal(states[6].direction,'desc');
 find(tree,n=>Array.isArray(n.props?.children) && n.props.children.includes('Add Category')).props.onClick(); tree=render();
 assert(find(tree,n=>n.props?.['aria-label']==='New Animation Category'));
 states[8]={name:'User Category'}; tree=render(); find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}}); await flush();
 assert.deepEqual(JSON.parse(calls.find(call=>call.method==='POST').body),{name:'User Category'}); assert.equal(states[8],null);
 tree=render(); find(tree,n=>n.props?.['aria-label']==='Edit Action 02').props.onClick(); tree=render(); assert.equal(states[8].id,2);
 states[8]={id:2,name:'Renamed Category'}; tree=render(); find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}}); await flush();
 assert.deepEqual(JSON.parse(calls.filter(call=>call.method==='POST').at(-1).body),{id:2,name:'Renamed Category'});
 states[8]=null; tree=render(); find(tree,n=>n.props?.['aria-label']==='Delete Action 02').props.onClick(); await flush();
 assert(calls.some(call=>call.method==='DELETE' && call.url.endsWith('id=2')),'Row deletion uses selected Category');
 console.log('PASS: Actual Categories workspace paging/search/sort, protected/page-local selection, partial bulk failure and create form payload (mocked UI/network)');
})().catch(error=>{console.error(error);process.exitCode=1;});
