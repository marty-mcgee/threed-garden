export const mediaTypes: Record<string, string> = {
  mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', ogg: 'audio/ogg', m4a: 'audio/mp4',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
};
export function uploadPolicy(name: string, size: number, kind: string) {
  const extension = name.split('.').pop()?.toLowerCase() || '';
  const contentType = mediaTypes[extension];
  const limit = contentType?.startsWith('image/') ? 20 * 1024 * 1024 : 512 * 1024 * 1024;
  if (!name || name.length > 255 || /[\\/\x00-\x1f\x7f]/.test(name) || !contentType || !['audio', 'image', 'media'].includes(kind) ||
      (kind !== 'media' && !contentType.startsWith(`${kind}/`)) ||
      !Number.isSafeInteger(size) || size <= 0 || size > limit) throw Error('Unsupported file type or size.');
  return { extension, contentType, limit };
}
export const ownerPrefix = (userId: string) => `threed/users/${encodeURIComponent(userId)}/multimedia/`;
export function ownsMediaKey(userId: string, key: string) {
  const prefix = [ownerPrefix(userId), `multimedia/users/${encodeURIComponent(userId)}/`]
    .find(candidate => key.startsWith(candidate));
  if (!prefix) return false;
  const relative = key.slice(prefix.length);
  // Keep previously saved UUID-only objects readable.
  if (/^[a-f0-9-]{36}\.[a-z0-9]+$/.test(relative)) return true;
  const parts = relative.split('/');
  return parts.length === 2 && /^[a-f0-9-]{36}$/.test(parts[0]) &&
    parts[1].length > 0 && parts[1].length <= 255 &&
    !/[\\\x00-\x1f\x7f]/.test(parts[1]) && parts[1] !== '.' && parts[1] !== '..';
}
