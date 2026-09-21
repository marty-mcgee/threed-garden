const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('src/components/admin/threed/models/ThreeDModelFilesCRUD.tsx','utf8');
const start=source.indexOf('  const saveSharedRequirement =');
const end=source.indexOf('\n  // ===',start);
const code=ts.transpileModule(source.slice(start,end)+'\nsaveSharedRequirement(requirement, texture);',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
(async()=>{
 let saved,refreshes=0;
 await vm.runInNewContext(code,{
  modelId:939,linkingTexture:null,
  requirement:{relativePath:'PolygonNature.png',fileName:'PolygonNature.png'},
  texture:{id:21,fileName:'PolygonNature_01.png'},
  attachmentDirectoryProblem:()=>null,attachmentRelativePath:(dir,name)=>`${dir}/${name}`,
  setLinkingTexture:()=>{},showToast:()=>{},
  loadFiles:async()=>{refreshes++},loadDependencies:async()=>{refreshes++},loadModels:async()=>{refreshes++},
  fetch:async(url,options)=>{assert.equal(url,'/api/threed/models/files');saved=JSON.parse(options.body);return {ok:true,json:async()=>({success:true})};}
 });
 assert.deepEqual(saved,{modelId:939,textureId:21,relativePath:'textures/PolygonNature.png'});
 assert.equal(refreshes,3);
 console.log('PASS explicit shared Texture keeps required filename alias and refreshes saved audit without uploading');
})().catch(error=>{console.error(error);process.exitCode=1});
