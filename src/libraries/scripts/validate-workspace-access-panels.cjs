// No browser, renderer, database or device writes: execute panel JSX with mocked boundaries.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const names=['ThreeDModelLibraryPanel','ThreeDFarmBotLibraryPanel','ThreeDBedPlacementPanel','ThreeDPlantingPlacementPanel'];
const jsx=(type,props)=>({type,props});
const page=fs.readFileSync('src/app/dashboard/scene/page.tsx','utf8');
for(const name of names){
 const exports={};
 const source=fs.readFileSync('src/components/map/panels/'+name+'.tsx','utf8');
 const deps={
  'react/jsx-runtime':{jsx,jsxs:jsx},
  'react-dom':{createPortal:(child,host)=>({child,host})},
 };
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:key=>deps[key]??new Proxy({},{get:(_,key)=>String(key)})});
 const props={isOpen:true,projectModules:[],characters:[],farmBots:[],plants:[],beds:[],collections:[],visibleModels:[],placedFarmBotIds:new Set(),draft:{},placementDraft:{},placementScaleMultiplier:'1',viewMode:'design'};
 const host={};
 // Model Library now returns its Library surface beside a separate placement overlay.
 const surface=result=>name==='ThreeDModelLibraryPanel'?result.props.children[0]:result;
 const floating=surface(exports[name](props));
 assert.equal(floating.props.style,undefined);
 const docked=surface(exports[name]({...props,dockHost:host}));
 assert.equal(docked.host,host);
 assert.equal(docked.child.props.style.height,'100%');
 assert.equal(docked.child.props.style.width,'100%');
 assert.equal(docked.child.props.style.left,0);
 assert.equal(docked.child.props.style.position,'relative');
 assert(docked.child.props.className.includes('threed-scene-sidebar-size'));
 assert(docked.child.props.className.includes('overflow-y-auto'));
 assert(docked.child.props.className.includes('[&>*]:shrink-0'));
 assert.equal(exports[name]({...props,isOpen:false,dockHost:host}),null);
 assert(page.includes('<'+name+"\n        dockHost={viewMode === 'design' ? designAssetsHost : null}"),name+' must use the existing Design host');
}
console.log('PASS: four access panels dock, preserve floating mode, scroll their complete forms, use shared width, and close cleanly.');

// Exercise workspace offsets without mounting a map or starting ResizeObserver.
const workspaceExports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/threed/design/DesignWorkspace.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports:workspaceExports,
 require:key=>key==='react'?{useEffect:()=>{},useRef:()=>({current:null}),useState:value=>[value,()=>{}]}:key==='react/jsx-runtime'?{jsx,jsxs:jsx}:{ScenePanelDivider:'Divider'}
});
for(const mode of ['design','2d','combined','3d']) {
 const result=workspaceExports.DesignWorkspace({active:mode==='design',reserveToolbar:mode==='2d',children:'scene',editor:'editor'});
 assert.equal(result.props.style.top,mode==='design'||mode==='2d'?38:0);
}
assert(page.includes("reserveToolbar={viewMode === '2d'}"));
assert(page.includes('className="relative isolate min-h-0 flex-1"'), 'Leaflet must stay below Project overlays');
console.log('PASS: 2D/Design reserve toolbar height; 3D/Combined offsets preserved; 2D map stacking isolated.');
