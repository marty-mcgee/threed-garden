// Execute actual Project snapshot transaction, loader, editor state and geometry with mocked persistence.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, deps = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText,
  { exports, Buffer, TextEncoder, URL, Date, console, require(name) { assert(name in deps, name); return deps[name]; } }); return exports;
}
const root = 'src/libraries/services/threed/design/';
const document = load(root+'document.ts'), history = load(root+'history.ts', {'./document':document});
const architecture = load(root+'project-architecture.ts', {'./document':document,'./history':history});
const source = document.validateDesign({...document.newDesign(), nodes:[{id:'a',x:0,z:0},{id:'b',x:3.048,z:0},{id:'c',x:3.048,z:3.048},{id:'d',x:0,z:3.048}],
 walls:[['a','b'],['b','c'],['c','d'],['d','a']].map(([start,end],i)=>({id:'w'+i,levelId:'ground',start,end,height:2.4384,thickness:.1524,elevation:0})),
 floors:[{id:'floor',levelId:'ground',vertices:['a','b','c','d'],thickness:.1524,elevation:0}],
 openings:[{id:'door',wallId:'w0',kind:'door',offset:.3048,width:.9144,height:2.032,sill:0}]});
const captured={version:1,document:source};
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
});
const elements = []; function walk(element) { if (!react.isValidElement(element)) return; elements.push(element); react.Children.forEach(element.props.children, walk); }
walk(toolbar.ProjectSceneToolbar({ selectedProjectId: '15', viewMode: 'design', onViewModeChange: mode => calls.push(mode), presentationComplete: true, projectAssetCount: 0 }));
const modeButtons = elements.filter(element => element.type === 'button' && 'aria-pressed' in element.props);
assert.equal(modeButtons.length, 4, 'All four view modes must be reachable from the toolbar.');
const designButton = modeButtons.find(button => button.props['aria-label'] === 'ThreeD Design View'); assert(designButton.props['aria-pressed']);
designButton.props.onClick(); assert.equal(calls.at(-1), 'design');
assert(elements.some(element => element.props.id === 'project-environment-controls-host' && element.props.hidden), 'Design mode retains the hidden environment portal host.');
assert(elements.some(element => element.props['aria-label'] === 'Save ThreeD Project'), 'Design mode must use the existing Project Save control.');

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
let signedIn=true,owned=true,fail=false,writes=0,conditions=[],assignments=[{moduleId:7,assetType:'threed_models',assetId:20}];
let stored={config:{unrelated:{keep:true}},markers:[]};
const db={select(){const q={};const chain={from(table){q.table=table;return chain;},innerJoin(){return chain;},limit(){return chain;},where(condition){conditions.push(condition);return chain;},then(resolve,reject){return Promise.resolve(q.table===tables.project?(owned?[{id:15,userId:'owner',metersPerSceneUnit:'.3048'}]:[]):assignments).then(resolve,reject);}};return chain;},
 async transaction(fn){writes++;const pending=structuredClone(stored);const tx={execute:async()=>{},insert(){return{values(rows){pending.markers=structuredClone(rows);return{onConflictDoUpdate(){return{returning:async()=>rows};}}}};},delete(){return{where:async()=>{}};},update(){return{set(values){const delta=JSON.parse(values.config.values[1]);return{where:async()=>{if(fail)throw Error('mock transaction failure');pending.config={...pending.config,...delta};}};}};}};
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
let clientSaveSource;
function findClientSave(node) {
 if(ts.isVariableDeclaration(node)&&node.name.getText(sceneAst)==='handleSaveThreeDProject') clientSaveSource=node.initializer.arguments[0].getText(sceneAst);
 ts.forEachChild(node,findClientSave);
}
findClientSave(sceneAst);assert(clientSaveSource);
async function checkClientSave(model,view) {
 let finish, transportCount=0, body, feedback;
 const drafts={current:new Map([['15',draft]])};
const context={selectedProjectId:'15',canEditProject:true,savingProjectMarkers:false,projectSaveBusy:{current:false},saveRequestRef:{current:0},architectureDrafts:drafts,acknowledgeArchitecture:architecture.acknowledgeArchitecture,
 projectMarkerSnapshotProviderRef:{current:()=>[model]},showToastRef:{current:()=>{}},setSavingProjectMarkers:()=>{},setArchitectureSaveError:value=>feedback=value,
 projectThreeDViewStateProviderRef:{current:null},lastProjectThreeDViewStateRef:{current:null},projectMapViewStateProviderRef:{current:null},lastProjectMapViewStateRef:{current:null},initialProjectViewState:null,
 PROJECT_VIEW_STATE_VERSION:3,viewMode:'design',panelHeight:50,cameraMode:'stationary',selectedMarker:null,isProjectAssetsOpen:false,isModelLibraryOpen:false,projectAssetSearch:'',projectAssetType:'all',isProjectSetupOpen:false,overlayPositions:{},scenarioPanelState:{},isScenariosOpen:false,
 fetch:async(url,options)=>{assert.equal(url,'/api/project/threed-markers');assert.equal(options.method,'PUT');transportCount++;body=JSON.parse(options.body);return new Promise(resolve=>finish=resolve);},
 setData:()=>{},applyThreeDProjectClientTransaction:()=>{},renderArchitecture:()=>{},setLastUpdated:()=>{},Date,JSON,console:{error(){}}
 };
 const callback=vm.runInNewContext(compile('('+clientSaveSource+')'),context);
 const pending=callback();await callback();assert.equal(transportCount,1,'Duplicate click must not start a second Project Save.');
 assert.equal(body.projectId,15);assert.equal(body.markers[0].data.filePath,model.data.filePath);assert.equal(body.architecture.document.openings[0].id,'door');
 drafts.current.set('15',newer);
 finish({ok:true,json:async()=>({success:true,data:{markers:[model],markerCount:1,architecture:captured}})});await pending;
 assert.equal(feedback,'');assert.equal(drafts.current.get('15').saved,JSON.stringify(source),'Successful Save must acknowledge the captured source.');
 assert(architecture.architectureIsDirty(drafts.current.get('15')));assert.equal(drafts.current.get('15').history.present.name,'Edited during Save');assert.equal(context.projectSaveBusy.current,false);
 context.canEditProject=false;await callback();assert.equal(transportCount,1,'Nonowners cannot dispatch Project Save.');context.canEditProject=true;
 const failed=callback();finish({ok:false,status:500,json:async()=>({success:false,error:'Project Save failed'})});await failed;
 assert.equal(feedback,'Project Save failed');assert(architecture.architectureIsDirty(drafts.current.get('15')));
 const obsolete=callback();context.saveRequestRef.current++;finish({ok:true,json:async()=>({success:true,data:{markers:[],markerCount:0}})});await obsolete;
 assert(architecture.architectureIsDirty(drafts.current.get('15')),'Late old-Project replies must not acknowledge the draft.');
}
const model={markerId:'model-20',moduleType:'models',assetId:20,name:'Existing Model',position:{x:10,y:0,z:5},positionSource:'project',isVisible:true,isActive:true,data:{rotationY:25,scale:2,filePath:'saved.glb',materials:{map:'saved.png'}},metadata:{keep:'settings'}};
const view={version:1,savedAt:'2026-10-09T00:00:00.000Z',viewMode:'design',panelHeight:50,cameraMode:'stationary'};
const request=(body)=>({text:async()=>JSON.stringify(body)});
async function run(){
 await checkClientSave(model,view);
 const input={projectId:15,markers:[model],viewState:view,architecture:captured};
 signedIn=false;assert.equal((await save(request(input))).status,401);signedIn=true;assert.equal(writes,0);
 owned=false;assert.equal((await save(request(input))).status,404);owned=true;assert.equal(writes,0);
 assert.equal((await save(request({...input,architecture:{...captured,document:{...source,userId:'other'}}}))).status,400);assert.equal(writes,0);
 assert.equal((await save(request({...input,pad:'x'.repeat(1048576)}))).status,413);assert.equal(writes,0);
 const saved=await save(request(input));assert.equal(saved.status,200);assert.equal(writes,1);
 assert(JSON.stringify(conditions).includes('project.userId'));assert(JSON.stringify(conditions).includes('owner'));
 assert.deepEqual(stored.config.unrelated,{keep:true});assert.equal(stored.markers[0].markerId,model.markerId);assert.deepEqual(stored.markers[0].data,model.data);assert.deepEqual(stored.markers[0].metadata,model.metadata);
 const reopened=session.buildThreeDProjectSession({success:true,total:1,data:{models:[{id:20,filePath:'saved.glb',positionX:10,positionY:0,positionZ:5}]},markerSnapshot:stored.markers,projectContext:{canEdit:true,projectName:'Existing Project',metersPerSceneUnit:.3048,architecture:stored.config.threeDArchitecture,viewState:stored.config.threeDViewState}},'15');
 assert(reopened.success);assert.equal(reopened.session.data.threed.raw.models.length,1);assert.equal(reopened.session.architecture.document.openings[0].wallId,'w0');assert.equal(reopened.session.metersPerSceneUnit,.3048);
 assert(!architecture.architectureIsDirty(architecture.projectArchitectureDraft(reopened.session.architecture)));
 const previous=JSON.stringify(stored);fail=true;assert.equal((await save(request({...input,architecture:{version:1,document:{...source,name:'Failed'}}}))).status,500);assert.equal(JSON.stringify(stored),previous);fail=false;
 const legacy={...input};delete legacy.architecture;assert.equal((await save(request(legacy))).status,200);assert.equal(JSON.stringify(stored.config.threeDArchitecture.document),JSON.stringify(source),'Legacy Project Save must preserve architecture.');
 const invalid=session.buildThreeDProjectSession({success:true,projectContext:{architecture:{version:99}}},'15');assert.equal(invalid.success,false);
 const THREE=require('three'),merge=await import('three/examples/jsm/utils/BufferGeometryUtils.js');
 const geometry=load(root+'geometry.ts',{'three':THREE,'three/examples/jsm/utils/BufferGeometryUtils.js':merge,'./document':document});
 const cache=new geometry.DesignGeometryCache();cache.update(reopened.session.architecture.document,'door');
 const world=new THREE.Scene(),existing=new THREE.Mesh(new THREE.BoxGeometry(1,1,1));existing.position.set(10,0,5);world.add(existing);cache.group.scale.setScalar(1/reopened.session.metersPerSceneUnit);world.add(cache.group);world.updateMatrixWorld(true);
 const wall=cache.group.getObjectByName('w1');assert(wall);const bounds=new THREE.Box3().setFromObject(wall);assert(Math.abs(bounds.max.x-10.25)<.01,'A 10 ft room must occupy 10 Scene units plus half-wall thickness.');
 const geometryIdentity=wall.geometry;cache.update(source,'floor');assert.equal(wall.geometry,geometryIdentity);assert.equal(existing.parent,world);assert.equal(existing.position.x,10);cache.dispose();assert.equal(existing.parent,world,'Architecture cleanup must retain the Model owner.');
 console.log('PASS: actual Project snapshot transaction and load roundtrip with existing Model, room/floor/door, owner guards, malformed/oversized input rejection, atomic failure, legacy Save preservation, pending-edit acknowledgment, safe merge/replace IDs and real Scene-unit geometry. No database connection.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
