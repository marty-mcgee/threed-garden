import {
  MAX_GLTF_BUNDLE_BYTES, MAX_GLTF_BUNDLE_RESOURCES, MAX_GLTF_PRIMARY_BYTES,
  normalizeThreeDGltfBundlePath,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './model-gltf-bundle-core.ts';

type JsonObject = Record<string, unknown>;
export type ThreeDModelEmbeddedImageMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/ktx2' | 'image/avif' | 'application/octet-stream';
export interface ThreeDModelEmbeddedImageUsage {
  materialIndex: number;
  materialName: string;
  textureIndex: number;
  channel: string;
  texturePath: string;
}
export interface ThreeDModelEmbeddedImage {
  index: number;
  name: string;
  /** Generated independently of exporter names; safe for a download filename. */
  fileName: string;
  mimeType: ThreeDModelEmbeddedImageMime;
  byteSize: number | null;
  width?: number;
  height?: number;
  previewSupported: boolean;
  source: {
    kind: 'buffer-view' | 'data-uri' | 'external';
    bufferIndex?: number;
    bufferViewIndex?: number;
    byteOffset?: number;
    relativePath?: string;
  };
  usages: ThreeDModelEmbeddedImageUsage[];
}
export interface ThreeDModelEmbeddedImageCatalog {
  format: 'glb' | 'gltf';
  embeddedBuffers: number;
  embeddedImages: number;
  externalImages: number;
  images: ThreeDModelEmbeddedImage[];
}

const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/ktx2', 'image/avif']);
const MAX_RECORDS = 4_096;
const CHANNEL_NAMES: Record<string, string> = {
  baseColorTexture: 'Base color', metallicRoughnessTexture: 'Metallic / Roughness',
  normalTexture: 'Normal', occlusionTexture: 'Occlusion', emissiveTexture: 'Emissive',
  clearcoatTexture: 'Clearcoat', clearcoatRoughnessTexture: 'Clearcoat roughness', clearcoatNormalTexture: 'Clearcoat normal',
  sheenColorTexture: 'Sheen color', sheenRoughnessTexture: 'Sheen roughness', specularTexture: 'Specular',
  specularColorTexture: 'Specular color', transmissionTexture: 'Transmission', thicknessTexture: 'Thickness',
  iridescenceTexture: 'Iridescence', iridescenceThicknessTexture: 'Iridescence thickness', anisotropyTexture: 'Anisotropy',
  diffuseTexture: 'Diffuse', specularGlossinessTexture: 'Specular / Glossiness', bumpTexture: 'Bump',
};
function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
function object(value: unknown, label: string): JsonObject {
  check(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
  return value as JsonObject;
}
function integer(value: unknown, label: string, minimum = 0, maximum = MAX_GLTF_BUNDLE_BYTES): number {
  check(typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum, `${label} is outside the supported integer range.`);
  return value;
}
function records(document: JsonObject, key: string): JsonObject[] {
  if (document[key] === undefined) return [];
  check(Array.isArray(document[key]) && document[key].length <= MAX_RECORDS, `${key} exceeds the supported record limit or is not an array.`);
  return document[key].map((entry, index) => object(entry, `${key}[${index}]`));
}
function displayName(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200) : fallback;
}
function relativePath(value: string): string | undefined {
  try { return normalizeThreeDGltfBundlePath(value) } catch { return undefined }
}
function dataUri(uri: string, kind: 'buffer' | 'image', remaining: number) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(uri);
  check(match && match[2].length > 0 && match[2].length % 4 === 0, 'Embedded resources must use canonical base64 data URIs.');
  const mimeType = match[1].toLowerCase();
  check(kind === 'image' ? IMAGE_MIMES.has(mimeType) : ['application/octet-stream', 'application/gltf-buffer'].includes(mimeType), `Unsupported embedded ${kind} MIME type.`);
  const length = match[2].length / 4 * 3 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
  check(length <= remaining, 'Embedded resources exceed the 32 MiB limit.');
  let binary: string;
  try { binary = atob(match[2]) } catch { throw new Error('Embedded resource has invalid base64 data.') }
  check(btoa(binary) === match[2], 'Embedded resource has non-canonical base64 data.');
  return { mimeType: mimeType as ThreeDModelEmbeddedImageMime, bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)) };
}

/** Container/resource checks only: inspecting an existing Model never invokes a renderer or bulk-import geometry policy. */
function parseContainer(fileName: string, bytes: Uint8Array): { format: 'glb' | 'gltf'; document: JsonObject; bin?: Uint8Array } {
  check(bytes.byteLength > 0 && bytes.byteLength <= MAX_GLTF_PRIMARY_BYTES, 'Model inspection supports 1 byte through 32 MiB.');
  const format = fileName.split('.').at(-1)?.toLowerCase();
  check(format === 'glb' || format === 'gltf', 'Embedded image inspection supports GLB and GLTF files.');
  let json = bytes;
  let bin: Uint8Array | undefined;
  if (format === 'glb') {
    check(bytes.byteLength >= 20, 'GLB header is incomplete.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    check(view.getUint32(0, true) === 0x46546c67 && view.getUint32(4, true) === 2, 'Only GLB version 2 is supported.');
    check(view.getUint32(8, true) === bytes.byteLength && bytes.byteLength % 4 === 0, 'GLB declared length does not match its aligned contents.');
    let offset = 12;
    let chunk = 0;
    while (offset < bytes.byteLength) {
      check(offset + 8 <= bytes.byteLength, 'GLB chunk header is incomplete.');
      const length = view.getUint32(offset, true);
      const type = view.getUint32(offset + 4, true);
      const start = offset + 8;
      check(length % 4 === 0 && start + length <= bytes.byteLength, 'GLB chunk range is invalid or unaligned.');
      if (chunk === 0) {
        check(type === 0x4e4f534a && length > 0, 'GLB must begin with a non-empty JSON chunk.');
        json = bytes.subarray(start, start + length);
      } else {
        check(chunk === 1 && type === 0x004e4942, 'GLB supports only JSON followed by an optional BIN chunk.');
        bin = bytes.subarray(start, start + length);
      }
      offset = start + length;
      chunk += 1;
    }
  }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json)) }
  catch { throw new Error('Model does not contain valid UTF-8 glTF JSON.') }
  const document = object(parsed, 'glTF document');
  check(object(document.asset, 'asset').version === '2.0', 'Only glTF version 2.0 is supported.');
  const pending = [{ value: parsed, depth: 0 }];
  let visited = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    check(++visited <= 250_000 && depth <= 128, 'glTF JSON exceeds the supported complexity or nesting limit.');
    if (typeof value === 'number') check(Number.isFinite(value), 'glTF JSON contains a non-finite number.');
    if (!value || typeof value !== 'object') continue;
    const children = Object.values(value);
    check(children.length <= MAX_RECORDS, 'glTF collection exceeds the supported record limit.');
    check(visited + pending.length + children.length <= 250_000, 'glTF JSON exceeds the supported complexity limit.');
    for (const child of children) pending.push({ value: child, depth: depth + 1 });
  }
  return { format, document, bin };
}

function encodedImageInfo(bytes: Uint8Array, mimeType: ThreeDModelEmbeddedImageMime): { width?: number; height?: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  if (mimeType === 'image/png') {
    check(bytes.byteLength >= 45 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte), 'Embedded PNG signature/header is invalid.');
    check(view.getUint32(8) === 13 && ascii(12, 4) === 'IHDR', 'Embedded PNG has no valid IHDR.');
    let offset = 8;
    let ended = false;
    let chunks = 0;
    while (offset < bytes.byteLength) {
      check(++chunks <= MAX_RECORDS && offset + 12 <= bytes.byteLength, 'Embedded PNG chunk header is incomplete.');
      const size = view.getUint32(offset);
      check(offset + 12 + size <= bytes.byteLength, 'Embedded PNG chunk range is incomplete.');
      const type = ascii(offset + 4, 4);
      offset += size + 12;
      if (type === 'IEND') { check(size === 0 && offset === bytes.byteLength, 'Embedded PNG end chunk is invalid.'); ended = true; break }
    }
    check(ended, 'Embedded PNG end chunk is missing.');
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (mimeType === 'image/jpeg') {
    check(bytes.byteLength >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes.at(-2) === 255 && bytes.at(-1) === 217, 'Embedded JPEG signature/end marker is invalid.');
    let offset = 2;
    while (offset < bytes.byteLength - 2) {
      check(bytes[offset++] === 255, 'Embedded JPEG marker is invalid.');
      while (bytes[offset] === 255) offset += 1;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      check(offset + 2 <= bytes.byteLength, 'Embedded JPEG segment is incomplete.');
      const length = view.getUint16(offset);
      check(length >= 2 && offset + length <= bytes.byteLength, 'Embedded JPEG segment range is incomplete.');
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
        check(length >= 8, 'Embedded JPEG frame is incomplete.');
        return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
      }
      offset += length;
    }
    throw new Error('Embedded JPEG dimensions are unavailable.');
  }
  if (mimeType === 'image/webp') {
    check(bytes.byteLength >= 20 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP' && view.getUint32(4, true) + 8 === bytes.byteLength, 'Embedded WebP signature/length is invalid.');
    let dimensions: { width?: number; height?: number } = {};
    let offset = 12;
    while (offset < bytes.byteLength) {
      check(offset + 8 <= bytes.byteLength, 'Embedded WebP chunk header is incomplete.');
      const kind = ascii(offset, 4);
      const size = view.getUint32(offset + 4, true);
      const start = offset + 8;
      check(start + size + size % 2 <= bytes.byteLength, 'Embedded WebP chunk range is incomplete.');
      const little24 = (position: number) => bytes[position] | bytes[position + 1] << 8 | bytes[position + 2] << 16;
      if (kind === 'VP8X') { check(size >= 10, 'Embedded WebP extended header is incomplete.'); dimensions = { width: little24(start + 4) + 1, height: little24(start + 7) + 1 } }
      if (kind === 'VP8 ' && dimensions.width === undefined) {
        check(size >= 10 && bytes[start + 3] === 157 && bytes[start + 4] === 1 && bytes[start + 5] === 42, 'Embedded WebP frame header is invalid.');
        dimensions = { width: view.getUint16(start + 6, true) & 16383, height: view.getUint16(start + 8, true) & 16383 };
      }
      if (kind === 'VP8L' && dimensions.width === undefined) {
        check(size >= 5 && bytes[start] === 47, 'Embedded WebP lossless header is invalid.');
        const bits = view.getUint32(start + 1, true);
        dimensions = { width: (bits & 16383) + 1, height: (bits >>> 14 & 16383) + 1 };
      }
      offset = start + size + size % 2;
    }
    check(dimensions.width !== undefined, 'Embedded WebP dimensions are unavailable.');
    return dimensions;
  }
  if (mimeType === 'image/ktx2') {
    check(bytes.byteLength >= 80 && [171, 75, 84, 88, 32, 50, 48, 187, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte), 'Embedded KTX2 header is invalid.');
    return { width: view.getUint32(20, true), height: view.getUint32(24, true) };
  }
  if (mimeType === 'image/avif') {
    check(bytes.byteLength >= 16 && ascii(4, 4) === 'ftyp', 'Embedded AVIF header is invalid.');
    const length = view.getUint32(0);
    check(length >= 16 && length <= bytes.byteLength && (length - 16) % 4 === 0, 'Embedded AVIF type box is invalid.');
    const brands = [ascii(8, 4)];
    for (let offset = 16; offset < length; offset += 4) brands.push(ascii(offset, 4));
    check(brands.some((brand) => brand === 'avif' || brand === 'avis'), 'Embedded AVIF brand is invalid.');
    return {};
  }
  throw new Error('Unsupported embedded image format.');
}

function readEmbeddedImages(fileName: string, bytes: Uint8Array) {
  const { format, document, bin } = parseContainer(fileName, bytes);
  const rawBuffers = records(document, 'buffers');
  const rawImages = records(document, 'images');
  const views = records(document, 'bufferViews');
  check(rawBuffers.length + rawImages.length <= MAX_GLTF_BUNDLE_RESOURCES, 'glTF exceeds the 500-resource limit.');
  let allocated = 0;
  let declared = 0;
  let binUsed = false;
  const buffers = rawBuffers.map((buffer, index) => {
    const byteLength = integer(buffer.byteLength, 'Buffer byteLength', 1);
    declared += byteLength;
    check(declared <= MAX_GLTF_BUNDLE_BYTES, 'Declared buffers exceed the 32 MiB limit.');
    let embedded: Uint8Array | undefined;
    if (buffer.uri === undefined) {
      check(format === 'glb' && index === 0 && bin, 'A buffer without a URI requires the GLB BIN chunk.');
      check(bin.byteLength >= byteLength && bin.byteLength - byteLength <= 3 && bin.subarray(byteLength).every((byte) => byte === 0), 'GLB BIN does not match its declared buffer and zero padding.');
      embedded = bin.subarray(0, byteLength);
      binUsed = true;
    } else {
      check(typeof buffer.uri === 'string', 'Buffer URI must be a string.');
      if (/^data:/i.test(buffer.uri)) embedded = dataUri(buffer.uri, 'buffer', MAX_GLTF_BUNDLE_BYTES - allocated).bytes;
    }
    if (embedded) {
      check(embedded.byteLength === byteLength, 'Embedded buffer does not match its declared length.');
      allocated += embedded.byteLength;
    }
    return { byteLength, embedded, path: typeof buffer.uri === 'string' ? relativePath(buffer.uri) : undefined };
  });
  check(!bin || binUsed, 'GLB contains an unreferenced BIN chunk.');
  for (const view of views) {
    const bufferIndex = integer(view.buffer, 'BufferView buffer', 0, buffers.length - 1);
    const offset = integer(view.byteOffset ?? 0, 'BufferView byteOffset');
    const length = integer(view.byteLength, 'BufferView byteLength', 1);
    check(offset + length <= buffers[bufferIndex].byteLength, 'BufferView exceeds its declared buffer.');
  }
  const imageBytes = new Map<number, Uint8Array>();
  const images: ThreeDModelEmbeddedImage[] = rawImages.map((image, index) => {
    check((image.uri === undefined) !== (image.bufferView === undefined), 'Image must specify exactly one URI or bufferView.');
    let embedded: Uint8Array | undefined;
    let mimeType: ThreeDModelEmbeddedImageMime = 'application/octet-stream';
    let byteSize: number | null = null;
    let source: ThreeDModelEmbeddedImage['source'];
    if (image.bufferView !== undefined) {
      const bufferViewIndex = integer(image.bufferView, 'Image bufferView', 0, views.length - 1);
      const view = views[bufferViewIndex];
      check(view.byteStride === undefined, 'Image bufferViews cannot be interleaved.');
      const bufferIndex = Number(view.buffer);
      const buffer = buffers[bufferIndex];
      const byteOffset = Number(view.byteOffset ?? 0);
      byteSize = Number(view.byteLength);
      check(typeof image.mimeType === 'string' && IMAGE_MIMES.has(image.mimeType), 'BufferView image MIME type is unsupported.');
      mimeType = image.mimeType as ThreeDModelEmbeddedImageMime;
      source = { kind: buffer.embedded ? 'buffer-view' : 'external', bufferIndex, bufferViewIndex, byteOffset, ...(buffer.path ? { relativePath: buffer.path } : {}) };
      if (buffer.embedded) embedded = buffer.embedded.subarray(byteOffset, byteOffset + byteSize);
    } else {
      check(typeof image.uri === 'string', 'Image URI must be a string.');
      if (/^data:/i.test(image.uri)) {
        const decoded = dataUri(image.uri, 'image', MAX_GLTF_BUNDLE_BYTES - allocated);
        embedded = decoded.bytes;
        allocated += embedded.byteLength;
        mimeType = decoded.mimeType;
        source = { kind: 'data-uri' };
        if (image.mimeType !== undefined) check(image.mimeType === mimeType, 'Image MIME type disagrees with its data URI.');
      } else {
        const path = relativePath(image.uri);
        source = { kind: 'external', ...(path ? { relativePath: path } : {}) };
        if (typeof image.mimeType === 'string' && IMAGE_MIMES.has(image.mimeType)) mimeType = image.mimeType as ThreeDModelEmbeddedImageMime;
        else if (path) mimeType = /\.png$/i.test(path) ? 'image/png' : /\.jpe?g$/i.test(path) ? 'image/jpeg' : /\.webp$/i.test(path) ? 'image/webp' : /\.ktx2$/i.test(path) ? 'image/ktx2' : /\.avif$/i.test(path) ? 'image/avif' : mimeType;
      }
    }
    const dimensions = embedded ? encodedImageInfo(embedded, mimeType) : {};
    if (embedded) {
      byteSize = embedded.byteLength;
      imageBytes.set(index, embedded);
      if (dimensions.width !== undefined) check(dimensions.width > 0 && dimensions.height! > 0, 'Embedded image dimensions must be positive.');
    }
    const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/ktx2': 'ktx2', 'image/avif': 'avif', 'application/octet-stream': 'bin' }[mimeType];
    return {
      index, name: displayName(image.name, `Image ${index + 1}`), fileName: `image-${index}.${extension}`, mimeType, byteSize,
      ...dimensions, source, usages: [],
      previewSupported: Boolean(embedded && ['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)
        && dimensions.width && dimensions.height && dimensions.width <= 8_192 && dimensions.height <= 8_192 && dimensions.width * dimensions.height <= 16_777_216),
    };
  });
  const textures = records(document, 'textures');
  const textureSources = textures.map((texture) => {
    const sources = new Set<number>();
    if (texture.source !== undefined) sources.add(integer(texture.source, 'Texture source', 0, images.length - 1));
    if (texture.extensions !== undefined) {
      const extensions = object(texture.extensions, 'Texture extensions');
      for (const key of ['EXT_texture_webp', 'KHR_texture_basisu', 'EXT_texture_avif']) {
        if (extensions[key] !== undefined) sources.add(integer(object(extensions[key], key).source, 'Extension texture source', 0, images.length - 1));
      }
    }
    return sources;
  });
  let usageCount = 0;
  for (const [materialIndex, material] of records(document, 'materials').entries()) {
    const materialName = displayName(material.name, `Material ${materialIndex + 1}`);
    const pending = [{ value: material, path: `materials[${materialIndex}]` }];
    while (pending.length) {
      const { value, path } = pending.pop()!;
      for (const [key, child] of Object.entries(value)) {
        if (key === 'extras' || !child || typeof child !== 'object' || Array.isArray(child)) continue;
        const entry = child as JsonObject;
        if (key.endsWith('Texture')) {
          const textureIndex = integer(entry.index, 'Material texture index', 0, textures.length - 1);
          for (const imageIndex of textureSources[textureIndex]) {
            check(++usageCount <= 10_000, 'Material image usages exceed the supported inspection limit.');
            images[imageIndex].usages.push({
              materialIndex, materialName, textureIndex,
              channel: CHANNEL_NAMES[key] ?? key.replace(/Texture$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').slice(0, 200),
              texturePath: `${path}.${key}`.slice(0, 512),
            });
          }
        } else pending.push({ value: entry, path: `${path}.${key}` });
      }
    }
  }
  const catalog: ThreeDModelEmbeddedImageCatalog = {
    format, embeddedBuffers: buffers.filter((buffer) => buffer.embedded).length,
    embeddedImages: imageBytes.size, externalImages: images.length - imageBytes.size, images,
  };
  return { catalog, imageBytes };
}

/** Metadata only: never includes source data URIs, external URLs, image bytes or private exporter extras. */
export function inspectThreeDModelEmbeddedImages(fileName: string, bytes: Uint8Array): ThreeDModelEmbeddedImageCatalog {
  return readEmbeddedImages(fileName, bytes).catalog;
}

/** Prepare once for a gallery; no source data is added to the serializable catalog. */
export function prepareThreeDModelEmbeddedImages(fileName: string, bytes: Uint8Array) {
  const { catalog, imageBytes } = readEmbeddedImages(fileName, bytes);
  return {
    catalog,
    extract(imageIndex: number) {
      integer(imageIndex, 'Image index', 0, MAX_GLTF_BUNDLE_RESOURCES - 1);
      const image = catalog.images[imageIndex];
      check(image, 'Image index was not found in this Model File.');
      const embedded = imageBytes.get(imageIndex);
      check(embedded, 'This image is external to the Model File and cannot be extracted here.');
      return { bytes: embedded.slice(), mimeType: image.mimeType, fileName: image.fileName, image };
    },
  };
}

/** A fresh bounded parse validates the requested range. Returned bytes are copied so the original Model is immutable. */
export function extractThreeDModelEmbeddedImage(fileName: string, bytes: Uint8Array, imageIndex: number) {
  return prepareThreeDModelEmbeddedImages(fileName, bytes).extract(imageIndex);
}
