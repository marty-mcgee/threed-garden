import { catalogBulkFields, type BulkField, type CatalogBulkResource } from './fields';
import { isSortOrder } from '../list-sort-order';

export class CatalogBulkError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
export type CatalogBulkSelection = {
  id: number;
  expectedUpdatedAt: string | null;
  modelId?: number;
  revision?: number;
  expectedSortOrder?: number;
};
export type CatalogBulkScope = { projectId?: number; modelId?: number };
export type CatalogBulkChanges = Record<string, boolean | string | number | null>;
type VersionedRow = { id: number; updatedAt: Date | string | null; revision?: number; sortOrder?: number };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function id(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 2147483647) {
    throw new CatalogBulkError('Invalid record ID or revision.');
  }
  return value;
}
export function parseBulkScope(resource: CatalogBulkResource, params: URLSearchParams): CatalogBulkScope {
  const allowed = resource === 'model-files' ? 'modelId'
    : resource === 'scenarios' || resource === 'simulations' ? 'projectId' : undefined;
  const scope: CatalogBulkScope = {};
  for (const [key, value] of params) {
    if (!allowed || key !== allowed || Object.hasOwn(scope, key) || !/^\d+$/.test(value)) {
      throw new CatalogBulkError('Invalid Bulk Edit scope.');
    }
    scope[allowed] = id(Number(value));
  }
  return scope;
}

export function parseBulkRequest(resource: CatalogBulkResource, input: unknown) {
  if (!object(input) || input.action !== 'set' || Object.keys(input).some(key => !['action', 'selection', 'changes'].includes(key))
    || !Array.isArray(input.selection) || !input.selection.length || input.selection.length > 200) {
    throw new CatalogBulkError('Select between 1 and 200 records on this page.');
  }
  const ids = new Set<number>();
  const setsRank = resource === 'plantings' && object(input.changes) && Object.hasOwn(input.changes, 'sortOrder');
  const selection = input.selection.map((entry): CatalogBulkSelection => {
    const keys = ['id', 'expectedUpdatedAt'];
    if (resource === 'model-files') keys.push('modelId');
    if (resource === 'simulations') keys.push('revision');
    if (setsRank) keys.push('expectedSortOrder');
    if (!object(entry) || Object.keys(entry).some(key => !keys.includes(key))) throw new CatalogBulkError('Invalid selection.');
    const recordId = id(entry.id);
    if (ids.has(recordId)) throw new CatalogBulkError('Select each record only once.');
    ids.add(recordId);
    const stamp = entry.expectedUpdatedAt;
    if (setsRank && !isSortOrder(entry.expectedSortOrder)) throw new CatalogBulkError('Refresh the selected Planting ranks.');
    if (stamp !== null && (typeof stamp !== 'string' || !Number.isFinite(Date.parse(stamp)) || new Date(stamp).toISOString() !== stamp)) {
      throw new CatalogBulkError('Invalid record timestamp.');
    }
    return {
      id: recordId,
      expectedUpdatedAt: stamp,
      ...(resource === 'model-files' && { modelId: id(entry.modelId) }),
      ...(resource === 'simulations' && { revision: id(entry.revision) }),
      ...(setsRank && isSortOrder(entry.expectedSortOrder) && { expectedSortOrder: entry.expectedSortOrder }),
    };
  });
  const raw = input.changes;
  if (!object(raw) || !Object.keys(raw).length) throw new CatalogBulkError('Choose a field to change.');
  const changes: CatalogBulkChanges = {};
  const names = new Map<number, string>();
  if (resource === 'animation-categories') {
    if (Object.keys(raw).length !== 1 || !object(raw.names) || !Object.keys(raw.names).length) {
      throw new CatalogBulkError('Enter a new Category name for at least one selected record.');
    }
    for (const [key, value] of Object.entries(raw.names)) {
      if (!ids.has(Number(key)) || key !== String(Number(key)) || typeof value !== 'string' || !value.trim() || value.trim().length > 120) {
        throw new CatalogBulkError('Each new Category name must identify a selected record and contain 1–120 characters.');
      }
      names.set(Number(key), value.trim());
    }
  } else {
    const fields: readonly BulkField[] = catalogBulkFields[resource];
    for (const [key, value] of Object.entries(raw)) {
      const field = fields.find(option => option.key === key);
      if (!field) throw new CatalogBulkError('This field cannot be bulk edited.');
      if (field.kind === 'boolean' && typeof value === 'boolean') changes[key] = value;
      else if (field.kind === 'choice' && typeof value === 'string' && field.options.some(option => option.value === value)) changes[key] = value;
      else if (field.kind === 'integer' && typeof value === 'number' && Number.isInteger(value) && value >= field.min && value <= field.max) changes[key] = value;
      else if (field.kind === 'text' && (value === null || (typeof value === 'string' && value.trim().length <= field.max))) changes[key] = value?.trim() || null;
      else throw new CatalogBulkError(`Invalid value for ${field.label}.`);
    }
  }
  return { selection, changes, names };
}

export function checkBulkStamps(selection: CatalogBulkSelection[], rows: VersionedRow[]) {
  const byId = new Map(rows.map(row => [row.id, row]));
  if (rows.length !== selection.length || selection.some(item => !byId.has(item.id))) {
    throw new CatalogBulkError('A selected record is unavailable. Refresh the list and select again.', 404);
  }
  for (const item of selection) {
    const row = byId.get(item.id)!;
    const stamp = row.updatedAt === null ? null : new Date(row.updatedAt).toISOString();
    if (item.expectedUpdatedAt !== stamp || (item.revision !== undefined && item.revision !== row.revision)
      || (item.expectedSortOrder !== undefined && item.expectedSortOrder !== row.sortOrder)) {
      throw new CatalogBulkError('A selected record changed. Refresh the list and select again.', 409);
    }
  }
}
export function nextBulkTimestamp(rows: VersionedRow[]) {
  return new Date(Math.max(Date.now(), ...rows.map(row => row.updatedAt === null ? 0 : new Date(row.updatedAt).getTime() + 1)));
}
