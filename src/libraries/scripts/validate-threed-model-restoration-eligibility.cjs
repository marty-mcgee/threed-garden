// Offline actual-handler/service/core/UI fixtures. No real database or storage adapters are loaded.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const blob = require('@vercel/blob');

const root = path.resolve(__dirname, '../../..');
const serviceDir = 'src/libraries/services/threed/models/';
const coreFile = `${serviceDir}model-file-restoration-eligibility-core.ts`;
const serverFile = `${serviceDir}model-file-restoration-eligibility.ts`;
const routeFile = 'src/app/api/threed/models/[id]/files/[fileId]/restoration-eligibility/route.ts';
const editorFile = 'src/components/admin/threed/models/ThreeDModelFileEditor.tsx';
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(compiled, {
    exports, console, Date, URL, Uint8Array, ArrayBuffer, DataView, TextEncoder, TextDecoder,
    AbortController, DOMException, performance, setTimeout, clearTimeout, Buffer,
    ...globals,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'node:crypto' || name === 'crypto') return crypto;
      if (name === 'server-only') return {};
      if (name.startsWith('./')) {
        const target = path.relative(root, path.resolve(root, path.dirname(file), name));
        const candidates = [target, `${target}.ts`];
        const found = candidates.find(value => fs.existsSync(path.join(root, value)));
        assert(found, `Missing local import: ${name}`);
        return load(found, mocks, globals);
      }
      throw new Error(`Unexpected adapter import (live access forbidden): ${name}`);
    },
  }, { filename: file });
  return exports;
}
const clone = value => JSON.parse(JSON.stringify(value));
const encode = value => new TextEncoder().encode(JSON.stringify(value));
const owner = 'owner';
const host = 'fixturestore.public.blob.vercel-storage.com';
const token = 'vercel_blob_rw_fixturestore_fixturecredential';
const attachmentUrl = `https://${host}/threed/users/${owner}/models/model-7/attachments/textures/11111111-1111-4111-8111-111111111111/leaf.png`;
const headResponse = () => ({ url: attachmentUrl, pathname: new URL(attachmentUrl).pathname.slice(1), size: 100,
  contentType: 'image/png', uploadedAt: new Date('2026-10-02T12:00:00.000Z') });
const stamp = '2026-10-02T12:00:00.123456';
const context = { userId: owner, modelId: 7, fileId: 12, storeId: 'fixturestore', storeHost: host };
function snapshot() {
  const model = { id: 7, userId: owner, modelName: 'Tree', modelType: 'procedural', mainModelFileId: null,
    thumbnailUrl: null, metadata: {}, lodLevels: [], createdAt: stamp, updatedAt: stamp };
  const file = { id: 12, userId: owner, modelId: 7, fileName: 'leaf.png', relativePath: 'textures/leaf.png',
    fileType: 'texture', textureType: 'baseColor', filePath: attachmentUrl, fileSize: 100, loadOrder: 0,
    metadata: {}, createdAt: stamp, updatedAt: stamp };
  return { model, file, files: [file], references: { files: [file], textures: [], models: [model], markers: [], projectAssets: [], projects: [] } };
}
function noPermission(value) {
  assert.equal(value.restoreAllowed, false);
  assert.equal(value.candidateValidation, 'not_performed');
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
const settle = () => new Promise(resolve => setImmediate(resolve));
async function verifyEditor() {
  let state, refs, cursor, refCursor, requests, navigation, reply, pendingReply, httpStatus, effects;
  const editor = load(editorFile, {
    react: {
      useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
      useRef(initial) { const index = refCursor++; if (!(index in refs)) refs[index] = { current: initial }; return refs[index]; },
      useEffect(callback, dependencies) { effects.push({ callback, dependencies }); }, useMemo: calculate => calculate(),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'link' },
    'next/navigation': { useRouter: () => ({ push: value => navigation.push(value) }) },
    'lucide-react': { FolderOpen: 'icon' },
    '@/components/admin/layout/AdminWorkspaceHeader': { AdminWorkspaceHeader: 'header' },
    '@/components/ui/button': { Button: 'button' }, '@/components/ui/input': { Input: 'input' }, '@/components/ui/label': { Label: 'label' },
    '@/components/ui/badge': { Badge: 'badge' },
    '@/libraries/services/threed/models/model-file-edit-core': load(`${serviceDir}model-file-edit-core.ts`),
    '@/libraries/services/threed/models/model-companion-core': load(`${serviceDir}model-companion-core.ts`),
    '@/libraries/services/threed/models/model-file-integrity': { runtimeModelTypeFromFileName: () => null },
    './ThreeDModelAssetPreview': { ThreeDModelAssetPreview: 'canvas' },
    './ThreeDModelImportPreview': { ThreeDModelImportPreview: 'candidate-canvas' },
    './model-preview-requirements': { modelForPreview: value => value },
    './ModelResourceInventory': { ModelResourceInventory: 'inventory' },
    './ModelFileDependencyInspector': { ModelFileDependencyInspector: 'inspector' },
  }, { fetch: async (url, options) => {
    requests.push({ url, options });
    if (options.method === 'PATCH') return { ok: false, status: 503, json: async () => ({ success: false, error: 'Fixture failure' }) };
    if (pendingReply) return await pendingReply;
    return { ok: httpStatus === 200, status: httpStatus, json: async () => reply };
  } });
  const saved = snapshot();
  const parent = { ...saved.model, filePath: '', files: saved.files };
  const observation = {
    modelId: 7, fileId: 12, observedAt: '2026-10-02T19:00:00.000Z', revision: 'owned-only-hash',
    state: 'observed_candidate', availability: 'missing', restoreAllowed: false, candidateValidation: 'not_performed',
    checks: { target: 'clear', references: 'clear', storage: 'clear', dependencies: 'clear', consistency: 'unchanged' },
    blockers: [], uncertainty: [{ code: 'observation_only', message: 'References can change after observation.' }],
  };
  function reset() {
    state = [parent, false, '', '', '', false, '8', 'normalMap', [], 'textures', 0,
      { status: 'not_required', requirements: [] }, null, false, 0, [], ''];
    refs = []; requests = []; navigation = []; pendingReply = null; httpStatus = 200; effects = [];
    reply = { success: true, restoreAllowed: false, data: clone(observation) };
  }
  function render(modelId = 7, fileId = 12) { cursor = 0; refCursor = 0; effects = []; return editor.ThreeDModelFileEditor({ modelId, fileId }); }
  const button = tree => nodes(tree).find(node => node.type === 'button' && text(node) === 'Check restoration eligibility');
  reset(); let tree = render(); render(); render();
  assert.equal(requests.length, 0, 'Rendering must not call diagnostics');
  assert(button(tree)); assert(nodes(tree).some(node => node.type === 'canvas'));
  assert(!nodes(tree).some(node => node.type === 'button' && /\bRestore\b/.test(text(node))), 'No Restore control');
  button(tree).props.onClick(); await settle(); tree = render();
  assert.equal(requests.length, 1); assert.equal(requests[0].url, '/api/threed/models/7/files/12/restoration-eligibility');
  assert.equal(requests[0].options.method, 'GET'); assert.equal(requests[0].options.cache, 'no-store');
  assert(!requests[0].options.body); assert(text(tree).includes('Missing (observed)'));
  assert(text(tree).includes(observation.observedAt)); assert(text(tree).includes('Blockers'));
  assert(text(tree).includes('Uncertainty and limits')); assert(text(tree).includes('cannot authorize restoration'));
  assert.equal(state[6], '8'); assert.equal(state[7], 'normalMap', 'Check preserves settings draft');
  render(); assert.equal(requests.length, 1, 'Results do not automatically recheck');
  for (const [status, availability] of [['blocked', 'present'], ['unknown', 'unknown'], ['stale', 'missing']]) {
    reply.data = { ...clone(observation), state: status, availability, blockers: [{ code: 'shared_reference', message: 'A saved resource references this image.' }] };
    button(render()).props.onClick(); await settle(); tree = render();
    assert(text(tree).includes('A saved resource references this image.'));
    assert(text(tree).includes(observation.observedAt));
  }
  for (const invalid of [{ ...observation, restoreAllowed: true }, { ...observation, modelId: 99 }, { ...observation, observedAt: 'bad' }]) {
    reply = { success: true, restoreAllowed: false, data: invalid };
    button(render()).props.onClick(); await settle();
    assert(text(render()).includes('incomplete or mismatched observation'));
  }
  reply = { success: true, restoreAllowed: true, data: observation };
  button(render()).props.onClick(); await settle(); assert(text(render()).includes('incomplete or mismatched observation'));
  for (const status of [401, 404, 503]) {
    httpStatus = status; reply = { success: false, restoreAllowed: false, error: 'SECRET foreign-owner-url' };
    button(render()).props.onClick(); await settle(); tree = render();
    assert(text(tree).includes('Unknown')); assert(!text(tree).includes('SECRET'));
  }
  reset(); tree = render();
  let resolveReply;
  pendingReply = new Promise(resolve => { resolveReply = resolve; });
  button(tree).props.onClick(); tree = render(); assert(button(tree).props.disabled);
  render(8, 12); resolveReply({ ok: true, json: async () => reply }); await settle();
  assert.equal(state[17], null, 'Context change suppresses late observation');
  reset(); tree = render();
  pendingReply = new Promise(resolve => { resolveReply = resolve; });
  button(tree).props.onClick(); tree = render();
  nodes(tree).find(node => node.type === 'button' && text(node) === 'Cancel').props.onClick();
  assert(requests[0].options.signal.aborted); assert.equal(navigation.at(-1), '/admin/threed/models/7?tab=files');
  resolveReply({ ok: true, json: async () => reply }); await settle();
  assert.equal(state[17], null, 'Cancellation suppresses late observation');
  reset(); tree = render();
  pendingReply = new Promise(resolve => { resolveReply = resolve; });
  button(tree).props.onClick(); tree = render();
  await nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert(requests[0].options.signal.aborted, 'Saving settings cancels the obsolete observation');
  assert.equal(state[6], '8'); assert.equal(state[7], 'normalMap');
  resolveReply({ ok: true, json: async () => reply }); await settle();
  assert.equal(state[17], null, 'Failed settings save cannot resurrect late observations');
  reset(); tree = render();
  const unmount = effects.find(effect => effect.dependencies?.[0] === '7:12:0').callback();
  assert.equal(requests.length, 0, 'Eligibility lifecycle effect makes no request');
  pendingReply = new Promise(resolve => { resolveReply = resolve; });
  button(tree).props.onClick(); unmount();
  assert(requests[0].options.signal.aborted, 'Unmount aborts diagnostics');
  resolveReply({ ok: true, json: async () => reply }); await settle();
  assert.equal(state[17], null, 'Unmount suppresses late observation');
  reset(); assert(!button(render(7, null)), 'Add form does not diagnose an unsaved candidate');
}
async function verifyCore() {
  const core = load(coreFile, { '@vercel/blob': blob });
  const base = snapshot();
  assert.equal(core.inspectSnapshot(base, context).target, 'clear');
  assert.equal(core.inspectSnapshot(base, context).references, 'clear');
  assert(core.isOwnedRestorationAttachmentUrl(attachmentUrl, null, context));
  for (const url of [attachmentUrl + '?x=1', attachmentUrl + '#alias', attachmentUrl.replace(host, 'foreign.public.blob.vercel-storage.com'),
    attachmentUrl.replace('/model-7/', '/model-8/'), attachmentUrl.replace('/owner/', '/foreign/'), attachmentUrl.replace('/attachments/', '/primary/'),
    attachmentUrl.replace('11111111-1111-4111-8111-111111111111/', ''), attachmentUrl.replace('https:', 'http:'),
    attachmentUrl.replace(host, host + ':443'), attachmentUrl + '?', attachmentUrl + '#']) {
    assert(!core.isOwnedRestorationAttachmentUrl(url, null, context), `Unproved target accepted: ${url}`);
  }
  const revision = core.fingerprintOwnedSource(base);
  for (const change of [value => { value.file.updatedAt = '2026-10-02T12:00:00.123457'; },
    value => { value.file.filePath += '-changed-without-timestamp'; }, value => { value.file.loadOrder = 1; }]) {
    const changed = clone(base); change(changed);
    assert.notEqual(core.fingerprintOwnedSource(changed), revision, 'Source fingerprints preserve microseconds and complete bindings');
  }
  const aliases = [attachmentUrl + '?download=1#fragment', attachmentUrl.replace('https://' + host, 'https://' + host.toUpperCase()),
    attachmentUrl.replace('/leaf.png', '/%6ceaf.png'), 'inert text ' + attachmentUrl, encodeURIComponent(attachmentUrl)];
  for (const table of Object.keys(base.references)) for (const alias of aliases) {
    const changed = clone(base);
    changed.references[table].push({ id: 900, userId: 'FOREIGN_OWNER_SECRET', isActive: false,
      metadata: { unknownVersion: 999, nested: [{ direct: alias }] } });
    const finding = core.inspectSnapshot(changed, context);
    assert(finding.blockers.length, `Missed ${table} URL alias`);
    assert(!JSON.stringify(finding.blockers).includes('FOREIGN_OWNER_SECRET'), 'Blockers reveal no foreign identity');
    assert(!JSON.stringify(finding.blockers).includes(attachmentUrl), 'Blockers reveal no foreign resource URL');
    assert.notEqual(core.fingerprintGlobalReferences(changed), core.fingerprintGlobalReferences(base));
  }
  const ownMetadata = clone(base); ownMetadata.file.metadata = { direct: attachmentUrl };
  ownMetadata.references.files = [ownMetadata.file];
  assert(core.inspectSnapshot(ownMetadata, context).blockers.length, 'Only authoritative target URL is exempt');
  const primary = clone(base); primary.references.models.push({ id: 999, userId: 'foreign', mainModelFileId: 12 });
  assert.equal(core.inspectSnapshot(primary, context).target, 'blocked', 'Any primary FK excludes target');
  for (const field of ['userId', 'modelId', 'id']) {
    const bad = clone(base); bad.file[field] = field === 'userId' ? 'foreign' : 99;
    assert.throws(() => core.inspectSnapshot(bad, context));
  }
  const collision = clone(base); collision.files.push({ ...collision.file, id: 13, relativePath: 'different/LEAF.PNG', fileName: 'LEAF.PNG' });
  assert(core.inspectSnapshot(collision, context).blockers.some(value => value.code === 'PATH_AMBIGUOUS'));
  const legacy = clone(base); legacy.files.push({ id: 14, modelId: 7, userId: null, fileType: 'model', fileName: 'legacy.fbx', filePath: 'https://unknown.example/legacy.fbx' });
  legacy.references.files = legacy.files;
  assert.equal(core.inspectSnapshot(legacy, context).references, 'unknown', 'Uncertain legacy attachment ownership cannot pass');
  const malformed = clone(base); malformed.references.projects.push({ id: 9, metadata: { bad: 'https://bad.blob.vercel-storage.com/%zz' } });
  assert.equal(core.inspectSnapshot(malformed, context).references, 'unknown');
  const oversized = clone(base); oversized.references.projects = Array.from({ length: 5001 }, (_, id) => ({ id }));
  assert.throws(() => core.validateSnapshotBounds(oversized));
  const deep = clone(base); let current = deep.file.metadata;
  for (let i = 0; i < 35; i++) current = current.next = {};
  deep.references.files = [deep.file]; assert.throws(() => core.validateSnapshotBounds(deep));
  const manyNodes = clone(base); manyNodes.references.projects = [{ id: 1, config: Array(50001).fill(null) }];
  assert.throws(() => core.validateSnapshotBounds(manyNodes));
  const huge = clone(base); huge.references.projects = [{ id: 1, config: 'x'.repeat(16 * 1024 * 1024) }];
  assert.throws(() => core.validateSnapshotBounds(huge));
  const gltf = { asset: { version: '2.0' }, scenes: [{ nodes: [] }], images: [{ uri: 'textures/leaf.png' }] };
  const source = { id: 1, fileType: 'model', fileName: 'tree.gltf', relativePath: 'tree.gltf' };
  assert.equal(core.inspectDependencySource(source, encode(gltf), base.files, attachmentUrl).status, 'clear');
  const direct = core.inspectDependencySource(source, encode({ ...gltf, images: [{ uri: attachmentUrl }] }), base.files, attachmentUrl);
  assert(direct.blockers.length); assert.notEqual(direct.status, 'clear');
  const unknownExtras = core.inspectDependencySource(source, encode({ ...gltf, extras: { arbitrary: attachmentUrl } }), base.files, attachmentUrl);
  assert(unknownExtras.blockers.length, 'Raw unknown GLTF JSON retains direct references');
  const unsupported = core.inspectDependencySource(source, encode({ ...gltf, extensionsRequired: ['UNKNOWN_decoder'] }), base.files, attachmentUrl);
  assert.equal(unsupported.status, 'unknown');
  for (const extension of [{ extensionsUsed: ['UNKNOWN_optional'] },
    { extensionsUsed: ['UNKNOWN_optional'], extensions: { UNKNOWN_optional: {} } }]) {
    assert.equal(core.inspectDependencySource(source, encode({ ...gltf, ...extension }), base.files, attachmentUrl).status, 'unknown');
  }
  const encoded = encode(gltf);
  const padded = Math.ceil(encoded.length / 4) * 4;
  const glb = new Uint8Array(20 + padded); glb.fill(32, 20);
  const view = new DataView(glb.buffer); [0x46546c67, 2, glb.length, padded, 0x4e4f534a].forEach((value, index) => view.setUint32(index * 4, value, true)); glb.set(encoded, 20);
  assert.equal(core.inspectDependencySource({ ...source, fileName: 'tree.glb' }, glb, base.files, attachmentUrl).status, 'clear');
  assert.equal(core.inspectDependencySource({ ...source, fileName: 'tree.fbx' }, new Uint8Array([1]), base.files, attachmentUrl).status, 'unknown');
  const obj = new TextEncoder().encode('mtllib tree.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl Leaf\nf 1 2 3\n');
  assert.equal(core.inspectDependencySource({ ...source, fileName: 'tree.obj' }, obj, base.files, attachmentUrl).status, 'unknown', 'Missing MTL cannot pass');
  const material = { id: 2, fileName: 'tree.mtl', relativePath: 'tree.mtl', fileType: 'other', filePath: `https://${host}/tree.mtl` };
  const objResult = core.inspectDependencySource({ ...source, fileName: 'tree.obj' }, obj, [...base.files, material], attachmentUrl);
  assert.equal(objResult.status, 'clear'); assert.equal(objResult.materials[0].id, 2);
  assert.equal(core.inspectDependencySource(material, new TextEncoder().encode('newmtl Leaf\nmap_Kd textures/leaf.png\n'), base.files, attachmentUrl).status, 'clear');
  assert.equal(core.inspectDependencySource(material, new TextEncoder().encode('newmtl Leaf\nunsupported image.png\n'), base.files, attachmentUrl).status, 'unknown');
  const deadline = () => core.createInspectionDeadline();
  assert.equal((await core.observeStorage(async () => headResponse(), attachmentUrl, deadline())).availability, 'present');
  assert.equal((await core.observeStorage(async () => ({}), attachmentUrl, deadline())).availability, 'unknown', 'Malformed provider success is not proof');
  assert.equal((await core.observeStorage(async () => { throw new blob.BlobNotFoundError(); }, attachmentUrl, deadline())).availability, 'missing');
  for (const error of [new blob.BlobAccessError(), new blob.BlobStoreNotFoundError(), new blob.BlobUnknownError('SECRET'),
    new DOMException('SECRET', 'AbortError'), new Error('not found'), new Error('HTTP 404')]) {
    const observed = await core.observeStorage(async () => { throw error; }, attachmentUrl, deadline());
    assert.equal(observed.availability, 'unknown'); assert(!JSON.stringify(observed).includes('SECRET'));
  }
  let now = 0;
  const sharedDeadline = core.createInspectionDeadline(() => now);
  await core.withInspectionDeadline(async () => { now = 4999; return true; }, sharedDeadline);
  now = 14000;
  await assert.rejects(core.withInspectionDeadline(async () => { now = 15001; return true; }, sharedDeadline));
  const lateMissing = core.createInspectionDeadline(() => now); now += 6000;
  await assert.rejects(core.withInspectionDeadline(async () => { now += 6000; throw new blob.BlobNotFoundError(); }, lateMissing),
    error => error.code === 'INSPECTION_TIMEOUT', 'Late not-found rejection must not prove missing');
  let lateResolve;
  const timeoutResult = core.withInspectionDeadline(() => new Promise(resolve => { lateResolve = resolve; }), deadline(), 1);
  await assert.rejects(timeoutResult, error => error.code === 'INSPECTION_TIMEOUT'); lateResolve('late'); await settle();
  const clear = { target: 'clear', references: 'clear', storage: 'clear', dependencies: 'clear', consistency: 'unchanged' };
  assert.equal(core.resolveEligibilityState(clear, [], []), 'observed_candidate');
  assert.equal(core.resolveEligibilityState({ ...clear, consistency: 'stale' }, [{ code: 'BLOCK' }], [{ code: 'UNKNOWN' }]), 'stale');
  assert.equal(core.resolveEligibilityState({ ...clear, dependencies: 'unknown' }, [{ code: 'BLOCK' }], []), 'unknown');
  assert.equal(core.resolveEligibilityState(clear, [{ code: 'BLOCK' }], []), 'blocked');
  assert.equal(core.resolveEligibilityState({ target: 'blocked', references: 'not_checked', storage: 'not_checked', dependencies: 'not_checked', consistency: 'not_checked' }, [{ code: 'BLOCK' }], []), 'blocked');
  return core;
}
async function verifyServer() {
  let clock = 0, parseOverrun = false;
  const core = load(coreFile, { '@vercel/blob': blob }, { performance: { now: () => clock } });
  const tableNames = { threedModelFiles: 'files', threedModelTextures: 'textures', threedModels: 'models',
    projectThreedMarkers: 'markers', projectAssets: 'projectAssets', project: 'projects' };
  const schema = Object.fromEntries(Object.keys(tableNames).map(name => {
    const table = { mockName: name, columns: {} };
    for (const field of ['id', 'userId', 'modelId', 'createdAt', 'updatedAt']) {
      table[field] = { table: name, name: field.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase()),
        field, columnType: field.endsWith('At') ? 'PgTimestamp' : 'PgInteger' };
      table.columns[field] = table[field];
    }
    return [name, table];
  }));
  const flatten = value => value?.sqlText ?? value?.mockName ?? (value?.table ? `${value.table}.${value.name}` : String(value));
  const sql = (parts, ...values) => ({ sqlText: parts.reduce((text, part, index) => text + part + (index < values.length ? flatten(values[index]) : ''), '') });
  sql.join = (values, separator) => ({ sqlText: values.map(flatten).join(flatten(separator)) });
  let snapshots, captures, transactions, queries, controls, storageCalls, externalCalls, active, mode, tokenValue, countOverride, failureCapture;
  let fetchFailure = false, deferCheckout = false, releaseCheckout, forceTimer = false, captureOverrun = false, streamOverrun = false, cancelledReads = 0;
  const orm = { sql, getTableColumns: table => table.columns, asc: field => ({ field }),
    eq: (field, value) => ({ field, value }), and: (...clauses) => ({ clauses }) };
  const matches = (row, predicate) => !predicate || predicate.clauses.every(({ field, value }) => row[field.field] === value);
  const db = { transaction: async (callback, config) => {
    if (deferCheckout) await new Promise(resolve => { releaseCheckout = resolve; });
    const index = captures++;
    transactions.push(clone(config)); active++;
    const saved = snapshots[Math.min(index, snapshots.length - 1)];
    const tx = {
      execute: async query => {
        controls.push(query.sqlText);
        assert(/^SET LOCAL (statement_timeout|lock_timeout)/.test(query.sqlText), 'No DML or explicit locks');
        if (index === failureCapture) throw new Error('PRIVATE_DATABASE_DETAILS');
      },
      select: fields => {
        let table, predicate, limit;
        const chain = {
          from(value) { table = value; return chain; }, where(value) { predicate = value; return chain; },
          orderBy() { return chain; }, limit(value) { limit = value; return chain; },
          then(resolve, reject) {
            if (captureOverrun) clock += 2001;
            const rows = saved.references[tableNames[table.mockName]];
            queries.push({ table: table.mockName, fields, predicate, limit, capture: index });
            let result;
            if ('count' in fields) result = [{ count: String(countOverride ?? rows.length), bytes: String(Buffer.byteLength(JSON.stringify(rows))) }];
            else if ('record' in fields) result = rows.map(record => ({ record: clone(record) }));
            else result = rows.filter(row => matches(row, predicate)).map(row => ({ id: row.id })).slice(0, limit);
            return Promise.resolve(result).then(resolve, reject);
          },
        };
        return chain;
      },
    };
    for (const method of ['insert', 'update', 'delete']) tx[method] = () => { throw new Error(`Forbidden mutation: ${method}`); };
    try { return await callback(tx); } finally { active--; }
  } };
  const server = load(serverFile, {
    '@vercel/blob': { ...blob, head: async (url, options) => {
      assert.equal(active, 0, 'Storage work must be outside transactions');
      assert.equal(url, attachmentUrl); assert.equal(options.token, tokenValue); assert(options.abortSignal);
      storageCalls++;
      if (mode === 'missing') throw new blob.BlobNotFoundError();
      if (mode === 'present') return headResponse();
      if (mode === 'denied') throw new blob.BlobAccessError();
      if (mode === 'late') { clock += 6000; throw new blob.BlobNotFoundError(); }
      return {};
    }, put() { throw new Error('Forbidden upload'); }, del() { throw new Error('Forbidden storage delete'); } },
    'drizzle-orm': orm, '@/libraries/db/client': { db },
    '@/libraries/schema/threed': schema, '@/libraries/schema/project': schema,
    './model-file-restoration-eligibility-core': { ...core, inspectDependencySource: (...args) => {
      const result = core.inspectDependencySource(...args); if (parseOverrun) clock += 15001; return result;
    } },
  }, {
    process: { env: { get BLOB_READ_WRITE_TOKEN() { return tokenValue; } } },
    performance: { now: () => clock },
    setTimeout: (callback, milliseconds) => setTimeout(() => { if (forceTimer) clock += milliseconds; callback(); }, forceTimer ? 1 : milliseconds),
    fetch: async (url, options) => {
      assert.equal(active, 0); assert.equal(new URL(url).hostname, host); assert.equal(options.redirect, 'error');
      assert.equal(options.cache, 'no-store'); assert(options.signal); externalCalls++;
      if (fetchFailure) throw new Error('PRIVATE_NETWORK_DETAILS');
      const data = encode({ asset: { version: '2.0' }, scenes: [{ nodes: [] }], images: [{ uri: 'textures/leaf.png' }] });
      let read = false;
      return { ok: true, headers: { get: () => String(data.byteLength) }, body: {
        getReader: () => ({ read: async () => {
          if (streamOverrun) { clock += 6000; options.signal.dispatchEvent(new Event('abort')); }
          return read ? { done: true } : (read = true, { done: false, value: data });
        }, releaseLock() {}, cancel: async () => { cancelledReads++; } }),
        cancel: async () => {},
      } };
    },
  });
  function reset(a = snapshot(), b = clone(a)) {
    snapshots = [a, b]; captures = 0; transactions = []; queries = []; controls = []; storageCalls = 0;
    externalCalls = 0; active = 0; mode = 'missing'; tokenValue = token; countOverride = null; failureCapture = -1; clock = 0; fetchFailure = false;
    deferCheckout = false; forceTimer = false; captureOverrun = false; parseOverrun = false; streamOverrun = false; cancelledReads = 0;
  }
  const scoped = { userId: owner, modelId: 7, fileId: 12 };
  reset(); let result = await server.diagnoseModelFileRestoration(scoped);
  noPermission(result); assert.equal(result.state, 'observed_candidate'); assert.equal(result.availability, 'missing');
  assert.equal(captures, 2); assert.equal(storageCalls, 1); assert.equal(externalCalls, 0);
  for (const config of transactions) assert.deepEqual(config, { isolationLevel: 'repeatable read', accessMode: 'read only' });
  assert.equal(controls.length, 4); assert(controls.some(value => value.includes('2000ms'))); assert(controls.some(value => value.includes('100ms')));
  assert(queries.filter(query => query.fields.record).every(query => query.limit === 5001));
  assert(queries.filter(query => query.fields.record).every(query => query.fields.record.sqlText.includes('HH24:MI:SS.US')));
  assert(queries.filter(query => query.fields.record).every(query => query.fields.record.sqlText.includes('created_at::text')));
  assert(!queries.some(query => /FOR UPDATE|FOR SHARE|LOCK TABLE|pg_advisory|skip locked/i.test(JSON.stringify(query))));
  assert(result.uncertainty.some(value => /change|observation/i.test(value.message)), 'Every result states observation limits');
  for (const bad of [value => { value.model.userId = 'foreign'; }, value => { value.file.userId = 'foreign'; }, value => { value.file.modelId = 8; }]) {
    const badSnapshot = snapshot(); bad(badSnapshot); reset(badSnapshot);
    assert.equal(await server.diagnoseModelFileRestoration(scoped), null); assert.equal(storageCalls, 0); assert.equal(externalCalls, 0);
    assert(!queries.some(query => query.fields.count), 'Exact ownership precedes global reference capture');
  }
  for (const mutation of [value => { value.file.updatedAt = '2026-10-02T12:00:00.123457'; },
    value => { value.file.filePath = attachmentUrl + '-changed'; },
    value => { value.references.projects.push({ id: 99, config: { url: attachmentUrl + '?alias' } }); }]) {
    const a = snapshot(), b = clone(a); mutation(b); b.references.files = [b.file]; reset(a, b);
    result = await server.diagnoseModelFileRestoration(scoped); noPermission(result); assert.equal(result.state, 'stale');
    assert.equal(result.checks.consistency, 'stale'); assert(!JSON.stringify(result).includes(attachmentUrl));
  }
  reset(); mode = 'present'; result = await server.diagnoseModelFileRestoration(scoped);
  noPermission(result); assert.equal(result.availability, 'present'); assert.equal(result.state, 'blocked');
  reset(); mode = 'denied'; result = await server.diagnoseModelFileRestoration(scoped);
  noPermission(result); assert.equal(result.availability, 'unknown'); assert.equal(result.state, 'unknown');
  reset(); mode = 'malformed'; result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.availability, 'unknown');
  reset(); mode = 'late'; result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.availability, 'unknown', 'Late authenticated not-found is unavailable proof');
  reset(); failureCapture = 1; result = await server.diagnoseModelFileRestoration(scoped);
  noPermission(result); assert.equal(result.state, 'unknown'); assert(!JSON.stringify(result).includes('PRIVATE_DATABASE_DETAILS'));
  reset(); tokenValue = undefined; result = await server.diagnoseModelFileRestoration(scoped);
  noPermission(result); assert.equal(result.state, 'unknown'); assert.equal(storageCalls, 0);
  reset(); countOverride = 5001;
  await assert.rejects(server.diagnoseModelFileRestoration(scoped));
  assert.equal(storageCalls, 0); assert(!queries.some(query => query.fields.record), 'Bounds are checked before full materialization');
  const geometry = snapshot();
  const primaryUrl = `https://${host}/threed/users/owner/models/tree--22222222-2222-4222-8222-222222222222/primary/tree.gltf`;
  const file = { id: 1, modelId: 7, userId: owner, fileName: 'tree.gltf', relativePath: 'tree.gltf', fileType: 'model', filePath: primaryUrl,
    metadata: {}, createdAt: stamp, updatedAt: stamp };
  geometry.model.modelType = 'gltf'; geometry.model.mainModelFileId = 1;
  geometry.files.push(file); geometry.references.files = geometry.files;
  reset(geometry); result = await server.diagnoseModelFileRestoration(scoped);
  noPermission(result); assert.equal(result.state, 'observed_candidate'); assert.equal(externalCalls, 1);
  reset(geometry); fetchFailure = true; result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.state, 'unknown'); assert(!JSON.stringify(result).includes('PRIVATE_NETWORK_DETAILS'));
  reset(geometry); parseOverrun = true; result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.state, 'unknown', 'Final parsing cannot outrun the overall external deadline');
  reset(geometry); streamOverrun = true; result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.state, 'unknown'); assert(cancelledReads > 0, 'Aborted streaming declaration is canceled');
  const fbx = clone(geometry); fbx.files[1].fileName = 'tree.fbx'; fbx.references.files = fbx.files;
  reset(fbx); result = await server.diagnoseModelFileRestoration(scoped); assert.equal(result.state, 'unknown'); assert.equal(externalCalls, 0);
  const legacyGeometry = clone(geometry); legacyGeometry.files[1].userId = null; legacyGeometry.references.files = legacyGeometry.files;
  reset(legacyGeometry); result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.state, 'unknown'); assert.equal(externalCalls, 0, 'Legacy source ownership is not inferred');
  const shared = snapshot(); shared.references.textures.push({ id: 90, userId: 'PRIVATE_OWNER', filePath: attachmentUrl + '?shared', metadata: {} });
  reset(shared); result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.state, 'blocked'); assert(!JSON.stringify(result).includes('PRIVATE_OWNER')); assert(!JSON.stringify(result).includes(attachmentUrl));
  const unsupported = snapshot(); unsupported.file.fileType = 'model';
  reset(unsupported); result = await server.diagnoseModelFileRestoration(scoped);
  assert.equal(result.state, 'blocked'); assert.equal(result.checks.dependencies, 'not_checked'); assert.equal(storageCalls, 0);

  let signedIn = true;
  const route = load(routeFile, {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200, headers: options?.headers }) } },
    '@/libraries/auth': { auth: async () => signedIn ? { user: { id: owner } } : null },
    '@/libraries/services/threed/models/model-file-restoration-eligibility': server,
    '@/libraries/services/threed/models/model-file-restoration-eligibility-core': core,
  });
  assert.equal(typeof route.GET, 'function'); assert.equal(route.POST, undefined); assert.equal(route.PATCH, undefined); assert.equal(route.DELETE, undefined);
  async function get(ids = { id: '7', fileId: '12' }, query = '', body = null) {
    const reply = await route.GET({ nextUrl: new URL('http://localhost/check' + query), body }, { params: Promise.resolve(ids) });
    assert.equal(reply.body.restoreAllowed, false); assert.equal(reply.headers['Cache-Control'], 'private, no-store');
    if (reply.body.data) noPermission(reply.body.data);
    else noPermission(reply.body);
    assert(!JSON.stringify(reply.body).includes('PRIVATE_')); assert(!JSON.stringify(reply.body).includes(token));
    return reply;
  }
  reset(); signedIn = false; assert.equal((await get()).status, 401); assert.equal(captures, 0);
  signedIn = true;
  for (const ids of [{ id: '7x', fileId: '12' }, { id: '7', fileId: '0' }, { id: '7', fileId: '-1' }, { id: '9007199254740992', fileId: '12' }]) {
    reset(); assert.equal((await get(ids)).status, 400); assert.equal(captures, 0);
  }
  reset(); assert.equal((await get(undefined, '?candidate=anything')).status, 400); assert.equal(captures, 0);
  reset(); assert.equal((await get(undefined, '', { candidate: 'not accepted' })).status, 400); assert.equal(captures, 0);
  const foreign = snapshot(); foreign.file.userId = 'foreign'; reset(foreign); assert.equal((await get()).status, 404); assert.equal(storageCalls, 0);
  reset(); failureCapture = 0; assert.equal((await get()).status, 503); assert.equal(storageCalls, 0);
  reset(); countOverride = 5001; assert.equal((await get()).status, 503);
  reset(); captureOverrun = true; assert.equal((await get()).status, 504); assert.equal(active, 0, 'Active transaction released before failure response');
  reset(); deferCheckout = true; forceTimer = true;
  assert.equal((await get()).status, 504); assert.equal(queries.length, 0);
  releaseCheckout(); await settle(); assert.equal(queries.length, 0, 'Timed-out queued checkout performs no late SELECTs'); assert.equal(active, 0);
  reset(); const successful = await get(); assert.equal(successful.status, 200); noPermission(successful.body.data);
}
module.exports = { verifyEditor, verifyCore, verifyServer };
if (require.main === module) (async () => {
  await verifyCore(); await verifyServer(); await verifyEditor();
  console.log('PASS read-only restoration diagnostics: exact ownership, bounded snapshots, native revisions, storage errors/deadlines, aliases/shared dependencies, safe replies and explicit editor observations');
})().catch(error => { console.error(error); process.exitCode = 1; });
