'use client';

import { AlertTriangle, Box, CheckCircle2, ExternalLink, Loader2, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  createThreeDModelLibraryDragPayload,
  THREED_MODEL_LIBRARY_DRAG_MIME,
} from '@/libraries/services/threed/markers/model-library-drag-core';
import type { MapViewMode } from '@/libraries/types/map';
import type { ThreeDModelLibraryItem } from '@/libraries/types/threed';
import { ThreeDModelLibraryPreview } from '@/components/threed/models/ThreeDModelLibraryPreview';
import type { ThreeDModelLibraryCollection } from '@/libraries/services/threed/models/model-library-collections-core';

type ModelCategory = ThreeDModelLibraryItem['categories'][number];

const READINESS_LABELS = {
  ready: 'Ready',
  needs_configuration: 'Needs configuration',
  unavailable: 'Unavailable',
} as const;

function ModelReadinessBadge({ model }: { model: ThreeDModelLibraryItem }) {
  const ready = model.libraryReadiness.status === 'ready';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
      ready
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    }`}>
      {ready ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
      {READINESS_LABELS[model.libraryReadiness.status]}
    </span>
  );
}

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
  collections: ThreeDModelLibraryCollection[];
  selectedCategorySlug: string;
  onSelectedCategoryChange: (slug: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  allModelCount: number;
  visibleModels: ThreeDModelLibraryItem[];
  inspectedModel: ThreeDModelLibraryItem | null;
  inspectedModelId: number | null;
  onInspectModel: (modelId: number | null) => void;
  placementModel: ThreeDModelLibraryItem | null;
  placementDraft: { x: string; y: string; z: string; rotationY: string };
  onPlacementDraftChange: (field: 'x' | 'y' | 'z' | 'rotationY', value: string) => void;
  onPlaceAtCoordinates: (model: ThreeDModelLibraryItem) => void;
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
  collections,
  selectedCategorySlug,
  onSelectedCategoryChange,
  search,
  onSearchChange,
  allModelCount,
  visibleModels,
  inspectedModel,
  inspectedModelId,
  onInspectModel,
  placementModel,
  placementDraft,
  onPlacementDraftChange,
  onPlaceAtCoordinates,
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

  const numericPlacementScale = Number(placementScaleMultiplier);
  const placementScaleIsValid = Number.isFinite(numericPlacementScale)
    && numericPlacementScale >= 0.0001
    && numericPlacementScale <= 10_000;

  const placementSurface = viewMode === 'combined'
    ? 'Combined View'
    : viewMode === '2d'
      ? '2D Map'
      : '3D Scene';

  return (
    <div className="threed-workspace-panel threed-scene-panel-surface threed-model-library-panel absolute bottom-0 left-0 top-9 z-40 flex w-72 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-md border p-3 shadow-xl backdrop-blur-md">
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
          <select className="h-8 w-full min-w-0 max-w-full rounded-md border bg-background px-2 text-xs" value={selectedModuleId ?? ''} onChange={(event) => onSelectedModuleChange(Number(event.target.value))}>
            {projectModules.map((module) => (
              <option key={module.id} value={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
      )}

      <label className="mb-2 block text-xs">
        <span className="mb-1 block text-muted-foreground">Collection</span>
        <select
          className="h-8 w-full min-w-0 max-w-full rounded-md border bg-background px-2 text-xs"
          value={selectedCategorySlug}
          onChange={(event) => onSelectedCategoryChange(event.target.value)}
        >
          <option value="all">All Models ({allModelCount})</option>
          {collections.map((collection) => (
            <option key={collection.slug} value={collection.slug}>
              {collection.name} ({collection.modelCount})
            </option>
          ))}
        </select>
      </label>

      <label className="mb-2 block text-xs">
        <span className="mb-1 block text-muted-foreground">Search by name</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            placeholder="Find a Model…"
            className="h-8 pl-7 pr-8 text-xs"
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2"
              aria-label="Clear Model search"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </span>
      </label>

      {inspectedModel && (
        <div className="mb-2 space-y-1 rounded border bg-muted/30 p-2 text-[10px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="break-words text-xs font-medium [overflow-wrap:anywhere]">{inspectedModel.modelName}</div>
              <div className="uppercase text-muted-foreground">{inspectedModel.modelType}</div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0" aria-label="Close Model metadata" title="Close Model metadata" onClick={() => onInspectModel(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          {inspectedModel.libraryReadiness.primaryFileAvailable && (
            <ThreeDModelLibraryPreview model={inspectedModel} />
          )}
          <div className="grid grid-cols-2 gap-x-2 text-muted-foreground">
            <span>Saved base scale</span><span className="text-right text-foreground">{Number(inspectedModel.scale ?? 1)}</span>
            <span>Y rotation</span><span className="text-right text-foreground">{Number(inspectedModel.rotationY ?? 0)}°</span>
            <span>File size</span><span className="text-right text-foreground">{inspectedModel.fileSize ? `${(inspectedModel.fileSize / 1024 / 1024).toFixed(1)} MB` : '—'}</span>
            <span>Texture assignments</span><span className="text-right text-foreground">{inspectedModel.libraryReadiness.textureAssignmentCount}</span>
            <span>Dependencies</span><span className="text-right text-foreground">{inspectedModel.libraryReadiness.dependencyStatus === 'available' ? `${inspectedModel.libraryReadiness.supportingFileCount} available` : 'Not yet verified'}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-muted-foreground">Library readiness</span>
            <ModelReadinessBadge model={inspectedModel} />
          </div>
          <label className="block rounded border bg-background/60 p-1.5">
            <span className="mb-1 flex items-center justify-between gap-2 text-muted-foreground">
              <span>Placement scale</span>
              <span>
                Effective: {placementScaleIsValid
                  ? (Number(inspectedModel.scale ?? 1) * numericPlacementScale).toLocaleString(undefined, { maximumFractionDigits: 6 })
                  : '—'}
              </span>
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
              aria-label="Model placement scale multiplier"
            />
            <span className={`mt-1 block text-[9px] ${placementScaleIsValid ? 'text-muted-foreground' : 'text-amber-300'}`}>
              {placementScaleIsValid
                ? `Saved base ${Number(inspectedModel.scale ?? 1)} × placement ${numericPlacementScale}`
                : 'Enter a scale from 0.0001 to 10,000.'}
            </span>
          </label>
          {inspectedModel.libraryReadiness.issues.length > 0 && (
            <p className="pt-1 text-amber-300">
              {inspectedModel.libraryReadiness.issues.includes('missing_primary_file')
                ? 'A usable primary Model file is required.'
                : 'Configure a reusable Texture or Model-owned Texture attachment before placement.'}
            </p>
          )}
          {inspectedModel.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {inspectedModel.categories.map((category) => (
                <span key={category.id} className="rounded bg-muted px-1.5 py-0.5 text-[9px]">{category.name}</span>
              ))}
            </div>
          )}
          {inspectedModel.canManage && inspectedModel.libraryReadiness.status !== 'ready' && (
            <Button asChild type="button" variant="outline" size="sm" className="mt-1 h-6 w-full text-[10px]">
              <a href={`/admin/threed/model-files?modelId=${inspectedModel.id}`} target="_blank" rel="noreferrer">
                Configure Model <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z', 'rotationY'] as const).map(field => (
              <label key={field} className="text-[10px]">
                {field === 'rotationY' ? 'Y rotation (°)' : `Position ${field.toUpperCase()}`}
                <Input type="number" step="any" className="h-7 px-2 text-xs" value={placementDraft[field]} disabled={placing}
                  onChange={event => onPlacementDraftChange(field, event.target.value)} />
              </label>
            ))}
          </div>
          <label className="flex items-center justify-between gap-2 text-xs">
            Environment / base map
            <Switch checked={placementRole === 'environment'} disabled={placing} onCheckedChange={checked => onPlacementRoleChange(checked ? 'environment' : 'object')} />
          </label>
          <Button type="button" size="sm" className="h-7 w-full text-xs"
            disabled={!selectedModuleId || placing || inspectedModel.libraryReadiness.status !== 'ready' || !placementScaleIsValid || !Object.values(placementDraft).every(value => value.trim() && Number.isFinite(Number(value)))}
            onClick={() => onPlaceAtCoordinates(inspectedModel)}>Place at Coordinates</Button>
          <Button type="button" size="sm" className="mt-1 h-6 w-full text-[10px]" disabled={!selectedModuleId || placing || inspectedModel.libraryReadiness.status !== 'ready' || !placementScaleIsValid} onClick={() => onBeginPlacement(inspectedModel)}>
            Place Selected in {placementSurface}
          </Button>
        </div>
      )}

      {placementModel && (
        <div className="mb-2 space-y-2 rounded border border-cyan-500/40 bg-cyan-500/10 p-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 [&>span]:min-w-0 [&>span]:break-words [&>span]:[overflow-wrap:anywhere]">
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading models…
          </div>
        ) : visibleModels.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {allModelCount === 0 ? 'No active public Library models are available.' : 'No Library models match these filters.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {visibleModels.map((model) => {
              const readyToPlace = model.libraryReadiness.status === 'ready';
              return (
              <div
                key={model.id}
                draggable={Boolean(selectedModuleId) && !placing && readyToPlace}
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
                className={`group overflow-hidden rounded border bg-card text-left ${readyToPlace ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${inspectedModelId === model.id ? 'border-cyan-500 ring-1 ring-cyan-500/40' : ''}`}
              >
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/40">
                  {model.thumbnailUrl ? (
                    <img src={model.thumbnailUrl} alt={`${model.modelName} top-view preview`} className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                  ) : (
                    <Box className="h-8 w-8 text-cyan-600/60" />
                  )}
                </div>
                <div className="min-w-0 p-2">
                  <div className="break-words text-xs font-medium [overflow-wrap:anywhere]">{model.modelName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center justify-between gap-1">
                    <div className="text-[10px] uppercase text-muted-foreground">{model.modelType}</div>
                    <ModelReadinessBadge model={model} />
                  </div>
                  <div className="mt-1 flex min-h-4 flex-wrap gap-1" aria-label={`${model.modelName} collections`}>
                    {model.categories.length > 0 ? model.categories.map((category) => (
                      <span key={category.id} className="max-w-full truncate rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                        {category.name}
                      </span>
                    )) : (
                      <span className="text-[9px] text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                  <Button type="button" size="sm" variant={readyToPlace ? 'default' : 'outline'} className="mt-1.5 h-6 w-full text-[10px]" disabled={!selectedModuleId || placing || !readyToPlace} draggable={false} onClick={(event) => { event.stopPropagation(); onBeginPlacement(model); }}>
                    {readyToPlace ? 'Place' : 'Inspect'}
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
