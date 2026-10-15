export const CHARACTER_PHYSICS_FIELDS = {
  mass: { label: 'Mass', min: 0.05, max: 100, default: Math.PI * 0.3 * 0.3 * 1.2 + 4 / 3 * Math.PI * 0.3 ** 3, step: 0.05 },
  walkSpeed: { label: 'Walk speed', min: 0.1, max: 10, default: 2, step: 0.1 },
  runSpeed: { label: 'Run speed', min: 0.1, max: 20, default: 3.5, step: 0.1 },
  jumpSpeed: { label: 'Jump strength', min: 0, max: 15, default: 5, step: 0.1 },
  clearance: { label: 'Ground clearance', min: 0.02, max: 0.3, default: 0.05, step: 0.01 },
} as const;
export type CharacterPhysics = Record<keyof typeof CHARACTER_PHYSICS_FIELDS, number>;
export type CharacterPhysicsSettings = CharacterPhysics | {
 version: 1;
 units: 'metres';
 // Records the calibration used for this explicit, behavior-preserving conversion.
 metresPerSceneUnit: number;
 values: CharacterPhysics;
};
export class CharacterPhysicsInputError extends Error {}

export function parseCharacterPhysicsSettings(value: unknown, projectMetresPerSceneUnit?: number): CharacterPhysicsSettings {
 const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
 if (!source) throw new CharacterPhysicsInputError('Character physics must be an object.');
 const physical = 'version' in source || 'units' in source || 'values' in source;
 let factor = 1;
 let values = source;
 if (physical) {
  if (source.version !== 1 || source.units !== 'metres' || typeof source.metresPerSceneUnit !== 'number' || !Number.isFinite(source.metresPerSceneUnit) || source.metresPerSceneUnit <= 0) {
   throw new CharacterPhysicsInputError('Unsupported Character physics units or version.');
  }
  factor = source.metresPerSceneUnit;
  if (projectMetresPerSceneUnit !== undefined && factor !== projectMetresPerSceneUnit) {
   throw new CharacterPhysicsInputError('Project calibration changed. Reload the Character settings before saving.');
  }
  if (!source.values || typeof source.values !== 'object' || Array.isArray(source.values)) throw new CharacterPhysicsInputError('Missing Character physics values.');
  values = source.values as Record<string, unknown>;
 }
 const parsed = {} as CharacterPhysics;
 for (const [key, field] of Object.entries(CHARACTER_PHYSICS_FIELDS)) {
  const n = values[key];
  const scale = key === 'mass' ? 1 : factor;
  // Validate in display units to avoid a multiply/divide rounding rejection at endpoints.
  if (!Number.isFinite(field.max * scale) || (field.min > 0 && field.min * scale === 0)
    || typeof n !== 'number' || !Number.isFinite(n) || !Number.isFinite(n / scale) || n < field.min * scale || n > field.max * scale) {
   throw new CharacterPhysicsInputError(`Invalid Character physics ${key}.`);
  }
  parsed[key as keyof CharacterPhysics] = n;
 }
 return physical ? { version: 1, units: 'metres', metresPerSceneUnit: factor, values: parsed } : parsed;
}

export function convertCharacterPhysicsToMetres(value: unknown, metresPerSceneUnit: number): CharacterPhysicsSettings {
 if (!Number.isFinite(metresPerSceneUnit) || metresPerSceneUnit <= 0) throw new CharacterPhysicsInputError('Project calibration must be positive and finite.');
 if (value && typeof value === 'object' && ('version' in value || 'units' in value || 'values' in value)) return parseCharacterPhysicsSettings(value, metresPerSceneUnit);
 const legacy = resolveCharacterPhysics(value);
 const values = Object.fromEntries(Object.entries(legacy).map(([key, n]) => [key, key === 'mass' ? n : n * metresPerSceneUnit])) as CharacterPhysics;
 return parseCharacterPhysicsSettings({ version: 1, units: 'metres', metresPerSceneUnit, values }, metresPerSceneUnit);
}

export function resolveCharacterPhysics(value: unknown): CharacterPhysics {
 let source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
 if ('version' in source || 'units' in source || 'values' in source) {
  try {
   const stored = parseCharacterPhysicsSettings(source);
   if ('version' in stored) {
    return Object.fromEntries(Object.entries(stored.values).map(([key, n]) => {
     const field = CHARACTER_PHYSICS_FIELDS[key as keyof CharacterPhysics];
     return [key, Math.min(field.max, Math.max(field.min, key === 'mass' ? n : n / stored.metresPerSceneUnit))];
    })) as CharacterPhysics;
   }
  } catch { source = {}; } // Malformed stored data uses established legacy defaults; writes reject it.
 }
 return Object.fromEntries(Object.entries(CHARACTER_PHYSICS_FIELDS).map(([key, field]) => {
  const n = source[key];
  return [key, typeof n === 'number' && Number.isFinite(n) && n >= field.min && n <= field.max ? n : field.default];
 })) as CharacterPhysics;
}
