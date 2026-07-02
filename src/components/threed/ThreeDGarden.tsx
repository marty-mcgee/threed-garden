// components/threed/ThreeDGarden.tsx
'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Plane, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Import layers
// import { TrafficLayer } from './layers/TrafficLayer';
import { GardenLayer } from './layers/GardenLayer';
import { FarmBotLayer } from './layers/FarmBotLayer';
import { WeatherLayer } from './layers/WeatherLayer';
import { Legend3D } from './controls/Legend3D';

// Import types
import { ThreeDData, LayerVisibility } from '@/lib/types/threed';

interface ThreeDGardenProps {
  data: ThreeDData;
  layers: LayerVisibility;
  autoRotate?: boolean;
  height?: string;
}

export function ThreeDGarden({
  data,
  layers,
  autoRotate = true,
  height = '700px',
}: ThreeDGardenProps) {
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ height, width: '100%' }}>
      <Canvas
        camera={{ position: [0, 8, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        <Environment preset="city" />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
        />

        {/* Ground */}
        <Plane
          args={[12, 12]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#e5e7eb"
            transparent
            opacity={0.7}
            roughness={0.9}
            metalness={0}
          />
        </Plane>

        <Grid
          args={[12, 20]}
          position={[0, -0.05, 0]}
          cellColor="#9ca3af"
          sectionColor="#d1d5db"
        />

        {/* === LAYERS === */}
        {/* {layers.traffic && <TrafficLayer incidents={data.traffic} />} */}
        {layers.garden && <GardenLayer beds={data.beds} plants={data.plants} />}
        {layers.farmbots && <FarmBotLayer farmbots={data.farmbots} />}
        {layers.weather && <WeatherLayer weather={data.weather} />}

        {/* Legend */}
        <Legend3D layers={layers} />

        {/* Info overlay */}
        <Html position={[-4, 0, -4]} distanceFactor={10}>
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700 min-w-[160px]">
            <p className="font-medium text-sm">🌍 ThreeD Garden</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {layers.traffic && <p>🚨 {data.traffic?.length || 0} Incidents</p>}
              {layers.garden && <p>🌱 {data.plants?.length || 0} Plants</p>}
              {layers.garden && <p>🛏️ {data.beds?.length || 0} Beds</p>}
              {layers.farmbots && <p>🤖 {data.farmbots?.length || 0} FarmBots</p>}
              {layers.weather && data.weather && (
                <p>🌡️ {data.weather.temperature}°F</p>
              )}
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  );
}