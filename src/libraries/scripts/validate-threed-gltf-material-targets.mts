import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  inspectBulkGltfBundle, loadBulkGltfBundle,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../components/admin/threed/models/model-gltf-bundle-inspection.ts';
import {
  createThreeDModelMaterialInventory,
  resolveThreeDModelMaterialTarget,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-material-inventory-core.ts';
import {
  triangleGltfFixture, encodeGltf, encodeGlb,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './fixtures/gltf-bundle-fixtures.ts';

// GLTF assets are original synthetic triangles/images generated in these local
// fixtures. The optional browser File is the existing tracked Farmer FBX, used
// in place without copying or downloading it. Draco bytes were generated with the installed transitive
// draco3d encoder (sequential triangle, POSITION attribute id 0). Validation
// requires no fixture downloads or application/API/database access.
const DRACO_TRIANGLE = 'RFJBQ08CAgEAAAABAwEAAQIBAQAJAwAAAAAAAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAAAAAAIA/AAAAAA==';
type Json = Record<string, any>;
type Companion = { file: File; relativePath: string };
const decode64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const encode64 = (value: Uint8Array) => btoa(String.fromCharCode(...value));
const makeFile = (name: string, bytes: Uint8Array) => new File([new Uint8Array(bytes)], name);
const equal = (actual: unknown, expected: unknown, label: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(label);
};
const assert = (value: unknown, label: string) => { if (!value) throw new Error(label); };
async function rejects(run: () => Promise<unknown>, pattern: RegExp) {
  try { await run(); } catch (error) {
    assert(error instanceof Error && pattern.test(error.message), `Expected ${pattern}; received ${String(error)}`);
    return;
  }
  throw new Error(`Expected rejection: ${pattern}`);
}

function fixture(images = false) {
  const original = triangleGltfFixture();
  const document = structuredClone(original.document) as Json;
  if (!images) {
    delete document.images;
    delete document.textures;
    document.materials = [{ name: 'Authored color', pbrMetallicRoughness: { baseColorFactor: [0.2, 0.4, 0.8, 1] } }];
  }
  const attachments: Companion[] = original.resources
    .filter((resource: { relativePath: string }) => images || resource.relativePath.endsWith('.bin'))
    .map((resource: { relativePath: string; bytes: Uint8Array }) => ({
      relativePath: resource.relativePath,
      file: makeFile(resource.relativePath.split('/').at(-1)!, resource.bytes),
    }));
  return { document, attachments, geometry: original.geometry, image: original.image };
}

function describe(root: THREE.Group) {
  const inventory = createThreeDModelMaterialInventory(root);
  return {
    targetKeys: inventory.slots.map((slot) => slot.id),
    materialSlotCount: inventory.materialSlotCount,
    omittedSlotCount: inventory.omittedSlotCount,
  };
}

function describeMaterials(root: THREE.Group) {
  return createThreeDModelMaterialInventory(root).slots.map((slot) => ({
    id: slot.id, meshName: slot.meshName, slotIndex: slot.slotIndex,
    materialName: slot.materialName, materialType: slot.materialType,
    color: slot.color, opacity: slot.opacity, transparent: slot.transparent,
    textures: slot.textures.map(({ property, ready, width, height }) => ({ property, ready, width, height })),
  }));
}

async function parity(document: Json, attachments: Companion[], options: { glb?: Uint8Array; expectSkinned?: boolean } = {}) {
  const urls: string[] = [];
  const mappings = new Map(attachments.map((attachment) => {
    const url = URL.createObjectURL(attachment.file);
    urls.push(url);
    return [attachment.relativePath, url];
  }));
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => mappings.get(url) ?? url);
  const decoder = new DRACOLoader(manager).setDecoderPath('/assets/draco/').setWorkerLimit(2);
  const bytes = options.glb ?? encodeGltf(document);
  // Match ModelMarker3D: real loader, default .scene, then cached-root clone
  // and stored transforms. No JSON-to-material-index shortcut is involved.
  const runtime = await new GLTFLoader(manager).setDRACOLoader(decoder).parseAsync(new Uint8Array(bytes).buffer, '');
  try {
    const preview = runtime.scene.clone();
    preview.position.set(2, 3, 4);
    preview.rotation.y = 0.4;
    preview.scale.setScalar(0.1);
    if (options.expectSkinned) {
      let skinned = false;
      preview.traverse((object) => { if (object instanceof THREE.SkinnedMesh) skinned = true; });
      assert(skinned, 'The fixture must load an actual SkinnedMesh.');
    }
    const parse = GLTFLoader.prototype.parse;
    let inspectedMaterials: ReturnType<typeof describeMaterials> | undefined;
    GLTFLoader.prototype.parse = function (data, path, onLoad, onError) {
      parse.call(this, data, path, (result) => {
        inspectedMaterials = describeMaterials(result.scene);
        onLoad(result);
      }, onError);
    };
    let targets;
    try {
      targets = await inspectBulkGltfBundle(makeFile(options.glb ? 'fixture.glb' : 'fixture.gltf', bytes), attachments, false);
    } finally { GLTFLoader.prototype.parse = parse; }
    equal(targets, describe(preview), 'Inspection target keys must equal the actual default-scene preview keys.');
    equal(inspectedMaterials, describeMaterials(preview), 'Keys must refer to the same meshes, authored materials and decoded texture channels.');
    for (const key of targets.targetKeys) {
      const target = resolveThreeDModelMaterialTarget(preview, key);
      assert(target, 'Every key must resolve in the actual preview.');
      const materials = Array.isArray(target!.mesh.material) ? target!.mesh.material : [target!.mesh.material];
      assert(materials[target!.slotIndex] instanceof THREE.Material, 'Every resolved target must contain an actual Material.');
    }
    return targets;
  } finally {
    decoder.dispose();
    for (const scene of runtime.scenes) scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (!material) continue;
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) {
          value.dispose();
          const image = value.source?.data as ImageBitmap | undefined;
          if (typeof image?.close === 'function') image.close();
        }
        material.dispose();
      }
    });
    urls.forEach((url) => URL.revokeObjectURL(url));
  }
}

/** The same fixture suite can be bundled for a real browser without Node shims. */
export async function runGltfMaterialTargetChecks(browserImages = false, log: (message: string) => void = console.log, fbxFixture?: File) {
  let groups = 0;
  const group = async (label: string, run: () => Promise<void>) => {
    await run();
    groups += 1;
    log(`  ✓ ${label}`);
  };
  await group('external GLTF and embedded GLB match actual default-scene material targets', async () => {
    const data = fixture();
    const external = await parity(data.document, data.attachments);
    equal(external.materialSlotCount, 1, 'A triangle has one material target.');
    const embedded = structuredClone(data.document);
    delete embedded.buffers[0].uri;
    equal(await parity(embedded, [], { glb: encodeGlb(embedded, data.geometry) }), external, 'GLB and GLTF targets agree.');
  });
  await group('multiple primitives, repeated mesh instances and a nonzero default scene preserve exact traversal', async () => {
    const data = fixture();
    const primitive = data.document.meshes[0].primitives[0];
    data.document.meshes[0].primitives.push(structuredClone(primitive));
    data.document.nodes = [{ name: 'Excluded', mesh: 0 }, { name: 'Parent', children: [2, 3] }, { name: 'First', mesh: 0 }, { name: 'Second', mesh: 0 }];
    data.document.scenes = [{ nodes: [0] }, { nodes: [1] }];
    data.document.scene = 1;
    const result = await parity(data.document, data.attachments);
    equal(result.targetKeys, Array.from({ length: 4 }, (_, index) => `mesh:${index}:material:0`), 'Default scene has four actual Mesh slots, sharing one authored material.');
  });
  await group('skinned material slots resolve on the actual loaded and transformed preview', async () => {
    const data = fixture();
    const offset = Math.ceil(data.geometry.length / 4) * 4;
    const geometry = new Uint8Array(offset + 60);
    geometry.set(data.geometry);
    const weights = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
    geometry.set(new Uint8Array(weights.buffer), offset + 12);
    const jointsView = data.document.bufferViews.length;
    data.document.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: 12 }, { buffer: 0, byteOffset: offset + 12, byteLength: 48 });
    const jointsAccessor = data.document.accessors.length;
    data.document.accessors.push({ bufferView: jointsView, componentType: 5121, count: 3, type: 'VEC4' }, { bufferView: jointsView + 1, componentType: 5126, count: 3, type: 'VEC4' });
    data.document.meshes[0].primitives[0].attributes.JOINTS_0 = jointsAccessor;
    data.document.meshes[0].primitives[0].attributes.WEIGHTS_0 = jointsAccessor + 1;
    data.document.buffers[0].byteLength = geometry.length;
    data.document.nodes = [{ name: 'Skin', mesh: 0, skin: 0 }, { name: 'Joint' }];
    data.document.skins = [{ joints: [1] }];
    data.document.scenes = [{ nodes: [0, 1] }];
    const attachments = [{ relativePath: data.document.buffers[0].uri, file: makeFile('geometry.bin', geometry) }];
    await parity(data.document, attachments, { expectSkinned: true });
  });
  await group('embedded data buffers, zero slots and truncated inventory remain explicit', async () => {
    const data = fixture();
    data.document.buffers[0].uri = `data:application/octet-stream;base64,${encode64(data.geometry)}`;
    await parity(data.document, []);
    data.document.nodes = Array.from({ length: 501 }, (_, index) => ({ name: `Instance${index}`, mesh: 0 }));
    data.document.scenes = [{ nodes: data.document.nodes.map((_node: unknown, index: number) => index) }];
    const many = await parity(data.document, []);
    equal([many.targetKeys.length, many.materialSlotCount, many.omittedSlotCount], [500, 501, 1], 'Inventory truncation is reported.');
    data.document.nodes = [];
    data.document.scenes = [{ nodes: [] }];
    equal((await parity(data.document, [])).materialSlotCount, 0, 'An empty scene cannot fabricate targets.');
  });
  await group('missing buffers, unsafe URIs, invalid containers and required extensions fail before fetch', async () => {
    const data = fixture();
    const originalFetch = globalThis.fetch;
    let fetches = 0;
    globalThis.fetch = async () => { fetches += 1; throw new Error('Unexpected fetch'); };
    try {
      await rejects(() => inspectBulkGltfBundle(makeFile('missing.gltf', encodeGltf(data.document)), [], true), /buffer|binary|missing/i);
      data.document.buffers[0].uri = 'https://example.invalid/private.bin';
      await rejects(() => inspectBulkGltfBundle(makeFile('remote.gltf', encodeGltf(data.document)), [], false), /uri|relative|remote|unsupported|path/i);
      await rejects(() => inspectBulkGltfBundle(makeFile('bad.glb', new Uint8Array([1, 2, 3])), [], false), /glb|header|container/i);
      delete data.document.buffers;
      data.document.extensionsUsed = ['KHR_texture_basisu'];
      data.document.extensionsRequired = ['KHR_texture_basisu'];
      await rejects(() => inspectBulkGltfBundle(makeFile('unsupported.gltf', encodeGltf(data.document)), [], false), /extension|basisu/i);
      equal(fetches, 0, 'Rejected declarations must not start resource fetches.');
    } finally { globalThis.fetch = originalFetch; }
  });
  await group('object URLs and loader geometry/materials are cleaned after successful inspection', async () => {
    const data = fixture();
    const created = new Set<string>();
    const revoked = new Set<string>();
    const createUrl = URL.createObjectURL;
    const revokeUrl = URL.revokeObjectURL;
    const disposeGeometry = THREE.BufferGeometry.prototype.dispose;
    const disposeMaterial = THREE.Material.prototype.dispose;
    let geometryDisposals = 0;
    let materialDisposals = 0;
    URL.createObjectURL = (blob) => { const url = createUrl(blob); created.add(url); return url; };
    URL.revokeObjectURL = (url) => { revoked.add(url); revokeUrl(url); };
    THREE.BufferGeometry.prototype.dispose = function () { geometryDisposals += 1; disposeGeometry.call(this); };
    THREE.Material.prototype.dispose = function () { materialDisposals += 1; disposeMaterial.call(this); };
    try {
      await inspectBulkGltfBundle(makeFile('cleanup.gltf', encodeGltf(data.document)), data.attachments, false);
      assert(created.size > 0 && [...created].every((url) => revoked.has(url)), 'All inspection-owned URLs must be revoked.');
      assert(geometryDisposals > 0 && materialDisposals > 0, 'Actual loader resources must be disposed.');
    } finally {
      URL.createObjectURL = createUrl;
      URL.revokeObjectURL = revokeUrl;
      THREE.BufferGeometry.prototype.dispose = disposeGeometry;
      THREE.Material.prototype.dispose = disposeMaterial;
    }
  });
  await group('a local scene lease retains its assets until explicit idempotent release', async () => {
    const data = fixture();
    const created = new Set<string>();
    const revocations: string[] = [];
    const create = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    URL.createObjectURL = (blob) => { const url = create(blob); created.add(url); return url; };
    URL.revokeObjectURL = (url) => { revocations.push(url); revoke(url); };
    let lease: Awaited<ReturnType<typeof loadBulkGltfBundle>> | undefined;
    try {
      lease = await loadBulkGltfBundle(makeFile('retained.gltf', encodeGltf(data.document)), data.attachments, false);
      equal(lease.materialTargets, describe(lease.scene), 'The retained scene is the inspected scene.');
      assert(created.size > 0 && revocations.length === 0, 'The preview must retain its local resource URLs.');
      let disposals = 0;
      lease.scene.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.addEventListener('dispose', () => { disposals += 1; }); });
      lease.dispose(); lease.dispose();
      equal(disposals, 1, 'Each geometry is released once, even if the popup closes twice.');
      equal(revocations.length, created.size, 'Each owned URL is released exactly once.');
    } finally { lease?.dispose(); URL.createObjectURL = create; URL.revokeObjectURL = revoke; }
  });
  await group('timeout blocks late local reads before any loader request', async () => {
    const data = fixture();
    const bytes = encodeGltf(data.document);
    const primary = makeFile('slow.gltf', bytes);
    let resolveRead!: (value: ArrayBuffer) => void;
    Object.defineProperty(primary, 'arrayBuffer', { value: () => new Promise<ArrayBuffer>((resolve) => { resolveRead = resolve; }) });
    const setTimer = globalThis.setTimeout;
    globalThis.setTimeout = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => setTimer(callback, delay === 30_000 ? 1 : delay, ...args)) as typeof setTimeout;
    try {
      await rejects(() => inspectBulkGltfBundle(primary, data.attachments, false), /30 seconds/);
      resolveRead(new Uint8Array(bytes).buffer);
      await new Promise((resolve) => setTimer(resolve, 5));
    } finally { globalThis.setTimeout = setTimer; }
  });

  if (browserImages) {
    await group('real browser decodes authored PNG/JPEG/WebP and preserves material targets', async () => {
      for (const mimeType of ['image/png', 'image/jpeg', 'image/webp']) {
        const data = fixture(true);
        const canvas = document.createElement('canvas');
        canvas.width = 2; canvas.height = 2;
        canvas.getContext('2d')!.fillRect(0, 0, 2, 2);
        const image = decode64(canvas.toDataURL(mimeType).split(',')[1]);
        const path = `images/authored.${mimeType.split('/')[1]}`;
        data.document.images = [{ uri: path, mimeType }];
        if (mimeType === 'image/webp') {
          data.document.extensionsUsed = ['EXT_texture_webp'];
          data.document.textures = [{ extensions: { EXT_texture_webp: { source: 0 } } }];
        }
        data.attachments = data.attachments.filter((attachment) => attachment.relativePath.endsWith('.bin'));
        data.attachments.push({ relativePath: path, file: makeFile(path.split('/').at(-1)!, image) });
        await parity(data.document, data.attachments);
      }
    });
    await group('GLB embedded bufferView images and embedded data images use real browser decoding', async () => {
      const data = fixture(true);
      const buffer = new Uint8Array(data.geometry.length + data.image.length);
      buffer.set(data.geometry); buffer.set(data.image, data.geometry.length);
      data.document.buffers[0].byteLength = buffer.length;
      delete data.document.buffers[0].uri;
      const imageView = data.document.bufferViews.length;
      data.document.bufferViews.push({ buffer: 0, byteOffset: data.geometry.length, byteLength: data.image.length });
      data.document.images = [{ bufferView: imageView, mimeType: 'image/png' }];
      await parity(data.document, [], { glb: encodeGlb(data.document, buffer) });
      data.document.images = [{ uri: `data:image/png;base64,${encode64(data.image)}` }];
      await parity(data.document, [], { glb: encodeGlb(data.document, buffer) });
    });
    await group('GLB external images retain authored PBR maps and image requirements', async () => {
      const data = fixture(true);
      delete data.document.buffers[0].uri;
      const material = data.document.materials[0];
      material.normalTexture = { index: 0 };
      material.emissiveTexture = { index: 0 };
      material.emissiveFactor = [0.1, 0.2, 0.3];
      material.pbrMetallicRoughness.roughnessFactor = 0.7;
      const images = data.attachments.filter((attachment) => !attachment.relativePath.endsWith('.bin'));
      await parity(data.document, images, { glb: encodeGlb(data.document, data.geometry) });
    });
    await group('missing images require explicit deferral; selected corrupt images still fail', async () => {
      const data = fixture(true);
      const primary = makeFile('images.gltf', encodeGltf(data.document));
      const buffers = data.attachments.filter((attachment) => attachment.relativePath.endsWith('.bin'));
      await rejects(() => inspectBulkGltfBundle(primary, buffers, false), /missing|image|texture/i);
      equal((await inspectBulkGltfBundle(primary, buffers, true)).materialSlotCount, 1, 'Deferred image placeholders preserve actual mesh targets.');
      const previewLease = await loadBulkGltfBundle(primary, buffers, true);
      try {
        equal(previewLease.missingTexturePaths, ['textures/pixel.png'], 'The preview must disclose actual deferred image paths.');
        assert(createThreeDModelMaterialInventory(previewLease.scene).readyTextureSlotCount > 0, 'Decoded placeholder textures remain alive while previewing.');
      } finally { previewLease.dispose(); }
      const imageAttachment = data.attachments.find((attachment) => !attachment.relativePath.endsWith('.bin'))!;
      const corrupt = data.image.slice();
      corrupt.fill(0, 41, corrupt.length - 12);
      await rejects(() => inspectBulkGltfBundle(primary, [...buffers, { ...imageAttachment, file: makeFile('bad.png', corrupt) }], true), /image|decode|png/i);
      const huge = data.image.slice();
      new DataView(huge.buffer).setUint32(16, 8192);
      new DataView(huge.buffer).setUint32(20, 8192);
      await rejects(() => inspectBulkGltfBundle(primary, [...buffers, { ...imageAttachment, file: makeFile('huge.png', huge) }], false), /pixels|dimensions/i);
    });
    await group('a texture failure swallowed by GLTFLoader remains an inspection failure', async () => {
      const data = fixture(true);
      const decode = globalThis.createImageBitmap;
      let calls = 0;
      globalThis.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => {
        calls += 1;
        return calls > 1 ? Promise.reject(new Error('Synthetic second-decode failure')) : Reflect.apply(decode, globalThis, args);
      }) as typeof createImageBitmap;
      try {
        await rejects(() => inspectBulkGltfBundle(makeFile('load-failure.gltf', encodeGltf(data.document)), data.attachments, false), /decode|resource/i);
        assert(calls > 1, 'The failure must occur during actual GLTFLoader decoding.');
      } finally { globalThis.createImageBitmap = decode; }
    });
    await group('real local Draco decoder preserves targets and rejects false decoded counts', async () => {
      const data = fixture();
      const compressed = decode64(DRACO_TRIANGLE);
      data.document.buffers = [{ byteLength: compressed.length }];
      data.document.bufferViews = [{ buffer: 0, byteOffset: 0, byteLength: compressed.length }];
      data.document.accessors = [{ componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }];
      data.document.meshes = [{ primitives: [{ attributes: { POSITION: 0 }, material: 0, extensions: { KHR_draco_mesh_compression: { bufferView: 0, attributes: { POSITION: 0 } } } }] }];
      data.document.extensionsUsed = ['KHR_draco_mesh_compression'];
      data.document.extensionsRequired = ['KHR_draco_mesh_compression'];
      await parity(data.document, [], { glb: encodeGlb(data.document, compressed) });
      data.document.accessors[0].count = 4;
      await rejects(() => inspectBulkGltfBundle(makeFile('bad-count.glb', encodeGlb(data.document, compressed)), [], false), /counts|accessor/i);
    });
    if (fbxFixture) {
      const {
        loadBulkLocalModel,
      // @ts-expect-error Node's native TypeScript runner requires the explicit extension.
      } = await import('../../components/admin/threed/models/model-bulk-local-preview-loader.ts');
      await group('tracked Farmer FBX waits for local textures and reports deferred workstation references', async () => {
        await rejects(() => loadBulkLocalModel(fbxFixture, [], false), /Missing local FBX texture/);
        const lease = await loadBulkLocalModel(fbxFixture, [], true);
        try {
          assert(lease.materialTargets.materialSlotCount > 0, 'The actual tracked FBX must produce material targets.');
          equal(lease.missingTexturePaths, ['PolygonFarm_Texture_01_A.png'], 'Unknown scanner paths are reported from actual FBX texture requests.');
          const inventory = createThreeDModelMaterialInventory(lease.scene);
          assert(inventory.readyTextureSlotCount > 0, 'Deferred placeholders have finished decoding before a scene is returned.');
          let skinned = false;
          lease.scene.traverse((object) => { if (object instanceof THREE.SkinnedMesh) skinned = true; });
          assert(skinned, 'The local FBX preview preserves actual skinned geometry.');
        } finally { lease.dispose(); lease.dispose(); }
      });
      await group('selected FBX textures use local filename matching and invalid images cannot be deferred', async () => {
        const image = fixture(true).image;
        const attachment = { relativePath: 'textures/PolygonFarm_Texture_01_A.png', file: makeFile('PolygonFarm_Texture_01_A.png', image) };
        const lease = await loadBulkLocalModel(fbxFixture, [attachment], false);
        try {
          equal(lease.missingTexturePaths, [], 'A supplied local image resolves the FBX workstation path.');
          const inventory = createThreeDModelMaterialInventory(lease.scene);
          equal(inventory.unavailableTextureSlotCount, 0, 'Every connected texture is decoded before rendering.');
        } finally { lease.dispose(); }
        await rejects(() => loadBulkLocalModel(fbxFixture, [{ ...attachment, file: makeFile(attachment.file.name, new Uint8Array([1, 2, 3])) }], true), /invalid|unsupported/i);
        await rejects(() => loadBulkLocalModel(fbxFixture, [attachment, { ...attachment, relativePath: 'other/PolygonFarm_Texture_01_A.png' }], true), /Ambiguous/);
      });
      await group('FBX scene release revokes owned images and disposes retained geometry exactly once', async () => {
        const create = URL.createObjectURL;
        const revoke = URL.revokeObjectURL;
        const urls = new Set<string>();
        const revoked: string[] = [];
        URL.createObjectURL = (blob) => { const url = create(blob); urls.add(url); return url; };
        URL.revokeObjectURL = (url) => { revoked.push(url); revoke(url); };
        let lease: Awaited<ReturnType<typeof loadBulkLocalModel>> | undefined;
        try {
          lease = await loadBulkLocalModel(fbxFixture, [], true);
          equal(revoked.length, 0, 'FBX texture URLs remain alive until the popup releases them.');
          let disposals = 0;
          const geometry = new Set<THREE.BufferGeometry>();
          lease.scene.traverse((object) => { if (object instanceof THREE.Mesh) geometry.add(object.geometry); });
          geometry.forEach((entry) => entry.addEventListener('dispose', () => { disposals += 1; }));
          lease.dispose(); lease.dispose();
          equal(disposals, geometry.size, 'Each retained FBX geometry is disposed once.');
          equal(revoked.length, urls.size, 'Every owned FBX image URL is revoked once.');
        } finally { lease?.dispose(); URL.createObjectURL = create; URL.revokeObjectURL = revoke; }
      });
    }
  }
  log(`ThreeD GLTF material targets: ${groups} groups passed${browserImages ? ` in the real browser (including images, Draco${fbxFixture ? ' and tracked FBX' : ''})` : ' offline; image/Draco acceptance uses the browser suite'}.`);
  return groups;
}

if (typeof window === 'undefined') {
  // Node has no image decoder/Worker. Geometry-only cases still exercise the
  // actual GLTFLoader and local Blob fetches, rather than replacing its parser.
  if (typeof ProgressEvent === 'undefined') Object.defineProperty(globalThis, 'ProgressEvent', { value: class extends Event {
    constructor(type: string, init?: ProgressEventInit) { super(type); Object.assign(this, init); }
  } });
  await runGltfMaterialTargetChecks();
}
