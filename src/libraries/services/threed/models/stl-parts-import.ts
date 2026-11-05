import { Box3, BufferAttribute, BufferGeometry, Vector3 } from 'three';
import { MAX_ASSEMBLY_COMPONENTS, parseAssemblyTransform } from './assembly-group-core';
import {
  encodeStlImportGeometry,
  MAX_STL_IMPORT_BYTES,
  parseStlImportGeometry,
  stlGeometryBounds,
  transformStlImportGeometry,
  type StlImportBounds,
  type StlImportInspection,
  type StlImportOptions,
  type StlImportVector,
} from './stl-import';

/** Review remains bounded even for valid STLs containing thousands of disconnected triangles. */
export const MAX_STL_REVIEW_ISLANDS = 1_000;

export interface StlPartIsland {
  /** Stable for the same decoded file; ordered by each island's first triangle. */
  id: string;
  triangleCount: number;
  sourceBounds: StlImportBounds;
  /** Y-up, calibrated Scene coordinates, before local Model normalization. */
  bounds: StlImportBounds;
}

export interface StlPartsInspection extends StlImportOptions {
  source: StlImportInspection;
  bounds: StlImportBounds;
  islands: StlPartIsland[];
}

export interface StlPartGroup {
  id: string;
  label: string;
  islandIds: string[];
}

export interface StlConvertedPart extends StlPartGroup {
  bytes: ArrayBuffer;
  triangleCount: number;
  /** Assembly component translation. Rotation is zero and scale is one. */
  position: StlImportVector;
  /** Source-relative bounds in Y-up Scene coordinates. */
  bounds: StlImportBounds;
  /** Encoded geometry is centered on X/Z and grounded at Y=0. */
  localBounds: StlImportBounds;
}

export interface StlPartsConversion extends StlImportOptions {
  source: StlImportInspection;
  /** Bounds of selected parts in their retained source-relative positions. */
  bounds: StlImportBounds;
  parts: StlConvertedPart[];
  omittedIslandIds: string[];
}

async function yieldForCancellation(signal?: AbortSignal) {
  signal?.throwIfAborted();
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  signal?.throwIfAborted();
}

function snapshotOptions(options: StlImportOptions): StlImportOptions {
  if (!options || !['inches', 'millimetres', 'centimetres', 'metres'].includes(options.units)
    || !['y', 'z'].includes(options.upAxis)) {
    throw new Error('Choose the source STL units and up axis before reviewing parts.');
  }
  return {
    units: options.units,
    upAxis: options.upAxis,
  };
}

function snapshotGroups(groups: StlPartGroup[]): StlPartGroup[] {
  if (!Array.isArray(groups) || groups.length < 1 || groups.length > MAX_ASSEMBLY_COMPONENTS) {
    throw new Error(`Choose between 1 and ${MAX_ASSEMBLY_COMPONENTS} parts. Combine islands into fewer groups if needed.`);
  }
  const ids = new Set<string>();
  const islandIds = new Set<string>();
  return groups.map(group => {
    if (!group || typeof group.id !== 'string' || !group.id.trim() || group.id !== group.id.trim()
      || group.id.length > 128 || ids.has(group.id)) throw new Error('Every reviewed part needs a unique ID.');
    if (typeof group.label !== 'string' || !group.label.trim() || group.label !== group.label.trim()
      || group.label.length > 255) throw new Error('Every reviewed part needs a name of up to 255 characters.');
    if (!Array.isArray(group.islandIds) || group.islandIds.length < 1 || group.islandIds.length > MAX_STL_REVIEW_ISLANDS) {
      throw new Error('Every reviewed part must include at least one detected island.');
    }
    ids.add(group.id);
    const selected = group.islandIds.map(id => {
      if (typeof id !== 'string' || !/^island-[1-9]\d{0,3}$/.test(id)) throw new Error('Unknown STL island. Review this file again.');
      if (islandIds.has(id)) throw new Error('An STL island cannot be included in more than one reviewed part.');
      islandIds.add(id);
      if (islandIds.size > MAX_STL_REVIEW_ISLANDS) throw new Error('Too many STL islands were selected.');
      return id;
    });
    return {
      id: group.id,
      label: group.label,
      islandIds: selected,
    };
  });
}

function boxBounds(box: Box3): StlImportBounds {
  return {
    min: box.min.toArray() as StlImportVector,
    max: box.max.toArray() as StlImportVector,
    size: box.getSize(new Vector3()).toArray() as StlImportVector,
  };
}

interface IslandFaces {
  id: string;
  faces: number[];
  sourceBox: Box3;
}

/** Exact decoded shared-vertex connectivity. Point contacts remain joined; no tolerance weld,
 * edge-only fragmentation, topology repair, or inference of semantic CAD parts occurs.
 */
async function connectedIslands(geometry: BufferGeometry, signal?: AbortSignal): Promise<IslandFaces[]> {
  const positions = geometry.getAttribute('position');
  const count = positions.count / 3;
  const parents = new Uint32Array(count);
  const ranks = new Uint8Array(count);
  for (let face = 0; face < count; face += 1) parents[face] = face;
  const root = (face: number): number => {
    let current = face;
    while (parents[current] !== current) {
      parents[current] = parents[parents[current]];
      current = parents[current];
    }
    return current;
  };
  const join = (first: number, second: number) => {
    let a = root(first);
    let b = root(second);
    if (a === b) return;
    if (ranks[a] < ranks[b]) [a, b] = [b, a];
    parents[b] = a;
    if (ranks[a] === ranks[b]) ranks[a] += 1;
  };
  const vertexOwner = new Map<string, number>();
  for (let face = 0; face < count; face += 1) {
    if (face % 2048 === 0) await yieldForCancellation(signal);
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = face * 3 + corner;
      const key = `${positions.getX(vertex)},${positions.getY(vertex)},${positions.getZ(vertex)}`;
      const owner = vertexOwner.get(key);
      if (owner === undefined) vertexOwner.set(key, face);
      else join(face, owner);
    }
  }
  vertexOwner.clear();
  const islands = new Map<number, IslandFaces>();
  const point = new Vector3();
  for (let face = 0; face < count; face += 1) {
    if (face % 2048 === 0) await yieldForCancellation(signal);
    const identity = root(face);
    let island = islands.get(identity);
    if (!island) {
      if (islands.size >= MAX_STL_REVIEW_ISLANDS) {
        throw new Error(`This STL exceeds ${MAX_STL_REVIEW_ISLANDS.toLocaleString()} disconnected islands. Combine or repair geometry in the source tool, or import it as one Model.`);
      }
      island = {
        id: `island-${islands.size + 1}`,
        faces: [],
        sourceBox: new Box3(),
      };
      islands.set(identity, island);
    }
    island.faces.push(face);
    for (let corner = 0; corner < 3; corner += 1) {
      island.sourceBox.expandByPoint(point.fromBufferAttribute(positions, face * 3 + corner));
    }
  }
  return [...islands.values()];
}

async function boundsForFaces(geometry: BufferGeometry, faces: number[], signal?: AbortSignal) {
  const box = new Box3();
  const point = new Vector3();
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < faces.length; index += 1) {
    if (index % 2048 === 0) await yieldForCancellation(signal);
    for (let corner = 0; corner < 3; corner += 1) {
      box.expandByPoint(point.fromBufferAttribute(positions, faces[index] * 3 + corner));
    }
  }
  return boxBounds(box);
}

async function prepareParts(bytes: ArrayBuffer, options: StlImportOptions, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const parsed = parseStlImportGeometry(bytes, signal);
  try {
    const islandFaces = await connectedIslands(parsed.geometry, signal);
    transformStlImportGeometry(parsed.geometry, options, signal);
    const islands: StlPartIsland[] = [];
    for (const island of islandFaces) {
      islands.push({
        id: island.id,
        triangleCount: island.faces.length,
        sourceBounds: boxBounds(island.sourceBox),
        bounds: await boundsForFaces(parsed.geometry, island.faces, signal),
      });
    }
    const inspection: StlPartsInspection = {
      ...options,
      source: parsed.inspection,
      bounds: stlGeometryBounds(parsed.geometry),
      islands,
    };
    return {
      geometry: parsed.geometry,
      islandFaces,
      inspection,
    };
  } catch (error) {
    parsed.geometry.dispose();
    throw error;
  }
}

/** Local review only. No file upload, database records or persistent geometry resources. */
export async function inspectStlParts(
  bytes: ArrayBuffer,
  options: StlImportOptions,
  signal?: AbortSignal,
): Promise<StlPartsInspection> {
  const prepared = await prepareParts(bytes, snapshotOptions(options), signal);
  try {
    return prepared.inspection;
  } finally {
    prepared.geometry.dispose();
  }
}

async function copyFaces(source: BufferGeometry, faces: number[], position: StlImportVector, signal?: AbortSignal) {
  const geometry = new BufferGeometry();
  try {
    for (const name of ['position', 'normal', 'color']) {
      const attribute = source.getAttribute(name);
      if (!attribute) continue;
      const values = new Float32Array(faces.length * 3 * attribute.itemSize);
      for (let index = 0; index < faces.length; index += 1) {
        if (index % 2048 === 0) await yieldForCancellation(signal);
        for (let corner = 0; corner < 3; corner += 1) {
          for (let axis = 0; axis < attribute.itemSize; axis += 1) {
            const value = attribute.getComponent(faces[index] * 3 + corner, axis);
            values[(index * 3 + corner) * attribute.itemSize + axis] = name === 'position' ? value - position[axis] : value;
          }
        }
      }
      geometry.setAttribute(name, new BufferAttribute(values, attribute.itemSize, attribute.normalized));
    }
    (geometry as BufferGeometry & { alpha?: number }).alpha = (source as BufferGeometry & { alpha?: number }).alpha;
    return geometry;
  } catch (error) {
    geometry.dispose();
    throw error;
  }
}

/** Convert only explicitly reviewed groups. Every included island appears exactly once.
 * Part-local geometry plus returned translations reconstruct the source arrangement,
 * including elevated pieces, without changing ordinary Model grounding behavior.
 */
export async function convertStlParts(
  bytes: ArrayBuffer,
  options: StlImportOptions,
  groups: StlPartGroup[],
  signal?: AbortSignal,
): Promise<StlPartsConversion> {
  const settings = snapshotOptions(options);
  const reviewed = snapshotGroups(groups);
  const prepared = await prepareParts(bytes, settings, signal);
  try {
    const byId = new Map(prepared.islandFaces.map(island => [island.id, island]));
    const selectedIds = new Set(reviewed.flatMap(group => group.islandIds));
    for (const id of selectedIds) if (!byId.has(id)) throw new Error('Unknown STL island. Review this file again.');
    const parts: StlConvertedPart[] = [];
    const selectedBox = new Box3();
    let totalBytes = 0;
    for (const group of reviewed) {
      const faces = group.islandIds.flatMap(id => byId.get(id)!.faces);
      const bounds = await boundsForFaces(prepared.geometry, faces, signal);
      const position: StlImportVector = [
        (bounds.min[0] + bounds.max[0]) / 2,
        bounds.min[1],
        (bounds.min[2] + bounds.max[2]) / 2,
      ];
      parseAssemblyTransform({
        position: {
          x: position[0],
          y: position[1],
          z: position[2],
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0,
        },
        scale: 1,
      });
      const geometry = await copyFaces(prepared.geometry, faces, position, signal);
      try {
        const partBytes = await encodeStlImportGeometry(geometry, settings, signal, {
          ...group,
          position,
        });
        totalBytes += partBytes.byteLength;
        if (totalBytes > MAX_STL_IMPORT_BYTES) throw new Error('The selected GLB parts exceed 32 MiB together. Reduce the source mesh before importing.');
        parts.push({
          ...group,
          bytes: partBytes,
          triangleCount: faces.length,
          position,
          bounds,
          localBounds: stlGeometryBounds(geometry),
        });
        selectedBox.expandByPoint(new Vector3().fromArray(bounds.min));
        selectedBox.expandByPoint(new Vector3().fromArray(bounds.max));
      } finally {
        geometry.dispose();
      }
    }
    signal?.throwIfAborted();
    return {
      ...settings,
      source: prepared.inspection.source,
      bounds: boxBounds(selectedBox),
      parts,
      omittedIslandIds: prepared.inspection.islands.filter(island => !selectedIds.has(island.id)).map(island => island.id),
    };
  } finally {
    prepared.geometry.dispose();
  }
}
