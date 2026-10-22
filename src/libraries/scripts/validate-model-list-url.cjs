const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={},extras={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,URL,URLSearchParams,...extras,require:n=>{assert(n in mocks,n);return mocks[n]}});return exports;}
const core=load('src/libraries/services/threed/models/model-list-query.ts');
for(const flag of core.MODEL_MISSING_FILTERS){assert.equal(core.parseModelMissingFilters(new URLSearchParams(flag+'=true'))[flag],true);assert.equal(core.parseModelMissingFilters(new URLSearchParams(flag+'=false'))[flag],false);assert.throws(()=>core.parseModelMissingFilters(new URLSearchParams(flag+'=1')));}
let url=new URL('http://fixture/admin/threed/models?search=Table&category=seating&missingTopView=true&limit=25&offset=250&sort=size&direction=desc&unrelated=keep#records');const entries=[url.href];let index=0,writes=0,local,localSet;
let routerParams=new URLSearchParams(url.search), notifications=0;
const history={state:{nextOwner:'retained',__NA:true,_N:true,__PRIVATE_NEXTJS_INTERNALS_TREE:{fixture:true}},pushState(state,_,href){assert.equal(state.nextOwner,'retained');url=new URL(href,url);entries.splice(++index);entries.push(url.href);writes++;},replaceState(state,_,href){assert.equal(state.nextOwner,'retained');url=new URL(href,url);entries[index]=url.href;writes++;}};
// Run the installed Next history wrappers, rather than assuming address changes notify React.
const nextAst=ts.createSourceFile('app-router.js',fs.readFileSync('node_modules/next/dist/client/components/app-router.js','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const wrappers={};function findWrappers(n){if(ts.isBinaryExpression(n)&&ts.isFunctionExpression(n.right)&&['window.history.pushState','window.history.replaceState'].includes(n.left.getText(nextAst)))wrappers[n.left.getText(nextAst).split('.').at(-1)]=n.right.getText(nextAst);ts.forEachChild(n,findWrappers)}findWrappers(nextAst);
for(const method of ['pushState','replaceState']){assert(wrappers[method]);const original=history[method].bind(history);history[method]=vm.runInNewContext('('+wrappers[method]+')',{
 originalPushState:original,originalReplaceState:original,
 copyNextJsInternalHistoryState:data=>({...data,__NA:true,__PRIVATE_NEXTJS_INTERNALS_TREE:history.state.__PRIVATE_NEXTJS_INTERNALS_TREE}),
 applyUrlFromHistoryPushReplace:href=>{routerParams=new URL(href,url).searchParams;notifications++;}
});}
const browser={get location(){return url},history};
const hook=load('src/components/admin/threed/models/use-model-list-state.ts',{'react':{useState:init=>{if(local===undefined)local=init();return [local,value=>{local=typeof value==='function'?value(local):value;localSet=true}]}},'next/navigation':{useSearchParams:()=>routerParams},'@/libraries/services/threed/models/model-list-query':core},{window:browser});
let result=hook.useModelListState(true);assert.equal(result.state.search,'Table');assert.equal(result.state.page,10);assert.equal(result.state.missingTopView,true);
result.update({page:0,missingThumbnail:true});assert.equal(url.searchParams.get('offset'),null);assert.equal(url.searchParams.get('unrelated'),'keep');assert.equal(url.hash,'#records');assert.equal(index,1);assert.equal(notifications,1,'Filter must notify Next, not merely change the address');assert.equal(hook.useModelListState(true).state.missingThumbnail,true);
result=hook.useModelListState(true);result.update({search:'Chair & table'},true);assert.equal(index,1);assert.equal(url.searchParams.get('search'),'Chair & table');assert.equal(hook.useModelListState(true).state.search,'Chair & table');assert.equal(notifications,2);result.update({page:2});assert.equal(url.searchParams.get('offset'),'50');
url=new URL(entries[--index]);routerParams=url.searchParams;result=hook.useModelListState(true);assert.equal(result.state.search,'Chair & table');assert.equal(result.state.page,0);url=new URL(entries[--index]);routerParams=url.searchParams;result=hook.useModelListState(true);assert.equal(result.state.page,10);assert.equal(result.state.missingThumbnail,false);
url=new URL(entries[++index]);routerParams=url.searchParams;result=hook.useModelListState(true);assert.equal(result.state.missingThumbnail,true);result.reset();assert.equal(url.searchParams.get('unrelated'),'keep');assert.equal(url.searchParams.get('search'),null);assert.equal(url.searchParams.get('missingTopView'),null);
const before=writes;result=hook.useModelListState(false);result.update({search:'embedded',missingTextures:true});assert(localSet);assert.equal(writes,before);assert.equal(hook.useModelListState(false).state.search,'embedded');
const invalid=core.readModelAdminListState(new URLSearchParams('limit=999&offset=-1&sort=drop&direction=oops&isActive=anything'));assert.equal(invalid.pageSize,50);assert.equal(invalid.page,0);assert.equal(invalid.sort,'name');assert.equal(invalid.direction,'asc');assert.equal(invalid.isActive,'');
const round=core.readModelAdminListState(core.writeModelAdminListState(new URLSearchParams(),result.state));assert.equal(round.pageSize,result.state.pageSize);
console.log('PASS: Model URL initialization, encoded search, filters/page/sort, push versus replace, Back/Forward restoration, reset preserving unrelated params/hash and embedded isolation (mocked Next/browser).');

// Execute the actual list request function, including stale-response and recovery guards.
const componentFile='src/components/admin/threed/models/ThreeDModelsCRUD.tsx';
const ast=ts.createSourceFile(componentFile,fs.readFileSync(componentFile,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let fn;
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='fetchModels')fn=n;ts.forEachChild(n,visit)}visit(ast);assert(fn);
const pending=[],queryCalls=[],saved=[],errors=[],updates=[];
const context={AbortController,URLSearchParams,listRequest:{current:0},listAbort:{current:null},page:0,pageSize:25,searchQuery:'Table',sort:{field:'name',direction:'asc'},category:'seating',modelType:'obj',status:'active',isActive:'true',missingTextures:true,missingThumbnail:true,missingTopView:true,
 setListError:v=>errors.push(v),setLoading(){},setTotal(){},setModels:v=>saved.push(v),updateList:(...v)=>updates.push(v),showToast(){},
 fetch:(url,options)=>{queryCalls.push({url,options});return new Promise(resolve=>pending.push(resolve))}};
vm.createContext(context);vm.runInContext(ts.transpileModule(fn.getText(ast)+'\nglobalThis.fetchList=fetchModels;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
(async()=>{
 let first=context.fetchList();const firstSignal=queryCalls[0].options.signal;context.searchQuery='Chair';let second=context.fetchList();assert(firstSignal.aborted);
 const params=new URL(queryCalls[1].url,'https://fixture').searchParams;for(const key of ['missingTextures','missingThumbnail','missingTopView'])assert.equal(params.get(key),'true');assert.equal(params.get('category'),'seating');assert.equal(params.get('search'),'Chair');assert.equal(params.get('scope'),null);
 pending[1]({ok:true,json:async()=>({success:true,data:[{id:2}],pagination:{total:2}})});await second;
 pending[0]({ok:true,json:async()=>({success:true,data:[{id:1}],pagination:{total:2}})});await first;assert.deepEqual(JSON.parse(JSON.stringify(saved)),[[{id:2}]]);
 context.page=10;let clamp=context.fetchList();pending[2]({ok:true,json:async()=>({success:true,data:[],pagination:{total:2}})});await clamp;assert.equal(updates[0][0].page,0);assert.equal(updates[0][1],true,'Clamped pages replace history to avoid a Back loop');
 context.page=0;let failed=context.fetchList();pending[3]({ok:false,json:async()=>({error:'Fixture failure'})});await failed;assert.equal(errors.at(-1),'Fixture failure');assert.equal(saved.at(-1).length,0);
 console.log('PASS: actual Model list request carries combined filters and owner scope, aborts/ignores stale responses, replaces invalid pages and exposes retry errors (mocked fetch).');
})().catch(e=>{console.error(e);process.exitCode=1});
