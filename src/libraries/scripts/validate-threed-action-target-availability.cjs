const fs=require('fs'),ts=require(process.cwd()+'/node_modules/typescript'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('src/app/dashboard/scene/page.tsx','utf8');
const start=source.indexOf('    if (!actionTarget || loading) return;');
const end=source.indexOf('\n  }, [',start);
const code=ts.transpileModule('(function(){'+source.slice(start,end)+'})()', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function check(markers,expected){let cleared=false;vm.runInNewContext(code,{
 actionTarget:{markerId:'models-instance-2834',type:'models',id:2834,name:'Tractor'},loading:false,
 data:{threed:{raw:{models:[{id:935}]}}},
 buildThreeDRuntimeMarkerResult:()=>({markers}),
 isMatchingThreeDActionTarget:(a,b)=>a.type===b.markerType&&a.id===b.assetId,
 setActionTarget:()=>{cleared=true},setOrchestrationStatus:()=>{},showToastRef:{current:()=>{}}
 });assert.equal(cleared,expected);}
check([{id:'models-instance-2834',type:'models',data:{id:2834}}],false);
check([{id:'models-instance-2835',type:'models',data:{id:2835}}],true);
check([],true);
console.log('PASS actual target availability effect preserves Model instance and clears removed instance');
