'use client';

import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ThreeDPlantingOption {
  id: number;
  commonName: string;
  variety?: string | null;
}

export interface ThreeDPlantingBedOption {
  id: number;
  name?: string | null;
}

export interface ThreeDPlantingPlacementDraft {
  plantId: string;
  bedId: string;
  quantity: string;
  spacingInches: string;
  modelScale: string;
}

interface ThreeDModuleOption {
  id: number;
  name: string;
}

interface ThreeDPlantingPlacementPanelProps {
  isOpen: boolean;
  projectModules: ThreeDModuleOption[];
  selectedModuleId: number | null;
  plants: ThreeDPlantingOption[];
  beds: ThreeDPlantingBedOption[];
  draft: ThreeDPlantingPlacementDraft;
  loadingPlants: boolean;
  placementActive: boolean;
  placing: boolean;
  onSelectedModuleChange: (moduleId: number) => void;
  onDraftChange: (field: keyof ThreeDPlantingPlacementDraft, value: string) => void;
  onBeginPlacement: () => void;
  onCancelPlacement: () => void;
  onClose: () => void;
}

const PLACEMENT_FIELDS = [
  ['quantity', 'Quantity', '1'],
  ['spacingInches', 'Spacing (in)', '1'],
  ['modelScale', 'Model scale', '0.01'],
] as const;

export function ThreeDPlantingPlacementPanel({
  isOpen,
  projectModules,
  selectedModuleId,
  plants,
  beds,
  draft,
  loadingPlants,
  placementActive,
  placing,
  onSelectedModuleChange,
  onDraftChange,
  onBeginPlacement,
  onCancelPlacement,
  onClose,
}: ThreeDPlantingPlacementPanelProps) {
  if (!isOpen) return null;

  const inputsDisabled = placementActive || placing;

  return (
    <div className="absolute bottom-0 left-0 top-10 z-40 flex w-72 max-w-[calc(100vw-1rem)] flex-col overflow-y-auto rounded-md border bg-background/90 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Add ThreeD Planting</h2>
          <p className="text-[11px] text-muted-foreground">
            Select a Plant, then choose its location in the ThreeD Scene.
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
          <span className="mb-1 block text-muted-foreground">Plant</span>
          <select
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={draft.plantId}
            disabled={inputsDisabled || loadingPlants}
            onChange={(event) => onDraftChange('plantId', event.target.value)}
          >
            {loadingPlants && <option value="">Loading Plants…</option>}
            {!loadingPlants && plants.length === 0 && <option value="">No active Plants available</option>}
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.commonName}{plant.variety ? ` — ${plant.variety}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-muted-foreground">Project Bed (optional)</span>
          <select
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={draft.bedId}
            disabled={inputsDisabled}
            onChange={(event) => onDraftChange('bedId', event.target.value)}
          >
            <option value="">No Bed</option>
            {beds.map((bed) => (
              <option key={bed.id} value={bed.id}>{bed.name || `Bed #${bed.id}`}</option>
            ))}
          </select>
        </label>
        {PLACEMENT_FIELDS.map(([field, label, step]) => (
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
          <span className="mr-auto text-[11px] text-emerald-600">Click the Scene ground to place the Planting.</span>
        )}
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={placing} onClick={onCancelPlacement}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs"
          disabled={!selectedModuleId || !draft.plantId || placementActive || placing}
          onClick={onBeginPlacement}
        >
          {placing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Place Planting
        </Button>
      </div>
    </div>
  );
}
