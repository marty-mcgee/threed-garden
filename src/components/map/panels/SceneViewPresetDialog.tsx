'use client';
import { X } from 'lucide-react';

interface SceneViewPresetDialogProps {
  newPresetName: string;
  onNameChange: (name: string) => void;
  saveCurrentView: () => void;
  onClose: () => void;
}

/** Controlled dialog; preset creation and camera reads remain in the Scene. */
export function SceneViewPresetDialog({ newPresetName, onNameChange, saveCurrentView, onClose }: SceneViewPresetDialogProps) {
  return (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="threed-workspace-panel border border-foreground/10 rounded-lg p-4 max-w-sm w-full mx-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Save Current View</h3>
        <button
          onClick={onClose}
          className="text-foreground/40 hover:text-foreground/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-foreground/50 mb-3">
        Name the current camera position and active layers. Then use Save Project to keep the view after reload.
      </p>

      <input
        type="text"
        placeholder="Enter view name..."
        value={newPresetName}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveCurrentView();
          if (e.key === 'Escape') onClose();
        }}
        className="w-full bg-foreground/5 border border-foreground/10 rounded px-3 py-2 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-foreground/30 transition-colors"
        autoFocus
      />

      <div className="flex gap-2 mt-3">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-1.5 text-xs text-foreground/60 hover:text-foreground/80 border border-foreground/10 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveCurrentView}
          className="flex-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
        >
          Save View
        </button>
      </div>
    </div>
  </div>
  );
}
