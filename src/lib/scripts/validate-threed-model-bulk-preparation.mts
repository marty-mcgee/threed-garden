import assert from 'node:assert/strict';
import {
  MAX_BULK_FILE_BYTES, MAX_BULK_MODELS, createBulkDefaults, createBulkDraft,
  defaultDestination, prepareBulkModel, requirementKey, resolveBulkSettings,
  validateBulkPreview, validateBulkPrimary, validateBulkTexture, validateBulkCompanion, summarizeBulkGltfResources,
  type BulkDraft, type BulkSource,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../components/admin/threed/models/model-bulk-preparation-core.ts';
import type {
  ThreeDModelCompanionRequirement,
} from '../services/threed/models/model-companion-core.ts';
import {
  inspectThreeDGltfBundle,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-gltf-bundle-core.ts';
import {
  triangleGltfFixture, encodeGltf, encodeGlb,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './fixtures/gltf-bundle-fixtures.ts';
import {
  BULK_SCALE_PRESETS, createBulkPreferencesStorageKey, readBulkPreferences, serializeBulkPreferences,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../components/admin/threed/models/model-bulk-preferences-core.ts';

let groups = 0;
async function group(label: string, run: () => void | Promise<void>) {
  await run();
  groups += 1;
  console.log(`  ✓ ${label}`);
}

function file(name: string, size = 12, type = ''): File {
  const selected = new File([new Uint8Array(Math.min(size, 12))], name, { type, lastModified: 1 });
  Object.defineProperty(selected, 'size', { value: size });
  return selected;
}
function source(id: string, name = 'wall.png', sourcePath = name, selectionRoot = ''): BulkSource {
  return { id, file: file(name), sourcePath, selectionRoot };
}
function requirement(relativePath: string): ThreeDModelCompanionRequirement {
  return { relativePath, fileName: relativePath.replaceAll('\\', '/').split('/').at(-1)!, kind: 'texture', referencedBy: 'house.fbx' };
}
function draft(paths: string[] = []): BulkDraft {
  return { ...createBulkDraft(source('model', 'house.fbx')), inspecting: false, requirements: paths.map(requirement) };
}
function choose(row: BulkDraft, index: number, sourceId: string, relativePath = defaultDestination(row.requirements[index].relativePath)) {
  row.choices[requirementKey(row.requirements[index])] = { sourceId, relativePath };
}
const defaults = createBulkDefaults();

console.log('\nThreeD Model bulk preparation validation');
console.log('─'.repeat(44));

await group('primary limits reject unsupported, empty and transport-oversize files before reads', () => {
  assert.equal(MAX_BULK_MODELS, 100);
  assert.equal(MAX_BULK_FILE_BYTES, 4 * 1024 * 1024);
  assert.equal(validateBulkPrimary(file('HOUSE.FBX', MAX_BULK_FILE_BYTES)), null);
  assert.match(validateBulkPrimary(file('house.fbx', MAX_BULK_FILE_BYTES + 1))!, /4 MiB/);
  assert.match(validateBulkPrimary(file('house.fbx', 0))!, /empty/);
  assert.equal(validateBulkPrimary(file('house.GLB')), null);
  assert.equal(validateBulkPrimary(file('house.GLTF')), null);
  assert.match(validateBulkPrimary(file('house.obj'))!, /FBX/);
  assert.match(validateBulkPrimary(file(`${'a'.repeat(252)}.fbx`))!, /255/);
  assert.equal(validateBulkPrimary(file(`${'a'.repeat(251)}.fbx`)), null);
  assert.match(validateBulkPrimary(file('%2e%2e.fbx'))!, /filename/);
  assert.match(validateBulkPrimary(file('C:\\house.fbx'))!, /filename/);
});

await group('same-name, size and timestamp selections retain distinct supplied identities', () => {
  const first = createBulkDraft(source('selection-one', 'same.fbx'));
  const second = createBulkDraft(source('selection-two', 'same.fbx'));
  assert.notEqual(first.id, second.id);
  assert.equal(first.source.file.name, second.source.file.name);
  assert.equal(first.source.file.size, second.source.file.size);
  assert.equal(first.source.file.lastModified, second.source.file.lastModified);
  assert.equal(first.inspecting, true);
  assert.equal(prepareBulkModel(first, defaults, []).ready, false);
});

await group('inherited defaults change without overwriting per-Model overrides or arrays', () => {
  const inherited = draft();
  const overridden = draft();
  overridden.overrides = { scale: '2', categoryIds: [9], isPublic: false };
  const next = { ...defaults, scale: '3', categoryIds: [4], isPublic: true, isActive: true };
  assert.equal(resolveBulkSettings(inherited, next).scale, '3');
  assert.equal(resolveBulkSettings(overridden, next).scale, '2');
  assert.equal(resolveBulkSettings(overridden, next).isPublic, false);
  assert.deepEqual(resolveBulkSettings(overridden, next).categoryIds, [9]);
  resolveBulkSettings(inherited, next).categoryIds.push(10);
  assert.deepEqual(next.categoryIds, [4]);
  delete overridden.overrides.scale;
  assert.equal(resolveBulkSettings(overridden, next).scale, '3');
  assert.equal(defaults.isActive, false);
  assert.equal(defaults.isLibraryItem, true);
});

await group('unique bare and normalized directory references produce API-valid destinations', () => {
  const texture = source('texture', 'Barn_Wall.png');
  const bare = prepareBulkModel(draft(['Barn_Wall.png']), defaults, [texture]);
  assert.equal(bare.ready, true);
  assert.equal(bare.attachments[0].relativePath, 'textures/Barn_Wall.png');
  assert.equal(bare.matches[0].automatic, true);
  assert.equal(defaultDestination('textures\\walls/Barn_Wall.png'), 'textures/walls/Barn_Wall.png');
  const withDirectory = prepareBulkModel(draft(['textures/walls/Barn_Wall.png']), defaults, [texture]);
  assert.equal(withDirectory.ready, true);
  assert.equal(withDirectory.attachments[0].relativePath, 'textures/walls/Barn_Wall.png');
});

await group('exact source paths resolve relative to the primary only within a known root', () => {
  const row = draft(['textures/wall.png']);
  row.source = source('model', 'house.fbx', 'models/house.fbx', 'root-A');
  const local = source('local', 'wall.png', 'models/textures/wall.png', 'root-A');
  const foreign = source('foreign', 'wall.png', 'models/textures/wall.png', 'root-B');
  assert.equal(prepareBulkModel(row, defaults, [foreign, local]).matches[0].sourceId, 'local');
  row.source.selectionRoot = '';
  const loose = prepareBulkModel(row, defaults, [foreign, local]);
  assert.equal(loose.ready, false);
  assert.equal(loose.matches[0].sourceId, '');
  row.source.selectionRoot = 'root-A';
  const duplicate = source('duplicate-path', 'wall.png', 'models/textures/wall.png', 'root-A');
  assert.equal(prepareBulkModel(row, defaults, [local, duplicate]).ready, false);
});

await group('duplicate basenames require a visible choice and explicit unmatched overrides suggestions', () => {
  const row = draft(['wall.png']);
  const pool = [source('first'), source('second')];
  assert.equal(prepareBulkModel(row, defaults, pool).ready, false);
  choose(row, 0, 'second');
  const chosen = prepareBulkModel(row, defaults, pool);
  assert.equal(chosen.ready, true);
  assert.equal(chosen.attachments[0].source.id, 'second');
  assert.equal(chosen.matches[0].automatic, false);
  choose(row, 0, '');
  assert.equal(prepareBulkModel(row, defaults, [pool[0]]).ready, false);
});

await group('same file can serve multiple Models and distinct exact destinations', () => {
  const texture = source('shared');
  const first = draft(['walls/wall.png', 'roof/wall.png']);
  const result = prepareBulkModel(first, defaults, [texture]);
  assert.equal(result.ready, true);
  assert.equal(result.attachments.length, 2);
  assert.equal(prepareBulkModel(draft(['wall.png']), defaults, [texture]).ready, true);
  const duplicateReference = prepareBulkModel(draft(['wall.png', 'textures/wall.png']), defaults, [texture]);
  assert.equal(duplicateReference.ready, true);
  assert.equal(duplicateReference.attachments.length, 1);
});

await group('two same-name textures retain explicit exact-path resolution', () => {
  const row = draft(['walls/wall.png', 'roof/wall.png']);
  const pool = [source('wall'), source('roof')];
  choose(row, 0, 'wall');
  choose(row, 1, 'roof');
  const prepared = prepareBulkModel(row, defaults, pool);
  assert.equal(prepared.ready, true);
  assert.deepEqual(prepared.attachments.map((attachment) => attachment.source.id), ['wall', 'roof']);
});

await group('removing a shared source invalidates dependent rows without changing unrelated rows', () => {
  const first = draft(['wall.png']);
  const second = draft(['wall.png']);
  const unrelated = draft(['leaf.png']);
  choose(first, 0, 'shared');
  const pool = [source('shared'), source('leaf', 'leaf.png')];
  assert.equal(prepareBulkModel(first, defaults, pool).ready, true);
  const remaining = pool.slice(1);
  assert.equal(prepareBulkModel(first, defaults, remaining).ready, false);
  assert.equal(prepareBulkModel(second, defaults, remaining).ready, false);
  assert.equal(prepareBulkModel(unrelated, defaults, remaining).ready, true);
});

await group('unsafe, missing, excessive and duplicate attachment directories block even deferred rows', () => {
  const row = draft(['wall.png']);
  row.configureLater = true;
  for (const destination of ['wall.png', '../textures/wall.png', '/textures/wall.png', 'C:\\textures\\wall.png',
    'textures/%2e%2e/wall.png', '%2Ftextures/wall.png', 'textures/%00wall.png', `${'a'.repeat(101)}/wall.png`]) {
    choose(row, 0, 'one', destination);
    const prepared = prepareBulkModel(row, defaults, [source('one')]);
    assert.equal(prepared.ready, false, destination);
    assert.ok(prepared.issues.length, destination);
  }
  choose(row, 0, 'one', `${'a'.repeat(100)}/wall.png`);
  assert.equal(prepareBulkModel(row, defaults, [source('one')]).ready, true);
  row.extras = [{ id: 'extra', sourceId: 'two', relativePath: `${'A'.repeat(100)}/WALL.PNG` }];
  assert.match(prepareBulkModel(row, defaults, [source('one'), source('two')]).issues.join(' '), /Duplicate/);
});

await group('incorrect manual filename or destination cannot masquerade as a required texture', () => {
  const row = draft(['wall.png']);
  row.configureLater = true;
  choose(row, 0, 'leaf');
  assert.equal(prepareBulkModel(row, defaults, [source('leaf', 'leaf.png')]).ready, false);
  choose(row, 0, 'wall', 'textures/leaf.png');
  assert.equal(prepareBulkModel(row, defaults, [source('wall')]).ready, false);
});

await group('competing suffix destinations block instead of depending on attachment order', () => {
  const row = draft(['textures/wall.png', 'vendor/textures/wall.png']);
  const prepared = prepareBulkModel(row, defaults, [source('wall')]);
  assert.equal(prepared.ready, false);
  assert.equal(prepared.unresolved.length, 2);
  assert.match(prepared.matches[0].issue!, /suffix/);
  row.configureLater = true;
  const deferred = prepareBulkModel(row, defaults, [source('wall')]);
  assert.equal(deferred.ready, true);
  assert.deepEqual(deferred.attachments, []);
});

await group('the bounded reference inventory retains exact resolution for 500 same-name destinations', () => {
  const row = draft(Array.from({ length: 500 }, (_, index) => `directory-${index}/wall.png`));
  const prepared = prepareBulkModel(row, defaults, [source('wall')]);
  assert.equal(prepared.ready, true);
  assert.equal(prepared.attachments.length, 500);
  assert.equal(prepared.matches.length, 500);
  assert.deepEqual(prepared.unresolved, []);
});

await group('additional textures recalculate basename ambiguity across the complete Model attachment set', () => {
  const row = draft(['wall.png']);
  choose(row, 0, 'wall', 'walls/wall.png');
  row.extras = [{ id: 'extra', sourceId: 'roof', relativePath: 'roof/wall.png' }];
  const ambiguous = prepareBulkModel(row, defaults, [source('wall'), source('roof')]);
  assert.equal(ambiguous.ready, false);
  assert.deepEqual(ambiguous.unresolved, ['wall.png']);
  row.requirements = [requirement('walls/wall.png')];
  choose(row, 0, 'wall');
  assert.equal(prepareBulkModel(row, defaults, [source('wall'), source('roof')]).ready, true);
});

await group('deferred configuration omits unresolved textures and forces inactive without waiving validation', () => {
  const row = draft(['wall.png', 'missing.png']);
  row.configureLater = true;
  row.overrides.isActive = true;
  const result = prepareBulkModel(row, defaults, [source('wall')]);
  assert.equal(result.ready, true);
  assert.equal(result.settings.isActive, false);
  assert.deepEqual(result.unresolved, ['missing.png']);
  assert.equal(result.attachments.length, 1);
  row.overrides.scale = '0.009';
  assert.equal(prepareBulkModel(row, defaults, [source('wall')]).ready, false);
  row.overrides.scale = '0.01';
  assert.equal(prepareBulkModel(row, defaults, [source('wall')]).ready, true);
  row.inspectionError = 'Scan failed';
  assert.equal(prepareBulkModel(row, defaults, [source('wall')]).ready, false);
});

await group('invalid names, transforms, categories and selected texture files block only their own rows', () => {
  for (const value of ['', 'NaN', 'Infinity']) {
    const row = draft();
    row.offsetX = value;
    assert.equal(prepareBulkModel(row, defaults, []).ready, false);
  }
  const invalid = draft();
  invalid.modelName = '   ';
  invalid.overrides.categoryIds = [-1];
  assert.equal(prepareBulkModel(invalid, defaults, []).issues.length, 2);
  invalid.modelName = 'House';
  invalid.overrides.categoryIds = Array.from({ length: 51 }, (_, index) => index + 1);
  assert.equal(prepareBulkModel(invalid, defaults, []).ready, false);
  invalid.overrides.categoryIds.pop();
  assert.equal(prepareBulkModel(invalid, defaults, []).ready, true);
  assert.equal(prepareBulkModel(draft(), defaults, []).ready, true);
  assert.match(validateBulkTexture(file('wall.png', 0))!, /empty/);
  assert.match(validateBulkTexture(file('wall.png', MAX_BULK_FILE_BYTES + 1))!, /4 MiB/);
  assert.match(validateBulkTexture(file('material.mtl'))!, /Textures/);
  assert.equal(validateBulkTexture(file('wall.TGA')), null);
});

await group('no-reference Models may have explicit extras while preview inputs stay separate', () => {
  const row = draft();
  row.extras = [{ id: 'extra', sourceId: 'wall', relativePath: 'textures/wall.png' }];
  const pool = [source('wall')];
  assert.equal(prepareBulkModel(row, defaults, pool).attachments.length, 1);
  row.previewFile = file('wall.png', 12, 'image/png');
  assert.equal(prepareBulkModel(row, defaults, pool).ready, false);
  row.previewFile = file('preview.png', 12, 'image/png');
  assert.equal(prepareBulkModel(row, defaults, pool).ready, true);
  row.requirements = [requirement('preview.png')];
  row.configureLater = true;
  assert.equal(prepareBulkModel(row, defaults, pool).ready, false);
});

await group('preview validation checks MIME, extension, byte limit and actual image signature', async () => {
  const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'preview.png', { type: 'image/png' });
  assert.equal(await validateBulkPreview(png), null);
  assert.match((await validateBulkPreview(file('fake.png', 12, 'image/png')))!, /contents/);
  assert.match((await validateBulkPreview(file('preview.png', 12, 'image/gif')))!, /JPG, PNG, or WebP/);
  assert.match((await validateBulkPreview(file('preview.svg', 12, 'image/png')))!, /JPG, PNG, or WebP/);
  assert.match((await validateBulkPreview(file('preview.png', MAX_BULK_FILE_BYTES + 1, 'image/png')))!, /4 MiB/);
});

await group('mixed batches use one readiness result for the exact eligible selection', () => {
  const ready = draft();
  const blocked = draft(['missing.png']);
  const deferred = draft(['missing.png']);
  deferred.configureLater = true;
  const prepared = [ready, blocked, deferred].map((row) => prepareBulkModel(row, defaults, []));
  assert.deepEqual(prepared.map((row) => row.ready), [true, false, true]);
  assert.equal(prepared.filter((row) => row.ready).length, 2);
});

await group('existing Texture defaults apply across Models with explicit None, override and inheritance', () => {
  const catalog = [
    { id: 10, textureName: 'Farm', fileName: 'farm.png', isActive: true },
    { id: 20, textureName: 'Town', fileName: 'town.png', isActive: true },
  ];
  const batch = { ...defaults, existingTextureId: 10 };
  const rows = [draft(), draft(), draft()];
  rows[1].overrides.existingTextureId = null;
  rows[2].overrides.existingTextureId = 20;
  assert.deepEqual(rows.map((row) => prepareBulkModel(row, batch, [], catalog).settings.existingTextureId), [10, null, 20]);
  assert.ok(rows.every((row) => prepareBulkModel(row, batch, [], catalog).ready));
  batch.existingTextureId = 20;
  assert.equal(prepareBulkModel(rows[0], batch, [], catalog).settings.existingTextureId, 20);
  delete rows[1].overrides.existingTextureId;
  assert.equal(prepareBulkModel(rows[1], batch, [], catalog).settings.existingTextureId, 20);
});

await group('unloaded, stale, inactive and invalid existing Textures block selected rows only', () => {
  const row = draft();
  const batch = { ...defaults, existingTextureId: 10 };
  assert.equal(prepareBulkModel(row, batch, []).ready, false);
  assert.equal(prepareBulkModel(row, batch, [], []).ready, false);
  assert.equal(prepareBulkModel(row, batch, [], [{ id: 10, textureName: 'Farm', fileName: 'farm.png', isActive: false }]).ready, false);
  for (const id of [0, -1, 1.5, NaN, Infinity]) {
    assert.equal(prepareBulkModel(row, { ...batch, existingTextureId: id }, [], []).ready, false);
  }
  row.overrides.existingTextureId = null;
  assert.equal(prepareBulkModel(row, batch, []).ready, true);
  assert.equal(prepareBulkModel(draft(), defaults, []).ready, true);
});

await group('existing Base Color assignment leaves named-file dependencies and inactive deferral separate', () => {
  const row = draft(['missing.png']);
  const batch = { ...defaults, existingTextureId: 10, isActive: true };
  const catalog = [{ id: 10, textureName: 'Farm', fileName: 'farm.png', isActive: true }];
  assert.equal(prepareBulkModel(row, batch, [], catalog).ready, false);
  row.configureLater = true;
  const plan = prepareBulkModel(row, batch, [], catalog);
  assert.equal(plan.ready, true);
  assert.equal(plan.settings.existingTextureId, 10);
  assert.equal(plan.settings.isActive, false);
  assert.equal(plan.attachments.length, 0);
  assert.equal(plan.unresolved.length, 1);
  assert.equal(prepareBulkModel(row, batch, [], []).ready, false);
});

await group('GLB/GLTF names and binary selections preserve the common limits and image distinction', () => {
  assert.equal(createBulkDraft(source('gltf', 'Town_House.GLTF')).modelName, 'Town House');
  assert.equal(createBulkDraft(source('glb', 'Town_House.GLB')).modelName, 'Town House');
  assert.equal(validateBulkCompanion(file('mesh.BIN')), null);
  assert.match(validateBulkTexture(file('mesh.bin'))!, /Textures/);
  assert.match(validateBulkCompanion(file('mesh.bin', 0))!, /empty/);
  assert.match(validateBulkCompanion(file('mesh.bin', MAX_BULK_FILE_BYTES + 1))!, /4 MiB/);
  assert.equal(defaultDestination('mesh.bin'), 'buffers/mesh.bin');
  assert.equal(defaultDestination('geometry/mesh.bin'), 'geometry/mesh.bin');
});

function gltfDraft(): BulkDraft {
  return { ...draft(), source: source('gltf', 'house.gltf'),
    requirements: [{ ...requirement('mesh.bin'), kind: 'buffer' }, requirement('wall.png')],
    gltfResources: { embeddedResourceCount: 0, embeddedByteLength: 0, externalBuffers: [{ relativePath: 'mesh.bin', byteLength: 12 }],
      textures: { embeddedImageCount: 0, bufferImageCount: 0, externalFileCount: 1 } },
  };
}

await group('binary dependencies stay mandatory when textures are deferred or an existing Texture is selected', () => {
  const row = gltfDraft();
  row.configureLater = true;
  row.overrides.existingTextureId = 10;
  const catalog = [{ id: 10, textureName: 'Farm', fileName: 'farm.png', isActive: true }];
  const missing = prepareBulkModel(row, defaults, [], catalog);
  assert.equal(missing.ready, false);
  assert.ok(missing.issues.some((issue) => issue.includes('binary buffer')));
  const ready = prepareBulkModel(row, defaults, [source('buffer', 'mesh.bin')], catalog);
  assert.equal(ready.ready, true);
  assert.equal(ready.settings.isActive, false);
  assert.equal(ready.settings.existingTextureId, 10);
  assert.deepEqual(ready.attachments.map(({ fileType, relativePath }) => ({ fileType, relativePath })), [{ fileType: 'binary', relativePath: 'buffers/mesh.bin' }]);
  assert.deepEqual(ready.unresolved, ['wall.png']);
});

await group('GLTF binary sizes, duplicate choices and pool removal recalculate readiness', () => {
  const row = gltfDraft();
  const buffer = source('buffer', 'mesh.bin');
  const image = source('image');
  assert.equal(prepareBulkModel(row, defaults, [buffer, image]).ready, true);
  const short = { ...buffer, file: file('mesh.bin', 8) };
  assert.equal(prepareBulkModel(row, defaults, [short, image]).ready, false);
  const duplicate = source('duplicate', 'mesh.bin');
  assert.equal(prepareBulkModel(row, defaults, [buffer, duplicate, image]).ready, false);
  choose(row, 0, 'duplicate');
  assert.equal(prepareBulkModel(row, defaults, [buffer, duplicate, image]).ready, true);
  assert.equal(prepareBulkModel(row, defaults, [buffer, image]).ready, false);
});

await group('GLTF image support and typed attachments cannot confuse a buffer with a texture', () => {
  const row = gltfDraft();
  const pool = [source('buffer', 'mesh.bin'), source('image')];
  const ready = prepareBulkModel(row, defaults, pool);
  assert.deepEqual(ready.attachments.map((entry) => entry.fileType), ['binary', 'texture']);
  row.requirements[0].kind = 'texture';
  assert.equal(prepareBulkModel(row, defaults, pool).ready, false);
  row.requirements = [requirement('wall.tga')];
  assert.equal(prepareBulkModel(row, defaults, [source('image', 'wall.tga')]).ready, false);
  assert.equal(prepareBulkModel(draft(['wall.tga']), defaults, [source('image', 'wall.tga')]).ready, true);
});

await group('GLTF aggregate resources and mixed-format rows are bounded independently', () => {
  const gltf = gltfDraft();
  const glb = { ...draft(), source: source('glb', 'house.glb'), gltfResources: { embeddedResourceCount: 1, embeddedByteLength: 32 * 1024 * 1024, externalBuffers: [],
    textures: { embeddedImageCount: 0, bufferImageCount: 0, externalFileCount: 0 } } };
  const fbx = draft();
  glb.extras = [{ id: 'extra', sourceId: 'image', relativePath: 'textures/wall.png' }];
  const plans = [fbx, glb, gltf].map((row) => prepareBulkModel(row, defaults, [source('image')]));
  assert.deepEqual(plans.map((plan) => plan.ready), [true, false, false]);
  assert.ok(plans[1].issues.some((issue) => issue.includes('32 MiB')));
});

await group('GLB summaries count embedded images separately from geometry buffers and retain no binary data', () => {
  const fixture = triangleGltfFixture();
  const secondImageOffset = Math.ceil((44 + fixture.image.byteLength) / 4) * 4;
  const bin = new Uint8Array(secondImageOffset + fixture.image.byteLength);
  bin.set(fixture.geometry);
  bin.set(fixture.image, 44);
  bin.set(fixture.image, secondImageOffset);
  const document = {
    ...fixture.document, buffers: [{ byteLength: bin.byteLength }],
    bufferViews: [...fixture.document.bufferViews,
      { buffer: 0, byteOffset: 44, byteLength: fixture.image.byteLength },
      { buffer: 0, byteOffset: secondImageOffset, byteLength: fixture.image.byteLength }],
    images: [{ bufferView: 2, mimeType: 'image/png' }, { bufferView: 3, mimeType: 'image/png' }],
    textures: [{ source: 0 }, { source: 1 }],
    materials: [{ ...fixture.document.materials[0], normalTexture: { index: 1 } }],
  };
  const inspection = inspectThreeDGltfBundle('field.glb', encodeGlb(document, bin));
  const summary = summarizeBulkGltfResources(inspection);
  assert.equal(summary.embeddedResourceCount, 3);
  assert.equal(summary.embeddedByteLength, bin.byteLength);
  assert.deepEqual(summary.externalBuffers, []);
  assert.deepEqual(summary.textures, { embeddedImageCount: 2, bufferImageCount: 0, externalFileCount: 0 });
  assert.equal('document' in summary, false);
  assert.equal('images' in summary, false);
  assert.equal('buffers' in summary, false);
  assert.ok(JSON.stringify(summary).length < 300, 'Preparation metadata must not retain embedded bytes');
});

await group('GLTF data-URI images are described as embedded in the primary file', () => {
  const fixture = triangleGltfFixture();
  const imageData = btoa(Array.from(fixture.image, (byte) => String.fromCharCode(byte)).join(''));
  const inspection = inspectThreeDGltfBundle('field.gltf', encodeGltf({
    ...fixture.document, images: [{ uri: `data:image/png;base64,${imageData}` }],
  }));
  const summary = summarizeBulkGltfResources(inspection);
  assert.deepEqual(summary.textures, { embeddedImageCount: 1, bufferImageCount: 0, externalFileCount: 0 });
  assert.deepEqual(summary.externalBuffers, [{ relativePath: 'buffers/triangle.bin', byteLength: 42 }]);
  assert.equal(summary.embeddedByteLength, fixture.image.byteLength);
});

await group('images in external GLTF binary buffers are not mislabeled as embedded in the primary', () => {
  const fixture = triangleGltfFixture();
  const inspection = inspectThreeDGltfBundle('field.gltf', encodeGltf({
    ...fixture.document, buffers: [{ uri: 'buffers/field.bin', byteLength: 44 + fixture.image.byteLength }],
    bufferViews: [...fixture.document.bufferViews, { buffer: 0, byteOffset: 44, byteLength: fixture.image.byteLength }],
    images: [{ bufferView: 2, mimeType: 'image/png' }],
  }));
  const summary = summarizeBulkGltfResources(inspection);
  assert.equal(summary.embeddedResourceCount, 1, 'The existing generic resource count is preserved');
  assert.deepEqual(summary.textures, { embeddedImageCount: 0, bufferImageCount: 1, externalFileCount: 0 });
  assert.deepEqual(summary.externalBuffers, [{ relativePath: 'buffers/field.bin', byteLength: 44 + fixture.image.byteLength }]);
  assert.equal(summary.embeddedByteLength, 0);
});

await group('separate texture files count unique normalized paths without counting repeated image declarations twice', () => {
  const fixture = triangleGltfFixture();
  const inspection = inspectThreeDGltfBundle('field.gltf', encodeGltf({
    ...fixture.document, images: [{ uri: 'textures/pixel.png' }, { uri: './textures/PIXEL.png' }, { uri: 'textures/another.png' }],
  }));
  assert.deepEqual(summarizeBulkGltfResources(inspection).textures, { embeddedImageCount: 0, bufferImageCount: 0, externalFileCount: 2 });
});

await group('a geometry-only GLB reports no texture images despite its embedded binary buffer', () => {
  const fixture = triangleGltfFixture();
  const inspection = inspectThreeDGltfBundle('untextured.glb', encodeGlb({
    ...fixture.document, buffers: [{ byteLength: fixture.geometry.byteLength }], images: [], textures: [], materials: [{}],
  }, fixture.geometry));
  const summary = summarizeBulkGltfResources(inspection);
  assert.equal(summary.embeddedResourceCount, 1);
  assert.deepEqual(summary.textures, { embeddedImageCount: 0, bufferImageCount: 0, externalFileCount: 0 });
});

await group('remembered defaults round-trip explicit choices and references without changing first-use defaults', () => {
  const chosen = { ...createBulkDefaults(), scale: '0.02', categoryIds: [4, 9], existingTextureId: 12,
    isLibraryItem: false, isPublic: true, usedByPlants: true, usedByCharacters: true, isActive: true };
  const encoded = serializeBulkPreferences(chosen);
  assert.ok(encoded);
  const restored = readBulkPreferences(encoded);
  assert.deepEqual(restored, chosen);
  restored!.categoryIds.push(15);
  assert.deepEqual(chosen.categoryIds, [4, 9]);
  assert.deepEqual(readBulkPreferences(encoded)!.categoryIds, [4, 9]);
  assert.equal(createBulkDefaults().scale, '1.0');
  assert.equal(createBulkDefaults().isPublic, false);
  assert.equal(createBulkDefaults().isActive, false);
});

await group('preference reads reject malformed, unknown-version, oversized and incomplete records', () => {
  for (const raw of [null, '', '{', 'null', '[]', '{}', 'x'.repeat(8193),
    JSON.stringify({ version: 2, defaults }),
    JSON.stringify({ version: '1', defaults }),
    JSON.stringify({ version: 1, defaults: { scale: '1' } }),
    JSON.stringify({ version: 1, defaults: { ...defaults, isPublic: 'false' } }),
    JSON.stringify({ version: 1, defaults: { ...defaults, isActive: 1 } }),
    JSON.stringify({ version: 1, defaults: { ...defaults, existingTextureId: '12' } }),
  ]) assert.equal(readBulkPreferences(raw), null);
});

await group('invalid transient numeric and reference choices cannot replace valid saved preferences', () => {
  const saved = serializeBulkPreferences({ ...defaults, scale: '0.02' });
  for (const scale of ['', ' ', '0', '-1', '0.009', 'Infinity', 'NaN', '1e999', '12px', '1'.repeat(65)]) {
    const next = serializeBulkPreferences({ ...defaults, scale });
    assert.equal(next, null, scale);
    assert.equal(readBulkPreferences(next ?? saved)!.scale, '0.02');
  }
  for (const patch of [{ categoryIds: [0] }, { categoryIds: [-1] }, { categoryIds: [1.5] },
    { categoryIds: [Number.MAX_SAFE_INTEGER + 1] }, { categoryIds: [1, 1] }, { categoryIds: Array<number>(1) },
    { categoryIds: Array.from({ length: 51 }, (_, index) => index + 1) },
    { existingTextureId: 0 }, { existingTextureId: 1.5 }, { existingTextureId: Infinity }]) {
    assert.equal(serializeBulkPreferences({ ...defaults, ...patch }), null);
  }
  assert.ok(serializeBulkPreferences({ ...defaults, scale: '0.01',
    categoryIds: Array.from({ length: 50 }, (_, index) => index + 1), existingTextureId: Number.MAX_SAFE_INTEGER }));
  assert.deepEqual(BULK_SCALE_PRESETS.map(({ label, value }) => [label, value]), [['1%', '0.01'], ['2%', '0.02'], ['100%', '1']]);
});

await group('preferences whitelist excludes files, paths, draft overrides and unknown metadata', () => {
  const extra = { ...defaults, file: file('private.fbx'), path: '/private/folder',
    configureLater: true, overrides: { scale: '2' }, extras: ['private'], results: { private: true } };
  const encoded = serializeBulkPreferences(extra);
  assert.ok(encoded);
  assert.deepEqual(JSON.parse(encoded).defaults, defaults);
  const raw = JSON.stringify({ version: 1, defaults: extra, unknown: 'ignored' });
  assert.deepEqual(readBulkPreferences(raw), defaults);
});

await group('preference storage keys separate owners and reject absent or malformed identity', () => {
  const first = createBulkPreferencesStorageKey('owner-1');
  const second = createBulkPreferencesStorageKey('owner-2');
  assert.ok(first);
  assert.notEqual(first, second);
  assert.notEqual(createBulkPreferencesStorageKey('owner/a'), createBulkPreferencesStorageKey('owner%2Fa'));
  assert.match(createBulkPreferencesStorageKey('owner/a')!, /owner%2Fa$/);
  for (const id of [null, undefined, '', ' owner ', 'owner\n', '\ud800', 'x'.repeat(257)]) {
    assert.equal(createBulkPreferencesStorageKey(id), null);
  }
});

console.log('─'.repeat(44));
console.log(`PASS  ${groups} validation groups completed`);
