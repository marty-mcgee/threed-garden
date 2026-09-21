import assert from 'node:assert/strict';
import {
  MAX_GLTF_BUNDLE_BYTES, inspectThreeDGltfBundle, normalizeThreeDGltfBundlePath,
  resolveThreeDGltfBundleResource, validateThreeDGltfBundleResources,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-gltf-bundle-core.ts';
import {
  triangleGltfFixture, encodeGltf, encodeGlb,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './fixtures/gltf-bundle-fixtures.ts';

let groups = 0;
function group(label: string, run: () => void) { run(); groups += 1; console.log(`  ✓ ${label}`) }
function inspect(document: object) { return inspectThreeDGltfBundle('triangle.gltf', encodeGltf(document)) }
function invalid(document: object, expected: RegExp) { assert.throws(() => inspect(document), expected) }
function asData(bytes: Uint8Array, mime = 'application/octet-stream') {
  return `data:${mime};base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}`;
}

console.log('\nThreeD GLB/GLTF bundle validation');
console.log('─'.repeat(44));

group('ordinary GLTF separates external binary and image requirements without altering source bytes', () => {
  const fixture = triangleGltfFixture();
  const bytes = encodeGltf(fixture.document);
  const before = bytes.slice();
  const result = inspectThreeDGltfBundle('TRIANGLE.GLTF', bytes);
  assert.deepEqual(result.requirements.map((entry) => [entry.kind, entry.relativePath]), [
    ['buffer', 'buffers/triangle.bin'], ['texture', 'textures/pixel.png'],
  ]);
  assert.equal(result.buffers[0].byteLength, 42);
  assert.equal(result.decodedByteLength, 42);
  assert.equal(result.embeddedByteLength, 0);
  assert.deepEqual(validateThreeDGltfBundleResources(result, fixture.resources, false), []);
  assert.deepEqual(bytes, before);
});

group('GLB embedded geometry keeps original bytes and permits only alignment padding', () => {
  const fixture = triangleGltfFixture();
  const document = { ...fixture.document, buffers: [{ byteLength: fixture.geometry.byteLength }] };
  const bytes = encodeGlb(document, fixture.geometry);
  const before = bytes.slice();
  const result = inspectThreeDGltfBundle('triangle.glb', bytes);
  assert.equal(result.modelType, 'glb');
  assert.equal(result.embeddedResourceCount, 1);
  assert.equal(result.embeddedByteLength, 42);
  assert.deepEqual(result.buffers[0].embedded, fixture.geometry);
  assert.equal(result.requirements.length, 1);
  assert.deepEqual(validateThreeDGltfBundleResources(result, [fixture.resources[1]], false), []);
  assert.deepEqual(bytes, before);
  const padded = bytes.slice();
  padded[padded.length - 1] = 1;
  assert.throws(() => inspectThreeDGltfBundle('triangle.glb', padded), /padding/);
});

group('GLB still discovers external geometry and images when there is no BIN chunk', () => {
  const fixture = triangleGltfFixture();
  const result = inspectThreeDGltfBundle('triangle.glb', encodeGlb(fixture.document));
  assert.equal(result.requirements.length, 2);
  assert.equal(result.embeddedResourceCount, 0);
  assert.deepEqual(validateThreeDGltfBundleResources(result, fixture.resources, false), []);
});

group('GLB rejects truncated headers, mismatched lengths, versions and malformed chunk layouts', () => {
  const fixture = triangleGltfFixture();
  const original = encodeGlb(fixture.document);
  assert.throws(() => inspectThreeDGltfBundle('bad.glb', original.subarray(0, 19)), /header/);
  assert.throws(() => inspectThreeDGltfBundle('bad.glb', original.subarray(0, original.length - 4)), /declared length/);
  for (const [offset, value, message] of [[0, 0, /version 2/], [4, 1, /version 2/], [12, 3, /unaligned/], [16, 0x004e4942, /JSON/]] as const) {
    const changed = original.slice();
    new DataView(changed.buffer).setUint32(offset, value, true);
    assert.throws(() => inspectThreeDGltfBundle('bad.glb', changed), message);
  }
  const extra = new Uint8Array(original.length + 8);
  extra.set(original);
  const view = new DataView(extra.buffer);
  view.setUint32(8, extra.length, true);
  view.setUint32(original.length + 4, 0x4e4f534a, true);
  assert.throws(() => inspectThreeDGltfBundle('bad.glb', extra), /optional BIN/);
  assert.throws(() => inspectThreeDGltfBundle('bad.glb', encodeGlb(fixture.document, fixture.geometry)), /unreferenced BIN/);
});

group('bufferView images stay inside embedded BIN data without duplicate byte accounting', () => {
  const fixture = triangleGltfFixture();
  const bin = new Uint8Array(44 + fixture.image.byteLength);
  bin.set(fixture.geometry);
  bin.set(fixture.image, 44);
  const document = {
    ...fixture.document, buffers: [{ byteLength: bin.byteLength }],
    bufferViews: [...fixture.document.bufferViews, { buffer: 0, byteOffset: 44, byteLength: fixture.image.byteLength }],
    images: [{ bufferView: 2, mimeType: 'image/png' }],
  };
  const result = inspectThreeDGltfBundle('embedded.glb', encodeGlb(document, bin));
  assert.deepEqual(result.requirements, []);
  assert.equal(result.embeddedResourceCount, 2);
  assert.equal(result.embeddedByteLength, bin.byteLength);
  assert.deepEqual(result.images[0].embedded, fixture.image);
  assert.deepEqual(validateThreeDGltfBundleResources(result, [], false), []);
});

group('base64 resources are bounded, typed and counted without external requirements', () => {
  const fixture = triangleGltfFixture();
  const document = {
    ...fixture.document,
    buffers: [{ byteLength: 42, uri: asData(fixture.geometry) }],
    images: [{ uri: asData(fixture.image, 'image/png') }],
  };
  const result = inspect(document);
  assert.equal(result.requirements.length, 0);
  assert.equal(result.embeddedResourceCount, 2);
  assert.equal(result.embeddedByteLength, 42 + fixture.image.length);
  assert.deepEqual(validateThreeDGltfBundleResources(result, [], false), []);
  invalid({ ...document, buffers: [{ byteLength: 42, uri: 'data:application/octet-stream;base64,AA==' }] }, /shorter/);
  invalid({ ...document, images: [{ uri: 'data:image/svg+xml;base64,AAAA' }] }, /MIME/);
  invalid({ ...document, buffers: [{ byteLength: 42, uri: 'data:application/octet-stream,plain' }] }, /base64/);
  invalid({ ...document, buffers: [{ byteLength: 42, uri: 'data:application/octet-stream;base64,AB==' }] }, /canonical/);
});

group('unsupported URI forms are reported instead of disappearing from the requirement list', () => {
  const fixture = triangleGltfFixture();
  for (const uri of ['https://example.invalid/a.bin', 'blob:temporary', '/a.bin', '../a.bin', 'folder/../a.bin',
    'C:/a.bin', 'folder\\a.bin', 'a.bin?v=1', 'a.bin#fragment', 'folder/%2e%2e/a.bin', '%2fa.bin',
    'a%2520b.bin', 'a%00.bin', 'a%3f.bin', 'folder//a.bin']) {
    invalid({ ...fixture.document, buffers: [{ uri, byteLength: 42 }] }, /path|paths|encoding/i);
  }
  assert.equal(normalizeThreeDGltfBundlePath('./textures/a%20b.png'), 'textures/a b.png');
  const result = inspect({ ...fixture.document, images: [{ uri: './textures/a%20b.png' }] });
  assert.equal(result.images[0].relativePath, 'textures/a b.png');
  invalid({ ...fixture.document, images: [{ uri: 'textures/a.ktx2' }] }, /PNG, JPEG, or WebP/);
  invalid({ ...fixture.document, buffers: [{ uri: 'data.txt', byteLength: 42 }] }, /\.bin/);
});

group('attribution URIs and extension-shaped metadata remain inert preserved extras', () => {
  const fixture = triangleGltfFixture();
  const extras = { uri: 'https://example.invalid/license', extensions: { KHR_texture_basisu: { uri: '../authoring.psd' } } };
  const result = inspect({ ...fixture.document, asset: { version: '2.0', extras }, extras,
    materials: [{ ...fixture.document.materials[0], extras: { sourceTexture: 'Artist label', ...extras } }],
  });
  assert.deepEqual(result.document.extras, extras);
  assert.equal(result.requirements.length, 2);
});

group('extension checks permit configured DRACO/WebP and reject unsupported required decoders', () => {
  const fixture = triangleGltfFixture();
  for (const name of ['KHR_texture_basisu', 'EXT_meshopt_compression', 'KHR_meshopt_compression', 'EXT_texture_avif', 'EXT_mesh_gpu_instancing']) {
    invalid({ ...fixture.document, extensionsUsed: [name] }, /not supported/);
  }
  invalid({ ...fixture.document, extensionsUsed: ['VENDOR_unknown'], extensionsRequired: ['VENDOR_unknown'] }, /not supported/);
  assert.ok(inspect({ ...fixture.document, extensionsUsed: ['VENDOR_unknown'], extensions: { VENDOR_unknown: { enabled: true } } }));
  assert.ok(inspect({ ...fixture.document, extensionsUsed: ['KHR_draco_mesh_compression'], extensionsRequired: ['KHR_draco_mesh_compression'],
    meshes: [{ primitives: [{ ...fixture.document.meshes[0].primitives[0], extensions: { KHR_draco_mesh_compression: { bufferView: 0, attributes: { POSITION: 0 } } } }] }],
  }));
  const webp = inspect({ ...fixture.document, images: [{ uri: 'pixel.webp' }],
    extensionsUsed: ['EXT_texture_webp'], extensionsRequired: ['EXT_texture_webp'],
    textures: [{ extensions: { EXT_texture_webp: { source: 0 } } }],
  });
  assert.equal(webp.images[0].mimeType, 'image/webp');
});

group('version, record, JSON complexity and resource counts fail before loader allocation', () => {
  const fixture = triangleGltfFixture();
  invalid({ ...fixture.document, asset: { version: '1.0' } }, /version 2.0/);
  invalid({ ...fixture.document, asset: { version: '2.0', minVersion: '2.1' } }, /version 2.0/);
  invalid({ ...fixture.document, nodes: new Array(4097).fill({}) }, /limit/);
  invalid({ ...fixture.document, images: new Array(500).fill({ uri: 'pixel.png' }) }, /500-resource/);
  let nested: unknown = 'leaf';
  for (let depth = 0; depth < 130; depth += 1) nested = { value: nested };
  invalid({ ...fixture.document, extras: nested }, /nesting/);
});

group('cycles, duplicate parents, deep hierarchies and multiplicative scene objects are rejected', () => {
  const fixture = triangleGltfFixture();
  invalid({ ...fixture.document, nodes: [{ children: [1] }, { children: [0] }] }, /cycle/);
  invalid({ ...fixture.document, nodes: [{ children: [2] }, { children: [2] }, {}] }, /multiple parents/);
  invalid({ ...fixture.document, nodes: Array.from({ length: 129 }, (_, i) => i === 128 ? {} : { children: [i + 1] }) }, /depth/);
  invalid({ ...fixture.document, scene: 2 }, /Default scene/);
  invalid({ ...fixture.document, nodes: [{ children: [0] }] }, /cycle/);
  invalid({ ...fixture.document, nodes: new Array(65).fill({ mesh: 0 }), scenes: [{ nodes: Array.from({ length: 65 }, (_, i) => i) }],
    meshes: [{ primitives: new Array(64).fill(fixture.document.meshes[0].primitives[0]) }],
  }, /primitive instances/);
});

group('bufferViews and accessors cannot escape declared buffer ranges or allocate excessive zero arrays', () => {
  const fixture = triangleGltfFixture();
  invalid({ ...fixture.document, bufferViews: [{ buffer: 0, byteOffset: 32, byteLength: 36 }] }, /exceeds/);
  invalid({ ...fixture.document, accessors: [{ ...fixture.document.accessors[0], count: 4 }, fixture.document.accessors[1]] }, /exceeds/);
  invalid({ ...fixture.document, accessors: [{ ...fixture.document.accessors[0], byteOffset: 1 }, fixture.document.accessors[1]] }, /aligned/);
  invalid({ ...fixture.document, accessors: [{ componentType: 5126, type: 'VEC3', count: 3_000_000 }, fixture.document.accessors[1]] }, /allocation/);
  invalid({ ...fixture.document, buffers: [{ uri: 'buffers/triangle.bin', byteLength: MAX_GLTF_BUNDLE_BYTES + 1 }] }, /byteLength/);
  invalid({ ...fixture.document, accessors: [{ ...fixture.document.accessors[0], type: 'MAT3', componentType: 5121 }, fixture.document.accessors[1]] }, /matrix/);
});

group('actual short buffers remain blocked during texture deferral while harmless trailing bytes are bounded', () => {
  const fixture = triangleGltfFixture();
  const inspection = inspect(fixture.document);
  assert.match(validateThreeDGltfBundleResources(inspection, [], true).join(' '), /Missing resource.*triangle.bin/);
  assert.match(validateThreeDGltfBundleResources(inspection, [{ ...fixture.resources[0], bytes: fixture.geometry.subarray(0, 40) }], true).join(' '), /shorter/);
  const padded = new Uint8Array(44); padded.set(fixture.geometry);
  assert.deepEqual(validateThreeDGltfBundleResources(inspection, [{ ...fixture.resources[0], bytes: padded }, fixture.resources[1]], false), []);
});

group('only absent images can be deferred; malformed or ambiguous selected images still block', () => {
  const fixture = triangleGltfFixture();
  const inspection = inspect(fixture.document);
  assert.deepEqual(validateThreeDGltfBundleResources(inspection, [fixture.resources[0]], true), []);
  assert.match(validateThreeDGltfBundleResources(inspection, [fixture.resources[0]], false).join(' '), /Missing resource.*pixel.png/);
  assert.match(validateThreeDGltfBundleResources(inspection, [fixture.resources[0], { ...fixture.resources[1], bytes: new Uint8Array(20) }], true).join(' '), /signature/);
  assert.match(validateThreeDGltfBundleResources(inspection, [fixture.resources[0],
    { relativePath: 'walls/pixel.png', bytes: fixture.image }, { relativePath: 'roof/pixel.png', bytes: fixture.image }], true).join(' '), /Ambiguous/);
});

group('exact paths and unique basenames resolve consistently, with duplicate and suffix conflicts blocked', () => {
  const bytes = new Uint8Array([1]);
  const roof = { relativePath: 'roof/image.png', bytes };
  const wall = { relativePath: 'walls/image.png', bytes };
  assert.equal(resolveThreeDGltfBundleResource('walls/image.png', [roof, wall]).resource, wall);
  assert.equal(resolveThreeDGltfBundleResource('image.png', [wall]).resource, wall);
  assert.match(resolveThreeDGltfBundleResource('image.png', [roof, wall]).issue!, /Ambiguous/);
  assert.match(resolveThreeDGltfBundleResource('walls/image.png', [wall, { relativePath: 'WALLS/IMAGE.PNG', bytes }]).issue!, /Duplicate/);
  assert.match(resolveThreeDGltfBundleResource('walls/image.png', [wall, { relativePath: 'vendor/walls/image.png', bytes }]).issue!, /suffix/);
});

group('selected-resource limits account for embedded and actual external bytes', () => {
  const fixture = triangleGltfFixture();
  const inspection = inspect(fixture.document);
  const resources = Array.from({ length: 8 }, (_, i) => ({ relativePath: `buffers/extra-${i}.bin`, bytes: new Uint8Array(4 * 1024 * 1024) }));
  assert.match(validateThreeDGltfBundleResources(inspection, [...fixture.resources, ...resources], false).join(' '), /32 MiB/);
  assert.match(validateThreeDGltfBundleResources(inspection, [{ ...fixture.resources[0], bytes: new Uint8Array(4 * 1024 * 1024 + 1) }], true).join(' '), /4 MiB/);
});

group('interleaved attributes validate with the loader-compatible stride extent', () => {
  const fixture = triangleGltfFixture();
  const bytes = new Uint8Array(54);
  const view = new DataView(bytes.buffer);
  view.setFloat32(16, 1, true); view.setFloat32(36, 1, true);
  new Uint16Array(bytes.buffer, 48, 3).set([0, 1, 2]);
  const document = { ...fixture.document, buffers: [{ uri: 'buffers/triangle.bin', byteLength: 54 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 48, byteStride: 16 }, { buffer: 0, byteOffset: 48, byteLength: 6 }],
  };
  assert.deepEqual(validateThreeDGltfBundleResources(inspect(document), [{ ...fixture.resources[0], bytes }, fixture.resources[1]], false), []);
  invalid({ ...document, bufferViews: [{ ...document.bufferViews[0], byteLength: 44 }, document.bufferViews[1]] }, /trailing stride/);
});

group('non-finite geometry and out-of-range primitive indices fail actual-byte validation', () => {
  const fixture = triangleGltfFixture();
  const inspection = inspect(fixture.document);
  new Float32Array(fixture.geometry.buffer, 0, 9)[0] = NaN;
  assert.match(validateThreeDGltfBundleResources(inspection, fixture.resources, false).join(' '), /non-finite/);
  new Float32Array(fixture.geometry.buffer, 0, 9)[0] = 0;
  new Uint16Array(fixture.geometry.buffer, 36, 3)[2] = 3;
  assert.match(validateThreeDGltfBundleResources(inspection, fixture.resources, false).join(' '), /index exceeds/);
});

group('sparse accessors enforce ranges, increasing indices and finite replacement values', () => {
  const fixture = triangleGltfFixture();
  const bytes = new Uint8Array(56); bytes.set(fixture.geometry); bytes[42] = 1;
  const document = { ...fixture.document,
    buffers: [{ uri: 'buffers/triangle.bin', byteLength: 56 }],
    bufferViews: [...fixture.document.bufferViews, { buffer: 0, byteOffset: 42, byteLength: 1 }, { buffer: 0, byteOffset: 44, byteLength: 12 }],
    accessors: [{ ...fixture.document.accessors[0], sparse: { count: 1, indices: { bufferView: 2, componentType: 5121 }, values: { bufferView: 3 } } }, fixture.document.accessors[1]],
  };
  const inspection = inspect(document);
  const resources = [{ ...fixture.resources[0], bytes }, fixture.resources[1]];
  assert.deepEqual(validateThreeDGltfBundleResources(inspection, resources, false), []);
  bytes[42] = 3;
  assert.match(validateThreeDGltfBundleResources(inspection, resources, false).join(' '), /Sparse.*indices/);
  bytes[42] = 1;
  new DataView(bytes.buffer).setFloat32(44, Infinity, true);
  assert.match(validateThreeDGltfBundleResources(inspection, resources, false).join(' '), /Sparse.*non-finite/);
  invalid({ ...document, accessors: [{ ...document.accessors[0], sparse: { count: 4, indices: { bufferView: 2, componentType: 5121 }, values: { bufferView: 3 } } }, document.accessors[1]] }, /Sparse count/);
});

console.log('─'.repeat(44));
console.log(`PASS  ${groups} validation groups completed`);
