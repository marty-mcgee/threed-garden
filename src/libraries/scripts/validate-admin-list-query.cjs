const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const file = 'src/components/admin/shared/use-admin-list-query-state.ts';
const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const nextAst = ts.createSourceFile('app-router.js', fs.readFileSync('node_modules/next/dist/client/components/app-router.js','utf8'),99,true,ts.ScriptKind.JS);
const wrappers = {};
function scan(n) { if(ts.isBinaryExpression(n) && ts.isFunctionExpression(n.right) && ['window.history.pushState','window.history.replaceState'].includes(n.left.getText(nextAst))) wrappers[n.left.getText(nextAst).split('.').at(-1)] = n.right.getText(nextAst); ts.forEachChild(n,scan); } scan(nextAst);
function fixture(address) {
 let url=new URL(address), states=[], cursor=0, notices=0, routerNotices=0; const listeners=new Set(), entries=[url.href]; let entry=0;
 const original=(replace)=>(state,_,href)=>{url=new URL(href,url);history.state=state;if(replace)entries[entry]=url.href;else{entries.splice(++entry);entries.push(url.href)}};
 const history={state:{__NA:true,_N:true,custom:'keep',__PRIVATE_NEXTJS_INTERNALS_TREE:{keep:true}}};
 for(const method of ['pushState','replaceState'])history[method]=vm.runInNewContext('('+wrappers[method]+')',{originalPushState:original(false),originalReplaceState:original(true),copyNextJsInternalHistoryState:data=>({...data,__NA:true,__PRIVATE_NEXTJS_INTERNALS_TREE:history.state.__PRIVATE_NEXTJS_INTERNALS_TREE}),applyUrlFromHistoryPushReplace:()=>routerNotices++});
 const window={get location(){return url},history,addEventListener:(_,cb)=>listeners.add(cb),removeEventListener:(_,cb)=>listeners.delete(cb),dispatchEvent:()=>{notices++;for(const cb of listeners)cb()}};
 const react={useState(initial){const id=cursor++;if(!(id in states))states[id]=initial;return [states[id],v=>states[id]=typeof v==='function'?v(states[id]):v]},useMemo:fn=>fn(),useSyncExternalStore:(subscribe,get)=>{subscribe(()=>{});return get()}};
 const exports={};vm.runInNewContext(source,{exports,require:name=>{assert.equal(name,'react');return react},URL,URLSearchParams,window,Event,queueMicrotask});
 return {api:exports,render:(...args)=>{cursor=0;return exports.useAdminListQueryState(...args)},get url(){return url},get notices(){return notices},get routerNotices(){return routerNotices},get entries(){return entries},history,back(){url=new URL(entries[--entry]);window.dispatchEvent(new Event('popstate'))},forward(){url=new URL(entries[++entry]);window.dispatchEvent(new Event('popstate'))}};
}
const tick=()=>new Promise(resolve=>queueMicrotask(resolve));
function walkFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walkFiles(dir+'/'+e.name):[dir+'/'+e.name])}
const bindings=[];
for(const path of [...walkFiles('src/components/admin/threed'), 'src/components/threed/design/DesignStandalone.tsx'].filter(p=>p.endsWith('.tsx'))){const a=ts.createSourceFile(path,fs.readFileSync(path,'utf8'),99,true,4);function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(a)==='useAdminListQueryState')bindings.push({path,args:n.arguments.map(arg=>arg.getText(a))});ts.forEachChild(n,visit)}visit(a)}
const evalArg=text=>vm.runInNewContext('('+text+')',{scrollRecords:true,view:'list',projectId:'8',initialProjectId:8,initialSimulationId:3,initialCategoryId:2,String});
(async()=>{
 assert.equal(bindings.length,84,'Every approved list field and Designs paging remains connected');
 for(const binding of bindings){const args=binding.args.map(evalArg),[route,key,initial,options]=args;const f=fixture('http://fixture'+route+'?unrelated=keep#records');
  const desired=typeof initial==='number' ? (key==='limit'?100:key==='page'?initial+2:100) : typeof initial==='object'?{...initial,direction:initial.direction==='asc'?'desc':'asc'}:key==='direction'?'desc':options?.values?.find(v=>v!==initial)??'sample';
  f.render(...args)[1](desired);await tick();assert.deepEqual(JSON.parse(JSON.stringify(f.render(...args)[0])),JSON.parse(JSON.stringify(desired)),binding.path+' '+key);
  assert.equal(f.url.searchParams.get('unrelated'),'keep');assert.equal(f.url.hash,'#records');assert.equal(f.history.state.custom,'keep');assert.equal(f.history.state.__NA,true);assert.equal(f.routerNotices,1);assert.equal(f.notices,1);
  if(key!=='search'){f.back();assert.equal(f.url.searchParams.get(key),null);f.forward();assert.equal(f.notices,3);}
  const embedded=fixture('http://fixture/admin/projects/8?search=other');embedded.render(...args)[1](desired);await tick();assert.deepEqual(JSON.parse(JSON.stringify(embedded.render(...args)[0])),JSON.parse(JSON.stringify(desired)));assert.equal(embedded.notices,0);assert.equal(embedded.entries.length,1);
 }
 const f=fixture('http://fixture/admin/threed/plants?page=4&unrelated=keep');const route='/admin/threed/plants';
 f.render(route,'page',0)[1](0);f.render(route,'sort',{key:'name',direction:'asc'},{values:['name','type']})[1]({key:'type',direction:'desc'});await tick();assert.equal(f.entries.length,2,'One click changing page and sort creates one history entry');assert.equal(f.url.searchParams.get('page'),null);assert.equal(f.url.searchParams.get('sort'),'type');f.back();assert.equal(f.render(route,'page',0)[0],3);f.forward();
 f.render(route,'search','')[1]('Chair & table');await tick();assert.equal(f.entries.length,2,'Typing replaces history');assert.equal(f.render(route,'search','')[0],'Chair & table');
 const count=f.entries.length;f.render(route,'page',0)[1](p=>p);await tick();assert.equal(f.entries.length,count);
 f.render(route,'page',0)[1](4);await tick();const beforeClamp=f.entries.length;f.render(route,'page',0)[1](()=>0,{replace:true});await tick();assert.equal(f.entries.length,beforeClamp,'Clamps replace history');
 f.render(route,'page',0)[1](page=>page+1);await tick();assert.equal(f.entries.length,beforeClamp+1,'Functional Next/Previous page clicks push history');
 const beforeReset=f.entries.length;f.render(route,'search','')[1]('');f.render(route,'sort',{key:'name',direction:'asc'},{values:['name','type']})[1]({key:'name',direction:'asc'});f.render(route,'page',0)[1](0);await tick();assert.equal(f.entries.length,beforeReset+1,'Resetting search and filters is one navigable history entry');assert.equal(f.url.searchParams.get('sort'),null);assert.equal(f.url.searchParams.get('search'),null);
 const read=f.api.readAdminListValue;assert.equal(read(new URLSearchParams('page=-2'),'page',0),0);assert.equal(read(new URLSearchParams('limit=99999'),'limit',25),25);assert.equal(read(new URLSearchParams('sort=invalid'),'sort','name',{values:['name']}),'name');assert.equal(read(new URLSearchParams('projectId=8'),'projectId','8',{urlDefault:''}),'8');assert.equal(read(new URLSearchParams(),'projectId','8',{urlDefault:''}),'');
 console.log('PASS: '+bindings.length+' actual ThreeD list bindings initialize/update query state, preserve custom/Next history, notify consumers, restore navigation and isolate embedded editors; batching/search/clamp/bounds tested with installed Next wrappers (mocked browser/React).');
})().catch(error=>{console.error(error);process.exitCode=1});
