// components/threed/controls/LayerToggles.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Car, Carrot, Cloud, Cpu } from 'lucide-react';
import { LayerVisibility } from '@/lib/types/threed';

interface LayerTogglesProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
}

export function LayerToggles({ layers, onToggle }: LayerTogglesProps) {
  const items = [
    { key: 'traffic' as const, label: 'Traffic', icon: Car },
    { key: 'garden' as const, label: 'Garden', icon: Carrot },
    { key: 'weather' as const, label: 'Weather', icon: Cloud },
    { key: 'farmbots' as const, label: 'FarmBots', icon: Cpu },
  ];

  const activeCount = Object.values(layers).filter(v => v).length;
  const totalCount = items.length;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={layers[key] ? "default" : "outline"}
          size="sm"
          onClick={() => onToggle(key)}
          className="transition-all duration-200"
        >
          <Icon className="w-3.5 h-3.5 mr-1.5" />
          {label}
          <span className="ml-1.5 text-xs opacity-70">
            {layers[key] ? 'ON' : 'OFF'}
          </span>
        </Button>
      ))}
      
      <div className="text-xs text-muted-foreground self-center ml-2">
        {activeCount}/{totalCount} active
      </div>
    </div>
  );
}