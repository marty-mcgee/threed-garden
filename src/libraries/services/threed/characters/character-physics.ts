export const CHARACTER_PHYSICS_FIELDS = {
  mass: { label: 'Mass', min: 0.05, max: 100, default: Math.PI * 0.3 * 0.3 * 1.2 + 4 / 3 * Math.PI * 0.3 ** 3, step: 0.05 },
  walkSpeed: { label: 'Walk speed', min: 0.1, max: 10, default: 2, step: 0.1 },
  runSpeed: { label: 'Run speed', min: 0.1, max: 20, default: 3.5, step: 0.1 },
  jumpSpeed: { label: 'Jump strength', min: 0, max: 15, default: 5, step: 0.1 },
  clearance: { label: 'Ground clearance', min: 0.02, max: 0.3, default: 0.05, step: 0.01 },
} as const;
export type CharacterPhysics = Record<keyof typeof CHARACTER_PHYSICS_FIELDS, number>;
export function resolveCharacterPhysics(value: unknown): CharacterPhysics {
 const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
 return Object.fromEntries(Object.entries(CHARACTER_PHYSICS_FIELDS).map(([key, field]) => {
  const n = source[key];
  return [key, typeof n === 'number' && Number.isFinite(n) && n >= field.min && n <= field.max ? n : field.default];
 })) as CharacterPhysics;
}
