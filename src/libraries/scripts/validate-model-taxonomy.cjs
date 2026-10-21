const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const {planModelTaxonomy,applyModelTaxonomy}=await import(pathToFileURL(path.join(__dirname,'model-taxonomy-core.ts')).href);
  const {suggestModelPath}=await import(pathToFileURL(path.join(__dirname,'model-taxonomy-rules.ts')).href);
  const snapshot={ownerId:'owner-a',capturedAt:'2026-10-21',categories:[
    {id:1,name:'ThreeDs',slug:'threeds',parentId:null,isActive:true,sortOrder:-100},
    {id:2,name:'Manual',slug:'manual',parentId:null,isActive:true,sortOrder:0}],models:[
    {id:7,modelName:'armchair2',modelType:'obj',legacyAssetName:'armchair2',primaryFileName:'armchair2.obj',categoryIds:[2]},
    {id:8,modelName:'Unknown artifact',modelType:'glb',legacyAssetName:null,primaryFileName:'mystery.glb',categoryIds:[]}]};
  const plan=planModelTaxonomy(snapshot),original=JSON.stringify(snapshot);
  assert(plan.models.every(m=>!m.approved));assert.equal(plan.models[1].categoryKeys.length,0);
  assert.equal(plan.categories.filter(c=>c.existingId===null).length,2);
  assert.equal(suggestModelPath({modelName:'SM Env Road GrassEdge 01'}).path.at(-1),'Terrain and Roads');
  assert.equal(suggestModelPath({modelName:'poolTable'}).path.at(-1),'Sports and Games');
  assert.equal(suggestModelPath({modelName:'SM Chr Attach Wheat 01'}).path.at(-1),'Character Attachments');
  assert.equal(suggestModelPath({modelName:'FX Wheat Location'}).path,null);
  assert.equal(suggestModelPath({modelName:'chair and table'}).path,null,'Ambiguous equal rank stays manual.');
  const cyclic=structuredClone(snapshot);cyclic.categories[0].parentId=2;cyclic.categories[1].parentId=1;
  assert.throws(()=>planModelTaxonomy(cyclic),/cycle/);
  const inactive=structuredClone(snapshot);inactive.categories[0].isActive=false;
  assert.equal(planModelTaxonomy(inactive).models[0].categoryKeys.length,0);
  function fixture(){
    const categories=structuredClone(snapshot.categories),events=[],writes=[];
    const model={id:7,userId:'owner-a',modelName:'armchair2',modelType:'obj',metadata:{legacyAssetName:'armchair2'},mainModelFileId:99,files:[{id:99,fileName:'armchair2.obj'}],categories:[categories[1]]};
    let owner='owner-a',next=10,failPost=false;
    const request=async(route,init={})=>{
      const method=init.method??'GET';let data;
      if(method==='GET'&&route==='/api/auth/session')return Response.json({user:{id:owner}});
      if(method==='GET'&&route==='/api/threed/model-categories')data=categories;
      else if(method==='GET'&&route==='/api/threed/models?id=7')data=model;
      else if(method==='POST'&&route==='/api/threed/model-categories'){
        assert.equal(events.at(-1).stage,'pending','Journal precedes a write.');
        writes.push({route,body:JSON.parse(init.body)});if(failPost)throw Error('Mock disconnected POST');
        data={id:next++,...JSON.parse(init.body)};categories.push(data);
      }else if(method==='PATCH'&&route==='/api/threed/models?id=7'){
        assert.equal(events.at(-1).stage,'pending');const body=JSON.parse(init.body);assert.deepEqual(Object.keys(body),['categoryIds']);
        writes.push({route,body});model.categories=body.categoryIds.map(id=>categories.find(c=>c.id===id));data=model;
      }else throw Error('Unexpected request '+method+' '+route);
      return Response.json({success:true,data});
    };
    return {request,events,writes,categories,model,journal:async event=>{events.push(event)},setOwner:value=>{owner=value},failPost:()=>{failPost=true}};
  }
  let f=fixture();await assert.rejects(applyModelTaxonomy(plan,f.request,f.journal),/explicitly approved/);assert.equal(f.writes.length,0);
  plan.models[0].approved=true;
  f=fixture();f.setOwner('owner-b');await assert.rejects(applyModelTaxonomy(plan,f.request,f.journal),/owner/);assert.equal(f.writes.length,0);
  f=fixture();f.model.categories=[];await assert.rejects(applyModelTaxonomy(plan,f.request,f.journal),/changed since snapshot/);assert.equal(f.writes.length,0);
  f=fixture();f.categories[0].sortOrder=100;await assert.rejects(applyModelTaxonomy(plan,f.request,f.journal),/taxonomy changed/);assert.equal(f.writes.length,0);
  f=fixture();const savedFiles=JSON.stringify(f.model.files),savedMetadata=JSON.stringify(f.model.metadata);
  assert.deepEqual(await applyModelTaxonomy(plan,f.request,f.journal),{updated:1,unchanged:0,approved:1});
  assert.deepEqual(f.model.categories.map(c=>c.id),[1,2,10,11]);
  assert.equal(f.categories.find(c=>c.name==='Furniture').parentId,1);
  assert.equal(f.categories.find(c=>c.name==='Seating').parentId,10);
  assert.equal(JSON.stringify(f.model.files),savedFiles);assert.equal(JSON.stringify(f.model.metadata),savedMetadata);
  const count=f.writes.length;assert.deepEqual(await applyModelTaxonomy(plan,f.request,f.journal),{updated:0,unchanged:1,approved:1});assert.equal(f.writes.length,count);
  const tampered=structuredClone(plan);tampered.models[0].categoryKeys=[];
  await assert.rejects(applyModelTaxonomy(tampered,f.request,f.journal),/Plan content changed/);
  f=fixture();f.failPost();await assert.rejects(applyModelTaxonomy(plan,f.request,f.journal),/disconnected/);assert.equal(f.writes.length,1);assert.equal(f.events.at(-1).stage,'needs-review');
  assert.equal(JSON.stringify(snapshot),original);
  console.log('PASS Model taxonomy: additive hierarchy/ancestor assignments, manual preservation, owner/stale/approval guards, ambiguity/FX exclusions, idempotence and pending-write journal (mocked Admin APIs).');
})().catch(error=>{console.error(error);process.exitCode=1});
