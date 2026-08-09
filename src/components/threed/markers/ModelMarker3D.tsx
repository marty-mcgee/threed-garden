// src/components/threed/markers/ModelMarker3D.tsx — v0.16.1-alpha "ThreeD Models"
'use client';

import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// ============================================
// TYPES
// ============================================
interface ModelData {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  scale?: string | number;
  rotationY?: string | number;
  offsetX?: string | number;
  offsetY?: string | number;
  offsetZ?: string | number;
  animations?: string[];
  defaultAnimation?: string;
  animationSpeed?: number; // from character wrapper
}

interface ModelMarker3DProps {
  model: ModelData;
  position: [number, number, number];
  name?: string;
  scale?: number;
  animationSpeed?: number;
}

// ============================================
// MODEL CACHE
// ============================================
const modelCache = new Map<string, THREE.Group>();

// ============================================
// MODEL LOADER HOOK
// ============================================
function useModelLoad(model: ModelData) {
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!model.filePath) return;

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
          } else {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(model.filePath);
            m = gltf.scene;
          }
          modelCache.set(cacheKey, m.clone());
        }

        // Apply model config transforms
        const modelScale = parseFloat(String(model.scale || '1'));
        const modelRotY = parseFloat(String(model.rotationY || '0'));
        const offsetX = parseFloat(String(model.offsetX || '0'));
        const offsetY = parseFloat(String(model.offsetY || '0'));
        const offsetZ = parseFloat(String(model.offsetZ || '0'));

        m.scale.setScalar(modelScale);
        m.rotation.y = (modelRotY * Math.PI) / 180;
        m.position.set(offsetX, offsetY, offsetZ);

        // Enable shadows
        m.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        setLoadedModel(m);
      } catch (err) {
        console.error(`ModelMarker3D: failed to load "${model.modelName}":`, err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [model]);

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
export function ModelMarker3D({ model, position, name, scale = 1, animationSpeed = 1 }: ModelMarker3DProps) {
  const { loadedModel, loading, error } = useModelLoad(model);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

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

  // Fallback if no model loaded
  if (!loadedModel || error) {
    if (loading) {
      return <ModelFallback name={name || model.modelName} position={position} />;
    }
    return <ModelFallback name={name || model.modelName} position={position} />;
  }

  return (
    <group position={position}>
      <primitive object={loadedModel} scale={[scale, scale, scale]} />
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