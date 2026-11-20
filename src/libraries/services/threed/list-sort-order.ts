export const SORT_ORDER_LIMIT = 1_000_000;
export const sortOrderError = 'Sort Order must be a whole number between -1,000,000 and 1,000,000.';

export function isSortOrder(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Math.abs(value) <= SORT_ORDER_LIMIT;
}

export function moveRankedRow<Id extends string | number, Row extends { id: Id }>(
  rows: Row[],
  sourceId: Id,
  targetId: Id,
  after: boolean,
): Row[] | null {
  const source = rows.findIndex(row => row.id === sourceId);
  const target = rows.findIndex(row => row.id === targetId);
  if (source < 0 || target < 0) return null;

  const destination = target + Number(after) - Number(source < target);
  if (source === target || source === destination) return rows;

  const reordered = [...rows];
  const [moved] = reordered.splice(source, 1);
  reordered.splice(destination, 0, moved);
  return reordered;
}
