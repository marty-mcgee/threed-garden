// components/threed/layers/WeatherLayer.tsx
'use client';

import { Weather3D } from '@/lib/types/threed';
import { WeatherEffects } from '../effects/WeatherEffects';

interface WeatherLayerProps {
  weather: Weather3D | null;
}

export function WeatherLayer({ weather }: WeatherLayerProps) {
  if (!weather) {
    return null;
  }

  return <WeatherEffects weather={weather} />;
}