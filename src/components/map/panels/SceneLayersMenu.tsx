'use client';

import { Eye, EyeOff, Layers } from 'lucide-react';

interface SceneLayersMenuProps {
  availableLayers: readonly string[];
  activeLayers: ReadonlySet<string>;
  allAvailableLayersVisible: boolean;
  availableTypeCounts: Readonly<Record<string, number>>;
  getMarkerColor: (type: string) => string;
  onToggleAllLayers: () => void;
  onToggleLayer: (layer: string) => void;
}

/** Layer inventory only; visibility state and Scene owners stay in the parent. */
export function SceneLayersMenu({ availableLayers, activeLayers, allAvailableLayersVisible, availableTypeCounts, getMarkerColor, onToggleAllLayers, onToggleLayer }: SceneLayersMenuProps) {
  return (
    <>
      <div className="border-t border-foreground/10 my-1"></div>
      <div className="text-[10px] text-foreground/60 px-2 py-0.5 flex items-center gap-1">
        <Layers className="w-3 h-3" />
        <span>Scene Layers</span>
        <button
          onClick={onToggleAllLayers}
          className="ml-auto text-[10px] text-foreground/40 hover:text-foreground/80 transition-colors"
        >
          {allAvailableLayersVisible ? 'Hide All' : 'Show All'}
        </button>
      </div>
      {availableLayers.map((layer) => (
        <button
          key={layer}
          onClick={() => onToggleLayer(layer)}
          className={`w-full text-left px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
            activeLayers.has(layer) 
              ? 'text-foreground hover:bg-foreground/10'
              : 'text-foreground/40 hover:bg-foreground/5'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: activeLayers.has(layer) ? getMarkerColor(layer) : '#4b5563' }}
          />
          <span className="capitalize">{layer}</span>
          <span className="ml-auto text-[10px] flex items-center gap-1">
            <span className="text-foreground/40">{availableTypeCounts[layer] ?? 0}</span>
            {activeLayers.has(layer)
              ? <Eye className="h-3 w-3" />
              : <EyeOff className="h-3 w-3" />}
          </span>
        </button>
      ))}
    </>
  );
}
