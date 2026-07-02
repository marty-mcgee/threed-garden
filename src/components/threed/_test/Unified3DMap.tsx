// components/unified/Unified3DMap.tsx
export function Unified3DMap({ data, layers }: Unified3DMapProps) {
  return (
    <Canvas>
      {/* Base layer: California terrain */}
      <TerrainLayer />
      
      {/* Traffic layer */}
      <TrafficLayer incidents={data.traffic} />
      
      {/* Garden layer */}
      <GardenLayer beds={data.garden.beds} plants={data.garden.plants} />
      
      {/* Weather layer */}
      <WeatherLayer conditions={data.weather} />
      
      {/* FarmBot layer */}
      <FarmBotLayer devices={data.farmbots} />
      
      {/* Controls */}
      <UnifiedControls />
      
      {/* Legend */}
      <UnifiedLegend />
    </Canvas>
  );
}