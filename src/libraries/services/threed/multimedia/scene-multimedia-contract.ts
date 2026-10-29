import { z } from 'zod';

const id = z.number().int().positive().max(2_147_483_647);
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
export const multimediaSelectionSchema = z.object({
  albumId: id,
  trackId: id.optional(),
}).strict();
export type MultimediaSelection = z.infer<typeof multimediaSelectionSchema>;
export const sceneMarkerId = z.string().min(1).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9:._-]*$/);
export const sceneMultimediaCommandSchema = multimediaSelectionSchema.extend({
  projectId: id,
  markerId: sceneMarkerId,
  actorMarkerId: sceneMarkerId.optional(),
  action: z.enum(multimediaActions),
}).strict().refine(command => command.action === 'playMultimedia' || command.trackId === undefined, {
  message: 'Select a Track only for Play Multimedia.',
});
export type SceneMultimediaCommand = z.infer<typeof sceneMultimediaCommandSchema>;

const albumSchema = z.object({
  id,
  title: z.string(),
  artist: z.string(),
  coverArt: z.string().nullable(),
});
const trackSchema = z.object({
  id,
  albumId: id,
  title: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  duration: z.number().nullable(),
  trackNumber: z.number().nullable(),
});
export const sceneMultimediaResponseSchema = z.object({
  projectId: id,
  markerId: sceneMarkerId,
  sourceType: z.enum(['model', 'character', 'bed', 'farmbot', 'planting']),
  sourceId: id,
  albums: z.array(albumSchema).max(100),
  albumId: id.nullable(),
  tracks: z.array(trackSchema).max(50),
  offset: z.number().int().min(0),
  hasMore: z.boolean(),
});
export type SceneMultimediaResponse = z.infer<typeof sceneMultimediaResponseSchema>;
export type SceneMultimediaTrack = SceneMultimediaResponse['tracks'][number];

export function sceneMultimediaQuery(params: URLSearchParams) {
  const number = (name: string) => {
    const raw = params.get(name);
    if (!raw || !/^[1-9]\d*$/.test(raw)) throw new Error(`Invalid ${name}.`);
    return id.parse(Number(raw));
  };
  const offset = params.get('offset') ?? '0';
  if (!/^\d+$/.test(offset) || Number(offset) > 1_000_000) throw new Error('Invalid Track page.');
  return {
    projectId: number('projectId'),
    markerId: sceneMarkerId.parse(params.get('markerId')),
    actorMarkerId: params.has('actorMarkerId') ? sceneMarkerId.parse(params.get('actorMarkerId')) : undefined,
    albumId: params.has('albumId') ? number('albumId') : null,
    trackId: params.has('trackId') ? number('trackId') : null,
    offset: Number(offset),
  };
}

export type SceneMultimediaQuery = ReturnType<typeof sceneMultimediaQuery>;
