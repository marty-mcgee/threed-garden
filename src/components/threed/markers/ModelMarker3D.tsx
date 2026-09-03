// src/components/threed/markers/ModelMarker3D.tsx — v0.16.1-alpha "ThreeD Models"
'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
  calculateThreeDModelGroundedY,
  calculateThreeDModelFitMultiplier,
  type ThreeDVisualBounds,
} from '@/lib/services/threed/markers/model-visual-fit-core';
import {
  assessThreeDEnvironmentGeometry,
  createThreeDEnvironmentMeshInventory,
  type ThreeDEnvironmentGeometryAuditAssessment,
  type ThreeDEnvironmentMeshInventory,
} from '@/lib/services/threed/models/environment-collision-core';
import { readThreeDModelRuntimeAdapterKey } from '@/lib/services/threed/models/model-runtime-adapter-core';
import {
  planThreeDEnvironmentCollisionPreview,
  type ThreeDEnvironmentCollisionPreviewPlan,
  type ThreeDEnvironmentCollisionBoxCandidate,
} from '@/lib/services/threed/models/environment-collision-preview-core';
import { resolveThreeDModelRuntimeAdapter } from '@/components/threed/models/runtime-adapters/registry';

// ============================================
// TYPES
// ============================================
export interface ModelData {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  scale?: string | number | null;
  rotationY?: string | number | null;
  offsetX?: string | number | null;
  offsetY?: string | number | null;
  offsetZ?: string | number | null;
  animations?: unknown;
  defaultAnimation?: string | null;
  animationSpeed?: number; // from character wrapper
  metadata?: unknown;
}

export interface ModelCollisionBounds {
  center: [number, number, number];
  halfExtents: [number, number, number];
}

export interface ModelGeometryAudit extends ThreeDEnvironmentGeometryAuditAssessment {
  meshCount: number;
  triangleCount: number;
  skinnedMeshCount: number;
  invalidMeshCount: number;
  meshInventory: ThreeDEnvironmentMeshInventory;
}

interface ModelMarker3DProps {
  model: ModelData;
  position: [number, number, number];
  name?: string;
  scale?: number;
  animationSpeed?: number;
  fallback?: ReactNode;
  fitBounds?: ThreeDVisualBounds;
  /** False when the caller applies the composed base + instance scale outside the loaded object. */
  applyStoredScale?: boolean;
  /** Reports loaded, grounded geometry bounds for the marker-owned Rapier collider. */
  onCollisionBoundsChange?: (bounds: ModelCollisionBounds | null) => void;
  /** Reports bounded post-transform geometry diagnostics without creating physics. */
  onGeometryAuditChange?: (audit: ModelGeometryAudit | null) => void;
  /** Reports bounded marker-local collision boxes for Physics Debug only. */
  onEnvironmentCollisionPreviewChange?: (plan: ThreeDEnvironmentCollisionPreviewPlan | null) => void;
  /** Reports that this Model load has either succeeded or failed. */
  onRuntimeSettled?: () => void;
}

// ============================================
// MODEL CACHE
// ============================================
const modelCache = new Map<string, THREE.Group>();

// Reuse one decoder pool. Decoder files are copied from the installed Three.js
// version and served by this App so model loading does not depend on a CDN.
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/assets/draco/');
dracoLoader.setWorkerLimit(2);

// ============================================
// MODEL LOADER HOOK
// ============================================
function useModelLoad(
  model: ModelData,
  fitBounds?: ThreeDVisualBounds,
  applyStoredScale = true,
) {
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fitWidth = fitBounds?.width;
  const fitHeight = fitBounds?.height;
  const fitDepth = fitBounds?.depth;

  useEffect(() => {
    if (!model.filePath) return;
    let cancelled = false;

    const loadModel = async () => {
      setLoading(true);
      setError(null);

      try {
        const modelType = model.modelType?.toLowerCase() || 'glb';
        const cacheKey = `${model.filePath}-${modelType}`;

        let m: THREE.Group;

        if (modelCache.has(cacheKey)) {
          m = modelCache.get(cacheKey)!.clone();
        } else {
          if (modelType === 'fbx') {
            const loader = new FBXLoader();
            m = await loader.loadAsync(model.filePath) as THREE.Group;
          } else if (modelType === 'obj') {
            const loader = new OBJLoader();
            m = await loader.loadAsync(model.filePath) as unknown as THREE.Group;
          } else {
            const loader = new GLTFLoader();
            loader.setDRACOLoader(dracoLoader);
            const gltf = await loader.loadAsync(model.filePath);
            m = gltf.scene;
            m.animations = gltf.animations;
          }
          modelCache.set(cacheKey, m.clone());
        }

        // Apply model config transforms
        const storedModelScale = Number(model.scale ?? 1);
        const modelScale = applyStoredScale
          && Number.isFinite(storedModelScale)
          && storedModelScale > 0
          ? storedModelScale
          : 1;
        const modelRotY = parseFloat(String(model.rotationY || '0'));
        const offsetX = parseFloat(String(model.offsetX || '0'));
        const offsetY = parseFloat(String(model.offsetY || '0'));
        const offsetZ = parseFloat(String(model.offsetZ || '0'));

        m.scale.setScalar(modelScale);
        m.rotation.y = (modelRotY * Math.PI) / 180;

        if (fitWidth != null && fitHeight != null && fitDepth != null) {
          m.position.set(0, 0, 0);
          m.updateMatrixWorld(true);
          const size = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
          const fitMultiplier = calculateThreeDModelFitMultiplier(
            { width: size.x, height: size.y, depth: size.z },
            { width: fitWidth, height: fitHeight, depth: fitDepth },
          );
          m.scale.multiplyScalar(fitMultiplier);
          m.updateMatrixWorld(true);
          const fittedBox = new THREE.Box3().setFromObject(m);
          const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
          m.position.set(
            offsetX - fittedCenter.x,
            calculateThreeDModelGroundedY(fittedBox.min.y, offsetY),
            offsetZ - fittedCenter.z,
          );
        } else {
          m.position.set(0, 0, 0);
          m.updateMatrixWorld(true);
          const modelBox = new THREE.Box3().setFromObject(m);
          m.position.set(
            offsetX,
            calculateThreeDModelGroundedY(modelBox.min.y, offsetY),
            offsetZ,
          );
        }

        // Enable shadows
        m.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        if (!cancelled) {
          setLoadedModel(m);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(`ModelMarker3D: failed to load "${model.modelName}":`, err);
          setError(String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadModel();
    return () => {
      cancelled = true;
    };
  }, [applyStoredScale, fitDepth, fitHeight, fitWidth, model]);

  return { loadedModel, loading, error };
}

// ============================================
// FALLBACK SHAPE
// ============================================
function ModelFallback({ name, position }: { name?: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#6b7280" roughness={0.5} metalness={0.3} />
      </mesh>
      {name && (
        <Html position={[0, 0.8, 0]} center transform occlude distanceFactor={1}>
          <div className="bg-black/60 text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap pointer-events-none select-none">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================
// COMPONENT
// ============================================
export function ModelMarker3D({ model, position, name, scale = 1, animationSpeed = 1, fallback, fitBounds, applyStoredScale = true, onCollisionBoundsChange, onGeometryAuditChange, onEnvironmentCollisionPreviewChange, onRuntimeSettled }: ModelMarker3DProps) {
  const { loadedModel, loading, error } = useModelLoad(model, fitBounds, applyStoredScale);
  const requestedRuntimeAdapterKey = readThreeDModelRuntimeAdapterKey(model.metadata);
  const RuntimeAdapter = resolveThreeDModelRuntimeAdapter(requestedRuntimeAdapterKey);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const visualGroupRef = useRef<THREE.Group | null>(null);
  const collisionMeasurementRef = useRef({
    model: null as THREE.Group | null,
    scale: 0,
    frames: 0,
    reported: false,
  });

  useEffect(() => {
    if (!loading && (loadedModel || error || !model.filePath)) onRuntimeSettled?.();
  }, [error, loadedModel, loading, model.filePath, onRuntimeSettled]);

  useEffect(() => {
    collisionMeasurementRef.current = {
      model: loadedModel,
      scale,
      frames: 0,
      reported: false,
    };
    onCollisionBoundsChange?.(null);
    onGeometryAuditChange?.(null);
    onEnvironmentCollisionPreviewChange?.(null);
    return () => {
      onCollisionBoundsChange?.(null);
      onGeometryAuditChange?.(null);
      onEnvironmentCollisionPreviewChange?.(null);
    };
  }, [loadedModel, onCollisionBoundsChange, onEnvironmentCollisionPreviewChange, onGeometryAuditChange, scale]);

  useFrame(() => {
    const measurement = collisionMeasurementRef.current;
    if (
      !loadedModel
      || measurement.model !== loadedModel
      || measurement.scale !== scale
      || measurement.reported
      || !Number.isFinite(scale)
      || scale <= 0
    ) return;

    // Wait until R3F has attached and rendered the external scene graph. Skinned
    // geometry can report its import/bind-pose bounds during the load effect.
    measurement.frames += 1;
    if (measurement.frames < 2) return;

    const visualGroup = visualGroupRef.current;
    if (!visualGroup?.parent) return;

    loadedModel.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) child.skeleton.update();
    });
    visualGroup.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(visualGroup, true);
    const inverseBodyWorld = visualGroup.parent.matrixWorld.clone().invert();
    box.applyMatrix4(inverseBodyWorld);
    const center = box.getCenter(new THREE.Vector3());
    const halfExtents = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const values = [
      center.x,
      center.y,
      center.z,
      halfExtents.x,
      halfExtents.y,
      halfExtents.z,
    ];
    if (box.isEmpty() || !values.every(Number.isFinite)) return;

    measurement.reported = true;
    let meshCount = 0;
    let triangleCount = 0;
    let skinnedMeshCount = 0;
    let invalidMeshCount = 0;
    const meshInventoryCandidates: Array<{
      path: string;
      type: string;
      triangleCount: number;
    }> = [];
    const collisionPreviewCandidates: ThreeDEnvironmentCollisionBoxCandidate[] = [];
    loadedModel.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      meshCount += 1;
      if (child instanceof THREE.SkinnedMesh) skinnedMeshCount += 1;
      const geometry = child.geometry;
      const positionAttribute = geometry?.getAttribute('position');
      const elementCount = geometry?.index?.count ?? positionAttribute?.count ?? 0;
      if (!positionAttribute || elementCount < 3 || elementCount % 3 !== 0) {
        invalidMeshCount += 1;
        return;
      }
      const meshTriangleCount = elementCount / 3;
      triangleCount += meshTriangleCount;
      const pathSegments: string[] = [];
      let current: THREE.Object3D | null = child;
      while (current && current !== loadedModel) {
        pathSegments.unshift(current.name || current.type);
        current = current.parent;
      }
      meshInventoryCandidates.push({
        path: pathSegments.join('/'),
        type: child.type,
        triangleCount: meshTriangleCount,
      });
      if (onEnvironmentCollisionPreviewChange) {
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        if (geometry.boundingBox && !geometry.boundingBox.isEmpty()) {
          const meshToBody = inverseBodyWorld.clone().multiply(child.matrixWorld);
          const meshBox = geometry.boundingBox.clone().applyMatrix4(meshToBody);
          const meshCenter = meshBox.getCenter(new THREE.Vector3());
          const meshHalfExtents = meshBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
          collisionPreviewCandidates.push({
            sourcePath: pathSegments.join('/'),
            center: [meshCenter.x, meshCenter.y, meshCenter.z],
            halfExtents: [meshHalfExtents.x, meshHalfExtents.y, meshHalfExtents.z],
          });
        }
      }
    });
    const auditInput = {
      meshCount,
      triangleCount,
      skinnedMeshCount,
      invalidMeshCount,
      hasFiniteBounds: values.every(Number.isFinite),
    };
    onGeometryAuditChange?.({
      ...auditInput,
      ...assessThreeDEnvironmentGeometry(auditInput),
      meshInventory: createThreeDEnvironmentMeshInventory(meshInventoryCandidates),
    });
    if (onEnvironmentCollisionPreviewChange) {
      onEnvironmentCollisionPreviewChange(
        planThreeDEnvironmentCollisionPreview(collisionPreviewCandidates),
      );
    }
    onCollisionBoundsChange?.({
      center: [center.x, center.y, center.z],
      halfExtents: [
        Math.max(halfExtents.x, 0.025),
        Math.max(halfExtents.y, 0.025),
        Math.max(halfExtents.z, 0.025),
      ],
    });
  });

  // Auto-play default animation
  useEffect(() => {
    if (!loadedModel) return;
    const clips = (loadedModel as any).animations || [];
    if (clips.length > 0) {
      const mixer = new THREE.AnimationMixer(loadedModel);
      mixerRef.current = mixer;
      const clipName = model.defaultAnimation || clips[0].name;
      const clip = clips.find((c: any) => c.name === clipName) || clips[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.timeScale = animationSpeed;
        action.play();
      }
    }
    return () => {
      if (mixerRef.current) mixerRef.current.stopAllAction();
    };
  }, [loadedModel, model.defaultAnimation, animationSpeed]);

  useEffect(() => {
    if (!loadedModel || !requestedRuntimeAdapterKey) return;
    console.debug('[ThreeD Model Runtime Adapter]', {
      modelId: model.id,
      modelName: model.modelName,
      requestedKey: requestedRuntimeAdapterKey,
      resolved: RuntimeAdapter !== null,
    });
  }, [RuntimeAdapter, loadedModel, model.id, model.modelName, requestedRuntimeAdapterKey]);

  // Fallback if no model loaded
  if (!loadedModel || error) {
    return (
      <group scale={[scale, scale, scale]}>
        {fallback || (
          <ModelFallback name={name || model.modelName} position={position} />
        )}
      </group>
    );
  }

  return (
    <group ref={visualGroupRef} position={position} scale={[scale, scale, scale]}>
      {RuntimeAdapter
        ? <RuntimeAdapter object={loadedModel} model={model} />
        : <primitive object={loadedModel} />}
      {name && (
        <Html position={[0, 1.5, 0]} center transform occlude distanceFactor={1}>
          <div className="bg-black/60 text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap pointer-events-none select-none">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}
