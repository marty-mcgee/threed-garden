export interface BedPlantingGeometry {
  x: number; y: number; z: number;
  width: number; length: number; height: number; rotation: number;
}
export interface PlantingPoint { x: number; y: number; z: number }

/** Match the rendered rectangular soil surface; all dimensions are Scene feet. */
export function bedPlantingGeometry(position: PlantingPoint, data: Record<string, unknown>): BedPlantingGeometry {
  const scale = Math.max(Number(data.scale) || 1, 0.01);
  const geometry = {
    ...position,
    width: Math.max(Number(data.widthFeet ?? data.width) || 4, 0.1) * scale,
    length: Math.max(Number(data.lengthFeet ?? data.length ?? data.depth) || 8, 0.1) * scale,
    height: Math.max(Number(data.heightFeet) || 0.3, 0.1) * scale,
    rotation: (Number(data.rotation) || 0) * Math.PI / 180,
  };
  if (!Object.values(geometry).every(Number.isFinite)) throw new Error('Invalid Bed geometry');
  return geometry;
}
export function bedLocalPoint(bed: BedPlantingGeometry, point: PlantingPoint) {
  const dx = point.x - bed.x, dz = point.z - bed.z;
  return { x: Math.cos(bed.rotation) * dx - Math.sin(bed.rotation) * dz,
    z: Math.sin(bed.rotation) * dx + Math.cos(bed.rotation) * dz };
}
export function bedWorldPoint(bed: BedPlantingGeometry, point: { x: number; z: number }): PlantingPoint {
  return { x: bed.x + Math.cos(bed.rotation) * point.x + Math.sin(bed.rotation) * point.z,
    y: bed.y + bed.height + 0.01,
    z: bed.z - Math.sin(bed.rotation) * point.x + Math.cos(bed.rotation) * point.z };
}
/** Shift a complete layout together; reject overflow instead of stacking at edges. */
export function containBedPlantings(bed: BedPlantingGeometry, points: readonly PlantingPoint[]): PlantingPoint[] {
  if (!points.length) return [];
  if (points.some(point => !Object.values(point).every(Number.isFinite))) throw new Error('Invalid Planting position');
  const local = points.map(point => bedLocalPoint(bed, point));
  const minX = Math.min(...local.map(p => p.x)), maxX = Math.max(...local.map(p => p.x));
  const minZ = Math.min(...local.map(p => p.z)), maxZ = Math.max(...local.map(p => p.z));
  // A tiny root inset keeps rounded database coordinates on the soil side of the border.
  const halfX = Math.max(bed.width / 2 - 0.01, 0), halfZ = Math.max(bed.length / 2 - 0.01, 0);
  if (maxX - minX > halfX * 2 + 1e-8 || maxZ - minZ > halfZ * 2 + 1e-8) {
    throw new Error('Planting layout does not fit the assigned Bed. Reduce quantity or spacing.');
  }
  const shiftX = Math.max(-halfX - minX, Math.min(0, halfX - maxX));
  const shiftZ = Math.max(-halfZ - minZ, Math.min(0, halfZ - maxZ));
  return local.map(point => bedWorldPoint(bed, { x: point.x + shiftX, z: point.z + shiftZ }));
}

/** The caller supplies only the current Project's runtime marker collection. */
export function assignedBedPlantings<T extends {type:string;isActive?:boolean;data?:{id?:unknown;bedId?:unknown}}>(bedId: unknown, markers: readonly T[]): T[] {
  const id = Number(bedId);
  if (!Number.isSafeInteger(id) || id <= 0) return [];
  return markers.filter(marker => marker.type === 'plantings' && marker.isActive !== false && Number(marker.data?.bedId) === id);
}

/** Explicit Project overrides, including unassignment, take precedence over reusable sources. */
export function resolvePlantingBedId(data: Record<string, unknown>, sourceBedId: unknown): number | null {
  const value = Object.prototype.hasOwnProperty.call(data, 'bedId') ? data.bedId : sourceBedId;
  if (value == null) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid assigned Bed');
  return id;
}
