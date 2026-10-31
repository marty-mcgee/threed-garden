import { z } from 'zod';
import { multimediaSelectionSchema, multimediaActions, sceneMultimediaResponseSchema } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';

const id = z.number().int().positive().max(2_147_483_647);
export const projectMultimediaCommandSchema = multimediaSelectionSchema.extend({
  projectId: id,
  action: z.enum(multimediaActions),
}).strict().refine(command => command.action === 'playMultimedia' || command.trackId === undefined, {
  message: 'Select a Track only for Play Multimedia.',
});
export type ProjectMultimediaCommand = z.infer<typeof projectMultimediaCommandSchema>;
export const projectMultimediaPreviewSchema = sceneMultimediaResponseSchema.pick({
  projectId: true,
  albumId: true,
  albums: true,
  tracks: true,
  offset: true,
  hasMore: true,
});
export type ProjectMultimediaPreview = z.infer<typeof projectMultimediaPreviewSchema>;
export type ProjectMultimediaPreviewQuery = {
  projectId: number;
  albumId: number;
  trackId: number | null;
  offset: number;
};
export function projectMultimediaPreviewQuery(params: URLSearchParams): ProjectMultimediaPreviewQuery {
  const number = (key: string) => {
    const raw = params.get(key) ?? '';
    if (!/^[1-9]\d*$/.test(raw)) throw Error('Invalid ' + key);
    return id.parse(Number(raw));
  };
  const offset = params.get('offset') ?? '0';
  if (!/^\d+$/.test(offset) || Number(offset) > 1_000_000) throw Error('Invalid Track page.');
  return {
    projectId: number('projectId'),
    albumId: number('albumId'),
    trackId: params.has('trackId') ? number('trackId') : null,
    offset: Number(offset),
  };
}
