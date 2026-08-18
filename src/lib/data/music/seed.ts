import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';

const DEFAULT_IMPORT_FILE = 'src/lib/data/music/seed-data.json';
const ALBUM_STATUSES = ['draft', 'published', 'archived'] as const;
const TRACK_STATUSES = ['active', 'inactive', 'processing'] as const;

type AlbumStatus = (typeof ALBUM_STATUSES)[number];
type TrackStatus = (typeof TRACK_STATUSES)[number];

interface ImportOptions {
  commit: boolean;
  filePath: string;
  userId: string;
}

interface ImportTrack {
  sourceId: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  fileUrl: string;
  fileType: string;
  status: TrackStatus;
  lyrics: string | null;
  metadata: unknown;
  playCount: number;
}

interface ImportAlbum {
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
  sortOrder: number;
  status: AlbumStatus;
  isPublic: boolean;
  metadata: unknown;
  tracks: ImportTrack[];
}

interface ImportPlan {
  albums: ImportAlbum[];
  trackCount: number;
  warnings: string[];
}

interface SkippedTrack {
  albumTitle: string;
  fileUrl: string;
  reason: 'already exists in database' | 'duplicate in import JSON';
  sourceId: number;
  trackTitle: string;
}

function readOption(args: string[], name: string): string | undefined {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseOptions(args: string[]): ImportOptions {
  const userId = readOption(args, '--user-id')?.trim();
  if (!userId) throw new Error('Missing required --user-id <id> argument');

  const requestedFile = readOption(args, '--file') || DEFAULT_IMPORT_FILE;
  return {
    commit: args.includes('--commit'),
    filePath: path.resolve(process.cwd(), requestedFile),
    userId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${field} must be a non-empty string`);
    return '';
  }
  return value.trim();
}

function optionalString(value: unknown, field: string, errors: string[]): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    errors.push(`${field} must be a string or null`);
    return null;
  }
  return value;
}

function integer(
  value: unknown,
  field: string,
  errors: string[],
  options: { nullable?: boolean; minimum?: number } = {}
): number | null {
  if ((value === null || value === undefined) && options.nullable) return null;
  if (!Number.isInteger(value) || (options.minimum !== undefined && Number(value) < options.minimum)) {
    errors.push(`${field} must be an integer${options.minimum !== undefined ? ` >= ${options.minimum}` : ''}`);
    return options.nullable ? null : 0;
  }
  return Number(value);
}

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
  errors: string[]
): T {
  if (typeof value === 'string' && values.includes(value as T)) return value as T;
  errors.push(`${field} must be one of: ${values.join(', ')}`);
  return values[0];
}

function inferFileType(fileUrl: string, field: string, errors: string[]): string {
  let pathname = '';
  try {
    const url = new URL(fileUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('unsupported protocol');
    pathname = url.pathname.toLowerCase();
  } catch {
    errors.push(`${field} must be a valid HTTP(S) URL`);
    return '';
  }

  if (pathname.endsWith('.mp3')) return 'audio/mpeg';
  if (pathname.endsWith('.wav')) return 'audio/wav';
  if (pathname.endsWith('.m4a') || pathname.endsWith('.mp4')) return 'audio/mp4';
  if (pathname.endsWith('.aac')) return 'audio/aac';
  if (pathname.endsWith('.ogg')) return 'audio/ogg';
  if (pathname.endsWith('.flac')) return 'audio/flac';

  errors.push(`${field} has an unsupported audio extension`);
  return '';
}

function buildImportPlan(input: unknown): ImportPlan {
  const errors: string[] = [];
  if (!isRecord(input) || !Array.isArray(input.albums)) {
    throw new Error('Import JSON must contain an albums array');
  }
  if (input.version !== 1) {
    errors.push('version must be 1');
  }

  const sourceAlbumIds = new Set<number>();
  const sourceTrackIds = new Set<number>();
  const sourceTrackFileKeys = new Set<string>();
  const warnings: string[] = [];
  const albums = input.albums.map((value, albumIndex): ImportAlbum => {
    const prefix = `albums[${albumIndex}]`;
    if (!isRecord(value)) {
      errors.push(`${prefix} must be an object`);
      return {
        title: '', artist: '', coverArt: '', releaseYear: null, description: null,
        sortOrder: 0, status: 'draft', isPublic: false, metadata: null, tracks: [],
      };
    }

    const sourceId = integer(value.sourceId, `${prefix}.sourceId`, errors, { minimum: 1 }) || 0;
    if (sourceAlbumIds.has(sourceId)) errors.push(`${prefix}.sourceId duplicates Album source ID ${sourceId}`);
    sourceAlbumIds.add(sourceId);

    const tracksValue = value.tracks;
    if (!Array.isArray(tracksValue)) errors.push(`${prefix}.tracks must be an array`);
    const tracks = (Array.isArray(tracksValue) ? tracksValue : []).map((trackValue, trackIndex): ImportTrack => {
      const trackPrefix = `${prefix}.tracks[${trackIndex}]`;
      if (!isRecord(trackValue)) {
        errors.push(`${trackPrefix} must be an object`);
        return {
          sourceId: 0, title: '', duration: null, trackNumber: null, fileUrl: '', fileType: '',
          status: 'inactive', lyrics: null, metadata: null, playCount: 0,
        };
      }

      const sourceTrackId = integer(trackValue.sourceId, `${trackPrefix}.sourceId`, errors, { minimum: 1 }) || 0;
      if (sourceTrackIds.has(sourceTrackId)) {
        errors.push(`${trackPrefix}.sourceId duplicates Track source ID ${sourceTrackId}`);
      }
      sourceTrackIds.add(sourceTrackId);

      const sourceAlbumId = integer(trackValue.albumSourceId, `${trackPrefix}.albumSourceId`, errors, { minimum: 1 });
      if (sourceAlbumId !== sourceId) {
        errors.push(`${trackPrefix}.albumSourceId must match parent Album source ID ${sourceId}`);
      }

      const fileUrl = requiredString(trackValue.fileUrl, `${trackPrefix}.fileUrl`, errors);
      const sourceTrackFileKey = `${sourceId}\u0000${fileUrl}`;
      if (sourceTrackFileKeys.has(sourceTrackFileKey)) {
        warnings.push(
          `${trackPrefix} duplicates another Track in Album source ID ${sourceId}: ` +
          `source ID ${sourceTrackId}, ${String(trackValue.title)}, ${fileUrl}`
        );
      }
      sourceTrackFileKeys.add(sourceTrackFileKey);

      const fileType = requiredString(trackValue.fileType, `${trackPrefix}.fileType`, errors);
      const inferredFileType = inferFileType(fileUrl, `${trackPrefix}.fileUrl`, errors);
      if (fileType && inferredFileType && fileType !== inferredFileType) {
        errors.push(`${trackPrefix}.fileType must be ${inferredFileType} for its fileUrl`);
      }
      return {
        sourceId: sourceTrackId,
        title: requiredString(trackValue.title, `${trackPrefix}.title`, errors),
        duration: integer(trackValue.duration, `${trackPrefix}.duration`, errors, { nullable: true, minimum: 0 }),
        trackNumber: integer(trackValue.trackNumber, `${trackPrefix}.trackNumber`, errors, { nullable: true, minimum: 0 }),
        fileUrl,
        fileType,
        status: enumValue(trackValue.status ?? 'active', TRACK_STATUSES, `${trackPrefix}.status`, errors),
        lyrics: optionalString(trackValue.lyrics, `${trackPrefix}.lyrics`, errors),
        metadata: trackValue.metadata ?? null,
        playCount: integer(trackValue.playCount ?? 0, `${trackPrefix}.playCount`, errors, { minimum: 0 }) || 0,
      };
    });

    const releaseYear = integer(value.releaseYear, `${prefix}.releaseYear`, errors, {
      nullable: true,
      minimum: 1000,
    });
    if (releaseYear !== null && releaseYear > 9999) errors.push(`${prefix}.releaseYear must be <= 9999`);
    if (typeof value.isPublic !== 'boolean') errors.push(`${prefix}.isPublic must be a boolean`);

    return {
      title: requiredString(value.title, `${prefix}.title`, errors),
      artist: requiredString(value.artist, `${prefix}.artist`, errors),
      coverArt: requiredString(value.coverArt, `${prefix}.coverArt`, errors),
      releaseYear,
      description: optionalString(value.description, `${prefix}.description`, errors),
      sortOrder: integer(value.sortOrder ?? 0, `${prefix}.sortOrder`, errors, { minimum: 0 }) || 0,
      status: enumValue(value.status ?? 'draft', ALBUM_STATUSES, `${prefix}.status`, errors),
      isPublic: value.isPublic === true,
      metadata: value.metadata ?? null,
      tracks,
    };
  });

  if (errors.length > 0) throw new Error(`Import validation failed:\n- ${errors.join('\n- ')}`);
  return {
    albums,
    trackCount: albums.reduce((total, album) => total + album.tracks.length, 0),
    warnings,
  };
}

function albumKey(title: string, artist: string): string {
  return `${artist.trim().toLowerCase()}\u0000${title.trim().toLowerCase()}`;
}

async function commitImport(plan: ImportPlan, userId: string) {
  const [{ db }, { musicAlbums, musicTracks, user }] = await Promise.all([
    import('@/lib/db/client'),
    import('@/lib/schema'),
  ]);

  const [targetUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
  if (!targetUser) throw new Error(`Target user does not exist: ${userId}`);

  return db.transaction(async (tx) => {
    const existingAlbums = await tx
      .select({ id: musicAlbums.id, title: musicAlbums.title, artist: musicAlbums.artist })
      .from(musicAlbums)
      .where(eq(musicAlbums.userId, userId));
    const existingTracks = await tx
      .select({ albumId: musicTracks.albumId, fileUrl: musicTracks.fileUrl })
      .from(musicTracks)
      .where(eq(musicTracks.userId, userId));

    const albumIdsByKey = new Map(existingAlbums.map((album) => [albumKey(album.title, album.artist), album.id]));
    const existingTrackKeys = new Set(
      existingTracks.map((track) => `${track.albumId}\u0000${track.fileUrl}`)
    );
    let albumsCreated = 0;
    let albumsSkipped = 0;
    let tracksCreated = 0;
    let tracksSkipped = 0;
    const processedTrackKeys = new Set<string>();
    const skippedTracks: SkippedTrack[] = [];

    for (const album of plan.albums) {
      const key = albumKey(album.title, album.artist);
      let databaseAlbumId = albumIdsByKey.get(key);
      if (databaseAlbumId) {
        albumsSkipped += 1;
      } else {
        const [createdAlbum] = await tx
          .insert(musicAlbums)
          .values({
            userId,
            title: album.title,
            artist: album.artist,
            coverArt: album.coverArt,
            releaseYear: album.releaseYear,
            description: album.description,
            sortOrder: album.sortOrder,
            status: album.status,
            isPublic: album.isPublic,
            metadata: album.metadata,
          })
          .returning({ id: musicAlbums.id });
        databaseAlbumId = createdAlbum.id;
        albumIdsByKey.set(key, databaseAlbumId);
        albumsCreated += 1;
      }

      for (const track of album.tracks) {
        const trackKey = `${databaseAlbumId}\u0000${track.fileUrl}`;
        const duplicateInImport = processedTrackKeys.has(trackKey);
        if (duplicateInImport || existingTrackKeys.has(trackKey)) {
          tracksSkipped += 1;
          skippedTracks.push({
            albumTitle: album.title,
            trackTitle: track.title,
            sourceId: track.sourceId,
            fileUrl: track.fileUrl,
            reason: duplicateInImport ? 'duplicate in import JSON' : 'already exists in database',
          });
          processedTrackKeys.add(trackKey);
          continue;
        }

        await tx.insert(musicTracks).values({
          userId,
          albumId: databaseAlbumId,
          title: track.title,
          duration: track.duration,
          trackNumber: track.trackNumber,
          fileUrl: track.fileUrl,
          fileType: track.fileType,
          status: track.status,
          lyrics: track.lyrics,
          metadata: track.metadata,
          playCount: track.playCount,
        });
        processedTrackKeys.add(trackKey);
        existingTrackKeys.add(trackKey);
        tracksCreated += 1;
      }
    }

    return { albumsCreated, albumsSkipped, tracksCreated, tracksSkipped, skippedTracks };
  });
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const raw = await readFile(options.filePath, 'utf8');
  const plan = buildImportPlan(JSON.parse(raw) as unknown);

  console.log(`Music import file: ${options.filePath}`);
  console.log(`Target user: ${options.userId}`);
  console.log(`Validated Albums: ${plan.albums.length}`);
  console.log(`Validated Tracks: ${plan.trackCount}`);
  if (plan.warnings.length > 0) {
    console.log(`Warnings: ${plan.warnings.length}`);
    for (const warning of plan.warnings) console.log(`- ${warning}`);
  }

  if (!options.commit) {
    console.log('Dry run complete. No database connection was opened and no records were written.');
    console.log('Run again with --commit after reviewing this summary.');
    return;
  }

  const result = await commitImport(plan, options.userId);
  console.log(`Albums created: ${result.albumsCreated}`);
  console.log(`Albums skipped: ${result.albumsSkipped}`);
  console.log(`Tracks created: ${result.tracksCreated}`);
  console.log(`Tracks skipped: ${result.tracksSkipped}`);
  for (const track of result.skippedTracks) {
    console.log(
      `- Skipped Track ${track.sourceId} "${track.trackTitle}" from "${track.albumTitle}" ` +
      `(${track.reason}): ${track.fileUrl}`
    );
  }
  console.log('Music import committed successfully.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
