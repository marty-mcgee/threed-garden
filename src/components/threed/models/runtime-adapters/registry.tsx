'use client';

import type { ComponentType } from 'react';
import type * as THREE from 'three';
import type { ModelData } from '@/components/threed/markers/ModelMarker3D';
import { SourceSceneRuntimeAdapter } from './SourceSceneRuntimeAdapter';

export interface ThreeDModelRuntimeAdapterProps {
  /** Marker-owned, already-loaded and cloned visual asset. */
  object: THREE.Group;
  /** Read-only reusable Model configuration; never the Project Marker authority. */
  model: Readonly<ModelData>;
}

export type ThreeDModelRuntimeAdapter = ComponentType<ThreeDModelRuntimeAdapterProps>;

/**
 * Source-controlled allowlist. Database metadata may select a key, but cannot
 * provide executable code, import paths, URLs, transforms, or physics handles.
 */
const THREED_MODEL_RUNTIME_ADAPTERS: Readonly<Record<string, ThreeDModelRuntimeAdapter>> = {
  'source-scene-v1': SourceSceneRuntimeAdapter,
};

export function resolveThreeDModelRuntimeAdapter(
  key: string | null,
): ThreeDModelRuntimeAdapter | null {
  if (!key) return null;
  return THREED_MODEL_RUNTIME_ADAPTERS[key] ?? null;
}

export function hasThreeDModelRuntimeAdapter(key: string): boolean {
  return Object.hasOwn(THREED_MODEL_RUNTIME_ADAPTERS, key);
}
