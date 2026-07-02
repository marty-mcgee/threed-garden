// src/components/threed/GardenViewer.tsx
'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Box, 
  Plane, 
  Text, 
  Html,
  Sphere,
  Cylinder,
  Grid as ThreeGrid
} from '@react-three/drei';
import * as THREE from 'three';

interface GardenBed {
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

interface Planting {
  id: number;
  plantingId: string;
  plantName: string;
  plantType: string;
  quantity: number;
  positionX: number;
  positionZ: number;
  growthStage: string;
}

interface GardenViewerProps {
  beds: GardenBed[];
  plantings: Planting[];
  onBedClick?: (bed: GardenBed) => void;
  onPlantClick?: (planting: Planting) => void;
}

// Bed component
function Bed({ bed, onClick }: { bed: GardenBed; onClick?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const width = bed.widthFeet || 4;
  const length = bed.lengthFeet || 8;
  
  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1.02);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });
  
  return (
    <group position={[bed.positionX || 0, bed.positionY || 0, bed.positionZ || 0]}>
      <Box
        ref={meshRef}
        args={[width, 0.5, length]}
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={bed.color || '#8B5E3C'} 
          roughness={0.7}
          metalness={0.1}
          emissive={hovered ? '#3a3a3a' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </Box>
      <Box
        args={[width - 0.2, 0.1, length - 0.2]}
        position={[0, 0.3, 0]}
      >
        <meshStandardMaterial 
          color={bed.color ? `${bed.color}cc` : '#A0522Dcc'} 
          roughness={0.3}
        />
      </Box>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {bed.name}
      </Text>
    </group>
  );
}

// Plant component
function Plant({ planting, onClick }: { planting: Planting; onClick?: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const getPlantColor = () => {
    switch (planting.growthStage) {
      case 'seed': return '#8B4513';
      case 'seedling': return '#228B22';
      case 'vegetative': return '#32CD32';
      case 'flowering': return '#FF69B4';
      case 'fruiting': return '#FF4500';
      case 'mature': return '#006400';
      default: return '#2E8B57';
    }
  };
  
  const getPlantHeight = () => {
    switch (planting.growthStage) {
      case 'seed': return 0.1;
      case 'seedling': return 0.3;
      case 'vegetative': return 0.6;
      case 'flowering': return 0.8;
      case 'fruiting': return 1.0;
      case 'mature': return 1.2;
      default: return 0.5;
    }
  };
  
  const height = getPlantHeight();
  const color = getPlantColor();
  
  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1.1);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });
  
  // Position plants within the bed grid
  const spacing = 1.5;
  const offset = (planting.quantity - 1) * spacing / 2;
  
  return (
    <group ref={meshRef}>
      {Array.from({ length: planting.quantity }).map((_, i) => {
        const x = planting.positionX + (i * spacing) - offset;
        const z = planting.positionZ;
        
        return (
          <group
            key={i}
            position={[x, height / 2, z]}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            {/* Stem */}
            <Cylinder
              args={[0.1, 0.15, height]}
              position={[0, -height / 2, 0]}
            >
              <meshStandardMaterial color="#8B4513" />
            </Cylinder>
            
            {/* Foliage */}
            <Sphere args={[height * 0.6, 16, 16]} position={[0, height * 0.2, 0]}>
              <meshStandardMaterial color={color} roughness={0.4} />
            </Sphere>
            
            {/* Optional: Fruit/flower indicator */}
            {(planting.growthStage === 'flowering' || planting.growthStage === 'fruiting') && (
              <Sphere args={[0.15, 8, 8]} position={[0, height * 0.1, 0]}>
                <meshStandardMaterial 
                  color={planting.growthStage === 'fruiting' ? '#FF6347' : '#FFD700'} 
                  emissive={planting.growthStage === 'fruiting' ? '#FF4500' : '#FFA500'}
                  emissiveIntensity={0.3}
                />
              </Sphere>
            )}
            
            {/* Label on hover */}
            {hovered && (
              <Html distanceFactor={10}>
                <div className="bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {planting.plantName}
                  <br />
                  Stage: {planting.growthStage}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Main Garden Viewer Component
export default function GardenViewer({ beds, plantings, onBedClick, onPlantClick }: GardenViewerProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  
  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-100 to-emerald-100 dark:from-sky-950 dark:to-emerald-950 rounded-xl overflow-hidden">
      <Canvas shadows dpr={[1, 2]}>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={45} />
        
        {/* Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 5, 0]} intensity={0.3} />
        <hemisphereLight intensity={0.4} color="#87CEEB" groundColor="#8B4513" />
        
        {/* Ground Grid */}
        <ThreeGrid 
          args={[50, 50]} 
          cellSize={1} 
          cellThickness={0.5} 
          cellColor="#6B8E23"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#556B2F"
        />
        
        {/* Ground Plane */}
        <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#4A7A3A" roughness={0.8} metalness={0.1} />
        </Plane>
        
        {/* Garden Beds */}
        {beds.map((bed) => (
          <Bed key={bed.id} bed={bed} onClick={() => onBedClick?.(bed)} />
        ))}
        
        {/* Plants */}
        {plantings.map((planting) => (
          <Plant key={planting.id} planting={planting} onClick={() => onPlantClick?.(planting)} />
        ))}
      </Canvas>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-sm rounded-lg backdrop-blur-sm transition-colors"
        >
          {autoRotate ? 'Stop Rotate' : 'Auto Rotate'}
        </button>
      </div>
      
      {/* Info Overlay */}
      <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
        🖱️ Drag to rotate | Right-click to pan | Scroll to zoom
      </div>
    </div>
  );
}