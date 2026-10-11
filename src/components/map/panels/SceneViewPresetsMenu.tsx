'use client';

import { Trash2 } from 'lucide-react';
import type { ProjectThreeDViewState } from '@/libraries/services/threed/markers/project-view-state-core';

type ViewPreset = NonNullable<ProjectThreeDViewState['viewPresets']>[number];

interface SceneViewPresetsMenuProps {
  viewPresets: readonly ViewPreset[];
  selectedPresetId: string | null;
  onLoadPreset: (preset: ViewPreset) => void;
  onDeletePreset: (id: string) => void;
}

/** Preset rendering only; camera/layer restoration and deletion stay Scene-owned. */
export function SceneViewPresetsMenu({ viewPresets, selectedPresetId, onLoadPreset, onDeletePreset }: SceneViewPresetsMenuProps) {
  return (
    <>
      <div className="border-t border-foreground/10 my-1"></div>
      <div className="text-[10px] text-foreground/60 px-2 py-0.5">Saved Views</div>
      {viewPresets.map((preset) => (
        <div key={preset.id} className="flex items-center gap-1 group">
          <button
            onClick={() => onLoadPreset(preset)}
            className={`flex-1 text-left px-2 py-0.5 rounded text-xs transition-colors ${
              selectedPresetId === preset.id
                ? 'text-green-700 dark:text-green-400 bg-green-500/20'
                : 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'
            }`}
          >
            {preset.name}
          </button>
          <button
            onClick={() => onDeletePreset(preset.id)}
            className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-red-400 transition-all text-xs px-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </>
  );
}
