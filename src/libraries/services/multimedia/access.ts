import { ownsMediaKey } from './upload-policy';

type AlbumAccess = { userId: string | null; isPublic: boolean | null; status: string | null };
type TrackAccess = { userId: string | null; status: string | null };

export const isPublicAlbum = (album: AlbumAccess) =>
  Boolean(album.userId && album.isPublic && album.status === 'published');

export function canReadTrack(userId: string | undefined, track: TrackAccess, album?: AlbumAccess | null) {
  if (userId && track.userId === userId) return true;
  return Boolean(album && isPublicAlbum(album) && track.userId === album.userId && track.status === 'active');
}

export function positiveId(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function ownsFileReference(userId: string, value: unknown) {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('/api/multimedia/files')) return true; // Retain existing external/legacy references.
  try {
    const url = new URL(value, 'https://multimedia.invalid');
    return url.pathname === '/api/multimedia/files' && ownsMediaKey(userId, url.searchParams.get('key') || '');
  } catch { return false; }
}

const fields = {
  album: ['id', 'title', 'artist', 'coverArt', 'releaseYear', 'description', 'sortOrder', 'status', 'isPublic'],
  track: ['id', 'albumId', 'title', 'duration', 'trackNumber', 'fileUrl', 'fileType', 'status'],
  media: ['sortOrder', 'id', 'albumId', 'fileName', 'fileUrl', 'fileType', 'isPrimary', 'isPublic', 'isActive'],
  link: ['id', 'albumId', 'trackId', 'title', 'url', 'type', 'icon', 'description', 'displayOrder', 'status'],
} as const;

export function publicRecord(kind: keyof typeof fields, record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of fields[kind]) if (key in record) result[key] = record[key];
  for (const key of ['coverArt', 'fileUrl']) {
    if (typeof record[key] === 'string' && record[key].startsWith('/api/multimedia/files') &&
        (typeof record.userId !== 'string' || !ownsFileReference(record.userId, record[key]))) result[key] = null;
  }
  if (kind === 'album') {
    for (const [key, child] of [['tracks', 'track'], ['media', 'media'], ['links', 'link']] as const) {
      if (Array.isArray(record[key])) result[key] = record[key].map(item => publicRecord(child, item));
    }
  }
  return result;
}
