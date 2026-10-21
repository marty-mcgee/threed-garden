// @ts-expect-error Explicit suffix is required by standalone Node type stripping.
import { suggestModelPath, TAXONOMY_ROOT } from './model-taxonomy-rules.ts';

export interface TaxonomyCategory { id: number; name: string; slug: string; parentId: number | null; sortOrder: number; isActive: boolean }
export interface TaxonomyModel { id: number; modelName: string; modelType: string; legacyAssetName: string | null; primaryFileName: string | null; categoryIds: number[] }
export interface TaxonomySnapshot { ownerId: string; capturedAt: string; categories: TaxonomyCategory[]; models: TaxonomyModel[] }
interface PlannedCategory { key: string; path: string[]; slug: string; existingId: number | null; parentKey: string | null; sortOrder: number }
interface PlannedModel { id: number; name: string; approved: boolean; categoryKeys: string[]; reason: string }
export interface TaxonomyPlan { version: 1; snapshot: TaxonomySnapshot; categories: PlannedCategory[]; models: PlannedModel[] }
export interface TaxonomyEvent { operation: 'create-category' | 'assign-model'; key: string; stage: 'pending' | 'verified' | 'needs-review'; id?: number }
const keyOf = (parts: string[]) => parts.map(name => name.toLowerCase()).join('/');
const slugOf = (parts: string[]) => parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ids = (values: number[]) => [...new Set(values)].sort((a,b) => a-b);
const sameIds = (a: number[], b: number[]) => JSON.stringify(ids(a)) === JSON.stringify(ids(b));
function positive(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) > 0; }
function ensure(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

export function validateTaxonomySnapshot(value: unknown): asserts value is TaxonomySnapshot {
  const s = value as TaxonomySnapshot;
  ensure(s && typeof s.ownerId === 'string' && s.ownerId.length > 0 && typeof s.capturedAt === 'string', 'Snapshot owner/date required.');
  ensure(Array.isArray(s.categories) && Array.isArray(s.models), 'Snapshot categories/models required.');
  const categoryIds = new Set<number>(), modelIds = new Set<number>(), slugs = new Set<string>();
  for (const c of s.categories) {
    ensure(positive(c.id) && !categoryIds.has(c.id), 'Duplicate or invalid Category ID.');
    ensure(typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 120 && !c.name.includes('/'), 'Invalid Category name.');
    ensure(typeof c.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.slug) && !slugs.has(c.slug), 'Invalid or duplicate Category slug.');
    ensure(typeof c.isActive === 'boolean' && Number.isInteger(c.sortOrder), 'Invalid Category state.');
    ensure(c.parentId === null || positive(c.parentId), 'Invalid parent ID.');
    categoryIds.add(c.id); slugs.add(c.slug);
  }
  for (const c of s.categories) {
    const seen = new Set<number>(); let current: TaxonomyCategory | undefined = c;
    while (current) {
      ensure(!seen.has(current.id), 'Existing Category cycle requires manual review.'); seen.add(current.id);
      if (current.parentId === null) break;
      const parentId: number = current.parentId;
      current = s.categories.find(parent => parent.id === parentId);
      ensure(current, 'Missing Category parent requires manual review.');
    }
  }
  for (const m of s.models) {
    ensure(positive(m.id) && !modelIds.has(m.id), 'Duplicate or invalid Model ID.'); modelIds.add(m.id);
    ensure(typeof m.modelName === 'string' && typeof m.modelType === 'string', 'Invalid Model identity.');
    ensure((m.primaryFileName === null || typeof m.primaryFileName === 'string') && (m.legacyAssetName === null || typeof m.legacyAssetName === 'string'), 'Invalid source names.');
    ensure(Array.isArray(m.categoryIds) && m.categoryIds.length <= 50 && m.categoryIds.every(id => positive(id) && categoryIds.has(id)), 'Unknown/invalid assigned Category.');
  }
}

export function planModelTaxonomy(snapshot: TaxonomySnapshot): TaxonomyPlan {
  validateTaxonomySnapshot(snapshot);
  const existingPaths = new Map<string, TaxonomyCategory>();
  function categoryPath(c: TaxonomyCategory): string[] { return c.parentId === null ? [c.name] : [...categoryPath(snapshot.categories.find(p => p.id === c.parentId)!), c.name]; }
  for (const c of snapshot.categories) {
    const key = keyOf(categoryPath(c)); ensure(!existingPaths.has(key), 'Duplicate sibling Category names require review.'); existingPaths.set(key,c);
  }
  const categories = new Map<string, PlannedCategory>(), reservedSlugs = new Map(snapshot.categories.map(c => [c.slug, keyOf(categoryPath(c))]));
  const models: PlannedModel[] = [];
  for (const model of snapshot.models) {
    const suggestion = suggestModelPath(model);
    const item: PlannedModel = { id:model.id, name:model.modelName, approved:false, categoryKeys:[], reason:suggestion.reason };
    models.push(item); if (!suggestion.path) continue;
    const candidate: PlannedCategory[] = []; let blocked = '';
    for (let depth=1; depth<=suggestion.path.length; depth++) {
      const path = suggestion.path.slice(0,depth), key = keyOf(path), existing = existingPaths.get(key), planned = categories.get(key);
      if (existing && !existing.isActive) { blocked='Inactive existing Category requires explicit review.'; break; }
      const slug = existing?.slug ?? slugOf(path);
      if (slug.length > 120 || (reservedSlugs.has(slug) && reservedSlugs.get(slug)!==key)) { blocked='Category slug collision requires explicit review.'; break; }
      const siblings = [...categories.values(),...candidate].filter(c => c.parentKey === (depth===1?null:keyOf(path.slice(0,-1))));
      candidate.push(planned ?? { key,path,slug,existingId:existing?.id??null,parentKey:depth===1?null:keyOf(path.slice(0,-1)),sortOrder:existing?.sortOrder??siblings.length*100 });
    }
    if (blocked) { item.reason=blocked; continue; }
    for (const c of candidate) { categories.set(c.key,c); reservedSlugs.set(c.slug,c.key); }
    item.categoryKeys=candidate.map(c=>c.key);
    if (candidate.every(c=>c.existingId!==null && model.categoryIds.includes(c.existingId))) item.reason='Already assigned to the proposed category path; no change needed.';
  }
  return { version:1,snapshot,categories:[...categories.values()],models };
}

/** Run inside an authenticated same-origin Admin session with durable pending/verified journal callbacks.
 * The CLI below only plans; a caller must deliberately approve Model rows before using this function. */
export async function applyModelTaxonomy(plan: TaxonomyPlan, request: typeof fetch,
  journal: (event: TaxonomyEvent) => Promise<void>) {
  ensure(plan?.version===1, 'Unsupported taxonomy plan.');
  const canonical = planModelTaxonomy(plan.snapshot);
  ensure(Array.isArray(plan.models) && plan.models.every(m=>typeof m.approved==='boolean'), 'Explicit approval booleans required.');
  ensure(JSON.stringify({...plan,models:plan.models.map(m=>({...m,approved:false}))})===JSON.stringify(canonical), 'Plan content changed; regenerate it from the reviewed snapshot/rules. Only approval flags may be edited.');
  async function api(route: string, init?: RequestInit) {
    const response = await request(route,{...init,cache:'no-store',signal:AbortSignal.timeout(30000)});
    const body = await response.json(); ensure(response.ok && (route==='/api/auth/session' || body.success), `Admin request failed (${response.status}); inspect journal before retrying.`); return body;
  }
  const session = await api('/api/auth/session'); ensure(session.user?.id===plan.snapshot.ownerId,'Signed-in owner does not match snapshot.');
  const live: TaxonomyCategory[] = (await api('/api/threed/model-categories')).data;
  ensure(Array.isArray(live), 'Category response invalid.');
  // Refuse stale taxonomy changes before any writes, preserving manual names, parents and ordering.
  for (const old of plan.snapshot.categories) {
    const now=live.find(c=>c.id===old.id);
    ensure(now && ['name','slug','parentId','sortOrder','isActive'].every(k=>now[k as keyof TaxonomyCategory]===old[k as keyof TaxonomyCategory]),'Existing taxonomy changed since snapshot.');
  }
  const approved=plan.models.filter(m=>m.approved && m.categoryKeys.length);
  ensure(approved.length>0,'No classified Model rows explicitly approved.');
  function checkIdentity(before: { id:number; userId:string; modelName:string; modelType:string; mainModelFileId:number|null; files:Array<{id:number;fileName:string}>; metadata?:{legacyAssetName?:string} }, expected:TaxonomyModel) {
    ensure(before?.id===expected.id&&before.userId===plan.snapshot.ownerId&&before.modelName===expected.modelName&&before.modelType===expected.modelType,'Model owner/identity changed.');
    ensure((before.files?.find(f=>f.id===before.mainModelFileId)?.fileName??null)===expected.primaryFileName&&(before.metadata?.legacyAssetName??null)===expected.legacyAssetName,'Model source identity changed.');
  }
  // Check every approved Model before creating any Category. Repeat the checks immediately before PATCH.
  for (const item of approved) {
    const before=(await api(`/api/threed/models?id=${item.id}`)).data;
    const expected=plan.snapshot.models.find(m=>m.id===item.id)!;
    checkIdentity(before,expected); ensure(Array.isArray(before.categories),'Current Model categories missing.');
    const assigned=before.categories.map((c:{id:number})=>c.id);
    const allAlreadyAssigned=item.categoryKeys.every(key=>{const node=plan.categories.find(c=>c.key===key)!;const existing=live.find(c=>c.slug===node.slug);return existing&&assigned.includes(existing.id);});
    ensure(sameIds(assigned,expected.categoryIds)||allAlreadyAssigned,'Model categories changed since snapshot; review rather than overwrite.');
  }
  const needed=new Set(approved.flatMap(m=>m.categoryKeys));
  const resolved=new Map<string,number>();
  for (const node of plan.categories.filter(c=>needed.has(c.key)).sort((a,b)=>a.path.length-b.path.length)) {
    const parentId=node.parentKey?resolved.get(node.parentKey):null;
    ensure(parentId!==undefined,'Category parent unresolved.');
    if (node.existingId!==null) { resolved.set(node.key,node.existingId); continue; }
    const sameSlug=live.find(c=>c.slug===node.slug);
    if (sameSlug) { ensure(sameSlug.name===node.path.at(-1)&&sameSlug.parentId===parentId&&sameSlug.isActive,'Live slug conflict; do not duplicate or reparent it.'); resolved.set(node.key,sameSlug.id); continue; }
    await journal({operation:'create-category',key:node.key,stage:'pending'});
    try {
      const body=await api('/api/threed/model-categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:node.path.at(-1),slug:node.slug,parentId,sortOrder:node.sortOrder,isActive:true,description:`Functional Model taxonomy: ${node.path.join(' > ')}.`})});
      const created: TaxonomyCategory=body.data;
      ensure(positive(created?.id)&&created.slug===node.slug&&created.parentId===parentId,'Category save not verified.');
      live.push(created); resolved.set(node.key,created.id);
      await journal({operation:'create-category',key:node.key,stage:'verified',id:created.id});
    } catch(error) { await journal({operation:'create-category',key:node.key,stage:'needs-review'}); throw error; }
  }
  let updated=0,unchanged=0;
  for (const item of approved) {
    const before=(await api(`/api/threed/models?id=${item.id}`)).data;
    const expected=plan.snapshot.models.find(m=>m.id===item.id)!;
    checkIdentity(before,expected);
    ensure(Array.isArray(before.categories),'Current Model categories missing.');
    const currentIds=before.categories.map((c:{id:number})=>c.id);
    const chosen=item.categoryKeys.map(key=>resolved.get(key)!);
    const target=ids([...currentIds,...chosen]);
    if (sameIds(currentIds,target)) { unchanged++; continue; }
    ensure(sameIds(currentIds,expected.categoryIds),'Model categories changed since snapshot; review rather than overwrite.');
    ensure(target.length<=50,'Category assignment limit exceeded.');
    await journal({operation:'assign-model',key:String(item.id),stage:'pending'});
    try {
      await api(`/api/threed/models?id=${item.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({categoryIds:target})});
      const after=(await api(`/api/threed/models?id=${item.id}`)).data;
      ensure(after?.userId===plan.snapshot.ownerId&&sameIds(after.categories.map((c:{id:number})=>c.id),target),'Saved Model category assignment not verified.');
      await journal({operation:'assign-model',key:String(item.id),stage:'verified',id:item.id}); updated++;
    } catch(error) { await journal({operation:'assign-model',key:String(item.id),stage:'needs-review'}); throw error; }
  }
  return {updated,unchanged,approved:approved.length};
}

export function taxonomyPlanSummary(plan: TaxonomyPlan) {
  return { models:plan.models.length, existingCategories:plan.snapshot.categories.length,
    proposedNewCategories:plan.categories.filter(c=>c.existingId===null).length,
    classifiedModels:plan.models.filter(m=>m.categoryKeys.length>0).length,
    manualReview:plan.models.filter(m=>m.categoryKeys.length===0).length,
    approvedModels:plan.models.filter(m=>m.approved).length,root:TAXONOMY_ROOT };
}
