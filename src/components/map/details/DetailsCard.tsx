'use client';

import { useEffect, useState } from 'react';
import { Crosshair, ExternalLink, Gamepad2, Loader2, Pause, ScanSearch, X } from 'lucide-react';
import type { ThreeDActionTarget } from '@/lib/types/map';
import type { ThreeDRuntimeMarkerPositionResolver } from '@/components/map/UnifiedMapView';
import {
  createThreeDCharacterOrchestrationRequest,
  createThreeDOrchestrationLifecycleState,
  planThreeDInteractionApproach,
  THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
  transitionThreeDOrchestrationLifecycleState,
  type ThreeDOrchestrationLifecycleState,
} from '@/lib/services/threed/orchestration/interaction-core';
import {
  createThreeDActionTarget,
  getThreeDActionTargetCapabilities,
  isMatchingThreeDActionTarget,
  THREED_GENERIC_TARGET_ACTIONS,
} from '@/lib/services/threed/orchestration/action-target-core';
import { BedInstanceEditor } from './BedInstanceEditor';
import { CharacterInstancePositionEditor } from './CharacterInstancePositionEditor';
import { ModelInstancePlacementEditor } from './ModelInstancePlacementEditor';
import { PlantingInstanceEditor } from './PlantingInstanceEditor';

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[10px] text-white/40 shrink-0 w-[52px] text-right">{label}</span>
      <span className="text-[11px] text-white/80">{value}</span>
    </div>
  );
}

interface FarmBotProjectMqttRuntime {
  connectionState: string;
  stateChangedAt: string;
  lastMessageAt: string | null;
  lastStatusAt: string | null;
  positionX: string | null;
  positionY: string | null;
  positionZ: string | null;
  tokenExpiresAt: string;
  isStale: boolean;
}

function formatMqttDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Never';
}


function FarmBotMqttStatusSummary({
  farmbotId,
  projectId,
}: {
  farmbotId: number;
  projectId: string | null;
}) {
  const [runtime, setRuntime] = useState<FarmBotProjectMqttRuntime | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !Number.isSafeInteger(farmbotId) || farmbotId < 1) {
      setRuntime(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    void fetch(
      `/api/threed/farmbots/${farmbotId}/mqtt-runtime?projectId=${encodeURIComponent(projectId)}`,
      { cache: 'no-store', signal: controller.signal }
    )
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error);
        setRuntime(result.data as FarmBotProjectMqttRuntime | null);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setRuntime(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [farmbotId, projectId]);

  const hasPosition = runtime
    && runtime.positionX !== null
    && runtime.positionY !== null
    && runtime.positionZ !== null;

  return (
    <div className="mt-2 rounded bg-white/[0.035] p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-white/60">MQTT Status</span>
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-white/40" />
        ) : runtime ? (
          <div className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${runtime.connectionState === 'connected' && !runtime.isStale ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[10px] capitalize text-white/70">{runtime.connectionState}</span>
            {runtime.isStale && <span className="text-[10px] text-amber-300">· Stale</span>}
          </div>
        ) : (
          <span className="text-[10px] text-white/35">No recorded status</span>
        )}
      </div>
      {runtime && (
        <div className="space-y-0.5">
          <KvRow label="Changed" value={formatMqttDate(runtime.stateChangedAt)} />
          <KvRow label="Message" value={formatMqttDate(runtime.lastMessageAt)} />
          <KvRow label="Status" value={formatMqttDate(runtime.lastStatusAt)} />
          <KvRow
            label="Device"
            value={hasPosition
              ? `X:${Number(runtime.positionX).toFixed(1)} Y:${Number(runtime.positionY).toFixed(1)} Z:${Number(runtime.positionZ).toFixed(1)}`
              : 'Position not recorded'}
          />
          <KvRow label="Token" value={`Expires ${formatMqttDate(runtime.tokenExpiresAt)}`} />
        </div>
      )}
    </div>
  );
}


export function DetailsCard({ selected, projectId, leftOffsetRem = 0.75, onClose, controlledCharacterId, liveControlledCharacterPosition, onTakeControl, onReleaseControl, cameraMode, onCameraModeChange, onZoomCenter, actionTarget, orchestrationStatus, onSetActionTarget, onClearActionTarget, onFocusActionTarget, resolveRuntimeMarkerPosition, onUpdateModelInstance, updatingModelInstanceId, onDeleteModelInstance, deletingModelInstanceId, movingModelInstanceId, onMoveModelToggle, onUpdateBedInstance, updatingBedMarkerId, onDeleteBedInstance, deletingBedMarkerId, onUpdateFarmBotInstance, updatingFarmBotMarkerId, onDeleteFarmBotInstance, deletingFarmBotMarkerId, onUpdatePlantingInstance, updatingPlantingMarkerId, onDeletePlantingInstance, deletingPlantingMarkerId, onUpdateCharacterPosition, updatingCharacterMarkerId, onDeleteCharacterInstance, deletingCharacterMarkerId }: {
  selected: any;
  projectId: string | null;
  leftOffsetRem?: number;
  onClose: () => void;
  controlledCharacterId: number | null;
  liveControlledCharacterPosition: {
    characterId: number;
    position: { x: number; y: number; z: number };
  } | null;
  onTakeControl: (id: number) => void;
  onReleaseControl: () => void;
  cameraMode?: string;
  onCameraModeChange?: (mode: string) => void;
  onZoomCenter?: () => void;
  actionTarget?: ThreeDActionTarget | null;
  orchestrationStatus?: ThreeDOrchestrationLifecycleState | null;
  onSetActionTarget?: (target: ThreeDActionTarget) => void;
  onClearActionTarget?: () => void;
  onFocusActionTarget?: () => void;
  resolveRuntimeMarkerPosition?: ThreeDRuntimeMarkerPositionResolver;
  onUpdateModelInstance?: (instanceId: number, input: {
    instanceName: string;
    scaleMultiplier: number;
    rotationY: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    placementRole: 'object' | 'environment';
  }) => void;
  updatingModelInstanceId?: number | null;
  onDeleteModelInstance?: (instanceId: number, name: string) => void;
  deletingModelInstanceId?: number | null;
  movingModelInstanceId?: number | null;
  onMoveModelToggle?: (instanceId: number, name: string) => void;
  onUpdateBedInstance?: (markerId: number, input: {
    widthFeet: number;
    lengthFeet: number;
    heightFeet: number;
    scale: number;
    color: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotation: number;
  }) => void;
  updatingBedMarkerId?: number | null;
  onDeleteBedInstance?: (markerId: number, name: string) => void;
  deletingBedMarkerId?: number | null;
  onUpdateFarmBotInstance?: (markerId: number, input: {
    widthFeet: number;
    lengthFeet: number;
    heightFeet: number;
    scale: number;
    color: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotation: number;
  }) => void;
  updatingFarmBotMarkerId?: number | null;
  onDeleteFarmBotInstance?: (markerId: number, name: string) => void;
  deletingFarmBotMarkerId?: number | null;
  onUpdatePlantingInstance?: (markerId: number, input: {
    modelScale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  updatingPlantingMarkerId?: number | null;
  onDeletePlantingInstance?: (markerId: number, name: string) => void;
  deletingPlantingMarkerId?: number | null;
  onUpdateCharacterPosition?: (markerId: number, position: {
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  updatingCharacterMarkerId?: number | null;
  onDeleteCharacterInstance?: (markerId: number, name: string) => void;
  deletingCharacterMarkerId?: number | null;
}) {
  if (!selected) return null;
  const d = selected.data || selected.metadata?.data || selected.metadata || {};
  const isIncident = selected.latitude != null || selected.severity || (selected.title && selected.location);
  const typeLabel = selected.type || (isIncident ? 'Traffic Incident' : 'Marker');
  // Build key-value metadata rows from the data record
  const metaRows: { label: string; value: string }[] = [];

  // 3D position — prefer live RuntimeMarker position (updated by ecctrl), fallback to DB columns
  if (!isIncident) {
    const live = selected.position; // RuntimeMarker live position
    const dbX = d.positionX ?? d.position?.x;
    const dbY = d.positionY ?? d.position?.y;
    const dbZ = d.positionZ ?? d.position?.z;
    const px = live?.x != null ? live.x : dbX;
    const py = live?.y != null ? live.y : (dbY ?? 0);
    const pz = live?.z != null ? live.z : dbZ;
    if (px != null && pz != null) {
      metaRows.push({ label: 'Position', value: `X:${Number(px).toFixed(1)} Y:${Number(py).toFixed(1)} Z:${Number(pz).toFixed(1)}` });
    }
    const geographic = selected.metadata?.geographicPosition;
    const latitude = geographic?.latitude ?? d.latitude;
    const longitude = geographic?.longitude ?? d.longitude;
    const altitude = geographic?.altitude ?? d.altitude;
    if (
      latitude !== null
      && latitude !== undefined
      && longitude !== null
      && longitude !== undefined
      && Number.isFinite(Number(latitude))
      && Number.isFinite(Number(longitude))
    ) {
      const altitudeLabel = altitude !== null
        && altitude !== undefined
        && Number.isFinite(Number(altitude))
        ? ` Alt:${Number(altitude).toFixed(2)}m`
        : '';
      metaRows.push({
        label: 'GPS',
        value: `Lat:${Number(latitude).toFixed(7)} Lng:${Number(longitude).toFixed(7)}${altitudeLabel}`,
      });
    }
  }

  // Incident fields
  if (isIncident) {
    if (selected.location) metaRows.push({ label: 'Location', value: selected.location });
    if (selected.status) metaRows.push({ label: 'Status', value: selected.status });
  }

  // Marker type-specific
  const type = selected.type || '';
  const normalizedType = String(type).trim().toLowerCase();
  metaRows.unshift({ label: 'Module', value: typeLabel });
  if (selected.severity) {
    metaRows.push({ label: 'Severity', value: String(selected.severity) });
  }
  const isPlantingMarker = normalizedType === 'planting'
    || normalizedType === 'plantings'
    || normalizedType === 'threed_plantings';
  const isFarmBotMarker = normalizedType === 'farmbot'
    || normalizedType === 'farmbots'
    || normalizedType === 'threed_farmbots';
  const isCharacterMarker = type === 'characters' || type === 'character';
  const characterMarkerId = Number(d.projectMarkerId);
  const isProjectCharacterInstance = isCharacterMarker
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(characterMarkerId)
    && characterMarkerId > 0;
  const modelInstanceId = Number(d.instanceId);
  const isProjectModelInstance = (
    normalizedType === 'model' || normalizedType === 'models'
  ) && selected.metadata?.source === 'project-marker'
    && Number.isSafeInteger(modelInstanceId)
    && modelInstanceId > 0;
  const bedMarkerId = Number(d.projectMarkerId);
  const isProjectBedInstance = (normalizedType === 'bed' || normalizedType === 'beds')
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(bedMarkerId)
    && bedMarkerId > 0;
  const plantingMarkerId = Number(d.projectMarkerId);
  const isProjectPlantingInstance = isPlantingMarker
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(plantingMarkerId)
    && plantingMarkerId > 0;
  const farmBotMarkerId = Number(d.projectMarkerId);
  const isProjectFarmBotInstance = isFarmBotMarker
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(farmBotMarkerId)
    && farmBotMarkerId > 0;
  const selectedTargetCapabilities = getThreeDActionTargetCapabilities(normalizedType);
  const actionTargetCapabilities = actionTarget
    ? getThreeDActionTargetCapabilities(actionTarget.type)
    : null;
  const currentActionTargetPosition = actionTarget
    ? resolveRuntimeMarkerPosition?.(actionTarget.type, actionTarget.id)
      ?? actionTarget.position
    : null;
  const isEcctrlCharacter = isCharacterMarker && d.isMovable === true;
  const characterId = Number(d.id);
  const isSelectedCharacterControlled = isEcctrlCharacter
    && controlledCharacterId === characterId;
  const hasLiveControlledPosition = isSelectedCharacterControlled
    && liveControlledCharacterPosition?.characterId === characterId;
  let targetApproachPlan: ReturnType<typeof planThreeDInteractionApproach> | null = null;
  if (
    isEcctrlCharacter
    && hasLiveControlledPosition
    && actionTarget != null
    && liveControlledCharacterPosition
  ) {
    try {
      targetApproachPlan = planThreeDInteractionApproach({
        characterPosition: liveControlledCharacterPosition.position,
        targetPosition: currentActionTargetPosition ?? actionTarget.position,
      });
    } catch {
      targetApproachPlan = null;
    }
  }
  const targetInteractionReady = !isEcctrlCharacter
    || actionTarget == null
    || (
      hasLiveControlledPosition
      && targetApproachPlan?.arrived === true
    );
  const isCurrentOrchestration = orchestrationStatus
    && orchestrationStatus.characterId === characterId
    && orchestrationStatus.targetId === actionTarget?.id;
  const isOrchestrationRunning = isCurrentOrchestration
    && orchestrationStatus.phase === 'interacting';
  if (isPlantingMarker) {
    if (d.plantName || d.commonName) metaRows.push({ label: 'Plant', value: d.plantName || d.commonName });
    if (d.growthStage) metaRows.push({ label: 'Stage', value: d.growthStage });
    if (d.health != null) metaRows.push({ label: 'Health', value: `${d.health}` });
    if (d.plantedDate) metaRows.push({ label: 'Planted', value: new Date(d.plantedDate).toLocaleDateString() });
  }
  if (type === 'beds' || type === 'bed') {
    const w = d.widthFeet || d.width, l = d.lengthFeet || d.length || d.depth;
    if (w && l) metaRows.push({ label: 'Size', value: `${w}ft × ${l}ft` });
    if (d.soilType) metaRows.push({ label: 'Soil', value: d.soilType });
    if (d.sunExposure) metaRows.push({ label: 'Sun', value: d.sunExposure });
  }
  if (isFarmBotMarker) {
    if (d.status) metaRows.push({ label: 'Status', value: d.status });
    if (d.batteryLevel != null) metaRows.push({ label: 'Battery', value: `${d.batteryLevel}%` });
    if (d.assetCode) metaRows.push({ label: 'Asset code', value: d.assetCode });
    if (d.farmbotDeviceId) {
      metaRows.push({ label: 'FarmBot device', value: String(d.farmbotDeviceId) });
    }
    if (d.brokerDeviceId) metaRows.push({ label: 'Broker identity', value: d.brokerDeviceId });
    if (d.lastSeen) metaRows.push({ label: 'Last Seen', value: new Date(d.lastSeen).toLocaleString() });
  }
  if (type === 'characters' || type === 'character') {
    if (d.type || d.characterType) metaRows.push({ label: 'Type', value: d.type || d.characterType });
    if (d.movementType) metaRows.push({ label: 'Movement', value: d.movementType });
    if (d.movementSpeed != null) metaRows.push({ label: 'Speed', value: `${d.movementSpeed}` });
    if (d.defaultEmote && d.defaultEmote !== 'none') metaRows.push({ label: 'Emote', value: d.defaultEmote });
  }
  if (d.notes || d.description) metaRows.push({ label: 'Notes', value: (d.notes || d.description).slice(0, 80) });

  const selectedMarkerId = String(selected.id || '');
  const selectedMarkerIdSuffix = selectedMarkerId.match(/(\d+)$/)?.[1];
  const quickTargetId = Number(d.id ?? selectedMarkerIdSuffix);
  const quickTargetType = selectedTargetCapabilities?.markerType;
  const quickTargetName = selected.name || selected.label || d.plantName || d.commonName
    || (quickTargetType ? `${quickTargetType.replace(/s$/, '')} #${quickTargetId}` : 'Marker');
  const isQuickActionTarget = actionTarget != null
    && quickTargetType != null
    && isMatchingThreeDActionTarget(actionTarget, {
      markerType: quickTargetType,
      assetId: quickTargetId,
    });
  const adminType = selected.type || (isIncident ? (selected._collection || 'chpCad') : 'plantings');
  const adminId = isProjectModelInstance ? d.modelId : selected.metadata?.data?.id || selected.id;
  const adminRouteMap: Record<string, string> = {
    plantings: '/admin/threed/plantings', planting: '/admin/threed/plantings',
    beds: '/admin/threed/beds', bed: '/admin/threed/beds',
    characters: '/admin/threed/characters', character: '/admin/threed/characters',
    farmbots: '/admin/threed/farmbots', farmbot: '/admin/threed/farmbots',
    models: '/admin/threed/models', model: '/admin/threed/models',
    chpCad: '/admin/traffic/chp-cad', chpCadIncidents: '/admin/traffic/chp-cad',
    chpCases: '/admin/traffic/chp-cases', chpCenters: '/admin/traffic/chp-centers',
    caltransLaneClosures: '/admin/traffic/caltrans', caltransClosures: '/admin/traffic/caltrans',
    caltransCctv: '/admin/traffic/caltrans-cctv', caltransDistricts: '/admin/traffic/caltrans-districts',
    bayArea511: '/admin/traffic/bay-area-511', bayArea511Events: '/admin/traffic/bay-area-511',
    calfireIncidents: '/admin/traffic/calfire', calfire: '/admin/traffic/calfire',
  };
  const adminRoute = adminRouteMap[adminType] || (isIncident ? '/admin/traffic' : '/admin/threed/plantings');

  return (
    <div
      className="fixed top-12 z-[1000] max-h-[calc(100vh-4rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border border-white/15 p-2 text-white shadow-xl pointer-events-auto [scrollbar-width:thin] transition-[left]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        left: `${leftOffsetRem}rem`,
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 -mx-2 -mt-2 flex items-start justify-between gap-2 rounded-t-lg px-2 pb-2 pt-0.5"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      >
        <div className="min-w-0 pb-1 pt-0.5">
          <div className="truncate text-sm font-semibold text-white">
            {selected.name || selected.title || selected.label || 'Unknown'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close marker details"
          title="Close marker details"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-1">
        {!isIncident && selectedTargetCapabilities && onSetActionTarget && (
          <button
            type="button"
            aria-label={isQuickActionTarget ? 'Clear Action Target' : 'Use as Action Target'}
            title={isQuickActionTarget ? 'Clear Action Target' : 'Use as Action Target'}
            aria-pressed={isQuickActionTarget}
            onClick={(event) => {
              event.stopPropagation();
              if (isQuickActionTarget && onClearActionTarget) {
                onClearActionTarget();
                return;
              }
              if (!quickTargetType || !Number.isFinite(quickTargetId)) return;
              const targetPosition = resolveRuntimeMarkerPosition?.(quickTargetType, quickTargetId)
                ?? (selected.position ? {
                  x: Number(selected.position.x),
                  y: Number(selected.position.y),
                  z: Number(selected.position.z),
                } : null);
              if (!targetPosition || !Object.values(targetPosition).every(Number.isFinite)) return;
              onSetActionTarget(createThreeDActionTarget({
                markerId: selectedMarkerId || `${quickTargetType}-${quickTargetId}`,
                markerType: quickTargetType,
                assetId: quickTargetId,
                name: String(quickTargetName),
                position: targetPosition,
              }));
            }}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isQuickActionTarget
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
        )}
        {!isIncident && onZoomCenter && (
          <button
            type="button"
            aria-label="Zoom and center marker"
            title="Zoom + Center"
            onClick={(event) => { event.stopPropagation(); onZoomCenter(); }}
            className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ScanSearch className="h-3.5 w-3.5" />
          </button>
        )}
        <a
          href={`${adminRoute}?id=${adminId}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Edit marker in Admin"
          title="Edit in Admin"
          className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-white/60 no-underline transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* GPS coordinates (incidents) */}
      {selected.lat != null && selected.lng != null && (
        <div className="text-[10px] text-white/40 mt-1.5 font-mono">
          📍 {Number(selected.lat).toFixed(4)}, {Number(selected.lng).toFixed(4)}
        </div>
      )}

      {/* Metadata grid */}
      {metaRows.length > 0 && (
        <div className="mt-2 space-y-0.5 rounded bg-white/[0.035] p-2">
          {metaRows.map((r, i) => <KvRow key={i} label={r.label} value={r.value} />)}
        </div>
      )}

      {isFarmBotMarker && (
        <FarmBotMqttStatusSummary
          farmbotId={Number(d.id)}
          projectId={projectId}
        />
      )}

      {/* Description (incidents) — only if no metaRows covered it */}
      {isIncident && selected.description && !metaRows.length && (
        <div className="mt-2 text-[11px] text-white/50">
          {selected.description.slice(0, 100)}{selected.description.length > 100 ? '...' : ''}
        </div>
      )}

      {/* Character Controls — ecctrl runtime take-over (movable characters only) */}
      {!isIncident && (type === 'characters' || type === 'character') && (() => {
        if (d.isMovable !== true) return null;
        const charId = d.id;
        const isControlling = controlledCharacterId === charId;
        return (
          <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
            {isControlling ? (
              <>
                {/* <div className="text-[10px] text-blue-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                  <span>WASD / Space / Shift active</span>
                </div> */}
                <button
                  onClick={(e) => { e.stopPropagation(); onReleaseControl(); }}
                  className="block w-full text-center text-[11px] font-medium bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-2 rounded transition-colors"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Pause className="h-3.5 w-3.5" />
                    Release Control
                  </span>
                </button>
                {onCameraModeChange && (
                  <div className="space-y-1">
                    {/* <div className="text-[10px] text-white/50">Camera:</div> */}
                    <select
                      value={cameraMode || 'stationary'}
                      onChange={(e) => { e.stopPropagation(); onCameraModeChange(e.target.value); }}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/80 focus:outline-none focus:border-white/30 appearance-none"
                    >
                      <option value="follow" className="bg-gray-800 text-white">🎥 Follow</option>
                      <option value="topdown" className="bg-gray-800 text-white">🔽 Top-Down</option>
                      <option value="firstperson" className="bg-gray-800 text-white">👁️ First-Person</option>
                      <option value="orbit" className="bg-gray-800 text-white">🛰️ Orbit</option>
                      <option value="stationary" className="bg-gray-800 text-white">📷 Stationary</option>
                    </select>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onTakeControl(charId); }}
                className="block w-full text-center text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-2 rounded transition-colors"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Take Control
                </span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Character Actions — shared semantic animation controls */}
      {!isIncident && (type === 'characters' || type === 'character') && (
        <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-1.5">
          {/* <div className="text-[10px] font-medium text-white/60">Character Actions</div> */}

          <div className="rounded bg-white/5 px-2 py-1.5 text-[10px] text-white/55">
            {actionTarget ? (
              <>
                <div>🎯 Target: <span className="text-emerald-300">{actionTarget.name}</span> <span className="text-white/30">({actionTarget.type} #{actionTarget.id})</span></div>
                {actionTarget.type === 'farmbots' && (
                  <div className="mt-1 text-amber-200/70">
                    FarmBot interactions are animation-only. Physical commands remain disabled.
                  </div>
                )}
                {isEcctrlCharacter && (
                  <div className={`mt-1 ${targetInteractionReady ? 'text-emerald-300/80' : 'text-amber-200/80'}`}>
                    {!isSelectedCharacterControlled
                      ? 'Take Control to calculate interaction range'
                      : !hasLiveControlledPosition
                        ? 'Waiting for live character position'
                        : targetApproachPlan
                      ? targetInteractionReady
                        ? `In interaction range (${targetApproachPlan.distanceToTarget.toFixed(1)} units)`
                        : `Move closer with WASD (${targetApproachPlan.distanceToTarget.toFixed(1)} units away)`
                      : 'Unable to calculate interaction range'}
                  </div>
                )}
                {isCurrentOrchestration && (
                  <div className={`mt-1 ${
                    orchestrationStatus.phase === 'completed'
                      ? 'text-emerald-300/80'
                      : orchestrationStatus.phase === 'cancelled'
                        ? 'text-amber-200/80'
                        : 'text-sky-200/80'
                  }`}>
                    Simulation: {orchestrationStatus.phase}
                  </div>
                )}
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {onFocusActionTarget && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onFocusActionTarget(); }}
                      className="rounded bg-emerald-600/25 px-2 py-1 text-emerald-100 transition-colors hover:bg-emerald-600/45 hover:text-white"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <ScanSearch className="h-3.5 w-3.5" />
                        Focus Target
                      </span>
                    </button>
                  )}
                  {onClearActionTarget && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClearActionTarget(); }}
                      className="rounded bg-white/5 px-2 py-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white/80"
                    >
                      Clear Target
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>🎯 Target: <span className="text-white/35">None — actions remain animation-only</span></>
            )}
          </div>

          {(actionTarget && actionTarget.type !== 'plantings' ? [
            {
              title: 'Interaction',
              actions: [
                { action: 'point', label: '👉 Point' },
                { action: 'pointGesture', label: '🫵 Point Gesture' },
                { action: 'talk', label: '💬 Talk' },
              ],
            },
          ] : [
            {
              title: 'Planting',
              actions: [
                { action: 'watering', label: '💧 Water' },
                { action: 'digAndPlantSeeds', label: '🪏 Dig + Seeds' },
                { action: 'plantAPlant', label: '🌱 Plant' },
                { action: 'plantTree', label: '🌳 Plant Tree' },
              ],
            },
            {
              title: 'Harvesting',
              actions: [
                { action: 'pullPlant', label: '🌿 Pull Plant' },
                { action: 'pullPlant2', label: '🌿 Pull Plant 2' },
                { action: 'pickFruit', label: '🍎 Pick Fruit' },
                { action: 'pickFruit2', label: '🍐 Pick Fruit 2' },
                { action: 'pickFruit3', label: '🍊 Pick Fruit 3' },
              ],
            },
            {
              title: 'Animal Care',
              actions: [
                { action: 'cowMilking', label: '🥛 Milk Cow' },
              ],
            },
            {
              title: 'Interaction',
              actions: [
                { action: 'point', label: '👉 Point' },
                { action: 'pointGesture', label: '🫵 Point Gesture' },
                { action: 'talk', label: '💬 Talk' },
              ],
            },
          ])
            .map((group) => ({
              ...group,
              actions: actionTargetCapabilities
                ? group.actions.filter(({ action }) => (
                  actionTargetCapabilities.genericActions.includes(action as any)
                  || actionTargetCapabilities.moduleActions.includes(action as any)
                ))
                : group.actions,
            }))
            .filter((group) => group.actions.length > 0)
            .map((group) => (
            <div key={group.title} className="space-y-0.5">
              <div className="text-[9px] uppercase tracking-wide text-white/35">
                {group.title}
              </div>

              <div className="grid grid-cols-3 gap-1">
                {group.actions.map(({ action, label }) => (
                  <button
                    key={action}
                    disabled={
                      Boolean(isOrchestrationRunning)
                      || (
                        actionTarget != null
                        && THREED_GENERIC_TARGET_ACTIONS.includes(action as any)
                        && !targetInteractionReady
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();

                      const charId = Number(d.id);
                      if (!Number.isFinite(charId)) return;

                      if (
                        actionTarget
                        && actionTargetCapabilities
                        && THREED_GENERIC_TARGET_ACTIONS.includes(action as any)
                      ) {
                        const request = createThreeDCharacterOrchestrationRequest({
                          requestId: crypto.randomUUID(),
                          characterId: charId,
                          action,
                          target: currentActionTargetPosition
                            ? { ...actionTarget, position: currentActionTargetPosition }
                            : actionTarget,
                        });
                        window.dispatchEvent(new CustomEvent(
                          THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
                          { detail: request },
                        ));
                        return;
                      }

                      window.dispatchEvent(new CustomEvent('garden-character-action', {
                        detail: {
                          characterId: charId,
                          action,
                          target: actionTarget
                            ? { ...actionTarget, actionRequestId: crypto.randomUUID() }
                            : null,
                        },
                      }));
                    }}
                    className="min-h-6 w-full rounded bg-emerald-600/25 px-1 py-1 text-center text-[9px] font-medium leading-tight text-emerald-100 transition-colors hover:bg-emerald-600/45 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isProjectModelInstance && onUpdateModelInstance && onDeleteModelInstance && onMoveModelToggle && (
        <ModelInstancePlacementEditor
          key={modelInstanceId}
          instanceId={modelInstanceId}
          initialName={String(d.instanceName || selected.name || '')}
          initialScaleMultiplier={Number(d.scaleMultiplier ?? 1)}
          initialRotationY={Number(d.rotationYInstance ?? 0)}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          initialPlacementRole={selected.metadata?.placementRole === 'environment' ? 'environment' : 'object'}
          baseModelScale={Number(d.scale ?? 1)}
          updating={updatingModelInstanceId === modelInstanceId}
          deleting={deletingModelInstanceId === modelInstanceId}
          moveActive={movingModelInstanceId === modelInstanceId}
          onSave={(input) => onUpdateModelInstance(modelInstanceId, input)}
          onDelete={onDeleteModelInstance}
          onMoveToggle={onMoveModelToggle}
        />
      )}

      {isProjectBedInstance && onUpdateBedInstance && onDeleteBedInstance && (
        <BedInstanceEditor
          key={bedMarkerId}
          markerId={bedMarkerId}
          initialWidthFeet={Number(d.widthFeet ?? d.width ?? 4)}
          initialLengthFeet={Number(d.lengthFeet ?? d.length ?? d.depth ?? 8)}
          initialHeightFeet={Number(d.heightFeet ?? 1)}
          initialScale={Number(d.scale ?? 1)}
          initialColor={String(d.color ?? selected.color ?? '#8B5E3C')}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          initialRotation={Number(d.rotation ?? 0)}
          updating={updatingBedMarkerId === bedMarkerId}
          deleting={deletingBedMarkerId === bedMarkerId}
          onSave={onUpdateBedInstance}
          onDelete={(markerId, name) => onDeleteBedInstance(
            markerId,
            String(selected.name || name),
          )}
        />
      )}

      {isProjectFarmBotInstance && onUpdateFarmBotInstance && onDeleteFarmBotInstance && (
        <BedInstanceEditor
          key={farmBotMarkerId}
          markerId={farmBotMarkerId}
          entityLabel="FarmBot"
          initialWidthFeet={Number(d.widthFeet ?? 3)}
          initialLengthFeet={Number(d.lengthFeet ?? 6)}
          initialHeightFeet={Number(d.heightFeet ?? 3)}
          initialScale={Number(d.scale ?? 1)}
          initialColor={String(d.color ?? selected.color ?? '#4B5563')}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          initialRotation={Number(d.rotation ?? 0)}
          updating={updatingFarmBotMarkerId === farmBotMarkerId}
          deleting={deletingFarmBotMarkerId === farmBotMarkerId}
          onSave={onUpdateFarmBotInstance}
          onDelete={(markerId, name) => onDeleteFarmBotInstance(
            markerId,
            String(selected.name || name),
          )}
        />
      )}

      {isProjectPlantingInstance && onUpdatePlantingInstance && onDeletePlantingInstance && (
        <PlantingInstanceEditor
          key={plantingMarkerId}
          markerId={plantingMarkerId}
          initialModelScale={Number(d.modelScale ?? 1)}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          updating={updatingPlantingMarkerId === plantingMarkerId}
          deleting={deletingPlantingMarkerId === plantingMarkerId}
          onSave={onUpdatePlantingInstance}
          onDelete={(markerId, name) => onDeletePlantingInstance(
            markerId,
            String(selected.name || d.plantName || d.commonName || name),
          )}
        />
      )}

      {isProjectCharacterInstance && onUpdateCharacterPosition && onDeleteCharacterInstance && (
        <CharacterInstancePositionEditor
          key={characterMarkerId}
          markerId={characterMarkerId}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          disabled={controlledCharacterId != null}
          updating={updatingCharacterMarkerId === characterMarkerId}
          deleting={deletingCharacterMarkerId === characterMarkerId}
          onSave={onUpdateCharacterPosition}
          onDelete={(markerId) => onDeleteCharacterInstance(
            markerId,
            String(selected.name || d.name || 'Character'),
          )}
        />
      )}

    </div>
  );
}

// ✅ Interactive Stats Card (clickable to filter)
