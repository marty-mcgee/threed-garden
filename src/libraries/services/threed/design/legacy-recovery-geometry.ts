import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Box3, Euler, Quaternion, Vector3 } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { inspectObjGeometry, MAX_OBJ_BYTES } from '../models/model-obj-core';
import { entityElevation, roofProfile, roundMetres, validateDesign, wallFrame, type DesignDocument, type DesignFloor, type DesignOpening, type DesignRoof } from './document';

type RecordValue = Record<string, unknown>;
type Triple = [number, number, number];
export interface LegacyRecoveryVariant {
  key: string;
  name: string;
  objText: string;
  scale: Triple;
  /** Exact legacy OBJ bounding-box mask dimensions after absolute instance scaling, in metres. */
  maskSize: Triple;
}
export interface LegacyRecoveryPlacement {
  legacyId: string;
  variantKey: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  levelId: string;
}
export interface LegacyRecoveryGeometry {
  variants: LegacyRecoveryVariant[];
  placements: LegacyRecoveryPlacement[];
  warnings: string[];
}

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as RecordValue;
}
function finite(value: unknown, label: string, limit: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > limit) throw new Error(`Invalid ${label}.`);
  return value;
}
function identifier(value: unknown, label: string): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(String(value))) throw new Error(`Invalid ${label}.`);
  return String(value);
}
function rotationQuaternion(rotation: LegacyRecoveryPlacement['rotation']) {
  return new Quaternion().setFromEuler(new Euler(rotation.x, rotation.y, rotation.z, 'XYZ'));
}
const print = (value: number) => String(Object.is(value, -0) ? 0 : value);
const MAX_VARIANTS = 500;
const MAX_GEOMETRY_BYTES = 256 * 1024 * 1024;

/** Offline preparation only: no resource requests, writes, Model registration or Project mutation. */
export async function prepareLegacyRecoveryGeometry(
  plan: unknown,
  catalog: Record<string, unknown>,
  readObj: (name: string) => Promise<string>,
): Promise<LegacyRecoveryGeometry> {
  const input = record(plan, 'Legacy plan'), objects = Object.entries(record(input.threed, 'Legacy catalog placements'));
  const levels = record(input.levels, 'Legacy levels');
  if (objects.length > 1_000) throw new Error('Legacy recovery supports at most 1000 placements.');
  const variants = new Map<string, LegacyRecoveryVariant>(), placements: LegacyRecoveryPlacement[] = [], warnings: string[] = [];
  const sources = new Map<string, { text: string; origin: Triple; size: Triple }>();
  let sourceBytes = 0, outputBytes = 0;
  for (const [sourceId, raw] of objects) {
    const item = record(raw, `Placement ${sourceId}`), legacyId = identifier(item.id, 'legacy placement ID');
    if (sourceId !== legacyId) throw new Error('Legacy placement ID does not match its map key.');
    const name = identifier(item.name, 'legacy catalog name');
    if (!Object.hasOwn(catalog, name)) throw new Error(`Missing legacy catalog entry: ${name}.`);
    record(catalog[name], `Catalog ${name}`);
    const levelId = identifier(item.level, 'legacy level');
    if (!Object.hasOwn(levels, levelId)) throw new Error(`Placement ${legacyId} references a missing level.`);
    const rawScale = record(item.scale, `Placement ${legacyId} scale`);
    const scale: Triple = ['x', 'y', 'z'].map(axis => {
      const value = finite(rawScale[axis], `placement ${legacyId} scale ${axis}`, 10_000);
      if (Math.abs(value) < .0001) throw new Error(`Placement ${legacyId} has a zero or unsupported tiny scale.`);
      return value;
    }) as Triple;
    if (scale[1] < 0) throw new Error(`Placement ${legacyId}: negative Y scale conflicts with current Model grounding.`);
    for (const [field, axis] of [['flipX', 0], ['flipZ', 2]] as const) {
      if (item[field] !== undefined && item[field] !== Math.sign(scale[axis])) throw new Error(`Placement ${legacyId}: ${field} disagrees with the saved scale; resolve its pose before recovery.`);
    }
    const rawPosition = record(item.position, `Placement ${legacyId} position`), rawRotation = record(item.rotation, `Placement ${legacyId} rotation`);
    if (rawRotation._order !== 'XYZ') throw new Error(`Placement ${legacyId}: only recorded XYZ rotations are supported.`);
    const position = { x: finite(rawPosition.x, 'position X', 100_000_000) / 100, y: finite(rawPosition.y, 'position Y', 100_000_000) / 100, z: finite(rawPosition.z, 'position Z', 100_000_000) / 100 };
    const rotation = { x: finite(rawRotation._x, 'rotation X', 10_000), y: finite(rawRotation._y, 'rotation Y', 10_000), z: finite(rawRotation._z, 'rotation Z', 10_000) };
    if (item.angle !== undefined) {
      const yaw = new Quaternion().setFromEuler(new Euler(0, -finite(item.angle, 'legacy angle', 1_000_000) * Math.PI / 180, 0, 'XYZ'));
      if (1 - Math.abs(yaw.dot(rotationQuaternion(rotation))) > 1e-10) warnings.push(`Placement ${legacyId} (${name}): recorded XYZ rotation differs from legacy angle; the recorded XYZ pose is preserved.`);
    }
    const key = `${name}-${createHash('sha256').update(JSON.stringify(scale)).digest('hex').slice(0, 16)}`;
    const existing = variants.get(key);
    if (existing && JSON.stringify(existing.scale) !== JSON.stringify(scale)) throw new Error('Legacy variant key collision.');
    if (!existing) {
      if (variants.size >= MAX_VARIANTS) throw new Error('Legacy recovery supports at most 500 geometry variants.');
      let source = sources.get(name);
      if (!source) {
        const text = inspectObjGeometry(await readObj(name), `${name}.obj`).text;
        const bytes = Buffer.byteLength(text, 'utf8');
        if (sourceBytes + bytes > MAX_GEOMETRY_BYTES) throw new Error('Cached legacy OBJ sources exceed 256 MiB.');
        const object = new OBJLoader().parse(text);
        try {
          const box = new Box3().setFromObject(object), size = box.getSize(new Vector3());
          const origin: Triple = [(box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2];
          if (![...origin, size.x, size.y, size.z].every(Number.isFinite)) throw new Error(`Model ${name} has invalid geometry bounds.`);
          source = { text, origin, size: [size.x, size.y, size.z] };
          sources.set(name, source);
          sourceBytes += bytes;
        } finally {
          object.traverse(child => {
            const resource = child as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] };
            resource.geometry?.dispose();
            if (Array.isArray(resource.material)) resource.material.forEach(material => material.dispose());
            else resource.material?.dispose();
          });
        }
      }
      const reflected = scale[0] * scale[1] * scale[2] < 0;
      const output: string[] = [];
      let variantBytes = 0;
      for (const line of source.text.split('\n')) {
        const [command, ...args] = line.split(/\s+/);
        let transformed = line;
        if (command === 'v') {
          const values = args.slice(0, 3).map((value, axis) => (Math.fround(Number(value)) - source!.origin[axis]) * scale[axis] / 100);
          transformed = `v ${[...values.map(print), ...args.slice(3)].join(' ')}`;
        } else if (command === 'vn') {
          const normal = args.slice(0, 3).map((value, axis) => Math.fround(Number(value)) / scale[axis]), length = Math.hypot(...normal);
          transformed = `vn ${normal.map(value => print(length ? value / length : 0)).join(' ')}`;
        } else if (command === 'f' && reflected) {
          // Keep the fan anchor so triangulation retains the original diagonals after reflection.
          transformed = `f ${[args[0], ...args.slice(1).reverse()].join(' ')}`;
        }
        variantBytes += Buffer.byteLength(transformed, 'utf8') + (output.length ? 1 : 0);
        if (variantBytes > MAX_OBJ_BYTES) throw new Error(`Prepared OBJ ${key} exceeds 32 MiB.`);
        if (outputBytes + variantBytes > MAX_GEOMETRY_BYTES) throw new Error('Prepared legacy OBJ variants exceed 256 MiB.');
        output.push(transformed);
      }
      const objText = output.join('\n');
      inspectObjGeometry(objText, `${key}.obj`);
      variants.set(key, { key, name, objText, scale, maskSize: source.size.map((size, axis) => size * Math.abs(scale[axis]) / 100) as Triple });
      outputBytes += variantBytes;
    }
    placements.push({ legacyId, variantKey: key, name, position, rotation, levelId });
  }
  return { variants: [...variants.values()], placements, warnings };
}

const windowNames = new Set(['window2x3', 'doubleSmallWindow2x3PanesWithSill']);
const doorNames = new Set(['frontDoor', 'bifoldDoor', 'internalDoorOpen']);
/**
 * Recreate only unique, upright, aligned, full-depth rectangular wall apertures.
 * Legacy CSG/floor holes and ambiguous hosts are reported, never approximated.
 */
export function reconstructLegacyOpenings(
  document: DesignDocument,
  plan: unknown,
  catalog: Record<string, unknown>,
  prepared: Pick<LegacyRecoveryGeometry, 'variants' | 'placements'>,
): { document: DesignDocument; warnings: string[]; convertedLegacyIds: string[] } {
  let result = validateDesign(document);
  const input = record(plan, 'Legacy plan'), sourceLevels = record(input.levels, 'Legacy levels');
  const warnings: string[] = [], convertedLegacyIds: string[] = [], variants = new Map(prepared.variants.map(variant => [variant.key, variant]));
  for (const placement of prepared.placements) {
    const info = record(catalog[placement.name], `Catalog ${placement.name}`);
    if (info.useMask !== true) continue;
    const label = `Opening ${placement.legacyId} (${placement.name})`;
    const kind = windowNames.has(placement.name) ? 'window' : doorNames.has(placement.name) ? 'door' : null;
    if (!kind) { warnings.push(`${label}: catalog mask type is not a supported wall opening; floor/roof CSG masks require manual reconstruction.`); continue; }
    const variant = variants.get(placement.variantKey);
    if (!variant) throw new Error(`${label}: prepared geometry is missing.`);
    const [width, height, depth] = variant.maskSize;
    const q = rotationQuaternion(placement.rotation), xAxis = new Vector3(1, 0, 0).applyQuaternion(q), yAxis = new Vector3(0, 1, 0).applyQuaternion(q);
    if (Math.abs(yAxis.x) > 1e-6 || Math.abs(yAxis.z) > 1e-6 || yAxis.y < 1 - 1e-6 || Math.abs(xAxis.y) > 1e-6) { warnings.push(`${label}: tilted masks cannot become a vertical native opening.`); continue; }
    const sourceLevel = record(sourceLevels[placement.levelId], 'Legacy level'), levelElevation = finite(sourceLevel.height, 'legacy level elevation', 100_000_000) / 100;
    const level = result.levels.find(item => item.id === `legacy-level-${placement.levelId}` && Math.abs(item.elevation - levelElevation) < 1e-6);
    if (!level) { warnings.push(`${label}: matching imported level is unavailable; host mapping is required.`); continue; }
    // Legacy masks also cut floors and roofs. A native wall opening cannot reproduce
    // those cuts, so conservatively retain the catalog object if their bounds overlap.
    const halfX = (Math.abs(xAxis.x) * width + Math.abs(xAxis.z) * depth) / 2;
    const halfZ = (Math.abs(xAxis.z) * width + Math.abs(xAxis.x) * depth) / 2;
    const nodes = new Map(result.nodes.map(node => [node.id, node]));
    const overlapsSurface = [...result.floors, ...result.roofs].some((surface: DesignFloor | DesignRoof) => {
      if (surface.levelId !== level.id) return false;
      const points = surface.vertices.map(id => nodes.get(id)!);
      const base = entityElevation(result, surface);
      const low = 'kind' in surface ? base : base - surface.thickness;
      const high = 'kind' in surface ? base + roofProfile(points, surface).rise + surface.thickness : base;
      return placement.position.y < high && placement.position.y + height > low
        && placement.position.x + halfX > Math.min(...points.map(point => point.x))
        && placement.position.x - halfX < Math.max(...points.map(point => point.x))
        && placement.position.z + halfZ > Math.min(...points.map(point => point.z))
        && placement.position.z - halfZ < Math.max(...points.map(point => point.z));
    });
    if (overlapsSurface) { warnings.push(`${label}: mask also overlaps floor/roof bounds; wall-only conversion cannot safely reproduce its CSG cuts.`); continue; }
    const candidates: DesignOpening[] = [];
    let intersected = 0;
    for (const wall of result.walls.filter(wall => wall.levelId === level.id)) {
      const frame = wallFrame(result, wall);
      const projection = frame.project(placement.position);
      const perpendicular = -(placement.position.x - frame.start.x) * frame.dz + (placement.position.z - frame.start.z) * frame.dx;
      const alignment = Math.abs(xAxis.x * frame.dx + xAxis.z * frame.dz);
      const across = Math.abs(-xAxis.x * frame.dz + xAxis.z * frame.dx);
      const projectedHalf = (width * alignment + depth * across) / 2;
      const projectedDepthHalf = (depth * alignment + width * across) / 2;
      const base = entityElevation(result, wall), bottom = placement.position.y;
      if (projection + projectedHalf <= 0 || projection - projectedHalf >= frame.length || Math.abs(perpendicular) >= projectedDepthHalf + wall.thickness / 2 || bottom + height <= base || bottom >= base + Math.max(wall.height, wall.endHeight ?? wall.height)) continue;
      intersected++;
      // A rotated box intersection is a trapezoid; the bounding rectangle is not an exact conversion.
      if (across > 1e-6 || alignment < 1 - 1e-6 || depth / 2 + 1e-6 < Math.abs(perpendicular) + wall.thickness / 2) continue;
      const sill = roundMetres(bottom - base);
      candidates.push({ id: `legacy-opening-${placement.legacyId}`, wallId: wall.id, kind, offset: roundMetres(projection - width / 2), width: roundMetres(width), height: roundMetres(height), sill: Math.abs(sill) <= 1e-6 ? 0 : sill });
    }
    if (intersected !== 1 || candidates.length !== 1) { warnings.push(`${label}: mask intersects ${intersected} walls with ${candidates.length} exact rectangular host matches; explicit host review is required.`); continue; }
    try { result = validateDesign({ ...result, openings: [...result.openings, candidates[0]] }); convertedLegacyIds.push(placement.legacyId); }
    catch (error) { warnings.push(`${label}: ${error instanceof Error ? error.message : 'Native opening validation failed.'}`); }
  }
  if (convertedLegacyIds.length) warnings.push('Native opening recovery replaces the converted catalog placements with the current generic frames/door leaves. Their appearance differs from the legacy Models; review the result.');
  return { document: result, warnings, convertedLegacyIds };
}
