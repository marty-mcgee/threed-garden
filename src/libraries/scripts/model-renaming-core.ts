export interface ModelRenameModel { id:number; modelName:string; modelType:string; mainModelFileId:number|null; primaryFileName:string|null }
export interface ModelRenameSnapshot { ownerId:string; models:ModelRenameModel[] }
export interface ModelRenameChange { id:number; before:string; after:string; primaryId:number; primaryFileName:string }
export interface ModelRenamePlan { version:1; prefix:'Synty: '; snapshot:ModelRenameSnapshot; changes:ModelRenameChange[]; unchanged:number[]; collisions:Array<{name:string;ids:number[]}>; existingDuplicates:Array<{name:string;ids:number[]}> }
function ensure(condition:unknown,message:string):asserts condition {if(!condition)throw Error(message);}
/** Replace an uppercase leading SM token; retain the remainder verbatim. */
export function syntyModelName(value:string):string {
  ensure(typeof value==='string'&&value.trim().length>0,'Existing Model name is empty.');
  if(!/^SM(?:[\s_:]+|$)/.test(value))return value;
  const body=value.replace(/^SM[\s_:]*/, '');
  ensure(body.trim().length>0,'Name body is empty.');
  const result='Synty: '+body;
  ensure(result.length<=255,'Formatted name exceeds model_name length (255).');
  return result;
}
export function planSyntyModelNames(snapshot:ModelRenameSnapshot):ModelRenamePlan {
  ensure(snapshot&&typeof snapshot.ownerId==='string'&&snapshot.ownerId.length>0&&Array.isArray(snapshot.models),'Owner-scoped snapshot required.');
  const seen=new Set<number>(),changes:ModelRenameChange[]=[],unchanged:number[]=[];
  for(const model of snapshot.models){
    ensure(Number.isSafeInteger(model.id)&&model.id>0&&!seen.has(model.id),'Invalid or duplicate Model ID.');seen.add(model.id);
    ensure(typeof model.modelName==='string'&&model.modelName.trim().length>0,'Invalid source name.');
    if(!/^SM(?:[\s_:]+|$)/.test(model.modelName))continue;
    ensure(typeof model.primaryFileName==='string'&&model.primaryFileName.length>0&&Number.isSafeInteger(model.mainModelFileId)&&Number(model.mainModelFileId)>0,'Primary File ID missing.');
    const after=syntyModelName(model.modelName);
    if(after===model.modelName)unchanged.push(model.id);
    else changes.push({id:model.id,before:model.modelName,after,primaryId:model.mainModelFileId!,primaryFileName:model.primaryFileName!});
  }
  const finalNames=new Map<string,number[]>();
  for(const model of snapshot.models){const name=(changes.find(c=>c.id===model.id)?.after??model.modelName).toLowerCase();finalNames.set(name,[...(finalNames.get(name)??[]),model.id]);}
  const duplicates=[...finalNames].filter(([,ids])=>ids.length>1&&ids.some(id=>changes.some(c=>c.id===id))).map(([name,ids])=>({name,ids}));
  const preexisting=(row:{ids:number[]})=>new Set(row.ids.map(id=>snapshot.models.find(m=>m.id===id)!.modelName.toLowerCase())).size===1;
  const collisions=duplicates.filter(row=>!preexisting(row)),existingDuplicates=duplicates.filter(preexisting);
  return {version:1,prefix:'Synty: ',snapshot,changes,unchanged,collisions,existingDuplicates};
}

export async function applySyntyModelNames(plan:ModelRenamePlan,request:typeof fetch,
  journal:(event:{id:number;stage:'pending'|'verified'|'needs-review'})=>Promise<void>){
  ensure(plan?.version===1&&JSON.stringify(plan)===JSON.stringify(planSyntyModelNames(plan.snapshot)),'Invalid or changed rename plan.');
  ensure(plan.collisions.length===0,'Resolve name collisions before applying.');
  async function api(route:string,init?:RequestInit){const r=await request(route,{...init,cache:'no-store',signal:AbortSignal.timeout(30000)}),j=await r.json();ensure(r.ok&&(route==='/api/auth/session'||j.success),`Admin request failed (${r.status}); inspect journal before retrying.`);return j;}
  ensure((await api('/api/auth/session')).user?.id===plan.snapshot.ownerId,'Signed-in owner mismatch.');
  function check(model:{id:number;userId:string;modelName:string;mainModelFileId:number;files:Array<{id:number;fileName:string;fileType:string}>},change:ModelRenameChange){
    ensure(model?.id===change.id&&model.userId===plan.snapshot.ownerId&&model.mainModelFileId===change.primaryId,'Model owner/primary changed.');
    ensure(model.files.some(f=>f.id===change.primaryId&&f.fileName===change.primaryFileName&&f.fileType==='model'),'Primary File identity changed.');
    ensure(model.modelName===change.before||model.modelName===change.after,'Model name changed since snapshot.');
  }
  for(const change of plan.changes)check((await api(`/api/threed/models?id=${change.id}`)).data,change);
  let updated=0,alreadyNamed=plan.unchanged.length;
  for(const change of plan.changes){
    const current=(await api(`/api/threed/models?id=${change.id}`)).data;check(current,change);
    if(current.modelName===change.after){alreadyNamed++;continue;}
    await journal({id:change.id,stage:'pending'});
    try{
      await api(`/api/threed/models?id=${change.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({modelName:change.after})});
      const after=(await api(`/api/threed/models?id=${change.id}`)).data;check(after,change);ensure(after.modelName===change.after,'Saved name not verified.');
      await journal({id:change.id,stage:'verified'});updated++;
    }catch(error){await journal({id:change.id,stage:'needs-review'});throw error;}
  }
  return {updated,alreadyNamed};
}

// @ts-expect-error Standalone Node type stripping requires explicit .ts suffix.
export {planObjModelNames,applyObjModelNames} from './obj-model-names-core.ts';
