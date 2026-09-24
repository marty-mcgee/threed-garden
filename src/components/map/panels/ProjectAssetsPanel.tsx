'use client';

import { DetailsSectionScope, PersistentDetails } from '@/components/map/details/PersistentDetails';
import { useEffect, useRef } from 'react';
import { Crosshair, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RuntimeMarker } from '@/libraries/types/map';
import type { ThreeDRuntimeMarkerPositionResolver } from '@/components/map/UnifiedMapView';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { useSceneTransform } from '@/components/threed/transform/SceneTransformWorkspace';
import { useSensorGroups } from '@/components/threed/physics/SensorGroupsWorkspace';
import { getThreeDIcon, getThreeDLabel } from '@/libraries/utils/map-helpers';

export function ProjectAssetsPanel({
  selectedProjectId,
  isOpen: isProjectAssetsOpen,
  search: projectAssetSearch,
  setSearch: setProjectAssetSearch,
  typeFilter: projectAssetType,
  setTypeFilter: setProjectAssetType,
  projectRuntimeMarkers,
  projectAssetTypes,
  projectAssetTypeCounts,
  visibleProjectAssets,
  selectedMarker,
  resolveRuntimeMarkerPosition,
  onDismiss,
  onSelectAsset,
  selectedSensorId,
  selectedGroupId,
  onSelectGroup,
  onSelectSensor,
  groundMapSelected = false,
  onOpenGroundMap,
}: {
  groundMapSelected?: boolean;
  onOpenGroundMap?: () => void;
  selectedProjectId: string | null;
  isOpen: boolean;
  search: string;
  setSearch: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  projectRuntimeMarkers: RuntimeMarker[];
  projectAssetTypes: string[];
  projectAssetTypeCounts: ReadonlyMap<string, number>;
  visibleProjectAssets: RuntimeMarker[];
  selectedMarker: RuntimeMarker | null;
  resolveRuntimeMarkerPosition: ThreeDRuntimeMarkerPositionResolver;
  onDismiss: () => void;
  onSelectAsset: (marker: RuntimeMarker) => void;
  selectedSensorId?: string | null;
  selectedGroupId?: string | null;
  onSelectGroup: (id: string) => void;
  onSelectSensor: (marker: RuntimeMarker, sensorId: string) => void;
}) {
  const groups = useSensorGroups();
  const transform = useSceneTransform();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isVisible = Boolean(selectedProjectId) && isProjectAssetsOpen;

  useEffect(() => {
    if (projectAssetType !== 'all') setProjectAssetType('all');
  }, [projectAssetType, setProjectAssetType]);

  useEffect(() => {
    if (!isVisible) return;
    const focusFrame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    const dismissWithEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onDismiss();
    };

    document.addEventListener('keydown', dismissWithEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', dismissWithEscape);
    };
  }, [isVisible, onDismiss]);

  return (
    <DetailsSectionScope.Provider value={`assets:${selectedProjectId}`} >
      {isVisible && (
        <div
          id="project-assets-panel"
          role="region"
          aria-label="Project Assets"
          className="threed-workspace-panel threed-scene-panel-surface absolute bottom-0 left-0 top-9 z-40 flex w-72 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-md border p-3 shadow-xl backdrop-blur-md"
        >
          <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Project Assets</h2>

            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label="Close Project Assets"
              title="Close Project Assets"
              onClick={onDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="relative mb-2 shrink-0">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
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

          {onOpenGroundMap && <Button type="button" variant="outline" className="mb-2 h-8 shrink-0 justify-start text-xs" aria-pressed={groundMapSelected} onClick={onOpenGroundMap}>Ground Map · Settings</Button>}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
            {visibleProjectAssets.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {projectRuntimeMarkers.length === 0
                  ? 'This Project has no ThreeD assets.'
                  : 'No Project assets match this search.'}
              </p>
            ) : [...new Set(visibleProjectAssets.map(marker => marker.type))].map(type => (
              <PersistentDetails storageId={`type:${type}`} key={`${selectedProjectId}:${type}`} className="rounded-md border border-white/10 p-1">
                <summary className="cursor-pointer px-1 py-2 text-xs font-semibold">
                  {getThreeDIcon(type)} {getThreeDLabel(type)} · {visibleProjectAssets.filter(marker => marker.type === type).length}
                </summary>
                <div className="space-y-1">
                {visibleProjectAssets.filter(marker => marker.type === type).map(marker => {
              const isSelected = selectedMarker?.id === marker.id && !selectedSensorId && selectedGroupId == null && !groundMapSelected;
              const sourceAssetId = Number(marker.data?.id);
              const currentPosition = Number.isSafeInteger(sourceAssetId) && sourceAssetId > 0
                ? resolveRuntimeMarkerPosition(marker.type, sourceAssetId) ?? marker.position
                : marker.position;
              const physicsSensors = readPhysicsSensorCuboids(marker.metadata);
              return (
                <div key={marker.id}>
                  <button
                    type="button"
                    className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/5 ${
                      isSelected ? 'border-cyan-500 bg-cyan-500/15 ring-1 ring-cyan-500/40' : 'bg-card'
                    }`}
                    aria-pressed={isSelected}
                    onClick={() => onSelectAsset(marker)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs">
                        {getThreeDIcon(marker.type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium">
                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{marker.name}</span>
                          {isSelected && <span className="shrink-0 text-[9px] font-semibold uppercase text-cyan-500">Selected</span>}
                        </span>
                        <span className="block break-words text-[10px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                          X{currentPosition.x.toFixed(1)} Y{currentPosition.y.toFixed(1)} Z{currentPosition.z.toFixed(1)} · {Math.hypot(currentPosition.x, currentPosition.z).toFixed(1)} ft from origin
                        </span>
                      </span>
                      <Crosshair className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-cyan-500' : 'text-muted-foreground'}`} />
                    </div>
                  </button>
                  {physicsSensors.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-2" aria-label={`${marker.name} Physics Sensors`}>
                      <div className="px-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Physics Sensors {physicsSensors.length}
                      </div>
                      {physicsSensors.map((sensor) => (
                        (() => {
                          const isSelectedSensor = selectedMarker?.id === marker.id && selectedSensorId === sensor.id && !groundMapSelected;
                          return <button
                            key={sensor.id}
                            type="button"
                            aria-pressed={isSelectedSensor}
                            className={`w-full rounded border px-2 py-1 text-left transition-colors hover:border-cyan-500/50 ${isSelectedSensor ? 'border-cyan-300 bg-cyan-500/20 ring-1 ring-cyan-400/40' : 'border-white/10 bg-black/10'}`}
                            disabled={Boolean(transform.session)}
                            title={`Edit ${sensor.name}`}
                            onClick={() => onSelectSensor(marker, sensor.id)}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 shrink-0 rounded-sm ${sensor.behavior === 'counter' ? 'bg-cyan-400' : 'bg-amber-400'}`} aria-hidden="true" />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1">
                                  <span className="block truncate text-[10px] font-medium">{sensor.name}</span>
                                  {isSelectedSensor && <span className="shrink-0 text-[8px] font-semibold uppercase tracking-wide text-cyan-200">Editing</span>}
                                </span>
                                <span className="block text-[9px] capitalize text-muted-foreground">
                                  {sensor.behavior === 'counter' ? 'Entry counter' : 'Trigger'} · {sensor.width.toFixed(2)} × {sensor.height.toFixed(2)} × {sensor.depth.toFixed(2)}
                                </span>
                              </span>
                              <Crosshair className={`h-3 w-3 shrink-0 ${isSelectedSensor ? 'text-cyan-200' : 'text-muted-foreground'}`} />
                            </span>
                          </button>;
                        })()
                      ))}
                    </div>
                  )}
                </div>
              );
                })}
                </div>
              </PersistentDetails>
            ))}
          </div>
          <div className="shrink-0 space-y-2 border-t border-white/15 pt-2 mt-2 mb-14 max-h-[30%] overflow-y-auto" aria-label="Sensor Tools">
            <h3 className="text-xs font-semibold">Sensor Tools</h3>
            {!groundMapSelected && selectedMarker && ['project-marker', 'project-snapshot'].includes(String(selectedMarker.metadata?.source)) && ['model', 'models', 'bed', 'beds', 'planting', 'plantings', 'farmbot', 'farmbots'].includes(selectedMarker.type.toLowerCase()) && (
              <Button disabled={Boolean(transform.session) || readPhysicsSensorCuboids(selectedMarker.metadata).length >= 8} variant="outline" size="sm" className="w-full text-xs truncate" onClick={() => onSelectSensor(selectedMarker, '__new__')}>
                + Add Sensor to {selectedMarker.name}
              </Button>
            )}
            <PersistentDetails storageId="sensor-groups">
              <summary className="cursor-pointer text-xs">Sensor Groups · {groups?.groups.length ?? 0}</summary>
              <div className="mt-2 space-y-1">
                {groups?.groups.map(group => <button key={group.id} type="button" disabled={Boolean(transform.session)} aria-pressed={selectedGroupId === group.id} onClick={() => onSelectGroup(group.id)} className="block w-full rounded border border-white/15 p-2 text-left text-xs hover:bg-white/10 aria-pressed:border-cyan-400">{group.name}</button>)}
              </div>
            </PersistentDetails>
            <Button variant="outline" size="sm" className="w-full text-xs" disabled={Boolean(transform.session)} onClick={() => onSelectGroup('')}>+ New Sensor Group</Button>
          </div>
        </div>
      )}

    </DetailsSectionScope.Provider>
  );
}
