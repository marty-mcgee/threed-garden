// @ts-expect-error Native Node validation requires the explicit TypeScript extension.
import { CHARACTER_SPAWN_CLEARANCE } from '../characters/character-controller-dimensions.ts';

type Position = { x: number; y: number; z: number };

// Compare the same millimetric precision persisted by Project marker writes.
export function characterSpawnsOverlap(a: Position, b: Position): boolean {
  // Integer millimetres keep touching boundaries consistent with SQL numeric
  // arithmetic, including nonzero origins such as 1.4 - 0.8.
  const rounded = (value: number) => Math.round(Number(value.toFixed(3)) * 1000);
  const dx = rounded(a.x) - rounded(b.x);
  const dz = rounded(a.z) - rounded(b.z);
  return dx * dx + dz * dz < (CHARACTER_SPAWN_CLEARANCE * 1000) ** 2
    && Math.abs(rounded(a.y) - rounded(b.y)) < 3000;
}
