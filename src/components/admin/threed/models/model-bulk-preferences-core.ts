import type { BulkDefaults } from './model-bulk-preparation-core';

const PREFERENCES_VERSION = 1;
const MAX_PREFERENCES_LENGTH = 8 * 1024;

/** Optional shortcuts; these do not infer units or replace the numeric input. */
export const BULK_SCALE_PRESETS = [
  { label: '1%', value: '0.01' },
  { label: '2%', value: '0.02' },
  { label: '100%', value: '1' },
] as const;

/** Call only with the authenticated user ID, never an email or access token. */
export function createBulkPreferencesStorageKey(userId: string | null | undefined): string | null {
  if (typeof userId !== 'string' || !userId || userId.length > 256
    || userId.trim() !== userId || /[\u0000-\u001f\u007f]/.test(userId)) return null;
  try {
    return `threed-model-bulk-preferences:v${PREFERENCES_VERSION}:${encodeURIComponent(userId)}`;
  } catch { return null }
}

function positiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function validatedDefaults(value: unknown): BulkDefaults | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const settings = value as Record<string, unknown>;
  if (typeof settings.scale !== 'string' || settings.scale.length > 64 || !settings.scale.trim()
    || !Number.isFinite(Number(settings.scale)) || Number(settings.scale) < 0.01) return null;
  if (typeof settings.isLibraryItem !== 'boolean' || typeof settings.isPublic !== 'boolean'
    || typeof settings.usedByPlants !== 'boolean' || typeof settings.usedByCharacters !== 'boolean'
    || typeof settings.isActive !== 'boolean') return null;
  if (!Array.isArray(settings.categoryIds) || settings.categoryIds.length > 50
    || !Array.from(settings.categoryIds).every(positiveId)
    || new Set(settings.categoryIds).size !== settings.categoryIds.length) return null;
  if (settings.existingTextureId !== null && !positiveId(settings.existingTextureId)) return null;
  // Explicitly copy the whitelist: drafts, files and unknown properties never persist.
  return {
    scale: settings.scale,
    categoryIds: [...settings.categoryIds],
    isLibraryItem: settings.isLibraryItem,
    isPublic: settings.isPublic,
    usedByPlants: settings.usedByPlants,
    usedByCharacters: settings.usedByCharacters,
    isActive: settings.isActive,
    existingTextureId: settings.existingTextureId,
  };
}

/** Stored IDs still require reconciliation with the current owner's active catalogs. */
export function readBulkPreferences(raw: string | null): BulkDefaults | null {
  if (!raw || raw.length > MAX_PREFERENCES_LENGTH) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const envelope = parsed as Record<string, unknown>;
    return envelope.version === PREFERENCES_VERSION ? validatedDefaults(envelope.defaults) : null;
  } catch { return null }
}

/** A null result must leave any previously saved, valid preferences untouched. */
export function serializeBulkPreferences(defaults: BulkDefaults): string | null {
  const validated = validatedDefaults(defaults);
  return validated ? JSON.stringify({ version: PREFERENCES_VERSION, defaults: validated }) : null;
}
