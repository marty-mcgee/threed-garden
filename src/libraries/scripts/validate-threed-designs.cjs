// Execute actual Project snapshot transaction, loader, editor state and geometry with mocked persistence.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, deps = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
  { exports, Buffer, TextEncoder, URL, Date, AbortController, console, require(name) { assert(name in deps, name); return deps[name]; } }); return exports;
}
const root = 'src/libraries/services/threed/design/';
const document = load(root+'document.ts'), history = load(root+'history.ts', {'./document':document});
const workspace = load(root+'workspace-state.ts');
const architecture = load(root+'project-architecture.ts', {'./document':document,'./history':history,'./workspace-state':workspace});
const source = document.validateDesign({...document.newDesign(), nodes:[{id:'a',x:0,z:0},{id:'b',x:3.048,z:0},{id:'c',x:3.048,z:3.048},{id:'d',x:0,z:3.048}],
 walls:[['a','b'],['b','c'],['c','d'],['d','a']].map(([start,end],i)=>({id:'w'+i,levelId:'ground',start,end,height:2.4384,thickness:.1524,elevation:0})),
 floors:[{id:'floor',levelId:'ground',vertices:['a','b','c','d'],thickness:.1524,elevation:0}],
 openings:[{id:'door',wallId:'w0',kind:'door',offset:.3048,width:.9144,height:2.032,sill:0}]});
const captured={version:1,document:source};
assert(!architecture.architectureIsDirty(architecture.projectArchitectureDraft()), 'A new empty draft must be clean before hydration; otherwise Dashboard refuses to restore saved architecture.');
const properties = load(root+'object-properties.ts', {'./document':document});
const navigation = load(root+'plan-navigation.ts', {'./document':document});
const moved = properties.editObject(source,'floor',{field:'x',value:6.096});
assert.equal(moved.floors[0].id,'floor');assert.deepEqual(moved.nodes.map(n=>n.id),source.nodes.map(n=>n.id));
assert.equal(moved.nodes[0].x,4.572);assert.equal(moved.openings[0].wallId,'w0');
assert.equal(source.nodes[0].x,0,'Property edits must not mutate the prior history entry.');
const rotated = properties.editObject(source,'floor',{field:'rotation',value:90});
assert(Math.abs(properties.objectProperties(rotated,'floor').rotation-90)<.001);
const resized = properties.editObject(source,'floor',{field:'width',value:6.096});assert.equal(properties.objectProperties(resized,'floor').width,6.096);
assert.throws(()=>properties.editObject(source,'floor',{field:'depth',value:0}));
assert.throws(()=>properties.editObject(source,'w0',{field:'length',value:.5}),'Hosted door must reject an invalid short wall atomically.');
const flipped = properties.editObject(source,'floor',{field:'flipX'});assert.equal(flipped.nodes[0].x,3.048);
const withRoof = document.validateDesign({...source,roofs:[{id:'roof',levelId:'ground',vertices:['a','b','c','d'],kind:'flat',pitch:0,direction:0,thickness:.1524,elevation:2.4384}],roofOpenings:[{id:'hole',roofId:'roof',kind:'cutout',along:.5,across:.5,width:.254,length:.254}]});
for(const edit of [{field:'rotation',value:90},{field:'flipX'},{field:'flipZ'},{field:'x',value:6.096}]) {
 const transformed=properties.editObject(withRoof,'roof',edit);assert.equal(transformed.roofOpenings[0].roofId,'roof');
 assert(Math.abs(properties.entityPoints(transformed,'hole')[1].x-properties.entityPoints(transformed,'hole')[0].x) <= .255);
}
assert.throws(()=>properties.editObject(withRoof,'roof',{field:'width',value:6.096}),/Roof-frame/);
const v={x:80,y:80,scale:45},cursor={x:217,y:139},world=document.screenToPlan(cursor,v),zoom=navigation.zoomPlan(v,cursor,-350);
assert(Math.abs(document.screenToPlan(cursor,zoom).x-world.x)<1e-10);assert(Math.abs(document.screenToPlan(cursor,zoom).z-world.z)<1e-10);
for(const size of [{width:600,height:400},{width:310,height:200}]) {
 const frame=navigation.framePlan(properties.entityPoints(source,'door'),size);assert(frame);
 for(const p of properties.entityPoints(source,'door')){assert(p.x*frame.scale+frame.x>navigation.RULER_SIZE);assert(p.x*frame.scale+frame.x<size.width);assert(p.z*frame.scale+frame.y>navigation.RULER_SIZE);assert(p.z*frame.scale+frame.y<size.height);}
 for(const origin of [80,-137,zoom.x])for(const tick of navigation.rulerTicks(origin,zoom.scale,size.width)) {
  assert(Math.abs((tick.pixel-origin)/zoom.scale-tick.world)<1e-9);assert(tick.pixel>=navigation.RULER_SIZE-.001);assert(tick.pixel<=size.width+.001);
  assert(Math.abs(tick.world/(navigation.gridFeet(zoom.scale)*12*document.INCH)-Math.round(tick.world/(navigation.gridFeet(zoom.scale)*12*document.INCH)))<1e-9);
 }
}
console.log('PASS: immutable selected-object position/size/rotation/flip, stable shared corners/hosted openings, atomic rejection, roof-opening transform frames, pointer-centered zoom, selection framing and world-aligned Imperial ruler/grid ticks at resized bounds.');
let draft=architecture.projectArchitectureDraft(); draft={...draft,history:history.commitDesign(draft.history,source),selected:'door'};
assert(architecture.architectureIsDirty(draft));
const newer={...draft,history:history.commitDesign(draft.history,{...source,name:'Edited during Save'})};
const acknowledged=architecture.acknowledgeArchitecture(newer,captured);
assert.equal(acknowledged.history.present.name,'Edited during Save');assert(architecture.architectureIsDirty(acknowledged));assert.equal(acknowledged.selected,'door');
let n=0;const imported=architecture.importProjectArchitecture(source,source,'merge',()=> 'import'+(++n));
assert.equal(imported.walls.length,8);assert.equal(imported.floors.length,2);assert.notEqual(imported.openings[1].wallId,source.openings[0].wallId);
assert.equal(imported.levels[1].name,'Ground (2)');
const replaced=architecture.importProjectArchitecture(source,source,'replace',()=> 'replace'+(++n));assert.equal(replaced.walls.length,4);assert.notEqual(replaced.walls[0].id,'w0');
for(const bad of [{...source,userId:'other',projectId:99},{...source,walls:[{...source.walls[0],id:123}]},{...source,openings:[{...source.openings[0],wallId:'missing'}]}])assert.throws(()=>architecture.importProjectArchitecture(source,bad,'replace',()=> 'bad'+(++n)));
assert.throws(()=>architecture.parseProjectArchitecture({...captured,userId:'other'}));
const session=load('src/libraries/services/map/threed-project-session-core.ts',{'../threed/design/project-architecture':architecture});
async function checkStaleLoads(){
 const pending=[];const loader=load('src/components/map/hooks/useThreeDProjectSessionLoader.ts',{
 'react':{useRef:value=>({current:value}),useState:value=>[value,()=>{}],useCallback:fn=>fn,useEffect:()=>{}},
 '@/libraries/services/map/threed-project-session-core':{fetchThreeDProjectSession:(id,signal)=>new Promise(resolve=>pending.push({id,signal,resolve}))},
 });
 const hooks=loader.useThreeDProjectSessionLoader(),outcomes=[];
 const old=hooks.loadProjectSession('15',result=>outcomes.push(result));hooks.beginProjectTransition();assert(pending[0].signal.aborted);
 pending[0].resolve({success:true,session:{projectName:'old'}});await old;assert.equal(outcomes.length,0,'Transition immediately invalidates old Project loads, before the next effect.');
 const next=hooks.loadProjectSession('16',result=>outcomes.push(result));pending[1].resolve({success:true,session:{projectName:'new'}});await next;
 assert.equal(outcomes.length,1);assert.equal(outcomes[0].session.projectName,'new');
}
// Execute the actual Dashboard mode callback, including busy-transition cancellation.
const sceneSource = fs.readFileSync('src/app/dashboard/scene/page.tsx', 'utf8');
const sceneAst = ts.createSourceFile('page.tsx', sceneSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let modeCallback;
function findMode(node) {
  if (ts.isJsxAttribute(node) && node.name.getText(sceneAst) === 'onViewModeChange') modeCallback = node.initializer.expression.getText(sceneAst);
  ts.forEachChild(node, findMode);
}
findMode(sceneAst); assert(modeCallback);
const calls = []; let allowTransition = false;
const changeMode = vm.runInNewContext(ts.transpileModule(`(${modeCallback})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, {
  Event, URL,
  window: { dispatchEvent(event) { calls.push(event.type); return event.type !== 'threed:design:transition' || allowTransition; }, location: { href: 'http://local/dashboard/scene?projectId=15' }, history: { state: {}, replaceState(state, title, url) { calls.push(url.searchParams.get('view')); } } },
  cancelActiveSceneOperation: () => calls.push('cancel'), setControlledCharacterId: id => calls.push(['control', id]), setLiveControlledCharacterPosition: position => calls.push(['position', position]),
  groundMapInspector: null, transform: { cancel: () => calls.push('transform') }, setIsSceneAddMenuOpen: () => {}, setViewMode: mode => calls.push(['mode', mode]),
});
changeMode('design'); assert.equal(calls.length, 1, 'Busy editor must prevent the entire transition.');
calls.length = 0; allowTransition = true; changeMode('design');
assert(calls.includes('cancel')); assert(calls.includes('threed:design:entered')); assert(calls.includes('design')); assert.deepEqual(calls.at(-1), ['mode', 'design']);
const react = require('react');
const toolbar = load('src/components/map/header/ProjectSceneToolbar.tsx', {
  'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': new Proxy({}, { get: () => 'svg' }),
  '@/components/map/panels/SceneOperationStatus': { SceneOperationStatus: 'status' }, '@/components/ui/button': { Button: 'button' },
  '@/components/ui/dropdown-menu': { DropdownMenu: 'menu', DropdownMenuContent: 'menu-content', DropdownMenuItem: 'menu-item', DropdownMenuTrigger: 'menu-trigger' },
  '@/components/ui/tooltip': { Tooltip: 'tooltip', TooltipContent: 'tooltip-content', TooltipProvider: 'tooltip-provider', TooltipTrigger: 'tooltip-trigger' },
});
const elements = []; function walk(element) { if (!react.isValidElement(element)) return; elements.push(element); react.Children.forEach(element.props.children, walk); }
walk(toolbar.ProjectSceneToolbar({ selectedProjectId: '15', viewMode: 'design', onViewModeChange: mode => calls.push(mode), presentationComplete: true, projectAssetCount: 0 }));
const modeButtons = elements.filter(element => element.type === 'button' && 'aria-pressed' in element.props);
assert.equal(modeButtons.length, 4, 'All four view modes must be reachable from the toolbar.');
const designButton = modeButtons.find(button => button.props['aria-label'] === 'ThreeD Design View'); assert(designButton.props['aria-pressed']);
designButton.props.onClick(); assert.equal(calls.at(-1), 'design');
assert(elements.some(element => element.props.id === 'project-environment-controls-host' && !element.props.hidden), 'Design mode keeps the environment portal available.');
assert(elements.some(element => element.props['aria-label'] === 'Project Assets'));
assert(elements.some(element => element.type === 'menu'));
assert(elements.some(element => element.type === 'button' && react.Children.toArray(element.props.children).includes('Add')));
assert(elements.some(element => element.props['aria-label'] === 'Save ThreeD Project'), 'Design mode must use the existing Project Save control.');

// Execute the actual separator events with native-shaped pointer capture and keyboard doubles.
const divider = load('src/components/map/panels/ScenePanelDivider.tsx', {'react': {useRef:()=>({current:null})}, 'react/jsx-runtime':require('react/jsx-runtime')});
for(const axis of ['horizontal','vertical']){
 let value=50;const captures=new Set();const target={setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
 const panel=divider.ScenePanelDivider({containerRef:{current:{getBoundingClientRect:()=>({left:100,top:40,width:1000,height:500})}},value,onChange:next=>value=next,axis,label:'Resize panels'});
 assert.equal(panel.props.role,'separator');assert.equal(panel.props.tabIndex,0);
 panel.props.onPointerDown({button:0,pointerId:7,currentTarget:target,preventDefault(){}});
 panel.props.onPointerMove({pointerId:7,clientX:750,clientY:365});assert.equal(value,65);
 panel.props.onPointerMove({pointerId:8,clientX:0,clientY:0});assert.equal(value,65,'Other pointers cannot resize.');
 panel.props.onPointerMove({pointerId:7,clientX:5000,clientY:5000});assert.equal(value,80);
 panel.props.onPointerUp({pointerId:7,currentTarget:target});assert.equal(captures.size,0);
 panel.props.onPointerMove({pointerId:7,clientX:100,clientY:40});assert.equal(value,80,'Released drag must stop.');
 panel.props.onKeyDown({key:axis==='horizontal'?'ArrowLeft':'ArrowUp',preventDefault(){}});assert.equal(value,48);
 panel.props.onKeyDown({key:'Home',preventDefault(){}});assert.equal(value,20);
 panel.props.onKeyDown({key:'End',preventDefault(){}});assert.equal(value,80);panel.props.onDoubleClick();assert.equal(value,50);
}
const action = load('src/components/threed/design/DesignAction.tsx', {'react/jsx-runtime':require('react/jsx-runtime'),'@/components/ui/button':{Button:'button'},'@/components/ui/tooltip':{Tooltip:'tooltip',TooltipProvider:'provider',TooltipTrigger:'trigger',TooltipContent:'content'}});
elements.length=0;walk(action.DesignAction({label:'Wall',children:react.createElement('svg'),'aria-pressed':true}));
assert(elements.some(e=>e.type==='button'&&e.props['aria-label']==='Wall'&&e.props['aria-pressed']));assert(elements.some(e=>e.type==='content'&&e.props.children==='Wall'));

// Run the actual Project-keyed edit callback for two Projects, including a read-only context.
let editSource;
function findEdit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(sceneAst)==='changeArchitecture')editSource=node.initializer.arguments[0].getText(sceneAst);ts.forEachChild(node,findEdit);}findEdit(sceneAst);
const editContext={canEditProject:true,loading:false,selectedProjectId:'15',architectureDrafts:{current:new Map([['15',draft],['16',architecture.projectArchitectureDraft()]])},renderArchitecture:()=>{}};
const edit=vm.runInNewContext(ts.transpileModule('('+editSource+')',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,editContext);
edit(current=>({...current,selected:'w0'}));const firstProject=editContext.architectureDrafts.current.get('15');editContext.selectedProjectId='16';
edit(current=>({...current,selected:'other'}));assert.equal(editContext.architectureDrafts.current.get('15'),firstProject);assert.equal(editContext.architectureDrafts.current.get('16').history.present.walls.length,0);
editContext.canEditProject=false;edit(current=>({...current,selected:'denied'}));assert.equal(editContext.architectureDrafts.current.get('16').selected,'other');

// Verify both real adapters receive the authoritative source and selection; a standalone fixture alone cannot prove forwarding.
const unifiedAst=ts.createSourceFile('UnifiedMapView.tsx',fs.readFileSync('src/components/map/UnifiedMapView.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const adapters={};
function visitAdapter(node){if((ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node))&&['LeafletMap','ThreeDScene'].includes(node.tagName.getText(unifiedAst)))adapters[node.tagName.getText(unifiedAst)]=Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(attr=>[attr.name.getText(unifiedAst),attr.initializer?.expression?.getText(unifiedAst)]));ts.forEachChild(node,visitAdapter);}
visitAdapter(unifiedAst);
for(const name of ['LeafletMap','ThreeDScene'])for(const prop of ['selectedArchitectureId','onArchitectureSelect'])assert.equal(adapters[name][prop],prop);
for(const prop of ['architecture','metersPerSceneUnit','architectureLevelId','architectureShowRoofs'])assert.equal(adapters.ThreeDScene[prop],prop);
assert.equal(adapters.LeafletMap.architectureLines,'architectureLines');


function functionSource(file, name) {
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found;
 function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text===name)found=node.getText(source);ts.forEachChild(node,visit);}visit(source);assert(found,name);return found;
}
const route='src/app/api/project/threed-markers/route.ts';
const tables=Object.fromEntries(['project','projectAssets','projectThreed','projectThreedMarkers'].map(name=>[name,new Proxy({name},{get:(o,key)=>key==='name'?name:name+'.'+String(key)})]));
const orm=Object.fromEntries(['and','eq','inArray','notInArray'].map(name=>[name,(...args)=>({name,args})]));
orm.sql=(strings,...values)=>({strings:[...strings],values});
let signedIn=true,owned=true,fail=false,missingUpdate=false,workspaceWriteFault=null,writes=0,conditions=[],assignments=[{moduleId:7,assetType:'threed_models',assetId:20}];
let stored={config:{unrelated:{keep:true}},markers:[]};
const db={select(){const q={};const chain={from(table){q.table=table;return chain;},innerJoin(){return chain;},limit(){return chain;},where(condition){conditions.push(condition);return chain;},then(resolve,reject){return Promise.resolve(q.table===tables.project?(owned?[{id:15,userId:'owner',metersPerSceneUnit:'.3048'}]:[]):assignments).then(resolve,reject);}};return chain;},
 async transaction(fn){writes++;const pending=structuredClone(stored);const tx={execute:async()=>{},insert(){return{values(rows){pending.markers=structuredClone(rows);return{onConflictDoUpdate(){return{returning:async()=>rows};}}}};},delete(){return{where:async()=>{}};},update(){return{set(values){const delta=JSON.parse(values.config.values[1]);return{where(){return{returning:async()=>{if(fail)throw Error('mock transaction failure');if(missingUpdate)return [];pending.config={...pending.config,...delta};const returned=structuredClone(pending.config);if(workspaceWriteFault==='missing')delete returned.threeDViewState;if(workspaceWriteFault==='reordered')returned.threeDViewState=Object.fromEntries(Object.entries(returned.threeDViewState).reverse());if(workspaceWriteFault==='stale')returned.threeDViewState={...returned.threeDViewState,panelHeight:33};return [{config:returned}];}};}};}};}};
 const result=await fn(tx);stored=pending;return result;}};
class MarkerError extends Error{};class ViewError extends Error{};class PlantingError extends Error{};
const scope={...tables,...orm,db,Buffer,Date,console:{error(){}},NextResponse:{json:(body,options)=>({body,status:options?.status??200})},
 auth:async()=>signedIn?{user:{id:'owner'}}:null,MAX_REQUEST_BYTES:1048576,
 parsePositiveId:value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null,
 parseProjectThreeDMarkerSnapshot:value=>value,parseThreeDProjectViewState:value=>value,
 parseProjectArchitecture:architecture.parseProjectArchitecture,ProjectArchitectureError:architecture.ProjectArchitectureError,
 ProjectMarkerSnapshotError:MarkerError,ProjectViewStateError:ViewError,ProjectPlantingPlacementInputError:PlantingError,
 PROJECT_ASSET_TYPE_BY_MARKER:{models:'threed_models'},getMarkerGeographicValues:()=>({latitude:null,longitude:null}),
};
const compile=text=>ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const save=vm.runInNewContext(compile([functionSource(route,'requireOwnedProject'), functionSource(route,'saveSnapshot'), 'saveSnapshot;'].join('\n')),scope);
// Run the real GET route against the SAME in-memory Project row written by PUT.
const mapRoute='src/app/api/map/threed/route.ts';
const mapAst=ts.createSourceFile(mapRoute,fs.readFileSync(mapRoute,'utf8'),ts.ScriptTarget.Latest,true);
for(const node of mapAst.statements)if(ts.isImportDeclaration(node)&&node.moduleSpecifier.text.startsWith('@/libraries/schema/')) {
 for(const item of node.importClause.namedBindings.elements)if(!tables[item.name.text])tables[item.name.text]=new Proxy({name:item.name.text},{get:(o,key)=>key==='name'?o.name:o.name+'.'+String(key)});
}
const mapDb={select(selection){let table;const chain={from(value){table=value;return chain},where(){return chain},innerJoin(){return chain},orderBy(){return chain},limit(){return chain},then(resolve,reject){
 const records=table===tables.project?[{id:15,userId:'owner',name:'Existing Project',config:structuredClone(stored.config),metersPerSceneUnit:'.3048',originLatitude:null,originLongitude:null}]
 :table===tables.projectThreed?[{threedId:7,name:'Garden'}]:table===tables.projectAssets?assignments:table===tables.projectThreedMarkers?stored.markers
 :table===tables.threedModels?[{id:20,userId:'owner',filePath:'saved.glb',positionX:10,positionY:0,positionZ:5,isActive:true}]:[];
 return Promise.resolve(records).then(resolve,reject);}};return chain;}};
const get=vm.runInNewContext(compile(functionSource(mapRoute,'GET')+'\nGET;'),{...scope,...tables,exports:{},db:mapDb,URL,
 or:(...args)=>({args}),desc:value=>value,sql:orm.sql,getTableColumns:table=>table,modelSelection:()=>({}),retryDisconnectedRead:fn=>fn(),
 readProjectArchitecture:architecture.readProjectArchitecture,readThreeDProjectViewStateFromConfig:config=>config?.threeDViewState,
 canRenderAssignedModel:()=>true,currentModelAssets:model=>({filePath:model.filePath}),sceneTextureResources:async()=>[],
 MARKER_ASSET_TYPE_BY_MODULE:{models:'threed_models'},databaseConnectionDiagnostic:()=>({}),
});
let clientLoadSource;
function findLoad(node){if(ts.isVariableDeclaration(node)&&node.name.getText(sceneAst)==='loadData')clientLoadSource=node.initializer.arguments[0].getText(sceneAst);ts.forEachChild(node,findLoad);}findLoad(sceneAst);
async function hydrateDashboard(loaded, drafts, projectId='15'){
 const context={selectedProjectId:projectId,architectureDrafts:drafts,hydrateArchitectureDraft:architecture.hydrateArchitectureDraft,
 loadProjectSession:async(id,receive)=>receive({status:'loaded',session:loaded}),URL,window:{location:{href:'http://local/dashboard/scene?view=design'}},
 lastProjectThreeDViewStateRef:{current:null},lastProjectMapViewStateRef:{current:null},showToastRef:{current:()=>{}},Date,
 emptyProjectScenarioPanelState:()=>({})};
 for(const name of new Set(clientLoadSource.match(/\bset[A-Z]\w+|renderArchitecture/g)))context[name]=()=>{};
 await vm.runInNewContext(compile('('+clientLoadSource+')'),context)();
 return drafts.current.get(projectId);
}
let clientSaveSource, captureWorkspaceSource;
function findClientSave(node) {
 if(ts.isVariableDeclaration(node)&&node.name.getText(sceneAst)==='captureProjectWorkspace') captureWorkspaceSource=node.initializer.arguments[0].getText(sceneAst);
 if(ts.isVariableDeclaration(node)&&node.name.getText(sceneAst)==='handleSaveThreeDProject') clientSaveSource=node.initializer.arguments[0].getText(sceneAst);
 ts.forEachChild(node,findClientSave);
}
findClientSave(sceneAst);assert(clientSaveSource);
async function checkClientSave(model,view) {
 let finish, transportCount=0, body, feedback;
 const drafts={current:new Map([['15',draft]])};
const context={selectedProjectId:'15',canEditProject:true,loading:false,savingProjectMarkers:false,projectSaveBusy:{current:false},saveRequestRef:{current:0},architectureDrafts:drafts,acknowledgeArchitecture:architecture.acknowledgeArchitecture,parseProjectArchitecture:architecture.parseProjectArchitecture,
 projectMarkerSnapshotProviderRef:{current:()=>[model]},showToastRef:{current:()=>{}},setSavingProjectMarkers:()=>{},setArchitectureSaveError:value=>feedback=value,
 projectThreeDViewStateProviderRef:{current:null},lastProjectThreeDViewStateRef:{current:null},projectMapViewStateProviderRef:{current:null},lastProjectMapViewStateRef:{current:null},initialProjectViewState:null,
 PROJECT_VIEW_STATE_VERSION:3,viewMode:'design',panelHeight:50,cameraMode:'stationary',groundMapInspector:null,groupInspector:null,sensorInspector:null,defaultDesignWorkspace:()=>({}),selectedMarker:null,isProjectAssetsOpen:false,isModelLibraryOpen:false,projectAssetSearch:'',projectAssetType:'all',isProjectSetupOpen:false,overlayPositions:{},scenarioPanelState:{},isScenariosOpen:false,
 fetch:async(url,options)=>{assert.equal(url,'/api/project/threed-markers');assert.equal(options.method,'PUT');transportCount++;body=JSON.parse(options.body);return new Promise(resolve=>finish=resolve);},
 setData:()=>{},applyThreeDProjectClientTransaction:()=>{},renderArchitecture:()=>{},setLastUpdated:()=>{},Date,JSON,console:{error(){}}
 };
 context.captureProjectWorkspace=vm.runInNewContext(compile('('+captureWorkspaceSource+')'),context);
 context.workspaceFeedback={acknowledge:()=>{}};
 const callback=vm.runInNewContext(compile('('+clientSaveSource+')'),context);
 const pending=callback();await callback();assert.equal(transportCount,1,'Duplicate click must not start a second Project Save.');
 assert.equal(body.projectId,15);assert.equal(body.markers[0].data.filePath,model.data.filePath);assert.equal(body.architecture.document.openings[0].id,'door');
 drafts.current.set('15',newer);
 finish({ok:true,json:async()=>({success:true,data:{projectId:15,markers:[model],markerCount:1,architecture:captured}})});await pending;
 assert.equal(feedback,'');assert.equal(drafts.current.get('15').saved,JSON.stringify(source),'Successful Save must acknowledge the captured source.');
 assert(architecture.architectureIsDirty(drafts.current.get('15')));assert.equal(drafts.current.get('15').history.present.name,'Edited during Save');assert.equal(context.projectSaveBusy.current,false);
 context.canEditProject=false;await callback();assert.equal(transportCount,1,'Nonowners cannot dispatch Project Save.');context.canEditProject=true;
 const failed=callback();finish({ok:false,status:500,json:async()=>({success:false,error:'Project Save failed'})});await failed;
 assert.equal(feedback,'Project Save failed');assert(architecture.architectureIsDirty(drafts.current.get('15')));
 const obsolete=callback();context.saveRequestRef.current++;finish({ok:true,json:async()=>({success:true,data:{markers:[],markerCount:0}})});await obsolete;
 assert(architecture.architectureIsDirty(drafts.current.get('15')),'Late old-Project replies must not acknowledge the draft.');
 context.projectSaveBusy.current=false;context.loading=true;await callback();assert.match(feedback,/loading/);context.loading=false;
 const unconfirmed=callback();finish({ok:true,json:async()=>({success:true,data:{projectId:15,markers:[],markerCount:0}})});await unconfirmed;
 assert.match(feedback,/did not confirm/);assert(architecture.architectureIsDirty(drafts.current.get('15')));
 // Latest editor state -> actual client Save -> PUT transaction -> GET -> session -> actual Dashboard hydration.
 drafts.current.set('15',{...draft,workspace:{...workspace.defaultDesignWorkspace(),plan:{x:-321,y:224,scale:73},selectedEntityId:'door',split:62,sections:{'design:properties':false}}});
 context.overlayPositions={details:{x:0.7,y:0.2}};
 context.fetch=async(url,options)=>{body=JSON.parse(options.body);const result=await save(request(body));return {ok:result.status===200,status:result.status,json:async()=>result.body};};
 await callback();assert.equal(feedback,'');assert(!architecture.architectureIsDirty(drafts.current.get('15')));
 const response=await get({url:'http://local/api/map/threed?projectId=15'});assert.equal(response.status,200);
 const loaded=session.buildThreeDProjectSession(response.body,'15');assert(loaded.success);
 const fresh={current:new Map([['15',architecture.projectArchitectureDraft()]])};
 const restored=await hydrateDashboard(loaded.session,fresh);
 assert.equal(JSON.stringify(restored.history.present),JSON.stringify(source));assert(!architecture.architectureIsDirty(restored));
 assert.equal(loaded.session.data.threed.raw.models[0].filePath,'saved.glb');assert.equal(loaded.session.data.threed.raw.projectThreedMarkers[0].markerId,model.markerId);
 assert.equal(stored.config.unrelated.keep,true);
 assert.equal(loaded.session.savedViewState.overlayPositions.details.x,0.7);assert.equal(loaded.session.savedViewState.overlayPositions.details.y,0.2);
 assert.equal(restored.workspace.plan.x,-321);assert.equal(restored.workspace.plan.scale,73);assert.equal(restored.workspace.split,62);assert.equal(restored.selected,'door');assert.equal(restored.workspace.sections['design:properties'],false);
 const workspaceEdit={...restored,workspace:{...restored.workspace,split:55}};assert(architecture.architectureIsDirty(workspaceEdit));assert(architecture.architectureIsDirty(architecture.acknowledgeArchitecture(workspaceEdit,captured,restored.workspace)),'A workspace edit during Save must remain unsaved.');
 fresh.current.set('15',newer);assert.equal(await hydrateDashboard(loaded.session,fresh),newer,'Reload may not overwrite genuine unsaved edits.');
 fresh.current.set('16',architecture.projectArchitectureDraft());await hydrateDashboard({...loaded.session,architecture:undefined},fresh,'16');
 assert.equal(fresh.current.get('15'),newer);assert.equal(fresh.current.get('16').history.present.walls.length,0);assert(!architecture.architectureIsDirty(fresh.current.get('16')));
}
const model={markerId:'model-20',moduleType:'models',assetId:20,name:'Existing Model',position:{x:10,y:0,z:5},positionSource:'project',isVisible:true,isActive:true,data:{rotationY:25,scale:2,filePath:'saved.glb',materials:{map:'saved.png'}},metadata:{keep:'settings'}};
const view={version:1,savedAt:'2026-10-09T00:00:00.000Z',viewMode:'design',panelHeight:50,cameraMode:'stationary'};
const request=(body)=>({text:async()=>JSON.stringify(body)});
async function run(){
 await checkStaleLoads();
 const input={projectId:15,markers:[model],viewState:view,architecture:captured};
 signedIn=false;assert.equal((await save(request(input))).status,401);signedIn=true;assert.equal(writes,0);
 owned=false;assert.equal((await save(request(input))).status,404);owned=true;assert.equal(writes,0);
 assert.equal((await save(request({...input,architecture:{...captured,document:{...source,userId:'other'}}}))).status,400);assert.equal(writes,0);
 assert.equal((await save(request({...input,pad:'x'.repeat(1048576)}))).status,413);assert.equal(writes,0);
 const saved=await save(request(input));assert.equal(saved.status,200);assert.equal(writes,1);
 assert.equal(JSON.stringify(saved.body.data.architecture),JSON.stringify(captured),'Save response must describe the returned stored Project row.');
 assert(JSON.stringify(conditions).includes('project.userId'));assert(JSON.stringify(conditions).includes('owner'));
 assert.deepEqual(stored.config.unrelated,{keep:true});assert.equal(stored.markers[0].markerId,model.markerId);assert.deepEqual(stored.markers[0].data,model.data);assert.deepEqual(stored.markers[0].metadata,model.metadata);
 const reopened=session.buildThreeDProjectSession({success:true,total:1,data:{models:[{id:20,filePath:'saved.glb',positionX:10,positionY:0,positionZ:5}]},markerSnapshot:stored.markers,projectContext:{canEdit:true,projectName:'Existing Project',metersPerSceneUnit:.3048,architecture:stored.config.threeDArchitecture,viewState:stored.config.threeDViewState}},'15');
 assert(reopened.success);assert.equal(reopened.session.data.threed.raw.models.length,1);assert.equal(reopened.session.architecture.document.openings[0].wallId,'w0');assert.equal(reopened.session.metersPerSceneUnit,.3048);
 assert(!architecture.architectureIsDirty(architecture.projectArchitectureDraft(reopened.session.architecture)));
 const emptyProject=session.buildThreeDProjectSession({success:true,data:{},projectContext:{canEdit:true}},'16');assert(emptyProject.success);assert.equal(emptyProject.session.architecture,undefined,'Architecture-free Projects load normally.');
 const previous=JSON.stringify(stored);fail=true;assert.equal((await save(request({...input,architecture:{version:1,document:{...source,name:'Failed'}}}))).status,500);assert.equal(JSON.stringify(stored),previous);fail=false;
 const legacy={...input};delete legacy.architecture;assert.equal((await save(request(legacy))).status,200);assert.equal(JSON.stringify(stored.config.threeDArchitecture.document),JSON.stringify(source),'Legacy Project Save must preserve architecture.');
 const invalid=session.buildThreeDProjectSession({success:true,projectContext:{architecture:{version:99}}},'15');assert.equal(invalid.success,false);
 assert.equal(session.buildThreeDProjectSession({success:true,projectContext:{projectId:16,architecture:captured}},'15').success,false);
 const beforeMissing=JSON.stringify(stored);missingUpdate=true;assert.equal((await save(request(input))).status,500);assert.equal(JSON.stringify(stored),beforeMissing);missingUpdate=false;
 for(const fault of ['missing','stale']) {
  const beforeFault=JSON.stringify(stored);workspaceWriteFault=fault;
  const rejected=await save(request({...input,architecture:{version:1,document:{...source,name:'Must roll back'}}}));
  assert.equal(rejected.status,500,'Unconfirmed workspace must fail Save: '+fault);
  assert.equal(JSON.stringify(stored),beforeFault,'Markers, architecture and workspace must roll back together.');
 }
 workspaceWriteFault='reordered';assert.equal((await save(request(input))).status,200,'JSONB key order must not cause false Save failures.');
 workspaceWriteFault=null;
 await checkClientSave(model,view);
 const complete=document.validateDesign({...withRoof,levels:[...withRoof.levels,{id:'upper',name:'Upper',elevation:3.048}],nodes:[...withRoof.nodes,{id:'up-a',x:5,z:0},{id:'up-b',x:8,z:0}],walls:[...withRoof.walls,{...withRoof.walls[0],id:'upper-wall',levelId:'upper',start:'up-a',end:'up-b'}]});
 assert.equal((await save(request({...input,architecture:{version:1,document:complete}}))).status,200);
 const fullResponse=await get({url:'http://local/api/map/threed?projectId=15'}),fullSession=session.buildThreeDProjectSession(fullResponse.body,'15');assert(fullSession.success);
 const fullDraft=await hydrateDashboard(fullSession.session,{current:new Map([['15',architecture.projectArchitectureDraft()]])});
 assert.equal(JSON.stringify(fullDraft.history.present),JSON.stringify(complete),'Stable level/entity IDs, dimensions, doors, roofs and roof openings survive PUT/GET/hydration.');assert(!architecture.architectureIsDirty(fullDraft));
 const THREE=require('three'),merge=await import('three/examples/jsm/utils/BufferGeometryUtils.js');
 const geometry=load(root+'geometry.ts',{'three':THREE,'three/examples/jsm/utils/BufferGeometryUtils.js':merge,'./document':document});
 const cache=new geometry.DesignGeometryCache();cache.update(reopened.session.architecture.document,'door');
 const world=new THREE.Scene(),existing=new THREE.Mesh(new THREE.BoxGeometry(1,1,1));existing.position.set(10,0,5);world.add(existing);cache.group.scale.setScalar(1/reopened.session.metersPerSceneUnit);world.add(cache.group);world.updateMatrixWorld(true);
 const wall=cache.group.getObjectByName('w1');assert(wall);const bounds=new THREE.Box3().setFromObject(wall);assert(Math.abs(bounds.max.x-10.25)<.01,'A 10 ft room must occupy 10 Scene units plus half-wall thickness.');
 const geometryIdentity=wall.geometry;cache.update(source,'floor');assert.equal(wall.geometry,geometryIdentity);assert.equal(existing.parent,world);assert.equal(existing.position.x,10);cache.dispose();assert.equal(existing.parent,world,'Architecture cleanup must retain the Model owner.');
 console.log('PASS: actual Project snapshot transaction and load roundtrip with existing Model, room/floor/door, owner guards, malformed/oversized input rejection, atomic failure, legacy Save preservation, pending-edit acknowledgment, safe merge/replace IDs and real Scene-unit geometry. No database connection.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});

// Execute the Dashboard restoration effect against delayed and missing Scene references.
let restoreEffect;
function findRestore(node){if(ts.isCallExpression(node)&&node.expression.getText(sceneAst)==='useEffect'&&node.arguments[0]?.getText(sceneAst).includes('restoredWorkspaceRef.current = initialProjectViewState'))restoreEffect=node.arguments[0].getText(sceneAst);ts.forEachChild(node,findRestore);}findRestore(sceneAst);assert(restoreEffect);
const restoredUI={};const restoreContext={loading:false,canEditProject:true,viewMode:'design',isThreeDPresentationComplete:false,restoredWorkspaceRef:{current:null},initialProjectViewState:{workspace:{selectedMarkerId:'model-1',inspector:{kind:'sensor',id:'sensor-1'},panel:'assets',assetSearch:'',assetType:'models'}},projectRuntimeMarkers:[{id:'model-1',type:'models',metadata:{sensors:[{id:'sensor-1'}]}}],sensorGroupsWorkspace:{loading:false,groups:[]},readPhysicsSensorCuboids:metadata=>metadata.sensors,groundMapInspector:{setOpen:value=>restoredUI.ground=value},openModelLibrary:()=>{restoredUI.library=true}};
for(const name of ['SelectedMarker','SensorInspector','GroupInspector','IsProjectSummaryOpen','IsProjectAssetsOpen','ProjectAssetSearch','ProjectAssetType','IsScenariosOpen','IsProjectSetupOpen'])restoreContext['set'+name]=value=>restoredUI[name]=value;
const restore=vm.runInNewContext(compile('('+restoreEffect+')'),restoreContext);restore();assert.equal(Object.keys(restoredUI).length,0,'Do not restore before Scene readiness.');restoreContext.isThreeDPresentationComplete=true;restore();assert.equal(restoredUI.SelectedMarker.id,'model-1');assert.equal(restoredUI.SensorInspector.sensorId,'sensor-1');
restoreContext.initialProjectViewState={workspace:{selectedMarkerId:'deleted',inspector:{kind:'sensor',id:'missing'},panel:'none',assetSearch:'',assetType:'models'}};restore();assert.equal(restoredUI.SelectedMarker,null);assert.equal(restoredUI.SensorInspector,null);
restoreContext.initialProjectViewState={workspace:{selectedMarkerId:null,inspector:{kind:'group',id:'missing'},panel:'none',assetSearch:'',assetType:'all'}};restore();assert.equal(restoredUI.GroupInspector,null);
console.log('PASS: actual inspector hydration waits for Scene readiness and ignores missing marker, Sensor and Group references.');

const cameraFile='src/components/map/ThreeDScene.tsx',cameraAst=ts.createSourceFile(cameraFile,fs.readFileSync(cameraFile,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let cameraEffect;
function findCamera(node){if(ts.isCallExpression(node)&&node.expression.getText(cameraAst)==='useEffect'&&node.arguments[0]?.getText(cameraAst).includes('restoredProjectViewKeyRef.current = key'))cameraEffect=node.arguments[0].getText(cameraAst);ts.forEachChild(node,findCamera);}findCamera(cameraAst);assert(cameraEffect);
const compatible=vm.runInNewContext(compile(functionSource(cameraFile,'isSavedCameraCompatibleWithScene')+';isSavedCameraCompatibleWithScene;'),{});
const projection={position:{set(...values){this.values=values}},isPerspectiveCamera:true,updateProjectionMatrix(){this.updated=true}};const target={set(...values){this.values=values}};
const cameraContext={controlsReady:false,controlsRef:{current:{object:projection,target,update(){}}},initialViewState:{cameraPosition:{x:10000,y:10,z:10000},cameraTarget:{x:9990,y:0,z:9990},cameraZoom:1.5,cameraFov:60,activeLayers:['models'],environment:'sunset',autoRotate:false,showGrid:false,showLegend:false,showGizmo:true},projectId:15,restoredProjectViewKeyRef:{current:null},isSavedCameraCompatibleWithScene:compatible,availableLayers:['models'],autoRotate:false,resolveRestoredThreeDActiveLayers:value=>value,updateGeographicCompass(){},zoomToPosition(){throw Error('Saved camera must not auto-fit to Model bounds')}};
for(const name of new Set(cameraEffect.match(/\bset[A-Z]\w+/g)))cameraContext[name]=()=>{};
const restoreCamera=vm.runInNewContext(compile('('+cameraEffect+')'),cameraContext);restoreCamera();assert.equal(projection.updated,undefined);cameraContext.controlsReady=true;restoreCamera();assert.deepEqual(projection.position.values,[10000,10,10000]);assert.deepEqual(target.values,[9990,0,9990]);assert.equal(projection.zoom,1.5);assert.equal(projection.fov,60);assert(projection.updated);projection.position.values=[12,13,14];restoreCamera();assert.deepEqual(projection.position.values,[12,13,14],'Later renders must not reapply saved camera over user navigation.');
console.log('PASS: actual camera restoration waits for controls, restores position/target/zoom/FOV beyond Model bounds, and does not reapply on later renders.');

let simulationVisibility;
cameraContext.setShowSimulations=value=>simulationVisibility=value;
cameraContext.restoredProjectViewKeyRef.current=null;
cameraContext.initialViewState={...cameraContext.initialViewState,showSimulations:false};restoreCamera();assert.equal(simulationVisibility,false,'Saved closed Simulations must restore closed.');
cameraContext.restoredProjectViewKeyRef.current=null;
cameraContext.initialViewState={...cameraContext.initialViewState,showSimulations:true};restoreCamera();assert.equal(simulationVisibility,true);
cameraContext.restoredProjectViewKeyRef.current=null;
delete cameraContext.initialViewState.showSimulations;restoreCamera();assert.equal(simulationVisibility,true,'Legacy Projects retain visible default.');
