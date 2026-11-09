import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Box3, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { convertAssemblyJson, parseAssemblyJson } from '../services/threed/models/assembly-json-import';
import { inspectThreeDGltfBundle } from '../services/threed/models/model-gltf-bundle-core';

class MemoryFileReader {
  result: ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then(bytes => {
      this.result = bytes;
      this.onloadend?.();
    });
  }
}
const prior = globalThis.FileReader;
globalThis.FileReader = MemoryFileReader as unknown as typeof FileReader;
const template = JSON.parse(fs.readFileSync('public/examples/assembly-groups/template.json', 'utf8'));
const copy = () => structuredClone(template);
function close(actual: number[], expected: number[], tolerance = 1e-5) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < tolerance, `${actual} != ${expected}`));
}

try {
  const parsed = parseAssemblyJson(template);
  assert.equal(parsed.parts.length, 2);
  assert.equal(parsed.units, 'inches');
  for (const mutation of [
    (data: any) => { data.formatVersion = 2; },
    (data: any) => { data.ownerId = 'claimed-owner'; },
    (data: any) => { data.parts[0].modelId = 15; },
    (data: any) => { data.parts[0].meshes[0].url = 'https://example.invalid/mesh'; },
    (data: any) => { data.parts[0].meshes[0].positions[0] = NaN; },
    (data: any) => { data.parts[0].meshes[0].positions.pop(); },
    (data: any) => { data.parts[0].meshes[0].color[3] = 2; },
    (data: any) => { data.parts[0].transform.scale = 0; },
    (data: any) => { data.parts = Array(101).fill(data.parts[0]); },
    (data: any) => { data.units = 'unknown'; },
    (data: any) => { data.upAxis = 'x'; },
  ]) {
    const value = copy();
    mutation(value);
    assert.throws(() => parseAssemblyJson(value));
  }
  const tooMany = copy();
  tooMany.parts[0].meshes[0].positions = Array(250_001 * 9).fill(1);
  assert.throws(() => parseAssemblyJson(tooMany), /250,000/);
  const collapsed = copy();
  collapsed.parts[0].meshes[0].positions.fill(0);
  await assert.rejects(convertAssemblyJson(collapsed, 'inches'), /collapsed/);
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(convertAssemblyJson(template, 'inches', cancelled.signal), { name: 'AbortError' });
  console.log('PASS strict JSON bounds, version, transforms, color, data-only fields and cancellation');

  const converted = await convertAssemblyJson(template, 'inches');
  assert.equal(converted.parts.length, 2);
  close(converted.size, [3, 1, 1]);
  close(converted.parts[0].position, [0.5, 0, 0.5]);
  close(converted.parts[1].position, [2.5, 0, 0.5]);
  const preview = await new GLTFLoader().parseAsync(converted.preview, '');
  const box = new Box3().setFromObject(preview.scene);
  close(box.min.toArray(), [0, 0, 0]);
  close(box.max.toArray(), [3, 1, 1]);
  for (const part of converted.parts) {
    const inspection = inspectThreeDGltfBundle('part.glb', new Uint8Array(part.bytes));
    assert.equal(inspection.requirements.length, 0);
    const gltf = await new GLTFLoader().parseAsync(part.bytes, '');
    const bounds = new Box3().setFromObject(gltf.scene);
    close(bounds.min.toArray(), [-0.5, 0, -0.5]);
    close(bounds.max.toArray(), [0.5, 1, 0.5]);
    gltf.scene.traverse(object => {
      if (object instanceof Mesh) {
        close(object.material.color.toArray(), [0.2, 0.6, 0.8]);
        object.geometry.dispose();
        object.material.dispose();
      }
    });
  }
  console.log('PASS actual self-contained GLBs, local origins, source offsets, materials and combined preview');

  const rotated = copy();
  rotated.parts = [rotated.parts[0]];
  rotated.parts[0].transform.position = { x: 24, y: 0, z: 0 };
  rotated.parts[0].transform.rotation.z = Math.PI / 2;
  rotated.parts[0].transform.scale = 2;
  const result = await convertAssemblyJson(rotated, 'inches');
  close(result.size, [2, 2, 2]);
  close(result.parts[0].position, [1, 0, 1]);
  console.log('PASS source translation/rotation/scale baked once');

  for (const [stem, count] of [
    ['fortunate-cabin-v001', 8],
    ['mcgee-home-garage-v001', 2],
    ['mcgee-home-garden-v001', 10],
  ] as const) {
    const bytes = fs.readFileSync(`public/examples/assembly-groups/${stem}.json`);
    assert.ok(bytes.length < 32 * 1024 * 1024);
    const source = parseAssemblyJson(JSON.parse(bytes.toString()));
    assert.equal(source.parts.length, count);
    assert.equal(source.units, null, 'Scaled source coordinates require an explicit unit choice');
    const imported = await convertAssemblyJson(source, 'feet');
    assert.equal(imported.parts.length, count);
    let triangles = 0;
    const combined = new Box3();
    for (const part of imported.parts) {
      const inspection = inspectThreeDGltfBundle('example.glb', new Uint8Array(part.bytes));
      assert.equal(inspection.requirements.length, 0);
      const gltf = await new GLTFLoader().parseAsync(part.bytes, '');
      const bounds = new Box3().setFromObject(gltf.scene);
      assert.ok(bounds.min.y >= -1e-5);
      gltf.scene.position.set(...part.position);
      combined.union(new Box3().setFromObject(gltf.scene));
      gltf.scene.traverse(object => {
        if (object instanceof Mesh) {
          triangles += object.geometry.getAttribute('position').count / 3;
          object.geometry.dispose();
          object.material.dispose();
        }
      });
    }
    close(combined.getSize(new Vector3()).toArray(), imported.size, 1e-4);
    assert.equal(triangles, imported.triangleCount);
    console.log(`PASS ${stem}: ${count} Models, ${triangles} triangles, retained Assembly arrangement`);
  }
} finally {
  globalThis.FileReader = prior;
}
