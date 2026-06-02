// src/components/threed/GardenCharacter.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface CharacterData {
  id: number;
  characterId: string;
  name: string;
  type: string;
  status: string;
  modelId: number | null;
  model?: {
    id: number;
    modelName: string;
    modelType: string;
    filePath: string;
    scale: string;
    rotationY: string;
    animations: string[];
  };
  defaultAnimation: string;
  animationSpeed: number;
  movementType: string;
  movementRadius: number;
  movementSpeed: number;
  patrolWaypoints: { x: number; y: number; z: number }[];
  followTarget: string;
  followDistance: number;
  teleportPositions: { x: number; y: number; z: number; waitSeconds?: number }[];
  teleportInterval: number;
  interactable: boolean;
  interactionMessage: string;
  defaultEmote: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scale: number;
  visible: boolean;
  activeStartHour: number;
  activeEndHour: number;
}

interface GardenCharacterProps {
  character: CharacterData;
  currentWeather?: string;
  currentHour?: number;
  // onClick?: () => void;
}

// Model cache for performance
const modelCache = new Map<string, THREE.Group>();
const animationMixers = new Map<number, THREE.AnimationMixer>();

// Character Component
export function GardenCharacter({ 
  character, 
  // onClick, 
  currentWeather = 'sunny', 
  currentHour = 12 
}: GardenCharacterProps) {

  console.log('🎭 GardenCharacter rendering:', {
    name: character.name,
    id: character.id,
    position: [character.positionX, character.positionY, character.positionZ],
    hasModel: !!character.model,
    modelPath: character.model?.filePath,
    modelType: character.model?.modelType,
    visible: character.visible,
    // isActive: character.isActive,
    activeHours: `${character.activeStartHour}-${character.activeEndHour}`,
    currentHour
  });

  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);

  const [hovered, setHovered] = useState(false);
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  
  // Movement state
  const movementState = useRef({
    targetPosition: new THREE.Vector3(character.positionX, character.positionY, character.positionZ),
    patrolIndex: 0,
    teleportTimer: 0,
    lastUpdate: 0
  });
  
  // Check if character should be active based on time and weather
  const isTimeActive = currentHour >= character.activeStartHour && currentHour <= character.activeEndHour;
  const isWeatherActive = character.status === 'active' && character.visible && isTimeActive;
  
  console.log('🎭 Character visibility check:', {
    name: character.name,
    isTimeActive,
    isWeatherActive,
    willRender: isWeatherActive && !!character.model?.filePath
  });
  
  if (!isWeatherActive) {
    console.log('🎭 Character not active based on weather:', character.name);
    return null;
  }

  if (!character.model?.filePath) {
    console.log('🎭 Character has no model path:', character.name);
    // Show a colored box as fallback
    return (
      <group position={[character.positionX, character.positionY, character.positionZ]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#FF69B4" />
        </mesh>
      </group>
    );
  }

  // Load model
  useEffect(() => {
    
    // if (!character.model?.filePath) return;
    if (!isWeatherActive) return;
    if (!character.model?.filePath) {
      console.log('No model path for:', character.name);
      return;
    }
    
    const loadModel = async () => {

      setLoadingModel(true);
      setModelError(null);
      
      try {
        const modelPath = character.model!.filePath;
        const modelType = character.model!.modelType?.toLowerCase() || 'glb';
        
        console.log(`Loading model for ${character.name}:`, { modelPath, modelType });

        let loadedModel: THREE.Group;
        
        const cacheKey = `${character.model!.filePath}-${character.model!.modelType}`;
        if (modelCache.has(cacheKey)) {
          loadedModel = modelCache.get(cacheKey)!.clone();
        } else {
          const loader = character.model!.modelType.toLowerCase() === 'fbx' ? new FBXLoader() : new GLTFLoader();
          const result = await loader.loadAsync(character.model!.filePath);
          loadedModel = character.model!.modelType.toLowerCase() === 'fbx' ? result as THREE.Group : (result as any).scene;
          modelCache.set(cacheKey, loadedModel.clone());
        }

        if (modelType === 'fbx') {
          const loader = new FBXLoader();
          loadedModel = await loader.loadAsync(modelPath);
        } else {
          const loader = new GLTFLoader();
          const gltf = await loader.loadAsync(modelPath);
          loadedModel = gltf.scene;
        }
        
        // Apply transforms
        const scale = parseFloat(character.model!.scale) * character.scale;
        const rotationY = parseFloat(character.model!.rotationY) + character.rotation;
        
        loadedModel.scale.setScalar(scale);
        loadedModel.rotation.y = (rotationY * Math.PI) / 180;
        
        // Setup animations
        if (character.defaultAnimation && (loadedModel as any).animations?.length > 0) {
          const mixer = new THREE.AnimationMixer(loadedModel);
          const clip = (loadedModel as any).animations.find((a: any) => a.name === character.defaultAnimation);
          if (clip) {
            const action = mixer.clipAction(clip);
            action.timeScale = character.animationSpeed;
            action.play();
            mixerRef.current = mixer;
            animationMixers.set(character.id, mixer);
          }
        }
        
        // // Enable shadows
        // loadedModel.traverse((child) => {
        //   if (child.isMesh) {
        //     child.castShadow = true;
        //     child.receiveShadow = true;
        //   }
        // });
        
        console.log(`✅ Model loaded for ${character.name}`);
        setModel(loadedModel);

      } catch (error) {
        console.error(`Error loading character model:`, error);
      }
    };
    
    loadModel();
    
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        animationMixers.delete(character.id);
      }
    };

  // }, [character]);
   }, [character, isWeatherActive]);
  








  // Update animation mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  // Movement logic
  useFrame((_, delta) => {
    if (!groupRef.current || !isWeatherActive || character.movementType === 'stationary') return;
    
    const position = groupRef.current.position;
    const speed = character.movementSpeed * delta;
    
    switch (character.movementType) {
      case 'wander':
        // Random wandering within radius
        if (position.distanceTo(movementState.current.targetPosition) < 0.1) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * character.movementRadius;
          movementState.current.targetPosition = new THREE.Vector3(
            character.positionX + Math.cos(angle) * radius,
            character.positionY,
            character.positionZ + Math.sin(angle) * radius
          );
        }
        break;
        
      case 'patrol':
        if (character.patrolWaypoints && character.patrolWaypoints.length > 0) {
          const waypoints = character.patrolWaypoints;
          const target = waypoints[movementState.current.patrolIndex];
          const targetPos = new THREE.Vector3(target.x, target.y, target.z);
          
          if (position.distanceTo(targetPos) < 0.2) {
            movementState.current.patrolIndex = (movementState.current.patrolIndex + 1) % waypoints.length;
          } else {
            movementState.current.targetPosition = targetPos;
          }
        }
        break;
        
      case 'circle':
        // Circular movement
        const time = Date.now() * 0.001 * character.movementSpeed;
        const radius = character.movementRadius;
        movementState.current.targetPosition = new THREE.Vector3(
          character.positionX + Math.cos(time) * radius,
          character.positionY,
          character.positionZ + Math.sin(time) * radius
        );
        break;
        
      case 'teleport':
        if (character.teleportPositions && character.teleportPositions.length > 0) {
          movementState.current.teleportTimer += delta;
          if (movementState.current.teleportTimer >= character.teleportInterval) {
            movementState.current.teleportTimer = 0;
            const randomIndex = Math.floor(Math.random() * character.teleportPositions.length);
            const pos = character.teleportPositions[randomIndex];
            groupRef.current.position.set(pos.x, pos.y, pos.z);
          }
        }
        return; // Skip smooth movement for teleport
    }
    
    // Smooth movement toward target
    const direction = movementState.current.targetPosition.clone().sub(position).normalize();
    position.x += direction.x * speed;
    position.z += direction.z * speed;
    
    // Face movement direction
    if (direction.x !== 0 || direction.z !== 0) {
      const angle = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = angle;
    }
  });
  
  // Handle click interaction
  const handleClick = () => {
    if (!character.interactable) return;
    
    // Show emote
    if (character.defaultEmote && character.defaultEmote !== 'none') {
      setCurrentEmote(character.defaultEmote);
      setTimeout(() => setCurrentEmote(null), 2000);
    }
    
    // Show message
    if (character.interactionMessage) {
      setShowMessage(character.interactionMessage);
      setTimeout(() => setShowMessage(null), 3000);
    }
    
    onClick?.();
  };
  
  if (!isWeatherActive || !model) return null;



  // If no model or error, show colored box
  if (!character.model?.filePath || modelError || (!model && !loadingModel)) {
    const colorMap: Record<string, string> = {
      animal: '#D2691E',
      bird: '#87CEEB',
      insect: '#32CD32',
      mythical: '#9370DB',
      human: '#FFB6C1',
      robot: '#A9A9A9',
      decoration: '#FFD700'
    };
    const boxColor = colorMap[character.type] || '#FF69B4';
    
    console.log(`Showing fallback box for ${character.name} at position:`, [character.positionX, character.positionY, character.positionZ]);
    
    return (
      <group position={[character.positionX, character.positionY, character.positionZ]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={boxColor} />
        </mesh>
        {/* Name label */}
        <Html position={[0, 0.6, 0]} center>
          <div className="bg-black/70 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">
            {character.name}
          </div>
        </Html>
      </group>
    );
  }
  
  // Show loading indicator
  if (loadingModel) {
    return (
      <group position={[character.positionX, character.positionY, character.positionZ]}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#888888" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }





  
  return (
    <group
      ref={groupRef}
      position={[character.positionX, character.positionY, character.positionZ]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={model} />

      <Html position={[0, 1.2, 0]} center>
        <div className="bg-black/60 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">
          {character.name}
        </div>
      </Html>
      
      {/* Emote Bubble */}
      {currentEmote && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg animate-bounce">
            {currentEmote === 'happy' && <span className="text-2xl">😊</span>}
            {currentEmote === 'sad' && <span className="text-2xl">😢</span>}
            {currentEmote === 'surprised' && <span className="text-2xl">😲</span>}
            {currentEmote === 'angry' && <span className="text-2xl">😠</span>}
            {currentEmote === 'wave' && <span className="text-2xl">👋</span>}
            {currentEmote === 'dance' && <span className="text-2xl">💃</span>}
            {currentEmote === 'sleep' && <span className="text-2xl">😴</span>}
          </div>
        </Html>
      )}
      
      {/* Speech/Interaction Bubble */}
      {showMessage && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shadow-lg animate-fade-in">
            💬 {showMessage}
          </div>
        </Html>
      )}
      
      {/* Hover Tooltip */}
      {hovered && character.interactable && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/60 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            Click to interact with {character.name}
          </div>
        </Html>
      )}
    </group>
  );
}