import type { ModelFallbackShape } from '@/libraries/services/threed/models/model-fallback-core';

/** Visual only. Character owners retain their existing movement and physics. */
export function ModelShapeVisual({ shape, scale = 1, rotationY = 0 }: { shape: ModelFallbackShape; scale?: number; rotationY?: number }) {
  return <group scale={Number.isFinite(scale) && scale > 0 ? scale : 1} rotation={[0, Number.isFinite(rotationY) ? rotationY * Math.PI / 180 : 0, 0]}><mesh castShadow receiveShadow position={[0, 0.5, 0]}>
    {shape === 'sphere' ? <sphereGeometry args={[0.5, 20, 12]} />
      : shape === 'cylinder' ? <cylinderGeometry args={[0.35, 0.35, 1, 20]} />
      : shape === 'rectangle' ? <boxGeometry args={[1.4, 1, 0.6]} />
      : shape === 'pyramid' ? <coneGeometry args={[0.65, 1, 4]} />
      : shape === 'torus' ? <torusGeometry args={[0.35, 0.15, 12, 24]} />
      : <boxGeometry args={[1, 1, 1]} />}
    <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.3} />
  </mesh></group>;
}
