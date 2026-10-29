import { createHash } from 'node:crypto';
import { z } from 'zod';

import { albumEntityTables, type AlbumModuleType } from './album-entity-registry';

export const albumEntityKind = z.enum(Object.keys(albumEntityTables) as [AlbumModuleType, ...AlbumModuleType[]]);
export type AlbumEntityKind = z.infer<typeof albumEntityKind>;
export const albumEntityId = z.number().int().positive().max(2_147_483_647);
export type AlbumEntityId = number | string;

export function parseAlbumEntityId(kind: AlbumEntityKind, value: unknown): AlbumEntityId {
  if (kind === 'assembly') return z.string().uuid().parse(value).toLowerCase();
  return albumEntityId.parse(typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value);
}
export const albumAssignment = z.object({
  albumId: albumEntityId,
  sortOrder: z.number().int().min(-10000).max(10000).default(0),
}).strict();
export const albumReplacement = z.object({
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
  assignments: z.array(albumAssignment).max(100),
}).strict().refine(value => new Set(value.assignments.map(item => item.albumId)).size === value.assignments.length, {
  message: 'Album assignments must be unique.',
});
export type AlbumAssignment = z.infer<typeof albumAssignment>;

export function albumRevision(assignments: readonly AlbumAssignment[]) {
  const normalized = [...assignments]
    .sort((a, b) => a.albumId - b.albumId)
    .map(item => [item.albumId, item.sortOrder]);
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export class AlbumAssociationError extends Error {
  constructor(public readonly status: 403 | 404 | 409, message: string) {
    super(message);
  }
}

export interface AlbumAssociationPort {
  lockEntity: () => Promise<boolean>;
  read: () => Promise<AlbumAssignment[]>;
  lockAlbums: (ids: number[]) => Promise<number[]>;
  remove: (ids: number[]) => Promise<void>;
  put: (assignment: AlbumAssignment) => Promise<void>;
}

/** Must run within one transaction; the entity lock serializes every writer. */
export async function replaceAlbumAssignments(port: AlbumAssociationPort, input: unknown) {
  const request = albumReplacement.parse(input);
  if (!await port.lockEntity()) throw new AlbumAssociationError(404, 'Entity not found.');
  const current = await port.read();
  if (albumRevision(current) !== request.expectedRevision) {
    throw new AlbumAssociationError(409, 'Album assignments changed. Reload before saving; retain your draft.');
  }
  const ids = request.assignments.map(item => item.albumId).sort((a, b) => a - b);
  const allowed = new Set(await port.lockAlbums(ids));
  if (ids.some(id => !allowed.has(id))) throw new AlbumAssociationError(404, 'Album not found.');
  const desired = new Set(ids);
  await port.remove(current.filter(item => !desired.has(item.albumId)).map(item => item.albumId));
  for (const item of request.assignments) {
    if (!current.some(old => old.albumId === item.albumId && old.sortOrder === item.sortOrder)) await port.put(item);
  }
  return { revision: albumRevision(request.assignments) };
}
