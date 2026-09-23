'use client';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { readModelVolumeSensor } from '@/libraries/services/threed/physics/sensor-legacy-compat';

import { Button } from '@/components/ui/button';
import { assignedBedPlantings } from '@/libraries/services/threed/beds/bed-planting-bounds';

import { useAnimationActionSlots } from '@/components/admin/threed/animations/AnimationActionSlots';
import { getCharacterAnimationAvailability, subscribeCharacterAnimationAvailability } from '@/libraries/services/threed/animations/runtime-availability';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useSession } from 'next-auth/react';
import { hasModelLoadFailure, subscribeModelLoadFailures } from '@/libraries/services/threed/models/model-load-failures';
import { Crosshair, ExternalLink, Gamepad2, Loader2, Pause, ScanSearch, X } from 'lucide-react';
import type { RuntimeMarker, ThreeDActionTarget } from '@/libraries/types/map';
import type { ThreeDRuntimeMarkerPositionResolver } from '@/components/map/UnifiedMapView';
import {
  createThreeDCharacterOrchestrationRequest,
  createThreeDOrchestrationLifecycleState,
  planThreeDInteractionApproach,
  THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
  transitionThreeDOrchestrationLifecycleState,
  type ThreeDOrchestrationLifecycleState,
} from '@/libraries/services/threed/orchestration/interaction-core';
import {
  createThreeDActionTarget,
  getThreeDActionTargetCapabilities,
  isMatchingThreeDActionTarget,
  THREED_GENERIC_TARGET_ACTIONS,
} from '@/libraries/services/threed/orchestration/action-target-core';
import { BedInstanceEditor } from './BedInstanceEditor';
import { CharacterNavigationControls } from './CharacterNavigationControls';
import { CharacterInstancePositionEditor } from './CharacterInstancePositionEditor';
import { ModelInstancePlacementEditor } from './ModelInstancePlacementEditor';
import { resolveProjectModelCollisionMode } from '@/libraries/services/threed/models/project-model-instance-core';
import { PlantingInstanceEditor } from './PlantingInstanceEditor';
import { DetailsCardSection } from './DetailsCardSection';
import { sceneOwnerPose } from '@/libraries/services/threed/transforms/scene-transform-core';
import { useFarmBotLiveState } from '@/components/map/useFarmBotLiveState';
import {
  PhysicsSensorCuboidsEditor,
  type PhysicsSensorPlacementResult,
} from './PhysicsSensorCuboidsEditor';
import type { PhysicsSensorCuboid } from '@/libraries/services/threed/physics/sensor-cuboid-core';

function ModelFileNotice({ type, data }: { type: string; data: Record<string, any> }) {
  const { data: session, status: sessionStatus } = useSession();
  const ownerId = session?.user?.id;
  const generic = type === 'model' || type === 'models';
  const model = generic ? data : data.model;
  const modelId = Number(generic ? data.modelId ?? data.id : model?.id ?? data.customModelId ?? data.modelId ?? data.plant?.modelId);
  const filePath = typeof model?.filePath === 'string' ? model.filePath : '';
  const failed = useSyncExternalStore(subscribeModelLoadFailures,
    () => hasModelLoadFailure(modelId, filePath), () => false);
  const requiresModel = generic || ['character', 'characters'].includes(type)
    || (['plant', 'plants', 'planting', 'plantings'].includes(type) && modelId > 0);
  const needsAttention = requiresModel && (!filePath || failed);
  const [access, setAccess] = useState<{ id: number; status: 'editable' | 'unavailable' | 'error' } | null>(null);
  useEffect(() => {
    setAccess(null);
    if (!needsAttention || !Number.isSafeInteger(modelId) || modelId <= 0 || sessionStatus === 'loading') return;
    const controller = new AbortController();
    // Verify the current record and ownership without downloading its primary file.
    void fetch(`/api/threed/models?id=${modelId}`, {
      cache: 'no-store', signal: controller.signal,
    }).then(async (response) => {
      const result = await response.json();
      if (controller.signal.aborted) return;
      setAccess({ id: modelId, status: response.ok && result.success ? (ownerId && result.data?.userId === ownerId ? 'editable' : 'unavailable')
        : [403, 404].includes(response.status) ? 'unavailable' : 'error' });
    }).catch(() => {
      if (!controller.signal.aborted) setAccess({ id: modelId, status: 'error' });
    });
    return () => controller.abort();
  }, [modelId, needsAttention, ownerId, sessionStatus]);
  if (!needsAttention) return null;
  const status = access?.id === modelId ? access.status : null;
  const validId = Number.isSafeInteger(modelId) && modelId > 0;
  return (
    <div role="status" className="my-2 rounded border border-amber-400/40 bg-amber-400/10 p-2 text-xs text-amber-200">
      <p className="font-medium">{status === 'unavailable' || !validId ? 'Assigned Model is unavailable'
        : filePath ? 'Model file could not be loaded' : 'Main Model file is missing'}</p>
      <p className="mt-1">A fallback shape represents this asset until its Model file is available.</p>
      {status === 'editable' ? (
        <a href={`/admin/threed/model-files?modelId=${modelId}`} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-block underline underline-offset-2">Manage Model Files ↗</a>
      ) : (
        <>
          <p className="mt-1">{!validId ? 'No Model is assigned.'
            : status === 'unavailable' ? `Model #${modelId} no longer exists or is not editable by your account. Replace this Project asset with an available Model.`
            : status === 'error' ? 'Could not verify Model access. Open Models management to check its assignment.'
            : 'Checking Model access…'}</p>
          <a href="/admin/threed/models" target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block underline underline-offset-2">Open Models management ↗</a>
        </>
      )}
    </div>
  );
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <span className="text-[10px] text-white/40 shrink-0 w-[52px] text-right">{label}</span>
      <span className="min-w-0 flex-1 break-words text-[11px] leading-relaxed text-white/80 [overflow-wrap:anywhere]">{value}</span>
    </div>
  );
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
  const { state: runtime, loading, error } = useFarmBotLiveState({
    farmbotId,
    projectId,
  });

  return (
    <DetailsCardSection
      title="Live FarmBot State"
      summaryAside={loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-white/40" />
        ) : runtime ? (
          <div className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${runtime.condition === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[10px] capitalize text-white/70">{runtime.condition}</span>
          </div>
        ) : (
          <span className="text-[10px] text-white/35">{error ? 'Unavailable' : 'No recorded status'}</span>
        )}
    >
      {runtime && (
        <div className="space-y-0.5">
          <KvRow label="State" value={runtime.connectionState ?? 'Unavailable'} />
          <KvRow label="Source" value="FarmBot MQTT" />
          <KvRow label="Changed" value={formatMqttDate(runtime.stateChangedAt)} />
          <KvRow label="Observed" value={formatMqttDate(runtime.observedAt)} />
          <KvRow
            label="Device"
            value={runtime.position
              ? `X:${runtime.position.x.toFixed(1)} Y:${runtime.position.y.toFixed(1)} Z:${runtime.position.z.toFixed(1)}`
              : 'Position not recorded'}
          />
        </div>
      )}
    </DetailsCardSection>
  );
}


export function DetailsCard({ selectedSensorId, onSelectSensor, selected, projectId, projectMarkers, onSelectProjectMarker, leftOffsetRem = 0.75, onClose, controlledCharacterId, liveControlledCharacterPosition, onTakeControl, onReleaseControl, cameraMode, onCameraModeChange, onZoomCenter, actionTarget, orchestrationStatus, onSetActionTarget, onClearActionTarget, onFocusActionTarget, resolveRuntimeMarkerPosition, onUpdateModelInstance, updatingModelInstanceId, onDeleteModelInstance, deletingModelInstanceId, movingModelInstanceId, onMoveModelToggle, onUpdateBedInstance, updatingBedMarkerId, onDeleteBedInstance, deletingBedMarkerId, onUpdateFarmBotInstance, updatingFarmBotMarkerId, onDeleteFarmBotInstance, deletingFarmBotMarkerId, onUpdatePlantingInstance, updatingPlantingMarkerId, onDeletePlantingInstance, deletingPlantingMarkerId, movingPlantingMarkerId, onMovePlantingToggle, movingModuleMarkerId, onMoveModuleToggle, onUpdatePhysicsSensors, updatingPhysicsSensorMarkerId, placingPhysicsSensor, physicsSensorPlacementResult, onBeginPhysicsSensorPlacement, onCancelPhysicsSensorPlacement, onZoomToPhysicsSensor, onUpdateCharacterPosition, updatingCharacterMarkerId, onDeleteCharacterInstance, deletingCharacterMarkerId }: {
  selected: any;
  projectId: string | null;
  projectMarkers?: readonly RuntimeMarker[];
  selectedSensorId?: string | null;
  onSelectSensor?: (sensorId: string | null) => void;
  onSelectProjectMarker?: (marker: RuntimeMarker) => void;
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
    metadata: Record<string, unknown>;
    collisionMode: 'box' | 'triangle-surface';
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
    farmbotLiveAlignment?: import('@/libraries/services/threed/farmbot/coordinate-alignment-core').FarmBotLiveAlignmentConfiguration;
  }) => void;
  updatingFarmBotMarkerId?: number | null;
  onDeleteFarmBotInstance?: (markerId: number, name: string) => void;
  deletingFarmBotMarkerId?: number | null;
  onUpdatePlantingInstance?: (markerId: number, input: {
    bedId?: number | null;
    modelScale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  updatingPlantingMarkerId?: number | null;
  onDeletePlantingInstance?: (markerId: number, name: string) => void;
  deletingPlantingMarkerId?: number | null;
  movingModuleMarkerId?: number | null;
  onMoveModuleToggle?: (markerId:number) => void;
  movingPlantingMarkerId?: number | null;
  onMovePlantingToggle?: (markerId:number, input:{bedId:number|null;modelScale:number}) => void;
  onUpdatePhysicsSensors?: (markerId: number, sensors: readonly PhysicsSensorCuboid[]) => Promise<boolean>;
  updatingPhysicsSensorMarkerId?: number | null;
  placingPhysicsSensor?: { markerId: number; sensorId: string } | null;
  physicsSensorPlacementResult?: PhysicsSensorPlacementResult | null;
  onBeginPhysicsSensorPlacement?: (marker: RuntimeMarker, markerId: number, sensor: PhysicsSensorCuboid, operation: 'place' | 'move') => void;
  onCancelPhysicsSensorPlacement?: () => void;
  onZoomToPhysicsSensor?: (marker: RuntimeMarker, sensor: PhysicsSensorCuboid) => void;
  onUpdateCharacterPosition?: (markerId: number, position: {
    characterPhysics?: import("@/libraries/services/threed/characters/character-physics").CharacterPhysics;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  updatingCharacterMarkerId?: number | null;
  onDeleteCharacterInstance?: (markerId: number, name: string) => void;
  deletingCharacterMarkerId?: number | null;
}) {
  const { slots: customActionSlots, error: actionSlotError } = useAnimationActionSlots();
  const customActions = customActionSlots.map(slot => slot.actionKey);
  const customGroups = [...new Set(customActionSlots.map(slot => (slot.categoryName ?? 'Uncategorized')))].map(title => ({ title: `${title} · Animation only`, actions: customActionSlots.filter(slot => (slot.categoryName ?? 'Uncategorized') === title).map(slot => ({ action: slot.actionKey, label: slot.name })) }));
  const animationAvailability = useSyncExternalStore(subscribeCharacterAnimationAvailability,
    () => getCharacterAnimationAvailability(Number(selected?.data?.id), String(selected?.data?.model?.filePath ?? '')),
    () => null);
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
  const physicsSensorMarkerId = isProjectModelInstance
    ? modelInstanceId
    : isProjectBedInstance
      ? bedMarkerId
      : isProjectPlantingInstance
        ? plantingMarkerId
        : isProjectFarmBotInstance
          ? farmBotMarkerId
          : null;
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
  const assignedPlantings = (type === 'beds' || type === 'bed')
    ? assignedBedPlantings(d.id, projectMarkers ?? []) : [];
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
  if (!isCharacterMarker && (d.notes || d.description)) metaRows.push({ label: 'Notes', value: (d.notes || d.description).slice(0, 80) });

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
      className={`flex flex-col threed-workspace-panel threed-details-surface threed-inspector absolute top-9 z-40 max-h-[calc(100%-2.25rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-white/15 text-white shadow-xl pointer-events-auto [scrollbar-width:thin] transition-[left]`}
      style={{
        left: `${leftOffsetRem}rem`,
        backgroundColor: 'var(--threed-details-background, rgba(17, 26, 40, 0.5))',
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-start justify-between gap-2 px-2 py-2"
      >
        <div className="min-w-0 pb-1 pt-0.5">
          <div className="truncate text-sm font-semibold text-white">
            {selectedSensorId ? (readPhysicsSensorCuboids(selected.metadata).find(sensor => sensor.id === selectedSensorId)?.name ?? 'New Physics Sensor') : selected.name || selected.title || selected.label || 'Unknown'}
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

      <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain px-2 pb-2 [scrollbar-width:thin]">
      {selectedSensorId && <button type="button" onClick={() => onSelectSensor?.(null)} className="mb-2 text-left text-xs text-cyan-200">← {selected.name} · Parent asset</button>}
      <div className={selectedSensorId ? 'hidden' : 'contents'}>
      {!isIncident && <ModelFileNotice type={normalizedType} data={d} />}

      <div className="order-[-20] mt-1.5 flex items-center gap-1">
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
      {metaRows.length > 0 && !(isProjectCharacterInstance && onUpdateCharacterPosition && onDeleteCharacterInstance) && (
        <DetailsCardSection title="Module / Position" className="order-1">
          {metaRows.map((r, i) => <KvRow key={i} label={r.label} value={r.value} />)}
        </DetailsCardSection>
      )}

      {isCharacterMarker && (
        <>
          <DetailsCardSection title="Model + Mesh" className="order-5">
              <KvRow label="Assigned Model" value={String(d.model?.modelName || ((d.model?.id ?? d.modelId) ? `Model #${d.model?.id ?? d.modelId}` : 'Basic shape'))} />
              {d.model?.modelType && <KvRow label="Format" value={String(d.model.modelType).toUpperCase()} />}
              <KvRow label="Model source" value={d.model?.filePath ? 'File configured' : 'No Model file configured'} />
              <p className="text-[10px] text-slate-300">A basic shape represents Characters without a usable Model. The visible mesh and physics capsule are separate.</p>
              {Number(d.model?.id ?? d.modelId) > 0 && (
                <a className="inline-flex min-h-8 items-center text-xs text-cyan-200 underline underline-offset-2" href={`/admin/threed/models?id=${Number(d.model?.id ?? d.modelId)}`} target="_blank" rel="noopener noreferrer">View Model in Admin</a>
              )}
          </DetailsCardSection>
          <DetailsCardSection title="Character Defaults" className="order-6">
              <KvRow label="Type" value={String(d.type ?? d.characterType ?? 'Unspecified')} />
              <KvRow label="Control" value={d.isMovable === true ? 'User controllable' : 'Autonomous'} />
              <KvRow label="Movement" value={String(d.movementType ?? 'stationary')} />
              {d.movementSpeed != null && <KvRow label="Movement speed" value={String(d.movementSpeed)} />}
              <KvRow label="Default emote" value={String(d.defaultEmote ?? 'none')} />
              {(d.notes || d.description) && <p className="text-[10px] text-slate-300">{String(d.notes || d.description)}</p>}
              <p className="text-[10px] text-slate-400">Manage reusable defaults in Character Admin. Save placement and physics below for this Project instance.</p>
          </DetailsCardSection>
        </>
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
        if (d.isMovable !== true) return <p className="order-2 mt-2 rounded bg-white/[0.035] p-2 text-[11px] text-slate-300">Selected Character · Scene-managed movement.</p>;
        const charId = d.id;
        const isControlling = isSelectedCharacterControlled;
        return (
          <DetailsCardSection title="Character Control" defaultOpen className="order-2" >
            <p role="status" className={`text-[11px] font-medium ${isControlling ? 'text-cyan-200' : 'text-slate-300'}`}>
              {isControlling ? 'Controlling this Character' : controlledCharacterId != null ? 'Selected · Another Character is controlled' : 'Selected · Control available'}
            </p>
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
                      aria-label="Character camera mode"
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
                  {controlledCharacterId != null ? 'Switch Control to this Character' : 'Take Control'}
                </span>
              </button>
            )}
          </DetailsCardSection>
        );
      })()}

      {/* Character Actions — shared semantic animation controls */}
      {!isIncident && (type === 'characters' || type === 'character') && (
        <details key={String(selected.id)} className="order-7 mt-2 space-y-1.5 rounded border border-cyan-300/15 bg-white/[0.035] p-1.5">
          <summary className="cursor-pointer text-xs font-medium text-cyan-100">Animations <span className="font-normal text-slate-400">· {animationAvailability ? (animationAvailability.size ? 'Loaded' : 'No actions available') : 'Loading'}</span></summary>
          {!animationAvailability && <p className="text-[10px] text-slate-400" role="status">Waiting for animation availability…</p>}
          {/* <div className="text-[10px] font-medium text-white/60">Character Actions</div> */}

          <div className="rounded bg-white/5 px-2 py-1.5 text-[10px] text-white/55">
            {actionTarget ? (
              <>
                <div>🎯 Target: <span className="text-emerald-300">{actionTarget.name}</span> <span className="text-white/30">({actionTarget.type} #{actionTarget.id})</span></div>
                {actionTarget.type === 'farmbots' && (
                  <div className="mt-1 text-amber-200/70">
                    FarmBot actions are animation-only.
                  </div>
                )}
                {isEcctrlCharacter && <CharacterNavigationControls actorMarkerId={String(selected.id)} targetMarkerId={actionTarget.markerId} controlled={isSelectedCharacterControlled} ready={hasLiveControlledPosition && !isOrchestrationRunning} />}
                {!isEcctrlCharacter && <p className="mt-1 text-white/40">Target walking is currently available for Characters with Take Control.</p>}
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

          {actionSlotError && <p role="alert" className="text-xs text-red-400">{actionSlotError}</p>}
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
          ]).concat(customGroups)
            .map((group) => ({
              ...group,
              actions: actionTargetCapabilities
                ? group.actions.filter(({ action }) => (
                  customActions.includes(action)
                  || actionTargetCapabilities.genericActions.includes(action as any)
                  || actionTargetCapabilities.moduleActions.includes(action as any)
                ))
                : group.actions,
            }))
            .filter((group) => group.actions.length > 0)
            .flatMap(group => animationAvailability ? [
              { ...group, title: `${group.title} · Active`, inactive: false, actions: group.actions.filter(({action}) => (animationAvailability.has(action.toLowerCase()) && customActionSlots.find(slot => slot.actionKey === action)?.isActive !== false)) },
              { ...group, title: `${group.title} · Inactive`, inactive: true, actions: group.actions.filter(({action}) => !(animationAvailability.has(action.toLowerCase()) && customActionSlots.find(slot => slot.actionKey === action)?.isActive !== false)) },
            ].filter(section => section.actions.length > 0) : [{ ...group, inactive: true }])
            .map((group) => (
            <details key={group.title} className="space-y-1 rounded bg-white/[0.035] p-1.5">
              <summary title={group.inactive ? 'Unavailable in the loaded Character runtime' : 'Available in the loaded Character runtime'} className={`cursor-pointer text-[11px] font-medium ${group.inactive ? 'text-slate-400' : 'text-cyan-100'}`}>
                {group.title} <span className="text-slate-400">({group.actions.length})</span>
              </summary>

              <div className="threed-animation-actions grid grid-cols-3 gap-1">
                {group.actions.map(({ action, label }) => (
                  <button
                    key={action}
                    aria-label={`${label}${customActionSlots.find(slot => slot.actionKey === action)?.isActive === false ? ' — Slot disabled' : group.inactive ? ' — Animation unavailable' : isOrchestrationRunning ? ' — Interaction in progress' : actionTarget && THREED_GENERIC_TARGET_ACTIONS.includes(action as any) && !targetInteractionReady ? ' — Take Control and move within interaction range' : ''}`}
                    title={customActionSlots.find(slot => slot.actionKey === action)?.isActive === false ? 'Slot disabled in Admin' : group.inactive ? 'Animation unavailable in this Character' : isOrchestrationRunning ? 'Wait for the current interaction to finish' : actionTarget && THREED_GENERIC_TARGET_ACTIONS.includes(action as any) && !targetInteractionReady ? 'Take Control and move within interaction range' : customActions.includes(action) ? 'Play animation only' : label}
                    disabled={
                      group.inactive || Boolean(isOrchestrationRunning)
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
                          target: !customActions.includes(action) && actionTarget
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
            </details>
          ))}
        </details>
      )}

      {isProjectModelInstance && onUpdateModelInstance && onDeleteModelInstance && onMoveModelToggle && (
        <ModelInstancePlacementEditor
          key={`${modelInstanceId}:${String(d.placementRevision ?? '')}`}
          instanceId={modelInstanceId}
          initialMovableBall={selected.metadata?.physicsMode === 'ball'}
          initialBallPhysics={selected.metadata?.ballPhysics}
          initialVolumeSensor={readModelVolumeSensor(selected.metadata)}
          initialName={String(d.instanceName || selected.name || '')}
          initialScaleMultiplier={Number(d.scaleMultiplier ?? 1)}
          initialRotationY={Number(d.rotationYInstance ?? 0)}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          initialPlacementRole={selected.metadata?.placementRole === 'environment' ? 'environment' : 'object'}
          initialCollisionMode={resolveProjectModelCollisionMode(selected.metadata)}
          baseModelScale={Number(d.scale ?? 1)}
          updating={updatingModelInstanceId === modelInstanceId}
          deleting={deletingModelInstanceId === modelInstanceId}
          moveActive={movingModelInstanceId === modelInstanceId}
          onSave={(input) => onUpdateModelInstance(modelInstanceId, input)}
          onDelete={onDeleteModelInstance}
          onMoveToggle={onMoveModelToggle}
        />
      )}

      {(type === 'beds' || type === 'bed') && projectMarkers !== undefined && (
        <DetailsCardSection title={`Plantings (${assignedPlantings.length})`}>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {assignedPlantings.length === 0 && <p className="text-xs text-muted-foreground">No assigned Plantings.</p>}
            {assignedPlantings.map(planting => (
              <Button key={planting.id} type="button" variant="ghost" size="sm" className="h-auto min-h-8 w-full justify-start whitespace-normal text-left text-xs"
                disabled={!onSelectProjectMarker} aria-label={`Select Planting: ${planting.name}`}
                onClick={() => onSelectProjectMarker?.(planting)}>{planting.name}</Button>
            ))}
          </div>
        </DetailsCardSection>
      )}

      {isProjectBedInstance && onUpdateBedInstance && onDeleteBedInstance && (
        <BedInstanceEditor
          key={`${bedMarkerId}:${String(d.placementRevision ?? '')}`}
          moveActive={movingModuleMarkerId === bedMarkerId}
          onMoveToggle={onMoveModuleToggle}
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
          key={`${farmBotMarkerId}:${String(d.placementRevision ?? '')}`}
          moveActive={movingModuleMarkerId === farmBotMarkerId}
          onMoveToggle={onMoveModuleToggle}
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
          initialFarmBotLiveAlignment={selected.metadata?.farmbotLiveAlignment}
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
          moveActive={movingPlantingMarkerId === plantingMarkerId}
          onMoveToggle={onMovePlantingToggle}
          markerId={plantingMarkerId}
          initialBedId={d.bedId == null ? null : Number(d.bedId)}
          beds={Array.from(new Map((projectMarkers ?? []).filter(marker=>marker.type==='beds' && marker.isActive !== false && Number(marker.data?.id)>0).map(marker=>[Number(marker.data?.id),{id:Number(marker.data?.id),name:String(marker.name || `Bed #${marker.data?.id}`)}])).values())}
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

      </div>
      {physicsSensorMarkerId !== null && onUpdatePhysicsSensors && onBeginPhysicsSensorPlacement && onCancelPhysicsSensorPlacement && (
        <PhysicsSensorCuboidsEditor
          key={`physics-sensors:${physicsSensorMarkerId}:${String(selected.metadata?.placementRevision ?? '')}`}
          selectedSensorId={selectedSensorId ?? null}
          onSelectSensor={onSelectSensor}
          markerId={physicsSensorMarkerId}
          ownerKey={`${projectId}:${selected.id}`}
          ownerPose={sceneOwnerPose(selected, resolveRuntimeMarkerPosition?.(selected.type, Number(selected.data?.id)))}
          initialMetadata={selected.metadata}
          saving={updatingPhysicsSensorMarkerId === physicsSensorMarkerId}
          placementSensorId={placingPhysicsSensor?.markerId === physicsSensorMarkerId ? placingPhysicsSensor.sensorId : null}
          placementResult={physicsSensorPlacementResult ?? null}
          onBeginPlacement={(sensor, operation) => onBeginPhysicsSensorPlacement(selected, physicsSensorMarkerId, sensor, operation)}
          onCancelPlacement={onCancelPhysicsSensorPlacement}
          onZoomToSensor={(sensor) => onZoomToPhysicsSensor?.(selected, sensor)}
          onSave={onUpdatePhysicsSensors}
        />
      )}

      {isProjectCharacterInstance && onUpdateCharacterPosition && onDeleteCharacterInstance && (
        <CharacterInstancePositionEditor
          key={`${characterMarkerId}:${String(d.placementRevision ?? '')}`}
          moveActive={movingModuleMarkerId === characterMarkerId}
          onMoveToggle={onMoveModuleToggle}
          markerId={characterMarkerId}
          metadata={<>{metaRows.filter(row => row.label !== 'Position').map((row, i) => <KvRow key={i} label={row.label} value={row.value} />)}</>}
          movable={d.isMovable === true}
          initialPhysics={selected.metadata?.characterPhysics}
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
    </div>
  );
}

// ✅ Interactive Stats Card (clickable to filter)
