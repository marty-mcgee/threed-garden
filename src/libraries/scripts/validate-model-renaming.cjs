const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const {syntyModelName,planSyntyModelNames,applySyntyModelNames}=await import(pathToFileURL(path.join(__dirname,'model-renaming-core.ts')).href);
 for(const [before,after] of [['SM Prop Chair 01','Synty: Prop Chair 01'],['SM_Prop_Chair','Synty: Prop_Chair'],['SM: Tree','Synty: Tree'],['Small chair','Small chair'],['SMITH','SMITH'],['Chair SM 01','Chair SM 01'],['sm Tree','sm Tree'],['Synty: Prop Chair 01','Synty: Prop Chair 01']]){assert.equal(syntyModelName(before),after);assert.equal(syntyModelName(after),after);}
 assert.throws(()=>syntyModelName('SM'),/empty/);assert.throws(()=>syntyModelName('SM '+ 'a'.repeat(250)),/255/);
 const snapshot={ownerId:'owner-a',models:[{id:1,modelName:'SM Prop Chair 01',modelType:'obj',mainModelFileId:11,primaryFileName:'armchair2.obj'},{id:2,modelName:'SM Tree 02',modelType:'fbx',mainModelFileId:12,primaryFileName:'tree.FBX'},{id:3,modelName:'SK Farmer',modelType:'fbx',mainModelFileId:13,primaryFileName:'farmer.fbx'},{id:4,modelName:'sphere',modelType:'procedural',mainModelFileId:null,primaryFileName:null}]};
 const master=await import(pathToFileURL(path.join(__dirname,'model-renaming-core.ts')).href);assert.equal(master.planObjModelNames(snapshot).prefix,'Design: ');
 const original=JSON.stringify(snapshot),plan=planSyntyModelNames(snapshot);assert.equal(plan.changes.length,2);assert.equal(plan.collisions.length,0);
 const missing=structuredClone(snapshot);missing.models[0].mainModelFileId=null;assert.throws(()=>planSyntyModelNames(missing),/primary File ID/i);
 const repeated=structuredClone(snapshot);repeated.models[0].id=repeated.models[1].id;assert.throws(()=>planSyntyModelNames(repeated),/duplicate Model ID/);
 const colliding=structuredClone(snapshot);colliding.models[1].modelName='Synty: Prop Chair 01';assert.equal(planSyntyModelNames(colliding).collisions.length,1);
 const duplicates=structuredClone(snapshot);duplicates.models[1].modelName='SM Prop Chair 01';const duplicatePlan=planSyntyModelNames(duplicates);assert.equal(duplicatePlan.collisions.length,0);assert.equal(duplicatePlan.existingDuplicates.length,1);assert.equal(duplicatePlan.changes.length,2);
 function fixture(){let owner='owner-a',fail=false;const writes=[],events=[],models=snapshot.models.map(m=>({...m,userId:'owner-a',files:m.mainModelFileId?[{id:m.mainModelFileId,fileName:m.primaryFileName,fileType:'model'}]:[],categories:[{id:99}],metadata:{retained:true}}));
  const request=async(route,init={})=>{if(route==='/api/auth/session')return Response.json({user:{id:owner}});const id=Number(new URL(route,'http://offline').searchParams.get('id')),model=models.find(m=>m.id===id);assert(model);if(init.method==='PATCH'){assert.equal(events.at(-1).stage,'pending');const body=JSON.parse(init.body);assert.deepEqual(Object.keys(body),['modelName']);writes.push({id,body});if(fail)throw Error('Mock disconnect');model.modelName=body.modelName;}return Response.json({success:true,data:model});};
  return {request,models,writes,events,journal:async e=>{events.push(e)},owner:value=>{owner=value},fail:()=>{fail=true}};
 }
 let f=fixture();f.owner('owner-b');await assert.rejects(applySyntyModelNames(plan,f.request,f.journal),/owner mismatch/);assert.equal(f.writes.length,0);
 f=fixture();f.models[1].files[0].fileName='replacement.fbx';await assert.rejects(applySyntyModelNames(plan,f.request,f.journal),/identity changed/);assert.equal(f.writes.length,0);
 f=fixture();f.models[1].modelName='Manual edit';await assert.rejects(applySyntyModelNames(plan,f.request,f.journal),/name changed/);assert.equal(f.writes.length,0,'All rows preflight before writes.');
 f=fixture();const protectedRows=f.models.map(m=>({files:structuredClone(m.files),categories:structuredClone(m.categories),metadata:structuredClone(m.metadata)}));
 assert.deepEqual(await applySyntyModelNames(plan,f.request,f.journal),{updated:2,alreadyNamed:0});assert.equal(f.models[2].modelName,'SK Farmer');
 assert.deepEqual(await applySyntyModelNames(plan,f.request,f.journal),{updated:0,alreadyNamed:2});assert.equal(f.writes.length,2);
 f.models.forEach((m,i)=>assert.deepEqual({files:m.files,categories:m.categories,metadata:m.metadata},protectedRows[i]));
 const edited=structuredClone(plan);edited.changes[0].after='Unexpected';await assert.rejects(applySyntyModelNames(edited,f.request,f.journal),/changed rename plan/);
 f=fixture();f.fail();await assert.rejects(applySyntyModelNames(plan,f.request,f.journal),/disconnect/);assert.equal(f.events.at(-1).stage,'needs-review');assert.equal(f.writes.length,1);
 f=fixture();await assert.rejects(applySyntyModelNames(plan,f.request,async()=>{throw Error('Journal unavailable')}),/Journal unavailable/);assert.equal(f.writes.length,0);
 const finished=structuredClone(snapshot);finished.models.forEach(m=>{const c=plan.changes.find(c=>c.id===m.id);if(c)m.modelName=c.after});assert.equal(planSyntyModelNames(finished).changes.length,0);
 assert.equal(JSON.stringify(snapshot),original);
 console.log('PASS Model renaming: leading SM token only, remainder preservation, idempotence, collisions/length, owner/stale guards, name-only PATCH and journal errors (mocked API).');
})().catch(e=>{console.error(e);process.exitCode=1;});
