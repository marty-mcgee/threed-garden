// Existing per-parent persisted ordering fields.
export function multimediaOrdering(kind: string): { sort: string; direction: 'asc' | 'desc' } {
  switch (kind) {
    case 'albums': return { sort: 'sortOrder', direction: 'asc' };
    case 'tracks': return { sort: 'trackNumber', direction: 'asc' };
    case 'media': return { sort: 'sortOrder', direction: 'asc' };
    case 'links': return { sort: 'displayOrder', direction: 'asc' };
    case 'lyrics': return { sort: 'sortOrder', direction: 'asc' };
    default: return { sort: 'id', direction: 'desc' };
  }
}
