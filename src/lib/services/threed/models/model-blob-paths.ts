/** Immutable storage keys; database fileName/relativePath remain dependency identity. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function owner(userId: string) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(userId)) throw new Error('Invalid storage owner');
  return `threed/users/${userId}`;
}
function revision(value: string) { if (!UUID.test(value)) throw new Error('Invalid storage revision'); return value; }
export function readableBlobFileName(fileName: string) {
  const base = fileName.replaceAll('\\', '/').split('/').at(-1) ?? '';
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) : '';
  const stem = (dot > 0 ? base.slice(0, dot) : base).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file';
  return `${stem}${ext ? `.${ext}` : ''}`;
}
export function createThreeDBlobPath(userId: string, kind: 'models' | 'textures' | 'previews', fileName: string, id: string) {
  const name = readableBlobFileName(fileName);
  const label = name.replace(/\.[^.]+$/, '').slice(0, 32);
  return `${owner(userId)}/${kind}/${label}--${revision(id)}/${kind === 'models' ? 'primary/' : ''}${name}`;
}
function blobPath(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.blob.vercel-storage.com') || url.search || url.hash) return null;
    const path = decodeURIComponent(url.pathname).replace(/^\//, '');
    if (path.includes('\\') || path.split('/').some((part) => !part || part === '.' || part === '..')) return null;
    return path;
  } catch { return null; }
}
function modelRoot(value: string, userId: string): string | null {
  const path = blobPath(value);
  const prefix = `${owner(userId)}/models/`;
  if (!path?.startsWith(prefix)) return null;
  const folder = path.slice(prefix.length).split('/')[0];
  return /^[a-zA-Z0-9_-]{1,32}--[0-9a-f-]{36}$/.test(folder) && UUID.test(folder.slice(-36)) ? `${prefix}${folder}` : null;
}
export function createThreeDAttachmentBlobPath(userId: string, modelId: number, primaryUrl: string, relativePath: string, id: string) {
  if (!Number.isSafeInteger(modelId) || modelId <= 0) throw new Error('Invalid Model ID');
  const root = modelRoot(primaryUrl, userId) ?? `${owner(userId)}/models/model-${modelId}`;
  // Logical exporter directories stay in relativePath; safe physical names cannot
  // exceed the filePath column limit or acquire traversal/control characters.
  const directory = relativePath.replaceAll('\\', '/').split('/').slice(0, -1).map((part) => readableBlobFileName(part).replaceAll('.', '-')).join('/').slice(0, 64).replace(/\/$/, '');
  return `${root}/attachments/${directory ? `${directory}/` : ''}${revision(id)}/${readableBlobFileName(relativePath)}`;
}
export function isNewOwnedModelBlobUrl(value: string, userId: string, modelId: number) {
  try {
    const path = blobPath(value);
    if (!path) return false;
    const root = modelRoot(value, userId);
    const fallback = `${owner(userId)}/models/model-${modelId}/attachments/`;
    return Boolean((root && (path.startsWith(`${root}/primary/`) || path.startsWith(`${root}/attachments/`)))
      || path.startsWith(fallback) || path.startsWith(`${owner(userId)}/previews/`));
  } catch { return false; }
}
export function isOwnedStagedModelBlobUrl(value: unknown, userId: string): value is string {
  if (typeof value !== 'string' || value.length > 2000) return false;
  try {
    const path = blobPath(value);
    if (!path) return false;
    const root = modelRoot(value, userId);
    const primary = root ? path.slice(root.length + 1) : '';
    if (/^primary\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:glb|gltf|fbx|obj|usdz)$/i.test(primary)) return true;
    const legacy = `models/${userId}/upload/`;
    return path.startsWith(legacy) && /^\d+\.(?:glb|gltf|fbx|obj|usdz)$/i.test(path.slice(legacy.length));
  } catch { return false; }
}
