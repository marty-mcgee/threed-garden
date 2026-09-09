import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import {
  resolveThreeDModelAttachmentUrl,
  type ThreeDModelRuntimeAttachment,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../../../lib/services/threed/models/model-attachment-runtime-core.ts';
import {
  normalizeThreeDModelRelativePath,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../../../lib/services/threed/models/model-companion-core.ts';
import {
  createThreeDModelMaterialInventory,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../../../lib/services/threed/models/model-material-inventory-core.ts';
import {
  getBulkLocalImagePixelCount, loadBulkGltfBundle,
  type BulkLocalModelLease,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './model-gltf-bundle-inspection.ts';

export type { BulkLocalModelLease } from './model-gltf-bundle-inspection';
type Companion = { file: File; relativePath: string };
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 32 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 32 * 1024 * 1024;
const PLACEHOLDER = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='), (character) => character.charCodeAt(0));

function imageType(bytes: Uint8Array): string {
  if (bytes.length >= 24 && bytes[0] === 0x89 && String.fromCharCode(...bytes.subarray(1, 4)) === 'PNG') return 'image/png';
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 20 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
  if (bytes.length >= 26 && bytes[0] === 0x42 && bytes[1] === 0x4d) return 'image/bmp';
  throw new Error('The local FBX preview supports browser-decoded PNG, JPEG, WebP and BMP textures. A referenced image is invalid or uses an unsupported format.');
}

function requestName(url: string): string {
  let path = url.trim().replaceAll('\\', '/');
  try { path = decodeURIComponent(path); } catch { /* Filename fallback remains bounded. */ }
  return path.split('/').at(-1)?.split(/[?#]/, 1)[0].slice(0, 255) || 'Unnamed FBX texture';
}

async function loadBulkFbxBundle(file: File, attachments: Companion[], allowMissingTextures: boolean): Promise<BulkLocalModelLease> {
  const files = [file, ...attachments.map((attachment) => attachment.file)];
  if (attachments.length > 500 || files.some((entry) => entry.size <= 0 || entry.size > MAX_FILE_BYTES)) throw new Error('Local previews support at most 500 companions and nonempty files up to 4 MiB each.');
  if (files.reduce((total, entry) => total + entry.size, 0) > MAX_BUNDLE_BYTES) throw new Error('Selected local preview files exceed the 32 MiB bundle limit.');
  const destinations = new Set<string>();
  const candidates: ThreeDModelRuntimeAttachment[] = attachments.map((attachment, index) => {
    const normalized = normalizeThreeDModelRelativePath(attachment.relativePath);
    if (!normalized || normalized !== attachment.relativePath || destinations.has(normalized.toLowerCase())) throw new Error('Local preview attachment destinations are invalid or duplicated.');
    destinations.add(normalized.toLowerCase());
    return { fileName: attachment.file.name, relativePath: normalized, filePath: `https://bulk-preview.invalid/${index}`, fileType: 'texture' };
  });
  for (const path of destinations) for (let slash = path.indexOf('/'); slash >= 0; slash = path.indexOf('/', slash + 1)) {
    if (destinations.has(path.slice(slash + 1))) throw new Error('Competing attachment suffixes make the local preview ambiguous.');
  }

  const manager = new THREE.LoadingManager();
  const owned = new Map<string, Blob>();
  const sourceUrls = new Map<string, string>();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const pendingTextures: Promise<void>[] = [];
  const missingTexturePaths = new Set<string>();
  let totalImagePixels = 0;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const checkOpen = () => { if (closed) throw new Error('The local FBX preview has ended.'); };
  const own = (blob: Blob) => {
    checkOpen();
    const url = URL.createObjectURL(blob);
    owned.set(url, blob);
    return url;
  };
  const capture = (scene: THREE.Group) => scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry instanceof THREE.BufferGeometry) geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (!(material instanceof THREE.Material)) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  const dispose = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    manager.abort();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) {
      texture.dispose();
      if (typeof HTMLImageElement !== 'undefined' && texture.image instanceof HTMLImageElement) texture.image.src = '';
    }
    for (const url of owned.keys()) URL.revokeObjectURL(url);
  };
  const resolve = (url: string): string => {
    checkOpen();
    if (owned.has(url)) return url;
    const remembered = sourceUrls.get(url);
    if (remembered) return remembered;
    if (/^data:/i.test(url)) {
      const parts = /^data:image\/(?:png|jpeg|webp|bmp|x-ms-bmp);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(url);
      if (!parts || parts[1].length > Math.ceil(MAX_FILE_BYTES / 3) * 4) throw new Error('The FBX contains an unsupported or oversized embedded texture.');
      const bytes = Uint8Array.from(atob(parts[1]), (character) => character.charCodeAt(0));
      const local = own(new Blob([bytes], { type: imageType(bytes) }));
      sourceUrls.set(url, local);
      return local;
    }
    // The shared runtime's HTTPS requirement is satisfied only by inert IDs.
    // They are mapped back to selected Files here and never requested.
    const matched = resolveThreeDModelAttachmentUrl(url, candidates);
    const candidateIndex = candidates.findIndex((candidate) => candidate.filePath === matched);
    if (candidateIndex >= 0) {
      const key = candidates[candidateIndex].filePath;
      const local = sourceUrls.get(key) ?? own(attachments[candidateIndex].file);
      sourceUrls.set(key, local);
      sourceUrls.set(url, local);
      return local;
    }
    const name = requestName(url);
    const sameNames = candidates.filter((candidate) => candidate.fileName.toLowerCase() === name.toLowerCase());
    if (sameNames.length > 1) throw new Error(`Ambiguous local FBX texture: ${name}.`);
    if (!allowMissingTextures) throw new Error(`Missing local FBX texture: ${name}.`);
    missingTexturePaths.add(name);
    const placeholder = sourceUrls.get('deferred-image') ?? own(new Blob([PLACEHOLDER], { type: 'image/png' }));
    sourceUrls.set('deferred-image', placeholder);
    sourceUrls.set(url, placeholder);
    return placeholder;
  };
  manager.setURLModifier(resolve);

  // FBXLoader returns texture objects synchronously and fills their images
  // later. Track these loads explicitly, including errors it normally logs.
  const localTextureLoader = new THREE.TextureLoader(manager);
  localTextureLoader.load = (url, onLoad, onProgress, onError) => {
    const texture = new THREE.Texture<HTMLImageElement>();
    textures.add(texture);
    const pending = (async () => {
      const local = resolve(url);
      const blob = owned.get(local)!;
      if (blob.size <= 0 || blob.size > MAX_FILE_BYTES) throw new Error('A local FBX texture is empty or exceeds 4 MiB.');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      checkOpen();
      const mimeType = imageType(bytes);
      totalImagePixels += getBulkLocalImagePixelCount(bytes, mimeType);
      if (totalImagePixels > MAX_IMAGE_PIXELS) throw new Error('FBX textures exceed the combined 32 Mi pixel decoded-image limit.');
      // Use the same TextureLoader/ImageLoader decoding and flipY behavior as
      // ModelMarker3D's FBX path. No TGA decoder is introduced by this preview.
      const loaded = await new THREE.TextureLoader(manager).loadAsync(local, onProgress);
      if (closed) {
        loaded.dispose();
        if (loaded.image instanceof HTMLImageElement) loaded.image.src = '';
        checkOpen();
      }
      const image = loaded.image as HTMLImageElement;
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0 || image.naturalWidth * image.naturalHeight !== getBulkLocalImagePixelCount(bytes, mimeType)) {
        loaded.dispose();
        throw new Error('A local FBX texture could not be decoded with valid dimensions.');
      }
      texture.image = image;
      texture.needsUpdate = true;
      loaded.dispose();
      onLoad?.(texture);
    })().catch((error: unknown) => {
      onError?.(error);
      throw error;
    });
    pendingTextures.push(pending);
    // A later synchronous FBX parse failure must not leave image rejections
    // unobserved while the outer cleanup releases the partially loaded asset.
    void pending.catch(() => undefined);
    return texture;
  };
  manager.addHandler(/^\./, localTextureLoader);

  const load = async (): Promise<BulkLocalModelLease> => {
    const bytes = await file.arrayBuffer();
    checkOpen();
    // Binary FBX creates embedded image URLs inside its synchronous parse.
    // Track only that synchronous operation, restoring the native API before
    // any await; unrelated asynchronous work cannot interleave with this scope.
    const createUrl = URL.createObjectURL;
    URL.createObjectURL = (blob) => { const url = createUrl(blob); if (blob instanceof Blob) owned.set(url, blob); return url; };
    let scene: THREE.Group;
    try { scene = new FBXLoader(manager).parse(bytes, ''); }
    finally { URL.createObjectURL = createUrl; }
    capture(scene);
    await Promise.all(pendingTextures);
    checkOpen();
    const attributeBuffers = new Set<ArrayBufferLike>();
    let vertices = 0;
    for (const geometry of geometries) {
      vertices += geometry.getAttribute('position')?.count ?? 0;
      const attributes = [...Object.values(geometry.attributes), ...Object.values(geometry.morphAttributes).flat(), ...(geometry.index ? [geometry.index] : [])];
      for (const attribute of attributes) {
        const array = attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array;
        attributeBuffers.add(array.buffer);
      }
    }
    if ([...attributeBuffers].reduce((total, buffer) => total + buffer.byteLength, 0) > MAX_BUNDLE_BYTES) throw new Error('Decoded FBX geometry exceeds the 32 MiB preview limit.');
    // Validate actual rendered positions/bounds. The working tracked Farmer
    // FBX contains NaNs in an unused secondary UV set, which must not make its
    // otherwise finite, previewable geometry fail or rewrite authored data.
    const bounds = new THREE.Box3().setFromObject(scene, true);
    if (vertices === 0 || bounds.isEmpty() || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) throw new Error('The FBX has no previewable geometry with finite bounds.');
    const inventory = createThreeDModelMaterialInventory(scene);
    for (const slot of inventory.slots) for (const channel of slot.textures) {
      if (channel.ready) continue;
      if (!allowMissingTextures) throw new Error(`An FBX texture could not be resolved for ${slot.materialName}.`);
      missingTexturePaths.add(`Unresolved ${channel.label} texture: ${slot.materialName}`);
    }
    return {
      scene,
      materialTargets: { targetKeys: inventory.slots.map((slot) => slot.id), materialSlotCount: inventory.materialSlotCount, omittedSlotCount: inventory.omittedSlotCount },
      missingTexturePaths: [...missingTexturePaths],
      dispose,
    };
  };
  try {
    const result = await Promise.race([
      load(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Local FBX preview loading exceeded 30 seconds.')), 30_000);
      }),
    ]);
    clearTimeout(timer);
    return result;
  } catch (error) {
    dispose();
    throw error;
  }
}

/** Local asset ownership stays with the popup; no Model upload or API is used. */
export function loadBulkLocalModel(file: File, attachments: Companion[], allowMissingTextures: boolean): Promise<BulkLocalModelLease> {
  if (/\.(?:glb|gltf)$/i.test(file.name)) return loadBulkGltfBundle(file, attachments, allowMissingTextures);
  if (/\.fbx$/i.test(file.name)) return loadBulkFbxBundle(file, attachments, allowMissingTextures);
  return Promise.reject(new Error('Choose an FBX, GLB or GLTF Model for the local preview.'));
}
