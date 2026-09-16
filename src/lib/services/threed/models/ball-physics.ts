/** Project-instance settings; invalid saved values fall back to bounded defaults. */
export const BALL_PHYSICS_FIELDS = {
  mass: { label: 'Mass', min: 0.05, max: 100, default: 1, step: 0.05 },
  gravityScale: { label: 'Gravity multiplier', min: 0.1, max: 5, default: 1, step: 0.1 },
  friction: { label: 'Friction', min: 0, max: 2, default: 0.8, step: 0.1 },
  restitution: { label: 'Bounce', min: 0, max: 1, default: 0.2, step: 0.05 },
  damping: { label: 'Rolling resistance', min: 0, max: 10, default: 1.5, step: 0.1 },
} as const;
export type BallPhysics = Record<keyof typeof BALL_PHYSICS_FIELDS, number>;
export function resolveBallPhysics(value: unknown): BallPhysics {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(BALL_PHYSICS_FIELDS).map(([key, field]) => {
    const n = source[key];
    return [key, typeof n === 'number' && Number.isFinite(n) && n >= field.min && n <= field.max ? n : field.default];
  })) as BallPhysics;
}
