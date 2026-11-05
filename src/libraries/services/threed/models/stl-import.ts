import { BufferGeometry, DoubleSide, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { DEFAULT_THREED_METERS_PER_SCENE_UNIT } from '../markers/map-coordinate-core';
import { MAX_THREED_DIRECT_MODEL_BYTES } from './model-upload-policy-core';

export const MAX_STL_IMPORT_BYTES = MAX_THREED_DIRECT_MODEL_BYTES;
export const MAX_STL_IMPORT_TRIANGLES = 250_000;

export type StlImportUnits = 'inches' | 'millimetres' | 'centimetres' | 'metres';
export type StlImportUpAxis = 'y' | 'z';
export type StlImportVector = [number, number, number];

export interface StlImportBounds {
  min: StlImportVector;
  max: StlImportVector;
  size: StlImportVector;
}

export interface StlImportInspection {
  format: 'ascii' | 'binary';
  triangleCount: number;
  hasColors: boolean;
  bounds: StlImportBounds;
}

export interface StlImportOptions {
  units: StlImportUnits;
  upAxis: StlImportUpAxis;
}

export interface StlImportConversion extends StlImportOptions {
  bytes: ArrayBuffer;
  source: StlImportInspection;
  /** The encoded geometry uses the App's existing Scene units, with Y up. */
  bounds: StlImportBounds;
  metresSize: StlImportVector;
  sceneSize: StlImportVector;
}

const metresPerSourceUnit = {
  inches: 0.0254,
  millimetres: 0.001,
  centimetres: 0.01,
  metres: 1,
} as const;

const numberPattern = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const vectorPattern = `(${numberPattern})\\s+(${numberPattern})\\s+(${numberPattern})`;
const facetPattern = new RegExp(
  `facet\\s+normal\\s+${vectorPattern}\\s+outer\\s+loop\\s+`
  + `vertex\\s+${vectorPattern}\\s+vertex\\s+${vectorPattern}\\s+vertex\\s+${vectorPattern}`
  + '\\s+endloop\\s+endfacet(?=\\s|$)',
  'y',
);

function checkTriangleCount(count: number) {
  if (count < 1) throw new Error('The STL contains no triangles.');
  if (count > MAX_STL_IMPORT_TRIANGLES) {
    throw new Error(`STL import supports up to ${MAX_STL_IMPORT_TRIANGLES.toLocaleString()} triangles. Reduce the mesh before importing.`);
  }
}

/** Validate the complete ASCII grammar before the permissive STLLoader can omit malformed faces. */
function validateAscii(text: string, signal?: AbortSignal): { bytes: ArrayBuffer; triangleCount: number } {
  let cursor = 0;
  let triangleCount = 0;
  let solidCount = 0;
  const normalized: string[] = [];
  const whitespace = /\s*/y;
  const solidStart = /solid(?:[ \t]+[^\r\n]*)?(?:\r?\n|$)/y;
  const solidEnd = /endsolid(?:[ \t]+[^\r\n]*)?(?:\r?\n|$)/y;
  const skipWhitespace = () => {
    whitespace.lastIndex = cursor;
    whitespace.exec(text);
    cursor = whitespace.lastIndex;
  };
  skipWhitespace();
  while (cursor < text.length) {
    signal?.throwIfAborted();
    solidStart.lastIndex = cursor;
    if (!solidStart.exec(text)) throw new Error('Invalid ASCII STL: expected a solid header.');
    cursor = solidStart.lastIndex;
    solidCount += 1;
    // Source solid names are free text; normalize them so loader keywords inside names cannot alter parsing.
    normalized.push(`solid part_${solidCount}\n`);
    skipWhitespace();
    while (text.startsWith('facet', cursor)) {
      facetPattern.lastIndex = cursor;
      const facet = facetPattern.exec(text);
      if (!facet || facet.slice(1).some(value => !Number.isFinite(Math.fround(Number(value))))) {
        throw new Error('Invalid ASCII STL: every triangle needs one finite normal and three finite vertices.');
      }
      triangleCount += 1;
      checkTriangleCount(triangleCount);
      if (triangleCount % 1024 === 0) signal?.throwIfAborted();
      normalized.push(`${facet[0]}\n`);
      cursor = facetPattern.lastIndex;
      skipWhitespace();
    }
    solidEnd.lastIndex = cursor;
    if (!solidEnd.exec(text)) throw new Error('Invalid ASCII STL: incomplete triangle or missing endsolid.');
    cursor = solidEnd.lastIndex;
    normalized.push(`endsolid part_${solidCount}\n`);
    skipWhitespace();
  }
  checkTriangleCount(triangleCount);
  return {
    bytes: new TextEncoder().encode(normalized.join('')).buffer,
    triangleCount,
  };
}

function preflight(bytes: ArrayBuffer, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength === 0) throw new Error('Choose a non-empty STL file.');
  if (bytes.byteLength > MAX_STL_IMPORT_BYTES) throw new Error('STL import supports files up to 32 MiB.');
  if (bytes.byteLength >= 84) {
    const view = new DataView(bytes);
    const triangleCount = view.getUint32(80, true);
    // Exact binary length wins, including valid binary headers that happen to begin with "solid".
    if (84 + triangleCount * 50 === bytes.byteLength) {
      checkTriangleCount(triangleCount);
      for (let face = 0; face < triangleCount; face += 1) {
        if (face % 1024 === 0) signal?.throwIfAborted();
        for (let component = 0; component < 12; component += 1) {
          if (!Number.isFinite(view.getFloat32(84 + face * 50 + component * 4, true))) {
            throw new Error('Invalid binary STL: normals and vertices must be finite.');
          }
        }
      }
      return {
        format: 'binary' as const,
        triangleCount,
        bytes,
      };
    }
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Invalid STL: the binary triangle count or file length is incorrect.');
  }
  if (!/^\s*solid(?:\s|$)/.test(text) || /\x00/.test(text)) {
    throw new Error('Invalid STL: expected a complete ASCII or binary STL file.');
  }
  return {
    format: 'ascii' as const,
    ...validateAscii(text, signal),
  };
}

function boundsOf(geometry: BufferGeometry): StlImportBounds {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  return {
    min: box.min.toArray() as StlImportVector,
    max: box.max.toArray() as StlImportVector,
    size: box.getSize(new Vector3()).toArray() as StlImportVector,
  };
}

function checkGeometry(geometry: BufferGeometry, triangleCount: number, signal?: AbortSignal, rebuildNormals = false) {
  const positions = geometry.getAttribute('position');
  if (!positions || positions.count !== triangleCount * 3) {
    throw new Error('The STL could not be decoded without losing triangles.');
  }
  const edgeA = new Vector3();
  const edgeB = new Vector3();
  const origin = new Vector3();
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    if (vertex % 3072 === 0) signal?.throwIfAborted();
    origin.fromBufferAttribute(positions, vertex);
    edgeA.fromBufferAttribute(positions, vertex + 1).sub(origin);
    edgeB.fromBufferAttribute(positions, vertex + 2).sub(origin);
    edgeA.cross(edgeB);
    if (!Number.isFinite(edgeA.lengthSq()) || edgeA.lengthSq() === 0) {
      throw new Error('The STL contains a degenerate or out-of-range triangle. Repair the source mesh before importing.');
    }
    if (rebuildNormals) {
      // Normalize before storing float32 attributes, including very small but valid CAD faces.
      edgeA.normalize();
      const normals = geometry.getAttribute('normal');
      for (let offset = 0; offset < 3; offset += 1) normals.setXYZ(vertex + offset, edgeA.x, edgeA.y, edgeA.z);
    }
  }
}

function parseValidated(bytes: ArrayBuffer, signal?: AbortSignal) {
  const checked = preflight(bytes, signal);
  const geometry = new STLLoader().parse(checked.bytes);
  try {
    checkGeometry(geometry, checked.triangleCount, signal);
    const inspection: StlImportInspection = {
      format: checked.format,
      triangleCount: checked.triangleCount,
      hasColors: geometry.hasAttribute('color'),
      bounds: boundsOf(geometry),
    };
    return {
      geometry,
      inspection,
    };
  } catch (error) {
    geometry.dispose();
    throw error;
  }
}

/** Local inspection only: no URLs, storage writes, Model records or persistent resources. */
export function inspectStlImport(bytes: ArrayBuffer, signal?: AbortSignal): StlImportInspection {
  const parsed = parseValidated(bytes, signal);
  try {
    return parsed.inspection;
  } finally {
    parsed.geometry.dispose();
  }
}

/** Encode a complete, Y-up GLB for the existing ThreeD Model upload and Scene-unit renderer. */
export async function convertStlImport(
  bytes: ArrayBuffer,
  options: StlImportOptions,
  signal?: AbortSignal,
): Promise<StlImportConversion> {
  signal?.throwIfAborted();
  if (!Object.hasOwn(metresPerSourceUnit, options.units) || !['y', 'z'].includes(options.upAxis)) {
    throw new Error('Choose the source STL units and up axis before converting.');
  }
  const { geometry, inspection } = parseValidated(bytes, signal);
  let material: MeshStandardMaterial | undefined;
  try {
    const factor = metresPerSourceUnit[options.units] / DEFAULT_THREED_METERS_PER_SCENE_UNIT;
    const positions = geometry.getAttribute('position');
    for (let vertex = 0; vertex < positions.count; vertex += 1) {
      if (vertex % 3072 === 0) signal?.throwIfAborted();
      const x = positions.getX(vertex) * factor;
      const y = positions.getY(vertex) * factor;
      const z = positions.getZ(vertex) * factor;
      positions.setXYZ(vertex, x, options.upAxis === 'z' ? z : y, options.upAxis === 'z' ? -y : z);
    }
    // STL normals are often zero or unnormalized. Recompute flat normals from retained triangle winding.
    checkGeometry(geometry, inspection.triangleCount, signal, true);
    // All source solids belong to one reusable Model; a single material must include every triangle.
    geometry.clearGroups();
    const bounds = boundsOf(geometry);
    const alpha = (geometry as BufferGeometry & { alpha?: number }).alpha ?? 1;
    material = new MeshStandardMaterial({
      color: inspection.hasColors ? 0xffffff : 0xb7c6cc,
      vertexColors: inspection.hasColors,
      opacity: alpha,
      transparent: alpha < 1,
      metalness: 0,
      roughness: 0.75,
      side: DoubleSide,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = 'Imported STL';
    mesh.userData.stlImport = {
      version: 1,
      sourceUnits: options.units,
      sourceUpAxis: options.upAxis,
      metresPerSceneUnit: DEFAULT_THREED_METERS_PER_SCENE_UNIT,
    };
    const result = await new GLTFExporter().parseAsync(mesh, {
      binary: true,
      onlyVisible: false,
    });
    signal?.throwIfAborted();
    if (!(result instanceof ArrayBuffer)) throw new Error('STL conversion did not produce a binary GLB.');
    if (result.byteLength > MAX_THREED_DIRECT_MODEL_BYTES) {
      throw new Error('The converted GLB exceeds 32 MiB. Reduce the STL mesh before importing.');
    }
    return {
      bytes: result,
      source: inspection,
      bounds,
      metresSize: bounds.size.map(value => value * DEFAULT_THREED_METERS_PER_SCENE_UNIT) as StlImportVector,
      sceneSize: bounds.size,
      units: options.units,
      upAxis: options.upAxis,
    };
  } finally {
    geometry.dispose();
    material?.dispose();
  }
}
