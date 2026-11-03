import { InputValidationError, readArray, readBoolean, readChoice, readInteger, readNumber, readObject, readStrictObject, readString } from '@/libraries/utils/input-validation';

export const parseMultimediaId = (value: unknown): number => readInteger(value, 1, 2_147_483_647);
export const multimediaActions = [
  'playMultimedia',
  'pauseMultimedia',
  'stopMultimedia',
  'rewindMultimedia',
  'nextTrack',
] as const;
export type MultimediaAction = typeof multimediaActions[number];
export const isMultimediaAction = (value: string): value is MultimediaAction => multimediaActions.some(action => action === value);
export const multimediaActionLabels: Record<MultimediaAction, string> = {
  playMultimedia: 'Play Multimedia',
  pauseMultimedia: 'Pause Multimedia',
  stopMultimedia: 'Stop Multimedia',
  rewindMultimedia: 'Rewind Multimedia',
  nextTrack: 'Next Track',
};
export interface MultimediaSelection {
  albumId: number;
  trackId?: number;
}

export function parseMultimediaSelection(value: unknown): MultimediaSelection {
  const input = readStrictObject(value, [
    'albumId',
    'trackId',
  ]);
  return {
    albumId: parseMultimediaId(input.albumId),
    ...(Object.hasOwn(input, 'trackId') ? {
      trackId: input.trackId === undefined ? undefined : parseMultimediaId(input.trackId),
    } : {}),
  };
}

export function parseSceneMarkerId(value: unknown): string {
  const markerId = readString(value, 1, 128);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9:._-]*$/.test(markerId)) throw new InputValidationError();
  return markerId;
}

export interface SceneMultimediaCommand extends MultimediaSelection {
  projectId: number;
  markerId: string;
  actorMarkerId?: string;
  action: MultimediaAction;
}

export function parseSceneMultimediaCommand(value: unknown): SceneMultimediaCommand {
  const input = readStrictObject(value, [
    'albumId',
    'trackId',
    'projectId',
    'markerId',
    'actorMarkerId',
    'action',
  ]);
  const selection = parseMultimediaSelection({
    albumId: input.albumId,
    ...(Object.hasOwn(input, 'trackId') ? {
      trackId: input.trackId,
    } : {}),
  });
  const action = readChoice(input.action, multimediaActions);
  if (action !== 'playMultimedia' && selection.trackId !== undefined) throw new InputValidationError('Select a Track only for Play Multimedia.');
  return {
    ...selection,
    projectId: parseMultimediaId(input.projectId),
    markerId: parseSceneMarkerId(input.markerId),
    ...(Object.hasOwn(input, 'actorMarkerId') ? {
      actorMarkerId: input.actorMarkerId === undefined ? undefined : parseSceneMarkerId(input.actorMarkerId),
    } : {}),
    action,
  };
}

export interface MultimediaAlbumInfo {
  id: number;
  title: string;
  artist: string;
  coverArt: string | null;
}

export interface MultimediaTrackInfo {
  id: number;
  albumId: number;
  title: string;
  fileUrl: string;
  fileType: string;
  duration: number | null;
  trackNumber: number | null;
}

function parseAlbumInfo(value: unknown): MultimediaAlbumInfo {
  const input = readObject(value);
  return {
    id: parseMultimediaId(input.id),
    title: readString(input.title),
    artist: readString(input.artist),
    coverArt: input.coverArt === null ? null : readString(input.coverArt),
  };
}

function parseTrackInfo(value: unknown): MultimediaTrackInfo {
  const input = readObject(value);
  return {
    id: parseMultimediaId(input.id),
    albumId: parseMultimediaId(input.albumId),
    title: readString(input.title),
    fileUrl: readString(input.fileUrl),
    fileType: readString(input.fileType),
    duration: input.duration === null ? null : readNumber(input.duration),
    trackNumber: input.trackNumber === null ? null : readNumber(input.trackNumber),
  };
}

export interface MultimediaPreviewData {
  projectId: number;
  albumId: number | null;
  albums: MultimediaAlbumInfo[];
  tracks: MultimediaTrackInfo[];
  offset: number;
  hasMore: boolean;
}

export function parseMultimediaPreviewData(value: unknown): MultimediaPreviewData {
  const input = readObject(value);
  return {
    projectId: parseMultimediaId(input.projectId),
    albums: readArray(input.albums, 100).map(parseAlbumInfo),
    albumId: input.albumId === null ? null : parseMultimediaId(input.albumId),
    tracks: readArray(input.tracks, 50).map(parseTrackInfo),
    offset: readInteger(input.offset, 0),
    hasMore: readBoolean(input.hasMore),
  };
}

export interface SceneMultimediaResponse extends MultimediaPreviewData {
  markerId: string;
  sourceType: 'model' | 'character' | 'bed' | 'farmbot' | 'planting';
  sourceId: number;
}

export function parseSceneMultimediaResponse(value: unknown): SceneMultimediaResponse {
  const input = readObject(value);
  return {
    ...parseMultimediaPreviewData(input),
    markerId: parseSceneMarkerId(input.markerId),
    sourceType: readChoice(input.sourceType, [
      'model',
      'character',
      'bed',
      'farmbot',
      'planting',
    ]),
    sourceId: parseMultimediaId(input.sourceId),
  };
}
export type SceneMultimediaTrack = SceneMultimediaResponse['tracks'][number];

export function sceneMultimediaQuery(params: URLSearchParams) {
  const number = (name: string) => {
    const raw = params.get(name);
    if (!raw || !/^[1-9]\d*$/.test(raw)) throw new Error(`Invalid ${name}.`);
    return parseMultimediaId(Number(raw));
  };
  const offset = params.get('offset') ?? '0';
  if (!/^\d+$/.test(offset) || Number(offset) > 1_000_000) throw new Error('Invalid Track page.');
  return {
    projectId: number('projectId'),
    markerId: parseSceneMarkerId(params.get('markerId')),
    actorMarkerId: params.has('actorMarkerId') ? parseSceneMarkerId(params.get('actorMarkerId')) : undefined,
    albumId: params.has('albumId') ? number('albumId') : null,
    trackId: params.has('trackId') ? number('trackId') : null,
    offset: Number(offset),
  };
}

export type SceneMultimediaQuery = ReturnType<typeof sceneMultimediaQuery>;
