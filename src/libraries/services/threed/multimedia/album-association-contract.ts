import { createHash } from 'node:crypto';
import { InputValidationError, readArray, readChoice, readGuid, readInteger, readRevision, readStrictObject } from '@/libraries/utils/input-validation';

import { albumEntityTables, type AlbumModuleType } from './album-entity-registry';

const albumKinds = Object.keys(albumEntityTables) as AlbumModuleType[];
export type AlbumEntityKind = AlbumModuleType;
export const parseAlbumEntityKind = (value: unknown): AlbumEntityKind => readChoice(value, albumKinds);
export const parseAlbumNumericId = (value: unknown): number => readInteger(value, 1, 2_147_483_647);
export type AlbumEntityId = number | string;

export function parseAlbumEntityId(kind: AlbumEntityKind, value: unknown): AlbumEntityId {
  if (kind === 'assembly') return readGuid(value).toLowerCase();
  return parseAlbumNumericId(typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value);
}
export interface AlbumAssignment {
  albumId: number;
  sortOrder: number;
}

export function parseAlbumAssignment(value: unknown): AlbumAssignment {
  const input = readStrictObject(value, [
    'albumId',
    'sortOrder',
  ]);
  return {
    albumId: parseAlbumNumericId(input.albumId),
    sortOrder: input.sortOrder === undefined ? 0 : readInteger(input.sortOrder, -10000, 10000),
  };
}

export function parseAlbumReplacement(value: unknown) {
  const input = readStrictObject(value, [
    'expectedRevision',
    'assignments',
  ]);
  const assignments = readArray(input.assignments, 100).map(parseAlbumAssignment);
  if (new Set(assignments.map(item => item.albumId)).size !== assignments.length) {
    throw new InputValidationError('Album assignments must be unique.');
  }
  return {
    expectedRevision: readRevision(input.expectedRevision),
    assignments,
  };
}

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
  const request = parseAlbumReplacement(input);
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
