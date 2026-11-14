export class ProjectFeaturedImageError extends Error {}

/** Persisted as metadata.featured_image; null explicitly removes the image. */
export function parseProjectFeaturedImage(value: unknown): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) throw new ProjectFeaturedImageError('Featured image must be an App image path or HTTPS URL.');
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\/(?!\/)[^\\\s]+$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {}
  throw new ProjectFeaturedImageError('Featured image must be an App image path or HTTPS URL.');
}

export function readProjectFeaturedImage(metadata: unknown): string | null | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || !('featured_image' in metadata)) return undefined;
  try { return parseProjectFeaturedImage(metadata.featured_image); } catch { return null; }
}
