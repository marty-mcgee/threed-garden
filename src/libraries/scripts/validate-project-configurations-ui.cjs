// Actual Admin component callbacks with React/HTTP doubles; no browser/server/database.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache=new Map();
function load(file,overrides={}){
 file=path.resolve(file);if(!Object.keys(overrides).length&&cache.has(file))return cache.get(file);
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,
 {exports,console,Date,Error,TextEncoder,AbortController,fetch:(...args)=>transport(...args),window:{confirm:()=>false},require(name){if(name in overrides)return overrides[name];if(name.startsWith('.')||name.startsWith('@/')){let target=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name);if(!path.extname(target))target+='.ts';return load(target);}throw Error('Unexpected dependency '+name);}});
 if(!Object.keys(overrides).length)cache.set(file,exports);return exports;
}
let states=[],refs=[],cursor=0,refCursor=0,transport=()=>{throw Error('No mocked request expected');};
const jsx=(type,props)=>({type,props:props??{}});
const reactDouble={useState(initial){const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useRef(initial){return refs[refCursor++]??(refs[refCursor-1]={current:initial});},useEffect(){}};
const components=load('src/components/admin/projects/ProjectConfigurations.tsx',{
 react:reactDouble,
 'react/jsx-runtime':{jsx,jsxs:jsx},'next/link':{default:'link'},'lucide-react':Object.fromEntries(['Box','Settings2','Save','RotateCcw','Loader2','Layers'].map(key=>[key,key])),
 '@/components/ui/card':{Card:'card',CardContent:'content',CardHeader:'header',CardTitle:'title'},'@/components/ui/button':{Button:'button'},'@/components/ui/input':{Input:'input'},'@/components/project/ProjectMeasurementUnits':{ProjectMeasurementUnits:'units'},
});
const configCore=load('src/libraries/services/project/configuration.ts');
const view={version:1,savedAt:'2026-10-15T12:00:00.000Z',viewMode:'design',panelHeight:45,cameraMode:'stationary',threeD:{cameraPosition:{x:5,y:5,z:5},cameraTarget:{x:0,y:0,z:0},activeLayers:['models','designs'],availableLayers:['models','designs'],environment:'park',autoRotate:false,showGrid:false,showGizmo:false}};
const original={measurementUnits:'imperial',threeDViewState:view,threeDArchitecture:{retained:true},unrelated:{retained:true}};
const pageFile='src/app/admin/projects/[id]/page.tsx',pageAst=ts.createSourceFile(pageFile,fs.readFileSync(pageFile,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let saveSource;function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(pageAst)==='updateProject')saveSource=node.initializer.getText(pageAst);ts.forEachChild(node,visit);}visit(pageAst);assert(saveSource);
let savedProject;
const parent={session:{user:{id:'owner'}},projectId:16,projectScopeRef:{current:16},formData:{name:'Original Project',description:'Description',isPublic:false,isActive:true},
 setIsSubmitting(){},router:{push(){}},showToast(){},fetch:(...args)=>transport(...args),setProject:value=>savedProject=value,setFormData:fn=>parent.formData=fn(parent.formData),Error};
const saveProject=vm.runInNewContext(ts.transpileModule('('+saveSource+')',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,parent);
let resets=0;
let props={project:{id:16,config:original,metersPerSceneUnit:'.3048',headingDegrees:'0',originLatitude:null,originLongitude:null},disabled:false,onSaved(){},onCalibrate(){},details:null,detailsDirty:false,onReset(){resets++;},onSave:saveProject};
function render(){cursor=refCursor=0;return components.ProjectConfigurations(props);}
function all(node,predicate){if(Array.isArray(node))return node.flatMap(n=>all(n,predicate));if(!node||typeof node!=='object')return[];return [...(predicate(node)?[node]:[]),...all(node.props?.children,predicate)];}
function one(tree,predicate){const matches=all(tree,predicate);assert.equal(matches.length,1);return matches[0];}
const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(' '):node&&typeof node==='object'?text(node.props?.children):'';
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
(async()=>{
 let tree=render();assert(one(tree,n=>n.type==='link').props.href==='/dashboard/scene?projectId=16');
 one(tree,n=>n.type==='units').props.onChange('metric');tree=render();
 parent.formData={...parent.formData,name:'Renamed Project'};props.detailsDirty=true;tree=render();
 let finish,submitted;
 transport=(url,options)=>{assert.equal(url,'/api/project?id=16');submitted=JSON.parse(options.body);return new Promise(resolve=>finish=resolve);};
 one(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=render();
 assert.equal(all(tree,n=>n.type==='button'&&n.props.type==='submit').length,1,'One save control for Project details and configuration.');
 const gridLabel=one(tree,n=>n.type==='label'&&text(n).trim()==='Grid');
 all(gridLabel,n=>n.type==='input')[0].props.onChange({target:{checked:true}});
 const accepted={...original,...configCore.projectConfigurationPatch(original,submitted.configuration)};
 parent.formData={...parent.formData,name:'Edited during Save'};
 finish({ok:true,json:async()=>({success:true,data:{id:16,name:'Renamed Project',description:'Description',isPublic:false,isActive:true,config:accepted}})});await flush();tree=render();
 assert.equal(one(tree,n=>n.type==='units').props.value,'metric');
 assert(text(tree).includes('Unsaved Project changes'),'Edits made during Save remain dirty.');
 assert.equal(parent.formData.name,'Edited during Save');assert.equal(savedProject.name,'Renamed Project');
 assert.equal(submitted.name,'Renamed Project');assert.equal(submitted.description,'Description');
 assert.equal(all(one(tree,n=>n.type==='label'&&text(n).trim()==='Grid'),n=>n.type==='input')[0].props.checked,true);
 assert.deepEqual(submitted.configuration.changes,{measurementUnits:'metric'});
 transport=async(url,options)=>{submitted=JSON.parse(options.body);return {ok:false,json:async()=>({success:false,error:'Project settings changed in another window.'})};};
 one(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});await flush();tree=render();
 assert(text(tree).includes('Project settings changed in another window.'));assert(text(tree).includes('Unsaved Project changes'));
 assert.equal(parent.formData.name,'Edited during Save','Failed unified Save retains details too.');
 assert.equal(submitted.configuration.expected.measurementUnits,'metric');
 assert.equal(submitted.configuration.changes.threeD.showGrid,true);
 transport=()=>{throw Error('Cancel reload must not fetch or discard edits.');};
 one(tree,n=>n.type==='button'&&text(n).trim()==='Reload configuration').props.onClick();await flush();assert(text(render()).includes('Unsaved Project changes'));
 one(tree,n=>n.type==='button'&&text(n).trim()==='Reset changes').props.onClick();tree=render();assert.equal(resets,1);assert.equal(all(one(tree,n=>n.type==='label'&&text(n).trim()==='Grid'),n=>n.type==='input')[0].props.checked,false);
 states=[];refs=[];props={...props,detailsDirty:false,project:{...props.project,id:17,config:{unrelated:true}}};tree=render();
 assert.equal(one(tree,n=>n.type==='units').props.value,'imperial');assert(!text(tree).includes('Unsaved Project changes'));
 assert.equal(one(tree,n=>n.type==='link').props.href,'/dashboard/scene?projectId=17');
 assert(text(tree).includes('Save Project in the Scene once'));
 assert(one(tree,n=>n.type==='select'&&n.props['aria-label']==='Saved View Mode').props.value==='3d');
 props.detailsDirty=true;parent.projectId=parent.projectScopeRef.current=17;parent.formData={...parent.formData,name:'Details only'};tree=render();
 transport=async(url,options)=>{assert.equal(url,'/api/project?id=17');submitted=JSON.parse(options.body);return {ok:true,json:async()=>({success:true,data:{id:17,...parent.formData,config:{unrelated:true}}})};};
 one(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});await flush();
 assert.equal(submitted.name,'Details only');assert(!('configuration' in submitted),'Identity-only Save must not send an empty configuration patch.');
 console.log('PASS: one actual Project Save callback captures details/config together, retains pending/failed edits, resets both drafts, cancels Reload and isolates Projects. React/HTTP doubles only.');
 states=[];refs=[];props={...props,detailsDirty:false,project:{...props.project,id:null,config:{measurementUnits:'imperial'}}};tree=render();
 assert.equal(all(tree,n=>n.type==='link').length,0,'No Scene link may contain a nonexistent Project ID.');
 assert.equal(all(tree,n=>n.type==='button'&&text(n).trim()==='Reload configuration').length,0);
 assert.equal(one(tree,n=>n.type==='button'&&n.props.type==='submit').props.children.at(-1),'Create Project');
 assert(text(tree).includes('Coordinate calibration is available after creation'));

 const navigation=[];
 const newPage=load('src/app/admin/projects/new/page.tsx',{
  react:reactDouble,'react/jsx-runtime':{jsx,jsxs:jsx},'next/link':{default:'link'},'next/navigation':{useRouter:()=>({push:href=>navigation.push(href)})},'lucide-react':{FolderOpen:'folder'},
  '@/components/admin/projects/ProjectConfigurations':{ProjectConfigurations:'configuration'},'@/components/admin/projects/ProjectDetailsFields':{ProjectDetailsFields:'fields'},
  '@/components/ui/card':{Card:'card',CardContent:'content'},'@/components/ui/button':{Button:'button'},'@/components/ui/tabs':{Tabs:'tabs',TabsContent:'tab-content',TabsList:'tab-list',TabsTrigger:'tab'},'@/components/ui/toast':{useToast:()=>({showToast(){},ToastComponent:null})},
 });
 states=[];refs=[];
 const renderNew=()=>{cursor=refCursor=0;return newPage.default();};
 tree=renderNew();assert.equal(one(tree,n=>n.type==='link').props.href,'/admin/projects');
 let setup=one(tree,n=>n.type==='configuration').props;
 let fields=one(setup.details,n=>n.type==='fields').props;
 assert.equal(fields.value.isActive,true);assert.equal(fields.value.isPublic,false);assert.equal(setup.project.id,null);
 fields.onChange({name:'New Scene Project',description:'Shared Setup',isPublic:true,isActive:false});tree=renderNew();setup=one(tree,n=>n.type==='configuration').props;
 let attempts=0;
 transport=async(url,options)=>{attempts++;assert.equal(url,'/api/project');assert.equal(options.method,'POST');submitted=JSON.parse(options.body);return{ok:true,json:async()=>({success:true,data:{id:23,...submitted,config:{measurementUnits:submitted.measurementUnits}}})};};
 const created=await setup.onSave({expected:{savedAt:null,measurementUnits:'imperial'},changes:{measurementUnits:'metric'}},new AbortController().signal);
 assert.deepEqual(submitted,{name:'New Scene Project',description:'Shared Setup',isPublic:true,isActive:false,measurementUnits:'metric'});
 assert.equal(created.measurementUnits,'metric');assert.equal(navigation.at(-1),'/admin/projects/23');assert(!('threeDViewState' in submitted));assert(!('threeDArchitecture' in submitted));
 navigation.length=0;transport=async()=>({ok:false,json:async()=>({success:false,error:'Mock create failure'})});
 await assert.rejects(setup.onSave(undefined,new AbortController().signal),/Mock create failure/);
 tree=renderNew();setup=one(tree,n=>n.type==='configuration').props;fields=one(setup.details,n=>n.type==='fields').props;
 assert.equal(fields.value.name,'New Scene Project');assert.equal(fields.value.isActive,false);assert.equal(navigation.length,0);
 setup.onReset();tree=renderNew();setup=one(tree,n=>n.type==='configuration').props;fields=one(setup.details,n=>n.type==='fields').props;assert.equal(fields.value.name,'');assert.equal(fields.value.isActive,true);
 fields.onChange({...fields.value,name:'   '});tree=renderNew();setup=one(tree,n=>n.type==='configuration').props;
 await assert.rejects(setup.onSave(undefined,new AbortController().signal),/name is required/);assert.equal(attempts,1);
 console.log('PASS: shared New Setup fields/actions, create-only POST payload/redirect, no fabricated Scene state, reset, validation and failed-create draft retention.');
})().catch(error=>{console.error(error);process.exitCode=1;});
