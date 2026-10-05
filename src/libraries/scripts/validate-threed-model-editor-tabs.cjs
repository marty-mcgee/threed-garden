// Actual tab controller, editor handlers and preview rendering with offline doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const sourceCore = require('../services/threed/models/model-source-core.ts');
const jsx = (type, props) => ({ type, props });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const text = value => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? text(value.props?.children) : String(value ?? '');
const settle = () => new Promise(resolve => setImmediate(resolve));
const proxy = new Proxy({}, { get: (_, key) => String(key) });
function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, console, URL, AbortController, AbortSignal, FormData, ...globals,
    require(name) { assert(name in mocks, `Unexpected import ${file}: ${name}`); return mocks[name]; },
  });
  return exports;
}
function runtime() {
  let slots = [], cursor = 0, effects = [], changed = false, renderBody, value;
  const same = (a, b) => a && b && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  const react = {
    Suspense: 'suspense',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => {
        next = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(next, slots[index].value)) { slots[index].value = next; changed = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useMemo(calculate, deps) { const index = cursor++; if (!same(slots[index]?.deps, deps)) slots[index] = { deps, value: calculate() }; return slots[index].value; },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) { effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; }); }
    },
    useId() { return react.useMemo(() => 'fixture-id', []); },
  };
  function render() {
    let passes = 0;
    do {
      assert(++passes < 40, 'React render loop'); changed = false; cursor = 0; effects = [];
      value = renderBody(); for (const effect of effects) effect();
    } while (changed);
    return value;
  }
  return { react, mount(body) { renderBody = body; return render(); }, render, get value() { return value; }, async flush() { await settle(); return render(); } };
}
function browser(rt, initial = '/admin/threed/models/7') {
  let index = 0;
  const entries = [{ href: new URL(initial, 'https://fixture.invalid').href, state: {} }];
  const writes = [], events = new Map();
  const window = {
    get location() { return new URL(entries[index].href); },
    history: {
      get state() { return entries[index].state; },
      replaceState(state, _, href) { entries[index] = { href: new URL(href, entries[index].href).href, state }; writes.push(['replace', href]); },
      pushState(state, _, href) { entries.splice(index + 1); entries.push({ href: new URL(href, entries[index].href).href, state }); ++index; writes.push(['push', href]); },
      go(delta) { const next = index + delta; if (next < 0 || next >= entries.length) return; index = next; },
    },
    addEventListener(event, listener) { events.set(event, listener); },
    removeEventListener(event) { events.delete(event); },
  };
  return { window, writes, entries, events, back() { window.history.go(-1); rt.render(); }, forward() { window.history.go(1); rt.render(); } };
}
async function controllerChecks() {
  const rt = runtime(), b = browser(rt);
  let dirty = false, busy = false, saves = 0, discards = 0, refreshes = 0, saveOK = false, discardOK = true;
  const hook = load('src/components/admin/threed/models/use-model-editor-tabs.ts', {
    react: rt.react, 'next/navigation': { useSearchParams: () => b.window.location.searchParams },
  }, { window: b.window });
  const render = () => hook.useModelEditorTabs({ enabled: true, dirty, busy,
    save: async () => { ++saves; return saveOK; }, discard: async () => { ++discards; return discardOK; }, refresh: async () => { ++refreshes; return true; } });
  rt.mount(render);
  dirty = true; rt.render().requestTab('files'); rt.render();
  assert.equal(rt.value.pending, 'files'); assert.equal(rt.value.tab, 'details');
  await rt.value.resolve('stay'); assert.equal(rt.render().pending, null);
  rt.value.requestTab('files'); rt.render(); await rt.value.resolve('save'); rt.render();
  assert.equal(saves, 1); assert.equal(rt.value.pending, 'files'); assert.equal(rt.value.tab, 'details', 'Failed save keeps draft and dialog');
  discardOK = false; await rt.value.resolve('discard'); rt.render(); assert.equal(rt.value.tab, 'details', 'Failed recovery/discard retains draft');
  saveOK = true; await rt.value.resolve('save'); dirty = false; rt.render();
  assert.equal(rt.value.tab, 'files'); assert.equal(b.window.location.searchParams.get('tab'), 'files');
  b.back(); await rt.flush(); assert.equal(rt.value.tab, 'details'); assert.equal(refreshes, 1);
  b.forward(); await rt.flush(); assert.equal(rt.value.tab, 'files');
  busy = true; rt.render(); const entries = b.entries.map(item => item.href); b.back(); rt.render();
  assert.equal(rt.value.tab, 'files'); assert.equal(b.window.location.searchParams.get('tab'), 'files');
  assert.deepEqual(b.entries.map(item => item.href), entries, 'Blocked Back must preserve history entries');
  busy = false; rt.render(); b.back(); await rt.flush(); assert.equal(rt.value.tab, 'details');
  dirty = true; rt.render(); b.forward(); rt.render(); assert.equal(rt.value.pending, 'files'); assert.equal(b.window.location.searchParams.get('tab'), null);
  discardOK = true; await rt.value.resolve('discard'); dirty = false; rt.render(); assert.equal(rt.value.tab, 'files'); assert.equal(discards, 2);
  const event = { preventDefault() { this.prevented = true; } }; busy = true; rt.render(); b.events.get('beforeunload')(event); assert(event.prevented);
}
async function editorChecks() {
  const rt = runtime(), b = browser(rt), requests = [];
  let failRefresh = false, failSave = false, wrongOwnerProjection = false, wrongId = false, waitRefresh = null, failDiscard = false;
  let saved = { id: 7, userId: 'owner', modelName: 'Oak', modelType: 'procedural', filePath: '', metadata: {}, files: [], categories: [], mainModelFileId: null };
  const fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === '/api/threed/model-categories') return { ok: true, json: async () => ({ success: true, data: [] }) };
    if (url === '/api/threed/models/upload') return { ok: !failDiscard, json: async () => ({ success: !failDiscard, data: { url: 'https://fixture.invalid/staged.glb', fileName: 'staged.glb', fileSize: 100, modelType: 'glb' } }) };
    assert.equal(url, '/api/threed/models?id=7', 'Exact selected Model');
    if (options.method === 'PATCH') {
      if (!failSave) saved = { ...saved, ...JSON.parse(options.body) };
      return { ok: !failSave, json: async () => ({ success: !failSave, data: saved, error: 'Fixture save failed' }) };
    }
    assert.equal(options.cache, 'no-store');
    if (waitRefresh) await waitRefresh;
    const data = { ...saved, ...(wrongId ? { id: 8 } : {}) };
    if (wrongOwnerProjection) delete data.userId;
    return { ok: !failRefresh, json: async () => ({ success: !failRefresh, data }) };
  };
  const hook = load('src/components/admin/threed/models/use-model-editor-tabs.ts', { react: rt.react,
    'next/navigation': { useSearchParams: () => b.window.location.searchParams } }, { window: b.window });
  const lighting = load('src/libraries/services/threed/models/model-lighting-core.ts', {});
  const form = load('src/components/admin/threed/models/model-admin-form-core.ts', { '../../../../libraries/services/threed/models/model-lighting-core.ts': lighting, '../../../../libraries/services/threed/models/model-source-core.ts': sourceCore });
  const module = load('src/components/admin/threed/models/ThreeDModelsCRUD.tsx', {
    react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'link' },
    'next/navigation': { useRouter: () => ({ push() {} }) }, 'lucide-react': proxy,
    '@/components/admin/threed/animations/CharacterAnimationAssignments': proxy,
    '@/components/admin/layout/AdminWorkspaceHeader': proxy, '@/components/ui/toast': { useToast: () => ({ showToast: () => {}, ToastComponent: null }) },
    '@/components/ui/button': proxy, '@/components/ui/badge': proxy, '@/components/ui/table': proxy,
    '@/components/ui/dialog': proxy, '@/components/ui/dropdown-menu': proxy, '@/components/ui/input': proxy, '@/components/ui/tabs': proxy,
    './model-admin-form-core': form, './ThreeDModelEditorFields': { ...proxy, MODEL_TYPE_OPTIONS: [], MODEL_STATUS_OPTIONS: [], ThreeDModelEditorFields: 'fields', ThreeDModelPreviewImageFields: 'image-fields' },
    './ModelPreviewBatchExport': proxy, './ModelPreviewImageExport': proxy, './ThreeDModelAssetPreview': proxy,
    './ModelFieldHelp': { ModelFieldHelp: 'help' },
    './ThreeDModelsBulkImport': proxy, './ThreeDModelFilesCRUD': proxy, './BulkModelCategoriesDialog': proxy,
    './model-preview-requirements': { modelForPreview: value => value }, './use-model-editor-tabs': hook,
  }, { window: b.window, fetch, confirm: () => true });
  const shell = module.ThreeDModelsCRUD({ view: 'edit', linkedModelId: 7 });
  rt.mount(() => shell.props.children.type(shell.props.children.props)); await rt.flush();
  const find = predicate => nodes(rt.value).find(predicate);
  const fields = () => find(node => node.type === 'fields');
  const tabs = () => find(node => node.type === 'Tabs');
  const files = () => find(node => node.type === 'ThreeDModelFilesCRUD');
  const saveButton = () => nodes(rt.value).find(node => node.type === 'Button' && node.props.onClick?.name === 'handleUpdate');
  assert.equal(fields().props.form.modelName, 'Oak');
  assert.equal(fields().props.showPreviewImage, false, 'Form column omits duplicate image controls');
  const imageFields = () => find(node => node.type === 'image-fields');
  assert.equal(nodes(rt.value).filter(node => node.type === 'image-fields').length, 1);
  assert.equal(imageFields().props.form, fields().props.form, 'Image and details edit the same draft');
  imageFields().props.setForm(current => ({ ...current, thumbnailUrl: 'https://fixture.invalid/draft.png' })); rt.render();
  assert.equal(fields().props.form.thumbnailUrl, 'https://fixture.invalid/draft.png');
  assert(!requests.some(request => request.options.method === 'PATCH'), 'Image URL draft is not saved automatically');
  const draftPreview = () => find(node => node.type === 'ThreeDModelAssetPreview');
  assert.equal(draftPreview().props.centerAtOrigin, true);
  assert.equal(draftPreview().props.preserveCameraOnEdit, true);
  assert(draftPreview().props.perspective, 'Details opts into the workspace initial perspective');
  assert(find(node => node.type === 'fieldset' && node.props['aria-label'] === 'Model details').props.className.includes('lg:overflow-y-auto'));
  assert(find(node => node.type === 'section' && node.props['aria-label'] === 'Model draft preview').props.className.includes('lg:overflow-y-auto'));
  const edit = updates => { fields().props.setForm(current => ({ ...current, ...updates })); rt.render(); };
  edit({ scale: '0.37' });
  assert.equal(Number(draftPreview().props.model.scale), 0.37, 'Unsaved custom scale reaches the actual preview');
  edit({ modelName: 'Draft Oak' }); tabs().props.onValueChange('files'); rt.render();
  assert(find(node => node.type === 'Dialog' && node.props.open));
  failSave = true;
  await find(node => node.type === 'Button' && text(node) === 'Save Changes' && !node.props.onClick?.toString().includes('handleUpdate')).props.onClick();
  await rt.flush(); assert.equal(fields().props.form.modelName, 'Draft Oak'); assert.equal(tabs().props.value, 'details');
  await find(node => node.type === 'Button' && text(node) === 'Stay').props.onClick(); rt.render();
  failSave = false; await saveButton().props.onClick(); rt.render();
  tabs().props.onValueChange('files'); await rt.flush(); assert.equal(tabs().props.value, 'files');
  assert.equal(files().props.initialModelId, 7); assert.equal(files().props.embedded, true);
  assert.equal(find(node => node.type === 'ThreeDModelAssetPreview').props.active, false);
  files().props.onBusyChange(true); rt.render(); tabs().props.onValueChange('details'); rt.render(); assert.equal(tabs().props.value, 'files');
  files().props.onBusyChange(false); rt.render();
  saved = { ...saved, metadata: { fallbackShape: 'sphere', preserved: 'Files change' }, mainModelFileId: 42, filePath: 'https://fixture.invalid/shape.glb', modelType: 'glb', files: [{ id: 42, fileName: 'shape.glb', filePath: 'https://fixture.invalid/shape.glb', relativePath: 'models/shape.glb', fileType: 'model' }] };
  let release; waitRefresh = new Promise(resolve => { release = resolve; });
  tabs().props.onValueChange('details'); rt.render(); assert.equal(files().props.active, true);
  assert.equal(saveButton().props.disabled, true, 'Save blocked during refresh');
  release(); waitRefresh = null; await rt.flush();
  assert.equal(tabs().props.value, 'details'); assert.equal(fields().props.form.mainModelFileId, '42'); assert(fields().props.form.metadata.includes('Files change'));
  await saveButton().props.onClick(); rt.render();
  const lastSave = requests.filter(item => item.options.method === 'PATCH').at(-1);
  assert.equal(JSON.parse(lastSave.options.body).mainModelFileId, 42); assert.equal(JSON.parse(lastSave.options.body).metadata.preserved, 'Files change');
  tabs().props.onValueChange('files'); await rt.flush(); failRefresh = true;
  tabs().props.onValueChange('details'); await rt.flush();
  assert.equal(tabs().props.value, 'details'); assert.equal(saveButton().props.disabled, true);
  const before = requests.length; await saveButton().props.onClick(); assert.equal(requests.length, before, 'Even programmatic stale Save is refused');
  assert(find(node => node.type === 'fieldset' && node.props.disabled));
  failRefresh = false; wrongOwnerProjection = true;
  await find(node => node.type === 'Button' && text(node) === 'Retry Model refresh').props.onClick(); await rt.flush(); assert.equal(saveButton().props.disabled, true);
  wrongOwnerProjection = false; wrongId = true;
  await find(node => node.type === 'Button' && text(node) === 'Retry Model refresh').props.onClick(); await rt.flush(); assert.equal(saveButton().props.disabled, true);
  wrongId = false;
  await find(node => node.type === 'Button' && text(node) === 'Retry Model refresh').props.onClick(); await rt.flush(); assert.equal(saveButton().props.disabled, false);
  assert.equal(files().props.active, false, 'Files component remains mounted but inactive');
  await fields().props.onPrimaryFile({ name: 'staged.glb' }); await rt.flush();
  assert.equal(fields().props.form.filePath, 'https://fixture.invalid/staged.glb');
  tabs().props.onValueChange('files'); rt.render(); failDiscard = true;
  find(node => node.type === 'Button' && text(node) === 'Discard Changes').props.onClick(); await rt.flush();
  assert.equal(tabs().props.value, 'details'); assert.equal(fields().props.form.filePath, 'https://fixture.invalid/staged.glb', 'Failed staged-upload recovery retains the draft');
  assert(find(node => node.type === 'Dialog' && node.props.open));
  failDiscard = false;
  find(node => node.type === 'Button' && text(node) === 'Discard Changes').props.onClick(); await rt.flush();
  assert.equal(tabs().props.value, 'files'); assert.equal(fields().props.form.filePath, saved.filePath);
}
async function redirects() {
  const route = load('src/app/admin/threed/models/[id]/files/page.tsx', { 'next/navigation': {
    redirect: href => { throw { redirect: href }; }, notFound: () => { throw { notFound: true }; },
  } });
  await assert.rejects(route.default({ params: Promise.resolve({ id: '1041' }) }), error => error.redirect === '/admin/threed/models/1041?tab=files');
  for (const id of ['0', '-1', '11oops', '9007199254740992']) await assert.rejects(route.default({ params: Promise.resolve({ id }) }), error => error.notFound);
  for (const name of ['new', '[fileId]']) assert(fs.readFileSync(`src/app/admin/threed/models/[id]/files/${name}/page.tsx`, 'utf8').includes('ThreeDModelFileEditor'));
}
async function filesChecks() {
  const rt = runtime(), requests = [], busy = [];
  let active = true, resolveSave, saved = { id: 7, userId: 'owner', modelName: 'Oak', modelType: 'procedural', filePath: '', metadata: { fallbackShape: 'sphere' }, mainModelFileId: null, files: [] };
  const fallback = load('src/libraries/services/threed/models/model-fallback-core.ts', {});
  const toast = { showToast() {}, ToastComponent: null };
  const reportBusy = value => busy.push(value);
  const workspace = load('src/components/admin/threed/models/ThreeDModelFilesCRUD.tsx', {
    react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'link' },
    'react-dom': { createPortal() { throw Error('Embedded workspace must not mount a Model picker'); } },
    'lucide-react': proxy, '@/components/ui/button': proxy, '@/components/ui/badge': proxy,
    '@/components/ui/input': proxy, '@/components/ui/label': proxy, '@/components/ui/select': proxy, '@/components/ui/dialog': proxy,
    '@/components/ui/toast': { useToast: () => toast }, './ModelResourceInventory': proxy,
    './ThreeDModelAssetPreview': proxy, './ModelPreviewImageExport': proxy,
    './model-preview-requirements': { modelForPreview: value => value },
    '@/libraries/services/threed/models/model-fallback-core': fallback,
    '@/libraries/services/threed/models/model-saved-texture-fallback': { withSavedFbxTextures: (_, files) => files },
  }, { fetch: async (url, options = {}) => {
    requests.push({ url, options });
    let data;
    if (options.method === 'PATCH') {
      await new Promise(resolve => { resolveSave = resolve; });
      saved = { ...saved, ...JSON.parse(options.body) }; data = saved;
    } else if (url.includes('view=selector')) data = [{ id: 7, modelName: 'Oak', modelType: 'procedural' }];
    else if (url.includes('requirements')) data = { status: 'not_required', requirements: [] };
    else if (url === '/api/threed/model-textures') data = [];
    else { assert.equal(url, '/api/threed/models?id=7'); data = saved; }
    return { ok: true, json: async () => ({ success: true, data, pagination: { total: 1 } }) };
  } });
  rt.mount(() => workspace.ThreeDModelFilesCRUD({ initialModelId: 7, embedded: true, active, onBusyChange: reportBusy }));
  await rt.flush();
  const preview = () => nodes(rt.value).find(node => node.type === 'ThreeDModelAssetPreview');
  assert.equal(preview().props.centerAtOrigin, true);
  assert.equal(preview().props.preserveCameraOnEdit, true);
  assert(preview().props.perspective, 'Files keeps the same workspace framing as Details');
  const find = predicate => [...nodes(rt.value), ...nodes(preview().props.primaryFileControls), ...nodes(preview().props.requiredFiles)].find(predicate);
  assert(!text(rt.value).includes('Open Model record'), 'Embedded workspace omits duplicate parent navigation');
  find(node => node.props?.id === 'default-model-shape').props.onChange({ target: { value: 'box' } });
  find(node => node.props?.id === 'model-files-directory').props.onChange({ target: { value: 'custom/textures' } });
  find(node => node.type === 'Input' && node.props.placeholder === 'Filter files by name, path, or type...').props.onChange({ target: { value: 'leaf' } });
  rt.render(); active = false; rt.render(); assert.equal(preview().props.active, false);
  // Simulate an independently saved Details update while Files is inactive.
  saved = { ...saved, modelName: 'Renamed Oak', metadata: { fallbackShape: 'sphere', preserved: 'Details change' } };
  active = true; rt.render(); await rt.flush();
  assert.equal(find(node => node.props?.id === 'default-model-shape').props.value, 'box');
  assert.equal(find(node => node.props?.id === 'model-files-directory').props.value, 'custom/textures');
  assert.equal(find(node => node.type === 'Input' && node.props.placeholder === 'Filter files by name, path, or type...').props.value, 'leaf');
  assert.equal(preview().props.model.modelName, 'Renamed Oak');
  const saving = find(node => node.type === 'Button' && text(node) === 'Save shape').props.onClick();
  rt.render(); assert.equal(busy.at(-1), true);
  resolveSave(); await saving; await rt.flush(); assert.equal(busy.at(-1), false);
  assert.equal(saved.metadata.preserved, 'Details change', 'Files refresh preserves new Details metadata');
  assert.equal(saved.metadata.fallbackShape, 'box');
  const reads = requests.filter(item => item.url === '/api/threed/models?id=7' && !item.options.method);
  assert(reads.every(item => item.options.cache === 'no-store'));
  preview().props.onBusyChange(true); rt.render(); assert.equal(busy.at(-1), true, 'Appearance operations participate in the guard');
  preview().props.onBusyChange(false); rt.render(); assert.equal(busy.at(-1), false);
}

function previewChecks() {
  const rt = runtime();
  const preview = load('src/components/admin/threed/models/ThreeDModelAssetPreview.tsx', {
    react: rt.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, './model-preview-events': {}, three: proxy,
    '@react-three/fiber': { Canvas: 'canvas' }, '@react-three/drei': proxy, 'lucide-react': proxy,
    '@/components/ui/button': proxy, '@/components/threed/markers/ModelMarker3D': proxy,
    '@/libraries/services/threed/models/model-material-override-core': { readThreeDModelMaterialOverrides: () => ({ assignments: [] }) },
  }, { requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  let active = true;
  rt.mount(() => preview.ThreeDModelAssetPreview({ active, model: { id: 7, modelType: 'procedural', filePath: '' }, attachedDependencyCount: 0, dependencyCount: 0 }));
  assert.equal(nodes(rt.value).filter(node => node.type === 'canvas').length, 1);
  active = false; rt.render(); assert.equal(nodes(rt.value).filter(node => node.type === 'canvas').length, 0);
  active = true; rt.render(); assert.equal(nodes(rt.value).filter(node => node.type === 'canvas').length, 1);
}
function imageAndGeometryChecks() {
  const helpRuntime = runtime();
  const help = load('src/components/admin/threed/models/ModelFieldHelp.tsx', { react: helpRuntime.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': proxy, '@/components/ui/button': proxy, '@/components/ui/tooltip': proxy });
  helpRuntime.mount(() => help.ModelFieldHelp({ label: 'Geometry source', children: 'Retains attachments' }));
  let prevented = false;
  nodes(helpRuntime.value).find(node => node.type === 'Button').props.onClick({ preventDefault() { prevented = true; } });
  helpRuntime.render();
  assert(prevented, 'Click-open is not cancelled by the Radix trigger default click close');
  assert(nodes(helpRuntime.value).find(node => node.type === 'Tooltip').props.open);
  nodes(helpRuntime.value).find(node => node.type === 'Tooltip').props.onOpenChange(false); helpRuntime.render();
  assert.equal(nodes(helpRuntime.value).find(node => node.type === 'Tooltip').props.open, false);
  const fieldRuntime = runtime();
  const fields = load('src/components/admin/threed/models/ThreeDModelEditorFields.tsx', {
    react: fieldRuntime.react,
    './category-tree-core': require('../../components/admin/threed/models/category-tree-core.ts'),
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'link' }, 'lucide-react': proxy,
    '@/components/ui/badge': proxy, '@/components/ui/button': proxy, '@/components/ui/input': proxy,
    '@/components/ui/label': proxy, '@/components/ui/select': proxy, '@/components/ui/switch': proxy,
    './ModelFieldHelp': { ModelFieldHelp: 'help' },
    '@/libraries/services/threed/models/model-source-core': sourceCore,
    '@/libraries/services/threed/models/model-fallback-core': { MODEL_FALLBACK_SHAPES: ['box'], readModelFallbackShape: () => 'box', setModelFallbackShape: value => value },
    '@/libraries/services/threed/models/model-lighting-core': { readModelLightBoost: () => 0, setModelLightBoost: value => value },
  });
  let draft = { modelName: 'Character', modelType: 'fbx', mainModelFileId: '81', filePath: 'https://fixture.invalid/model.fbx', thumbnailUrl: 'https://fixture.invalid/old.png', metadata: '{}', usedByCharacters: true, categoryIds: [], scale: '0.37' };
  let uploads = 0;
  const props = () => ({ mode: 'edit', form: draft, setForm: update => { draft = update(draft); }, categories: [], files: [{ id: 81, fileType: 'model', fileName: 'model.fbx', filePath: draft.filePath, fileSize: 123 }], isSubmitting: false, uploadingPrimary: false, uploadingThumbnail: false, onThumbnail: () => uploads++, onPrimaryFile() {} });
  const renderImage = () => fields.ThreeDModelPreviewImageFields(props());
  let tree = renderImage();
  const find = (tree, predicate) => nodes(tree).find(predicate);
  assert(find(tree, node => node.type === 'details' && text(node).includes('Image location')));
  assert.equal(find(tree, node => node.type === 'details').props.open, undefined, 'URL starts collapsed');
  find(tree, node => node.props?.id === 'edit-thumbnailUrl').props.onChange({ target: { value: 'https://fixture.invalid/new.png' } });
  assert.equal(draft.thumbnailUrl, 'https://fixture.invalid/new.png');
  assert.equal(draft.scale, '0.37');
  tree = renderImage();
  find(tree, node => node.type === 'Button' && text(node).includes('Remove')).props.onClick();
  assert.equal(draft.thumbnailUrl, ''); assert.equal(uploads, 0, 'Remove only changes the draft');
  const target = { files: [{ name: 'image.png' }], value: 'selected' };
  find(renderImage(), node => node.props?.id === 'edit-thumbnail-upload').props.onChange({ target });
  assert.equal(uploads, 1); assert.equal(target.value, '');
  tree = fields.ThreeDModelPreviewImageFields({ ...props(), uploadingThumbnail: true });
  assert(find(tree, node => node.props?.id === 'edit-thumbnailUrl').props.disabled);
  tree = fields.ThreeDModelEditorFields({ ...props(), showPreviewImage: false });
  const geometry = find(tree, node => node.props?.title === 'Geometry');
  assert(geometry && text(geometry).includes('Primary geometry file'));
  assert.equal(find(geometry, node => node.type === 'Select' && nodes(node).some(child => child.props?.id === 'edit-geometrySource')).props.disabled, false, 'Character source is explicitly switchable');
  assert(!find(tree, node => node.props?.id === 'edit-modelType'), 'Edit has a format badge instead of a disabled format selector');
  assert(text(geometry).includes('FBX')); assert(text(geometry).includes('assigned Characters'));
  assert(!find(geometry, node => node.type === 'SelectItem' && node.props.value === 'procedural' && text(node).includes('No active file')));
  draft = { ...draft, usedByCharacters: false };
  tree = fields.ThreeDModelEditorFields({ ...props(), showPreviewImage: false });
  const original = { ...draft };
  const sourceSelector = find(tree, node => node.type === 'Select' && nodes(node).some(child => child.props?.id === 'edit-geometrySource'));
  sourceSelector.props.onValueChange('shape');
  assert.equal(draft.modelType, original.modelType); assert.equal(draft.mainModelFileId, original.mainModelFileId); assert.equal(draft.filePath, original.filePath);
  assert.equal(JSON.parse(draft.metadata).activeSource, 'shape');
  tree = fields.ThreeDModelEditorFields({ ...props(), showPreviewImage: false });
  assert.equal(nodes(tree).filter(node => node.props?.id === 'edit-fallbackShape').length, 1);
  find(tree, node => node.type === 'Select' && nodes(node).some(child => child.props?.id === 'edit-geometrySource')).props.onValueChange('character');
  assert.equal(draft.filePath, original.filePath); assert.equal(JSON.parse(draft.metadata).activeSource, 'character');
  tree = fields.ThreeDModelEditorFields({ ...props(), mode: 'create', form: { ...draft, usedByCharacters: false, filePath: '' } });
  assert(find(tree, node => node.props?.id === 'create-modelType'), 'Create format selection remains available');
  const categories = [
    { id: 2, parentId: 1, name: 'Child', slug: 'child', description: null, sortOrder: 1, isActive: true },
    { id: 1, parentId: null, name: 'Parent', slug: 'parent', description: null, sortOrder: 0, isActive: true },
  ];
  for (const mode of ['create', 'edit']) {
    draft = { ...draft, categoryIds: [2] };
    fieldRuntime.mount(() => fields.ThreeDModelEditorFields({ ...props(), mode, categories, showPreviewImage: false }));
    tree = fieldRuntime.value;
    const section = find(tree, node => node.type === 'details' && text(node).startsWith('Categories'));
    assert.equal(section.props.open, undefined, 'Outer Categories remains collapsed');
    assert(text(find(section, node => node.type === 'summary')).includes('Child'), 'Assigned draft names remain visible');
    const list = () => find(fieldRuntime.value, node => node.props?.['aria-label'] === 'Model category hierarchy');
    assert.deepEqual(nodes(list()).filter(node => node.type === 'label').map(node => text(node).trim()), ['Parent', 'Child']);
    assert.deepEqual(nodes(list()).filter(node => node.type === 'li').map(node => node.props.style.paddingLeft), [0, 20]);
    const collapse = () => find(list(), node => node.props?.['aria-label'] === 'Collapse Parent');
    collapse().props.onClick(); fieldRuntime.render();
    assert.equal(nodes(list()).filter(node => node.type === 'input').length, 1);
    assert.deepEqual(draft.categoryIds, [2], 'Collapsing retains child assignment');
    find(list(), node => node.props?.['aria-label'] === 'Expand Parent').props.onClick(); fieldRuntime.render();
    const checkboxes = () => nodes(list()).filter(node => node.type === 'input');
    checkboxes()[0].props.onChange(); fieldRuntime.render();
    assert.deepEqual(Array.from(draft.categoryIds), [2, 1], 'Parent selection is independent');
    checkboxes()[1].props.onChange(); fieldRuntime.render();
    assert.deepEqual(Array.from(draft.categoryIds), [1], 'Child deselection does not clear the parent');
  }
}
(async () => {
  await controllerChecks(); await editorChecks(); await filesChecks(); await redirects(); previewChecks(); imageAndGeometryChecks();
  console.log('Model editor tabs: draft/save/discard/history/busy/owner refresh/stale-save/redirect/Canvas checks passed (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
