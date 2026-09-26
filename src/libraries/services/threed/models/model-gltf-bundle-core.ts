import type { ThreeDModelCompanionRequirement } from './model-companion-core';

export const MAX_GLTF_BUNDLE_BYTES = 32 * 1024 * 1024;
export const MAX_GLTF_BUNDLE_RESOURCES = 500;
const MAX_PRIMARY_BYTES = 4 * 1024 * 1024;
const MAX_RECORDS = 4_096;
const MAX_DEPTH = 128;
const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const SUPPORTED_EXTENSIONS = new Set([
  'KHR_draco_mesh_compression', 'KHR_mesh_quantization', 'KHR_texture_transform',
  'KHR_materials_unlit', 'KHR_materials_clearcoat', 'KHR_materials_ior', 'KHR_materials_sheen',
  'KHR_materials_specular', 'KHR_materials_transmission', 'KHR_materials_iridescence',
  'KHR_materials_anisotropy', 'KHR_materials_volume', 'KHR_materials_emissive_strength',
  'KHR_materials_dispersion', 'KHR_lights_punctual', 'EXT_texture_webp', 'EXT_materials_bump',
]);
const UNSUPPORTED_EXTENSIONS = new Set([
  'KHR_texture_basisu', 'EXT_meshopt_compression', 'KHR_meshopt_compression',
  'EXT_texture_avif', 'EXT_mesh_gpu_instancing',
]);
const COMPONENT_BYTES: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const TYPE_COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
type JsonObject = Record<string, unknown>;

export interface GltfBundleBuffer {
  index: number;
  byteLength: number;
  uri?: string;
  relativePath?: string;
  embedded?: Uint8Array;
}
export interface GltfBundleImage {
  index: number;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  uri?: string;
  relativePath?: string;
  bufferView?: number;
  embedded?: Uint8Array;
}
export interface GltfBundleInspection {
  modelType: 'glb' | 'gltf';
  document: JsonObject;
  requirements: ThreeDModelCompanionRequirement[];
  buffers: GltfBundleBuffer[];
  images: GltfBundleImage[];
  embeddedResourceCount: number;
  /** Embedded buffers/data images; bufferView images do not count their bytes twice. */
  embeddedByteLength: number;
  /** Declared buffer bytes plus embedded data images; external image bytes are checked later. */
  decodedByteLength: number;
}
export interface GltfBundleResource { relativePath: string; bytes: Uint8Array }

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function object(value: unknown, label: string): JsonObject {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
  return value as JsonObject;
}
function integer(value: unknown, label: string, minimum = 0, maximum = MAX_GLTF_BUNDLE_BYTES): number {
  check(typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum,
    `${label} must be an integer from ${minimum} to ${maximum}.`);
  return value;
}
function records(document: JsonObject, key: string): JsonObject[] {
  if (document[key] === undefined) return [];
  const entries = document[key];
  check(Array.isArray(entries) && entries.length <= MAX_RECORDS, `${key} exceeds the supported record limit or is not an array.`);
  return entries.map((entry, index) => object(entry, `${key}[${index}]`));
}
function index(value: unknown, length: number, label: string): number {
  return integer(value, label, 0, length - 1);
}
function imageMime(value: unknown, label: string): GltfBundleImage['mimeType'] {
  check(typeof value === 'string' && IMAGE_MIMES.has(value), `${label} must use PNG, JPEG, or WebP images.`);
  return value as GltfBundleImage['mimeType'];
}

/** Only one URI decoding pass is supported; no exporter path or remote URL is guessed. */
export function normalizeThreeDGltfBundlePath(value: string): string {
  check(value.length > 0 && value.length <= 1_024 && value === value.trim(), 'Dependency path is empty, too long, or has surrounding whitespace.');
  check(!/[\\?#\u0000-\u001f\u007f]/.test(value) && !value.startsWith('/') && !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value),
    'GLTF dependencies must use local relative paths without URLs, queries, fragments, or backslashes.');
  let decoded: string;
  try { decoded = decodeURIComponent(value) } catch { throw new Error('Dependency path contains invalid URI encoding.') }
  check(!/[\\?#%\u0000-\u001f\u007f]/.test(decoded) && !decoded.startsWith('/') && !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(decoded),
    'Dependency path contains unsafe or repeated URI encoding.');
  const parts = decoded.split('/');
  check(!parts.some((part) => !part || part === '..'), 'Dependency paths cannot contain parent traversal or empty segments.');
  const normalized = parts.filter((part) => part !== '.').join('/');
  check(Boolean(normalized), 'Dependency path is empty.');
  return normalized;
}

function dataUri(uri: string, kind: 'buffer' | 'image') {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(uri);
  check(match && match[2].length > 0 && match[2].length % 4 === 0, 'Embedded resources must use non-empty canonical base64 data URIs.');
  const mimeType = match[1].toLowerCase();
  check(kind === 'image' ? IMAGE_MIMES.has(mimeType) : ['application/octet-stream', 'application/gltf-buffer'].includes(mimeType),
    `Unsupported embedded ${kind} MIME type.`);
  const length = match[2].length / 4 * 3 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
  check(length <= MAX_GLTF_BUNDLE_BYTES, 'Embedded resource exceeds the 32 MiB bundle limit.');
  let binary: string;
  try { binary = atob(match[2]) } catch { throw new Error('Embedded resource has invalid base64 data.') }
  check(btoa(binary) === match[2], 'Embedded resource has non-canonical base64 data.');
  return { mimeType, bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)) };
}

function parseContainer(fileName: string, bytes: Uint8Array): { modelType: 'glb' | 'gltf'; document: JsonObject; bin?: Uint8Array } {
  check(bytes.byteLength > 0 && bytes.byteLength <= MAX_PRIMARY_BYTES, 'Bulk GLB/GLTF primaries must contain 1 byte through 4 MiB.');
  const modelType = fileName.split('.').at(-1)?.toLowerCase();
  check(modelType === 'glb' || modelType === 'gltf', 'Choose a GLB or GLTF primary.');
  let json = bytes;
  let bin: Uint8Array | undefined;
  if (modelType === 'glb') {
    check(bytes.byteLength >= 20, 'GLB header is incomplete.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    check(view.getUint32(0, true) === 0x46546c67 && view.getUint32(4, true) === 2, 'Only GLB version 2 is supported.');
    check(view.getUint32(8, true) === bytes.byteLength && bytes.byteLength % 4 === 0, 'GLB declared length does not match its complete aligned contents.');
    let offset = 12;
    let chunkIndex = 0;
    while (offset < bytes.byteLength) {
      check(offset + 8 <= bytes.byteLength, 'GLB chunk header is incomplete.');
      const length = view.getUint32(offset, true);
      const type = view.getUint32(offset + 4, true);
      const start = offset + 8;
      check(length % 4 === 0 && start + length <= bytes.byteLength, 'GLB chunk range is invalid or unaligned.');
      if (chunkIndex === 0) {
        check(type === 0x4e4f534a && length > 0, 'GLB must begin with one non-empty JSON chunk.');
        json = bytes.subarray(start, start + length);
      } else {
        check(chunkIndex === 1 && type === 0x004e4942, 'Only a JSON chunk followed by an optional BIN chunk is supported.');
        bin = bytes.subarray(start, start + length);
      }
      offset = start + length;
      chunkIndex += 1;
    }
    check(chunkIndex > 0, 'GLB has no JSON chunk.');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json)) }
  catch { throw new Error('Primary does not contain valid UTF-8 glTF JSON.') }
  return { modelType, document: object(parsed, 'glTF document'), bin };
}

function validateJsonAndExtensions(document: JsonObject) {
  const asset = object(document.asset, 'asset');
  check(asset.version === '2.0' && (asset.minVersion === undefined || asset.minVersion === '2.0'), 'Only glTF asset version 2.0 is supported.');
  function extensions(key: string): string[] {
    if (document[key] === undefined) return [];
    const values = document[key];
    check(Array.isArray(values) && values.length <= 100 && values.every((entry) => typeof entry === 'string'), `${key} must be a bounded array of extension names.`);
    check(new Set(values).size === values.length, `${key} contains duplicate extension names.`);
    return values as string[];
  }
  const used = extensions('extensionsUsed');
  for (const required of extensions('extensionsRequired')) {
    check(used.includes(required) && SUPPORTED_EXTENSIONS.has(required), `Required extension ${required.slice(0, 100)} is not supported by the bulk importer.`);
  }
  for (const name of used) check(!UNSUPPORTED_EXTENSIONS.has(name), `Extension ${name} is not supported by the bulk importer.`);
  const allowedUriObjects = new Set<unknown>([...records(document, 'buffers'), ...records(document, 'images')]);
  const pending = [{ value: document as unknown, depth: 0, metadata: false }];
  let visited = 0;
  while (pending.length) {
    const { value, depth, metadata } = pending.pop()!;
    check(++visited <= 250_000 && depth <= MAX_DEPTH, 'GLTF JSON exceeds the supported complexity or nesting limit.');
    if (typeof value === 'number') check(Number.isFinite(value), 'GLTF JSON contains a non-finite number.');
    if (!value || typeof value !== 'object') continue;
    if (Array.isArray(value)) {
      check(value.length <= MAX_RECORDS, 'GLTF array exceeds the supported record limit.');
      for (const child of value) pending.push({ value: child, depth: depth + 1, metadata });
    } else {
      const record = value as JsonObject;
      if (!metadata && 'uri' in record) check(allowedUriObjects.has(record), 'A resource URI outside buffers/images is not supported.');
      if (!metadata && 'extensions' in record) {
        for (const name of Object.keys(object(record.extensions, 'extensions'))) {
          check(!UNSUPPORTED_EXTENSIONS.has(name), `Extension ${name} is not supported by the bulk importer.`);
          check(used.includes(name), `Extension ${name.slice(0, 100)} must be declared in extensionsUsed.`);
        }
      }
      for (const [key, child] of Object.entries(record)) pending.push({ value: child, depth: depth + 1, metadata: metadata || key === 'extras' });
    }
  }
}

function validateSceneGraph(document: JsonObject) {
  const nodes = records(document, 'nodes');
  const scenes = records(document, 'scenes');
  const meshes = records(document, 'meshes');
  const skins = records(document, 'skins');
  const cameras = records(document, 'cameras');
  check(scenes.length > 0, 'GLTF must contain a scene.');
  if (document.scene !== undefined) index(document.scene, scenes.length, 'Default scene');
  const parents = new Array<number>(nodes.length).fill(0);
  const children = nodes.map((node, nodeIndex) => {
    for (const [key, count] of [['mesh', meshes.length], ['skin', skins.length], ['camera', cameras.length]] as const) {
      if (node[key] !== undefined) index(node[key], count, `Node ${nodeIndex} ${key}`);
    }
    for (const [key, size] of [['matrix', 16], ['translation', 3], ['rotation', 4], ['scale', 3]] as const) {
      const value = node[key];
      if (value !== undefined) check(Array.isArray(value) && value.length === size && value.every((item) => typeof item === 'number' && Number.isFinite(item)), `Node ${nodeIndex} ${key} is invalid.`);
    }
    check(node.matrix === undefined || (node.translation === undefined && node.rotation === undefined && node.scale === undefined), 'Node matrix and TRS transforms cannot be combined.');
    const entries = node.children ?? [];
    check(Array.isArray(entries), `Node ${nodeIndex} children must be an array.`);
    const links = entries.map((child) => index(child, nodes.length, `Node ${nodeIndex} child`));
    check(new Set(links).size === links.length, 'Node children contain duplicate references.');
    for (const child of links) check(++parents[child] <= 1, 'A GLTF node cannot have multiple parents.');
    return links;
  });
  const roots = parents.flatMap((count, nodeIndex) => count === 0 ? [nodeIndex] : []);
  const queue = roots.map((nodeIndex) => ({ nodeIndex, depth: 1 }));
  const order: number[] = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const { nodeIndex, depth } = queue[cursor];
    check(depth <= MAX_DEPTH, 'GLTF node hierarchy exceeds the supported depth.');
    order.push(nodeIndex);
    for (const child of children[nodeIndex]) queue.push({ nodeIndex: child, depth: depth + 1 });
  }
  check(order.length === nodes.length, 'GLTF node hierarchy contains a cycle.');
  const subtreeSizes = new Array<number>(nodes.length).fill(1);
  const subtreePrimitives = nodes.map((node) => {
    const primitives = node.mesh === undefined ? undefined : meshes[Number(node.mesh)].primitives;
    return Array.isArray(primitives) ? primitives.length : 0;
  });
  for (const nodeIndex of order.toReversed()) {
    for (const child of children[nodeIndex]) {
      subtreeSizes[nodeIndex] += subtreeSizes[child];
      subtreePrimitives[nodeIndex] += subtreePrimitives[child];
    }
  }
  let instances = 0;
  let primitiveInstances = 0;
  for (const scene of scenes) {
    const entries = scene.nodes ?? [];
    check(Array.isArray(entries), 'Scene nodes must be an array.');
    check(new Set(entries).size === entries.length, 'Scene roots contain duplicate references.');
    for (const entry of entries) {
      const nodeIndex = index(entry, nodes.length, 'Scene root');
      check(parents[nodeIndex] === 0, 'A scene root cannot also be a child node.');
      instances += subtreeSizes[nodeIndex];
      primitiveInstances += subtreePrimitives[nodeIndex];
    }
  }
  check(instances <= MAX_RECORDS, 'Combined scene instances exceed the supported limit.');
  check(primitiveInstances <= MAX_RECORDS, 'Combined scene primitive instances exceed the supported limit.');
  for (const skin of skins) {
    check(Array.isArray(skin.joints) && skin.joints.length > 0 && skin.joints.length <= MAX_RECORDS, 'Skin joints must be a bounded non-empty array.');
    for (const joint of skin.joints) index(joint, nodes.length, 'Skin joint');
    check(new Set(skin.joints).size === skin.joints.length, 'Skin joints contain duplicate references.');
    if (skin.skeleton !== undefined) index(skin.skeleton, nodes.length, 'Skin skeleton');
  }
}

function validateViewsAndAccessors(document: JsonObject, buffers: GltfBundleBuffer[]) {
  const views = records(document, 'bufferViews');
  const accessors = records(document, 'accessors');
  for (const [viewIndex, view] of views.entries()) {
    const buffer = buffers[index(view.buffer, buffers.length, `BufferView ${viewIndex} buffer`)];
    const offset = integer(view.byteOffset ?? 0, 'BufferView byteOffset');
    const length = integer(view.byteLength, 'BufferView byteLength', 1);
    check(offset + length <= buffer.byteLength, `BufferView ${viewIndex} exceeds its declared buffer.`);
    if (view.byteStride !== undefined) {
      const stride = integer(view.byteStride, 'BufferView byteStride', 4, 252);
      check(stride % 4 === 0, 'BufferView byteStride must be a multiple of four.');
    }
  }
  let allocated = 0;
  for (const [accessorIndex, accessor] of accessors.entries()) {
    const componentType = integer(accessor.componentType, 'Accessor componentType', 5120, 5126);
    const componentBytes = COMPONENT_BYTES[componentType];
    const components = typeof accessor.type === 'string' ? TYPE_COMPONENTS[accessor.type] : undefined;
    check(componentBytes && components, `Accessor ${accessorIndex} has an unsupported component or value type.`);
    check(!String(accessor.type).startsWith('MAT') || componentType === 5126, 'Only floating-point matrix accessors are supported.');
    const count = integer(accessor.count, 'Accessor count', 1);
    const offset = integer(accessor.byteOffset ?? 0, 'Accessor byteOffset');
    const itemBytes = componentBytes * components;
    allocated += count * itemBytes;
    check(allocated <= MAX_GLTF_BUNDLE_BYTES, 'Decoded accessor allocation exceeds the 32 MiB limit.');
    check(offset % componentBytes === 0, 'Accessor byteOffset is not component-aligned.');
    if (accessor.normalized !== undefined) check(typeof accessor.normalized === 'boolean'
      && (!accessor.normalized || componentType < 5125), 'Accessor normalization is invalid.');
    for (const key of ['min', 'max']) {
      if (accessor[key] !== undefined) check(Array.isArray(accessor[key]) && (accessor[key] as unknown[]).length === components
        && (accessor[key] as unknown[]).every((item) => typeof item === 'number' && Number.isFinite(item)), `Accessor ${key} is invalid.`);
    }
    if (accessor.bufferView !== undefined) {
      const view = views[index(accessor.bufferView, views.length, 'Accessor bufferView')];
      const stride = Number(view.byteStride ?? itemBytes);
      check(stride >= itemBytes && stride % componentBytes === 0, 'Accessor does not fit its interleaved stride.');
      check((Number(view.byteOffset ?? 0) + offset) % componentBytes === 0, 'Accessor buffer address is not aligned.');
      check(offset + (count - 1) * stride + itemBytes <= Number(view.byteLength), `Accessor ${accessorIndex} exceeds its bufferView.`);
      if (stride !== itemBytes) check(Math.floor(offset / stride) * stride + count * stride <= Number(view.byteLength), 'Interleaved accessor has insufficient trailing stride bytes for the runtime loader.');
    } else check(offset === 0, 'An accessor without a bufferView must have zero byteOffset.');
    if (accessor.sparse !== undefined) {
      const sparse = object(accessor.sparse, 'Sparse accessor');
      const sparseCount = integer(sparse.count, 'Sparse count', 1, count);
      const indices = object(sparse.indices, 'Sparse indices');
      const values = object(sparse.values, 'Sparse values');
      check([5121, 5123, 5125].includes(Number(indices.componentType)), 'Sparse indices must use unsigned integer components.');
      for (const [entry, size] of [[indices, COMPONENT_BYTES[Number(indices.componentType)]], [values, itemBytes]] as const) {
        const view = views[index(entry.bufferView, views.length, 'Sparse bufferView')];
        const entryOffset = integer(entry.byteOffset ?? 0, 'Sparse byteOffset');
        const alignment = entry === indices ? size : componentBytes;
        check(view.byteStride === undefined && entryOffset % alignment === 0, 'Sparse data must be tightly packed and aligned.');
        check(entryOffset + sparseCount * size <= Number(view.byteLength), 'Sparse accessor exceeds its bufferView.');
      }
    }
  }
  return { views, accessors };
}

function validateGeometryReferences(document: JsonObject, views: JsonObject[], accessors: JsonObject[]) {
  const materials = records(document, 'materials');
  let primitives = 0;
  for (const mesh of records(document, 'meshes')) {
    check(Array.isArray(mesh.primitives) && mesh.primitives.length > 0, 'Mesh primitives must be a non-empty array.');
    for (const value of mesh.primitives) {
      check(++primitives <= MAX_RECORDS, 'GLTF primitive count exceeds the supported limit.');
      const primitive = object(value, 'Mesh primitive');
      const attributes = object(primitive.attributes, 'Primitive attributes');
      const position = accessors[index(attributes.POSITION, accessors.length, 'POSITION accessor')];
      check(position.type === 'VEC3', 'POSITION must use a VEC3 accessor.');
      for (const attribute of Object.values(attributes)) {
        const accessor = accessors[index(attribute, accessors.length, 'Vertex attribute')];
        check(accessor.count === position.count, 'Vertex attribute counts must match POSITION.');
      }
      if (primitive.indices !== undefined) {
        const indices = accessors[index(primitive.indices, accessors.length, 'Primitive index accessor')];
        check(indices.type === 'SCALAR' && [5121, 5123, 5125].includes(Number(indices.componentType)) && !indices.normalized,
          'Primitive indices must use unsigned scalar accessors.');
      }
      if (primitive.material !== undefined) index(primitive.material, materials.length, 'Primitive material');
      if (primitive.mode !== undefined) integer(primitive.mode, 'Primitive mode', 0, 6);
      if (primitive.targets !== undefined) {
        check(Array.isArray(primitive.targets), 'Morph targets must be an array.');
        for (const target of primitive.targets) {
          for (const attribute of Object.values(object(target, 'Morph target'))) {
            check(accessors[index(attribute, accessors.length, 'Morph accessor')].count === position.count, 'Morph attribute counts must match POSITION.');
          }
        }
      }
      const draco = (primitive.extensions as JsonObject | undefined)?.KHR_draco_mesh_compression;
      if (draco !== undefined) {
        const compressed = object(draco, 'DRACO extension');
        index(compressed.bufferView, views.length, 'DRACO bufferView');
        const ids = object(compressed.attributes, 'DRACO attributes');
        for (const id of Object.values(ids)) integer(id, 'DRACO attribute ID');
        check('POSITION' in ids, 'DRACO data must identify POSITION.');
      }
    }
  }
  for (const skin of records(document, 'skins')) {
    if (skin.inverseBindMatrices === undefined) continue;
    const accessor = accessors[index(skin.inverseBindMatrices, accessors.length, 'Inverse bind accessor')];
    check(accessor.type === 'MAT4' && accessor.componentType === 5126 && Number(accessor.count) >= (skin.joints as unknown[]).length,
      'Skin inverse bind matrices must cover all joints with MAT4 floats.');
  }
  for (const animation of records(document, 'animations')) {
    check(Array.isArray(animation.samplers) && Array.isArray(animation.channels), 'Animation samplers and channels must be arrays.');
    for (const value of animation.samplers) {
      const sampler = object(value, 'Animation sampler');
      const input = accessors[index(sampler.input, accessors.length, 'Animation input')];
      check(input.type === 'SCALAR' && input.componentType === 5126, 'Animation input must use scalar floats.');
      index(sampler.output, accessors.length, 'Animation output');
      check(sampler.interpolation === undefined || ['LINEAR', 'STEP', 'CUBICSPLINE'].includes(String(sampler.interpolation)), 'Unsupported animation interpolation.');
    }
    for (const value of animation.channels) {
      const channel = object(value, 'Animation channel');
      index(channel.sampler, animation.samplers.length, 'Animation sampler');
      const target = object(channel.target, 'Animation target');
      index(target.node, records(document, 'nodes').length, 'Animation target node');
      check(['translation', 'rotation', 'scale', 'weights'].includes(String(target.path)), 'Unsupported animation target.');
    }
  }
}

function validateTextureReferences(document: JsonObject, images: GltfBundleImage[]) {
  const textures = records(document, 'textures');
  const samplers = records(document, 'samplers');
  for (const texture of textures) {
    const webp = (texture.extensions as JsonObject | undefined)?.EXT_texture_webp;
    check(texture.source !== undefined || webp !== undefined, 'Texture has no supported image source.');
    if (texture.source !== undefined) index(texture.source, images.length, 'Texture image');
    if (texture.sampler !== undefined) index(texture.sampler, samplers.length, 'Texture sampler');
    if (webp !== undefined) {
      const image = images[index(object(webp, 'WebP extension').source, images.length, 'WebP image')];
      check(image.mimeType === 'image/webp', 'EXT_texture_webp must reference a WebP image.');
    }
  }
  const pending: unknown[] = records(document, 'materials');
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object') continue;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'extras') continue;
      if (key.endsWith('Texture') && child !== undefined) {
        const textureInfo = object(child, 'Material texture');
        index(textureInfo.index, textures.length, 'Material texture index');
        if (textureInfo.texCoord !== undefined) integer(textureInfo.texCoord, 'Texture coordinate set', 0, 7);
      } else if (child && typeof child === 'object') pending.push(child);
    }
  }
}

function imageSignature(bytes: Uint8Array, mimeType: GltfBundleImage['mimeType']): boolean {
  if (mimeType === 'image/png') return bytes.byteLength >= 33
    && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, offset) => bytes[offset] === byte)
    && String.fromCharCode(...bytes.subarray(12, 16)) === 'IHDR';
  if (mimeType === 'image/jpeg') return bytes.byteLength >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.byteLength >= 20 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP';
}

/** Bounded preparation inspection; this does not claim full glTF conformance or image decoding. */
export function inspectThreeDGltfBundle(fileName: string, bytes: Uint8Array): GltfBundleInspection {
  const { modelType, document, bin } = parseContainer(fileName, bytes);
  validateJsonAndExtensions(document);
  const rawBuffers = records(document, 'buffers');
  const rawImages = records(document, 'images');
  check(rawBuffers.length + rawImages.length <= MAX_GLTF_BUNDLE_RESOURCES, 'GLTF exceeds the 500-resource limit.');
  const requirements: ThreeDModelCompanionRequirement[] = [];
  const external = (uri: string, kind: 'buffer' | 'texture') => {
    const relativePath = normalizeThreeDGltfBundlePath(uri);
    const name = relativePath.split('/').at(-1)!;
    check(kind === 'buffer' ? /\.bin$/i.test(name) : /\.(?:png|jpe?g|webp)$/i.test(name),
      kind === 'buffer' ? 'External GLTF buffers must use .bin files.' : 'External GLTF images must be PNG, JPEG, or WebP.');
    requirements.push({ fileName: name, relativePath, kind, referencedBy: fileName });
    return relativePath;
  };
  let embeddedByteLength = 0;
  let decodedByteLength = 0;
  let embeddedResourceCount = 0;
  let usedBin = false;
  const buffers: GltfBundleBuffer[] = rawBuffers.map((buffer, bufferIndex) => {
    const byteLength = integer(buffer.byteLength, `Buffer ${bufferIndex} byteLength`, 1);
    decodedByteLength += byteLength;
    const result: GltfBundleBuffer = { index: bufferIndex, byteLength };
    if (buffer.uri === undefined) {
      check(modelType === 'glb' && bufferIndex === 0 && bin, `Buffer ${bufferIndex} requires a local URI.`);
      check(bin.byteLength >= byteLength && bin.byteLength - byteLength <= 3, 'GLB BIN length does not match its declared buffer plus alignment padding.');
      check(bin.subarray(byteLength).every((byte) => byte === 0), 'GLB BIN padding must be zero.');
      result.embedded = bin.subarray(0, byteLength);
      usedBin = true;
    } else {
      check(typeof buffer.uri === 'string', 'Buffer URI must be a string.');
      result.uri = buffer.uri;
      if (/^data:/i.test(buffer.uri)) result.embedded = dataUri(buffer.uri, 'buffer').bytes;
      else result.relativePath = external(buffer.uri, 'buffer');
    }
    if (result.embedded) {
      check(result.embedded.byteLength >= byteLength, `Embedded buffer ${bufferIndex} is shorter than declared.`);
      embeddedByteLength += result.embedded.byteLength;
      decodedByteLength += result.embedded.byteLength - byteLength;
      embeddedResourceCount += 1;
    }
    return result;
  });
  check(!bin || usedBin, 'GLB contains an unreferenced BIN chunk.');
  validateSceneGraph(document);
  const { views, accessors } = validateViewsAndAccessors(document, buffers);
  validateGeometryReferences(document, views, accessors);
  const images: GltfBundleImage[] = rawImages.map((image, imageIndex) => {
    check((image.uri === undefined) !== (image.bufferView === undefined), `Image ${imageIndex} must specify exactly one URI or bufferView.`);
    let result: GltfBundleImage;
    if (image.bufferView !== undefined) {
      const viewIndex = index(image.bufferView, views.length, 'Image bufferView');
      const view = views[viewIndex];
      check(view.byteStride === undefined, 'Image bufferViews cannot be interleaved.');
      const source = buffers[Number(view.buffer)].embedded;
      result = { index: imageIndex, mimeType: imageMime(image.mimeType, 'BufferView image'), bufferView: viewIndex };
      if (source) result.embedded = source.subarray(Number(view.byteOffset ?? 0), Number(view.byteOffset ?? 0) + Number(view.byteLength));
      embeddedResourceCount += 1;
    } else {
      check(typeof image.uri === 'string', 'Image URI must be a string.');
      if (/^data:/i.test(image.uri)) {
        const decoded = dataUri(image.uri, 'image');
        result = { index: imageIndex, uri: image.uri, mimeType: imageMime(decoded.mimeType, 'Embedded image'), embedded: decoded.bytes };
        embeddedByteLength += decoded.bytes.byteLength;
        decodedByteLength += decoded.bytes.byteLength;
        embeddedResourceCount += 1;
      } else {
        const relativePath = external(image.uri, 'texture');
        const mimeType = /\.png$/i.test(relativePath) ? 'image/png' : /\.webp$/i.test(relativePath) ? 'image/webp' : 'image/jpeg';
        result = { index: imageIndex, uri: image.uri, relativePath, mimeType };
      }
      if (image.mimeType !== undefined) check(imageMime(image.mimeType, 'Image') === result.mimeType, 'Image MIME type disagrees with its resource format.');
    }
    if (result.embedded) check(imageSignature(result.embedded, result.mimeType), `Embedded image ${imageIndex} has an invalid ${result.mimeType} signature.`);
    return result;
  });
  check(decodedByteLength <= MAX_GLTF_BUNDLE_BYTES && embeddedByteLength <= MAX_GLTF_BUNDLE_BYTES, 'GLTF resources exceed the 32 MiB bundle limit.');
  validateTextureReferences(document, images);
  return {
    modelType, document, buffers, images, embeddedResourceCount, embeddedByteLength, decodedByteLength,
    requirements: [...new Map(requirements.map((requirement) => [`${requirement.kind}:${requirement.relativePath.toLowerCase()}`, requirement])).values()],
  };
}

export function resolveThreeDGltfBundleResource(reference: string, resources: readonly GltfBundleResource[]): { resource?: GltfBundleResource; issue?: string } {
  try {
    const path = normalizeThreeDGltfBundlePath(reference).toLowerCase();
    const filename = path.split('/').at(-1)!;
    const candidates = resources.map((resource) => ({ resource, path: normalizeThreeDGltfBundlePath(resource.relativePath).toLowerCase() }))
      .filter((entry) => entry.path.split('/').at(-1) === filename);
    const paths = new Set(candidates.map((entry) => entry.path));
    if (paths.size !== candidates.length) return { issue: `Duplicate resource destination for ${reference}.` };
    for (const candidate of paths) {
      for (let slash = candidate.indexOf('/'); slash >= 0; slash = candidate.indexOf('/', slash + 1)) {
        if (paths.has(candidate.slice(slash + 1))) return { issue: `Competing resource suffixes for ${reference}.` };
      }
    }
    const exact = candidates.filter((candidate) => candidate.path === path || path.endsWith(`/${candidate.path}`));
    if (exact.length === 1) return { resource: exact[0].resource };
    if (exact.length === 0 && candidates.length === 1) return { resource: candidates[0].resource };
    return { issue: `${candidates.length ? 'Ambiguous' : 'Missing'} resource: ${reference}.` };
  } catch (error) {
    return { issue: error instanceof Error ? error.message : 'Invalid resource path.' };
  }
}

function componentAt(bytes: Uint8Array, byteOffset: number, componentType: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (componentType === 5120) return view.getInt8(byteOffset);
  if (componentType === 5121) return view.getUint8(byteOffset);
  if (componentType === 5122) return view.getInt16(byteOffset, true);
  if (componentType === 5123) return view.getUint16(byteOffset, true);
  if (componentType === 5125) return view.getUint32(byteOffset, true);
  return view.getFloat32(byteOffset, true);
}

/** Complete selected-byte validation before upload; image decoding is a separate loader check. */
export function validateThreeDGltfBundleResources(
  inspection: GltfBundleInspection,
  resources: readonly GltfBundleResource[],
  allowMissingTextures: boolean,
): string[] {
  const issues: string[] = [];
  const add = (message: string) => { if (!issues.includes(message)) issues.push(message) };
  const resolvedBuffers = new Map<number, Uint8Array>();
  const charged = new Set<Uint8Array>();
  let actualBytes = inspection.embeddedByteLength;
  try {
    check(resources.length <= MAX_GLTF_BUNDLE_RESOURCES, 'Selected resources exceed the 500-file limit.');
    const paths = new Set<string>();
    for (const resource of resources) {
      const path = normalizeThreeDGltfBundlePath(resource.relativePath).toLowerCase();
      check(!paths.has(path), `Duplicate resource destination: ${resource.relativePath}.`);
      paths.add(path);
      check(resource.bytes.byteLength > 0 && resource.bytes.byteLength <= MAX_PRIMARY_BYTES, 'Selected resource files must contain 1 byte through 4 MiB.');
      if (!charged.has(resource.bytes)) { actualBytes += resource.bytes.byteLength; charged.add(resource.bytes); }
    }
    check(actualBytes <= MAX_GLTF_BUNDLE_BYTES, 'Selected and embedded resources exceed the 32 MiB bundle limit.');
  } catch (error) { add(error instanceof Error ? error.message : 'Invalid selected resources.') }
  for (const buffer of inspection.buffers) {
    const resolution = buffer.relativePath ? resolveThreeDGltfBundleResource(buffer.relativePath, resources) : null;
    const bytes = buffer.embedded ?? resolution?.resource?.bytes;
    if (!bytes) { add(resolution?.issue ?? `Missing buffer ${buffer.index}.`); continue }
    if (bytes.byteLength < buffer.byteLength) { add(`Buffer ${buffer.index} is shorter than its declared byteLength.`); continue }
    resolvedBuffers.set(buffer.index, bytes);
  }
  const views = records(inspection.document, 'bufferViews');
  for (const image of inspection.images) {
    let bytes = image.embedded;
    if (image.bufferView !== undefined) {
      const view = views[image.bufferView];
      const source = resolvedBuffers.get(Number(view.buffer));
      if (source) bytes = source.subarray(Number(view.byteOffset ?? 0), Number(view.byteOffset ?? 0) + Number(view.byteLength));
      else { add(`Image ${image.index} requires its binary buffer.`); continue }
    } else if (image.relativePath) {
      const resolution = resolveThreeDGltfBundleResource(image.relativePath, resources);
      bytes = resolution.resource?.bytes;
      if (!bytes) {
        // Deferral only waives absence, never a conflicting selected destination.
        if (!allowMissingTextures || !resolution.issue?.startsWith('Missing resource:')) add(resolution.issue ?? `Missing image ${image.index}.`);
        continue;
      }
    }
    if (!bytes || !imageSignature(bytes, image.mimeType)) add(`Image ${image.index} has an invalid ${image.mimeType} signature.`);
  }
  if (issues.length) return issues;
  try {
    const accessors = records(inspection.document, 'accessors');
    const readAccessor = (accessor: JsonObject, element: number, component = 0) => {
      if (accessor.bufferView === undefined) return 0;
      const view = views[Number(accessor.bufferView)];
      const componentType = Number(accessor.componentType);
      const offset = Number(view.byteOffset ?? 0) + Number(accessor.byteOffset ?? 0)
        + element * Number(view.byteStride ?? COMPONENT_BYTES[componentType] * TYPE_COMPONENTS[String(accessor.type)])
        + component * COMPONENT_BYTES[componentType];
      return componentAt(resolvedBuffers.get(Number(view.buffer))!, offset, componentType);
    };
    for (const [accessorIndex, accessor] of accessors.entries()) {
      if (accessor.componentType === 5126 && accessor.bufferView !== undefined) {
        for (let element = 0; element < Number(accessor.count); element += 1) {
          for (let component = 0; component < TYPE_COMPONENTS[String(accessor.type)]; component += 1) {
            check(Number.isFinite(readAccessor(accessor, element, component)), `Accessor ${accessorIndex} contains a non-finite value.`);
          }
        }
      }
      const sparse = accessor.sparse as JsonObject | undefined;
      if (!sparse) continue;
      const indices = sparse.indices as JsonObject;
      const view = views[Number(indices.bufferView)];
      const bytes = resolvedBuffers.get(Number(view.buffer))!;
      let previous = -1;
      for (let item = 0; item < Number(sparse.count); item += 1) {
        const offset = Number(view.byteOffset ?? 0) + Number(indices.byteOffset ?? 0) + item * COMPONENT_BYTES[Number(indices.componentType)];
        const value = componentAt(bytes, offset, Number(indices.componentType));
        check(value > previous && value < Number(accessor.count), `Sparse accessor ${accessorIndex} indices must increase and stay within its count.`);
        previous = value;
      }
      if (accessor.componentType === 5126) {
        const values = sparse.values as JsonObject;
        const valuesView = views[Number(values.bufferView)];
        const data = resolvedBuffers.get(Number(valuesView.buffer))!;
        const start = Number(valuesView.byteOffset ?? 0) + Number(values.byteOffset ?? 0);
        const components = TYPE_COMPONENTS[String(accessor.type)];
        for (let item = 0; item < Number(sparse.count) * components; item += 1) {
          check(Number.isFinite(componentAt(data, start + item * 4, 5126)), `Sparse accessor ${accessorIndex} contains a non-finite value.`);
        }
      }
    }
    const checkedIndices = new Set<string>();
    for (const mesh of records(inspection.document, 'meshes')) {
      for (const value of mesh.primitives as unknown[]) {
        const primitive = value as JsonObject;
        if ((primitive.extensions as JsonObject | undefined)?.KHR_draco_mesh_compression) continue;
        const position = accessors[Number((primitive.attributes as JsonObject).POSITION)];
        if (primitive.indices === undefined) continue;
        const identity = `${primitive.indices}:${position.count}`;
        if (checkedIndices.has(identity)) continue;
        checkedIndices.add(identity);
        const indices = accessors[Number(primitive.indices)];
        for (let item = 0; item < Number(indices.count); item += 1) check(readAccessor(indices, item) < Number(position.count), 'Primitive index exceeds its POSITION count.');
        if (indices.sparse) {
          const sparse = indices.sparse as JsonObject;
          const values = sparse.values as JsonObject;
          const view = views[Number(values.bufferView)];
          const data = resolvedBuffers.get(Number(view.buffer))!;
          for (let item = 0; item < Number(sparse.count); item += 1) {
            const offset = Number(view.byteOffset ?? 0) + Number(values.byteOffset ?? 0) + item * COMPONENT_BYTES[Number(indices.componentType)];
            check(componentAt(data, offset, Number(indices.componentType)) < Number(position.count), 'Sparse primitive index exceeds its POSITION count.');
          }
        }
      }
    }
  } catch (error) { add(error instanceof Error ? error.message : 'Buffer data could not be validated.') }
  return issues;
}
