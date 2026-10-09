/** Upload bytes and decoded preview allocations are separate budgets. */
export const MAX_THREED_DIRECT_MODEL_BYTES = 32 * 1024 * 1024;
export const MAX_THREED_MULTIPART_FILE_BYTES = 4 * 1024 * 1024;
export const THREED_MODEL_CONTENT_TYPES = {
  glb: 'model/gltf-binary', gltf: 'model/gltf+json', fbx: 'application/octet-stream',
  obj: 'model/obj', usdz: 'model/vnd.usdz+zip',
} as const;
export type ThreeDModelFileType = keyof typeof THREED_MODEL_CONTENT_TYPES;

export function threeDModelUploadPolicy(name: unknown, size: unknown) {
  if (typeof name !== 'string' || !name || name.length > 255 || /[\\/\x00-\x1f\x7f]/.test(name)
    || name === '.' || name === '..') throw new Error('Choose a Model file with a valid filename.');
  const extension = name.split('.').at(-1)?.toLowerCase() as ThreeDModelFileType;
  if (!Object.hasOwn(THREED_MODEL_CONTENT_TYPES, extension)) throw new Error('Choose a GLB, GLTF, FBX, OBJ, or USDZ Model file.');
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0) throw new Error('The Model file must not be empty.');
  if (size > MAX_THREED_DIRECT_MODEL_BYTES) {
    throw new Error(`${name} is ${(size / 1024 / 1024).toFixed(2)} MiB. Direct Model uploads support up to 32 MiB. Reduce the export size before uploading.`);
  }
  return { fileName: name, fileSize: size, modelType: extension, contentType: THREED_MODEL_CONTENT_TYPES[extension] };
}

export function suggestedThreeDModelName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || 'Untitled Model';
}
