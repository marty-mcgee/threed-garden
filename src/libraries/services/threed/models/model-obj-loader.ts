import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
// @ts-expect-error Native TypeScript validation requires explicit extensions.
import { inspectObjGeometry, inspectObjMaterial, MAX_OBJ_BYTES, resolveObjPath } from './model-obj-core.ts';
// @ts-expect-error Native TypeScript validation requires explicit extensions.
import { getBulkLocalImagePixelCount } from './model-image-limits-core.ts';
// @ts-expect-error Native TypeScript validation requires explicit extensions.
import { createThreeDModelMaterialInventory } from './model-material-inventory-core.ts';

export interface ObjSource { fileName: string; relativePath: string; read: (signal: AbortSignal) => Promise<Uint8Array> }
const placeholder = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='), (c) => c.charCodeAt(0));
export function resolveObjSource<T extends { fileName: string; relativePath: string }>(path: string, sources: readonly T[]): T | undefined {
  const exact = sources.filter((source) => path.toLowerCase() === source.relativePath.toLowerCase() || path.toLowerCase().endsWith(`/${source.relativePath.toLowerCase()}`));
  const matched = exact.length ? exact : sources.filter((source) => source.fileName.toLowerCase() === path.split('/').at(-1)?.toLowerCase());
  if (matched.length > 1) throw new Error(`Ambiguous OBJ dependency: ${path}. Choose distinct attachment destinations.`);
  return matched[0];
}
function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return 'image/bmp';
  throw new Error('An OBJ texture is not a supported PNG, JPEG, WebP or BMP image.');
}

/** One material/rendering contract for local import previews and saved Model Files. */
export async function loadObjBundle(primary: ObjSource, sources: readonly ObjSource[], allowMissingTextures: boolean) {
  if (sources.length > 500) throw new Error('OBJ supports at most 500 selected companions.');
  for (const source of sources) if (resolveObjPath(source.relativePath) !== source.relativePath) throw new Error('Invalid OBJ companion destination.');
  const controller = new AbortController();
  let closed = false;
  let byteCount = 0;
  let pixels = 0;
  let scene: THREE.Group | undefined;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture<HTMLImageElement>>();
  const urls = new Set<string>();
  const missing = new Set<string>();
  const loadedBytes = new Map<ObjSource, Promise<Uint8Array>>();
  const check = () => { if (closed) throw new Error('OBJ loading was cancelled.'); };
  const read = (source: ObjSource) => {
    let promise = loadedBytes.get(source);
    if (!promise) {
      promise = source.read(controller.signal).then((bytes) => {
        check(); byteCount += bytes.length;
        if (!bytes.length || byteCount > MAX_OBJ_BYTES) throw new Error('OBJ bundle is empty or exceeds 32 MiB.');
        return bytes;
      });
      loadedBytes.set(source, promise);
    }
    return promise;
  };
  const releaseUrls = () => { for (const url of urls) URL.revokeObjectURL(url); urls.clear(); };
  const dispose = () => {
    if (closed) return;
    closed = true; controller.abort(); clearTimeout(timer);
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) { texture.dispose(); if (texture.image) texture.image.src = ''; }
    releaseUrls();
  };
  let timer: ReturnType<typeof setTimeout>;
  const load = async () => {
    const obj = inspectObjGeometry(new TextDecoder('utf-8', { fatal: true }).decode(await read(primary)), primary.fileName);
    const creators: ReturnType<MTLLoader['parse']>[] = [];
    const names = new Set<string>();
    let mapCount = 0;
    const pending: Promise<void>[] = [];
    for (const library of obj.requirements) {
      const source = resolveObjSource(library.relativePath, sources);
      if (!source) throw new Error(`Required material library missing: ${library.relativePath}.`);
      const mtl = inspectObjMaterial(new TextDecoder('utf-8', { fatal: true }).decode(await read(source)), library.relativePath);
      mapCount += mtl.maps.length;
      if (mapCount > 500) throw new Error('OBJ material libraries exceed 500 texture maps in total.');
      for (const value of mtl.names) {
        if (names.has(value) || names.size >= 500) throw new Error(`Duplicate or excessive OBJ material definition: ${value}.`);
        names.add(value);
      }
      const manager = new THREE.LoadingManager();
      manager.setURLModifier(() => { throw new Error('Unresolved OBJ resource request.'); });
      const textureLoader = new THREE.TextureLoader(manager);
      textureLoader.load = (url) => {
        check();
        const map = mtl.maps[Number(/^obj-map:(\d+)$/.exec(url)?.[1])];
        if (!map) throw new Error('Unexpected MTL texture request.');
        const texture = new THREE.Texture<HTMLImageElement>();
        textures.add(texture);
        const operation = (async () => {
          const source = resolveObjSource(map.path, sources);
          if (!source && !allowMissingTextures) throw new Error(`Missing OBJ texture: ${map.path}.`);
          if (!source) missing.add(map.path);
          const bytes = source ? await read(source) : placeholder;
          check();
          const type = imageType(bytes);
          const count = getBulkLocalImagePixelCount(bytes, type);
          pixels += count;
          if (pixels > 32 * 1024 * 1024) throw new Error('OBJ textures exceed 32 Mi pixels.');
          const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type })); urls.add(url);
          const image = new Image(); texture.image = image;
          await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`OBJ texture could not decode: ${map.path}.`)); image.src = url; });
          check();
          if (image.naturalWidth * image.naturalHeight !== count) throw new Error(`Invalid OBJ texture dimensions: ${map.path}.`);
          texture.needsUpdate = true;
          if (map.clamp) texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        })();
        pending.push(operation); void operation.catch(() => undefined);
        return texture;
      };
      manager.addHandler(/^obj-map:/, textureLoader);
      const creator = new MTLLoader(manager).parse(mtl.text, '');
      creators.push(creator);
      try { creator.preload(); } finally { Object.values(creator.materials).forEach((material) => materials.add(material)); }
    }
    if (obj.requirements.length) for (const used of obj.usedMaterials) if (!names.has(used)) throw new Error(`OBJ uses an undefined material: ${used}.`);
    const loader = new OBJLoader();
    if (creators.length) {
      const combined = new MTLLoader().parse('', '');
      for (const creator of creators) Object.assign(combined.materials, creator.materials);
      loader.setMaterials(combined);
    }
    scene = loader.parse(obj.text);
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (material) materials.add(material);
    });
    await Promise.all(pending); check();
    const buffers = new Set<ArrayBufferLike>();
    for (const geometry of geometries) {
      for (const attribute of [...Object.values(geometry.attributes), ...(geometry.index ? [geometry.index] : [])]) {
        const values = attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array;
        buffers.add(values.buffer);
        for (const value of values) if (!Number.isFinite(value)) throw new Error('OBJ geometry contains non-finite values.');
      }
    }
    if ([...buffers].reduce((total, buffer) => total + buffer.byteLength, 0) > MAX_OBJ_BYTES) throw new Error('Decoded OBJ geometry exceeds 32 MiB.');
    const bounds = new THREE.Box3().setFromObject(scene);
    if (bounds.isEmpty() || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) throw new Error('OBJ has no finite geometry.');
    const inventory = createThreeDModelMaterialInventory(scene);
    releaseUrls();
    return { scene, missingTexturePaths: [...missing], materialTargets: { targetKeys: inventory.slots.map((slot) => slot.id), materialSlotCount: inventory.materialSlotCount, omittedSlotCount: inventory.omittedSlotCount }, dispose };
  };
  try {
    const result = await Promise.race([load(), new Promise<never>((_, reject) => { timer = setTimeout(() => { dispose(); reject(new Error('OBJ loading exceeded 30 seconds.')); }, 30_000); })]);
    clearTimeout(timer!); return result;
  } catch (error) { dispose(); throw error; }
}

async function fetchObjBytes(url: string, signal: AbortSignal) {
  if (!/^https:\/\//i.test(url)) throw new Error('Stored OBJ files require HTTPS attachment URLs.');
  const response = await fetch(url, { signal });
  if (!response.ok || Number(response.headers.get('content-length')) > MAX_OBJ_BYTES || !response.body) throw new Error('Stored OBJ resource could not be read.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  try { while (true) { const next = await reader.read(); if (next.done) break; length += next.value.length; if (length > MAX_OBJ_BYTES) throw new Error('Stored OBJ resource exceeds 32 MiB.'); chunks.push(next.value); } }
  finally { await reader.cancel(); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; } return bytes;
}
export async function loadStoredObjModel(url: string, files: readonly { fileName: string; relativePath: string; filePath: string; fileType: string }[], geometryOnly = false) {
  const source = (fileName: string, relativePath: string, filePath: string): ObjSource => ({ fileName, relativePath, read: (signal) => fetchObjBytes(filePath, signal) });
  const primary = source('model.obj', 'model.obj', url);
  if (geometryOnly) {
    primary.read = async (signal) => {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await fetchObjBytes(url, signal));
      // The staged single-Model form has no saved attachments yet. Keep its geometry
      // preview explicit; bulk preflight and saved Models always require declared MTL.
      const geometry = inspectObjGeometry(text, primary.fileName);
      return new TextEncoder().encode(geometry.text.split('\n').filter((line) => !/^mtllib\s/i.test(line)).join('\n'));
    };
  }
  const lease = await loadObjBundle(primary, files.filter((file) => file.fileType !== 'model' && /\.(?:mtl|png|jpe?g|webp|bmp)$/i.test(file.fileName)).map((file) => source(file.fileName, file.relativePath, file.filePath)), true);
  // ModelMarker3D retains this scene in its existing reusable Model cache.
  return lease.scene;
}
