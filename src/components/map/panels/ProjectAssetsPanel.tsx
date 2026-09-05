'use client';

import type { RefObject } from 'react';
import { Crosshair, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RuntimeMarker } from '@/lib/types/map';
import type { ThreeDRuntimeMarkerPositionResolver } from '@/components/map/UnifiedMapView';
import { getThreeDIcon, getThreeDLabel } from '@/lib/utils/map-helpers';

export function ProjectAssetsPanel({
  selectedProjectId,
  isOpen: isProjectAssetsOpen,
  isFullscreen,
  search: projectAssetSearch,
  setSearch: setProjectAssetSearch,
  typeFilter: projectAssetType,
  setTypeFilter: setProjectAssetType,
  searchInputRef: projectAssetSearchRef,
  projectRuntimeMarkers,
  projectAssetTypes,
  projectAssetTypeCounts,
  visibleProjectAssets,
  selectedMarker,
  resolveRuntimeMarkerPosition,
  closeProjectAssets,
  focusProjectAsset,
}: {
  selectedProjectId: string | null;
  isOpen: boolean;
  isFullscreen: boolean;
  search: string;
  setSearch: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  projectRuntimeMarkers: RuntimeMarker[];
  projectAssetTypes: string[];
  projectAssetTypeCounts: ReadonlyMap<string, number>;
  visibleProjectAssets: RuntimeMarker[];
  selectedMarker: RuntimeMarker | null;
  resolveRuntimeMarkerPosition: ThreeDRuntimeMarkerPositionResolver;
  closeProjectAssets: (restoreTriggerFocus?: boolean) => void;
  focusProjectAsset: (marker: RuntimeMarker) => void;
}) {
  return (
    <>
      {selectedProjectId && isProjectAssetsOpen && !isFullscreen && (
        <div
          id="project-assets-panel"
          role="region"
          aria-label="Project Assets"
          className="absolute bottom-0 left-0 top-10 z-40 flex w-72 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-md border bg-background/90 p-3 shadow-xl backdrop-blur-md"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Project Assets</h2>
              <p className="text-[11px] text-muted-foreground">
                Select an item to activate and focus its ThreeD Marker.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label="Close Project Assets"
              title="Close Project Assets"
              onClick={() => closeProjectAssets(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={projectAssetSearchRef}
              autoFocus
              value={projectAssetSearch}
              onChange={(event) => setProjectAssetSearch(event.target.value)}
              placeholder="Search name or type"
              className="h-8 pl-7 pr-8 text-xs"
              aria-label="Search Project Assets"
            />
            {projectAssetSearch && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                aria-label="Clear Project Asset search"
                title="Clear search"
                onClick={() => setProjectAssetSearch('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div
            className="mb-2 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]"
            role="group"
            aria-label="Filter Project Assets by type"
          >
            <Button
              type="button"
              size="sm"
              variant={projectAssetType === 'all' ? 'secondary' : 'outline'}
              className="h-7 shrink-0 px-2 text-[10px]"
              aria-pressed={projectAssetType === 'all'}
              onClick={() => setProjectAssetType('all')}
            >
              All {projectRuntimeMarkers.length}
            </Button>
            {projectAssetTypes.map((type) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={projectAssetType === type ? 'secondary' : 'outline'}
                className="h-7 shrink-0 gap-1 px-2 text-[10px]"
                aria-pressed={projectAssetType === type}
                onClick={() => setProjectAssetType(type)}
              >
                <span aria-hidden="true">{getThreeDIcon(type)}</span>
                {getThreeDLabel(type)} {projectAssetTypeCounts.get(type) ?? 0}
              </Button>
            ))}
          </div>

          <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{visibleProjectAssets.length} shown</span>
            <span>{projectRuntimeMarkers.length} items · Esc closes</span>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {visibleProjectAssets.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {projectRuntimeMarkers.length === 0
                  ? 'This Project has no ThreeD assets.'
                  : 'No Project assets match this search.'}
              </p>
            ) : visibleProjectAssets.map((marker, index) => {
              const isSelected = selectedMarker?.id === marker.id;
              const beginsTypeGroup = index === 0
                || visibleProjectAssets[index - 1]?.type !== marker.type;
              const sourceAssetId = Number(marker.data?.id);
              const currentPosition = Number.isSafeInteger(sourceAssetId) && sourceAssetId > 0
                ? resolveRuntimeMarkerPosition(marker.type, sourceAssetId) ?? marker.position
                : marker.position;
              return (
                <div key={marker.id}>
                  {beginsTypeGroup && (
                    <div className="mb-1 mt-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
                      <span aria-hidden="true">{getThreeDIcon(marker.type)}</span>
                      <span>{getThreeDLabel(marker.type)}</span>
                      <span className="ml-auto font-normal normal-case">
                        {projectAssetTypeCounts.get(marker.type) ?? 0}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/5 ${
                      isSelected ? 'border-cyan-500 bg-cyan-500/15 ring-1 ring-cyan-500/40' : 'bg-card'
                    }`}
                    aria-pressed={isSelected}
                    onClick={() => focusProjectAsset(marker)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs">
                        {getThreeDIcon(marker.type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 truncate text-xs font-medium">
                          <span className="truncate">{marker.name}</span>
                          {isSelected && <span className="shrink-0 text-[9px] font-semibold uppercase text-cyan-500">Selected</span>}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          X{currentPosition.x.toFixed(1)} Y{currentPosition.y.toFixed(1)} Z{currentPosition.z.toFixed(1)} · {Math.hypot(currentPosition.x, currentPosition.z).toFixed(1)} ft from origin
                        </span>
                      </span>
                      <Crosshair className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-cyan-500' : 'text-muted-foreground'}`} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </>
  );
}
