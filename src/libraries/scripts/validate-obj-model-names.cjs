const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const {designModelName,planObjModelNames,applyObjModelNames}=await import(pathToFileURL(path.join(__dirname,'obj-model-names-core.ts')).href);
 for(const [before,after] of [['armchair2','Design: Armchair 2'],['tableWithTablecloth','Design: Table with tablecloth'],['Couch: Large 1','Design: Couch: large 1'],['tvShelfUnit','Design: TV shelf unit'],['door_small_01','Design: Door small 01'],['Design: Design: Armchair 2','Design: Armchair 2']]){assert.equal(designModelName(before),after);assert.equal(designModelName(after),after);}
 assert.throws(()=>designModelName('Design: '),/empty/);assert.throws(()=>designModelName('a'.repeat(255)),/255/);
 const snapshot={ownerId:'owner-a',models:[{id:1,modelName:'armchair2',modelType:'obj',mainModelFileId:11,primaryFileName:'armchair2.obj'},{id:2,modelName:'Couch: Large 1',modelType:'obj',mainModelFileId:12,primaryFileName:'largeCouch.OBJ'},{id:3,modelName:'SK Farmer',modelType:'fbx',mainModelFileId:13,primaryFileName:'farmer.fbx'},{id:4,modelName:'sphere',modelType:'procedural',mainModelFileId:null,primaryFileName:null}]};
 const original=JSON.stringify(snapshot),plan=planObjModelNames(snapshot);assert.equal(plan.changes.length,2);assert.equal(plan.collisions.length,0);
 const colliding=structuredClone(snapshot);colliding.models[1].modelName='armchair 2';assert.equal(planObjModelNames(colliding).collisions.length,1);
 const duplicates=structuredClone(snapshot);duplicates.models[1].modelName='armchair2';const duplicatePlan=planObjModelNames(duplicates);assert.equal(duplicatePlan.collisions.length,0);assert.equal(duplicatePlan.existingDuplicates.length,1);assert.equal(duplicatePlan.changes.length,2);
 function fixture(){let owner='owner-a',fail=false;const writes=[],events=[],models=snapshot.models.map(m=>({...m,userId:'owner-a',files:m.mainModelFileId?[{id:m.mainModelFileId,fileName:m.primaryFileName,fileType:'model'}]:[],categories:[{id:99}],metadata:{retained:true}}));
  const request=async(route,init={})=>{if(route==='/api/auth/session')return Response.json({user:{id:owner}});const id=Number(new URL(route,'http://offline').searchParams.get('id')),model=models.find(m=>m.id===id);assert(model);if(init.method==='PATCH'){assert.equal(events.at(-1).stage,'pending');const body=JSON.parse(init.body);assert.deepEqual(Object.keys(body),['modelName']);writes.push({id,body});if(fail)throw Error('Mock disconnect');model.modelName=body.modelName;}return Response.json({success:true,data:model});};
  return {request,models,writes,events,journal:async e=>{events.push(e)},owner:value=>{owner=value},fail:()=>{fail=true}};
 }
 let f=fixture();f.owner('owner-b');await assert.rejects(applyObjModelNames(plan,f.request,f.journal),/owner mismatch/);assert.equal(f.writes.length,0);
 f=fixture();f.models[1].modelName='Manual edit';await assert.rejects(applyObjModelNames(plan,f.request,f.journal),/name changed/);assert.equal(f.writes.length,0,'All rows preflight before writes.');
 f=fixture();const protectedRows=f.models.map(m=>({files:structuredClone(m.files),categories:structuredClone(m.categories),metadata:structuredClone(m.metadata)}));
 assert.deepEqual(await applyObjModelNames(plan,f.request,f.journal),{updated:2,alreadyNamed:0});assert.equal(f.models[2].modelName,'SK Farmer');
 assert.deepEqual(await applyObjModelNames(plan,f.request,f.journal),{updated:0,alreadyNamed:2});assert.equal(f.writes.length,2);
 f.models.forEach((m,i)=>assert.deepEqual({files:m.files,categories:m.categories,metadata:m.metadata},protectedRows[i]));
 const edited=structuredClone(plan);edited.changes[0].after='Unexpected';await assert.rejects(applyObjModelNames(edited,f.request,f.journal),/changed rename plan/);
 f=fixture();f.fail();await assert.rejects(applyObjModelNames(plan,f.request,f.journal),/disconnect/);assert.equal(f.events.at(-1).stage,'needs-review');assert.equal(f.writes.length,1);
 assert.equal(JSON.stringify(snapshot),original);
 console.log('PASS OBJ Model naming: sentence case/punctuation/numeric variants, single prefix, acronym retention, OBJ primary scope, collisions/length, owner/stale guards, name-only PATCH and journal errors (mocked API).');
})().catch(e=>{console.error(e);process.exitCode=1;});
