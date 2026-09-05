'use client';

import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FarmBotPlacementDraft } from '@/lib/services/threed/markers/library-placement-client-core';

export interface ThreeDFarmBotLibraryItem {
  id: number;
  name: string;
  assetCode: string;
  status?: string | null;
}

interface ThreeDModuleOption {
  id: number;
  name: string;
}

interface ThreeDFarmBotLibraryPanelProps {
  isOpen: boolean;
  projectModules: ThreeDModuleOption[];
  selectedModuleId: number | null;
  onSelectedModuleChange: (moduleId: number) => void;
  farmBots: ThreeDFarmBotLibraryItem[];
  placedFarmBotIds: ReadonlySet<number>;
  loading: boolean;
  placing: boolean;
  placementFarmBot: ThreeDFarmBotLibraryItem | null;
  placementDraft: FarmBotPlacementDraft;
  onPlacementDraftChange: (field: keyof FarmBotPlacementDraft, value: string) => void;
  onSelectFarmBot: (farmBot: ThreeDFarmBotLibraryItem) => void;
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

export function ThreeDFarmBotLibraryPanel({
  isOpen,
  projectModules,
  selectedModuleId,
  onSelectedModuleChange,
  farmBots,
  placedFarmBotIds,
  loading,
  placing,
  placementFarmBot,
  placementDraft,
  onPlacementDraftChange,
  onSelectFarmBot,
  onCancelPlacement,
  onClose,
}: ThreeDFarmBotLibraryPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-0 left-0 top-10 z-40 flex w-72 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-md border bg-background/90 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">ThreeD FarmBot Library</h2>
          <p className="text-[11px] text-muted-foreground">
            Select an existing FarmBot, set its Project dimensions, then click the Scene ground.
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
            disabled={placing}
            onChange={(event) => onSelectedModuleChange(Number(event.target.value))}
          >
            {projectModules.map((module) => (
              <option key={module.id} value={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
      )}

      {placementFarmBot && (
        <div className="mb-2 grid grid-cols-2 gap-2 rounded border border-slate-500/40 bg-slate-500/10 p-2 text-xs">
          <div className="col-span-2 font-medium">
            Placing {placementFarmBot.name}{placing ? '…' : ' — click the Scene ground'}
          </div>
          {DIMENSION_FIELDS.map(([field, label, step]) => (
            <label key={field}>
              <span className="mb-1 block text-muted-foreground">{label}</span>
              <Input
                type="number"
                step={step}
                value={placementDraft[field]}
                disabled={placing}
                className="h-8 text-xs"
                onChange={(event) => onPlacementDraftChange(field, event.target.value)}
              />
            </label>
          ))}
          <label>
            <span className="mb-1 block text-muted-foreground">Color</span>
            <Input
              type="color"
              value={placementDraft.color}
              disabled={placing}
              className="h-8 w-full p-1"
              onChange={(event) => onPlacementDraftChange('color', event.target.value)}
            />
          </label>
          <Button type="button" variant="outline" size="sm" className="h-7 self-end text-xs" disabled={placing} onClick={onCancelPlacement}>
            Cancel
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading FarmBots…
          </div>
        ) : farmBots.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No active owned FarmBots are available.</p>
        ) : farmBots.map((farmBot) => {
          const isPlaced = placedFarmBotIds.has(Number(farmBot.id));
          return (
            <div key={farmBot.id} className="flex items-center gap-2 rounded border p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-500/10">🤖</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{farmBot.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {farmBot.assetCode} · {farmBot.status ?? 'offline'}
                </div>
              </div>
              <Button type="button" size="sm" className="h-7 text-xs" disabled={!selectedModuleId || placing || isPlaced} onClick={() => onSelectFarmBot(farmBot)}>
                {isPlaced ? 'Placed' : 'Place'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
