import assert from 'node:assert/strict';
import {
  inspectThreeDModelEmbeddedImages, extractThreeDModelEmbeddedImage, prepareThreeDModelEmbeddedImages,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-embedded-images-core.ts';
import {
  triangleGltfFixture, encodeGlb, encodeGltf,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './fixtures/gltf-bundle-fixtures.ts';

let groups = 0;
function group(label: string, run: () => void) { run(); groups += 1; console.log(`  PASS ${label}`) }
function data(bytes: Uint8Array, mime = 'image/png') {
  return `data:${mime};base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}`;
}
const png = triangleGltfFixture().image;
const document = {
  asset: { version: '2.0' },
  buffers: [{ byteLength: png.byteLength }],
  bufferViews: [{ buffer: 0, byteLength: png.byteLength }],
  images: [{ name: '../../private\\paint.png', bufferView: 0, mimeType: 'image/png' }],
  textures: [{ source: 0 }],
  materials: [{ name: 'Bodywork', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicRoughnessTexture: { index: 0 } }, normalTexture: { index: 0 }, extras: { secretTexture: { index: 80 }, credential: 'excluded' } }],
};
const original = encodeGlb(document, png);
function inspect(value: object) { return inspectThreeDModelEmbeddedImages('fixture.gltf', encodeGltf(value)) }
function reject(value: object, match: RegExp) { assert.throws(() => inspect(value), match) }
console.log('\nThreeD embedded-image inspection (pure, offline)');

group('embedded BIN PNG metadata, material channels and immutable extracted bytes', () => {
  const before = original.slice();
  const prepared = prepareThreeDModelEmbeddedImages('saved.GLB', original);
  const { catalog } = prepared;
  assert.equal(catalog.format, 'glb');
  assert.equal(catalog.embeddedBuffers, 1);
  assert.equal(catalog.embeddedImages, 1);
  assert.equal(catalog.externalImages, 0);
  const image = catalog.images[0];
  assert.equal(image.fileName, 'image-0.png');
  assert.equal(image.byteSize, png.byteLength);
  assert.equal(image.width, 1);
  assert.equal(image.height, 1);
  assert.equal(image.previewSupported, true);
  assert.deepEqual(image.source, { kind: 'buffer-view', bufferIndex: 0, bufferViewIndex: 0, byteOffset: 0 });
  assert.deepEqual(new Set(image.usages.map((use) => use.channel)), new Set(['Base color', 'Metallic / Roughness', 'Normal']));
  assert.ok(image.usages.every((use) => use.materialIndex === 0 && use.materialName === 'Bodywork' && use.textureIndex === 0));
  const extracted = prepared.extract(0);
  assert.deepEqual(extracted.bytes, png);
  extracted.bytes.fill(0);
  assert.deepEqual(prepared.extract(0).bytes, png);
  assert.deepEqual(original, before);
  assert.doesNotMatch(JSON.stringify(catalog), /excluded|credential|secretTexture|data:/);
});

group('data-URI images, embedded data buffers and common extension channel usage', () => {
  const result = inspect({
    asset: { version: '2.0' },
    buffers: [{ byteLength: png.byteLength, uri: data(png, 'application/gltf-buffer') }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: png.byteLength }],
    images: [{ bufferView: 0, mimeType: 'image/png' }, { uri: data(png), name: 'Second image' }],
    textures: [{ source: 0, extensions: { EXT_texture_webp: { source: 1 } } }],
    materials: [{ extensions: { KHR_materials_clearcoat: { clearcoatNormalTexture: { index: 0 } }, KHR_materials_sheen: { sheenColorTexture: { index: 0 } } } }],
  });
  assert.equal(result.embeddedImages, 2);
  assert.equal(result.embeddedBuffers, 1);
  assert.equal(result.images[1].source.kind, 'data-uri');
  assert.ok(result.images.every((image) => image.usages.some((usage) => usage.channel === 'Clearcoat normal')));
  assert.ok(result.images[0].usages.some((usage) => usage.texturePath === 'materials[0].extensions.KHR_materials_sheen.sheenColorTexture'));
  assert.doesNotMatch(JSON.stringify(result), /base64/);
});

group('external image/buffer declarations are separated without fetching or disclosing remote URLs', () => {
  const value = {
    asset: { version: '2.0' }, buffers: [{ byteLength: 8, uri: 'external.bin' }],
    bufferViews: [{ buffer: 0, byteOffset: 4, byteLength: 4 }],
    images: [{ uri: 'textures/paint%20one.png' }, { uri: 'https://private.example/picture.jpg?token=secret' }, { bufferView: 0, mimeType: 'image/png' }],
  };
  const bytes = encodeGltf(value);
  const catalog = inspectThreeDModelEmbeddedImages('external.gltf', bytes);
  assert.equal(catalog.embeddedImages, 0);
  assert.equal(catalog.externalImages, 3);
  assert.equal(catalog.images[0].source.relativePath, 'textures/paint one.png');
  assert.equal(catalog.images[2].source.relativePath, 'external.bin');
  assert.equal(catalog.images[2].byteSize, 4);
  assert.ok(catalog.images.every((image) => image.source.kind === 'external' && !image.previewSupported));
  assert.doesNotMatch(JSON.stringify(catalog), /private.example|token|secret|https:/);
  assert.throws(() => extractThreeDModelEmbeddedImage('external.gltf', bytes, 0), /external/);
});

group('malformed/truncated GLB headers, ranges, versions, chunks and padding reject', () => {
  assert.throws(() => inspectThreeDModelEmbeddedImages('x.glb', original.subarray(0, 19)), /header/);
  assert.throws(() => inspectThreeDModelEmbeddedImages('x.glb', original.subarray(0, original.length - 4)), /declared length/);
  for (const [offset, value, match] of [[0, 0, /version/], [4, 1, /version/], [12, 0xffffffff, /range/], [16, 0, /JSON/]] as const) {
    const changed = original.slice(); new DataView(changed.buffer).setUint32(offset, value, true);
    assert.throws(() => inspectThreeDModelEmbeddedImages('bad.glb', changed), match);
  }
  const changed = original.slice(); changed[changed.length - 1] = 1;
  if (original.length - 28 - Math.ceil(encodeGltf(document).byteLength / 4) * 4 > png.byteLength) {
    assert.throws(() => inspectThreeDModelEmbeddedImages('bad.glb', changed), /padding/);
  }
});

group('invalid image bufferViews, external buffer bounds and missing/inconsistent lengths reject', () => {
  const base = { asset: { version: '2.0' }, buffers: [{ byteLength: png.byteLength, uri: data(png, 'application/octet-stream') }] };
  reject({ ...base, bufferViews: [{ buffer: 0, byteOffset: png.byteLength, byteLength: 1 }] }, /exceeds/);
  reject({ ...base, bufferViews: [{ buffer: 0, byteLength: -1 }] }, /integer/);
  reject({ ...base, bufferViews: [{ buffer: 8, byteLength: 1 }] }, /integer/);
  reject({ ...base, buffers: [{ byteLength: 1, uri: data(png, 'application/octet-stream') }] }, /declared length/);
  reject({ ...base, bufferViews: [{ buffer: 0, byteLength: png.byteLength, byteStride: 4 }], images: [{ bufferView: 0, mimeType: 'image/png' }] }, /interleaved/);
  reject({ ...base, images: [{ bufferView: 0, mimeType: 'image/png' }] }, /integer/);
  reject({ asset: { version: '2.0' }, buffers: [{ byteLength: 1 }] }, /BIN/);
});

group('canonical bounded base64 and safe image MIME are required', () => {
  reject({ asset: { version: '2.0' }, images: [{ uri: 'data:image/svg+xml;base64,PHN2Zy8+' }] }, /Unsupported/);
  reject({ asset: { version: '2.0' }, images: [{ uri: 'data:image/png;base64,!!!!' }] }, /canonical/);
  reject({ asset: { version: '2.0' }, images: [{ uri: data(png), mimeType: 'image/jpeg' }] }, /disagrees/);
  reject({ asset: { version: '2.0' }, images: [{ uri: data(png), bufferView: 0 }] }, /exactly one/);
  reject({ asset: { version: '2.0' }, images: [{ uri: data(png.subarray(0, 45)) }] }, /chunk/);
  reject({ asset: { version: '2.0' }, images: [{ uri: data(new Uint8Array(80)) }] }, /PNG/);
  assert.throws(() => inspectThreeDModelEmbeddedImages('huge.gltf', new Uint8Array(32 * 1024 * 1024 + 1)), /32 MiB/);
  reject({ asset: { version: '2.0' }, images: Array.from({ length: 501 }, () => ({ uri: 'x.png' })) }, /500/);
});

group('JPEG and WebP encoded header dimensions are inspected without decoders', () => {
  const jpeg = Uint8Array.from([255, 216, 255, 192, 0, 11, 8, 0, 6, 0, 9, 1, 1, 17, 0, 255, 217]);
  const webp = new Uint8Array(26); const view = new DataView(webp.buffer);
  webp.set(new TextEncoder().encode('RIFF'), 0); view.setUint32(4, 18, true);
  webp.set(new TextEncoder().encode('WEBPVP8L'), 8); view.setUint32(16, 5, true);
  webp[20] = 47; view.setUint32(21, 8 | 5 << 14, true);
  for (const [bytes, mimeType] of [[jpeg, 'image/jpeg'], [webp, 'image/webp']] as const) {
    const image = inspect({ asset: { version: '2.0' }, images: [{ uri: data(bytes, mimeType) }] }).images[0];
    assert.equal(image.width, 9); assert.equal(image.height, 6); assert.equal(image.previewSupported, true);
  }
});

group('KTX2 and AVIF are catalogued/downloadable but never treated as browser previews', () => {
  const ktx2 = new Uint8Array(80); ktx2.set([171, 75, 84, 88, 32, 50, 48, 187, 13, 10, 26, 10]);
  new DataView(ktx2.buffer).setUint32(20, 128, true); new DataView(ktx2.buffer).setUint32(24, 64, true);
  const avif = new Uint8Array(16); new DataView(avif.buffer).setUint32(0, 16); avif.set(new TextEncoder().encode('ftypavif'), 4);
  const bytes = encodeGltf({ asset: { version: '2.0' }, images: [{ uri: data(ktx2, 'image/ktx2') }, { uri: data(avif, 'image/avif') }], textures: [{ extensions: { KHR_texture_basisu: { source: 0 } } }], materials: [{ normalTexture: { index: 0 } }] });
  const prepared = prepareThreeDModelEmbeddedImages('compressed.gltf', bytes);
  assert.ok(prepared.catalog.images.every((image) => !image.previewSupported));
  assert.equal(prepared.catalog.images[0].width, 128);
  assert.equal(prepared.catalog.images[0].usages[0].channel, 'Normal');
  assert.deepEqual(prepared.extract(0).bytes, ktx2);
  assert.equal(prepared.extract(1).mimeType, 'image/avif');
});

group('huge decoded image dimensions disable previews and invalid references reject', () => {
  const huge = png.slice(); new DataView(huge.buffer).setUint32(16, 65535);
  const result = inspect({ asset: { version: '2.0' }, images: [{ uri: data(huge) }] });
  assert.equal(result.images[0].width, 65535); assert.equal(result.images[0].previewSupported, false);
  reject({ asset: { version: '2.0' }, images: [{ uri: data(png) }], textures: [{ source: 2 }] }, /integer/);
  reject({ asset: { version: '2.0' }, materials: [{ normalTexture: { index: 1 } }] }, /integer/);
  for (const index of [-1, 0.5, 500, 2]) assert.throws(() => extractThreeDModelEmbeddedImage('saved.glb', original, index), /index|integer/i);
});

group('inspection does not impose bulk-import geometry/extension policy or retain private exporter metadata', () => {
  const value = { asset: { version: '2.0' }, extensionsUsed: ['VENDOR_existing_geometry'], extras: { privateURL: 'https://secret.invalid' }, images: [{ uri: data(png), extras: { secret: 'private' } }] };
  const catalog = inspect(value);
  assert.equal(catalog.embeddedImages, 1);
  assert.doesNotMatch(JSON.stringify(catalog), /secret|private|VENDOR|extensions|base64/);
  let deep: Record<string, unknown> = {};
  for (let index = 0; index < 130; index++) deep = { child: deep };
  reject({ asset: { version: '2.0' }, extras: deep }, /nesting/);
});

console.log(`PASS ${groups} embedded-image validation groups; no network, renderer or persistence.`);
