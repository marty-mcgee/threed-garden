import assert from 'node:assert/strict';
import { register } from 'node:module';
// @ts-expect-error Native validator requires explicit extensions.
import { matchingSavedBulkTexture, readSavedBulkTexture } from '../../components/admin/threed/models/model-bulk-saved-texture.ts';
// @ts-expect-error Native validator requires explicit extensions.
import { createBulkDefaults, createBulkDraft, prepareBulkModel } from '../../components/admin/threed/models/model-bulk-preparation-core.ts';
// @ts-expect-error Native validator requires explicit extensions.
import { createBulkModelPreviewSnapshot } from '../../components/admin/threed/models/model-bulk-preview-window.ts';
const defaults = { ...createBulkDefaults(), existingTextureId: 7 };
const draft = { ...createBulkDraft({ id: 'fbx', file: new File(['fixture'], 'hat.fbx'), sourcePath: 'hat.fbx', selectionRoot: '' }), inspecting: false,
  requirements: [{ kind: 'texture' as const, fileName: 'Atlas.png', relativePath: 'Atlas.png', referencedBy: 'hat.fbx' }] };
const texture = { id: 7, textureName: 'Atlas', fileName: 'Atlas.png', filePath: 'https://fixture.test/atlas.png', isActive: true };
assert.equal(matchingSavedBulkTexture(draft, defaults, [], [texture]), texture);
assert.equal(matchingSavedBulkTexture({ ...draft, overrides: { existingTextureId: null } }, defaults, [], [texture]), undefined);
assert.equal(matchingSavedBulkTexture(draft, defaults, [], [{ ...texture, isActive: false }]), undefined);
assert.equal(matchingSavedBulkTexture(draft, defaults, [], [{ ...texture, fileName: 'Other.png' }]), undefined);
assert.equal(matchingSavedBulkTexture({ ...draft, source: { ...draft.source, file: new File(['fixture'], 'hat.gltf') } }, defaults, [], [texture]), undefined);
assert.equal(matchingSavedBulkTexture({ ...draft, requirements: [{ ...draft.requirements[0], kind: 'buffer' }] }, defaults, [], [texture]), undefined);
const originalFetch = globalThis.fetch;
let cancelled = false;
try {
  globalThis.fetch = async () => new Response(new Uint8Array([137,80,78,71]), { headers: { 'content-type': 'image/png' } });
  const source = await readSavedBulkTexture(texture, new AbortController().signal);
  assert.equal(source.file.name, 'Atlas.png');
  assert.deepEqual(source.sharedTexture, { id: texture.id, filePath: texture.filePath });
  assert.equal(prepareBulkModel(draft, defaults, [source], [texture]).attachments[0].source.sharedTexture?.filePath, texture.filePath);
  assert.equal(matchingSavedBulkTexture(draft, defaults, [source], [texture]), undefined);
  const plan = prepareBulkModel(draft, defaults, [source], [texture]);
  assert.equal(plan.ready, true);
  assert.equal(plan.attachments[0].relativePath, 'textures/Atlas.png');
  assert.equal(plan.attachments[0].fileType, 'texture');
  assert.equal(createBulkModelPreviewSnapshot(draft, plan).attachments[0].file, source.file);
  await assert.rejects(readSavedBulkTexture({ ...texture, filePath: 'http://fixture.test/x' }, new AbortController().signal), /HTTPS/);
  globalThis.fetch = async () => new Response('denied', { status: 403 });
  await assert.rejects(readSavedBulkTexture(texture, new AbortController().signal), /could not be read/);
  globalThis.fetch = async () => new Response(new Uint8Array());
  await assert.rejects(readSavedBulkTexture(texture, new AbortController().signal), /empty/);
  globalThis.fetch = async () => new Response(new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1)); }, cancel() { cancelled = true; } }));
  await assert.rejects(readSavedBulkTexture(texture, new AbortController().signal), /4 MiB/);
  assert.equal(cancelled, true);
} finally { globalThis.fetch = originalFetch; }
console.log('PASS: matching saved FBX Texture, overrides, inactive/mismatched/local/geometry exclusion, download bounds/errors, prepared attachment and preview snapshot');

// @ts-expect-error Native validator requires explicit extensions.
const { withSavedFbxTextures } = await import('../services/threed/models/model-saved-texture-fallback.ts');
const saved = { fileName: 'Atlas.png', filePath: 'https://fixture.test/shared.png', isActive: true };
assert.equal(withSavedFbxTextures('fbx', [], [saved])[0].filePath, saved.filePath);
assert.deepEqual(withSavedFbxTextures('glb', [], [saved]), []);
assert.deepEqual(withSavedFbxTextures('fbx', [], [saved, { ...saved, fileName: 'ATLAS.PNG', filePath: 'https://fixture.test/other.png' }]), []);
assert.deepEqual(withSavedFbxTextures('fbx', [], [{ ...saved, isActive: false }]), []);
assert.deepEqual(withSavedFbxTextures('fbx', [], [{ ...saved, filePath: '' }]), []);
const attached = { fileName: 'Atlas.png', relativePath: 'textures/Atlas.png', filePath: 'https://fixture.test/attached.png', fileType: 'texture' };
assert.deepEqual(withSavedFbxTextures('fbx', [attached], [saved]), [attached]);
console.log('PASS: saved FBX filename aliases reuse URLs, preserve attachments, reject ambiguity/inactive/missing URLs, and leave other formats unchanged');

// Match bundler resolution for the Character loader's transitive local imports.
register(`data:text/javascript,${encodeURIComponent(`
  export function resolve(specifier, context, nextResolve) {
    return nextResolve(specifier.startsWith('./') && !/\\.[a-z]+$/i.test(specifier)
      ? specifier + '.ts' : specifier, context);
  }
`)}`, import.meta.url);
// @ts-expect-error Native validator requires explicit extensions.
const { loadCharacterTextureManager } = await import('../services/threed/models/character-model-textures.ts');
try {
  let linked = false;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/threed/models?id=11');
    assert.equal(options?.cache, 'no-store');
    return Response.json({ success: true, data: { modelType: 'fbx', files: linked ? [attached] : [], textureFallbacks: [saved] } });
  };
  const preview = await loadCharacterTextureManager(11);
  const request = 'https://fixture.test/models/farmgirl/primary/Atlas.png';
  assert.equal(preview.manager.resolveURL(request), saved.filePath);
  assert.equal(preview.manager.resolveURL('https://fixture.test/model.fbx'), 'https://fixture.test/model.fbx');
  linked = true;
  const persisted = await loadCharacterTextureManager(11);
  assert.equal(persisted.manager.resolveURL(request), attached.filePath);
  assert.notEqual(preview.signature, persisted.signature);
  globalThis.fetch = async () => new Response('denied', { status: 403 });
  await assert.rejects(loadCharacterTextureManager(11), /texture references/);
} finally { globalThis.fetch = originalFetch; }
console.log('PASS: Character loader redirects primary-folder PNG requests to shared or attached URLs, refreshes cache identity, and rejects failed reference reads');
