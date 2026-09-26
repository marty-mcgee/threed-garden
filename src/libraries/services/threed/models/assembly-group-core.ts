/** In-memory assembly contract only. Parsing does not authorize asset access. */
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

export interface AssemblyVector { x: number; y: number; z: number }
export interface AssemblyTransform {
  position: AssemblyVector;
  /** Radians, XYZ Euler order; Scene coordinates are Y-up. */
  rotation: AssemblyVector;
  scale: number;
}
export interface AssemblyComponent {
  id: string;
  modelId: number;
  label: string;
  transform: AssemblyTransform;
}
export interface AssemblyDefinition {
  formatVersion: 1;
  id: string;
  ownerId: string;
  name: string;
  revision: number;
  components: AssemblyComponent[];
}
export interface AssemblyPlacement {
  id: string;
  ownerId: string;
  projectId: number;
  assemblyId: string;
  assemblyRevision: number;
  transform: AssemblyTransform;
}
export const MAX_ASSEMBLY_COMPONENTS = 100;

export class AssemblyContractError extends Error {
  constructor(message: string) { super(message); this.name = 'AssemblyContractError'; }
}
function fail(field: string): never { throw new AssemblyContractError(`Invalid assembly ${field}.`); }
function record(value: unknown, keys: string[], field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(field);
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !keys.includes(key))) return fail(field);
  return row;
}
function text(value: unknown, max: number, field: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || value !== value.trim()) return fail(field);
  return value;
}
function id(value: unknown, field: string): string { return text(value, 128, field); }
function positiveId(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) return fail(field);
  return value;
}
function finite(value: unknown, min: number, max: number, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) return fail(field);
  return value;
}
function vector(value: unknown, bound: number, field: string): AssemblyVector {
  const row = record(value, ['x', 'y', 'z'], field);
  return { x: finite(row.x, -bound, bound, field), y: finite(row.y, -bound, bound, field), z: finite(row.z, -bound, bound, field) };
}
export function parseAssemblyTransform(value: unknown): AssemblyTransform {
  const row = record(value, ['position', 'rotation', 'scale'], 'transform');
  return {
    position: vector(row.position, 1_000_000, 'position'),
    rotation: vector(row.rotation, 10_000, 'rotation'),
    scale: finite(row.scale, 0.0001, 10_000, 'scale'),
  };
}
export function parseAssemblyDefinition(value: unknown): AssemblyDefinition {
  const row = record(value, ['formatVersion', 'id', 'ownerId', 'name', 'revision', 'components'], 'definition');
  if (row.formatVersion !== 1) return fail('format version');
  if (!Array.isArray(row.components) || !row.components.length || row.components.length > MAX_ASSEMBLY_COMPONENTS) return fail('components');
  const ids = new Set<string>();
  const components = row.components.map(value => {
    const item = record(value, ['id', 'modelId', 'label', 'transform'], 'component');
    const componentId = id(item.id, 'component ID');
    if (ids.has(componentId)) return fail('duplicate component ID');
    ids.add(componentId);
    return { id: componentId, modelId: positiveId(item.modelId, 'Model ID'), label: text(item.label, 255, 'component label'), transform: parseAssemblyTransform(item.transform) };
  });
  return { formatVersion: 1, id: id(row.id, 'ID'), ownerId: id(row.ownerId, 'owner'), name: text(row.name, 255, 'name'), revision: positiveId(row.revision, 'revision'), components };
}
export function parseAssemblyPlacement(value: unknown): AssemblyPlacement {
  const row = record(value, ['id', 'ownerId', 'projectId', 'assemblyId', 'assemblyRevision', 'transform'], 'placement');
  return { id: id(row.id, 'placement ID'), ownerId: id(row.ownerId, 'placement owner'), projectId: positiveId(row.projectId, 'Project ID'), assemblyId: id(row.assemblyId, 'reference'), assemblyRevision: positiveId(row.assemblyRevision, 'referenced revision'), transform: parseAssemblyTransform(row.transform) };
}
export function serializeAssemblyDefinition(value: unknown): string {
  return JSON.stringify(parseAssemblyDefinition(value));
}
function matrix(transform: AssemblyTransform): Matrix4 {
  const { position: p, rotation: r, scale } = transform;
  return new Matrix4().compose(new Vector3(p.x, p.y, p.z), new Quaternion().setFromEuler(new Euler(r.x, r.y, r.z, 'XYZ')), new Vector3(scale, scale, scale));
}
/** Column-major placement × component matrices. Source Model/mesh transforms
 * remain the asset loader's responsibility and are not applied a second time.
 * No grounding, scene mutation, asset resolution or access authorization occurs.
 */
export function resolveAssemblyComponents(definitionValue: unknown, placementValue: unknown): Array<{
  componentId: string; modelId: number; worldMatrix: number[];
}> {
  const definition = parseAssemblyDefinition(definitionValue);
  const placement = parseAssemblyPlacement(placementValue);
  if (placement.assemblyId !== definition.id || placement.assemblyRevision !== definition.revision) return fail('placement reference or revision');
  const world = matrix(placement.transform);
  return definition.components.map(component => ({
    componentId: component.id, modelId: component.modelId,
    worldMatrix: world.clone().multiply(matrix(component.transform)).toArray(),
  }));
}
