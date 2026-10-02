// Actual PATCH and resource presentation with offline auth/DB/React doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(compile(file), { exports, console, Date, URL, Uint8Array, TextDecoder, ...globals,
    require(name) { assert(name in mocks, `Unexpected import: ${name}`); return mocks[name]; } });
  return exports;
}
const edit = load('src/libraries/services/threed/models/model-file-edit-core.ts', {});
const schemaText = fs.readFileSync('src/libraries/schema/threed/index.ts', 'utf8');
for (const type of edit.MODEL_FILE_TEXTURE_TYPES) assert(schemaText.includes(`'${type}'`), `Missing schema Texture role ${type}`);
for (const body of [{}, [], null, { filePath: 'new' }, { relativePath: 'new' }, { fileName: 'new' }, { fileType: 'model' },
  { textureType: 'map' }, { textureType: 3 }, { loadOrder: -1 }, { loadOrder: 0.5 }, { loadOrder: '0' }, { loadOrder: 2147483648 }]) assert.throws(() => edit.parseModelFileEdit(body));
const schema = new Proxy({}, { get: (_, table) => new Proxy({ table }, { get: (_, field) => field === 'table' ? table : `${table}.${String(field)}` }) });
const eq = (field, value) => ({ field, value });
const and = (...clauses) => ({ clauses });
let signedIn = true, modelOwner = 'owner', fileOwner = 'owner', parentId = 7, fileType = 'texture', writes = [], reads = [];
const savedIdentity = { filePath: 'https://shared.example/leaf.png', fileName: 'leaf.png', relativePath: 'textures/leaf.png', fileSize: 4 };
const matches = (row, predicate) => predicate.clauses.every(({ field, value }) => row[field.split('.')[1]] === value);
const db = { transaction: async callback => callback({
  select() {
    let table, predicate;
    const chain = { from(value) { table = value.table; return chain; }, where(value) { predicate = value; return chain; }, limit() { return chain; }, for() { return chain; },
      then(resolve, reject) {
        reads.push({ table, predicate });
        const row = table === 'threedModels' ? { id: 7, userId: modelOwner } : { id: 12, userId: fileOwner, modelId: parentId, fileType, ...savedIdentity };
        return Promise.resolve(matches(row, predicate) ? [row] : []).then(resolve, reject);
      } };
    return chain;
  },
  update(table) { return { set(values) { return { where(predicate) { return { returning: async () => {
    writes.push({ table: table.table, values, predicate }); return [{ id: 12, userId: fileOwner, modelId: parentId, fileType, ...savedIdentity, ...values }];
  } }; } }; } }; },
}) };
const route = load('src/app/api/threed/models/[id]/files/[fileId]/route.ts', {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  'drizzle-orm': { eq, and }, '@/libraries/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null },
  '@/libraries/db/client': { db }, '@/libraries/schema/threed': schema,
  '@/libraries/services/threed/models/model-file-edit-core': edit,
});
async function patch(body, ids = { id: '7', fileId: '12' }, contentType = 'application/json') {
  writes = []; reads = [];
  return route.PATCH({ headers: { get: () => contentType }, json: async () => body }, { params: Promise.resolve(ids) });
}
const jsx = (type, props) => ({ type, props });
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object') return [];
  return [value, ...nodes(value.props?.children)];
}
function text(value) {
  if (Array.isArray(value)) return value.map(text).join(' ');
  return value && typeof value === 'object' ? text(value.props?.children) : String(value ?? '');
}
const inventory = load('src/components/admin/threed/models/ModelResourceInventory.tsx', { 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'link' } });
const companion = load('src/libraries/services/threed/models/model-companion-core.ts', { './model-obj-core.ts': {} });
const encode = object => new TextEncoder().encode(JSON.stringify(object));
let state = [], cursor = 0, requests = [], navigation = [], failUpload = false, failPatch = false;
const parent = { id: 7, userId: 'owner', modelName: 'Tree', modelType: 'procedural', mainModelFileId: null, filePath: '', files: [] };
const editorModule = load('src/components/admin/threed/models/ThreeDModelFileEditor.tsx', {
  react: {
    useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useEffect() {}, useMemo: calculate => calculate(),
  },
  'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'link' },
  'next/navigation': { useRouter: () => ({ push: value => navigation.push(value) }) },
  'lucide-react': { FolderOpen: 'icon' }, '@/components/admin/layout/AdminWorkspaceHeader': { AdminWorkspaceHeader: 'header' },
  '@/components/ui/button': { Button: 'button' }, '@/components/ui/input': { Input: 'input' }, '@/components/ui/label': { Label: 'label' },
  '@/libraries/services/threed/models/model-file-edit-core': edit,
  '@/libraries/services/threed/models/model-companion-core': companion,
  '@/libraries/services/threed/models/model-file-integrity': { runtimeModelTypeFromFileName: name => /\.(glb|gltf|fbx|obj)$/i.exec(name)?.[1] ?? null },
  './ThreeDModelAssetPreview': { ThreeDModelAssetPreview: 'canvas' }, './ThreeDModelImportPreview': { ThreeDModelImportPreview: 'candidate-canvas' },
  './model-preview-requirements': { modelForPreview: value => value }, './ModelResourceInventory': { ModelResourceInventory: 'inventory' },
  './ModelFileDependencyInspector': { ModelFileDependencyInspector: 'inspector' },
}, { AbortController, FormData, fetch: async (url, options) => {
  requests.push({ url, options });
  const fails = options.method === 'PATCH' ? failPatch : failUpload && options.body.get('files').name === 'bad.png';
  return { ok: !fails, json: async () => ({ success: !fails, error: 'Fixture save failure' }) };
} });
const renderEditor = (model = parent, fileId = null, reset = true) => {
  if (reset) { state = [model, false, '', '', '', false, '0', '', [], 'textures', 0, { status: 'not_required', requirements: [] }, null, false, 0, [], '']; requests = []; navigation = []; }
  cursor = 0;
  return editorModule.ThreeDModelFileEditor({ modelId: 7, fileId });
};
const find = (tree, predicate) => nodes(tree).find(predicate);
let legacyQuery = '', redirects = [];
const legacy = load('src/app/admin/threed/model-files/page.tsx', {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  react: { Suspense: 'suspense', useState: initial => [initial, () => {}], useEffect: callback => callback() },
  'next/navigation': { useSearchParams: () => new URLSearchParams(legacyQuery), useRouter: () => ({ replace: value => redirects.push(value), push: value => redirects.push(value) }) },
  'lucide-react': new Proxy({}, { get: (_, key) => key }),
  '@/components/admin/layout/AdminWorkspaceHeader': { AdminWorkspaceHeader: 'header', AdminWorkspaceLink: 'link' },
  '@/components/admin/threed/models/ThreeDModelFilesCRUD': { ThreeDModelFilesCRUD: 'picker' },
});
function verifyLegacyNavigation() {
  function render(query) {
    legacyQuery = query; redirects = [];
    const page = legacy.default(); const inner = page.props.children;
    return inner.type(inner.props);
  }
  const tree = render(''); const picker = find(tree, node => node.type === 'picker');
  assert(picker); assert.equal(picker.props.initialModelId, null); assert.equal(redirects.length, 0, 'Bare route requires a Model choice');
  picker.props.onSelectModel(37); assert.equal(redirects.at(-1), '/admin/threed/models/37/files');
  render('modelId=37'); assert.equal(redirects.at(-1), '/admin/threed/models/37/files');
  render('modelId=37&fileId=92'); assert.equal(redirects.at(-1), '/admin/threed/models/37/files/92');
  const invalid = render('modelId=37oops'); assert(find(invalid, node => node.type === 'picker')); assert.equal(redirects.length, 0);
}
async function verifyEditor() {
  let tree = renderEditor();
  assert(find(tree, node => node.type === 'canvas'), 'Add has a parent Canvas');
  const image = new File(['image'], 'leaf.png');
  find(tree, node => node.props?.id === 'new-model-files').props.onChange({ target: { files: [image] } });
  assert.equal(requests.length, 0, 'Selection must not upload');
  tree = renderEditor(parent, null, false);
  find(tree, node => node.type === 'button' && text(node) === 'Cancel').props.onClick();
  assert.equal(requests.length, 0, 'Cancel must not mutate or delete'); assert.equal(navigation.at(-1), '/admin/threed/models/7/files');
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(requests.length, 1); assert.equal(requests[0].options.body.get('modelId'), '7');
  assert.equal(requests[0].options.body.get('relativePaths'), 'textures/leaf.png'); assert.equal(navigation.at(-1), '/admin/threed/models/7/files');
  tree = renderEditor();
  find(tree, node => node.props?.id === 'new-model-files').props.onChange({ target: { files: [new File(['geometry'], 'candidate.obj'), new File(['material'], 'candidate.mtl')] } });
  tree = renderEditor(parent, null, false);
  const candidate = find(tree, node => node.type === 'candidate-canvas');
  assert(candidate); assert.equal(candidate.props.localSnapshot.attachments[0].relativePath, 'textures/candidate.mtl');
  tree = renderEditor({ ...parent, files: [{ id: 2, fileName: 'leaf.png', relativePath: 'textures/leaf.png' }] });
  find(tree, node => node.props?.id === 'new-model-files').props.onChange({ target: { files: [image] } });
  tree = renderEditor({ ...parent, files: [{ id: 2, fileName: 'leaf.png', relativePath: 'textures/leaf.png' }] }, null, false);
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(requests.length, 0, 'Stage 2 must not replace existing paths');
  tree = renderEditor();
  find(tree, node => node.props?.id === 'new-model-files').props.onChange({ target: { files: [image, new File(['bad'], 'bad.png')] } });
  tree = renderEditor(parent, null, false); failUpload = true;
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(requests.length, 2); assert.equal(state[8][0].saved, true); assert.equal(state[8][1].saved, false); assert.equal(navigation.length, 0);
  failUpload = false; tree = renderEditor(parent, null, false);
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(requests.length, 3, 'Retry uploads only the failed file'); assert.equal(requests[2].options.body.get('files').name, 'bad.png');
  const file = { id: 12, modelId: 7, userId: 'owner', fileName: 'leaf.png', relativePath: 'textures/leaf.png', filePath: 'https://shared.example/leaf.png', fileType: 'texture', textureType: 'baseColor', loadOrder: 0 };
  const editedParent = { ...parent, files: [file] };
  tree = renderEditor(editedParent, 12); assert(find(tree, node => node.type === 'canvas'), 'Edit has a Canvas');
  find(tree, node => node.props?.id === 'file-load-order').props.onChange({ target: { value: '4' } });
  find(tree, node => node.props?.id === 'file-texture-type').props.onChange({ target: { value: 'normalMap' } });
  tree = renderEditor(editedParent, 12, false); failPatch = true;
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(state[6], '4'); assert.equal(state[7], 'normalMap'); assert.equal(navigation.length, 0, 'Failed edit retains the draft');
  assert.equal(requests[0].url, '/api/threed/models/7/files/12'); assert.deepEqual(JSON.parse(requests[0].options.body), { loadOrder: 4, textureType: 'normalMap' });
  failPatch = false; tree = renderEditor(editedParent, 12, false);
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert(state[14] > 0, 'Successful edit reloads saved values'); assert.equal(navigation.length, 0, 'Successful edit retains the File URL');
}
(async () => {
  signedIn = false;
  assert.equal((await patch({ loadOrder: 1 })).status, 401); assert.equal(reads.length, 0);
  signedIn = true;
  for (const ids of [{ id: '7x', fileId: '12' }, { id: '7', fileId: '-1' }, { id: '7', fileId: '9007199254740992' }]) assert.equal((await patch({ loadOrder: 1 }, ids)).status, 400);
  assert.equal((await patch({ loadOrder: 1 }, undefined, 'text/plain')).status, 415);
  assert.equal((await patch({ loadOrder: 1, filePath: 'replacement' })).status, 400); assert.equal(writes.length, 0);
  modelOwner = 'another-owner'; assert.equal((await patch({ loadOrder: 1 })).status, 404); assert.equal(writes.length, 0);
  modelOwner = 'owner'; fileOwner = 'another-owner'; assert.equal((await patch({ loadOrder: 1 })).status, 404); assert.equal(writes.length, 0);
  fileOwner = 'owner'; parentId = 8; assert.equal((await patch({ loadOrder: 1 })).status, 404); assert.equal(writes.length, 0);
  parentId = 7; fileType = 'binary'; assert.equal((await patch({ textureType: null })).status, 422); assert.equal(writes.length, 0);
  assert.equal((await patch({ loadOrder: 0 })).status, 200);
  fileType = 'texture';
  for (const textureType of [...edit.MODEL_FILE_TEXTURE_TYPES, null]) {
    const result = await patch({ textureType, loadOrder: 2147483647 }); assert.equal(result.status, 200);
    for (const [key, value] of Object.entries(savedIdentity)) assert.equal(result.body.data[key], value, `Identity changed: ${key}`);
    assert.deepEqual(Object.keys(writes[0].values).sort(), ['loadOrder', 'textureType', 'updatedAt']);
    assert.deepEqual(writes[0].predicate.clauses.map(clause => clause.field).sort(), ['threedModelFiles.id', 'threedModelFiles.modelId', 'threedModelFiles.userId']);
  }
  const model = { id: 7, modelName: 'Tree', modelType: 'gltf', mainModelFileId: 1,
    files: [{ id: 1, fileName: 'tree.gltf', fileType: 'model' }, { id: 2, fileName: 'leaf.png', fileType: 'texture', filePath: 'shared-url' }],
    materialAssignments: [{ targetKey: 'mesh', channel: 'baseColor', textureId: 4, textureName: 'Leaf', textureUrl: 'shared-url' }] };
  const props = { model, audit: { status: 'analyzed', requirements: [{ kind: 'texture', relativePath: 'missing.png', satisfied: false }], embeddedResources: { status: 'inspected', buffers: 1, images: 2 } }, loading: false, error: null,
    textureLibrary: [{ id: 4, textureName: 'Leaf', filePath: 'shared-url' }, { id: 5, textureName: 'Unlinked suggestion', filePath: 'unused' }] };
  const tree = inventory.ModelResourceInventory(props), links = nodes(tree).filter(node => node.type === 'link');
  assert.equal(links.map(node => node.props.href).join('|'), '/admin/threed/models/7/files/new|/admin/threed/models/7/files/1|/admin/threed/models/7/files/2');
  assert(text(tree).includes('missing.png')); assert(text(tree).includes('not a saved attachment'));
  assert(!links.some(node => text(node).includes('missing.png'))); assert(!text(tree).includes('Unlinked suggestion'));
  assert(text(tree).includes('1 embedded buffer')); assert(text(tree).includes('2 embedded image'));
  assert(text(inventory.ModelResourceInventory({ ...props, model: { ...model, modelType: 'procedural', mainModelFileId: null, files: [] }, audit: { status: 'not_required', requirements: [] } })).includes('Procedural shape'));
  assert(text(inventory.ModelResourceInventory({ ...props, error: 'Inspection failed' })).includes('Inspection failed'));
  const gltf = { buffers: [{ uri: 'data:application/octet-stream;base64,AAAA' }, { uri: 'external.bin' }], bufferViews: [{ buffer: 0 }, { buffer: 1 }], images: [{ bufferView: 0 }, { bufferView: 1 }, { uri: 'data:image/png;base64,AAAA' }, { uri: 'leaf.png' }] };
  const summary = companion.inspectThreeDModelEmbeddedResources('tree.gltf', encode(gltf));
  assert.equal(summary.buffers, 1); assert.equal(summary.images, 2, 'External-buffer images must not count as embedded');
  assert.equal(companion.inspectThreeDModelEmbeddedResources('tree.fbx', new Uint8Array()).status, 'not_inspected');
  const json = encode({ buffers: [{ byteLength: 4 }], bufferViews: [{ buffer: 0 }], images: [{ bufferView: 0 }] });
  const padded = Math.ceil(json.length / 4) * 4; const bytes = new Uint8Array(20 + padded); bytes.fill(32, 20);
  const view = new DataView(bytes.buffer); view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, bytes.length, true); view.setUint32(12, padded, true); view.setUint32(16, 0x4e4f534a, true); bytes.set(json, 20);
  assert.equal(companion.inspectThreeDModelEmbeddedResources('tree.glb', bytes).images, 1);
  verifyLegacyNavigation();
  await verifyEditor();
  console.log('PASS Model File workspace: strict settings, authentication, File/parent ownership, exact Model context, identity preservation, saved-vs-missing inventory and embedded declarations');
})().catch(error => { console.error(error); process.exitCode = 1; });
