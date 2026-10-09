import { validateDesign, type DesignDocument } from './document';

export const MAX_DESIGN_BYTES = 1024 * 1024;
export class DesignRequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function designId(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) throw new DesignRequestError('Invalid design, Project or revision ID.');
  return Number(value);
}
export function designInput(value: unknown, updating: boolean) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DesignRequestError('Expected a ThreeD Design request.');
  const input = value as Record<string, unknown>;
  const allowed = updating ? ['id', 'revision', 'document'] : ['createKey', 'projectId', 'document'];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new DesignRequestError('Unsupported ThreeD Design request fields.');
  let document: DesignDocument;
  try { document = validateDesign(input.document); } catch (error) { throw new DesignRequestError((error as Error).message); }
  if (new TextEncoder().encode(JSON.stringify(document)).length > MAX_DESIGN_BYTES) throw new DesignRequestError('Design JSON must be at most 1 MiB.');
  if (updating) return { document, id: designId(input.id), revision: designId(input.revision), projectId: null, createKey: '' };
  if (typeof input.createKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.createKey)) throw new DesignRequestError('Invalid creation key.');
  return { document, projectId: input.projectId === null || input.projectId === undefined ? null : designId(input.projectId), createKey: input.createKey, id: 0, revision: 0 };
}
export interface SavedDesign { id: number; revision: number; projectId: number | null; document: DesignDocument }
export interface DesignSummary { id: number; name: string; revision: number; projectId: number | null }
export function savedDesign(value: unknown): SavedDesign {
  const row = value as SavedDesign | null;
  if (!row || typeof row !== 'object') throw new Error('Invalid saved ThreeD Design response.');
  return { id: designId(row.id), revision: designId(row.revision), projectId: row.projectId === null ? null : designId(row.projectId), document: validateDesign(row.document) };
}
