// components/threed/controls/Legend3D.tsx
'use client';

import { Html } from '@react-three/drei';
import { LayerVisibility } from '@/lib/types/threed';
import { SOURCE_COLORS } from '@/lib/config/settings';

interface Legend3DProps {
  layers: LayerVisibility;
}

export function Legend3D({ layers }: Legend3DProps) {
  const items = [
    { key: 'traffic' as const, label: 'Traffic', color: SOURCE_COLORS.chp },
    { key: 'garden' as const, label: 'Garden', color: '#22c55e' },
    { key: 'farmbots' as const, label: 'FarmBots', color: '#8b5cf6' },
    { key: 'weather' as const, label: 'Weather', color: '#60a5fa' },
  ];

  const visibleItems = items.filter(item => layers[item.key]);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <Html position={[-4, 0, -4]} distanceFactor={10}>
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700 min-w-[140px]">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</h4>
        <div className="space-y-1.5">
          {visibleItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">●</span>
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
}