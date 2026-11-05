import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  convertStlImport,
  inspectStlImport,
  MAX_STL_IMPORT_BYTES,
  MAX_STL_IMPORT_TRIANGLES,
  type StlImportOptions,
// @ts-expect-error The offline runner imports TypeScript source explicitly.
} from '../services/threed/models/stl-import.ts';
// @ts-expect-error The offline runner imports TypeScript source explicitly.
import { inspectThreeDGltfBundle } from '../services/threed/models/model-gltf-bundle-core.ts';
// @ts-expect-error The offline runner imports TypeScript source explicitly.
import { threeDModelUploadPolicy } from '../services/threed/models/model-upload-policy-core.ts';

let groups = 0;
async function group(label: string, run: () => void | Promise<void>) {
  await run();
  groups += 1;
  console.log(`PASS ${label}`);
}

// GLTFExporter needs FileReader in a browser. This test-only adapter reads in-memory Blobs.
let readHook: (() => void) | undefined;
class MemoryFileReader {
  result: ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then(result => {
      this.result = result;
      readHook?.();
      this.onloadend?.();
    });
  }
}
const previousFileReader = globalThis.FileReader;
globalThis.FileReader = MemoryFileReader as unknown as typeof FileReader;

const encoder = new TextEncoder();
const triangle = 'facet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 12 0 0\nvertex 0 24 0\nendloop\nendfacet';
function ascii(facets = triangle, name = 'fixture') {
  return encoder.encode(`solid ${name}\n${facets}\nendsolid ${name}\n`).buffer;
}
function binary() {
  const bytes = new ArrayBuffer(134);
  new Uint8Array(bytes).set(encoder.encode('solid binary fixture'));
  const view = new DataView(bytes);
  view.setUint32(80, 1, true);
  [0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 24, 0].forEach((value, index) => view.setFloat32(84 + index * 4, value, true));
  return bytes;
}
function glbDocument(bytes: ArrayBuffer) {
  const view = new DataView(bytes);
  assert.equal(view.getUint32(0, true), 0x46546c67);
  assert.equal(view.getUint32(4, true), 2);
  assert.equal(view.getUint32(8, true), bytes.byteLength);
  return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, view.getUint32(12, true))));
}
function close(actual: number[], expected: number[], tolerance = 1e-6) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) <= tolerance, `${value} differs from ${expected[index]}`));
}
const options: StlImportOptions = {
  units: 'inches',
  upAxis: 'z',
};

try {
  await group('ASCII inspection preserves source coordinates, multiple solids and input bytes', () => {
    const source = ascii();
    const before = source.slice(0);
    const result = inspectStlImport(source);
    assert.equal(result.format, 'ascii');
    assert.equal(result.triangleCount, 1);
    close(result.bounds.size, [12, 24, 0]);
    assert.deepEqual(source, before);
    const multiple = encoder.encode(new TextDecoder().decode(ascii(triangle, 'endsolid unusual solid name'))
      + new TextDecoder().decode(ascii(triangle.replace('vertex 0 0 0', 'vertex -12 0 0'), 'second'))).buffer;
    assert.equal(inspectStlImport(multiple).triangleCount, 2);
    close(inspectStlImport(multiple).bounds.min, [-12, 0, 0]);
  });

  await group('inch Z-up conversion preserves all vertices at exact App Scene scale and emits self-contained GLB', async () => {
    const source = ascii(triangle.replace('vertex 0 0 0', 'vertex -12 0 6'));
    const before = source.slice(0);
    const converted = await convertStlImport(source, options);
    close(converted.bounds.min, [-1, 0, -2]);
    close(converted.bounds.max, [1, 0.5, 0]);
    close(converted.sceneSize, [2, 0.5, 2]);
    close(converted.metresSize, [0.6096, 0.1524, 0.6096]);
    assert.deepEqual(source, before);
    const glb = glbDocument(converted.bytes);
    const primitive = glb.meshes[0].primitives[0];
    assert.equal(glb.accessors[primitive.attributes.POSITION].count, 3);
    assert.equal(primitive.mode, 4);
    assert.equal(glb.nodes[0].extras.stlImport.metresPerSceneUnit, 0.3048);
    assert.equal(glb.nodes[0].extras.stlImport.sourceUnits, 'inches');
    assert.equal(glb.nodes[0].extras.stlImport.sourceUpAxis, 'z');
    assert.equal(inspectThreeDGltfBundle('sample.glb', new Uint8Array(converted.bytes)).requirements.length, 0);
    assert.equal(threeDModelUploadPolicy('sample.glb', converted.bytes.byteLength).modelType, 'glb');
  });

  await group('all explicit units and Y-up convert without adding a root scale or recentering', async () => {
    const factors = {
      inches: 0.0254,
      millimetres: 0.001,
      centimetres: 0.01,
      metres: 1,
    } as const;
    for (const units of Object.keys(factors) as Array<keyof typeof factors>) {
      const result = await convertStlImport(ascii(), {
        units,
        upAxis: 'y',
      });
      close(result.metresSize, [12 * factors[units], 24 * factors[units], 0], 1e-5);
      const node = glbDocument(result.bytes).nodes[0];
      assert.ok(!node.scale || node.scale.every((value: number) => value === 1));
    }
    const result = await convertStlImport(encoder.encode(new TextDecoder().decode(ascii()) + new TextDecoder().decode(ascii())).buffer, options);
    const doc = glbDocument(result.bytes);
    assert.equal(doc.accessors[doc.meshes[0].primitives[0].attributes.POSITION].count, 6);
  });

  await group('binary solid-prefixed headers, zero normals and supported Magics colors survive conversion', async () => {
    const source = binary();
    assert.equal(inspectStlImport(source).format, 'binary');
    const bytes = new Uint8Array(source);
    bytes.set(encoder.encode('COLOR='), 25);
    bytes.set([255, 0, 0, 128], 31);
    new DataView(source).setUint16(132, 0x8000, true);
    assert.equal(inspectStlImport(source).hasColors, true);
    const result = await convertStlImport(source, options);
    const doc = glbDocument(result.bytes);
    const primitive = doc.meshes[0].primitives[0];
    assert.ok(Number.isInteger(primitive.attributes.COLOR_0));
    assert.ok(Number.isInteger(primitive.attributes.NORMAL));
    close([doc.materials[0].pbrMetallicRoughness.baseColorFactor[3]], [128 / 255]);
    assert.equal(doc.materials[0].alphaMode, 'BLEND');
  });

  await group('malformed, nonfinite, incomplete and degenerate inputs reject rather than dropping triangles', async () => {
    const cases = [
      new ArrayBuffer(0),
      encoder.encode('not a mesh').buffer,
      ascii(''),
      ascii(triangle.replace('endfacet', '')),
      ascii(triangle.replace('endloop', 'vertex 0 0 2\nendloop')),
      ascii(triangle.replace('12 0 0', 'NaN 0 0')),
      ascii(triangle.replace('12 0 0', '1e400 0 0')),
      ascii(triangle.replace('12 0 0', '0 0 0')),
      ascii(triangle).slice(0, -10),
      encoder.encode(new TextDecoder().decode(ascii()) + 'ignored trailing junk').buffer,
      binary().slice(0, -1),
    ];
    const nonfinite = binary();
    new DataView(nonfinite).setFloat32(84, Infinity, true);
    cases.push(nonfinite);
    for (const bytes of cases) assert.throws(() => inspectStlImport(bytes));
    await assert.rejects(convertStlImport(ascii(), { units: 'toString', upAxis: 'y' } as unknown as StlImportOptions), /Choose/);
    await assert.rejects(convertStlImport(ascii(), { units: 'inches', upAxis: 'x' } as unknown as StlImportOptions), /Choose/);
    await assert.rejects(convertStlImport(ascii(triangle.replace('12 0 0', '3e38 0 0')), {
      units: 'metres',
      upAxis: 'y',
    }), /out-of-range/);
  });

  await group('byte/triangle budgets and forged binary counts are rejected before loader allocation', () => {
    assert.throws(() => inspectStlImport(new ArrayBuffer(MAX_STL_IMPORT_BYTES + 1)), /32 MiB/);
    const many = new ArrayBuffer(84 + (MAX_STL_IMPORT_TRIANGLES + 1) * 50);
    new DataView(many).setUint32(80, MAX_STL_IMPORT_TRIANGLES + 1, true);
    assert.throws(() => inspectStlImport(many), /triangles/);
    const forged = binary();
    new DataView(forged).setUint32(80, 0xffffffff, true);
    assert.throws(() => inspectStlImport(forged));
  });

  await group('aborted work never returns GLB and every conversion/inspection disposes owned resources', async () => {
    const controller = new AbortController();
    controller.abort();
    assert.throws(() => inspectStlImport(ascii(), controller.signal), { name: 'AbortError' });
    await assert.rejects(convertStlImport(ascii(), options, controller.signal), { name: 'AbortError' });
    let geometryDisposals = 0;
    let materialDisposals = 0;
    // tsx compiles the App's .ts helpers as CommonJS in this package; inspect that same Three instance.
    const { BufferGeometry, Material } = createRequire(import.meta.url)('three') as typeof import('three');
    const originalGeometryDispose = BufferGeometry.prototype.dispose;
    const originalMaterialDispose = Material.prototype.dispose;
    BufferGeometry.prototype.dispose = function () {
      geometryDisposals += 1;
      originalGeometryDispose.call(this);
    };
    Material.prototype.dispose = function () {
      materialDisposals += 1;
      originalMaterialDispose.call(this);
    };
    try {
      inspectStlImport(ascii());
      await convertStlImport(ascii(), options);
      const duringExport = new AbortController();
      readHook = () => duringExport.abort();
      await assert.rejects(convertStlImport(ascii(), options, duringExport.signal), { name: 'AbortError' });
      assert.equal(geometryDisposals, 3);
      assert.equal(materialDisposals, 2);
    } finally {
      readHook = undefined;
      BufferGeometry.prototype.dispose = originalGeometryDispose;
      Material.prototype.dispose = originalMaterialDispose;
    }
  });

  const sampleIndex = process.argv.indexOf('--sample');
  if (sampleIndex !== -1) {
    await group('Developer sample: inches, both mesh components retained in one GLB', async () => {
      const sample = Uint8Array.from(readFileSync(process.argv[sampleIndex + 1])).buffer;
      const before = sample.slice(0);
      const converted = await convertStlImport(sample, options);
      assert.equal(converted.source.triangleCount, 1574);
      close(converted.source.bounds.size, [48.75, 96.875, 33.1875]);
      close(converted.sceneSize, [4.0625, 2.765625, 8.0729166667]);
      close(converted.metresSize, [1.23825, 0.8429625, 2.460625]);
      const doc = glbDocument(converted.bytes);
      assert.equal(doc.accessors[doc.meshes[0].primitives[0].attributes.POSITION].count, 1574 * 3);
      assert.deepEqual(sample, before);
      console.log(`Sample: ${converted.source.triangleCount} triangles, ${converted.bytes.byteLength} GLB bytes; metres ${converted.metresSize.join(' × ')}.`);
    });
  }
} finally {
  globalThis.FileReader = previousFileReader;
}

console.log(`STL import: ${groups} offline groups passed.`);
