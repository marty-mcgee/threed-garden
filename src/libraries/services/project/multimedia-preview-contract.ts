import { InputValidationError, readChoice, readStrictObject } from '@/libraries/utils/input-validation';
import { parseMultimediaSelection, parseMultimediaId, multimediaActions, parseMultimediaPreviewData, type MultimediaAction, type MultimediaSelection, type MultimediaPreviewData } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';

export interface ProjectMultimediaCommand extends MultimediaSelection {
  projectId: number;
  action: MultimediaAction;
}

export function parseProjectMultimediaCommand(value: unknown): ProjectMultimediaCommand {
  const input = readStrictObject(value, [
    'albumId',
    'trackId',
    'projectId',
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
    action,
  };
}

export const parseProjectMultimediaPreview = parseMultimediaPreviewData;
export type ProjectMultimediaPreview = MultimediaPreviewData;
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
    return parseMultimediaId(Number(raw));
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
