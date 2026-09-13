import {
  AnimationLibraryError, LIBRARY_ACTIONS, objectInput, parseAction, positiveId,
  type Assignment, type AvailableClip,
} from './contracts';

export type PresetEntry = { actionKey: string; mode: 'assigned' | 'disabled'; animationId: number | null };
export function parsePreset(value: unknown) {
  const body = objectInput(value, ['name', 'description', 'entries']);
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) {
    throw new AnimationLibraryError(400, 'Preset name must contain 1–120 characters');
  }
  if (body.description != null && (typeof body.description !== 'string' || body.description.length > 4000)) {
    throw new AnimationLibraryError(400, 'Invalid preset description');
  }
  if (!Array.isArray(body.entries) || !body.entries.length || body.entries.length > LIBRARY_ACTIONS.length) {
    throw new AnimationLibraryError(400, 'Provide a bounded, nonempty list of preset actions');
  }
  const seen = new Set<string>();
  const entries: PresetEntry[] = body.entries.map(value => {
    const entry = objectInput(value, ['actionKey', 'mode', 'animationId']);
    const actionKey = parseAction(entry.actionKey);
    if (seen.has(actionKey)) throw new AnimationLibraryError(400, 'Duplicate preset action');
    seen.add(actionKey);
    if (entry.mode !== 'assigned' && entry.mode !== 'disabled') throw new AnimationLibraryError(400, 'Invalid preset mode');
    if (entry.mode === 'disabled' && entry.animationId != null) throw new AnimationLibraryError(400, 'Disabled actions cannot reference a clip');
    return { actionKey, mode: entry.mode, animationId: entry.mode === 'assigned' ? positiveId(entry.animationId) : null };
  });
  return { name: body.name.trim(), description: typeof body.description === 'string' ? body.description.trim() || null : null, entries };
}

export function parsePresetStrategy(value: unknown): 'fill' | 'replace' {
  if (value !== 'fill' && value !== 'replace') throw new AnimationLibraryError(400, 'Choose fill or replace');
  return value;
}

// Caller supplies owner-validated saved rows and clips. Missing/invalid explicit rows are never empty slots.
export function reviewPreset(entries: PresetEntry[], own: Assignment[], inherited: Assignment[], clips: AvailableClip[], strategy: 'fill' | 'replace') {
  return entries.map(entry => {
    const explicit = own.find(row => row.actionKey === entry.actionKey);
    const parent = inherited.find(row => row.actionKey === entry.actionKey);
    const current = explicit ?? parent ?? null;
    const source = explicit ? 'explicit' : parent ? 'inherited' : 'unmapped';
    const clip = clips.find(row => row.id === entry.animationId);
    const outcome = strategy === 'fill' && current ? 'skip'
      : entry.mode === 'assigned' && (!clip?.isActive || !clip.filePath.trim()) ? 'conflict' : 'apply';
    return { ...entry, current, source, outcome };
  });
}
