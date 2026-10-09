// Execute actual Builder React handlers and registration state machine with offline I/O doubles.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const jsx = (type,props,key) => ({ type,props,key }), proxy = new Proxy({}, { get: (_,name) => String(name) });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value,...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? text(value.props?.children) : String(value ?? '');
function load(file,deps = {},globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{ compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports,console,AbortController,AbortSignal,FormData,File,Blob,Response,setTimeout,clearTimeout,...globals,require(name) { assert(name in deps,`Unexpected UI import: ${name}`); return deps[name]; } });
  return exports;
}
const parameters = load('src/libraries/services/threed/model-builder/parameters.ts');
const registration = load('src/libraries/services/threed/model-builder/registration.ts');
function runtime() {
  const slots = []; let cursor = 0, effects = [], changed = false, body, value;
  const same = (a,b) => a && b && a.length === b.length && a.every((v,i) => Object.is(v,b[i]));
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value,next => { const value = typeof next === 'function' ? next(slots[i].value) : next; if (!Object.is(value,slots[i].value)) { slots[i].value = value; changed = true; } }]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(callback,deps) { const i = cursor++; if (!same(slots[i]?.deps,deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps,cleanup: callback() }; }); },
  };
  const render = () => { let n = 0; do { assert(++n < 40,'Builder render loop'); changed = false; cursor = 0; effects = []; value = body(); effects.forEach(effect => effect()); } while (changed); return value; };
  return { react,render,mount(fn) { body = fn; return render(); },get value() { return value; },async flush() { for (let i = 0; i < 4; i++) { await new Promise(resolve => setTimeout(resolve,0)); render(); } },unmount() { slots.forEach(slot => slot?.cleanup?.()); } };
}
function deferred() { let resolve,reject; const promise = new Promise((yes,no) => { resolve = yes; reject = no; }); return { promise,resolve,reject }; }
function fixture() {
  const rt = runtime(), requests = [], uploads = [], revoked = [], navigation = [], bundles = [], leases = [];
  const listeners = new Map(), documentListeners = new Map(); let confirmed = true, generation = 0, textureId = 700, assignments = 0, failAssignment = 0;
  const entries = [{ href: 'https://fixture.invalid/admin/threed/models',state: { __NA: true } },{ href: 'https://fixture.invalid/admin/threed/models/builder',state: { __NA: true } }]; let historyIndex = 1;
  const history = {
    get state() { return entries[historyIndex].state; },
    pushState(state,_,href) { entries.splice(historyIndex+1); entries.push({ state,href: href ? new URL(href,entries[historyIndex].href).href : entries[historyIndex].href }); historyIndex++; },
    replaceState(state,_,href) { entries[historyIndex] = { state,href: href ? new URL(href,entries[historyIndex].href).href : entries[historyIndex].href }; },
    go(delta) { setTimeout(() => {
      const next = historyIndex+delta; if (next < 0 || next >= entries.length) return; historyIndex = next;
      const event = { state: entries[next].state,preventDefault() {},stopImmediatePropagation() {} }; listeners.get('popstate')?.(event);
      if (!entries[historyIndex].href.endsWith('/builder')) navigation.push(entries[historyIndex].href);
    },0); },
    back() { this.go(-1); },forward() { this.go(1); },
  };
  let uncertainModel = false, rejectedModel = false, cleanupFails = false, heldModel = null, heldTexture = null, heldUpload = null, heldExport = null;
  class Anchor { href = 'https://fixture.invalid/admin/threed/models'; target = ''; hasAttribute() { return false; } closest() { return this; } }
  const fetch = async (url,options) => {
    requests.push({ url,...options });
    if (url === '/api/threed/models') {
      if (heldModel) { const current = heldModel; heldModel = null; await current.promise; }
      if (uncertainModel) throw new TypeError('Network confirmation lost');
      if (rejectedModel) return Response.json({ success: false,error: 'Model fields rejected' },{ status: 400 });
      return Response.json({ success: true,data: { id: 123,mainModelFileId: 456 } });
    }
    if (url === '/api/threed/models/upload') {
      assert.equal(options.method,'DELETE');
      assert.equal(JSON.parse(options.body).url,'https://fixture.public.blob.vercel-storage.com/cottage.glb');
      return Response.json({ success: !cleanupFails },{ status: cleanupFails ? 500 : 200 });
    }
    if (url === '/api/threed/model-textures') {
      if (heldTexture) { const current = heldTexture; heldTexture = null; await current.promise; }
      return Response.json({ success: true,data: { id: ++textureId } });
    }
    assert.equal(url,'/api/threed/models/files/requirements');
    if (++assignments === failAssignment) return Response.json({ success: false,error: 'Assignment revision rejected' },{ status: 409 });
    return Response.json({ success: true,data: {} });
  };
  const bundle = input => {
    generation++; const normalized = parameters.normalizeCottageParameters(input);
    const result = { parameters: normalized,identity: { id: 'threed-cottage-ts',version: 'test',seed: normalized.seed },stats: { meshCount: 2,triangleCount: 24 },
      materials: [{ name: 'roof',textureBindings: { baseColor: 'roof_baseColor',normal: 'roof_normal',roughness: 'roof_packedORM',metallic: 'roof_packedORM',occlusion: 'roof_packedORM' } }],disposed: false,dispose() { this.disposed = true; } };
    bundles.push(result); return result;
  };
  const exportCottageGlb = async (b,signal) => {
    if (heldExport) { const current = heldExport; heldExport = null; await current.promise; }
    signal.throwIfAborted();
    const canonical = parameters.canonicalCottageParameters(b.parameters), hash = require('node:crypto').createHash('sha256').update(canonical).digest('hex');
    const images = ['baseColor','normal','packedORM'].map((role,i) => ({ artifact: { id: `roof_${role}`,role },file: new File([String(i)],`roof_${role}.png`,{ type: 'image/png' }),sha256: String(i).repeat(64) }));
    return { file: new File([canonical],'cottage.glb',{ type: 'model/gltf-binary' }),sha256: hash,inputSha256: hash,images,manifest: { materials: [] } };
  };
  const deps = {
    react: rt.react,'react/jsx-runtime': { jsx,jsxs: jsx },'next/link': { default: 'Link' },'lucide-react': proxy,
    '@/components/ui/button': proxy,'@/components/ui/input': proxy,'@/components/admin/layout/AdminWorkspaceHeader': proxy,
    '../ModelFieldHelp': proxy,'../ThreeDModelAssetPreview': { ThreeDModelAssetPreview: 'ThreeDModelAssetPreview' },'../ModelPreviewImageExport': { ModelPreviewImageExport: 'ModelPreviewImageExport' },
    '../model-gltf-bundle-inspection': { loadBulkGltfBundle: async () => { const lease = { scene: {},disposed: false,dispose() { this.disposed = true; } }; leases.push(lease); return lease; } },
    '@/libraries/services/threed/models/model-material-inventory-core': { createThreeDModelMaterialInventory: () => ({ meshCount: 2,omittedSlotCount: 0,unavailableTextureSlotCount: 0,slots: [0,1].map(i => ({ materialName: 'roof',id: `mesh:${i}:material:0` })) }) },
    '@/libraries/services/threed/models/model-primary-upload-client': { uploadThreeDPrimaryFile: async (file,options) => {
      uploads.push(file); options.onProgress(42,'uploading');
      if (heldUpload) { const current = heldUpload; heldUpload = null; options.signal.addEventListener('abort',() => current.reject(new Error('Upload stopped')),{ once: true }); await current.promise; }
      options.signal.throwIfAborted(); options.onProgress(100,'verifying');
      return { url: 'https://fixture.public.blob.vercel-storage.com/cottage.glb',fileName: file.name,fileSize: file.size,modelType: 'glb' };
    } },
    '@/libraries/services/threed/model-builder/cottage': { createCottage: bundle },'@/libraries/services/threed/model-builder/parameters': parameters,
    '@/libraries/services/threed/model-builder/export': { exportCottageGlb },'@/libraries/services/threed/model-builder/registration': registration,
  };
  const component = load('src/components/admin/threed/models/builder/ThreeDModelBuilder.tsx',deps,{ fetch,HTMLAnchorElement: Anchor,
    URL: { createObjectURL: () => `blob:fixture-${generation}`,revokeObjectURL: url => revoked.push(url) },
    window: { confirm: () => confirmed,history,get location() { return { ...new URL(entries[historyIndex].href),href: entries[historyIndex].href,assign: url => navigation.push(url) }; },addEventListener: (type,fn) => listeners.set(type,fn),removeEventListener: type => listeners.delete(type) },
    document: { addEventListener: (type,fn) => documentListeners.set(type,fn),removeEventListener: type => documentListeners.delete(type),createElement: () => ({ click() {} }) },
  });
  rt.mount(() => component.ThreeDModelBuilder());
  return { rt,requests,uploads,revoked,navigation,bundles,leases,listeners,find: predicate => nodes(rt.value).find(predicate),back() { history.back(); },get historyIndex() { return historyIndex; },
    confirm(value) { confirmed = value; },failAssignment(value) { failAssignment = value; },uncertainModel(value) { uncertainModel = value; },
    rejectModel(value) { rejectedModel = value; },failCleanup(value) { cleanupFails = value; },holdModel() { const value = deferred(); heldModel = value; return value; },
    holdUpload() { const value = deferred(); heldUpload = value; return value; },holdTexture() { const value = deferred(); heldTexture = value; return value; },holdExport() { const value = deferred(); heldExport = value; return value; },
    link() { const event = { target: new Anchor(),button: 0,preventDefault() { this.blocked = true; },stopImmediatePropagation() {} }; documentListeners.get('click')?.(event); return event.blocked; },
  };
}
const button = (f,label) => f.find(node => node.type === 'Button' && text(node.props.children).trim() === label);
const field = (f,id) => f.find(node => node.props?.id === id);
const preview = f => f.find(node => node.type === 'ThreeDModelAssetPreview');
const capture = f => f.find(node => node.type === 'ModelPreviewImageExport');
async function generate(f) { await button(f,'Generate Preview').props.onClick(); await f.rt.flush(); }
(async () => {
  const f = fixture(); assert(button(f,'Save as New Model').props.disabled); assert.equal(preview(f).props.model,null);
  const firstGenerate = button(f,'Generate Preview').props.onClick; await Promise.all([firstGenerate(),firstGenerate()]); await f.rt.flush();
  assert.equal(f.bundles.length,1); assert(f.bundles[0].disposed && f.leases[0].disposed); assert.equal(preview(f).props.model.id,0); assert.equal(f.requests.length,0);
  const originalUrl = preview(f).props.model.filePath, captureKey = capture(f).key;
  field(f,'cottage-main_width').props.onChange({ target: { value: '340' } }); f.rt.render();
  assert(button(f,'Save as New Model').props.disabled); assert(button(f,'Download GLB').props.disabled);
  await button(f,'Save as New Model').props.onClick(); assert.equal(f.uploads.length,0,'Changed draft cannot save even through the direct handler');
  field(f,'cottage-main_width').props.onChange({ target: { value: '' } }); f.rt.render(); await generate(f);
  assert(f.find(node => node.props?.role === 'alert')); assert.equal(preview(f).props.model.filePath,originalUrl); assert.equal(f.revoked.length,0);
  field(f,'cottage-main_width').props.onChange({ target: { value: '340' } }); f.rt.render(); await generate(f);
  assert.notEqual(preview(f).props.model.filePath,originalUrl); assert(f.revoked.includes(originalUrl));
  // A changed output must remount the capture component, whose own uploaded/image state is retained across prop edits.
  assert(capture(f).key && capture(f).key !== captureKey,'Changed generation must reset prior image/capture state with a generation key');
  capture(f).props.onOpenChange(true); f.rt.render(); assert(button(f,'Generate Preview').props.disabled && button(f,'Save as New Model').props.disabled);
  const count = f.bundles.length; await button(f,'Generate Preview').props.onClick(); await button(f,'Save as New Model').props.onClick(); assert.equal(f.bundles.length,count); assert.equal(f.uploads.length,0);
  capture(f).props.onOpenChange(false); f.rt.render(); capture(f).props.onUseImageUrl('https://fixture.public.blob.vercel-storage.com/preview.png'); f.rt.render();
  f.confirm(false); assert(f.link()); assert.equal(f.navigation.length,0);
  const draftHistoryIndex = f.historyIndex; f.back(); await f.rt.flush(); assert.equal(f.historyIndex,draftHistoryIndex,'Rejected Back restores the Builder history entry'); assert.equal(f.navigation.length,0);
  const beforeUnload = { preventDefault() { this.prevented = true; } }; f.listeners.get('beforeunload')(beforeUnload); assert(beforeUnload.prevented);
  f.failAssignment(2); await button(f,'Save as New Model').props.onClick(); await f.rt.flush();
  assert(button(f,'Resume Save')); assert.equal(f.uploads.length,1); assert.equal(f.requests.filter(r => r.url === '/api/threed/models').length,1);
  const created = JSON.parse(f.requests.find(r => r.url === '/api/threed/models').body);
  for (const key of ['isActive','isPublic','isDefault','usedByCharacters','usedByPlants']) assert.equal(created[key],false);
  assert.equal(created.metadata.activeSource,'model'); assert.equal(created.thumbnailUrl,'https://fixture.public.blob.vercel-storage.com/preview.png');
  assert.equal(created.primaryFile.fileSize,f.uploads[0].size); assert(field(f,'builder-model-name').props.disabled);
  await button(f,'Resume Save').props.onClick(); await f.rt.flush();
  assert(button(f,'Model Saved').props.disabled); assert.equal(f.uploads.length,1); assert.equal(f.requests.filter(r => r.url === '/api/threed/models').length,1);
  assert.equal(f.requests.filter(r => r.url === '/api/threed/model-textures').length,3);
  const assignments = f.requests.filter(r => r.url === '/api/threed/models/files/requirements').map(r => JSON.parse(r.body));
  assert.deepEqual([...new Set(assignments.map(a => a.channel))].sort(),['baseColor','metallic','normalMap','occlusion','roughness']);
  const orm = assignments.filter(a => ['metallic','occlusion','roughness'].includes(a.channel)); assert.equal(new Set(orm.map(a => a.textureId)).size,1);
  assert(assignments.every(a => a.targetKeys.length === 2));
  f.rt.unmount(); assert.equal(f.listeners.size,0); assert(f.revoked.includes(preview(f).props.model.filePath));
  assert.equal(f.requests.filter(r => r.method === 'DELETE').length,0,'A committed primary is never discarded');
  console.log('  Passed: real Generate/draft validation callbacks, preview leases, capture reset/busy guard, strict inactive creation and confirmed Save/Resume/ORM handling.');

  const cancelled = fixture(); await generate(cancelled); cancelled.holdUpload();
  const saving = button(cancelled,'Save as New Model').props.onClick(); cancelled.rt.render();
  const busyHistoryIndex = cancelled.historyIndex; cancelled.confirm(true); cancelled.back(); await cancelled.rt.flush(); assert.equal(cancelled.historyIndex,busyHistoryIndex,'Busy Back restores the Builder without prompting away'); assert.equal(cancelled.navigation.length,0);
  assert.equal(cancelled.find(node => node.type === 'progress').props.value,42); button(cancelled,'Stop').props.onClick(); await saving; await cancelled.rt.flush();
  assert.equal(cancelled.requests.length,0); assert(text(cancelled.find(node => node.props?.role === 'alert').props.children).includes('Save stopped'));
  await button(cancelled,'Save as New Model').props.onClick(); await cancelled.rt.flush(); assert(button(cancelled,'Model Saved')); cancelled.rt.unmount();
  const partial = fixture(); await generate(partial); const heldTexture = partial.holdTexture(), partialSave = button(partial,'Save as New Model').props.onClick(); await partial.rt.flush();
  assert(partial.requests.some(r => r.url === '/api/threed/model-textures')); button(partial,'Stop').props.onClick(); heldTexture.resolve(); await partialSave; await partial.rt.flush();
  assert(button(partial,'Resume Save')); assert.equal(partial.requests.filter(r => r.url === '/api/threed/models/files/requirements').length,0);
  await button(partial,'Resume Save').props.onClick(); await partial.rt.flush(); assert.equal(partial.requests.filter(r => r.url === '/api/threed/models').length,1); assert.equal(partial.requests.filter(r => r.url === '/api/threed/model-textures').length,3); partial.rt.unmount();
  const unknown = fixture(); await generate(unknown); unknown.uncertainModel(true); await button(unknown,'Save as New Model').props.onClick(); await unknown.rt.flush();
  assert(button(unknown,'Save as New Model').props.disabled); const posts = unknown.requests.length; await button(unknown,'Save as New Model').props.onClick(); await unknown.rt.flush(); assert.equal(unknown.requests.length,posts,'Ambiguous creation never replays the POST'); unknown.rt.unmount();
  assert.equal(unknown.requests.filter(r => r.method === 'DELETE').length,0,'An uncertain primary is never discarded');
  const cancelledUnknown = fixture(); await generate(cancelledUnknown); const lostTexture = cancelledUnknown.holdTexture(), lostSave = button(cancelledUnknown,'Save as New Model').props.onClick(); await cancelledUnknown.rt.flush();
  button(cancelledUnknown,'Stop').props.onClick(); lostTexture.reject(new TypeError('Texture confirmation lost')); await lostSave; await cancelledUnknown.rt.flush();
  assert(button(cancelledUnknown,'Resume Save').props.disabled); assert(/review|not confirmed/i.test(text(cancelledUnknown.find(node => node.props?.role === 'alert').props.children)),'Ambiguous creation must direct review even when Stop was requested'); cancelledUnknown.rt.unmount();
  const acceptedBack = fixture(); await generate(acceptedBack); acceptedBack.confirm(true); acceptedBack.back(); await acceptedBack.rt.flush(); assert(acceptedBack.navigation.some(url => url.endsWith('/admin/threed/models')),'Confirmed Back reaches the actual previous page'); acceptedBack.rt.unmount();
  const gone = fixture(), heldExport = gone.holdExport(), generating = button(gone,'Generate Preview').props.onClick(); await gone.rt.flush(); gone.rt.unmount(); heldExport.resolve(); await generating;
  assert(gone.bundles[0].disposed); assert.equal(gone.leases.length,0); assert.equal(gone.requests.length,0);
  console.log('  Passed: upload progress/Stop/retry, cancellation after confirmed Model/Texture writes, ambiguous POST protection and unmount disposal.');

  const staged = fixture(); await generate(staged); staged.rejectModel(true);
  await button(staged,'Save as New Model').props.onClick(); await staged.rt.flush();
  const stagedUrl = preview(staged).props.model.filePath;
  staged.failCleanup(true); field(staged,'cottage-main_width').props.onChange({ target: { value: '340' } }); staged.rt.render();
  await generate(staged);
  assert.equal(preview(staged).props.model.filePath,stagedUrl,'Failed staged cleanup retains the reviewed preview');
  assert(!staged.revoked.includes(stagedUrl)); assert(staged.bundles.at(-1).disposed && staged.leases.at(-1).disposed);
  assert(/cleanup is unconfirmed/.test(text(staged.find(node => node.props?.role === 'alert').props.children)));
  field(staged,'cottage-main_width').props.onChange({ target: { value: '336' } }); staged.rt.render();
  assert(button(staged,'Save as New Model').props.disabled,'A potentially deleted primary cannot be registered after an unconfirmed DELETE');
  staged.failCleanup(false); await generate(staged);
  assert(staged.revoked.includes(stagedUrl)); assert.equal(staged.requests.filter(r => r.method === 'DELETE').length,2);
  staged.rt.unmount();
  const idleStaged = fixture(); await generate(idleStaged); idleStaged.rejectModel(true);
  await button(idleStaged,'Save as New Model').props.onClick(); await idleStaged.rt.flush(); idleStaged.rt.unmount();
  assert.equal(idleStaged.requests.filter(r => r.method === 'DELETE').length,1);
  assert.equal(idleStaged.requests.find(r => r.method === 'DELETE').keepalive,true);
  const pendingWrite = fixture(); await generate(pendingWrite); const heldModel = pendingWrite.holdModel();
  const pendingSave = button(pendingWrite,'Save as New Model').props.onClick(); await pendingWrite.rt.flush(); pendingWrite.rt.unmount();
  assert.equal(pendingWrite.requests.filter(r => r.method === 'DELETE').length,0,'Unmount must not delete bytes during a pending Model creation');
  heldModel.resolve(); await pendingSave;
  assert.equal(pendingWrite.requests.filter(r => r.method === 'DELETE').length,0);
  console.log('  Passed: awaited staged-primary replacement cleanup, uncertain-cleanup Save guard, idle keepalive cleanup, and pending/committed/uncertain write exclusions.');
})().catch(error => { console.error(error); process.exitCode = 1; });
