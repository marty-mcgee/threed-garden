// Execute the actual browser hook, rendered callbacks, preview effects and ZIP writer with offline boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { unzipSync } = require('fflate');

const base = 'src/components/admin/threed/models/';
let active = null;
const react = {
  useState(initial) {
    const fixture = active, index = fixture.cursor++;
    if (!(index in fixture.slots)) fixture.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [fixture.slots[index], value => {
      const next = typeof value === 'function' ? value(fixture.slots[index]) : value;
      if (!Object.is(next, fixture.slots[index])) { fixture.slots[index] = next; fixture.dirty = true; }
    }];
  },
  useRef(initial) {
    const fixture = active, index = fixture.cursor++;
    if (!(index in fixture.slots)) fixture.slots[index] = { current: initial };
    return fixture.slots[index];
  },
  useMemo(factory, deps) {
    const fixture = active, index = fixture.cursor++, previous = fixture.slots[index];
    if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) fixture.slots[index] = { deps, value: factory() };
    return fixture.slots[index].value;
  },
  useEffect(effect, deps) {
    const fixture = active, index = fixture.cursor++, previous = fixture.effects[index];
    if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) {
      fixture.pending.push(() => { previous?.cleanup?.(); fixture.effects[index] = { deps, cleanup: effect() }; });
    }
  },
};
function harness(fn, props = {}) {
  const fixture = {
    slots: [], effects: [], cursor: 0, pending: [], dirty: true, props,
    render(next = fixture.props) {
      fixture.props = next;
      let passes = 0;
      do {
        assert(++passes < 30, 'React fixture did not settle');
        fixture.cursor = 0; fixture.pending = []; fixture.dirty = false; active = fixture;
        fixture.result = fn(fixture.props);
        active = null;
        for (const run of fixture.pending) run();
      } while (fixture.dirty);
      return fixture.result;
    },
    unmount() { for (const effect of fixture.effects) effect?.cleanup?.(); },
  };
  fixture.render();
  return fixture;
}
const jsx = (type, props, key) => ({ type, props: props || {}, key });
function load(file, mocks = {}, extras = {}, append = '') {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8') + '\n' + append, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: name => { assert(name in mocks, `Unexpected import ${name} in ${file}`); return mocks[name]; },
    Uint8Array, DataView, TextEncoder, TextDecoder, atob, btoa, Blob, Response, AbortController, AbortSignal,
    URL, URLSearchParams, setTimeout, clearTimeout, console, ...extras,
  }, { filename: file });
  return exports;
}
const gltf = load('src/libraries/services/threed/models/model-gltf-bundle-core.ts');
const core = load('src/libraries/services/threed/models/model-embedded-images-core.ts', { './model-gltf-bundle-core.ts': gltf });
const fixtures = load('src/libraries/scripts/fixtures/gltf-bundle-fixtures.ts');
const png = fixtures.triangleGltfFixture().image;
const uri = `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
const rawBytes = fixtures.encodeGlb({ asset: { version: '2.0' }, images: [{ uri }] });
const stamp = 'a'.repeat(64);
const catalog = core.inspectThreeDModelEmbeddedImages('primary.glb', rawBytes);
const tick = () => new Promise(resolve => setImmediate(resolve));
async function settle(fixture) { await tick(); await tick(); return fixture.render(); }
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
let groups = 0;
async function group(label, run) { await run(); groups++; console.log(`  PASS ${label}`); }

function hookFixture(props = { modelId: 15, fileId: 25, fileName: 'primary.glb', revision: 0 }) {
  const calls = [];
  const module = load(base + 'use-embedded-model-images.ts', {
    react,
    '@/libraries/services/threed/models/model-embedded-images-core': core,
  }, {
    fetch(url, options) { const pending = deferred(); calls.push({ url, options, ...pending }); return pending.promise; },
  });
  const fixture = harness(p => module.useEmbeddedModelImages(p.modelId, p.fileId, p.fileName, p.revision), props);
  return { fixture, calls };
}
function response(modelId = 15, fileId = 25, overrides = {}) {
  return { ok: true, json: async () => ({ success: true, data: { modelId, fileId, sourceStamp: stamp, catalog, ...overrides } }) };
}
function walk(node, visit) {
  if (Array.isArray(node)) { for (const child of node) walk(child, visit); return; }
  if (!node || typeof node !== 'object' || !node.props) return;
  visit(node); walk(node.props.children, visit);
}
function nodes(tree, predicate) { const result = []; walk(tree, node => { if (predicate(node)) result.push(node); }); return result; }
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node && typeof node === 'object' && node.props) return text(node.props.children);
  return node === undefined || node === null || typeof node === 'boolean' ? '' : String(node);
}
function button(tree, label) {
  const found = nodes(tree, node => node.type === 'Button' && text(node).startsWith(label));
  assert.equal(found.length, 1, `Expected one ${label} button`); return found[0];
}
function field(tree, label) {
  const found = nodes(tree, node => node.props['aria-label'] === label);
  assert.equal(found.length, 1, `Expected one ${label} field`); return found[0];
}

const image = (index, extra = {}) => ({
  index, name: `Paint ${index + 1}`, fileName: `image-${index}.png`, mimeType: 'image/png', byteSize: png.length,
  width: 1, height: 1, previewSupported: true, source: { kind: 'data-uri' },
  usages: [{ materialIndex: index % 2, materialName: index % 2 ? 'Glass' : 'Body', textureIndex: index, channel: index % 2 ? 'Normal' : 'Base color', texturePath: `materials[${index % 2}].normalTexture` }], ...extra,
});
const galleryImages = [
  ...Array.from({ length: 8 }, (_, index) => image(index)),
  image(8, { mimeType: 'image/ktx2', fileName: 'image-8.ktx2', previewSupported: false }),
  image(9, { source: { kind: 'external' }, previewSupported: false, byteSize: null }),
  image(10, { width: 65535, previewSupported: false }),
  image(11, { byteSize: 4 * 1024 * 1024 + 1 }),
];
function galleryFixture() {
  const calls = [], downloads = [], urls = [], revoked = [], refreshed = [], busyChanges = [], extracts = [], zipCalls = [];
  const source = { sourceStamp: stamp, catalog: { format: 'glb', embeddedBuffers: 0, embeddedImages: 11, externalImages: 1, images: galleryImages }, extract(index) { extracts.push(index); return { bytes: png.slice(), mimeType: source.catalog.images[index].mimeType, fileName: source.catalog.images[index].fileName, image: source.catalog.images[index] }; } };
  let fetchHandler = async () => ({ ok: true, json: async () => ({ success: true, data: { textureId: 101, fileId: 201, relativePath: 'textures/image.png', reused: false } }) });
  const module = load(base + 'ModelEmbeddedImages.tsx', {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'lucide-react': { Download: 'Download', Images: 'Images', RefreshCw: 'RefreshCw' },
    '@/components/ui/button': { Button: 'Button' }, '@/components/ui/input': { Input: 'Input' },
    '@/components/ui/dialog': { Dialog: 'Dialog', DialogContent: 'DialogContent', DialogDescription: 'DialogDescription', DialogTitle: 'DialogTitle' },
    './ModelFieldHelp': { ModelFieldHelp: 'ModelFieldHelp' },
    './use-embedded-model-images': { useEmbeddedModelImages: () => ({ source, loading: false, error: '', supported: true }) },
    './embedded-image-downloads': { createEmbeddedImageZip: entries => { zipCalls.push(entries); return zip.createEmbeddedImageZip(entries); }, downloadEmbeddedBytes: (...args) => downloads.push(args) },
  }, {
    URL: { createObjectURL(blob) { const url = `blob:fixture-${urls.length}`; urls.push({ url, blob }); return url; }, revokeObjectURL(url) { revoked.push(url); } },
    fetch: async (url, options) => { calls.push({ url, options }); return fetchHandler(url, options); },
  }, 'exports.__gallery = EmbeddedImageGallery; exports.__preview = EmbeddedImagePreview;');
  const props = { modelId: 15, file: { id: 25, fileName: 'primary.glb' }, disabled: false, onBusyChange: value => busyChanges.push(value), onRegistered: async () => refreshed.push(true) };
  const fixture = harness(module.__gallery, props);
  return { fixture, module, calls, downloads, urls, revoked, refreshed, busyChanges, source, props, extracts, zipCalls, setFetch(fn) { fetchHandler = fn; } };
}
const zip = load(base + 'embedded-image-downloads.ts');

(async () => {
  await group('actual hook loads one owner-scoped catalog and one stamped geometry source, then extracts locally', async () => {
    const { fixture, calls } = hookFixture();
    assert.equal(calls.length, 1); assert.equal(fixture.result.loading, true);
    assert.equal(calls[0].url, '/api/threed/models/15/embedded-images?fileId=25');
    calls[0].resolve(response()); await settle(fixture);
    assert.equal(calls.length, 2); assert(calls[1].url.endsWith(`source=true&sourceStamp=${stamp}`));
    calls[1].resolve(new Response(rawBytes)); await settle(fixture);
    assert.equal(fixture.result.loading, false); assert.equal(fixture.result.error, '');
    assert.deepEqual(fixture.result.source.extract(0).bytes, png);
    fixture.result.source.extract(0); fixture.result.source.extract(0);
    assert.equal(calls.length, 2, 'Each preview must not fetch the geometry again');
    fixture.unmount(); assert(calls[0].options.signal.aborted);
  });
  await group('actual hook rejects wrong identity/stamp, source conflicts and oversized source responses', async () => {
    for (const bad of [response(16), response(15, 26), response(15, 25, { sourceStamp: 'invalid' })]) {
      const { fixture, calls } = hookFixture(); calls[0].resolve(bad); await settle(fixture);
      assert.equal(fixture.result.source, null); assert(fixture.result.error); assert.equal(calls.length, 1); fixture.unmount();
    }
    for (const raw of [new Response(null, { status: 409 }), new Response(rawBytes, { headers: { 'Content-Length': String(32 * 1024 * 1024 + 1) } }), new Response(new Uint8Array(32 * 1024 * 1024 + 1))]) {
      const { fixture, calls } = hookFixture(); calls[0].resolve(response()); await settle(fixture); calls[1].resolve(raw); await settle(fixture);
      assert.equal(fixture.result.source, null); assert(fixture.result.error); assert.equal(fixture.result.loading, false); fixture.unmount();
    }
  });
  await group('actual hook aborts old model/file/revision reads and ignores stale completion', async () => {
    const { fixture, calls } = hookFixture();
    calls[0].resolve(response()); await settle(fixture);
    const oldRaw = calls[1];
    fixture.render({ modelId: 16, fileId: 26, fileName: 'alternate.glb', revision: 0 });
    assert(oldRaw.options.signal.aborted); assert.equal(fixture.result.source, null);
    calls[2].resolve(response(16, 26)); await settle(fixture); calls[3].resolve(new Response(rawBytes)); await settle(fixture);
    const currentSource = fixture.result.source; assert(currentSource);
    oldRaw.resolve(new Response(rawBytes)); await settle(fixture); assert.equal(fixture.result.source, currentSource);
    fixture.render({ modelId: 16, fileId: 26, fileName: 'alternate.glb', revision: 1 }); assert(calls[3].options.signal.aborted); assert.equal(calls.length, 5);
    fixture.unmount(); assert(calls[4].options.signal.aborted);
  });
  await group('actual hook skips unsupported/missing geometry and zero-embedded catalogs', async () => {
    for (const file of [{ fileId: null, fileName: 'primary.glb' }, { fileId: 25, fileName: 'primary.obj' }]) {
      const { fixture, calls } = hookFixture({ modelId: 15, revision: 0, ...file }); assert.equal(calls.length, 0); assert.equal(fixture.result.loading, false); fixture.unmount();
    }
    const { fixture, calls } = hookFixture(); calls[0].resolve(response(15, 25, { catalog: { ...catalog, embeddedImages: 0, images: [] } })); await settle(fixture);
    assert.equal(calls.length, 1); assert.equal(fixture.result.source.extract, null); fixture.unmount();
  });
  await group('actual gallery filters/paging and downloads never create records; only selected eligible images enter review', async () => {
    const f = galleryFixture(); assert.equal(f.calls.length, 0);
    assert.equal(nodes(f.fixture.result, node => node.type === 'article').length, 6);
    field(f.fixture.result, 'Search embedded images').props.onChange({ target: { value: 'Paint 8' } }); f.fixture.render();
    assert.equal(nodes(f.fixture.result, node => node.type === 'article').length, 1);
    field(f.fixture.result, 'Select embedded image 8').props.onChange({ target: { checked: true } }); f.fixture.render();
    button(f.fixture.result, 'Download image').props.onClick(); assert.equal(f.downloads.length, 1); assert.deepEqual(f.downloads[0][0], png); assert.equal(f.calls.length, 0);
    button(f.fixture.result, 'Save selected as Textures').props.onClick(); f.fixture.render();
    assert.equal(f.calls.length, 0); assert.equal(nodes(f.fixture.result, node => node.type === 'Dialog')[0].props.open, true);
    field(f.fixture.result, 'Search embedded images').props.onChange({ target: { value: '' } }); f.fixture.render();
    button(f.fixture.result, 'Next').props.onClick(); f.fixture.render();
    assert.equal(field(f.fixture.result, 'Select embedded image 10').props.disabled, true, 'External image cannot be selected');
    button(f.fixture.result, 'Select page').props.onClick(); f.fixture.render();
    assert.equal(text(button(f.fixture.result, 'Save selected as Textures')), 'Save selected as Textures (2)');
    button(f.fixture.result, 'Download selected ZIP').props.onClick(); assert.equal(f.downloads.at(-1)[1], 'application/zip');
    assert.equal(Object.keys(unzipSync(f.downloads.at(-1)[0])).length, 5); assert.equal(f.calls.length, 0);
    f.fixture.unmount();
  });
  await group('actual registration handler posts reviewed source identity once, locks duplicate saves and retains existing materials', async () => {
    const f = galleryFixture(), pending = deferred();
    f.setFetch(() => pending.promise);
    field(f.fixture.result, 'Select embedded image 2').props.onChange({ target: { checked: true } }); f.fixture.render();
    button(f.fixture.result, 'Save selected as Textures').props.onClick(); f.fixture.render();
    assert.equal(nodes(f.fixture.result, node => node.type === 'Dialog')[0].props.open, true);
    const save = button(f.fixture.result, 'Save Textures').props.onClick;
    const first = save(), duplicate = save(); assert.equal(f.calls.length, 1); await duplicate;
    assert.equal(f.calls[0].url, '/api/threed/models/15/embedded-images/register'); assert.equal(f.calls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(f.calls[0].options.body), { fileId: 25, imageIndex: 1, sourceStamp: stamp });
    f.fixture.render(); assert.equal(button(f.fixture.result, 'Save Textures').props.disabled, true); assert(f.busyChanges.includes(true));
    pending.resolve({ ok: true, json: async () => ({ success: true, data: { textureId: 51, fileId: 61, relativePath: 'embedded/image-1.png', reused: false } }) });
    await first; f.fixture.render();
    assert.equal(f.refreshed.length, 1); assert.equal(f.busyChanges.at(-1), false);
    assert.match(text(f.fixture.result), /Original embedded images and material assignments are retained/);
    assert.equal(nodes(f.fixture.result, node => node.type === 'a' && node.props.href === '/admin/threed/models/15/files/61').length, 1);
    assert.equal(button(f.fixture.result, 'Save selected as Textures').props.disabled, true); await button(f.fixture.result, 'Save Textures').props.onClick(); assert.equal(f.calls.length, 1);
    f.fixture.unmount();
  });
  await group('actual partial-save failures stop remaining work and retry excludes confirmed saved images', async () => {
    const f = galleryFixture();
    for (const index of [1, 2, 3]) { field(f.fixture.result, `Select embedded image ${index}`).props.onChange({ target: { checked: true } }); f.fixture.render(); }
    f.setFetch(async (_, options) => {
      const index = JSON.parse(options.body).imageIndex;
      return index === 1 ? { ok: false, json: async () => ({ error: 'Geometry changed; reload before retry.' }) }
        : { ok: true, json: async () => ({ success: true, data: { textureId: 70 + index, fileId: 80 + index, relativePath: 'saved.png', reused: false } }) };
    });
    button(f.fixture.result, 'Save selected as Textures').props.onClick(); f.fixture.render();
    await button(f.fixture.result, 'Save Textures').props.onClick(); f.fixture.render();
    assert.deepEqual(f.calls.map(call => JSON.parse(call.options.body).imageIndex), [0, 1]);
    assert.match(text(f.fixture.result), /Geometry changed/); assert.equal(f.refreshed.length, 1);
    f.setFetch(async (_, options) => { const index = JSON.parse(options.body).imageIndex; return { ok: true, json: async () => ({ success: true, data: { textureId: 70 + index, fileId: 80 + index, relativePath: 'saved.png', reused: true } }) }; });
    button(f.fixture.result, 'Save selected as Textures').props.onClick(); f.fixture.render();
    await button(f.fixture.result, 'Save Textures').props.onClick(); f.fixture.render();
    assert.deepEqual(f.calls.map(call => JSON.parse(call.options.body).imageIndex), [0, 1, 1, 2]); assert.equal(f.refreshed.length, 2);
    f.fixture.unmount();
  });
  await group('actual completed saves remain confirmed when only the parent refresh fails', async () => {
    const f = galleryFixture();
    f.fixture.render({ ...f.props, onRegistered: async () => { throw new Error('refresh failed'); } });
    field(f.fixture.result, 'Select embedded image 1').props.onChange({ target: { checked: true } }); f.fixture.render();
    button(f.fixture.result, 'Save selected as Textures').props.onClick(); f.fixture.render();
    await button(f.fixture.result, 'Save Textures').props.onClick(); f.fixture.render();
    assert.match(text(f.fixture.result), /Images were saved, but the Model list could not be refreshed/);
    assert.equal(button(f.fixture.result, 'Save selected as Textures').props.disabled, true);
    assert.equal(f.calls.length, 1); assert.equal(f.busyChanges.at(-1), false);
    f.fixture.unmount();
  });
  await group('actual visible preview effects revoke URLs on pagination/source changes and unmount', async () => {
    const f = galleryFixture(), previews = new Map();
    function reconcile() {
      const visible = nodes(f.fixture.result, node => node.type === f.module.__preview);
      const keys = new Set(visible.map(node => node.props.image.index));
      for (const [key, preview] of previews) if (!keys.has(key)) { preview.unmount(); previews.delete(key); }
      for (const node of visible) if (!previews.has(node.props.image.index)) previews.set(node.props.image.index, harness(f.module.__preview, node.props));
    }
    reconcile(); assert.equal(f.urls.length, 6); assert.equal(f.revoked.length, 0);
    button(f.fixture.result, 'Next').props.onClick(); f.fixture.render(); reconcile();
    assert.equal(f.revoked.length, 6); assert.equal(f.urls.length, 9, 'Only visible preview-supported images allocate URLs');
    const preview = previews.get(6), previous = f.urls.at(-3).url;
    preview.render({ image: galleryImages[6], source: { ...f.source } }); assert(f.revoked.includes(previous));
    for (const item of previews.values()) item.unmount(); f.fixture.unmount();
    assert.equal(f.revoked.length, f.urls.length);
  });
  await group('actual ZIP callback rejects overlapping-resource amplification before extracting or allocating', async () => {
    const f = galleryFixture();
    f.source.catalog.images = Array.from({ length: 6 }, (_, index) => image(index, { byteSize: 8 * 1024 * 1024 }));
    f.fixture.render();
    button(f.fixture.result, 'Select page').props.onClick(); f.fixture.render();
    button(f.fixture.result, 'Download selected ZIP').props.onClick(); f.fixture.render();
    assert.equal(f.extracts.length, 0, 'Oversized selected total must reject before copying any shared image range');
    assert.equal(f.zipCalls.length, 0, 'Oversized selection must not reach ZIP allocation');
    assert.equal(f.downloads.length, 0); assert.equal(f.urls.length, 0); assert.equal(f.calls.length, 0);
    assert.match(text(f.fixture.result), /Choose images totalling no more than 32 MB per download/);
    button(f.fixture.result, 'Clear selection').props.onClick(); f.fixture.render();
    for (const index of [1, 2, 3, 4]) { field(f.fixture.result, `Select embedded image ${index}`).props.onChange({ target: { checked: true } }); f.fixture.render(); }
    button(f.fixture.result, 'Download selected ZIP').props.onClick(); f.fixture.render();
    assert.deepEqual(f.extracts, [0, 1, 2, 3], 'Exact 32 MiB reviewed total remains downloadable');
    assert.equal(f.zipCalls.length, 1); assert.equal(f.downloads.length, 1);
    f.fixture.unmount();
  });
  await group('actual visible-page preview policy bounds both copied bytes and decoded pixels', async () => {
    const f = galleryFixture();
    f.source.catalog.images = [
      image(0, { width: 1000, height: 1000, byteSize: 10 * 1024 * 1024 }),
      image(1, { width: 1000, height: 1000, byteSize: 10 * 1024 * 1024 }),
      image(2, { width: 4000, height: 4000, byteSize: 1024 * 1024 }),
      image(3, { width: 1000, height: 1000, byteSize: 6 * 1024 * 1024 }),
      image(4, { width: 1, height: 1, byteSize: 1024 * 1024 }),
      image(5, { previewSupported: false }),
      ...Array.from({ length: 6 }, (_, offset) => image(6 + offset, { width: 1000, height: 1000, byteSize: 10 * 1024 * 1024 })),
    ];
    f.fixture.render();
    let visible = nodes(f.fixture.result, node => node.type === f.module.__preview);
    assert.deepEqual(visible.map(node => node.props.allowPreview), [true, false, false, true, false, false]);
    const previews = visible.map(node => harness(f.module.__preview, node.props));
    assert.deepEqual(f.extracts, [0, 3]); assert.equal(f.urls.length, 2);
    for (const preview of previews) preview.unmount();
    button(f.fixture.result, 'Next').props.onClick(); f.fixture.render();
    visible = nodes(f.fixture.result, node => node.type === f.module.__preview);
    assert.deepEqual(visible.map(node => node.props.allowPreview), [true, false, false, false, false, false], 'The budget resets for the next visible page');
    const nextPreviews = visible.map(node => harness(f.module.__preview, node.props));
    assert.deepEqual(f.extracts, [0, 3, 6]); assert.equal(f.urls.length, 3);
    for (const preview of nextPreviews) preview.unmount();
    assert.equal(f.revoked.length, f.urls.length); f.fixture.unmount();
  });
  await group('actual allowPreview=false effect creates no object URL and revokes an enabled preview when disabled', async () => {
    const f = galleryFixture(), props = { image: galleryImages[0], source: f.source, allowPreview: false };
    const preview = harness(f.module.__preview, props);
    assert.equal(f.extracts.length, 0); assert.equal(f.urls.length, 0);
    assert.match(text(preview.result), /Preview limit reached/);
    preview.render({ ...props, allowPreview: true });
    assert.equal(f.extracts.length, 1); assert.equal(f.urls.length, 1);
    preview.render(props);
    assert.equal(f.extracts.length, 1); assert.equal(f.urls.length, 1); assert.equal(f.revoked.length, 1);
    assert.equal(nodes(preview.result, node => node.type === 'img').length, 0);
    preview.unmount(); assert.equal(f.revoked.length, 1); f.fixture.unmount();
  });
  await group('actual geometry chooser preserves primary authority and keys gallery identity by Model plus File', async () => {
    const f = galleryFixture();
    const props = { modelId: 15, primaryFileId: 25, geometryFiles: [{ id: 25, fileName: 'primary.glb' }, { id: 26, fileName: 'alternate.gltf' }] };
    const fixture = harness(f.module.ModelEmbeddedImages, props);
    const child = () => nodes(fixture.result, node => node.type === f.module.__gallery)[0];
    assert.equal(child().props.file.id, 25); assert.equal(child().key, '15:25');
    field(fixture.result, 'Inspect embedded images in geometry File').props.onChange({ target: { value: '26' } }); fixture.render();
    assert.equal(child().props.file.id, 26); assert.equal(child().key, '15:26'); assert.equal(props.primaryFileId, 25);
    fixture.render({ ...props, modelId: 16 }); assert.equal(child().props.file.id, 25); assert.equal(child().key, '16:25');
    fixture.unmount(); f.fixture.unmount();
  });
  await group('actual ZIP writer preserves bytes/names/CRC, rejects oversized or unsafe selections and revokes download URL', async () => {
    const entries = [{ name: 'image-0.png', bytes: png }, { name: 'image-1.txt', bytes: new TextEncoder().encode('123456789') }];
    const zipped = zip.createEmbeddedImageZip(entries), decoded = unzipSync(zipped), view = new DataView(zipped.buffer);
    assert.deepEqual(decoded['image-0.png'], png); assert.equal(new TextDecoder().decode(decoded['image-1.txt']), '123456789');
    let position = 0;
    for (const entry of entries) {
      assert.equal(view.getUint32(position, true), 0x04034b50);
      const length = view.getUint16(position + 26, true);
      if (entry.name.endsWith('.txt')) assert.equal(view.getUint32(position + 14, true), 0xcbf43926);
      position += 30 + length + entry.bytes.length;
    }
    assert.equal(view.getUint32(position, true), 0x02014b50);
    assert.throws(() => zip.createEmbeddedImageZip([]), /1 and 500/);
    assert.throws(() => zip.createEmbeddedImageZip([{ name: '../image.png', bytes: png }]), /limits/);
    assert.throws(() => zip.createEmbeddedImageZip([{ name: 'image.png', bytes: new Uint8Array(32 * 1024 * 1024 + 1) }]), /limits/);
    const events = [], timers = [];
    const browser = load(base + 'embedded-image-downloads.ts', {}, {
      URL: { createObjectURL: () => 'blob:download', revokeObjectURL: value => events.push(['revoke', value]) },
      document: { createElement: () => ({ click() { events.push(['click', this.href, this.download]); }, remove() { events.push(['remove']); } }), body: { append() { events.push(['append']); } } },
      setTimeout: (callback, delay) => timers.push({ callback, delay }),
    });
    browser.downloadEmbeddedBytes(png, 'image/png', 'image-0.png'); assert.deepEqual(events[1], ['click', 'blob:download', 'image-0.png']);
    assert.equal(timers[0].delay, 1000); timers[0].callback(); assert.deepEqual(events.at(-1), ['revoke', 'blob:download']);
  });
  console.log(`PASS ${groups} embedded-image browser/controller groups (mocked React/fetch/DOM; no live I/O).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
