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
(async()=>{
 await context.actions.save(event);let payload=JSON.parse(calls.at(-1).options.body);assert.equal(calls.at(-1).options.method,'POST');assert.equal(payload.title,'Independent lyrics');for(const kind of ['projectIds','albumIds','trackIds'])assert.equal(payload[kind].length,0);assert.equal(open,false);
 open=true;id=7;form={...form,projects:[{id:17,title:'Project'}],albums:[{id:28,title:'Album'}],tracks:[{id:9,title:'Track'}]};mode='fail';const before=JSON.stringify(form);await context.actions.save(event);payload=JSON.parse(calls.at(-1).options.body);assert.equal(payload.id,7);assert.equal(payload.projectIds[0],17);assert.equal(payload.albumIds[0],28);assert.equal(payload.trackIds[0],9);assert.equal(error,'fixture rejection');assert.equal(open,true);assert.equal(JSON.stringify(form),before);
 const count=calls.length;form.metadata='not json';await context.actions.save(event);assert.equal(calls.length,count);assert(error.includes('valid JSON'));
 form.metadata='{}';mode='gate';const pending=context.actions.save(event);await context.actions.save(event);assert.equal(calls.length,count+1,'Double Save sends once');context.actions.close(false);assert.equal(open,true,'Busy close is blocked');gate();await pending;
 open=true;context.actions.close(false);assert.equal(open,true,'Dirty discard requires confirmation');
 busy=false;mode='gate';const stale=context.actions.edit(9);assert.equal(reading,true);context.actions.close(false);assert.equal(open,false);gate();await stale;assert.equal(form.title,'','Cancelled read cannot replace the draft');
 mode='fail';await context.actions.edit(9);assert.equal(readFailed,true);const savedCalls=calls.length;await context.actions.save(event);assert.equal(calls.length,savedCalls,'Failed detail read cannot overwrite a record');
 console.log('PASS: actual Lyrics dialog Save/create/update payloads, optional associations, failure draft retention, duplicate/busy guards, dirty discard and cancelled/failed reads (mocked UI/network).');
})().catch(error=>{console.error(error);process.exitCode=1});
