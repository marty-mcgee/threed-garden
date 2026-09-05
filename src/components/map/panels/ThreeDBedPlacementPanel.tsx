'use client';

import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ThreeDBedPlacementDraft {
  name: string;
  shape: string;
  widthFeet: string;
  lengthFeet: string;
  heightFeet: string;
  color: string;
  rotation: string;
  scale: string;
}

interface ThreeDModuleOption {
  id: number;
  name: string;
}

interface ThreeDBedPlacementPanelProps {
  isOpen: boolean;
  projectModules: ThreeDModuleOption[];
  selectedModuleId: number | null;
  draft: ThreeDBedPlacementDraft;
  placementActive: boolean;
  placing: boolean;
  onSelectedModuleChange: (moduleId: number) => void;
  onDraftChange: (field: keyof ThreeDBedPlacementDraft, value: string) => void;
  onBeginPlacement: () => void;
  onCancelPlacement: () => void;
  onClose: () => void;
}

const DIMENSION_FIELDS = [
  ['widthFeet', 'Width (ft)', '0.1'],
  ['lengthFeet', 'Length (ft)', '0.1'],
  ['heightFeet', 'Height (ft)', '0.1'],
  ['rotation', 'Y rotation', '0.1'],
  ['scale', 'Scale', '0.01'],
] as const;

export function ThreeDBedPlacementPanel({
  isOpen,
  projectModules,
  selectedModuleId,
  draft,
  placementActive,
  placing,
  onSelectedModuleChange,
  onDraftChange,
  onBeginPlacement,
  onCancelPlacement,
  onClose,
}: ThreeDBedPlacementPanelProps) {
  if (!isOpen) return null;

  const inputsDisabled = placementActive || placing;

  return (
    <div className="absolute bottom-0 left-0 top-10 z-40 flex w-72 max-w-[calc(100vw-1rem)] flex-col overflow-y-auto rounded-md border bg-background/90 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Add ThreeD Bed</h2>
          <p className="text-[11px] text-muted-foreground">
            Set the Bed parameters, then choose its location in the ThreeD Scene.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={placing} onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {projectModules.length > 1 && (
        <label className="mb-2 block text-xs">
          <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
          <select
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={selectedModuleId ?? ''}
            disabled={inputsDisabled}
            onChange={(event) => onSelectedModuleChange(Number(event.target.value))}
          >
            {projectModules.map((module) => (
              <option key={module.id} value={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="col-span-2">
          <span className="mb-1 block text-muted-foreground">Bed name</span>
          <Input
            value={draft.name}
            disabled={inputsDisabled}
            maxLength={100}
            className="h-8 text-xs"
            onChange={(event) => onDraftChange('name', event.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-muted-foreground">Shape</span>
          <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={draft.shape} disabled>
            <option value="rectangle">rectangle</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-muted-foreground">Color</span>
          <Input
            type="color"
            value={draft.color}
            disabled={inputsDisabled}
            className="h-8 w-full p-1"
            onChange={(event) => onDraftChange('color', event.target.value)}
          />
        </label>
        {DIMENSION_FIELDS.map(([field, label, step]) => (
          <label key={field}>
            <span className="mb-1 block text-muted-foreground">{label}</span>
            <Input
              type="number"
              step={step}
              value={draft[field]}
              disabled={inputsDisabled}
              className="h-8 text-xs"
              onChange={(event) => onDraftChange(field, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
        {placementActive && (
          <span className="mr-auto text-[11px] text-cyan-600">Click the Scene ground to place the Bed.</span>
        )}
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={placing} onClick={onCancelPlacement}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs"
          disabled={!selectedModuleId || !draft.name.trim() || placementActive || placing}
          onClick={onBeginPlacement}
        >
          {placing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Place Bed
        </Button>
      </div>
    </div>
  );
}
