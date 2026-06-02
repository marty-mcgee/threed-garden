// src/components/threed/ThreeDGarden.tsx
'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Loader,
  Stats as R3FStats,
  Grid,
  Sky,
  Clouds,
  Cloud,
  Sparkles
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Import threed components
import { GardenBed } from './GardenBed';
import { GardenGround } from './GardenGround';
import { GardenPlant } from './GardenPlant';
import { GardenCharacter } from './GardenCharacter';
import { WeatherEffects } from './WeatherEffects';
import { FloatingUI } from './FloatingUI';

// Import shared types
import { Bed, GardenPlantData, CharacterData, WeatherData } from '@/lib/types/threed';

// Add character data to the props interface
interface ThreeDGardenProps {
  beds: Bed[];
  plantings: GardenPlantData[];
  characters?: CharacterData[];  // Add this
  // weather?: {
  //   temperature: number;
  //   condition: string;
  //   rainfall: number;
  // };
  weather?: WeatherData;
  // onBedSelect?: (bed: Bed) => void;
  // onPlantSelect?: (plant: GardenPlantData) => void;
  // onCharacterSelect?: (character: CharacterData) => void;  // Add this
}

// Lighting Component
function GardenLighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[12, 22, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      <pointLight position={[0, 5, 0]} intensity={0.15} />
      <pointLight position={[-5, 5, -8]} intensity={0.2} />
      <pointLight position={[8, 4, 6]} intensity={0.15} />
      <hemisphereLight intensity={0.4} color="#87CEEB" groundColor="#4A7A3A" />
    </>
  );
}

// Decorative Clouds Component
function GardenClouds() {
  return (
    <Clouds material={THREE.MeshBasicMaterial} position={[0, 18, -12]} limit={4}>
      <Cloud segments={40} bounds={[10, 2, 10]} volume={8} color="white" opacity={0.6} />
    </Clouds>
  );
}

// Main Garden Scene Component
function GardenScene({ 
  beds, 
  plantings, 
  characters, 
  weather, 
  // onBedSelect, 
  // onPlantSelect, 
  // onCharacterSelect 
}: ThreeDGardenProps) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const currentWeather = weather?.condition?.toLowerCase() || 'sunny';
  
  // Update hour every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  console.log('🎮 GardenScene rendering with beds:', beds?.length || 0);
  console.log('🎮 GardenScene rendering with plantings:', plantings?.length || 0);
  console.log('🎮 GardenScene rendering with characters:', characters?.length || 0);
  console.log('🎮 GardenScene rendering with weather:', weather?.length || 0);
  
  return (
    <>
      <fog attach="fog" args={['#87CEEB', 30, 60]} />
      <Sky distance={450} sunPosition={[12, 22, 5]} inclination={0.6} azimuth={0.2} />
      
      <GardenLighting />
      <GardenClouds />
      <GardenGround />
      
      {/* Decorative Trees */}
      {treePositions.map((pos, i) => (
        <Tree key={`tree-${i}-${pos.x}-${pos.z}`} x={pos.x} z={pos.z} scale={pos.scale} />
      ))}
      
      {/* Water Features */}
      {waterPositions.map((pos, i) => (
        <WaterFeature key={`water-${i}-${pos.x}-${pos.z}`} x={pos.x} z={pos.z} radius={pos.radius} />
      ))}
      
      {/* Garden Beds */}
      {beds.map((bed) => (
        <GardenBed key={`bed-${bed.id}`} bed={bed} onClick={() => onBedSelect?.(bed)} />
      ))}
      
      {/* Plants */}
      <Suspense fallback={null}>
        {plantings.map((plant) => (
          <GardenPlant 
            key={`plant-${plant.id}`}
            plant={plant}
            // onClick={() => onPlantSelect?.(plant)}
          />
        ))}
      </Suspense>
      
      {/* Characters - NEW */}
      <Suspense fallback={null}>
        {characters && characters.length > 0 ? (
          characters.map((character) => (
            <GardenCharacter
              key={character.id}
              character={character}
              // onClick={() => onCharacterSelect?.(character)}
              currentWeather={currentWeather}
              currentHour={currentHour}
            />
          ))
        ) : (
          <group /> // Empty group when no characters
        )}
      </Suspense>

      {/* Weather Effects */}
      {weather && <WeatherEffects weather={weather} />}

    </>
  );
}

// Decorative Tree Positions
const treePositions = [
  { x: -13, z: -11, scale: 1.3 },
  { x: 13, z: -11, scale: 1.3 },
  { x: -11, z: 13, scale: 1.1 },
  { x: 11, z: 13, scale: 1.1 },
  { x: -15, z: 9, scale: 1.0 },
  { x: 15, z: 9, scale: 1.0 },
  { x: -2, z: -15, scale: 1.2 },
  { x: 2, z: -15, scale: 1.2 },
  { x: 0, z: 15, scale: 1.2 },
];

// Water Feature Positions
const waterPositions = [
  { x: -9, z: -9, radius: 2.0 },
  { x: 9, z: -9, radius: 1.5 },
];

// Tree Component
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.45, 1.3]} />
        <meshStandardMaterial color="#6B4226" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.9, 1.1, 8]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <coneGeometry args={[0.7, 0.9, 8]} />
        <meshStandardMaterial color="#388E3C" roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[0.5, 0.7, 8]} />
        <meshStandardMaterial color="#43A047" roughness={0.3} />
      </mesh>
    </group>
  );
}

// Water Feature Component
function WaterFeature({ x, z, radius = 1.5 }: { x: number; z: number; radius?: number }) {
  return (
    <group position={[x, -0.08, z]}>
      <mesh receiveShadow>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#4FC3F7" transparent opacity={0.8} roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

// Main Export Component
export default function ThreeDGarden({ beds, plantings, characters, weather, onBedSelect, onPlantSelect, onCharacterSelect }: ThreeDGardenProps) {
  const [showStats, setShowStats] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showEffects, setShowEffects] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Calculate quality based on total objects
  const quality = useMemo(() => {
    const totalObjects = beds.length + plantings.length + (characters?.length || 0);
    if (totalObjects > 150) return 'low';
    if (totalObjects > 80) return 'medium';
    return 'high';
  }, [beds.length, plantings.length, characters?.length]);

  // console.log('🎮 ThreeDGarden rendering with:', {
  //   beds: beds.length,
  //   plantings: plantings.length,
  //   characters: characters?.length || 0,
  //   quality
  // });

  // Client-side only rendering
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[800px] rounded-xl overflow-hidden bg-gradient-to-b from-sky-400 to-sky-200 dark:from-sky-900 dark:to-sky-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🌿</div>
          <p className="text-white">Loading 3D Garden...</p>
        </div>
      </div>
    );
  }

  if (!beds.length && !plantings.length && (!characters || characters.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[800px] bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-muted-foreground mb-2">No garden data available</p>
          <p className="text-sm text-muted-foreground">Add beds, plantings, or characters to see your 3D garden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[800px] rounded-xl overflow-hidden border bg-black/5 shadow-xl">
      <FloatingUI
        onToggleStats={() => setShowStats(!showStats)}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        onToggleEffects={() => setShowEffects(!showEffects)}
        autoRotate={autoRotate}
        showEffects={showEffects}
      />

      <Canvas
        shadows={quality !== 'low'}
        dpr={quality === 'high' ? [1, 1.5] : 1}
        gl={{
          antialias: quality !== 'low',
          alpha: false,
          powerPreference: "high-performance"
        }}
        camera={{ position: [14, 12, 16], fov: 50, near: 0.1, far: 100 }}
      >
        <PerspectiveCamera makeDefault position={[14, 12, 16]} fov={50} />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={1.0}
          rotateSpeed={0.8}
          panSpeed={0.8}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={40}
          enableDamping={true}
          dampingFactor={0.05}
        />
        
        <Environment preset="forest" background={false} />
        
        <GardenScene 
          beds={beds} 
          plantings={plantings} 
          characters={characters}
          weather={weather}
          // onBedSelect={onBedSelect}
          // onPlantSelect={onPlantSelect}
          // onCharacterSelect={onCharacterSelect}
        />
        
        {showEffects && quality === 'high' && (
          <EffectComposer>
            <Bloom 
              intensity={0.3}
              luminanceThreshold={0.3}
              luminanceSmoothing={0.8}
              kernelSize={3}
              mipmapBlur={false}
            />
            <Vignette 
              offset={0.5}
              darkness={0.3}
              eskil={false}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        )}
        
        <Grid 
          args={[50, 50]} 
          cellSize={1} 
          cellThickness={0.5} 
          cellColor="#6B8E23"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#556B2F"
          position={[0, -0.08, 0]}
        />
        
        {showStats && <R3FStats />}
      </Canvas>
      
      {/* Instructions Overlay */}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-4 py-2 rounded-lg backdrop-blur-sm z-10">
        <div className="flex gap-3">
          <span>🖱️ Drag to rotate</span>
          <span>🖱️ Right-click + drag to pan</span>
          <span>📜 Scroll to zoom</span>
        </div>
        <div className="text-green-300 text-xs mt-1">
          🌟 {beds.length} beds • {plantings.length} plants • {characters?.length || 0} characters
        </div>
      </div>
      
      <Loader />
    </div>
  );
}