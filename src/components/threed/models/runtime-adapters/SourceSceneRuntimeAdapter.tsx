'use client';

import type { ThreeDModelRuntimeAdapterProps } from './registry';

/**
 * Reference adapter that preserves the existing loaded-scene construction.
 * Curated adapters may instead declare selected named meshes from `object`.
 */
export function SourceSceneRuntimeAdapter({ object }: ThreeDModelRuntimeAdapterProps) {
  return <primitive object={object} />;
}
