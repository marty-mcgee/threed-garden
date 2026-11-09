import { Box3, BufferGeometry, Euler, Float32BufferAttribute, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3, DoubleSide } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { DEFAULT_THREED_METERS_PER_SCENE_UNIT } from '../markers/map-coordinate-core';
import { MAX_ASSEMBLY_COMPONENTS, parseAssemblyTransform, type AssemblyTransform } from './assembly-group-core';
import { MAX_THREED_DIRECT_MODEL_BYTES } from './model-upload-policy-core';

export const MAX_ASSEMBLY_JSON_BYTES = 32 * 1024 * 1024;
export const MAX_ASSEMBLY_JSON_TRIANGLES = 250_000;
export const assemblyJsonUnits = [
  'inches',
  'feet',
  'millimetres',
  'centimetres',
  'metres',
] as const;
export type AssemblyJsonUnits = typeof assemblyJsonUnits[number];
export interface AssemblyJsonMesh {
  /** Unindexed triangles: nine XYZ numbers per triangle. */
  positions: number[];
  color: [number, number, number, number];
}
export interface AssemblyJsonPart {
  label: string;
  transform: AssemblyTransform;
  meshes: AssemblyJsonMesh[];
}
export interface AssemblyJsonDocument {
  format: 'threed-assembly';
  formatVersion: 1;
  name: string;
  description?: string;
  /** null requires the User to choose units during local review. */
  units: AssemblyJsonUnits | null;
  upAxis: 'y' | 'z';
  parts: AssemblyJsonPart[];
}
export interface ConvertedAssemblyJson {
  parts: Array<{
    label: string;
    bytes: ArrayBuffer;
    position: [number, number, number];
  }>;
  preview: ArrayBuffer;
  size: [number, number, number];
  triangleCount: number;
}

function record(value: unknown, keys: string[], field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid JSON ${field}.`);
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !keys.includes(key))) throw new Error(`Unknown JSON ${field} field.`);
  return row;
}

function text(value: unknown, max: number, field: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim() !== value || value.length > max) throw new Error(`Invalid JSON ${field}.`);
  return value;
}

/** Data-only contract. No URLs, executable scripts, ownership claims or saved Model IDs. */
export function parseAssemblyJson(value: unknown): AssemblyJsonDocument {
  const row = record(value, ['format', 'formatVersion', 'name', 'description', 'units', 'upAxis', 'parts'], 'Assembly');
  if (row.format !== 'threed-assembly' || row.formatVersion !== 1) throw new Error('Choose a ThreeD Assembly JSON file with formatVersion 1.');
  if (row.units !== null && !assemblyJsonUnits.includes(row.units as AssemblyJsonUnits)) throw new Error('Invalid JSON source units.');
  if (row.upAxis !== 'y' && row.upAxis !== 'z') throw new Error('Invalid JSON up axis.');
  if (!Array.isArray(row.parts) || !row.parts.length || row.parts.length > MAX_ASSEMBLY_COMPONENTS) throw new Error(`Include between 1 and ${MAX_ASSEMBLY_COMPONENTS} Model parts.`);
  let triangles = 0;
  let meshes = 0;
  const parts = row.parts.map(value => {
    const part = record(value, ['label', 'transform', 'meshes'], 'part');
    if (!Array.isArray(part.meshes) || !part.meshes.length || part.meshes.length > 100) throw new Error('Each JSON part needs between 1 and 100 meshes.');
    return {
      label: text(part.label, 255, 'part label'),
      transform: parseAssemblyTransform(part.transform),
      meshes: part.meshes.map(value => {
        meshes += 1;
        if (meshes > 1000) throw new Error('This JSON exceeds 1,000 meshes.');
        const mesh = record(value, ['positions', 'color'], 'mesh');
        if (!Array.isArray(mesh.positions) || mesh.positions.length < 9 || mesh.positions.length % 9) throw new Error('Mesh positions must contain complete XYZ triangles.');
        triangles += mesh.positions.length / 9;
        if (triangles > MAX_ASSEMBLY_JSON_TRIANGLES) throw new Error('This JSON exceeds 250,000 triangles.');
        const positions = mesh.positions.map(value => {
          if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1_000_000) throw new Error('Mesh coordinates must be finite numbers within 1,000,000 source units.');
          return value;
        });
        if (!Array.isArray(mesh.color) || mesh.color.length !== 4 || mesh.color.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1)) throw new Error('Mesh color must contain four RGBA values between 0 and 1.');
        return {
          positions,
          color: [...mesh.color] as AssemblyJsonMesh['color'],
        };
      }),
    };
  });
  return {
    format: 'threed-assembly',
    formatVersion: 1,
    name: text(row.name, 255, 'Assembly name'),
    ...(row.description === undefined ? {} : { description: text(row.description, 2000, 'description') }),
    units: row.units as AssemblyJsonUnits | null,
    upAxis: row.upAxis,
    parts,
  };
}

const metresPerUnit: Record<AssemblyJsonUnits, number> = {
  inches: 0.0254,
  feet: 0.3048,
  millimetres: 0.001,
  centimetres: 0.01,
  metres: 1,
};

async function encode(group: Group, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const bytes = await new GLTFExporter().parseAsync(group, {
    binary: true,
    onlyVisible: false,
  });
  signal?.throwIfAborted();
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength > MAX_THREED_DIRECT_MODEL_BYTES) throw new Error('The generated GLB exceeds the 32 MiB Model limit.');
  return bytes;
}

/** Bake source transforms once, then retain each Model's offset in its Assembly. */
export async function convertAssemblyJson(value: unknown, units: AssemblyJsonUnits, signal?: AbortSignal): Promise<ConvertedAssemblyJson> {
  const source = parseAssemblyJson(value);
  if (!assemblyJsonUnits.includes(units)) throw new Error('Choose source units before preparing the Assembly.');
  const root = new Group();
  const resources: Array<BufferGeometry | MeshStandardMaterial> = [];
  const factor = metresPerUnit[units] / DEFAULT_THREED_METERS_PER_SCENE_UNIT;
  const basis = new Matrix4().makeRotationX(source.upAxis === 'z' ? -Math.PI / 2 : 0).premultiply(new Matrix4().makeScale(factor, factor, factor));
  const bounds = new Box3();
  const parts: ConvertedAssemblyJson['parts'] = [];
  let triangleCount = 0;
  try {
    for (const part of source.parts) {
      signal?.throwIfAborted();
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      signal?.throwIfAborted();
      const { position, rotation, scale } = part.transform;
      const transform = basis.clone().multiply(new Matrix4().compose(
        new Vector3(position.x, position.y, position.z),
        new Quaternion().setFromEuler(new Euler(rotation.x, rotation.y, rotation.z, 'XYZ')),
        new Vector3(scale, scale, scale),
      ));
      const group = new Group();
      group.name = part.label;
      root.add(group);
      for (const mesh of part.meshes) {
        signal?.throwIfAborted();
        const geometry = new BufferGeometry();
        resources.push(geometry);
        geometry.setAttribute('position', new Float32BufferAttribute(mesh.positions, 3));
        geometry.applyMatrix4(transform);
        const positions = geometry.getAttribute('position');
        const a = new Vector3();
        const b = new Vector3();
        const c = new Vector3();
        for (let i = 0; i < positions.count; i += 3) {
          a.fromBufferAttribute(positions, i);
          b.fromBufferAttribute(positions, i + 1);
          c.fromBufferAttribute(positions, i + 2);
          if (![a, b, c].every(v => v.toArray().every(Number.isFinite)) || b.sub(a).cross(c.sub(a)).lengthSq() === 0) throw new Error(`Part “${part.label}” contains a collapsed or invalid triangle.`);
        }
        geometry.computeVertexNormals();
        const material = new MeshStandardMaterial({
          color: 0xffffff,
          opacity: mesh.color[3],
          transparent: mesh.color[3] < 1,
          side: DoubleSide,
          roughness: 0.75,
          metalness: 0,
        });
        // JSCAD color components are retained as the GLB material's numeric RGB values.
        material.color.setRGB(mesh.color[0], mesh.color[1], mesh.color[2]);
        resources.push(material);
        group.add(new Mesh(geometry, material));
        triangleCount += mesh.positions.length / 9;
      }
      const box = new Box3().setFromObject(group);
      bounds.union(box);
      const origin = box.getCenter(new Vector3());
      origin.y = box.min.y;
      if (!origin.toArray().every(v => Number.isFinite(v) && Math.abs(v) <= 1_000_000)) throw new Error('Converted Model offsets exceed the Assembly limits.');
      for (const child of group.children) (child as Mesh<BufferGeometry>).geometry.translate(-origin.x, -origin.y, -origin.z);
      const bytes = await encode(group, signal);
      group.position.copy(origin);
      parts.push({
        label: part.label,
        bytes,
        position: origin.toArray() as [number, number, number],
      });
    }
    return {
      parts,
      preview: await encode(root, signal),
      size: bounds.getSize(new Vector3()).toArray() as [number, number, number],
      triangleCount,
    };
  } finally {
    for (const resource of resources) resource.dispose();
    root.clear();
  }
}
