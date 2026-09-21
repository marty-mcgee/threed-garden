// Browser-portable assertions keep native and real-loader checks on the same fixtures.
const assert = {
  ok(value: unknown) { if (!value) throw new Error('Expected a truthy value.'); },
  equal(actual: unknown, expected: unknown) { if (actual !== expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}.`); },
  deepEqual(actual: unknown, expected: unknown) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`); },
  match(value: string, expected: RegExp) { if (!expected.test(value)) throw new Error(`Expected ${value} to match ${expected}.`); },
  throws(run: () => unknown, expected?: RegExp) { try { run(); } catch (error) { if (expected) assert.match(String(error), expected); return; } throw new Error('Expected rejection.'); },
  doesNotThrow(run: () => unknown) { run(); },
  async rejects(run: Promise<unknown>, expected?: RegExp) { try { await run; } catch (error) { if (expected) assert.match(String(error), expected); return; } throw new Error('Expected rejection.'); },
};
// @ts-expect-error Native validator needs explicit extensions.
import { inspectObjGeometry, inspectObjLibraries, inspectObjMaterial, resolveObjPath } from '../services/threed/models/model-obj-core.ts';
// @ts-expect-error Native validator needs explicit extensions.
import { loadObjBundle, loadStoredObjModel, resolveObjSource, type ObjSource } from '../services/threed/models/model-obj-loader.ts';
// @ts-expect-error Native validator needs explicit extensions.
import { objGeometry, objTriangle, objWithMaterial, objMaterial, objTexturedMaterial, objImage } from './fixtures/obj-bundle-fixtures.ts';
// @ts-expect-error Native validator needs explicit extensions.
import { createBulkDefaults, createBulkDraft, prepareBulkModel, type BulkSource } from '../../components/admin/threed/models/model-bulk-preparation-core.ts';
// @ts-expect-error Native validator needs explicit extensions.
import { inspectThreeDModelMaterial } from '../services/threed/models/model-companion-core.ts';
import * as THREE from 'three';
const encoder = new TextEncoder();
const source = (path: string, content: string | Uint8Array): ObjSource => ({ fileName: path.split('/').at(-1)!, relativePath: path, read: async () => typeof content === 'string' ? encoder.encode(content) : content });
const primary = (text = objWithMaterial) => source('triangle.obj', text);
const material = (text = objMaterial) => source('materials/paint.mtl', text);
export async function runObjBundleChecks(browserImages = false) {
  let groups = 0;
  const group = async (label: string, run: () => void | Promise<void>) => { await run(); groups += 1; console.log(`  ✓ ${label}`); };
  await group('OBJ libraries support spaces, quotes, multiple names, comments and bounded relative paths', () => {
    assert.deepEqual(inspectObjLibraries('mtllib "a one.mtl" b.mtl # note', 'x.obj').map((r) => r.relativePath), ['a one.mtl', 'b.mtl']);
    assert.equal(inspectObjLibraries('mtllib my materials.mtl', 'x.obj')[0].relativePath, 'my materials.mtl');
    assert.equal(resolveObjPath('../images/paint.png', 'materials/paint.mtl'), 'images/paint.png');
    for (const path of ['../../escape.png', 'https://example.test/x.png', '/x.png', '%2fetc', '%5cetc', '%2e%2e%5c..%5cescape.png', '%252e%252e/x', 'x.png?query', 'x.png#fragment']) assert.throws(() => resolveObjPath(path, 'materials/x.mtl'));
  });
  await group('MTL maps retain quoted image names, transform options, colors and clamp intent', () => {
    const parsed = inspectObjMaterial(objTexturedMaterial + 'norm -bm 0.3 ../images/normal.png\n', 'materials/paint.mtl');
    assert.deepEqual(parsed.requirements.map((r) => r.relativePath), ['images/paint atlas.png', 'images/normal.png']);
    assert.match(parsed.text, /map_kd -s 2 3 1 -o 0.1 0.2 0 obj-map:0/);
    assert.equal(parsed.maps[0].clamp, true);
    assert.deepEqual(inspectThreeDModelMaterial('paint.mtl', objTexturedMaterial, 'materials/paint.mtl').map((r) => r.relativePath), ['images/paint atlas.png']);
    for (const text of ['newmtl __proto__', 'newmtl Paint\nKd nan 0 0', 'newmtl Paint\nmap_Kd -unknown 1 file.png', 'newmtl Paint\nmap_Ka file.png', 'newmtl Paint\nmap_Kd file.tga', 'newmtl Paint\nnewmtl Paint']) assert.throws(() => inspectObjMaterial(text, 'paint.mtl'));
  });
  await group('OBJ geometry validates actual indices, negative indices, finite data and supported primitives', () => {
    assert.equal(inspectObjGeometry(objTriangle, 'x.obj').requirements.length, 0);
    assert.doesNotThrow(() => inspectObjGeometry(objGeometry + 'f -3/-3/-1 -2/-2/-1 -1/-1/-1', 'x.obj'));
    for (const text of ['mtllib a.mtl', objGeometry + 'f 0 2 3', objGeometry + 'f 1 2 4', objGeometry + 'f -4 -2 -1', objGeometry + 'f 1 2', objTriangle.replace('v 2 0 0', 'v NaN 0 0'), objTriangle + 'curv 0 1 1 2 3']) assert.throws(() => inspectObjGeometry(text, 'x.obj'));
  });
  await group('actual OBJLoader/MTLLoader preserves colors, shininess, canonical slots and cleanup', async () => {
    const lease = await loadObjBundle(primary(), [material()], false);
    const mesh = lease.scene.children[0] as THREE.Mesh;
    const mat = mesh.material as THREE.MeshPhongMaterial;
    assert.equal(mat.name, 'Paint'); assert.equal(mat.shininess, 40); assert.ok(mat.color.r > mat.color.b);
    assert.deepEqual(lease.materialTargets.targetKeys, ['mesh:0:material:0']);
    let disposed = 0; mesh.geometry.addEventListener('dispose', () => disposed++);
    lease.dispose(); lease.dispose(); assert.equal(disposed, 1);
    const plain = await loadObjBundle(primary(objTriangle), [], false); plain.dispose();
  });
  await group('missing/ambiguous MTL and undefined or duplicate material names fail before resource fetches', async () => {
    await assert.rejects(loadObjBundle(primary(), [], true), /material library/);
    assert.throws(() => resolveObjSource('paint.mtl', [material(), source('other/paint.mtl', objMaterial)]), /Ambiguous/);
    await assert.rejects(loadObjBundle(primary(), [material('newmtl Other\nKd 1 1 1')], false), /undefined material/);
    await assert.rejects(loadObjBundle(primary(objWithMaterial.replace('mtllib materials/paint.mtl', 'mtllib materials/paint.mtl second.mtl')), [material(), source('second.mtl', objMaterial)], false), /Duplicate/);
  });
  await group('bulk readiness recursively discovers MTL images and keeps material libraries mandatory', () => {
    const selected: BulkSource = { id: 'obj', file: new File([objWithMaterial], 'triangle.obj'), sourcePath: 'triangle.obj', selectionRoot: '' };
    const draft = { ...createBulkDraft(selected), inspecting: false, requirements: inspectObjGeometry(objWithMaterial, 'triangle.obj').requirements };
    const mtl: BulkSource = { id: 'mtl', file: new File([objTexturedMaterial], 'paint.mtl'), sourcePath: 'paint.mtl', selectionRoot: '', materialText: objTexturedMaterial };
    const image: BulkSource = { id: 'image', file: new File([objImage], 'paint atlas.png'), sourcePath: 'paint atlas.png', selectionRoot: '' };
    assert.equal(prepareBulkModel({ ...draft, configureLater: true }, createBulkDefaults(), []).ready, false);
    assert.equal(prepareBulkModel(draft, createBulkDefaults(), [mtl]).ready, false);
    assert.equal(prepareBulkModel({ ...draft, configureLater: true }, createBulkDefaults(), [mtl]).ready, true);
    const ready = prepareBulkModel(draft, createBulkDefaults(), [mtl, image]);
    assert.equal(ready.ready, true); assert.deepEqual(ready.attachments.map((a) => a.fileType), ['other', 'texture']);
    assert.equal(ready.matches[1].requirement.relativePath, 'images/paint atlas.png');
    assert.equal(prepareBulkModel(draft, createBulkDefaults(), [{ ...mtl, materialText: undefined }, image]).ready, false);
  });
  if (browserImages) {
    await group('real image decoding preserves MTL maps, transforms and clamping with owned URL cleanup', async () => {
      const lease = await loadObjBundle(primary(), [material(objTexturedMaterial), source('images/paint atlas.png', objImage)], false);
      const mat = (lease.scene.children[0] as THREE.Mesh).material as THREE.MeshPhongMaterial;
      assert.equal((mat.map?.image as HTMLImageElement | undefined)?.naturalWidth, 1); assert.deepEqual(mat.map?.repeat.toArray(), [2, 3]);
      assert.deepEqual(mat.map?.offset.toArray(), [0.1, 0.2]); assert.equal(mat.map?.wrapS, THREE.ClampToEdgeWrapping);
      assert.equal(mat.map?.colorSpace, THREE.SRGBColorSpace); lease.dispose();
    });
    await group('missing image placeholders are explicit; corrupt supplied images and ambiguous paths fail', async () => {
      await assert.rejects(loadObjBundle(primary(), [material(objTexturedMaterial)], false), /Missing OBJ texture/);
      const deferred = await loadObjBundle(primary(), [material(objTexturedMaterial)], true);
      assert.deepEqual(deferred.missingTexturePaths, ['images/paint atlas.png']); deferred.dispose();
      await assert.rejects(loadObjBundle(primary(), [material(objTexturedMaterial), source('images/paint atlas.png', 'bad PNG')], true), /not a supported/);
      await assert.rejects(loadObjBundle(primary(), [material(objTexturedMaterial), source('one/paint atlas.png', objImage), source('two/paint atlas.png', objImage)], true), /Ambiguous/);
    });
    await group('saved single/bulk OBJ renderer uses the same material contract and selected attachment URLs', async () => {
      const original = globalThis.fetch;
      const calls: string[] = [];
      const values = new Map([['https://obj.test/model.obj', encoder.encode(objWithMaterial)], ['https://obj.test/a.mtl', encoder.encode(objTexturedMaterial)], ['https://obj.test/a.png', objImage]]);
      globalThis.fetch = async (url) => { calls.push(String(url)); const bytes = values.get(String(url)); if (!bytes) throw new Error('Unexpected resource URL.'); return new Response(new Uint8Array(bytes)); };
      try {
        const scene = await loadStoredObjModel('https://obj.test/model.obj', [
          { fileName: 'paint.mtl', relativePath: 'materials/paint.mtl', filePath: 'https://obj.test/a.mtl', fileType: 'other' },
          { fileName: 'paint atlas.png', relativePath: 'images/paint atlas.png', filePath: 'https://obj.test/a.png', fileType: 'texture' },
        ]);
        const mesh = scene.children[0] as THREE.Mesh; const mat = mesh.material as THREE.MeshPhongMaterial;
        assert.equal((mat.map?.image as HTMLImageElement | undefined)?.naturalWidth, 1); assert.equal(mat.name, 'Paint'); assert.equal(calls.length, 3);
        mesh.geometry.dispose(); mat.map?.dispose(); mat.dispose();
        const staged = await loadStoredObjModel('https://obj.test/model.obj', [], true);
        const stagedMesh = staged.children[0] as THREE.Mesh;
        assert.equal((stagedMesh.material as THREE.MeshPhongMaterial).map, null);
        assert.equal(calls.length, 4);
        stagedMesh.geometry.dispose(); (stagedMesh.material as THREE.Material).dispose();
      } finally { globalThis.fetch = original; }
    });
  }
  console.log(`PASS: ${groups} OBJ/MTL groups`);
  return groups;
}
if (typeof window === 'undefined') await runObjBundleChecks();
