const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const file='src/components/admin/multimedia/lyrics/MultimediaLyricsCRUD.tsx',source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,99,true,4);
const functions={};function scan(n){if(ts.isFunctionDeclaration(n)&&['save','edit','close'].includes(n.name?.text))functions[n.name.text]=n.getText(ast);ts.forEachChild(n,scan)}scan(ast);
const blank=()=>({title:'',content:'',sortOrder:'0',isActive:true,metadata:'{}',projects:[],albums:[],tracks:[]});
let form={...blank(),title:'Independent lyrics'},open=true,error='',notice='',busy=false,reading=false,readFailed=false,id=null,calls=[],mode='ok',gate;
const baseline={current:JSON.stringify(blank())},token={current:0},saving={current:false};
const context={JSON,Number,String,Error,blank,baseline,token,saving,window:{confirm:()=>false},records:{reload(){notice+=' reloaded'}},setForm:v=>form=typeof v==='function'?v(form):v,setId:v=>id=v,setError:v=>error=v,setNotice:v=>notice=v,setReadFailed:v=>readFailed=v,setOpen:v=>open=v,setReading:v=>reading=v,setBusy:v=>busy=v,
fetch:async(url,options)=>{calls.push({url,options});if(mode==='gate')await new Promise(resolve=>gate=resolve);return{ok:mode!=='fail',json:async()=>mode==='fail'?{error:'fixture rejection'}:{data:{id:7,title:'Loaded',content:'Saved text',sortOrder:0,isActive:true,metadata:{},projects:[],albums:[],tracks:[]}}}}};
for(const field of ['form','id','reading','readFailed','busy'])Object.defineProperty(context,field,{get:()=>({form,id,reading,readFailed,busy})[field]});Object.defineProperty(context,'workspace',{get:()=>({busy})});
vm.createContext(context);vm.runInContext(ts.transpileModule(Object.values(functions).join('\n')+'\nglobalThis.actions={save,edit,close};',{compilerOptions:{target:99}}).outputText,context);
const event={preventDefault(){}};
function checkAssignmentColumns() {
 const jsx=(type,props,key)=>({type,props:props||{},key}), runtime={jsx,jsxs:jsx,Fragment:'Fragment'};
 const ui=new Proxy({}, {get:(_,name)=>name});
 const react={useRef:value=>({current:value}),useState:initial=>[typeof initial==='function'?initial():initial,()=>{}]};
 const workspace={rows:[],total:0,page:0,size:25,selected:new Set(),loading:false,busy:false,sort:'sortOrder',direction:'asc',sortChange:field=>sorts.push(field)};
 const sorts=[];
 const load=(file,imports)=>{
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
   exports,require:name=>{
    if(name in imports)return imports[name];
    if(name==='@/components/settings/ModuleAppearanceProvider')return {ModuleIcon:'module-icon'};
    if(name==='react')return react;
    if(name==='react/jsx-runtime')return runtime;
    if(name==='lucide-react'||name.startsWith('@/components/ui/'))return ui;
    throw Error(`Unexpected dependency: ${name}`);
   },
  },{filename:file});
  return exports;
 };
 const nodes=node=>Array.isArray(node)?node.flatMap(nodes):node&&typeof node==='object'?[node,...nodes(node.props?.children)]:[];
 const text=node=>Array.isArray(node)?node.map(text).join(''):node==null||node===false?'':typeof node==='object'?text(node.props?.children):String(node);
 const component=load(file,{
  'next/link':{default:'Link'},
  'next-auth/react':{useSession:()=>({data:{user:{id:'owner'}}})},
  '../shared/MultimediaWorkspaceHeader':{MultimediaWorkspaceHeader:'Header'},
  '../shared/MultimediaRecordsWorkspace':{useMultimediaRecords:()=>workspace,MultimediaRecordsTable:'RecordsTable',MultimediaRecordsSearch:'Search',MultimediaStatus:'Status'},
  './LyricsAssignmentPicker':{LyricsAssignmentPicker:'Picker'},
  '@/libraries/services/multimedia/lyrics-input':{LYRICS_CONTENT_LIMIT:100000},
 }).MultimediaLyricsCRUD;
 const keyed=component(), list=nodes(keyed.type(keyed.props)).find(node=>node.type==='RecordsTable');
 assert.deepEqual(Array.from(list.props.columns,column=>column.label),['Title','Albums','Tracks','Projects','Sort Order','Active','Updated']);
 for(const field of ['albums','tracks','projects']){
  const column=list.props.columns.find(column=>column.field===field);
  assert.equal(column.sortable,false,'Assignment columns do not send unsupported sort fields');
  assert.equal(text(column.render({id:7,[field]:[]})),'—');
  const cell=column.render({id:7,[field]:[{id:11,title:'First assigned name'},{id:12,title:'<b>Second assigned name</b>'}]});
  const badges=nodes(cell).filter(node=>node.type==='Badge');
  assert.deepEqual(badges.map(node=>[node.key,node.props.variant,text(node)]),[[11,'secondary','First assigned name'],[12,'secondary','<b>Second assigned name</b>']]);
  assert(badges.every(node=>!node.props.dangerouslySetInnerHTML),'Assignment names remain plain text');
  const basePath=field==='projects'?'/admin/projects':`/admin/multimedia/${field}`;
  assert(badges.every(node=>node.props.asChild),'Badges use the link as their interactive element');
  assert.deepEqual(nodes(cell).filter(node=>node.type==='Link').map(node=>node.props.href),[`${basePath}/11`,`${basePath}/12`]);
 }
 const shared=load('src/components/admin/multimedia/shared/MultimediaRecordsWorkspace.tsx',{'@/libraries/services/multimedia/ordering':{multimediaOrdering:()=>({sort:'sortOrder',direction:'asc'})}});
 const table=shared.MultimediaRecordsTable({...list.props,workspace});
 const headings=nodes(table).filter(node=>node.type==='TableHead');
 for(const label of ['Albums','Tracks','Projects']){
  const heading=headings.find(node=>text(node)===label);
  assert(heading);assert.equal(heading.props['aria-sort'],undefined);
  assert(!nodes(heading).some(node=>node.type==='button'),'Association heading has no sorting action');
 }
 const title=headings.find(node=>text(node)==='Title');
 nodes(title).find(node=>node.type==='button').props.onClick();
 assert.deepEqual(sorts,['title'],'Existing column sorting remains available');
 assert.equal(headings.find(node=>text(node)==='Sort Order').props['aria-sort'],'ascending');
 console.log('PASS: actual Lyrics assignment columns render multiple/empty plain-text badges; shared table retains existing sorting and omits unsupported assignment sorting (mocked render).');
}
(async()=>{
 checkAssignmentColumns();
 await context.actions.save(event);let payload=JSON.parse(calls.at(-1).options.body);assert.equal(calls.at(-1).options.method,'POST');assert.equal(payload.title,'Independent lyrics');for(const kind of ['projectIds','albumIds','trackIds'])assert.equal(payload[kind].length,0);assert.equal(open,false);
 open=true;id=7;form={...form,projects:[{id:17,title:'Project'}],albums:[{id:28,title:'Album'}],tracks:[{id:9,title:'Track'}]};mode='fail';const before=JSON.stringify(form);await context.actions.save(event);payload=JSON.parse(calls.at(-1).options.body);assert.equal(payload.id,7);assert.equal(payload.projectIds[0],17);assert.equal(payload.albumIds[0],28);assert.equal(payload.trackIds[0],9);assert.equal(error,'fixture rejection');assert.equal(open,true);assert.equal(JSON.stringify(form),before);
 const count=calls.length;form.metadata='not json';await context.actions.save(event);assert.equal(calls.length,count);assert(error.includes('valid JSON'));
 form.metadata='{}';mode='gate';const pending=context.actions.save(event);await context.actions.save(event);assert.equal(calls.length,count+1,'Double Save sends once');context.actions.close(false);assert.equal(open,true,'Busy close is blocked');gate();await pending;
 open=true;context.actions.close(false);assert.equal(open,true,'Dirty discard requires confirmation');
 busy=false;mode='gate';const stale=context.actions.edit(9);assert.equal(reading,true);context.actions.close(false);assert.equal(open,false);gate();await stale;assert.equal(form.title,'','Cancelled read cannot replace the draft');
 mode='fail';await context.actions.edit(9);assert.equal(readFailed,true);const savedCalls=calls.length;await context.actions.save(event);assert.equal(calls.length,savedCalls,'Failed detail read cannot overwrite a record');
 console.log('PASS: actual Lyrics dialog Save/create/update payloads, optional associations, failure draft retention, duplicate/busy guards, dirty discard and cancelled/failed reads (mocked UI/network).');
})().catch(error=>{console.error(error);process.exitCode=1});
