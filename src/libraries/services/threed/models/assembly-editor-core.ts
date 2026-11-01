// @ts-expect-error Native Node validation requires the explicit extension.
import { parseAssemblyTransform, type AssemblyComponent, type AssemblyTransform } from './assembly-group-core.ts';

export interface AssemblyComponentDraft {
  id: string;
  modelId: number;
  label: string;
  x: string;
  y: string;
  z: string;
  rx: string;
  ry: string;
  rz: string;
  scale: string;
}

function numeric(value: string): number {
  return value.trim() ? Number(value) : NaN;
}

/** Fields use degrees; the persisted and rendered Assembly contract uses radians. */
export function assemblyDraftTransform(draft: AssemblyComponentDraft): AssemblyTransform {
  return parseAssemblyTransform({
    position: {
      x: numeric(draft.x),
      y: numeric(draft.y),
      z: numeric(draft.z),
    },
    rotation: {
      x: numeric(draft.rx) * Math.PI / 180,
      y: numeric(draft.ry) * Math.PI / 180,
      z: numeric(draft.rz) * Math.PI / 180,
    },
    scale: numeric(draft.scale),
  });
}

export function assemblyTransformFields(transform: AssemblyTransform) {
  const { position, rotation, scale } = parseAssemblyTransform(transform);
  return {
    x: String(position.x),
    y: String(position.y),
    z: String(position.z),
    rx: String(rotation.x * 180 / Math.PI),
    ry: String(rotation.y * 180 / Math.PI),
    rz: String(rotation.z * 180 / Math.PI),
    scale: String(scale),
  };
}

export function assemblyComponentDraft(component: AssemblyComponent): AssemblyComponentDraft {
  return {
    id: component.id,
    modelId: component.modelId,
    label: component.label,
    ...assemblyTransformFields(component.transform),
  };
}

/** Assembly scale is uniform. A dragged axis drives all three axes, without inversion. */
export function assemblyUniformScale(scale: { x: number; y: number; z: number }, axis: string | null): number {
  const value = axis === 'Y' ? scale.y : axis === 'Z' ? scale.z : scale.x;
  return Number.isFinite(value) ? Math.min(10_000, Math.max(0.0001, value)) : 1;
}
