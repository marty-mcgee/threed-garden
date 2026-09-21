type Position = { x: number; y: number; z: number };

// Compare the same millimetric precision persisted by Project marker writes.
export function characterSpawnsOverlap(a: Position, b: Position): boolean {
  const rounded = (value: number) => Number(value.toFixed(3));
  return Math.hypot(rounded(a.x) - rounded(b.x), rounded(a.z) - rounded(b.z)) < 0.5
    && Math.abs(rounded(a.y) - rounded(b.y)) < 3;
}
