// src/components/threed/ThreeDGarden.tsx
'use client';

import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Html,
  Loader,
  Stats as R3FStats,
  Grid,
  Plane,
  Box as DreiBox,
  Circle,
  Sparkles,
  Clouds,
  Cloud,
  Cylinder,
  Cone,
  Sphere,
} from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// Import our custom components
import { GardenBed } from './GardenBed';
import { GardenPlant } from './GardenPlant';
import { WeatherEffects } from './WeatherEffects';
import { FloatingUI } from './FloatingUI';

interface Bed {
  id: number;
  name: string;
  shape: string;
  widthFeet: number;
  lengthFeet: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  color: string;
}

interface RawPlantingData {
  planting: {
    id: number;
    plantingId: string;
    plantId: number;
    bedId: number;
    quantity: number;
    spacingInches: string;
    positionX: string;
    positionY: string;
    positionZ: string;
    plantedDate: string;
    status: string;
    growthStage: string;
    health: string;
    notes: string;
  };
  plant: {
    id: number;
    commonName: string;
    scientificName: string;
    type: string;
    daysToMaturity: number;
  };
  bed: {
    id: number;
    name: string;
    shape: string;
    widthFeet: string;
    lengthFeet: string;
    positionX: string;
    positionY: string;
    positionZ: string;
    color: string;
  };
}

interface FlattenedPlanting {
  id: number;
  plantId: number;
  plantName: string;
  plantType: string;
  quantity: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  growthStage: string;
  daysToMaturity: number;
  bedId: number;
}

interface ThreeDGardenProps {
  beds: Bed[];
  plantings: RawPlantingData[];
  weather?: {
    temperature: number;
    condition: string;
    rainfall: number;
  };
  onBedSelect?: (bed: Bed) => void;
  onPlantSelect?: (planting: FlattenedPlanting) => void;
}

// Helper function to flatten planting data
function flattenPlanting(rawPlanting: RawPlantingData): FlattenedPlanting {
  return {
    id: rawPlanting.planting.id,
    plantId: rawPlanting.planting.plantId,
    plantName: rawPlanting.plant?.commonName || 'Unknown Plant',
    plantType: rawPlanting.plant?.type || 'Vegetable',
    quantity: rawPlanting.planting.quantity || 1,
    positionX: parseFloat(rawPlanting.planting.positionX || '0'),
    positionY: parseFloat(rawPlanting.planting.positionY || '0'),
    positionZ: parseFloat(rawPlanting.planting.positionZ || '0'),
    growthStage: rawPlanting.planting.growthStage || 'vegetative',
    daysToMaturity: rawPlanting.plant?.daysToMaturity || 60,
    bedId: rawPlanting.planting.bedId,
  };
}

// Decorative Tree Component
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <Cylinder args={[0.3, 0.4, 1.2]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color="#8B4513" roughness={0.7} />
      </Cylinder>
      {/* Foliage layers */}
      <Cone args={[0.8, 1.0, 8]} position={[0, 1.3, 0]}>
        <meshStandardMaterial color="#2E7D32" roughness={0.4} />
      </Cone>
      <Cone args={[0.6, 0.8, 8]} position={[0, 1.9, 0]}>
        <meshStandardMaterial color="#388E3C" roughness={0.4} />
      </Cone>
      <Cone args={[0.4, 0.6, 8]} position={[0, 2.4, 0]}>
        <meshStandardMaterial color="#43A047" roughness={0.4} />
      </Cone>
    </group>
  );
}

// Water Feature Component
function WaterFeature({ x, z, radius = 1.5 }: { x: number; z: number; radius?: number }) {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (waterRef.current) {
      // Gentle water ripple effect
      waterRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    }
  });
  
  return (
    <group position={[x, -0.05, z]}>
      <Circle args={[radius, 32]}>
        <meshStandardMaterial 
          color="#4FC3F7" 
          transparent 
          opacity={0.7} 
          roughness={0.3} 
          metalness={0.8}
        />
      </Circle>
      <Circle args={[radius * 0.7, 32]} position={[0, 0.02, 0]}>
        <meshStandardMaterial 
          color="#29B6F6" 
          transparent 
          opacity={0.5} 
          roughness={0.2} 
          metalness={0.9}
        />
      </Circle>
    </group>
  );
}

// Decorative Flower Component
function Flower({ x, z, color = "#FF69B4" }: { x: number; z: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <Cylinder args={[0.05, 0.07, 0.3]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#228B22" />
      </Cylinder>
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const rad = 0.15;
        return (
          <Sphere 
            key={i} 
            args={[0.08, 8, 8]} 
            position={[Math.cos(angle) * rad, 0.32, Math.sin(angle) * rad]}
          >
            <meshStandardMaterial color={color} roughness={0.2} />
          </Sphere>
        );
      })}
      <Sphere args={[0.1, 8, 8]} position={[0, 0.32, 0]}>
        <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={0.3} />
      </Sphere>
    </group>
  );
}

// Garden Ground Component
function GardenGround() {
  return (
    <>
      {/* Main ground plane with slight elevation variation */}
      <Plane 
        args={[50, 50]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#4A7A3A" roughness={0.8} metalness={0.1} />
      </Plane>
      
      {/* Grid helper for reference */}
      <Grid 
        args={[50, 50]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#6B8E23"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#556B2F"
        position={[0, -0.05, 0]}
      />
      
      {/* Grass patches (sparkles effect) */}
      <Sparkles 
        count={500}
        scale={[50, 1, 50]}
        size={0.1}
        color="#4CAF50"
        opacity={0.4}
      />
    </>
  );
}

// Garden Scene Component
function GardenScene({ beds, plantings, weather, onBedSelect, onPlantSelect }: ThreeDGardenProps) {
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [ambientIntensity, setAmbientIntensity] = useState(0.5);
  const [sunPosition, setSunPosition] = useState([10, 20, 5]);
  const [autoRotate, setAutoRotate] = useState(false);
  
  // Flatten all plantings
  const flattenedPlantings = plantings.map(flattenPlanting);
  
  // Simulate time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setTimeOfDay('night');
    else if (hour < 8) setTimeOfDay('dawn');
    else if (hour < 18) setTimeOfDay('day');
    else if (hour < 20) setTimeOfDay('dusk');
    else setTimeOfDay('night');
    
    // Adjust lighting based on time
    switch (timeOfDay) {
      case 'dawn':
        setAmbientIntensity(0.3);
        setSunPosition([5, 5, 10]);
        break;
      case 'day':
        setAmbientIntensity(0.5);
        setSunPosition([10, 20, 5]);
        break;
      case 'dusk':
        setAmbientIntensity(0.3);
        setSunPosition([-5, 5, 10]);
        break;
      case 'night':
        setAmbientIntensity(0.1);
        setSunPosition([0, -10, 0]);
        break;
    }
  }, [timeOfDay]);
  
  return (
    <>
      {/* Fog for depth perception */}
      <fog attach="fog" args={['#87CEEB', 20, 50]} />
      
      {/* Lighting based on time of day */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={sunPosition as [number, number, number]}
        intensity={timeOfDay === 'day' ? 1.2 : 0.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight 
        position={[0, 5, 0]} 
        intensity={timeOfDay === 'night' ? 0.5 : 0.1} 
        color={timeOfDay === 'night' ? '#FFA500' : '#ffffff'}
      />
      
      {/* Fill light for shadows */}
      <hemisphereLight 
        intensity={0.4} 
        color="#87CEEB" 
        groundColor="#4A7A3A" 
      />
      
      {/* Decorative clouds */}
      <Clouds material={THREE.MeshBasicMaterial} position={[0, 15, -10]} limit={5}>
        <Cloud segments={40} bounds={[10, 2, 10]} volume={8} color="white" />
      </Clouds>
      
      {/* Garden Ground */}
      <GardenGround />
      
      {/* Decorative Trees */}
      <Tree x={-12} z={-10} scale={1.2} />
      <Tree x={12} z={-10} scale={1.2} />
      <Tree x={-10} z={12} scale={1.0} />
      <Tree x={10} z={12} scale={1.0} />
      <Tree x={-14} z={8} scale={0.9} />
      <Tree x={14} z={8} scale={0.9} />
      <Tree x={0} z={-14} scale={1.1} />
      <Tree x={0} z={14} scale={1.1} />
      
      {/* Water Feature */}
      <WaterFeature x={-8} z={-8} radius={2.0} />
      <WaterFeature x={8} z={-8} radius={1.5} />
      
      {/* Decorative Flowers */}
      <Flower x={-6} z={-6} color="#FF69B4" />
      <Flower x={-5} z={-7} color="#FFD700" />
      <Flower x={-7} z={-5} color="#FF6347" />
      <Flower x={6} z={-6} color="#DA70D6" />
      <Flower x={5} z={-7} color="#FFD700" />
      <Flower x={7} z={-5} color="#FF69B4" />
      <Flower x={-6} z={6} color="#FF6347" />
      <Flower x={6} z={6} color="#DA70D6" />
      
      {/* Garden Beds */}
      {beds.map((bed) => (
        <GardenBed 
          key={`bed-${bed.id}`} 
          bed={bed} 
          onClick={() => onBedSelect?.(bed)} 
        />
      ))}
      
      {/* Plants */}
      {flattenedPlantings.map((planting) => (
        <GardenPlant 
          key={`plant-${planting.id}`} 
          planting={planting} 
          onClick={() => onPlantSelect?.(planting)} 
        />
      ))}
      
      {/* Weather Effects */}
      {weather && <WeatherEffects weather={weather} />}
      
      {/* Floating UI */}
      <FloatingUI beds={beds} plantings={flattenedPlantings} />
    </>
  );
}

// Main Component
export default function ThreeDGarden({ beds, plantings, weather, onBedSelect, onPlantSelect }: ThreeDGardenProps) {
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  
  if (!beds.length && !plantings.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[800px] bg-muted rounded-xl">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No garden data available</p>
          <p className="text-sm text-muted-foreground">Add beds and plantings to see your 3D garden</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-[800px] rounded-xl overflow-hidden border bg-black/5">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[12, 10, 15]} fov={50} />
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={1.2}
            rotateSpeed={0.8}
            panSpeed={0.8}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={35}
          />
          
          <Environment preset="forest" />
          
          <GardenScene 
            beds={beds} 
            plantings={plantings} 
            weather={weather}
            onBedSelect={onBedSelect}
            onPlantSelect={onPlantSelect}
          />
          
          <EffectComposer>
            <Bloom 
              intensity={0.5} 
              luminanceThreshold={0.1} 
              luminanceSmoothing={0.9} 
            />
            <Vignette 
              offset={0.5} 
              darkness={0.6} 
            />
          </EffectComposer>
          
          {showStats && <R3FStats />}
        </Suspense>
      </Canvas>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
        >
          {autoRotate ? '⏸️ Stop Rotate' : '▶️ Auto Rotate'}
        </button>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
        <button
          onClick={() => setShowControls(!showControls)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
        >
          {showControls ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>
      
      {/* Instruction Overlay */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm z-10 space-y-1">
          <div>🖱️ Drag to rotate | Right-click to pan | Scroll to zoom</div>
          <div>🌿 Click on plants or beds for details</div>
          <div>✨ Auto-rotate: {autoRotate ? 'ON' : 'OFF'} (toggle in corner)</div>
        </div>
      )}
      
      <Loader />
    </div>
  );
}