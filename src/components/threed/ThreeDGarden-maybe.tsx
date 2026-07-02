// components/threed/ThreeDGarden.tsx
'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Plane, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Import markers directly
import { TrafficMarker3D } from './markers/TrafficMarker3D';
import { PlantMarker3D } from './markers/PlantMarker3D';
import { GardenBedMarker3D } from './markers/GardenBedMarker3D';
import { FarmBotMarker3D } from './markers/FarmBotMarker3D';
import { WeatherEffects } from './effects/WeatherEffects';

// Import utilities
import { ThreeDData } from '@/lib/types/threed';
import { latLngToPosition } from './shared/coordinates';
import { getSourceColor, getSourceIcon } from './shared/colors';

interface ThreeDGardenProps {
  data: ThreeDData;
  autoRotate?: boolean;
  height?: string;
}

export function ThreeDGarden({ data, autoRotate = true, height = '700px' }: ThreeDGardenProps) {
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

        {/* === RENDER ALL DATA DIRECTLY === */}

        {/* Traffic incidents */}
        {data.traffic?.map((incident) => {
          const pos = latLngToPosition(incident.lat, incident.lng);
          return (
            <TrafficMarker3D
              key={incident.id}
              incident={incident}
              position={pos}
            />
          );
        })}

        {/* Garden beds */}
        {data.beds?.map((bed) => (
          <GardenBedMarker3D
            key={bed.id}
            bed={bed}
            position={[bed.x || 0, 0, bed.z || 0]}
          />
        ))}

        {/* Plants */}
        {data.plants?.map((plant) => (
          <PlantMarker3D
            key={plant.id}
            plant={plant}
            position={[plant.x || 0, 0, plant.z || 0]}
          />
        ))}

        {/* FarmBots */}
        {data.farmbots?.map((farmbot) => (
          <FarmBotMarker3D
            key={farmbot.id}
            farmbot={farmbot}
            position={[farmbot.x || 0, 0, farmbot.z || 0]}
          />
        ))}

        {/* Weather effects */}
        <WeatherEffects weather={data.weather} />

        {/* Info overlay */}
        <Html position={[-4, 0, -4]} distanceFactor={10}>
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700 min-w-[180px]">
            <p className="font-medium text-sm">🌍 ThreeD Garden</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>🚨 {data.traffic?.length || 0} Incidents</p>
              <p>🌱 {data.plants?.length || 0} Plants</p>
              <p>🛏️ {data.beds?.length || 0} Beds</p>
              <p>🤖 {data.farmbots?.length || 0} FarmBots</p>
              {data.weather && (
                <p>🌡️ {data.weather.temperature}°F</p>
              )}
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  );
}