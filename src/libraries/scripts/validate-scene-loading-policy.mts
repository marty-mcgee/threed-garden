import { sceneResourceFileName } from '../../components/threed/shared/SceneResourceStatus';
import assert from 'node:assert/strict';
import { LoadingManager, Group, Mesh, BoxGeometry, MeshStandardMaterial, Texture } from 'three';
import { assertModelTexturesReady, modelLoadCompletion } from '../services/threed/models/model-load-completion';
import { referencedSceneTextures, sceneTextureResources } from '../services/project/scene-texture-resources';

const model = { id: 7, userId: 'owner', modelType: 'fbx', filePath: 'https://test.public.blob.vercel-storage.com/models/7/model.fbx' };
const texture = { userId: 'owner', fileName: 'atlas.png', filePath: 'https://test.public.blob.vercel-storage.com/textures/atlas.png', isActive: true };
const textures = [texture, { ...texture, fileName: 'unrelated.png' }, { ...texture, userId: 'stranger' }, { ...texture, fileName: 'inactive.png', isActive: false }];
assert.deepEqual(referencedSceneTextures(model, new Set(['atlas.png', 'inactive.png']), textures), [{ fileName: texture.fileName, filePath: texture.filePath, isActive: true }]);
assert.deepEqual(referencedSceneTextures(model, new Set(['atlas.png']), [...textures, { ...texture, filePath: 'https://other/atlas.png' }]), [], 'Ambiguous names must not select random textures');
const originalFetch = globalThis.fetch;
let requests = 0;
globalThis.fetch = async () => { requests++; return new Response(new TextEncoder().encode('"atlas.png"')); };
try {
  const resolved = await sceneTextureResources(model, textures);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].filePath, texture.filePath);
  assert.equal('userId' in resolved[0], false);
  assert.deepEqual(await sceneTextureResources(model, textures), resolved);
  assert.equal(requests, 1, 'Bounded reference cache reuses inspection');
  assert.deepEqual(await sceneTextureResources({ ...model, filePath: 'http://localhost/private' }, textures), []);
  assert.equal(requests, 1, 'Untrusted primary locations cannot be fetched');
} finally { globalThis.fetch = originalFetch; }

const manager = new LoadingManager();
const wait = modelLoadCompletion(manager);
manager.itemStart('primary.fbx'); manager.itemStart('atlas.png'); manager.itemEnd('primary.fbx');
let ready = false;
const completion = wait().then(() => { ready = true; });
await new Promise(resolve => setTimeout(resolve, 5));
assert.equal(ready, false, 'Geometry must not unlock Scene before texture completion');
manager.itemEnd('atlas.png'); await completion; assert.equal(ready, true);
const failed = new LoadingManager(); const waitFailed = modelLoadCompletion(failed);
failed.itemStart('atlas.png');
const failure = assert.rejects(waitFailed(), /resources failed/);
failed.itemError('atlas.png'); await failure;
const timed = new LoadingManager(); const waitTimed = modelLoadCompletion(timed);
timed.itemStart('stalled.png'); await assert.rejects(waitTimed(5), /timed out/);
await modelLoadCompletion(new LoadingManager())();
console.log('PASS scoped referenced textures, cache/URL boundaries, delayed resources, immediate failures and bounded timeout');

const root = new Group(); const material = new MeshStandardMaterial({ map: new Texture() });
root.add(new Mesh(new BoxGeometry(), material));
assert.throws(() => assertModelTexturesReady(root), /texture is unavailable/);
material.name = 'Character outfit';
material.map!.name = 'outfit.png';
assert.throws(() => assertModelTexturesReady(root), /outfit\.png \(Character outfit, map\)/);
material.map!.name = '';
material.map!.source.data = { src: 'https://assets.invalid/outfit.png?token=private', naturalWidth: 0, naturalHeight: 0 };
assert.throws(() => assertModelTexturesReady(root), error => error instanceof Error && error.message.includes('outfit.png') && !error.message.includes('private'));
material.map = new Texture({ width: 4, height: 4 });
assert.doesNotThrow(() => assertModelTexturesReady(root), 'Valid saved replacement supersedes failed original texture');
const replacementManager = new LoadingManager(); const waitReplacement = modelLoadCompletion(replacementManager);
replacementManager.itemStart('obsolete.png'); replacementManager.itemError('obsolete.png');
let replacementComplete = false;
const replaced = waitReplacement(100, true).then(ok => { assert.equal(ok, false); replacementComplete = true; });
await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(replacementComplete, false);
replacementManager.itemEnd('obsolete.png'); await replaced;
console.log('PASS final material validation and replacement-aware load completion');

// The same Scene reporter is provided for anonymous and authenticated viewers.
const issues: Array<{ url: string; message: string }> = [];
const progressive = new LoadingManager();
const waitProgressive = modelLoadCompletion(progressive, (url, message) => issues.push({ url, message }));
progressive.itemStart('https://assets.invalid/Leaves_Diff.tga');
assert.equal(await waitProgressive(), false, 'Slow textures do not delay Scene geometry');
progressive.itemError('https://assets.invalid/Leaves_Diff.tga');
assert.equal(await waitProgressive(), false, 'A missing texture does not reject a Scene Model');
assert.deepEqual(issues, [{ url: 'https://assets.invalid/Leaves_Diff.tga', message: 'Could not load' }]);
progressive.itemEnd('https://assets.invalid/Leaves_Diff.tga');
progressive.itemStart('https://assets.invalid/late.png');
progressive.itemEnd('https://assets.invalid/late.png');
assert.deepEqual(issues.at(-1), { url: 'https://assets.invalid/late.png', message: '' }, 'Successful late load clears its warning');
console.log('PASS progressive Scene textures: geometry survives delays/failures, warnings retain filenames and late successes clear');

assert.equal(sceneResourceFileName('https://assets.invalid/private/path/Leaves_Diff.tga?token=secret'), 'Leaves_Diff.tga');
assert.equal(sceneResourceFileName('https://assets.invalid/Leaf%20Atlas.png'), 'Leaf Atlas.png');
console.log('PASS warnings display filenames without URL query parameters or private paths');
