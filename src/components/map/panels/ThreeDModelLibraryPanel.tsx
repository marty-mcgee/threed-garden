'use client';

import { Box, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  createThreeDModelLibraryDragPayload,
  THREED_MODEL_LIBRARY_DRAG_MIME,
} from '@/lib/services/threed/markers/model-library-drag-core';
import type { MapViewMode } from '@/lib/types/map';
import type { ThreeDModelLibraryItem } from '@/lib/types/threed';

type ModelCategory = ThreeDModelLibraryItem['categories'][number];

interface ThreeDModuleOption {
  id: number;
  name: string;
}

interface ThreeDModelLibraryPanelProps {
  isOpen: boolean;
  viewMode: MapViewMode;
  projectModules: ThreeDModuleOption[];
  selectedModuleId: number | null;
  onSelectedModuleChange: (moduleId: number) => void;
  categories: ModelCategory[];
  selectedCategorySlug: string;
  onSelectedCategoryChange: (slug: string) => void;
  allModelCount: number;
  visibleModels: ThreeDModelLibraryItem[];
  inspectedModel: ThreeDModelLibraryItem | null;
  inspectedModelId: number | null;
  onInspectModel: (modelId: number | null) => void;
  placementModel: ThreeDModelLibraryItem | null;
  placementScaleMultiplier: string;
  onPlacementScaleMultiplierChange: (value: string) => void;
  placementRole: 'object' | 'environment';
  onPlacementRoleChange: (role: 'object' | 'environment') => void;
  loading: boolean;
  placing: boolean;
  onBeginPlacement: (model: ThreeDModelLibraryItem) => void;
  onCancelPlacement: () => void;
  onClose: () => void;
}

export function ThreeDModelLibraryPanel({
  isOpen,
  viewMode,
  projectModules,
  selectedModuleId,
  onSelectedModuleChange,
  categories,
  selectedCategorySlug,
  onSelectedCategoryChange,
  allModelCount,
  visibleModels,
  inspectedModel,
  inspectedModelId,
  onInspectModel,
  placementModel,
  placementScaleMultiplier,
  onPlacementScaleMultiplierChange,
  placementRole,
  onPlacementRoleChange,
  loading,
  placing,
  onBeginPlacement,
  onCancelPlacement,
  onClose,
}: ThreeDModelLibraryPanelProps) {
  if (!isOpen) return null;

  const placementSurface = viewMode === 'combined'
    ? 'Combined View'
    : viewMode === '2d'
      ? '2D Map'
      : '3D Scene';

  return (
    <div className="absolute bottom-0 left-0 top-10 z-40 flex w-72 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-md border bg-background/90 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">ThreeD Model Library</h2>
          <p className="text-[11px] text-muted-foreground">
            Drag a model onto the active 2D Map or ThreeD Scene, or choose Place and click.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={placing} onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {projectModules.length > 1 && (
        <label className="mb-2 block text-xs">
          <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
          <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={selectedModuleId ?? ''} onChange={(event) => onSelectedModuleChange(Number(event.target.value))}>
            {projectModules.map((module) => (
              <option key={module.id} value={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
      )}

      {categories.length > 0 && (
        <label className="mb-2 block text-xs">
          <span className="mb-1 block text-muted-foreground">Category</span>
          <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={selectedCategorySlug} onChange={(event) => onSelectedCategoryChange(event.target.value)}>
            <option value="all">All Models</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </label>
      )}

      {inspectedModel && (
        <div className="mb-2 space-y-1 rounded border bg-muted/30 p-2 text-[10px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{inspectedModel.modelName}</div>
              <div className="uppercase text-muted-foreground">{inspectedModel.modelType}</div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0" aria-label="Close Model metadata" title="Close Model metadata" onClick={() => onInspectModel(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-2 text-muted-foreground">
            <span>Base scale</span><span className="text-right text-foreground">{Number(inspectedModel.scale ?? 1)}</span>
            <span>Y rotation</span><span className="text-right text-foreground">{Number(inspectedModel.rotationY ?? 0)}°</span>
            <span>File size</span><span className="text-right text-foreground">{inspectedModel.fileSize ? `${(inspectedModel.fileSize / 1024 / 1024).toFixed(1)} MB` : '—'}</span>
          </div>
          {inspectedModel.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {inspectedModel.categories.map((category) => (
                <span key={category.id} className="rounded bg-muted px-1.5 py-0.5 text-[9px]">{category.name}</span>
              ))}
            </div>
          )}
          <Button type="button" size="sm" className="mt-1 h-6 w-full text-[10px]" disabled={!selectedModuleId || placing} onClick={() => onBeginPlacement(inspectedModel)}>
            Place Selected in {placementSurface}
          </Button>
        </div>
      )}

      {placementModel && (
        <div className="mb-2 space-y-2 rounded border border-cyan-500/40 bg-cyan-500/10 p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span>
              Placing <strong>{placementModel.modelName}</strong>
              {placing ? '…' : ' — click a map or Scene destination'}
            </span>
            <Button type="button" variant="outline" size="sm" className="h-6 text-[10px]" disabled={placing} onClick={onCancelPlacement}>Cancel</Button>
          </div>
          <label className="grid grid-cols-[1fr_7rem] items-center gap-2">
            <span>
              Instance scale
              <span className="ml-1 text-[10px] text-muted-foreground">(model base: {Number(placementModel.scale ?? 1)})</span>
            </span>
            <Input
              type="number"
              min="0.0001"
              max="10000"
              step="any"
              value={placementScaleMultiplier}
              disabled={placing}
              onChange={(event) => onPlacementScaleMultiplierChange(event.target.value)}
              className="h-7 px-2 text-xs"
              aria-label="Model instance scale multiplier"
            />
          </label>
          <label className="flex items-center justify-between gap-2 rounded border bg-background/60 px-2 py-1.5">
            <span>
              <span className="block text-xs">Project environment / base map</span>
              <span className="block text-[10px] text-muted-foreground">Hides only the procedural grass and does not create a giant obstacle collider.</span>
            </span>
            <Switch checked={placementRole === 'environment'} disabled={placing} onCheckedChange={(checked) => onPlacementRoleChange(checked ? 'environment' : 'object')} />
          </label>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading models…
          </div>
        ) : visibleModels.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {allModelCount === 0 ? 'No active public Library models are available.' : 'No Library models match this category.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {visibleModels.map((model) => (
              <div
                key={model.id}
                draggable={Boolean(selectedModuleId) && !placing}
                onDragStart={(event) => {
                  onBeginPlacement(model);
                  event.dataTransfer.effectAllowed = 'copy';
                  event.dataTransfer.setData(THREED_MODEL_LIBRARY_DRAG_MIME, createThreeDModelLibraryDragPayload(model.id));
                  event.dataTransfer.setData('text/plain', model.modelName);
                }}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${model.modelName}`}
                onClick={() => onInspectModel(model.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onInspectModel(model.id);
                  }
                }}
                className={`group cursor-grab overflow-hidden rounded border bg-card text-left active:cursor-grabbing ${inspectedModelId === model.id ? 'border-cyan-500 ring-1 ring-cyan-500/40' : ''}`}
              >
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/40">
                  {model.thumbnailUrl ? (
                    <img src={model.thumbnailUrl} alt={`${model.modelName} top-view preview`} className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                  ) : (
                    <Box className="h-8 w-8 text-cyan-600/60" />
                  )}
                </div>
                <div className="min-w-0 p-2">
                  <div className="truncate text-xs font-medium">{model.modelName}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{model.modelType}</div>
                  <Button type="button" size="sm" className="mt-1.5 h-6 w-full text-[10px]" disabled={!selectedModuleId || placing} draggable={false} onClick={(event) => { event.stopPropagation(); onBeginPlacement(model); }}>
                    Place
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
