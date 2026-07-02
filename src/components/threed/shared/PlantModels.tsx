// src/components/threed/PlantModels.tsx (updated relevant parts)
'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Group } from 'three';

// Import your custom model loader if you have one
// import { useGLTF } from '@react-three/drei';
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

interface PlantModelProps {
  plantName: string;
  growthStage: string;
  modelMetadata?: {
    scale?: number;
    rotationY?: number;
    offsets?: { x: number; y: number; z: number };
  };
  onClick?: () => void;
}

export function PlantModel({ 
  plantName, 
  growthStage,
  modelMetadata,
  onClick 
}: PlantModelProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // // If there's a custom model path, render it here
  // // This is where your GLB/FBX loading logic would go
  // if (customModelPath && customModelType) {
  //   // Return your custom model component
  //   // For now, return a placeholder that your actual loader will replace
  //   return (
  //     <group
  //       ref={groupRef}
  //       onClick={onClick}
  //       onPointerOver={() => setHovered(true)}
  //       onPointerOut={() => setHovered(false)}
  //     >
  //       {/* Your custom GLB/FBX model component goes here */}
  //       <mesh>
  //         <boxGeometry args={[0.5, 0.5, 0.5]} />
  //         <meshStandardMaterial color="#FF00FF" />
  //       </mesh>
  //       {hovered && (
  //         <Html position={[0, 1, 0]} center>
  //           <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
  //             {plantName} - {growthStage} (Custom)
  //           </div>
  //         </Html>
  //       )}
  //     </group>
  //   );
  // }
  
  // Fallback to procedural model
  // ... your existing procedural plant rendering code ...
  
  // Return a simple placeholder for now
  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={"#4CAF50"} />
      </mesh>
      {hovered && (
        <Html position={[0, 1, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {plantName} - {growthStage}
          </div>
        </Html>
      )}
    </group>
  );
}