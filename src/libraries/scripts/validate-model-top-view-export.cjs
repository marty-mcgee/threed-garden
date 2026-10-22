// Actual export save handler and Three.js camera math; all uploads/persistence mocked.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const THREE=require('three');
function declaration(file,name){const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found;function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text===name)found=n;ts.forEachChild(n,visit)}visit(ast);assert(found,name);return found.getText(ast).replace(/^export /,'');}
const previewFile='src/components/admin/threed/models/ThreeDModelAssetPreview.tsx';
const cameraContext={Vector3:THREE.Vector3};vm.createContext(cameraContext);vm.runInContext(ts.transpileModule(declaration(previewFile,'frameTopViewCamera')+'\nglobalThis.frame=frameTopViewCamera;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,cameraContext);
for(const [min,max] of [[[2,-4,7],[10,13,10]],[[-100,0,-20],[-99,0,30]]]){
 const box=new THREE.Box3(new THREE.Vector3(...min),new THREE.Vector3(...max)),camera=new THREE.OrthographicCamera();cameraContext.frame(camera,box);
 const center=box.getCenter(new THREE.Vector3()),p=(x,z)=>new THREE.Vector3(x,center.y,z).project(camera);
 assert(Math.abs(p(min[0],min[2]).x+1)<1e-8);assert(Math.abs(p(max[0],max[2]).x-1)<1e-8);
 assert(Math.abs(p(min[0],min[2]).y-1)<1e-8);assert(Math.abs(p(max[0],max[2]).y+1)<1e-8);
 for(const y of [min[1],max[1]])assert(Math.abs(new THREE.Vector3(center.x,y,center.z).project(camera).z)<1);
}
const exportFile='src/components/admin/threed/models/ModelPreviewImageExport.tsx',handler=ts.transpileModule(declaration(exportFile,'savePreview')+'\nglobalThis.save=savePreview;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(topView=true,draft=false,id=15){const calls=[],changes=[],ctx={topView,model:{id},fileName:`model-${id}-${topView?'top-view':'preview'}.png`,imageLabel:topView?'Top View':'Library Preview',image:new Blob(['png'],{type:'image/png'}),uploadedUrl:{current:null},busy:{current:false},saved:false,error:'',saving:false,FormData,Error,JSON,onUseImageUrl:draft?url=>changes.push(url):undefined,setSaving:v=>ctx.saving=v,setSaved:v=>ctx.saved=v,setError:v=>ctx.error=v,fetch:async(url,options)=>{calls.push({url,options});if(ctx.failUpload&&options.method==='POST')return {ok:false,json:async()=>({success:false})};if(ctx.failAssign&&options.method==='PATCH')return {ok:false,json:async()=>({success:false})};return {ok:true,json:async()=>({success:true,data:{url:'https://fixture.invalid/image.png',fileId:99}})};}};vm.createContext(ctx);vm.runInContext(handler,ctx);return{ctx,calls,changes};}
(async()=>{
 for(const top of [false,true]){const f=fixture(top);await Promise.all([f.ctx.save(),f.ctx.save()]);assert.equal(f.calls.length,2);assert.equal(f.calls[0].url,top?'/api/threed/models/15/top-view-image':'/api/threed/models/upload');assert.equal(f.calls[0].options.body.get('purpose'),top?null:'thumbnail');assert.deepEqual(JSON.parse(f.calls[1].options.body),{[top?'imageTopViewUrl':'thumbnailUrl']:'https://fixture.invalid/image.png'});assert(f.ctx.saved);assert(!f.ctx.busy.current);}
 let f=fixture(true,true);await f.ctx.save();assert.equal(f.calls.length,1);assert.deepEqual(f.changes,['https://fixture.invalid/image.png']);
 f=fixture();f.ctx.failAssign=true;await f.ctx.save();assert(!f.ctx.saved);assert(f.ctx.error.includes('assigning'));f.ctx.failAssign=false;await f.ctx.save();assert.equal(f.calls.filter(c=>c.options.method==='POST').length,1);assert(f.ctx.saved);
 f=fixture();f.ctx.failUpload=true;await f.ctx.save();assert.equal(f.calls.length,1);assert(!f.ctx.saved);assert.equal(f.ctx.uploadedUrl.current,null);
 f=fixture(true,false,0);await f.ctx.save();assert.equal(f.calls.length,0);assert(f.ctx.error.includes('Create the Model'));
 const source=fs.readFileSync(previewFile,'utf8');assert(source.includes('orthographic={topViewCapture}'));assert(source.includes('topViewCapture={topViewCapture}'));assert(source.includes('!(perspective || topViewCapture) || fittedCameraKey === cameraKey'));
 for(const file of ['ThreeDModelsCRUD.tsx','ThreeDModelFilesCRUD.tsx'])assert(fs.readFileSync('src/components/admin/threed/models/'+file,'utf8').includes('imageTarget="top-view"'));
 console.log('PASS: exact orthographic footprint/negative-Z-up camera, thumbnail and top-view export paths, owned attachment endpoint, name-only image field assignment, form drafts, duplicate-save guard, upload reuse after assignment failure and failed upload handling (mocked persistence).');
})().catch(e=>{console.error(e);process.exitCode=1});
