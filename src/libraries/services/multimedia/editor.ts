export type MultimediaKind = 'albums' | 'tracks' | 'media' | 'links';
export type MultimediaDraft = Record<string, string | boolean>;
export type MultimediaRecord = { id: number; albumId?: number | null; trackId?: number | null; [key: string]: unknown };
export type MultimediaField = { key: string; label: string; type?: 'number' | 'boolean' | 'textarea' | 'select'; required?: boolean; choices?: string[]; min?: number; max?: number };
export const multimediaEditors: Record<MultimediaKind, { title: string; fields: MultimediaField[] }> = {
  albums: { title: 'Album', fields: [
    { key: 'title', label: 'Title', required: true }, { key: 'artist', label: 'Artist', required: true },
    { key: 'coverArt', label: 'Cover art URL', required: true }, { key: 'releaseYear', label: 'Release year', type: 'number' },
    { key: 'sortOrder', label: 'Sort Order', type: 'number', min: -10000, max: 10000 }, { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', choices: ['draft', 'published', 'archived'] }, { key: 'isPublic', label: 'Public', type: 'boolean' },
  ] },
  tracks: { title: 'Track', fields: [
    { key: 'title', label: 'Title', required: true }, { key: 'trackNumber', label: 'Sort Order', type: 'number', min: -10000, max: 10000 },
    { key: 'duration', label: 'Duration (seconds)', type: 'number' }, { key: 'fileUrl', label: 'File URL', required: true },
    { key: 'fileType', label: 'File type', required: true }, { key: 'fileSize', label: 'File size (bytes)', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', choices: ['active', 'inactive', 'processing'] }, { key: 'lyrics', label: 'Lyrics / transcript', type: 'textarea' },
  ] },
  media: { title: 'Media', fields: [
    { key: 'fileName', label: 'File name', required: true }, { key: 'fileUrl', label: 'File URL', required: true },
    { key: 'fileType', label: 'File type', required: true }, { key: 'fileSize', label: 'File size (bytes)', type: 'number' },
    { key: 'isPrimary', label: 'Primary Media', type: 'boolean' },
  ] },
  links: { title: 'Link', fields: [
    { key: 'title', label: 'Title', required: true }, { key: 'url', label: 'URL', required: true },
    { key: 'type', label: 'Type', type: 'select', choices: ['external', 'social', 'buy', 'stream', 'video'] },
    { key: 'status', label: 'Status', type: 'select', choices: ['active', 'inactive', 'pending', 'expired'] },
    { key: 'displayOrder', label: 'Sort Order', type: 'number', min: -10000, max: 10000 }, { key: 'icon', label: 'Icon' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ] },
};

export function multimediaDraft(kind: MultimediaKind, record?: MultimediaRecord): MultimediaDraft {
  const defaults: MultimediaDraft = { status: kind === 'albums' ? 'draft' : 'active', type: 'external', trackNumber: '0', sortOrder: '0', displayOrder: '0', fileType: kind === 'tracks' ? 'audio/mpeg' : 'image/jpeg' };
  const draft: MultimediaDraft = {};
  for (const field of multimediaEditors[kind].fields) {
    draft[field.key] = field.type === 'boolean' ? Boolean(record?.[field.key]) : String(record?.[field.key] ?? (record && field.label === 'Sort Order' ? '' : defaults[field.key]) ?? '');
  }
  if (kind !== 'albums') draft.albumId = String(record?.albumId ?? '');
  if (kind === 'links') draft.trackId = String(record?.trackId ?? '');
  return draft;
}

export function multimediaPayload(kind: MultimediaKind, draft: MultimediaDraft, baseline?: MultimediaDraft) {
  const payload: Record<string, string | number | boolean | null> = {};
  for (const field of multimediaEditors[kind].fields) {
    const value = draft[field.key];
    if (field.required && (typeof value !== 'string' || !value.trim())) throw Error(`${field.label} is required.`);
    if (field.choices && !field.choices.includes(String(value))) throw Error(`Choose a valid ${field.label.toLowerCase()}.`);
    if (field.type === 'number' && value !== '' && (!Number.isSafeInteger(Number(value)) || Number(value) < (field.min ?? 0) || Number(value) > (field.max ?? Number.MAX_SAFE_INTEGER))) throw Error(`${field.label} must be a whole number from ${field.min ?? 0} to ${field.max ?? Number.MAX_SAFE_INTEGER}.`);
    if (field.key === 'url' && value) {
      let valid = false;
      try { valid = ['http:', 'https:'].includes(new URL(String(value)).protocol); } catch { /* Invalid URL. */ }
      if (!valid) throw Error('Enter an http or https Link URL.');
    }
    if (!baseline || value !== baseline[field.key]) payload[field.key] = field.type === 'number' ? value === '' ? null : Number(value) : typeof value === 'string' ? value.trim() : value;
  }
  for (const key of kind === 'albums' ? [] : kind === 'links' ? ['albumId', 'trackId'] : ['albumId']) {
    const value = String(draft[key] ?? '');
    if ((!value && kind !== 'links') || (value && (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))))) throw Error('Choose an owned Album or Track.');
    if (!baseline || value !== baseline[key]) payload[key] = value ? Number(value) : null;
  }
  return payload;
}
