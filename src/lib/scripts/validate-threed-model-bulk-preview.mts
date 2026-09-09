import assert from 'node:assert/strict';
import {
  createBulkModelPreviewSnapshot, validateBulkModelPreviewSnapshot,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../components/admin/threed/models/model-bulk-preview-window.ts';
import {
  createBulkDefaults, createBulkDraft, prepareBulkModel, summarizeBulkGltfResources, MAX_BULK_FILE_BYTES,
  type BulkSource,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../components/admin/threed/models/model-bulk-preparation-core.ts';
import {
  inspectThreeDGltfBundle,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-gltf-bundle-core.ts';
import {
  triangleGltfFixture, encodeGltf, encodeGlb,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './fixtures/gltf-bundle-fixtures.ts';

let groups = 0;
function group(label: string, run: () => void) {
  run();
  groups += 1;
  console.log(`  ✓ ${label}`);
}

const fixture = triangleGltfFixture();
const primary = new File([new Uint8Array(encodeGltf(fixture.document))], 'triangle.gltf');
const buffer = new File([fixture.geometry], 'triangle.bin');
const texture = new File([fixture.image], 'pixel.png', { type: 'image/png' });
const source = (id: string, file: File): BulkSource => ({ id, file, sourcePath: file.name, selectionRoot: 'selection' });
const pool = [source('buffer', buffer), source('texture', texture)];
function prepared(primaryFile = primary, companions = pool) {
  const row = createBulkDraft(source('model', primaryFile));
  row.inspecting = false;
  if (/\.(?:glb|gltf)$/i.test(primaryFile.name) && primaryFile === primary) {
    const inspection = inspectThreeDGltfBundle(primary.name, encodeGltf(fixture.document));
    row.requirements = inspection.requirements;
    row.gltfResources = summarizeBulkGltfResources(inspection);
  }
  const defaults = createBulkDefaults();
  return { row, defaults, plan: prepareBulkModel(row, defaults, companions) };
}
function snapshot() {
  const { row, plan } = prepared();
  return createBulkModelPreviewSnapshot(row, plan);
}

console.log('\nThreeD Model bulk preview snapshot validation');
console.log('─'.repeat(44));

group('local File objects for FBX, GLB and GLTF pass the preview message boundary', () => {
  const glb = encodeGlb({ ...fixture.document, buffers: [{ byteLength: fixture.geometry.byteLength }] }, fixture.geometry);
  for (const file of [new File(['; FBX 7.4.0 project file'], 'triangle.FBX'),
    new File([new Uint8Array(glb)], 'triangle.GLB'), primary]) {
    const { row, plan } = prepared(file);
    const result = createBulkModelPreviewSnapshot(row, plan);
    assert.equal(result.file, file);
    assert.equal(result.modelName, 'triangle');
    assert.doesNotThrow(() => validateBulkModelPreviewSnapshot(result));
  }
});

group('preview captures effective scale, Texture and transforms independently of later importer edits', () => {
  const { row, defaults } = prepared();
  defaults.scale = '0.02';
  defaults.existingTextureId = 11;
  defaults.isPublic = true;
  defaults.isActive = true;
  row.rotationY = '90';
  row.offsetX = '-2'; row.offsetY = '0.5'; row.offsetZ = '3';
  const catalog = [{ id: 11, textureName: 'Default', fileName: 'default.png', isActive: true }];
  const plan = prepareBulkModel(row, defaults, pool, catalog);
  assert.equal(plan.ready, true);
  const captured = createBulkModelPreviewSnapshot(row, plan);
  defaults.scale = '1'; defaults.existingTextureId = null;
  row.rotationY = '180'; row.offsetX = '10'; row.modelName = 'Changed';
  row.source = source('replacement', new File(['replacement'], 'another.fbx'));
  plan.settings.scale = '4'; plan.settings.existingTextureId = null;
  plan.attachments[0].relativePath = 'buffers/changed.bin';
  plan.attachments.pop();
  assert.deepEqual([captured.scale, captured.rotationY, captured.offsetX, captured.offsetY, captured.offsetZ], [0.02, 90, -2, 0.5, 3]);
  assert.equal(captured.existingTextureId, 11);
  assert.equal(captured.modelName, 'triangle');
  assert.equal(captured.file, primary);
  assert.deepEqual(captured.attachments.map(({ relativePath }) => relativePath), ['buffers/triangle.bin', 'textures/pixel.png']);
});

group('only selected typed companions enter the snapshot; thumbnail, pool extras and publishing fields stay out', () => {
  const unused = source('unused', new File([fixture.image], 'unused.png'));
  const { row, defaults } = prepared(primary, [...pool, unused]);
  row.previewFile = new File([fixture.image], 'thumbnail.png');
  defaults.categoryIds = [3]; defaults.isPublic = true; defaults.isActive = true;
  const plan = prepareBulkModel(row, defaults, [...pool, unused]);
  assert.deepEqual(plan.attachments.map(({ fileType }) => fileType), ['binary', 'texture']);
  const captured = createBulkModelPreviewSnapshot(row, plan);
  assert.deepEqual(captured.attachments.map(({ file }) => file.name), ['triangle.bin', 'pixel.png']);
  assert.deepEqual(Object.keys(captured).sort(), ['file', 'modelName', 'attachments', 'scale', 'rotationY',
    'offsetX', 'offsetY', 'offsetZ', 'existingTextureId', 'missingTexturePaths'].sort());
  assert.deepEqual(Object.keys(captured.attachments[0]).sort(), ['file', 'relativePath']);
});

group('preview keeps unresolved texture labels separate from mandatory geometry buffers', () => {
  const { row, plan } = prepared(primary, []);
  assert.equal(plan.ready, false);
  assert.equal(plan.matches.filter(({ requirement }) => requirement.kind === 'buffer').length, 1);
  const captured = createBulkModelPreviewSnapshot(row, plan);
  assert.deepEqual(captured.missingTexturePaths, ['textures/pixel.png']);
  assert.deepEqual(captured.attachments, []);
  plan.matches[1].requirement.relativePath = 'changed.png';
  assert.deepEqual(captured.missingTexturePaths, ['textures/pixel.png']);
  assert.equal(createBulkModelPreviewSnapshot(prepared().row, prepared().plan).missingTexturePaths.length, 0);
});

group('invalid or transient transforms are rejected before opening a preview', () => {
  for (const scale of ['', ' ', '0', '-1', '0.009', 'NaN', 'Infinity', '1e999', '1.5px']) {
    const { row, plan } = prepared();
    plan.settings.scale = scale;
    assert.throws(() => createBulkModelPreviewSnapshot(row, plan), /scale/);
  }
  for (const key of ['rotationY', 'offsetX', 'offsetY', 'offsetZ'] as const) {
    for (const value of ['', ' ', 'NaN', 'Infinity', '1e999', '90degrees']) {
      const { row, plan } = prepared();
      row[key] = value;
      assert.throws(() => createBulkModelPreviewSnapshot(row, plan), /finite/);
    }
  }
  for (const value of [NaN, Infinity, -Infinity, '1', null, undefined]) {
    assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), offsetX: value }), /finite/);
  }
  assert.doesNotThrow(() => validateBulkModelPreviewSnapshot({ ...snapshot(), scale: 0.01, offsetX: -100, rotationY: 720 }));
});

group('message validation rejects fake files, unsupported files, malformed IDs, names and attachment entries', () => {
  for (const value of [null, undefined, 1, 'model', {}, []]) assert.throws(() => validateBulkModelPreviewSnapshot(value));
  for (const file of [{ name: 'model.fbx', size: 1 }, new Blob(['file']), new File(['obj'], 'model.obj'),
    new File([], 'empty.fbx'), new File(['model'], '%2e%2e.fbx')]) {
    assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), file }));
  }
  for (const existingTextureId of [undefined, 0, -1, 1.5, '1', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), existingTextureId }), /Texture/);
  }
  assert.doesNotThrow(() => validateBulkModelPreviewSnapshot({ ...snapshot(), existingTextureId: Number.MAX_SAFE_INTEGER }));
  for (const modelName of [null, 42, 'x'.repeat(256)]) assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), modelName }), /name/);
  for (const attachments of [null, {}, [null], [{ file: { name: 'pixel.png', size: 1 }, relativePath: 'textures/pixel.png' }],
    [{ file: new File(['not a companion'], 'readme.txt'), relativePath: 'textures/readme.txt' }]]) {
    assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), attachments }), /companion/);
  }
});

group('attachment destinations must already be normalized relative paths', () => {
  for (const relativePath of ['', '../pixel.png', 'textures/../pixel.png', '/textures/pixel.png',
    'https://example.invalid/pixel.png', 'C:\\textures\\pixel.png', 'textures\\pixel.png',
    'textures/./pixel.png', 'textures/%70ixel.png', 'textures/pixel.png?token=private',
    'textures/pixel.png#fragment', 'textures/\0pixel.png', 'x'.repeat(357), null]) {
    assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), attachments: [{ file: texture, relativePath }] }), /companion/);
  }
  assert.doesNotThrow(() => validateBulkModelPreviewSnapshot({ ...snapshot(),
    attachments: [{ file: new File([fixture.image], 'pixel image.png'), relativePath: 'textures/pixel image.png' }] }));
});

group('preview enforces actual per-file and aggregate byte boundaries without reading file contents', () => {
  const bytes = new Uint8Array(MAX_BULK_FILE_BYTES);
  const file = new File([bytes], 'model.fbx');
  const attachments = Array.from({ length: 7 }, (_, index) => ({
    file: new File([bytes], `${index}.png`), relativePath: `textures/${index}.png`,
  }));
  const maximum = { ...snapshot(), file, attachments };
  assert.doesNotThrow(() => validateBulkModelPreviewSnapshot(maximum));
  assert.throws(() => validateBulkModelPreviewSnapshot({ ...maximum,
    attachments: [...attachments, { file: new File(['x'], 'more.png'), relativePath: 'textures/more.png' }] }), /32 MiB/);
  const oversized = new File([bytes, 'x'], 'large.fbx');
  assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), file: oversized }), /4 MiB/);
  assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), attachments: [{
    file: new File([bytes, 'x'], 'large.png'), relativePath: 'textures/large.png',
  }] }), /companion/);
});

group('companion and unresolved-texture inventories stop at the advertised 500-entry bounds', () => {
  const attachments = Array.from({ length: 500 }, (_, index) => ({ file: texture, relativePath: `${index}/pixel.png` }));
  const missingTexturePaths = Array.from({ length: 500 }, (_, index) => `${index}/missing.png`);
  assert.doesNotThrow(() => validateBulkModelPreviewSnapshot({ ...snapshot(), attachments, missingTexturePaths }));
  assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), attachments: [...attachments, attachments[0]] }), /500/);
  assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), missingTexturePaths: [...missingTexturePaths, 'extra.png'] }), /requirements/);
  for (const missingTexturePaths of [undefined, null, {}, [null], [1], ['x'.repeat(1025)]]) {
    assert.throws(() => validateBulkModelPreviewSnapshot({ ...snapshot(), missingTexturePaths }), /requirements/);
  }
});

console.log('─'.repeat(44));
console.log(`PASS  ${groups} validation groups completed`);
