/** Matches attachment texture roles in schema/threed and upload classification. */
// @ts-expect-error Native offline validation requires an explicit extension.
import { THREED_MODEL_MATERIAL_CHANNELS } from './model-material-override-core.ts';
export const MODEL_FILE_TEXTURE_TYPES = THREED_MODEL_MATERIAL_CHANNELS;
export const MAX_MODEL_FILE_LOAD_ORDER = 2_147_483_647; // PostgreSQL integer

export function parseModelFileEdit(input: unknown): { loadOrder?: number; textureType?: string | null } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid File edit');
  const body = input as Record<string, unknown>;
  if (!Object.keys(body).length || Object.keys(body).some(key => !['loadOrder', 'textureType'].includes(key))) {
    throw new Error('Only loadOrder and textureType may be edited');
  }
  if ('loadOrder' in body && (typeof body.loadOrder !== 'number' || !Number.isInteger(body.loadOrder)
    || body.loadOrder < 0 || body.loadOrder > MAX_MODEL_FILE_LOAD_ORDER)) throw new Error('Load order must be a nonnegative PostgreSQL integer');
  if ('textureType' in body && body.textureType !== null
    && !MODEL_FILE_TEXTURE_TYPES.some(value => value === body.textureType)) throw new Error('Unsupported Texture type');
  return { ...('loadOrder' in body ? { loadOrder: body.loadOrder as number } : {}),
    ...('textureType' in body ? { textureType: body.textureType as string | null } : {}) };
}
