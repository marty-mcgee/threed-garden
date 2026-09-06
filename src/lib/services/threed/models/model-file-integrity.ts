const VERCEL_BLOB_HOST_SUFFIX = '.blob.vercel-storage.com';

const RUNTIME_MODEL_TYPES = [
  'gltf',
  'glb',
  'fbx',
  'usdz',
  'obj',
] as const;

type RuntimeModelType = (typeof RUNTIME_MODEL_TYPES)[number];

export function runtimeModelTypeFromFileName(fileName: string): RuntimeModelType | null {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return RUNTIME_MODEL_TYPES.includes(extension as RuntimeModelType)
    ? extension as RuntimeModelType
    : null;
}

export function isOwnedThreeDBlobUrl(
  value: string,
  { modelId, userId }: { modelId: number; userId: string },
): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname.endsWith(VERCEL_BLOB_HOST_SUFFIX)) return false;
    const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    return path.startsWith(`models/${modelId}/`)
      || path.startsWith(`models/${userId}/upload/`)
      || path.startsWith(`models/${userId}/previews/`);
  } catch {
    return false;
  }
}
