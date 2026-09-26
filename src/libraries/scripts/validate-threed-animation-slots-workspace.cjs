// Actual workspace handlers with mocked React and network; no database or browser.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const states = [], effects = [], exported = {}; let cursor = 0, calls = [], failId = null;
const rows = Array.from({ length: 55 }, (_, i) => ({ id: i + 1, actionKey: `custom_${String(i).padStart(32,'0')}`, name: `Action ${String(i+1).padStart(2,'0')}`, categoryId: i % 2 ? 2 : 1, categoryName: i % 2 ? 'Sports' : 'Tasks', isActive: true, modelUsage: i === 0 ? 1 : 0, characterUsage: 0, presetUsage: 0 }));
const element = (type, props) => ({ type, props });
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/threed/animations/ThreeDAnimationSlotsWorkspace.tsx','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
 exports: exported, AbortController, confirm: () => true,
 fetch: async (url, init = {}) => { calls.push({url,...init}); const failure = init.method === 'DELETE' && url.endsWith(`id=${failId}`); return { ok: !failure, json: async () => failure ? { error: 'Referenced slot' } : { success: true, data: url === '/api/threed/animation-categories' ? {id:3,name:'New Category'} : init.method ? {} : rows } }; },
 require: name => name === 'react' ? { useMemo: fn => fn(), useEffect: fn => { if (effects.length < 2) effects.push(fn); }, useState(initial) { const index=cursor++; if (!(index in states)) states[index]=initial; return [states[index], value => { states[index]=typeof value === 'function' ? value(states[index]) : value; }]; } } : name === './AnimationCategories' ? { useAnimationCategories: () => ({ categories: [{id:1,name:'Tasks'},{id:2,name:'Sports'}], error:'' }) } : name === 'react/jsx-runtime' ? { jsx:element,jsxs:element } : new Proxy({}, { get:(_,key)=>key }),
});
function render() { cursor=0; return exported.ThreeDAnimationSlotsWorkspace(); }
function find(node,predicate) { if(Array.isArray(node)) { for(const child of node) { const hit=find(child,predicate); if(hit) return hit; } } else if(node && typeof node==='object') return predicate(node) ? node : find(node.props?.children,predicate); }
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 render(); effects[0](); await flush(); let tree=render();
 assert(find(tree,n=>n.props?.['aria-label']==='Select Action 01').props.disabled,'Referenced slot selection is disabled');
 assert(!find(tree,n=>n.props?.['aria-label']==='Select Action 26'),'Pagination limits visible rows');
 find(tree,n=>n.props?.children==='Next').props.onClick(); tree=render();
 assert(find(tree,n=>n.props?.['aria-label']==='Select Action 26'));
 find(tree,n=>n.props?.['aria-label']==='Select unreferenced slots on this page').props.onChange({target:{checked:true}});
 failId=26; tree=render(); find(tree,n=>Array.isArray(n.props?.children) && n.props.children[0]==='Delete selected (').props.onClick(); await flush();
 const deleted=calls.filter(call=>call.method==='DELETE'); assert.equal(deleted.length,25); assert(deleted.every(call=>Number(call.url.split('=')[1])>=26 && Number(call.url.split('=')[1])<=50));
 assert(states[12].includes('Referenced slot'),'Partial failure is retained separately from success'); assert(states[11].includes('24')); assert.equal(states[7].size,0);
 tree=render(); find(tree,n=>n.props?.['aria-label']==='Search Animation Slots').props.onChange({target:{value:'Sports'}}); tree=render(); assert.equal(states[4],0); assert(!find(tree,n=>n.props?.['aria-label']==='Select Action 01'));
 find(tree,n=>Array.isArray(n.props?.children) && n.props.children[0]==='Name').props.onClick(); tree=render(); assert.equal(states[6].direction,'desc');
 find(tree,n=>Array.isArray(n.props?.children) && n.props.children.includes('Add Slot')).props.onClick(); tree=render();
 assert(find(tree,n=>n.props?.['aria-label']==='New Animation Slot'));
 find(tree,n=>n.props?.children==='New Category').props.onClick(); tree=render();
 find(tree,n=>n.type==='Input' && n.props.value==='' && !n.props.required).props.onChange({target:{value:'New Category'}}); tree=render();
 find(tree,n=>n.props?.children==='Create Category').props.onClick(); await flush(); assert.equal(states[8].categoryId,3);
 assert.deepEqual(JSON.parse(calls.find(call=>call.url==='/api/threed/animation-categories').body),{name:'New Category'});
 states[8]={ name:'User Action',categoryId:2,isActive:false }; tree=render(); find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}}); await flush();
 assert.deepEqual(JSON.parse(calls.find(call=>call.method==='POST' && call.url==='/api/threed/animation-action-slots').body),{name:'User Action',categoryId:2,isActive:false}); assert.equal(states[8],null);
 console.log('PASS: Actual Slots workspace paging/search/sort, protected/page-local selection, partial bulk failure and create form payload (mocked UI/network)');
})().catch(error=>{console.error(error);process.exitCode=1;});
