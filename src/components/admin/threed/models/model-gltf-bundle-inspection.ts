import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  createThreeDModelMaterialInventory,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../../../lib/services/threed/models/model-material-inventory-core.ts';
import {
  inspectThreeDGltfBundle,
  resolveThreeDGltfBundleResource,
  validateThreeDGltfBundleResources,
  type GltfBundleResource,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../../../lib/services/threed/models/model-gltf-bundle-core.ts';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 32 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 16 * 1024 * 1024;
const MAX_TOTAL_IMAGE_PIXELS = 32 * 1024 * 1024;
const INSPECTION_TIMEOUT_MS = 30_000;
// Original synthetic one-pixel RGBA PNG with valid chunk checksums.
const DEFERRED_IMAGE = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='), (character) => character.charCodeAt(0));

export interface BulkGltfMaterialTargets {
  targetKeys: string[];
  materialSlotCount: number;
  omittedSlotCount: number;
}

export interface BulkLocalModelLease {
  scene: THREE.Group;
  materialTargets: BulkGltfMaterialTargets;
  missingTexturePaths?: string[];
  dispose: () => void;
}

/** Read dimensions before asking the browser to allocate decoded image memory. */
export function getBulkLocalImagePixelCount(bytes: Uint8Array, mimeType: string): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  if (mimeType === 'image/png' && bytes.length >= 24) {
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (mimeType === 'image/jpeg') {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 0xff) break;
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  } else if (mimeType === 'image/bmp' && bytes.length >= 26 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    const headerSize = view.getUint32(14, true);
    if (headerSize === 12) {
      width = view.getUint16(18, true);
      height = view.getUint16(20, true);
    } else if (headerSize >= 40) {
      width = view.getInt32(18, true);
      height = Math.abs(view.getInt32(22, true));
    }
  } else if (mimeType === 'image/webp' && bytes.length >= 25) {
    const kind = String.fromCharCode(...bytes.slice(12, 16));
    if (kind === 'VP8X' && bytes.length >= 30) {
      // Animated textures are outside this bounded static-image inspection.
      if ((bytes[20] & 2) !== 0) throw new Error('Animated WebP images are not supported in bulk GLB/GLTF imports.');
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (kind === 'VP8L' && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = 1 + (bits & 0x3fff);
      height = 1 + ((bits >>> 14) & 0x3fff);
    } else if (kind === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      width = view.getUint16(26, true) & 0x3fff;
      height = view.getUint16(28, true) & 0x3fff;
    }
  }
  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels <= 0) throw new Error('A texture image has invalid or unsupported dimensions.');
  if (pixels > MAX_IMAGE_PIXELS) throw new Error('Each texture image must contain at most 16 Mi pixels (16,777,216 pixels).');
  return pixels;
}

/**
 * Load the exact default scene used by ModelMarker3D before any upload. Only
 * resource locations change in this temporary document; uploaded bytes, scene
 * topology, material order and authored material values are left intact.
 */
export async function loadBulkGltfBundle(
  file: File,
  attachments: Array<{ file: File; relativePath: string }>,
  configureLater: boolean,
): Promise<BulkLocalModelLease> {
  if (attachments.length > 500) throw new Error('A GLB/GLTF bundle may contain at most 500 companion files.');
  const selected = [file, ...attachments.map((attachment) => attachment.file)];
  if (selected.some((entry) => entry.size <= 0 || entry.size > MAX_FILE_BYTES)) throw new Error('Each selected GLB/GLTF bundle file must be nonempty and at most 4 MiB.');
  if (selected.reduce((total, entry) => total + entry.size, 0) > MAX_BUNDLE_BYTES) throw new Error('Selected files for one GLB/GLTF Model exceed the 32 MiB bundle limit.');

  const urls = new Set<string>();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const bitmaps = new Set<ImageBitmap>();
  const manager = new THREE.LoadingManager();
  const draco = new DRACOLoader(manager).setDecoderPath('/assets/draco/').setWorkerLimit(2);
  let closed = false;
  let resourceFailed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const checkOpen = () => { if (closed) throw new Error('Local GLB/GLTF inspection has ended.'); };
  const ownedUrl = (bytes: Uint8Array, mimeType: string) => {
    checkOpen();
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mimeType }));
    urls.add(url);
    return url;
  };
  const captureTexture = (texture: THREE.Texture) => {
    if (textures.has(texture)) return;
    textures.add(texture);
    if (closed) texture.dispose();
    const bitmap = texture.source?.data as ImageBitmap | undefined;
    if (bitmap && typeof bitmap.close === 'function' && !bitmaps.has(bitmap)) {
      bitmaps.add(bitmap);
      if (closed) bitmap.close();
    }
  };
  const captureMaterial = (material: THREE.Material) => {
    if (materials.has(material)) return;
    materials.add(material);
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) captureTexture(value);
    if (closed) material.dispose();
  };
  const capture = (value: unknown) => {
    if (value instanceof THREE.BufferGeometry && !geometries.has(value)) {
      geometries.add(value);
      if (closed) value.dispose();
    } else if (value instanceof THREE.Material) captureMaterial(value);
    else if (value instanceof THREE.Texture) captureTexture(value);
    else if (value instanceof THREE.Object3D) value.traverse((object) => {
      const renderable = object as THREE.Mesh;
      if (renderable.geometry instanceof THREE.BufferGeometry) capture(renderable.geometry);
      const values = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
      for (const material of values) if (material instanceof THREE.Material) captureMaterial(material);
    });
  };
  manager.onError = () => { resourceFailed = true; };
  manager.setURLModifier((url) => {
    checkOpen();
    if (urls.has(url)) return url;
    if (/^\/assets\/draco\/(?:draco_wasm_wrapper\.js|draco_decoder\.wasm|draco_decoder\.js)$/.test(url)) return url;
    throw new Error('The GLB/GLTF loader requested a resource outside the selected local bundle.');
  });

  const dispose = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    manager.abort();
    draco.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    for (const bitmap of bitmaps) bitmap.close();
    for (const url of urls) URL.revokeObjectURL(url);
  };

  const inspect = async (): Promise<BulkLocalModelLease> => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    checkOpen();
    const bundle = inspectThreeDGltfBundle(file.name, bytes);
    const resources: GltfBundleResource[] = [];
    for (const attachment of attachments) {
      resources.push({ relativePath: attachment.relativePath, bytes: new Uint8Array(await attachment.file.arrayBuffer()) });
      checkOpen();
    }
    const issues = validateThreeDGltfBundleResources(bundle, resources, configureLater);
    if (issues.length > 0) throw new Error(issues[0]);
    const document = structuredClone(bundle.document);
    const bufferDefinitions = (document.buffers ?? []) as Array<Record<string, unknown>>;
    const imageDefinitions = (document.images ?? []) as Array<Record<string, unknown>>;
    const bufferViews = (document.bufferViews ?? []) as Array<{ buffer: number; byteOffset?: number; byteLength: number }>;
    const bufferBytes = new Map<number, Uint8Array>();
    const resourceBytes = (path: string) => resolveThreeDGltfBundleResource(path, resources).resource?.bytes;
    for (const buffer of bundle.buffers) {
      const content = buffer.embedded ?? (buffer.relativePath ? resourceBytes(buffer.relativePath) : undefined);
      if (!content) throw new Error('A required GLB/GLTF binary buffer is missing.');
      bufferBytes.set(buffer.index, content);
      bufferDefinitions[buffer.index].uri = ownedUrl(content, 'application/octet-stream');
    }
    let totalPixels = 0;
    const missingTexturePaths: string[] = [];
    for (const image of bundle.images) {
      let content = image.embedded ?? (image.relativePath ? resourceBytes(image.relativePath) : undefined);
      if (image.bufferView !== undefined) {
        const view = bufferViews[image.bufferView];
        const source = bufferBytes.get(view.buffer);
        content = source?.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
      }
      let mimeType: string = image.mimeType;
      if (!content) {
        if (!configureLater || !image.relativePath) throw new Error('A required GLB/GLTF image is missing.');
        missingTexturePaths.push(image.relativePath);
        content = DEFERRED_IMAGE;
        mimeType = 'image/png';
      }
      const pixels = getBulkLocalImagePixelCount(content, mimeType);
      totalPixels += pixels;
      if (totalPixels > MAX_TOTAL_IMAGE_PIXELS) throw new Error('GLB/GLTF images exceed the combined 32 Mi pixel decoded-image limit.');
      if (typeof createImageBitmap !== 'function') throw new Error('This browser cannot validate GLB/GLTF image decoding.');
      try {
        const bitmap = await createImageBitmap(new Blob([new Uint8Array(content)], { type: mimeType }));
        const decodedPixels = bitmap.width * bitmap.height;
        bitmap.close();
        if (decodedPixels !== pixels) throw new Error('Decoded image dimensions disagree with its header.');
      } catch {
        throw new Error(`GLB/GLTF image ${image.relativePath ?? image.index + 1} could not be decoded. Select a valid image before importing.`);
      }
      checkOpen();
      imageDefinitions[image.index].uri = ownedUrl(content, mimeType);
      imageDefinitions[image.index].mimeType = mimeType;
      delete imageDefinitions[image.index].bufferView;
    }

    const loader = new GLTFLoader(manager).setDRACOLoader(draco);
    // Observe the actual loader's products without replacing its scene/material
    // construction. This also disposes products settling after an early failure.
    loader.register((parser) => {
      const dependency = parser.getDependency.bind(parser);
      parser.getDependency = (type, index) => dependency(type, index).then((value) => { capture(value); return value; });
      const loadGeometries = parser.loadGeometries.bind(parser);
      parser.loadGeometries = (primitives) => loadGeometries(primitives).then((values) => {
        values.forEach(capture);
        // A compressed buffer's actual decoded count must agree with its
        // declaration; JSON accessor budgets alone cannot prove this.
        const accessors = (document.accessors ?? []) as Array<{ count: number }>;
        for (const [index, geometry] of values.entries()) {
          const primitive = primitives[index];
          const position = primitive.attributes?.POSITION;
          if (position !== undefined && geometry.getAttribute('position')?.count !== accessors[position]?.count) throw new Error('Decoded GLB/GLTF vertex counts disagree with the declared accessors.');
          if (primitive.indices !== undefined && geometry.index?.count !== accessors[primitive.indices]?.count) throw new Error('Decoded GLB/GLTF index counts disagree with the declared accessor.');
        }
        const buffers = new Set<ArrayBufferLike>();
        for (const geometry of geometries) {
          const attributes = [...Object.values(geometry.attributes), ...Object.values(geometry.morphAttributes).flat(), ...(geometry.index ? [geometry.index] : [])];
          for (const attribute of attributes) {
            const array = attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array;
            buffers.add(array.buffer);
          }
        }
        if ([...buffers].reduce((total, buffer) => total + buffer.byteLength, 0) > MAX_BUNDLE_BYTES) throw new Error('Decoded GLB/GLTF geometry exceeds the 32 MiB inspection limit.');
        return values;
      });
      return { name: 'THREED_bulk_resource_cleanup' };
    });
    const loading = loader.parseAsync(JSON.stringify(document), '');
    // r185 starts Draco preload even for an unused declared extension. Observe
    // its promise so rejection/late initialization cannot outlive cleanup.
    const pendingDecoder = (draco as DRACOLoader & { decoderPending?: Promise<void> }).decoderPending;
    void pendingDecoder?.then(() => { if (closed) draco.dispose(); }, () => { resourceFailed = true; });
    const loaded = await loading;
    await pendingDecoder;
    checkOpen();
    loaded.scenes.forEach(capture);
    if (resourceFailed) throw new Error('The GLB/GLTF loader could not decode a selected image or binary resource.');
    loaded.scene.animations = loaded.animations;
    const inventory = createThreeDModelMaterialInventory(loaded.scene);
    return {
      scene: loaded.scene,
      materialTargets: {
        targetKeys: inventory.slots.map((slot) => slot.id),
        materialSlotCount: inventory.materialSlotCount,
        omittedSlotCount: inventory.omittedSlotCount,
      },
      missingTexturePaths: [...new Set(missingTexturePaths)],
      dispose,
    };
  };
  try {
    const result = await Promise.race([
      inspect(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Local GLB/GLTF inspection exceeded 30 seconds. Reduce the bundle and retry.')), INSPECTION_TIMEOUT_MS);
      }),
    ]);
    clearTimeout(timer);
    return result;
  } catch (error) {
    dispose();
    throw error;
  }
}

/** Import inspection releases its temporary scene; a popup keeps its own lease. */
export async function inspectBulkGltfBundle(
  file: File,
  attachments: Array<{ file: File; relativePath: string }>,
  configureLater: boolean,
): Promise<BulkGltfMaterialTargets> {
  const lease = await loadBulkGltfBundle(file, attachments, configureLater);
  try { return lease.materialTargets; }
  finally { lease.dispose(); }
}
