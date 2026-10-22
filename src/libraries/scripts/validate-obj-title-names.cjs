const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const {titleDesignModelName,planObjTitleNames,applyObjTitleNames}=await import(pathToFileURL(path.join(__dirname,'obj-model-title-names-core.ts')).href);
 for(const [before,after] of [["Design: Table with tablecloth","Design: Table With Tablecloth"],["Design: TV shelf unit","Design: TV Shelf Unit"],["Design: Child's low-table 01","Design: Child's Low-Table 01"],["Design: Tree 1 w leaves","Design: Tree 1 W Leaves"]]){assert.equal(titleDesignModelName(before),after);assert.equal(titleDesignModelName(after),after);}
 assert.throws(()=>titleDesignModelName('Synty: Prop'),/prefix/);assert.throws(()=>titleDesignModelName('Design: '),/empty/);assert.throws(()=>titleDesignModelName('Design: '+ 'x'.repeat(250)),/255/);
 const snapshot={ownerId:'owner-a',models:[{id:1,modelName:'Design: Table with tablecloth',modelType:'obj',mainModelFileId:11,primaryFileName:'table.obj'},{id:2,modelName:'Design: TV shelf unit',modelType:'obj',mainModelFileId:12,primaryFileName:'tv.OBJ'},{id:3,modelName:'Synty: SM Prop',modelType:'fbx',mainModelFileId:13,primaryFileName:'prop.fbx'},{id:4,modelName:'Design: Non obj name',modelType:'procedural',mainModelFileId:null,primaryFileName:null},{id:5,modelName:'Unprefixed obj',modelType:'obj',mainModelFileId:15,primaryFileName:'extra.obj'}]};
 const original=JSON.stringify(snapshot),plan=planObjTitleNames(snapshot);assert.equal(plan.changes.length,2);assert.equal(plan.collisions.length,0);
 const colliding=structuredClone(snapshot);colliding.models[0].modelName='Design: '+String.fromCharCode(223)+' chair';colliding.models[1].modelName='Design: SS chair';assert.equal(planObjTitleNames(colliding).collisions.length,1);
 const duplicates=structuredClone(snapshot);duplicates.models[1].modelName=duplicates.models[0].modelName;assert.equal(planObjTitleNames(duplicates).existingDuplicates.length,1);
 function fixture(){let owner='owner-a',fail=false;const writes=[],events=[],models=snapshot.models.map(m=>({...m,userId:'owner-a',files:m.mainModelFileId?[{id:m.mainModelFileId,fileName:m.primaryFileName,fileType:'model'}]:[],categories:[{id:99}],metadata:{retained:true}}));
  const request=async(route,init={})=>{if(route==='/api/auth/session')return Response.json({user:{id:owner}});const id=Number(new URL(route,'http://offline').searchParams.get('id')),model=models.find(m=>m.id===id);assert(model);if(init.method==='PATCH'){assert.equal(events.at(-1).stage,'pending');const body=JSON.parse(init.body);assert.deepEqual(Object.keys(body),['modelName']);writes.push({id,body});if(fail)throw Error('Mock disconnect');model.modelName=body.modelName;}return Response.json({success:true,data:model});};
  return {request,models,writes,events,journal:async e=>{events.push(e)},owner:value=>{owner=value},fail:()=>{fail=true}};
 }
 let f=fixture();f.owner('owner-b');await assert.rejects(applyObjTitleNames(plan,f.request,f.journal),/owner mismatch/);assert.equal(f.writes.length,0);
 f=fixture();f.models[1].modelName='Manual edit';await assert.rejects(applyObjTitleNames(plan,f.request,f.journal),/name changed/);assert.equal(f.writes.length,0,'All rows preflight before writes.');
 f=fixture();const protectedRows=f.models.map(m=>({files:structuredClone(m.files),categories:structuredClone(m.categories),metadata:structuredClone(m.metadata)}));
 assert.deepEqual(await applyObjTitleNames(plan,f.request,f.journal),{updated:2,alreadyNamed:0});assert.equal(f.models[2].modelName,'Synty: SM Prop');
 assert.deepEqual(await applyObjTitleNames(plan,f.request,f.journal),{updated:0,alreadyNamed:2});assert.equal(f.writes.length,2);
 f.models.forEach((m,i)=>assert.deepEqual({files:m.files,categories:m.categories,metadata:m.metadata},protectedRows[i]));
 const edited=structuredClone(plan);edited.changes[0].after='Unexpected';await assert.rejects(applyObjTitleNames(edited,f.request,f.journal),/changed rename plan/);
 f=fixture();f.fail();await assert.rejects(applyObjTitleNames(plan,f.request,f.journal),/disconnect/);assert.equal(f.events.at(-1).stage,'needs-review');assert.equal(f.writes.length,1);
 assert.equal(JSON.stringify(snapshot),original);
 console.log('PASS Design OBJ Title Case: scope, acronyms/apostrophes, idempotence, collisions, length, owner/stale guards and journaled name-only updates (mocked API).');
})().catch(e=>{console.error(e);process.exitCode=1;});
