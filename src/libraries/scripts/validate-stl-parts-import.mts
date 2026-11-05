import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import {
  convertStlParts,
  inspectStlParts,
  MAX_STL_REVIEW_ISLANDS,
  type StlPartGroup,
// @ts-expect-error The offline runner imports TypeScript source explicitly.
} from '../services/threed/models/stl-parts-import.ts';
// @ts-expect-error The offline runner imports TypeScript source explicitly.
import { convertStlImport, type StlImportOptions } from '../services/threed/models/stl-import.ts';
// @ts-expect-error The offline runner imports TypeScript source explicitly.
import { inspectThreeDGltfBundle } from '../services/threed/models/model-gltf-bundle-core.ts';

let checks = 0;
async function check(label: string, run: () => void | Promise<void>) {
  await run();
  checks += 1;
  console.log(`PASS ${label}`);
}

// Only in-memory local Blobs are read. No network, storage, database or renderer is started.
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

type Point = [number, number, number];
type Triangle = [Point, Point, Point];
const triangles: Triangle[] = [
  [[-12, 0, -6], [12, 0, -6], [-12, 24, -6]],
  [[12, 0, -6], [12, 24, -6], [-12, 24, -6]],
  [[48, 12, 36], [60, 12, 36], [48, 24, 48]],
];
const settings: StlImportOptions = {
  units: 'inches',
  upAxis: 'z',
};
function binary(faces: Triangle[]) {
  const bytes = new ArrayBuffer(84 + faces.length * 50);
  const view = new DataView(bytes);
  view.setUint32(80, faces.length, true);
  faces.forEach((face, index) => face.flat().forEach((value, axis) => view.setFloat32(96 + index * 50 + axis * 4, value, true)));
  return bytes;
}
function ascii(faces: Triangle[], name: string) {
  return `solid ${name}\n${faces.map(face => `facet normal 0 0 0\nouter loop\n${face.map(vertex => `vertex ${vertex.join(' ')}`).join('\n')}\nendloop\nendfacet`).join('\n')}\nendsolid ${name}\n`;
}
function glb(bytes: ArrayBuffer) {
  const view = new DataView(bytes);
  assert.equal(view.getUint32(0, true), 0x46546c67);
  assert.equal(view.getUint32(8, true), bytes.byteLength);
  const jsonLength = view.getUint32(12, true);
  const document = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, jsonLength)));
  const binaryOffset = 20 + jsonLength + 8;
  const attribute = (name: string): number[] => {
    const primitive = document.meshes[0].primitives[0];
    const accessor = document.accessors[primitive.attributes[name]];
    const buffer = document.bufferViews[accessor.bufferView];
    assert.equal(accessor.componentType, 5126);
    assert.equal(accessor.type, 'VEC3');
    const stride = buffer.byteStride ?? 12;
    const offset = binaryOffset + (buffer.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const output: number[] = [];
    for (let item = 0; item < accessor.count; item += 1) {
      for (let axis = 0; axis < 3; axis += 1) output.push(view.getFloat32(offset + item * stride + axis * 4, true));
    }
    return output;
  };
  return {
    document,
    attribute,
  };
}
function close(actual: number[], expected: number[], tolerance = 2e-6) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) <= tolerance, `${value} differs from ${expected[index]}`));
}
function convertedSource(faces: Triangle[]) {
  return faces.flat().map(([x, y, z]) => [x / 12, z / 12, -y / 12]);
}
const parts: StlPartGroup[] = [
  {
    id: 'part-one',
    label: 'Lower piece',
    islandIds: ['island-1'],
  },
  {
    id: 'part-two',
    label: 'Elevated piece',
    islandIds: ['island-2'],
  },
];

try {
  await check('deterministic geometric islands preserve connected triangles and ignore semantic solid names', async () => {
    const bytes = binary(triangles);
    const before = bytes.slice(0);
    const first = await inspectStlParts(bytes, settings);
    assert.deepEqual(first, await inspectStlParts(bytes, settings));
    assert.deepEqual(first.islands.map(island => island.triangleCount), [2, 1]);
    close(first.islands[0].sourceBounds.min, [-12, 0, -6]);
    close(first.islands[1].bounds.min, [4, 3, -2]);
    const named = new TextEncoder().encode(ascii(triangles.slice(0, 1), 'named wall') + ascii(triangles.slice(1), 'other named object')).buffer;
    const namesDoNotSplit = await inspectStlParts(named, settings);
    assert.deepEqual(namesDoNotSplit.islands.map(island => island.triangleCount), [2, 1]);
    assert.deepEqual(bytes, before);
  });

  await check('point contact joins, close disconnected surfaces and edge T-junctions are not guessed apart', async () => {
    const contact: Triangle[] = [
      [[0, 0, 0], [2, 0, 0], [0, 2, 0]],
      [[1, 0, 0], [2, 0, 0], [2, -1, 0]],
      [[0, 0, 0], [0, 0, 1], [-1, 0, 0]],
      [[0, 0, 0.000001], [2, 0, 0.000001], [0, 2, 0.000001]],
    ];
    const result = await inspectStlParts(binary(contact), settings);
    assert.deepEqual(result.islands.map(island => island.triangleCount), [3, 1]);
  });

  await check('independent GLBs are centered and grounded while translations exactly reconstruct elevated source parts', async () => {
    const bytes = binary(triangles);
    const before = bytes.slice(0);
    const result = await convertStlParts(bytes, settings, parts);
    assert.deepEqual(result.omittedIslandIds, []);
    assert.deepEqual(result.parts.map(part => part.triangleCount), [2, 1]);
    close(result.parts[0].position, [0, -0.5, -1]);
    close(result.parts[1].position, [4.5, 3, -1.5]);
    const original = convertedSource(triangles);
    const reconstructed: number[][] = [];
    for (const part of result.parts) {
      close([part.localBounds.min[1]], [0]);
      close([part.localBounds.min[0] + part.localBounds.max[0], part.localBounds.min[2] + part.localBounds.max[2]], [0, 0]);
      const file = glb(part.bytes);
      const positions = file.attribute('POSITION');
      for (let index = 0; index < positions.length; index += 3) {
        reconstructed.push(positions.slice(index, index + 3).map((value, axis) => value + part.position[axis]));
      }
      assert.equal(file.document.nodes[0].extras.stlImport.metresPerSceneUnit, 0.3048);
      assert.equal(file.document.nodes[0].extras.stlImport.part.id, part.id);
      assert.equal(file.document.nodes[0].name, part.label);
      assert.equal(inspectThreeDGltfBundle('part.glb', new Uint8Array(part.bytes)).requirements.length, 0);
    }
    reconstructed.forEach((point, index) => close(point, original[index]));
    const placement = new Matrix4().compose(
      new Vector3(3, 7, -11),
      new Quaternion().setFromEuler(new Euler(0, Math.PI / 3, 0)),
      new Vector3(2, 2, 2),
    );
    reconstructed.forEach((point, index) => close(
      new Vector3().fromArray(point).applyMatrix4(placement).toArray(),
      new Vector3().fromArray(original[index]).applyMatrix4(placement).toArray(),
    ));
    assert.deepEqual(bytes, before);
    const whole = await convertStlImport(bytes, settings);
    close(glb(whole.bytes).attribute('POSITION'), original.flat());
  });

  await check('explicit grouping and omissions retain all selected faces without duplicate membership', async () => {
    const joined = await convertStlParts(binary(triangles), settings, [{
      id: 'joined',
      label: 'Grouped pieces',
      islandIds: ['island-1', 'island-2'],
    }]);
    assert.equal(joined.parts.length, 1);
    assert.equal(joined.parts[0].triangleCount, 3);
    assert.equal(glb(joined.parts[0].bytes).attribute('POSITION').length, 27);
    const selected = await convertStlParts(binary(triangles), settings, [parts[1]]);
    assert.deepEqual(selected.omittedIslandIds, ['island-1']);
    close(selected.bounds.min, [4, 3, -2]);
    const invalid = [
      [],
      [parts[0], parts[0]],
      [{ ...parts[0], islandIds: ['island-1', 'island-1'] }],
      [{ ...parts[0], islandIds: ['island-3'] }],
      [{ ...parts[0], islandIds: [] }],
      [{ ...parts[0], label: ' ' }],
      [{ ...parts[0], id: ' leading' }],
      Array.from({ length: 101 }, (_, index) => ({ id: `part-${index}`, label: 'Part', islandIds: [`island-${index + 1}`] })),
    ];
    for (const groups of invalid) await assert.rejects(convertStlParts(binary(triangles), settings, groups));
  });

  await check('units, options and review snapshots stay explicit across asynchronous work', async () => {
    const options: StlImportOptions = {
      units: 'inches',
      upAxis: 'y',
    };
    const pending = inspectStlParts(binary(triangles), options);
    options.units = 'metres';
    const result = await pending;
    assert.equal(result.units, 'inches');
    close(result.islands[1].bounds.min, [4, 1, 3]);
    const groups = structuredClone(parts);
    const conversion = convertStlParts(binary(triangles), settings, groups);
    groups[0].label = 'Changed while busy';
    groups[0].islandIds = ['island-2'];
    assert.equal((await conversion).parts[0].label, 'Lower piece');
    await assert.rejects(inspectStlParts(binary(triangles), { units: 'guess', upAxis: 'x' } as unknown as StlImportOptions));
    await assert.rejects(inspectStlParts(new ArrayBuffer(0), settings));
  });

  await check('binary colors and alpha survive every extracted part', async () => {
    const bytes = binary(triangles);
    new Uint8Array(bytes).set(new TextEncoder().encode('COLOR='), 25);
    new Uint8Array(bytes).set([255, 0, 0, 128], 31);
    const view = new DataView(bytes);
    triangles.forEach((_, face) => view.setUint16(132 + face * 50, 0x8000, true));
    const result = await convertStlParts(bytes, settings, parts);
    for (const part of result.parts) {
      const file = glb(part.bytes);
      assert.equal(file.attribute('COLOR_0').length, part.triangleCount * 9);
      close(file.attribute('COLOR_0').slice(0, 3), [1, 0, 0]);
      close([file.document.materials[0].pbrMetallicRoughness.baseColorFactor[3]], [128 / 255]);
    }
  });

  await check('pathological island counts and unrepresentable Assembly positions reject before any external effect', async () => {
    const separate: Triangle[] = Array.from({ length: MAX_STL_REVIEW_ISLANDS + 1 }, (_, index) => [
      [index * 3, 0, 0],
      [index * 3 + 1, 0, 0],
      [index * 3, 1, 0],
    ]);
    await assert.rejects(inspectStlParts(binary(separate), settings), /disconnected islands/);
    const remote: Triangle[] = [[[20_000_000, 0, 0], [20_000_010, 0, 0], [20_000_000, 10, 0]]];
    await assert.rejects(convertStlParts(binary(remote), settings, [parts[0]]), /assembly position/);
  });

  await check('cancellation interrupts connectivity/export and disposes every owned geometry/material', async () => {
    const early = new AbortController();
    early.abort();
    await assert.rejects(inspectStlParts(binary(triangles), settings, early.signal), { name: 'AbortError' });
    const during = new AbortController();
    const pending = inspectStlParts(binary(Array.from({ length: 6000 }, () => triangles[0])), settings, during.signal);
    setTimeout(() => during.abort(), 0);
    await assert.rejects(pending, { name: 'AbortError' });
    const { BufferGeometry, Material } = createRequire(import.meta.url)('three') as typeof import('three');
    const disposeGeometry = BufferGeometry.prototype.dispose;
    const disposeMaterial = Material.prototype.dispose;
    const geometries = new Set<object>();
    const materials = new Set<object>();
    BufferGeometry.prototype.dispose = function () {
      assert.ok(!geometries.has(this), 'geometry disposed twice');
      geometries.add(this);
      disposeGeometry.call(this);
    };
    Material.prototype.dispose = function () {
      assert.ok(!materials.has(this), 'material disposed twice');
      materials.add(this);
      disposeMaterial.call(this);
    };
    try {
      await inspectStlParts(binary(triangles), settings);
      await convertStlParts(binary(triangles), settings, parts);
      assert.equal(geometries.size, 4); // inspection source + conversion source + two parts
      assert.equal(materials.size, 2);
      const exporting = new AbortController();
      readHook = () => exporting.abort();
      await assert.rejects(convertStlParts(binary(triangles), settings, parts, exporting.signal), { name: 'AbortError' });
      assert.equal(geometries.size, 6);
      assert.equal(materials.size, 3);
    } finally {
      readHook = undefined;
      BufferGeometry.prototype.dispose = disposeGeometry;
      Material.prototype.dispose = disposeMaterial;
    }
  });

  const sampleIndex = process.argv.indexOf('--sample');
  if (sampleIndex >= 0) {
    await check('provided inch-authored sample produces two reviewed pieces and retains all 1,574 triangles', async () => {
      const file = readFileSync(process.argv[sampleIndex + 1]);
      const bytes = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
      const inspection = await inspectStlParts(bytes, settings);
      assert.equal(inspection.source.triangleCount, 1574);
      assert.deepEqual(inspection.islands.map(island => island.triangleCount), [1450, 124]);
      close(inspection.source.bounds.size, [48.75, 96.875, 33.1875]);
      const converted = await convertStlParts(bytes, settings, parts);
      assert.equal(converted.parts.reduce((count, part) => count + part.triangleCount, 0), 1574);
      const reference = glb((await convertStlImport(bytes, settings)).bytes).attribute('POSITION');
      const keys = (values: number[]) => {
        const vertices: string[] = [];
        for (let index = 0; index < values.length; index += 3) vertices.push(values.slice(index, index + 3).map(value => value.toFixed(5)).join(','));
        return vertices.sort();
      };
      const restored = converted.parts.flatMap(part => glb(part.bytes).attribute('POSITION').map((value, index) => value + part.position[index % 3]));
      // Float32 recentering can shift the last decimal; compare bounds/each nearest coordinate with a tolerant multiset.
      assert.equal(restored.length, reference.length);
      close(converted.bounds.min, inspection.bounds.min);
      close(converted.bounds.max, inspection.bounds.max);
      const expected = reference.map(value => Math.round(value * 1000) / 1000);
      const actual = restored.map(value => Math.round(value * 1000) / 1000);
      assert.deepEqual(keys(actual), keys(expected));
      converted.parts.forEach(part => assert.equal(part.localBounds.min[1], 0));
    });
  }
  console.log(`STL parts import: ${checks} offline checks passed.`);
} finally {
  globalThis.FileReader = previousFileReader;
}
