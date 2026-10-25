export class LyricsInputError extends Error {}
export const LYRICS_CONTENT_LIMIT = 100_000;
export interface LyricsInput {
  title: string; content: string; sortOrder: number; isActive: boolean;
  metadata: Record<string, unknown>; projectIds: number[]; albumIds: number[]; trackIds: number[];
}
export function lyricsId(value: unknown): number {
  if ((typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > 2147483647) throw new LyricsInputError('Invalid record ID.');
  return Number(value);
}
export function parseLyricsInput(value: unknown): LyricsInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new LyricsInputError('Invalid Lyrics form.');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['id', 'title', 'content', 'sortOrder', 'isActive', 'metadata', 'projectIds', 'albumIds', 'trackIds'].includes(key))) throw new LyricsInputError('Unsupported Lyrics fields.');
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 255) throw new LyricsInputError('Title is required (maximum 255 characters).');
  const content = input.content ?? '';
  if (typeof content !== 'string' || content.length > LYRICS_CONTENT_LIMIT) throw new LyricsInputError('Lyrics text must be at most 100,000 characters.');
  const sortOrder = input.sortOrder ?? 0;
  if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < -10000 || sortOrder > 10000) throw new LyricsInputError('Sort Order must be an integer from -10000 to 10000.');
  const isActive = input.isActive ?? true;
  if (typeof isActive !== 'boolean') throw new LyricsInputError('Invalid Active flag.');
  const metadata = input.metadata ?? {};
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || new TextEncoder().encode(JSON.stringify(metadata)).length > 16384) throw new LyricsInputError('Metadata must be a JSON object of at most 16 KiB.');
  const ids = (key: string): number[] => {
    const list = input[key] ?? [];
    if (!Array.isArray(list) || list.length > 100) throw new LyricsInputError('Select at most 100 assignments of each type.');
    return [...new Set(list.map(lyricsId))].sort((a, b) => a - b);
  };
  return { title: input.title.trim(), content, sortOrder, isActive, metadata: metadata as Record<string, unknown>, projectIds: ids('projectIds'), albumIds: ids('albumIds'), trackIds: ids('trackIds') };
}
