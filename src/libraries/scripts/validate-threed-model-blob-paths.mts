import assert from 'node:assert/strict';
// @ts-expect-error Native validator needs explicit extensions.
import { createThreeDBlobPath, createThreeDAttachmentBlobPath, isOwnedStagedModelBlobUrl, readableBlobFileName } from '../services/threed/models/model-blob-paths.ts';
// @ts-expect-error Native validator needs explicit extensions.
import { isOwnedThreeDBlobUrl } from '../services/threed/models/model-file-integrity.ts';
const owner = 'user-123';
const id = '12345678-1234-4234-8234-123456789012';
const next = '22345678-1234-4234-8234-123456789012';
const url = (path: string) => `https://fixture.public.blob.vercel-storage.com/${path}`;
for (const ext of ['fbx','glb','gltf','obj','usdz']) {
  const path = createThreeDBlobPath(owner, 'models', `SM Hat 01.${ext}`, id);
  assert.equal(path, `threed/users/${owner}/models/SM-Hat-01--${id}/primary/SM-Hat-01.${ext}`);
  assert.ok(isOwnedStagedModelBlobUrl(url(path), owner));
  assert.ok(isOwnedThreeDBlobUrl(url(path), { userId: owner, modelId: 7 }));
  assert.equal(isOwnedStagedModelBlobUrl(url(path), 'other'), false);
  const attachment = createThreeDAttachmentBlobPath(owner, 7, url(path), 'textures/Walls/Atlas.png', next);
  assert.ok(attachment.startsWith(path.split('/primary/')[0] + '/attachments/textures/Walls/'));
  assert.ok(attachment.endsWith('/Atlas.png'));
  assert.ok(isOwnedThreeDBlobUrl(url(attachment), { userId: owner, modelId: 7 }));
  assert.equal(isOwnedStagedModelBlobUrl(url(attachment), owner), false);
}
const shared = url(createThreeDBlobPath(owner, 'textures', 'Farm Atlas.png', id));
assert.equal(isOwnedThreeDBlobUrl(shared, { userId: owner, modelId: 7 }), false);
assert.equal(isOwnedStagedModelBlobUrl(shared, owner), false);
const preview = url(createThreeDBlobPath(owner, 'previews', 'Hat Preview.png', id));
assert.ok(isOwnedThreeDBlobUrl(preview, { userId: owner, modelId: 7 }));
assert.equal(isOwnedStagedModelBlobUrl(preview, owner), false);
assert.ok(isOwnedStagedModelBlobUrl(url(`models/${owner}/upload/123456.fbx`), owner));
for (const path of [`models/${owner}/upload/123456.fbx`, `models/${owner}/previews/123.png`, 'models/7/attachments/textures/Atlas.png']) assert.ok(isOwnedThreeDBlobUrl(url(path), { userId: owner, modelId: 7 }));
const fallback = createThreeDAttachmentBlobPath(owner, 7, url(`models/${owner}/upload/123456.fbx`), 'textures/Atlas.png', id);
assert.ok(fallback.startsWith(`threed/users/${owner}/models/model-7/attachments/textures/`));
assert.ok(isOwnedThreeDBlobUrl(url(fallback), { userId: owner, modelId: 7 }));
assert.equal(isOwnedThreeDBlobUrl(url(fallback), { userId: owner, modelId: 8 }), false);
assert.notEqual(createThreeDBlobPath(owner, 'models', 'same.fbx', id), createThreeDBlobPath(owner, 'models', 'same.fbx', next));
for (const bad of ['../owner', 'owner/x', 'owner%2fx']) assert.throws(() => createThreeDBlobPath(bad, 'models', 'x.obj', id));
assert.throws(() => createThreeDBlobPath(owner, 'models', 'x.obj', 'timestamp'));
assert.equal(readableBlobFileName('C:\\temp\\My Model.FBX'), 'My-Model.fbx');
assert.equal(readableBlobFileName('../../café !.PNG'), 'cafe.png');
assert.ok(url(createThreeDAttachmentBlobPath('u'.repeat(64), 7, '', 'a'.repeat(100) + '/' + 'b'.repeat(250) + '.png', id)).length < 500);
for (const invalid of [shared.replace('https:', 'http:'), shared.replace('blob.vercel-storage.com','evil.test'), shared+'?x=1']) assert.equal(isOwnedStagedModelBlobUrl(invalid, owner),false);
console.log('PASS: readable unique asset folders, attachment grouping, shared Texture exclusion, legacy ownership/cleanup, owner isolation, safe names and bounded paths');
