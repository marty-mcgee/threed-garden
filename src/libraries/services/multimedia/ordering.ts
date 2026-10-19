// Existing persisted ordering fields; Media has no manual-order column.
export function multimediaOrdering(kind: string): { sort: string; direction: 'asc' | 'desc' } {
  switch (kind) {
    case 'albums': return { sort: 'sortOrder', direction: 'asc' };
    case 'tracks': return { sort: 'trackNumber', direction: 'asc' };
    case 'links': return { sort: 'displayOrder', direction: 'asc' };
    default: return { sort: 'id', direction: 'desc' };
  }
}
