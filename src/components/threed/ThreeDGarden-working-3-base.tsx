// src/components/threed/ThreeDGarden.tsx
'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, Cloud, Stats } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// Import your existing components
import { GardenBed } from './GardenBed';
import { GardenGround } from './GardenGround';
import { GardenPlant } from './GardenPlant';
import { WeatherEffects } from './WeatherEffects';
import { FloatingUI } from './FloatingUI';

// Enhanced Lighting Component
function EnhancedLighting() {
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  
  return (
    <>
      {/* Main directional light (sun) */}
      <directionalLight
        ref={sunLightRef}
        position={[15, 20, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.05}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10, 0.5, 30]} />
      </directionalLight>
      
      {/* Fill light from below (bounce light) */}
      <pointLight
        position={[0, -2, 0]}
        intensity={0.4}
        color="#8B5E3C"
      />
      
      {/* Back rim light for edge definition */}
      <pointLight
        position={[-5, 5, -8]}
        intensity={0.5}
        color="#FFD700"
      />
      
      {/* Warm fill from the side */}
      <pointLight
        position={[8, 4, 6]}
        intensity={0.3}
        color="#FFA500"
      />
      
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.4} />
      
      {/* Hemisphere light for sky/ground bounce */}
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#8B5E3C"
        intensity={0.5}
      />
    </>
  );
}

// Animated floating particles
function FloatingParticles({ count = 200 }: { count?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  
  return (
    <points ref={particlesRef}>
      <pointsMaterial
        color="#FFD700"
        size={0.05}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
      <bufferGeometry />
    </points>
  );
}

// Animated clouds
function AnimatedClouds() {
  const cloudGroupRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={cloudGroupRef} position={[0, 12, -5]}>
      <Cloud
        position={[-3, 0, 0]}
        scale={1.5}
        speed={0.2}
        opacity={0.8}
        color="#ffffff"
      />
      <Cloud
        position={[2, 1, -2]}
        scale={1.2}
        speed={0.15}
        opacity={0.7}
        color="#f0f0f0"
      />
      <Cloud
        position={[0, -0.5, 2]}
        scale={1.8}
        speed={0.25}
        opacity={0.6}
        color="#e8e8e8"
      />
    </group>
  );
}

// Main ThreeDGarden Component
interface ThreeDGardenProps {
  beds: any[];
  plantings: any[];
  weather?: any;
  showControls?: boolean;
}

export function ThreeDGarden({ beds, plantings, weather, showControls = true }: ThreeDGardenProps) {
  const [showStats, setShowStats] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showEffects, setShowEffects] = useState(true);
  const [quality] = useState<'high' | 'medium' | 'low'>(
    plantings.length > 150 ? 'low' : plantings.length > 80 ? 'medium' : 'high'
  );
  
  return (
    <div className="w-full h-[600px] relative rounded-lg overflow-hidden">
      {/* UI Overlay */}
      {showControls && (
        <FloatingUI
          onToggleStats={() => setShowStats(!showStats)}
          onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
          onToggleEffects={() => setShowEffects(!showEffects)}
          autoRotate={autoRotate}
          showEffects={showEffects}
        />
      )}
      
      <Canvas
        camera={{ position: [12, 8, 12], fov: 45, near: 0.1, far: 100 }}
        shadows={quality !== 'low'}
        dpr={quality === 'high' ? [1, 2] : quality === 'medium' ? [1, 1.5] : 1}
        gl={{
          antialias: quality !== 'low',
          alpha: false,
          powerPreference: "high-performance"
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Scene Background */}
        <color attach="background" args={['#87CEEB']} />
        <fog attach="fog" args={['#87CEEB', 25, 50]} />
        
        {/* Sky and Atmosphere */}
        <Sky
          distance={450}
          sunPosition={[15, 20, 5]}
          inclination={0.6}
          azimuth={0.2}
          rayleigh={0.5}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        
        {/* Enhanced Lighting */}
        <EnhancedLighting />
        
        {/* Environment Map (reflections) */}
        <Environment preset="park" background={false} />
        
        {/* Decorative Elements */}
        {quality !== 'low' && (
          <>
            <AnimatedClouds />
            <FloatingParticles count={150} />
          </>
        )}
        
        {/* Garden Ground */}
        <GardenGround />
        
        {/* Garden Beds - CRITICAL: Keep your bed rendering */}
        <Suspense fallback={null}>
          {beds.map((bed) => (
            <GardenBed key={`bed-${bed.id}`} bed={bed} />
          ))}
        </Suspense>
        
        {/* Plants - CRITICAL: This renders your GLB/FBX models */}
        <Suspense fallback={null}>
          {plantings.map((planting) => (
            <GardenPlant key={`plant-${planting.id}`} planting={planting} />
          ))}
        </Suspense>
        
        {/* Weather Effects */}
        {weather && <WeatherEffects weather={weather} />}
        
        {/* Post Processing Effects */}
        {showEffects && quality !== 'low' && (
          <EffectComposer>
            <Bloom
              intensity={0.4}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.1}
              mipmapBlur
            />
            <Vignette
              offset={0.2}
              darkness={0.3}
              eskil={false}
            />
          </EffectComposer>
        )}
        
        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          zoomSpeed={0.8}
          rotateSpeed={0.8}
          panSpeed={0.8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={25}
        />
        
        {/* Performance Stats */}
        {showStats && <Stats />}
      </Canvas>
    </div>
  );
}