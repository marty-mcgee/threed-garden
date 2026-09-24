// dashboard/scene/page
'use client';
import { GroundMapInspectorWorkspace, GroundMapInspector, useGroundMapInspector } from '@/components/map/details/GroundMapInspectorWorkspace';
import { SensorGroupInspector } from '@/components/map/details/SensorGroupInspector';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  MapPin, 
  Settings,
  ChevronLeft,
  Plus,
  Trash2,
  User,
  Sprout,
  Crosshair,
  Gamepad2,
  Pause,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DetailsCard } from '@/components/map/details/DetailsCard';
import { ProjectAssetsPanel } from '@/components/map/panels/ProjectAssetsPanel';
import { ProjectSelectorDialog } from '@/components/map/panels/ProjectSelectorDialog';
import { ProjectTemplateDialog } from '@/components/map/panels/ProjectTemplateDialog';
import { ProjectHeaderMenu } from '@/components/map/header/ProjectHeaderMenu';
import { ProjectSceneToolbar } from '@/components/map/header/ProjectSceneToolbar';
import { useThreeDLibraryWorkspace } from '@/components/map/hooks/useThreeDLibraryWorkspace';
import { useCombinedMapPanelResize } from '@/components/map/hooks/useCombinedMapPanelResize';
import { useDataFreshness } from '@/components/map/hooks/useDataFreshness';
import { useThreeDModelLibraryCollection } from '@/components/map/hooks/useThreeDModelLibraryCollection';
import { useThreeDPlacedLibraryAssets } from '@/components/map/hooks/useThreeDPlacedLibraryAssets';
import { useProjectAssetCollection } from '@/components/map/hooks/useProjectAssetCollection';
import { useThreeDProjectSessionLoader } from '@/components/map/hooks/useThreeDProjectSessionLoader';
import { ThreeDCharacterLibraryPanel } from '@/components/map/panels/ThreeDCharacterLibraryPanel';
import {
  ThreeDFarmBotLibraryPanel,
  type ThreeDFarmBotLibraryItem,
} from '@/components/map/panels/ThreeDFarmBotLibraryPanel';
import {
  ThreeDBedPlacementPanel,
  type ThreeDBedPlacementDraft,
} from '@/components/map/panels/ThreeDBedPlacementPanel';
import { ThreeDModelLibraryPanel } from '@/components/map/panels/ThreeDModelLibraryPanel';
import {
  ThreeDPlantingPlacementPanel,
  type ThreeDPlantingOption,
  type ThreeDPlantingPlacementDraft,
} from '@/components/map/panels/ThreeDPlantingPlacementPanel';
import { ProjectScenariosPanel } from '@/components/map/panels/ProjectScenariosPanel';
import { ProjectSetupPanel } from '@/components/map/panels/ProjectSetupPanel';
import { ThreeDProjectLoadingPresentation, ProjectToolbarLoadingSkeleton } from '@/components/map/presentation/ThreeDProjectLoadingPresentation';
import { getDefaultMapData, getDefaultLayers } from '@/libraries/services/map/DefaultMapData';
import {
  UnifiedMapView,
  type ProjectMapViewStateProvider,
  type ProjectThreeDMarkerSnapshotProvider,
  type ProjectThreeDViewStateProvider,
  type ThreeDRuntimeMarkerPositionResolver,
} from '@/components/map/UnifiedMapView';
import {
  MapLayerConfig,
  MapViewMode,
  ProjectThreeDMarkerRecord,
  RuntimeMarker,
  ThreeDActionTarget,
  ThreeDCharacterOrchestrationRequest,
  UnifiedMapData,
} from '@/libraries/types/map';
import type {
  ThreeDCharacterLibraryItem,
  ThreeDModelLibraryItem,
} from '@/libraries/types/threed';
import {
  createThreeDOrchestrationLifecycleState,
  createThreeDCharacterOrchestrationRequest,
  planThreeDInteractionApproach,
  THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
  transitionThreeDOrchestrationLifecycleState,
  type ThreeDOrchestrationLifecycleState,
} from '@/libraries/services/threed/orchestration/interaction-core';
import {
  THREED_GENERIC_TARGET_ACTIONS,
  createThreeDActionTarget,
  getThreeDActionTargetCapabilities,
  isMatchingThreeDActionTarget,
} from '@/libraries/services/threed/orchestration/action-target-core';
import { applyThreeDProjectClientTransaction } from '@/libraries/services/threed/markers/project-marker-client-state-core';
import { SensorGroupsWorkspace } from '@/components/threed/physics/SensorGroupsWorkspace';
import { SceneTransformWorkspace, useSceneTransform } from '@/components/threed/transform/SceneTransformWorkspace';
import { sceneOwnerPose, sceneLocalToWorld, sceneWorldToLocal } from '@/libraries/services/threed/transforms/scene-transform-core';
import { validatePhysicsSensorCuboids, type PhysicsSensorCuboid } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import type { PhysicsSensorPlacementResult } from '@/components/map/details/PhysicsSensorCuboidsEditor';
import {
  createProjectCharacterLibraryPlacementRequest,
  createProjectFarmBotLibraryPlacementRequest,
  createProjectModelLibraryPlacementRequest,
  type ThreeDScenePlacementPosition,
} from '@/libraries/services/threed/markers/library-placement-client-core';
import { ThreeDRuntimeMarkerRegistry } from '@/libraries/services/threed/markers/runtime-marker-core';
import { buildThreeDRuntimeMarkerResult } from '@/libraries/services/threed/markers/runtime-marker-builder';
import type { ThreeDGeographicOrigin } from '@/libraries/services/threed/markers/map-coordinate-core';
import {
  PROJECT_VIEW_STATE_VERSION,
  type ThreeDProjectViewState,
} from '@/libraries/services/threed/markers/project-view-state-core';

// ✅ v0.16.0-centaur: Polished Details Card — key-value grid, position coords, clear controls
function selectedProjectMarkerRecordId(selected: any): number | null {
  const id = Number(selected?.data?.projectMarkerId ?? selected?.data?.instanceId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function reconcileSelectedProjectMarker(
  selected: any,
  recordId: number,
  record: ProjectThreeDMarkerRecord,
): any {
  if (selectedProjectMarkerRecordId(selected) !== recordId) return selected;
  const position = {
    x: Number(record.positionX),
    y: Number(record.positionY),
    z: Number(record.positionZ),
  };
  const hasPosition = Object.values(position).every(Number.isFinite);
  return {
    ...selected,
    name: record.name ?? selected.name,
    label: record.label ?? selected.label,
    color: record.color ?? selected.color,
    position: hasPosition ? position : selected.position,
    data: {
      ...(selected.data ?? {}),
      ...(record.data ?? {}),
      projectMarkerId: recordId,
      // Successful CRUD responses reset only this instance's placement form.
      placementRevision: Number(selected.data?.placementRevision ?? 0) + 1,
      ...(hasPosition ? {
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
      } : {}),
    },
    metadata: {
      ...(selected.metadata ?? {}),
      ...(record.metadata ?? {}),
    },
  };
}

function clearSelectedProjectMarker(selected: any, recordId: number): any {
  return selectedProjectMarkerRecordId(selected) === recordId ? null : selected;
}

export default function UnifiedMapPage() {
  return (
    <Suspense fallback={
      <ThreeDProjectLoadingPresentation
        progress={5}
        label="Starting Project workspace…"
        className="h-[calc(100dvh-83px)]"
        showProjectHeader
      />
    }>
      <SensorGroupsWorkspace><SceneTransformWorkspace><GroundMapInspectorWorkspace><UnifiedMapPageInner /></GroundMapInspectorWorkspace></SceneTransformWorkspace></SensorGroupsWorkspace>
    </Suspense>
  );
}

function UnifiedMapPageInner() {
  const { showToast, ToastComponent } = useToast();
  const transform = useSceneTransform();
  const groundMapInspector = useGroundMapInspector();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const projectRuntimeMarkerRegistryRef = useRef<ThreeDRuntimeMarkerRegistry | null>(null);
  if (!projectRuntimeMarkerRegistryRef.current) {
    projectRuntimeMarkerRegistryRef.current = new ThreeDRuntimeMarkerRegistry();
  }
  useEffect(() => () => {
    projectRuntimeMarkerRegistryRef.current?.clear();
  }, []);
  
  // ✅ State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdParam);
  const {
    loading,
    beginProjectTransition,
    loadProjectSession,
  } = useThreeDProjectSessionLoader();
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(!projectIdParam);
  const [isProjectTemplateDialogOpen, setIsProjectTemplateDialogOpen] = useState(false);
  const [isProjectSummaryOpen, setIsProjectSummaryOpen] = useState(false);
  const dismissProjectSummary = useCallback(() => setIsProjectSummaryOpen(false), []);
  const [data, setData] = useState<UnifiedMapData>(getDefaultMapData());
  const [isDefaultView, setIsDefaultView] = useState(!projectIdParam);
  const [savingProjectMarkers, setSavingProjectMarkers] = useState(false);
  const saveRequestRef = useRef(0);
  useEffect(() => {
    saveRequestRef.current += 1;
    setSavingProjectMarkers(false);
  }, [selectedProjectId]);
  const [projectInfo, setProjectInfo] = useState<{ name: string; hasData: boolean } | null>(null);
  const [projectThreeDModules, setProjectThreeDModules] = useState<Array<{
    id: number;
    name: string;
  }>>([]);
  const [projectGeographicOrigin, setProjectGeographicOrigin] = useState<ThreeDGeographicOrigin | null>(null);
  const {
    isModelLibraryOpen,
    isCharacterLibraryOpen,
    isFarmBotLibraryOpen,
    setIsModelLibraryOpen,
    setIsCharacterLibraryOpen,
    setIsFarmBotLibraryOpen,
  } = useThreeDLibraryWorkspace();
  const [isProjectAssetsOpen, setIsProjectAssetsOpen] = useState(false);
  const [isProjectSetupOpen, setIsProjectSetupOpen] = useState(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [isSetupMenuOpen, setIsSetupMenuOpen] = useState(false);
  const [projectSetupSessionProjectId, setProjectSetupSessionProjectId] = useState<string | null>(null);
  const [dismissedProjectSetupProjectId, setDismissedProjectSetupProjectId] = useState<string | null>(null);
  const [isThreeDPresentationComplete, setIsThreeDPresentationComplete] = useState(false);
  const [projectAssetSearch, setProjectAssetSearch] = useState('');
  const [projectAssetType, setProjectAssetType] = useState('all');
  const projectAssetsTriggerRef = useRef<HTMLButtonElement>(null);
  const [isBedPlacementOpen, setIsBedPlacementOpen] = useState(false);
  const [isPlantingPlacementOpen, setIsPlantingPlacementOpen] = useState(false);
  const [isSceneAddMenuOpen, setIsSceneAddMenuOpen] = useState(false);
  const [environmentControlsCloseRequest, setEnvironmentControlsCloseRequest] = useState(0);
  const [libraryModels, setLibraryModels] = useState<ThreeDModelLibraryItem[]>([]);
  const [libraryCategorySlug, setLibraryCategorySlug] = useState('all');
  const [libraryModelSearch, setLibraryModelSearch] = useState('');
  const [inspectedLibraryModelId, setInspectedLibraryModelId] = useState<number | null>(null);
  const [libraryCharacters, setLibraryCharacters] = useState<ThreeDCharacterLibraryItem[]>([]);
  const [libraryFarmBots, setLibraryFarmBots] = useState<ThreeDFarmBotLibraryItem[]>([]);
  const [loadingLibraryModels, setLoadingLibraryModels] = useState(false);
  const [loadingLibraryCharacters, setLoadingLibraryCharacters] = useState(false);
  const [loadingLibraryFarmBots, setLoadingLibraryFarmBots] = useState(false);
  const [placementModel, setPlacementModel] = useState<ThreeDModelLibraryItem | null>(null);
  const [placementCharacter, setPlacementCharacter] = useState<ThreeDCharacterLibraryItem | null>(null);
  const [placementFarmBot, setPlacementFarmBot] = useState<ThreeDFarmBotLibraryItem | null>(null);
  const [placementThreedId, setPlacementThreedId] = useState<number | null>(null);
  const [modelPlacementDraft, setModelPlacementDraft] = useState({ x: '0', y: '0', z: '0', rotationY: '0' });
  const [placementScaleMultiplier, setPlacementScaleMultiplier] = useState('1');
  const [placementModelRole, setPlacementModelRole] = useState<'object' | 'environment'>('object');
  const [placingModel, setPlacingModel] = useState(false);
  const [placingCharacter, setPlacingCharacter] = useState(false);
  const [placingFarmBot, setPlacingFarmBot] = useState(false);
  const [placingBed, setPlacingBed] = useState(false);
  const [placingPlanting, setPlacingPlanting] = useState(false);
  const [bedPlacementActive, setBedPlacementActive] = useState(false);
  const [bedPlacementDraft, setBedPlacementDraft] = useState<ThreeDBedPlacementDraft>({
    name: 'New Garden Bed',
    shape: 'rectangle',
    widthFeet: '4',
    lengthFeet: '8',
    heightFeet: '1',
    color: '#8B5E3C',
    rotation: '0',
    scale: '1',
  });
  const [plantingOptions, setPlantingOptions] = useState<ThreeDPlantingOption[]>([]);
  const [loadingPlantingOptions, setLoadingPlantingOptions] = useState(false);
  const [plantingPlacementActive, setPlantingPlacementActive] = useState(false);
  const [plantingPlacementDraft, setPlantingPlacementDraft] = useState<ThreeDPlantingPlacementDraft>({
    plantId: '',
    bedId: '',
    quantity: '1',
    spacingInches: '',
    modelScale: '1',
  });
  const [farmBotPlacementDraft, setFarmBotPlacementDraft] = useState({
    widthFeet: '3',
    lengthFeet: '6',
    heightFeet: '3',
    color: '#4B5563',
    rotation: '0',
    scale: '1',
  });
  const [updatingModelInstanceId, setUpdatingModelInstanceId] = useState<number | null>(null);
  const [deletingModelInstanceId, setDeletingModelInstanceId] = useState<number | null>(null);
  const [movingModelInstance, setMovingModelInstance] = useState<{
    id: number;
    name: string;
    planting?: {bedId:number|null;modelScale:number};
    module?: 'beds' | 'farmbots' | 'characters';
  } | null>(null);
  const [updatingBedMarkerId, setUpdatingBedMarkerId] = useState<number | null>(null);
  const [deletingBedMarkerId, setDeletingBedMarkerId] = useState<number | null>(null);
  const [updatingFarmBotMarkerId, setUpdatingFarmBotMarkerId] = useState<number | null>(null);
  const [deletingFarmBotMarkerId, setDeletingFarmBotMarkerId] = useState<number | null>(null);
  const [updatingPlantingMarkerId, setUpdatingPlantingMarkerId] = useState<number | null>(null);
  const [deletingPlantingMarkerId, setDeletingPlantingMarkerId] = useState<number | null>(null);
  const [updatingCharacterMarkerId, setUpdatingCharacterMarkerId] = useState<number | null>(null);
  const [deletingCharacterMarkerId, setDeletingCharacterMarkerId] = useState<number | null>(null);
  const [updatingPhysicsSensorMarkerId, setUpdatingPhysicsSensorMarkerId] = useState<number | null>(null);
  const [placingPhysicsSensor, setPlacingPhysicsSensor] = useState<{
    marker: RuntimeMarker;
    markerId: number;
    sensor: PhysicsSensorCuboid;
    operation: 'place' | 'move';
  } | null>(null);
  const [physicsSensorPlacementResult, setPhysicsSensorPlacementResult] = useState<PhysicsSensorPlacementResult | null>(null);
  const [sensorFocusRequest, setSensorFocusRequest] = useState(0);
  const [sensorFocusPosition, setSensorFocusPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const placementPhysicsSensorPreview = useMemo(() => {
    if (!placingPhysicsSensor) return null;
    const owner = placingPhysicsSensor.marker;
    const ownerRotationY = owner.type === 'models'
      ? Number(owner.data?.rotationYInstance) || 0
      : (Number(owner.data?.rotation) || 0) * Math.PI / 180;
    return {
      ...placingPhysicsSensor.sensor,
      rotationY: placingPhysicsSensor.sensor.rotationY + ownerRotationY * 180 / Math.PI,
    };
  }, [placingPhysicsSensor]);
  useEffect(() => {
    if (!transform.session) return;
    setPlacingPhysicsSensor(null);
    setMovingModelInstance(null);
    setPlacementModel(null);
    setPlacementCharacter(null);
    setPlacementFarmBot(null);
    setBedPlacementActive(false);
    setPlantingPlacementActive(false);
    setEnvironmentControlsCloseRequest(value => value + 1);
    setIsSceneAddMenuOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setViewMode('3d');
    // Only begin once; pointer updates must not reopen or reset the Scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transform.session?.objectKey]);

  const transformOperationKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = transform.session?.objectKey ?? null;
    if (key !== transformOperationKeyRef.current) {
      transformOperationKeyRef.current = key;
      return; // The begin effect clears any previous placement operation.
    }
    if (key && (movingModelInstance || placementModel || placementCharacter || placementFarmBot
      || bedPlacementActive || plantingPlacementActive || placingPhysicsSensor)) transform.cancel();
  }, [transform.session?.objectKey, transform.cancel, movingModelInstance, placementModel,
    placementCharacter, placementFarmBot, bedPlacementActive, plantingPlacementActive, placingPhysicsSensor]);

  const placingModelRef = useRef(false);
  const placingCharacterRef = useRef(false);
  const placingFarmBotRef = useRef(false);
  const placingBedRef = useRef(false);
  const placingPlantingRef = useRef(false);
  const activeSceneOperation = useMemo(() => {
    const pendingOperation = [
      deletingModelInstanceId != null && 'Deleting Model',
      deletingCharacterMarkerId != null && 'Deleting Character',
      deletingFarmBotMarkerId != null && 'Deleting FarmBot',
      deletingBedMarkerId != null && 'Deleting Bed',
      deletingPlantingMarkerId != null && 'Deleting Planting',
      updatingModelInstanceId != null && (movingModelInstance
        ? `Moving ${movingModelInstance.name}`
        : 'Updating Model'),
      updatingCharacterMarkerId != null && 'Updating Character',
      updatingFarmBotMarkerId != null && 'Updating FarmBot',
      updatingBedMarkerId != null && 'Updating Bed',
      updatingPlantingMarkerId != null && 'Updating Planting',
      updatingPhysicsSensorMarkerId != null && 'Updating Physics Sensors',
      placingModel && `Placing ${placementModel?.modelName ?? 'Model'}`,
      placingCharacter && `Placing ${placementCharacter?.name ?? 'Character'}`,
      placingFarmBot && `Placing ${placementFarmBot?.name ?? 'FarmBot'}`,
      placingBed && `Placing ${bedPlacementDraft.name || 'Bed'}`,
      placingPlanting && `Placing ${plantingOptions.find(
        (plant) => String(plant.id) === plantingPlacementDraft.plantId,
      )?.commonName ?? 'Planting'}`,
    ].find((operation): operation is string => Boolean(operation));

    if (pendingOperation) {
      return {
        phase: 'pending' as const,
        label: pendingOperation,
        instruction: 'Applying the Project change…',
        cancellable: false,
      };
    }

    const readyOperation = movingModelInstance
      ? `Moving ${movingModelInstance.name}`
      : placingPhysicsSensor
        ? `${placingPhysicsSensor.operation === 'move' ? 'Moving' : 'Placing'} ${placingPhysicsSensor.sensor.name}`
      : placementModel
        ? `Placing ${placementModel.modelName}`
        : placementCharacter
          ? `Placing ${placementCharacter.name}`
          : placementFarmBot
            ? `Placing ${placementFarmBot.name}`
            : bedPlacementActive
              ? `Placing ${bedPlacementDraft.name || 'Bed'}`
              : plantingPlacementActive
                ? `Placing ${plantingOptions.find(
                    (plant) => String(plant.id) === plantingPlacementDraft.plantId,
                  )?.commonName ?? 'Planting'}`
                : null;

    return readyOperation
      ? {
          phase: 'ready' as const,
          label: readyOperation,
          instruction: placingPhysicsSensor
            ? placingPhysicsSensor.operation === 'move'
              ? 'Click a Scene surface to move this Sensor Cuboid. Its Y rotation stays visible in the guide.'
              : 'Click a Scene surface to place the base of this vertical Sensor Cuboid. Its Y rotation stays visible in the guide.'
            : movingModelInstance || placementModel
            ? 'Choose a destination in the active 3D Scene or 2D Map.'
            : 'Click the 3D Scene ground to choose its position.',
          cancellable: true,
        }
      : null;
  }, [
    bedPlacementActive,
    bedPlacementDraft.name,
    deletingBedMarkerId,
    deletingCharacterMarkerId,
    deletingFarmBotMarkerId,
    deletingModelInstanceId,
    deletingPlantingMarkerId,
    movingModelInstance,
    placingPhysicsSensor,
    placementCharacter,
    placementFarmBot,
    placementModel,
    placingBed,
    placingCharacter,
    placingFarmBot,
    placingModel,
    placingPlanting,
    plantingOptions,
    plantingPlacementActive,
    plantingPlacementDraft.plantId,
    updatingBedMarkerId,
    updatingCharacterMarkerId,
    updatingFarmBotMarkerId,
    updatingModelInstanceId,
    updatingPlantingMarkerId,
    updatingPhysicsSensorMarkerId,
  ]);

  const cancelActiveSceneOperation = useCallback(() => {
    if (!activeSceneOperation?.cancellable) return;
    setMovingModelInstance(null);
    setPlacementModel(null);
    setPlacementScaleMultiplier('1');
    setPlacementModelRole('object');
    setPlacementCharacter(null);
    setPlacementFarmBot(null);
    setBedPlacementActive(false);
    setPlantingPlacementActive(false);
    setPlacingPhysicsSensor(null);
  }, [activeSceneOperation]);
  
  // ✅ Live Data Status Indicator
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { dataAge, isStale } = useDataFreshness(lastUpdated);
  
  // ✅ Default view ['3d','2d','combined']
  const [viewMode, setViewMode] = useState<MapViewMode>('3d');
  const {
    containerRef,
    panelHeight,
    setPanelHeight,
    beginResize: handleMouseDown,
  } = useCombinedMapPanelResize();

  useEffect(() => {
    if (!activeSceneOperation?.cancellable) return;
    const cancelWithEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      cancelActiveSceneOperation();
    };
    document.addEventListener('keydown', cancelWithEscape);
    return () => document.removeEventListener('keydown', cancelWithEscape);
  }, [activeSceneOperation, cancelActiveSceneOperation]);

  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [groupInspector, setGroupInspector] = useState<string | null>(null);
  const [sensorInspector, setSensorInspector] = useState<{ ownerId: string; sensorId: string } | null>(null);
  useEffect(() => { setSensorInspector(null); setGroupInspector(null); groundMapInspector?.setOpen(false); }, [selectedProjectId, groundMapInspector?.setOpen]);

  const [controlledCharacterId, setControlledCharacterId] = useState<number | null>(null);
  const [liveControlledCharacterPosition, setLiveControlledCharacterPosition] =
    useState<{
      characterId: number;
      position: { x: number; y: number; z: number };
    } | null>(null);
  const [cameraMode, setCameraMode] = useState<string>('stationary');
  const [focusRequest, setFocusRequest] = useState(0);
  const [actionTarget, setActionTarget] = useState<ThreeDActionTarget | null>(null);
  const [actionTargetFocusRequest, setActionTargetFocusRequest] = useState(0);
  const [orchestrationStatus, setOrchestrationStatus] =
    useState<ThreeDOrchestrationLifecycleState | null>(null);
  const [layers] = useState<MapLayerConfig>(getDefaultLayers());
  const projectMarkerSnapshotProviderRef =
    useRef<ProjectThreeDMarkerSnapshotProvider | null>(null);
  const projectThreeDViewStateProviderRef = useRef<ProjectThreeDViewStateProvider | null>(null);
  const projectMapViewStateProviderRef = useRef<ProjectMapViewStateProvider | null>(null);
  const lastProjectThreeDViewStateRef = useRef<ReturnType<ProjectThreeDViewStateProvider> | undefined>(undefined);
  const lastProjectMapViewStateRef = useRef<ReturnType<ProjectMapViewStateProvider> | undefined>(undefined);
  const [initialProjectViewState, setInitialProjectViewState] =
    useState<ThreeDProjectViewState | null>(null);
  const runtimeMarkerPositionResolverRef =
    useRef<ThreeDRuntimeMarkerPositionResolver | null>(null);

  useEffect(() => {
    if (!initialProjectViewState) return;
    lastProjectThreeDViewStateRef.current = initialProjectViewState.threeD;
    lastProjectMapViewStateRef.current = initialProjectViewState.map;
  }, [initialProjectViewState]);

  const handleRejectedProjectMarkerDelete = useCallback(async (recordId: number) => {
    try {
      const response = await fetch(
        `/api/project/threed-markers?id=${recordId}&snapshotOnly=1`,
        { method: 'DELETE' },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Saved marker removal failed (${response.status})`);
      }
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [recordId] },
      }));
      showToastRef.current('Invalid saved ThreeD marker removed; source asset preserved', 'success');
    } catch (error) {
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to remove saved ThreeD marker',
        'error',
      );
    }
  }, []);

  const handleRejectedCharacterMarkerRepair = useCallback(async (recordId: number) => {
    const raw = data.threed.raw;
    const marker = raw?.projectThreedMarkers?.find(
      (candidate) => Number(candidate.id) === recordId && candidate.markerType === 'characters',
    );
    const character = raw?.characters?.find(
      (candidate: Record<string, unknown>) => Number(candidate.id) === Number(marker?.sourceAssetId),
    ) as Record<string, unknown> | undefined;
    if (!marker || !character) {
      showToastRef.current('Character source position is unavailable', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/project/threed-markers?id=${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'characters',
          positionX: Number(character.positionX ?? 0),
          positionY: Number(character.positionY ?? 0),
          positionZ: Number(character.positionZ ?? 0),
          rotation: Number(marker.data?.rotation ?? character.rotation ?? 0),
          scaleMultiplier: Number(marker.data?.scaleMultiplier ?? 1),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character position repair failed (${response.status})`);
      }
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord] },
      }));
      showToastRef.current('Character restored to its source position', 'success');
    } catch (error) {
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to restore Character position',
        'error',
      );
    }
  }, [data.threed.raw]);

  const handleProjectMarkerSnapshotProviderChange = useCallback((
    provider: ProjectThreeDMarkerSnapshotProvider | null,
  ) => {
    projectMarkerSnapshotProviderRef.current = provider;
  }, []);

  const handleProjectThreeDViewStateProviderChange = useCallback((
    provider: ProjectThreeDViewStateProvider | null,
  ) => {
    if (!provider && projectThreeDViewStateProviderRef.current) {
      lastProjectThreeDViewStateRef.current = projectThreeDViewStateProviderRef.current();
    }
    projectThreeDViewStateProviderRef.current = provider;
  }, []);

  const handleProjectMapViewStateProviderChange = useCallback((
    provider: ProjectMapViewStateProvider | null,
  ) => {
    if (!provider && projectMapViewStateProviderRef.current) {
      lastProjectMapViewStateRef.current = projectMapViewStateProviderRef.current();
    }
    projectMapViewStateProviderRef.current = provider;
  }, []);

  const handleRuntimeMarkerPositionResolverChange = useCallback((
    resolver: ThreeDRuntimeMarkerPositionResolver | null,
  ) => {
    runtimeMarkerPositionResolverRef.current = resolver;
  }, []);

  const resolveRuntimeMarkerPosition = useCallback<ThreeDRuntimeMarkerPositionResolver>((
    moduleType,
    assetId,
  ) => runtimeMarkerPositionResolverRef.current?.(moduleType, assetId) ?? null, []);

  const openModelLibrary = useCallback(async (
    initialRole: 'object' | 'environment' = 'object',
  ) => {
    setIsProjectAssetsOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setIsSceneAddMenuOpen(false);
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsModelLibraryOpen(true);
    setPlacementModelRole(initialRole);
    setIsProjectSummaryOpen(false);
    if (loadingLibraryModels) return;

    setLoadingLibraryModels(true);
    try {
      const models: ThreeDModelLibraryItem[] = [];
      let offset = 0;
      let total = Infinity;
      while (offset < total) {
        const response = await fetch(`/api/threed/models?scope=library&limit=100&offset=${offset}`, {
          cache: 'no-store',
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success || !Array.isArray(result.data)) {
          throw new Error(result?.error || `Model Library failed (${response.status})`);
        }
        const pageTotal = result.pagination?.total;
        if (!Number.isSafeInteger(pageTotal) || pageTotal < 0) {
          throw new Error('Model Library pagination is unavailable. Please retry.');
        }
        total = pageTotal;
        if (result.data.length === 0) {
          if (offset < total) throw new Error('Model Library changed while loading. Please reopen it.');
          break;
        }
        models.push(...result.data);
        offset += result.data.length;
      }
      setLibraryModels(Array.from(new Map(models.map(model => [model.id, model])).values()));
    } catch (error) {
      console.error('Failed to load ThreeD Model Library', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD Model Library',
        'error',
      );
    } finally {
      setLoadingLibraryModels(false);
    }
  }, [loadingLibraryModels]);

  const beginModelLibraryPlacement = useCallback((model: ThreeDModelLibraryItem) => {
    if (!placementThreedId || placingModel) return;
    if (model.libraryReadiness.status !== 'ready') {
      showToastRef.current('Configure this Model before placing it in a Project.', 'error');
      setInspectedLibraryModelId(model.id);
      return;
    }
    if (inspectedLibraryModelId !== model.id) {
      setPlacementScaleMultiplier('1');
    }
    setInspectedLibraryModelId(model.id);
    setPlacementModel(model);
  }, [inspectedLibraryModelId, placementThreedId, placingModel]);

  const inspectModelLibraryItem = useCallback((modelId: number | null) => {
    if (modelId !== inspectedLibraryModelId) {
      setPlacementScaleMultiplier('1');
    }
    setInspectedLibraryModelId(modelId);
  }, [inspectedLibraryModelId]);

  const openCharacterLibrary = useCallback(async () => {
    setIsProjectAssetsOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setIsSceneAddMenuOpen(false);
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setPlacementCharacter(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsCharacterLibraryOpen(true);
    setIsProjectSummaryOpen(false);
    if (libraryCharacters.length > 0 || loadingLibraryCharacters) return;

    setLoadingLibraryCharacters(true);
    try {
      const response = await fetch('/api/threed/characters?scope=library&limit=100');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character Library failed (${response.status})`);
      }
      setLibraryCharacters(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Failed to load ThreeD Character Library', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD Character Library',
        'error',
      );
    } finally {
      setLoadingLibraryCharacters(false);
    }
  }, [libraryCharacters.length, loadingLibraryCharacters]);

  const openFarmBotLibrary = useCallback(async () => {
    setIsProjectAssetsOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setIsSceneAddMenuOpen(false);
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsFarmBotLibraryOpen(true);
    setIsProjectSummaryOpen(false);
    if (libraryFarmBots.length > 0 || loadingLibraryFarmBots) return;

    setLoadingLibraryFarmBots(true);
    try {
      const response = await fetch('/api/threed/farmbots?isActive=true&limit=100');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `FarmBot Library failed (${response.status})`);
      }
      setLibraryFarmBots(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Failed to load ThreeD FarmBot Library', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD FarmBot Library',
        'error',
      );
    } finally {
      setLoadingLibraryFarmBots(false);
    }
  }, [libraryFarmBots.length, loadingLibraryFarmBots]);

  const openPlantingPlacement = useCallback(async () => {
    setIsProjectAssetsOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setIsSceneAddMenuOpen(false);
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(true);
    setIsProjectSummaryOpen(false);
    if (plantingOptions.length > 0 || loadingPlantingOptions) return;

    setLoadingPlantingOptions(true);
    try {
      const response = await fetch('/api/threed/plants?isActive=true&status=active&limit=100');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Plant list failed (${response.status})`);
      }
      const plants = Array.isArray(result.data) ? result.data as ThreeDPlantingOption[] : [];
      setPlantingOptions(plants);
      setPlantingPlacementDraft((current) => ({
        ...current,
        plantId: current.plantId || String(plants[0]?.id ?? ''),
      }));
    } catch (error) {
      console.error('Failed to load ThreeD Plants for placement', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD Plants',
        'error',
      );
    } finally {
      setLoadingPlantingOptions(false);
    }
  }, [loadingPlantingOptions, plantingOptions.length]);

  const openBedPlacement = useCallback(() => {
    setIsProjectAssetsOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setIsSceneAddMenuOpen(false);
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsBedPlacementOpen(true);
    setIsProjectSummaryOpen(false);
  }, []);

  const handleSaveThreeDProject = useCallback(async () => {
    if (!selectedProjectId || savingProjectMarkers) return;
    const provider = projectMarkerSnapshotProviderRef.current;
    if (!provider) {
      showToastRef.current('ThreeD Project marker data is not ready to save', 'error');
      return;
    }

    const requestId = ++saveRequestRef.current;
    setSavingProjectMarkers(true);
    try {
      const markers = provider();
      const currentThreeDView = projectThreeDViewStateProviderRef.current?.()
        ?? lastProjectThreeDViewStateRef.current
        ?? initialProjectViewState?.threeD;
      const currentMapView = projectMapViewStateProviderRef.current?.()
        ?? lastProjectMapViewStateRef.current
        ?? initialProjectViewState?.map;
      if (currentThreeDView) lastProjectThreeDViewStateRef.current = currentThreeDView;
      if (currentMapView) lastProjectMapViewStateRef.current = currentMapView;
      const viewState: ThreeDProjectViewState = {
        version: PROJECT_VIEW_STATE_VERSION,
        savedAt: new Date().toISOString(),
        viewMode,
        panelHeight,
        cameraMode: cameraMode as ThreeDProjectViewState['cameraMode'],
        ...(currentThreeDView ? { threeD: currentThreeDView } : {}),
        ...(currentMapView ? { map: currentMapView } : {}),
        workspace: {
          selectedMarkerId: selectedMarker?.id ?? null,
          // Persist Assets visibility independently of transient toolbar dropdowns.
          panel: isProjectAssetsOpen ? 'assets' : 'none',
          assetSearch: projectAssetSearch,
          assetType: projectAssetType,
        },
      };
      const response = await fetch('/api/project/threed-markers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(selectedProjectId),
          markers,
          viewState,
        }),
      });
      const result = await response.json().catch(() => null);
      if (saveRequestRef.current !== requestId) return;
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Project save failed (${response.status})`);
      }

      setData(current => applyThreeDProjectClientTransaction(current, {
        markers: {upsert: result.data.markers as ProjectThreeDMarkerRecord[]},
      }));
      setLastUpdated(new Date());
      showToastRef.current(
        `ThreeD Project saved (${result.data.markerCount} markers)`,
        'success',
      );
    } catch (error) {
      if (saveRequestRef.current !== requestId) return;
      console.error('Failed to save ThreeD Project marker snapshot', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to save ThreeD Project',
        'error',
      );
    } finally {
      if (saveRequestRef.current === requestId) setSavingProjectMarkers(false);
    }
  }, [cameraMode, initialProjectViewState, panelHeight, savingProjectMarkers, selectedProjectId, viewMode, selectedMarker, isProjectAssetsOpen, projectAssetSearch, projectAssetType]);

  // Phase 5A compatibility bridge: establish the orchestration request
  // lifecycle while preserving immediate animation until proximity is gated.
  useEffect(() => {
    const handleOrchestrationRequest = (event: Event) => {
      const request = (event as CustomEvent<ThreeDCharacterOrchestrationRequest>).detail;
      if (!request || request.version !== 1) return;
      setOrchestrationStatus(createThreeDOrchestrationLifecycleState(request, Date.now()));
      window.dispatchEvent(new CustomEvent('garden-character-action', {
        detail: {
          characterId: request.characterId,
          action: request.action,
          target: request.target,
        },
      }));
    };

    window.addEventListener(
      THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
      handleOrchestrationRequest,
    );
    return () => window.removeEventListener(
      THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
      handleOrchestrationRequest,
    );
  }, []);

  useEffect(() => {
    if (!orchestrationStatus || orchestrationStatus.phase !== 'interacting') return;
    const timeout = window.setTimeout(() => {
      setOrchestrationStatus((current) => {
        if (
          !current
          || current.requestId !== orchestrationStatus.requestId
          || current.phase !== 'interacting'
        ) return current;
        return transitionThreeDOrchestrationLifecycleState(current, {
          requestId: orchestrationStatus.requestId,
          phase: 'cancelled',
          changedAt: Date.now(),
        });
      });
    }, 30000);
    return () => window.clearTimeout(timeout);
  }, [orchestrationStatus]);

  // v0.16.2-beta: Manual "zoom + center" request (button in DetailsCard).
  // Set the camera to stationary so any active character camera-follow stops
  // interfering with the requested focus of the newly selected marker.
  const handleZoomCenter = useCallback(() => {
    setCameraMode('stationary');
    setFocusRequest((n) => n + 1);
  }, []);

  const handleFocusActionTarget = useCallback(() => {
    if (!actionTarget) return;
    setCameraMode('stationary');
    setActionTargetFocusRequest((n) => n + 1);
  }, [actionTarget]);

  // v0.16.0-delta: Sync RuntimeMarker position when ecctrl character moves
  const handleControlChange = useCallback((_markerId: string, pos: { x: number; y: number; z: number }, sourceCharacterId?: number) => {
    // Project marker IDs identify instances, not reusable Character records.
    if (typeof sourceCharacterId !== 'number' || !Number.isSafeInteger(sourceCharacterId) || sourceCharacterId <= 0 || sourceCharacterId !== controlledCharacterId
      || ![pos.x, pos.y, pos.z].every(Number.isFinite)) return;
    setSelectedMarker((prev: any) => {
      if (!prev) return prev;
      const isControlledCharacterSelection = (
        prev.type === 'characters' || prev.type === 'character'
      ) && controlledCharacterId != null
        && prev.id === _markerId;
      if (!isControlledCharacterSelection) return prev;
      return { ...prev, position: { ...prev.position, x: pos.x, y: pos.y, z: pos.z } };
    });
    setLiveControlledCharacterPosition({
      characterId: sourceCharacterId,
      position: { x: pos.x, y: pos.y, z: pos.z },
    });
  }, [controlledCharacterId]);

  // ✅ Asset type visibility state
  const [visibleAssetTypes] = useState<Set<string>>(
    new Set(['plantings', 'beds', 'characters', 'farmbots', 'models'])
  );

  // ✅ Handle project selection
  const handleProjectSelect = (projectId: string) => {
    // Enter the load boundary in the same React event transaction as the
    // Project identity change. Otherwise a transient Canvas can mount with
    // the new Project ID and previous Project data, then unmount when the
    // load effect starts. R3F may still be asynchronously connecting that
    // Canvas's DOM events after its target has been removed.
    beginProjectTransition();
    // Selection, Character control, and ready-to-place operations belong to
    // the current Project. Clear them before changing identity so no
    // DetailsCard or Scene operation can carry into the incoming Project.
    setSelectedMarker(null);
    setSelectedIncident(null);
    setControlledCharacterId(null);
    setMovingModelInstance(null);
    setCameraMode('stationary');
    setSelectedProjectId(projectId);
    setIsProjectSummaryOpen(false);
    setIsDefaultView(false);
    setActionTarget(null); // Action targets are scoped to the current project.
    setOrchestrationStatus(null);
    setLiveControlledCharacterPosition(null);
    setProjectThreeDModules([]);
    setProjectGeographicOrigin(null);
    setInitialProjectViewState(null);
    setPlacementThreedId(null);
    setPlacementModel(null);
    setPlacementCharacter(null);
    setPlacementFarmBot(null);
    setPlacementScaleMultiplier('1');
    setPlacementModelRole('object');
    setIsProjectAssetsOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setProjectSetupSessionProjectId(null);
    setDismissedProjectSetupProjectId(null);
    setIsThreeDPresentationComplete(false);
    setProjectAssetSearch('');
    setProjectAssetType('all');
    setIsModelLibraryOpen(false);
    setIsCharacterLibraryOpen(false);
    setIsFarmBotLibraryOpen(false);
    setIsSceneAddMenuOpen(false);
    setBedPlacementActive(false);
    setIsBedPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set('projectId', projectId);
    window.history.pushState({}, '', url.toString());
  };

  // ✅ Handle focus on marker
  const handleFocusMarker = useCallback((marker: any) => {
    setSelectedMarker(marker);
  }, []);

  // ✅ Stabilize showToast via ref to prevent re-render loops
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Keep the client-side action target aligned with refreshed project data.
  // Keep action targeting aligned with the unfiltered Project asset authority.
  useEffect(() => {
    if (!actionTarget || loading) return;
    const targetStillExists = buildThreeDRuntimeMarkerResult(data.threed.raw).markers.some((marker) =>
      marker.id === actionTarget.markerId && isMatchingThreeDActionTarget(actionTarget, {
        markerType: marker.type,
        assetId: Number(marker.data?.id),
      }));

    if (!targetStillExists) {
      setActionTarget(null);
      setOrchestrationStatus(null);
      showToastRef.current(
        `Action target cleared: ${actionTarget.name} is no longer available`,
        'info',
      );
    }
  }, [
    actionTarget,
    data.threed.raw,
    loading,
  ]);

  // Persist supported targeted world actions only after the one-shot animation
  // reports completion. Animation-only actions still use the fallback below.
  // The write happens only AFTER GardenCharacter/EcctrlCharacter reports that
  // the requested one-shot animation actually finished.
  useEffect(() => {
    const handleActionComplete = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        characterId?: number;
        characterName?: string;
        action?: string;
        target?: ThreeDActionTarget | null;
      }>;

      const detail = customEvent.detail;
      if (!detail?.action) return;

      if (
        detail.target != null &&
        detail.target.actionRequestId
      ) {
        const completionId = detail.target.actionRequestId;
        setOrchestrationStatus((current) => {
          if (
            !current
            || current.requestId !== completionId
            || current.phase !== 'interacting'
          ) return current;
          return transitionThreeDOrchestrationLifecycleState(current, {
            requestId: completionId,
            phase: 'completed',
            changedAt: Date.now(),
          });
        });
      }

      const actor = detail.characterName || `Character #${detail.characterId ?? '?'}`;
      const actionLabel = detail.action.replace(/([a-z])([A-Z])/g, '$1 $2');
      const isHarvestAction = ['pickFruit', 'pickFruit2', 'pickFruit3'].includes(detail.action);

      // ----------------------------------------------------
      // FIRST PERSISTED WORLD ACTION: TARGETED WATERING
      // ----------------------------------------------------
      if (
        detail.action === 'watering' &&
        detail.target?.type === 'plantings' &&
        Number.isFinite(Number(detail.characterId)) &&
        Number.isFinite(Number(detail.target.id))
      ) {
        try {
          const response = await fetch('/api/threed/world-actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: detail.action,
              characterId: Number(detail.characterId),
              target: {
                type: 'planting',
                id: Number(detail.target.id),
              },
            }),
          });

          const result = await response.json().catch(() => null);

          if (!response.ok || !result?.success) {
            throw new Error(
              result?.error || `Watering persistence failed (${response.status})`,
            );
          }

          showToastRef.current(
            `${actor} watered ${detail.target.name} — watering recorded`,
            'success',
          );

          console.info('[WorldAction] Persisted targeted watering', {
            completion: detail,
            persistence: result,
          });
        } catch (error) {
          console.error('[WorldAction] Watering animation completed but persistence failed:', error);

          showToastRef.current(
            `${actor} completed watering, but the watering record could not be saved`,
            'error',
          );
        }

        return;
      }

      // ----------------------------------------------------
      // TARGETED FRUIT PICKING → PROJECT HARVEST RECORD
      // ----------------------------------------------------
      if (
        isHarvestAction &&
        selectedProjectId &&
        detail.target?.type === 'plantings' &&
        Number.isFinite(Number(detail.characterId)) &&
        Number.isFinite(Number(detail.target.id))
      ) {
        try {
          const response = await fetch('/api/threed/world-actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: detail.action,
              characterId: Number(detail.characterId),
              projectId: Number(selectedProjectId),
              completionId: detail.target.actionRequestId,
              target: {
                type: 'planting',
                id: Number(detail.target.id),
              },
            }),
          });

          const result = await response.json().catch(() => null);

          if (!response.ok || !result?.success) {
            throw new Error(
              result?.error || `Harvest persistence failed (${response.status})`,
            );
          }

          showToastRef.current(
            `${actor} picked fruit from ${detail.target.name} — harvest recorded`,
            'success',
          );

          console.info('[WorldAction] Persisted targeted harvest', {
            completion: detail,
            persistence: result,
          });
        } catch (error) {
          console.error('[WorldAction] Pick Fruit animation completed but persistence failed:', error);

          showToastRef.current(
            `${actor} completed ${actionLabel}, but the harvest record could not be saved`,
            'error',
          );
        }

        return;
      }

      // ----------------------------------------------------
      // ALL OTHER ACTIONS REMAIN ANIMATION-ONLY
      // ----------------------------------------------------
      if (detail.target) {
        showToastRef.current(
          `${actor} completed ${actionLabel} on ${detail.target.name} (${detail.target.type} #${detail.target.id})`,
          'success',
        );
        console.info('[WorldAction] Completed targeted animation-only action', detail);
      } else {
        showToastRef.current(`${actor} completed ${actionLabel}`, 'success');
        console.info('[WorldAction] Completed animation-only action', detail);
      }
    };

    window.addEventListener('garden-character-action-complete', handleActionComplete);
    return () => window.removeEventListener('garden-character-action-complete', handleActionComplete);
  }, [selectedProjectId]);

  // ✅ Load the active Project through the sequenced session boundary.
  const loadData = useCallback(async () => {
    await loadProjectSession(selectedProjectId, (outcome) => {
      try {
      if (outcome.status === 'default') {
        setInitialProjectViewState(null);
        setData(getDefaultMapData());
        setProjectInfo({ name: 'No Project Selected', hasData: false });
        setIsDefaultView(true);
        return;
      }

      if (outcome.status === 'loaded') {
        const { session } = outcome;
        setInitialProjectViewState(session.savedViewState);
        if (session.savedViewState) {
          setViewMode(session.savedViewState.viewMode);
          setPanelHeight(session.savedViewState.panelHeight);
          setCameraMode(session.savedViewState.cameraMode);
          lastProjectThreeDViewStateRef.current = session.savedViewState.threeD;
          lastProjectMapViewStateRef.current = session.savedViewState.map;
        } else {
          lastProjectThreeDViewStateRef.current = undefined;
          lastProjectMapViewStateRef.current = undefined;
        }

        setProjectThreeDModules(session.threedModules);
        setProjectGeographicOrigin(session.geographicOrigin);
        setPlacementThreedId((current) => (
          current && session.threedModules.some((module) => module.id === current)
            ? current
            : session.threedModules[0]?.id ?? null
        ));
        setData(session.data);
        setLastUpdated(new Date());
        setProjectInfo({ name: session.projectName, hasData: session.hasData });
        setIsDefaultView(false);
        return;
      }

      if (outcome.status === 'network-error') {
        console.warn('API fetch failed:', outcome.error);
      }
      setData(getDefaultMapData());
      setProjectInfo({ name: 'Error Loading Data', hasData: false });
      setIsDefaultView(true);
      showToastRef.current(
        outcome.status === 'api-error' ? outcome.error : 'Failed to load data',
        'error',
      );
      } catch (error) {
        console.error('Failed to apply map data:', error);
        setData(getDefaultMapData());
        showToastRef.current('Failed to load data', 'error');
      }
    });
  }, [loadProjectSession, selectedProjectId]);

  const handleModelPlacement = useCallback(async (
    position: ThreeDScenePlacementPosition,
    selectedModel = placementModel,
  ) => {
    const placementModel = selectedModel;
    if (![position.x, position.y, position.z, Number(modelPlacementDraft.rotationY)].every(Number.isFinite) || !modelPlacementDraft.rotationY.trim()) {
      showToastRef.current('Enter valid position and rotation values.', 'error');
      return;
    }
    const scaleMultiplier = Number(placementScaleMultiplier);
    if (
      !selectedProjectId
      || !placementModel
      || !placementThreedId
      || placingModelRef.current
    ) return;
    if (
      !Number.isFinite(scaleMultiplier)
      || scaleMultiplier < 0.0001
      || scaleMultiplier > 10_000
    ) {
      showToastRef.current(
        'Instance scale must be between 0.0001 and 10,000',
        'error',
      );
      return;
    }

    placingModelRef.current = true;
    setPlacingModel(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createProjectModelLibraryPlacementRequest({
          projectId: selectedProjectId,
          threedId: placementThreedId,
          model: placementModel,
          position,
          scaleMultiplier,
          placementRole: placementModelRole,
          rotationY: Number(modelPlacementDraft.rotationY) * Math.PI / 180,
        })),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model placement failed (${response.status})`);
      }

      const createdMarker: ProjectThreeDMarkerRecord = {
        ...result.data,
        data: {
          ...placementModel,
          ...(result.data?.data ?? {}),
          modelId: placementModel.id,
        },
      };
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [createdMarker] },
      }));

      setPlacementModel(null);
      setPlacementScaleMultiplier('1');
      setPlacementModelRole('object');
      if (projectSetupSessionProjectId === selectedProjectId) {
        setIsModelLibraryOpen(false);
        setIsScenariosOpen(false);
        setIsSetupMenuOpen(false);
        setIsProjectSetupOpen(true);
      }
      showToastRef.current(`${placementModel.modelName} placed in the ThreeD Scene`, 'success');
    } catch (error) {
      console.error('Failed to place ThreeD Model Library item', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD model',
        'error',
      );
    } finally {
      placingModelRef.current = false;
      setPlacingModel(false);
    }
  }, [
    modelPlacementDraft.rotationY,
    placementModel,
    placementScaleMultiplier,
    placementModelRole,
    placementThreedId,
    projectSetupSessionProjectId,
    selectedProjectId,
  ]);

  const handleCharacterPlacement = useCallback(async (
    position: ThreeDScenePlacementPosition,
  ) => {
    if (
      !selectedProjectId
      || !placementCharacter
      || !placementThreedId
      || placingCharacterRef.current
    ) return;

    placingCharacterRef.current = true;
    setPlacingCharacter(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createProjectCharacterLibraryPlacementRequest({
          projectId: selectedProjectId,
          threedId: placementThreedId,
          character: placementCharacter,
          position,
        })),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data?.marker) {
        throw new Error(result?.error || `Character placement failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data.marker as ProjectThreeDMarkerRecord] },
        sources: { characters: { upsert: [result.data.character] } },
      }));
      setPlacementCharacter(null);
      if (projectSetupSessionProjectId === selectedProjectId) {
        setIsCharacterLibraryOpen(false);
        setIsScenariosOpen(false);
        setIsSetupMenuOpen(false);
        setIsProjectSetupOpen(true);
      }
      showToastRef.current(
        `${placementCharacter.name} placed with ${placementCharacter.libraryAccess.runtime} runtime`,
        'success',
      );
    } catch (error) {
      console.error('Failed to place ThreeD Character Library item', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD Character',
        'error',
      );
    } finally {
      placingCharacterRef.current = false;
      setPlacingCharacter(false);
    }
  }, [
    placementCharacter,
    placementThreedId,
    projectSetupSessionProjectId,
    selectedProjectId,
  ]);

  const handleFarmBotPlacement = useCallback(async (
    position: ThreeDScenePlacementPosition,
  ) => {
    if (
      !selectedProjectId
      || !placementFarmBot
      || !placementThreedId
      || placingFarmBotRef.current
    ) return;

    placingFarmBotRef.current = true;
    setPlacingFarmBot(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createProjectFarmBotLibraryPlacementRequest({
          projectId: selectedProjectId,
          threedId: placementThreedId,
          farmBot: placementFarmBot,
          draft: farmBotPlacementDraft,
          position,
        })),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data?.farmbot || !result.data?.marker) {
        throw new Error(result?.error || `FarmBot placement failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data.marker as ProjectThreeDMarkerRecord] },
        sources: { farmbots: { upsert: [result.data.farmbot] } },
      }));
      setPlacementFarmBot(null);
      setIsFarmBotLibraryOpen(false);
      showToastRef.current(`${placementFarmBot.name} placed in the ThreeD Scene`, 'success');
    } catch (error) {
      console.error('Failed to place ThreeD FarmBot Library item', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD FarmBot',
        'error',
      );
    } finally {
      placingFarmBotRef.current = false;
      setPlacingFarmBot(false);
    }
  }, [
    farmBotPlacementDraft,
    placementFarmBot,
    placementThreedId,
    selectedProjectId,
  ]);

  const handleBedPlacement = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    if (
      !selectedProjectId
      || !placementThreedId
      || !bedPlacementActive
      || placingBedRef.current
    ) return;

    placingBedRef.current = true;
    setPlacingBed(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'beds',
          projectId: Number(selectedProjectId),
          threedId: placementThreedId,
          ...bedPlacementDraft,
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data?.bed || !result.data?.marker) {
        throw new Error(result?.error || `Bed placement failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data.marker as ProjectThreeDMarkerRecord] },
        sources: { beds: { upsert: [result.data.bed] } },
      }));

      setBedPlacementActive(false);
      setIsBedPlacementOpen(false);
      showToastRef.current(`${bedPlacementDraft.name.trim()} placed in the ThreeD Scene`, 'success');
    } catch (error) {
      console.error('Failed to place ThreeD Bed', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD Bed',
        'error',
      );
    } finally {
      placingBedRef.current = false;
      setPlacingBed(false);
    }
  }, [
    bedPlacementActive,
    bedPlacementDraft,
    placementThreedId,
    selectedProjectId,
  ]);

  const handlePlantingPlacement = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    if (
      !selectedProjectId
      || !placementThreedId
      || !plantingPlacementActive
      || !plantingPlacementDraft.plantId
      || placingPlantingRef.current
    ) return;

    placingPlantingRef.current = true;
    setPlacingPlanting(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'plantings',
          projectId: Number(selectedProjectId),
          threedId: placementThreedId,
          plantId: Number(plantingPlacementDraft.plantId),
          bedId: plantingPlacementDraft.bedId
            ? Number(plantingPlacementDraft.bedId)
            : null,
          quantity: Number(plantingPlacementDraft.quantity),
          spacingInches: plantingPlacementDraft.spacingInches
            ? Number(plantingPlacementDraft.spacingInches)
            : null,
          modelScale: Number(plantingPlacementDraft.modelScale),
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !Array.isArray(result.data?.plantings) || !Array.isArray(result.data?.markers)) {
        throw new Error(result?.error || `Planting placement failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: {
          upsert: result.data.markers as ProjectThreeDMarkerRecord[],
        },
        sources: {
          plantings: {
            upsert: result.data.plantings,
          },
        },
      }));

      const plantName = plantingOptions.find(
        (plant) => Number(plant.id) === Number(plantingPlacementDraft.plantId),
      )?.commonName ?? 'Planting';
      setPlantingPlacementActive(false);
      setIsPlantingPlacementOpen(false);
      showToastRef.current(
        `${result.data.plantings.length} ${plantName} Planting${result.data.plantings.length === 1 ? '' : 's'} added to the ThreeD Scene`,
        'success',
      );
    } catch (error) {
      console.error('Failed to place ThreeD Planting', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD Planting',
        'error',
      );
    } finally {
      placingPlantingRef.current = false;
      setPlacingPlanting(false);
    }
  }, [
    placementThreedId,
    plantingOptions,
    plantingPlacementActive,
    plantingPlacementDraft,
    selectedProjectId,
  ]);

  const handleUpdateModelInstance = useCallback(async (
    instanceId: number,
    input: {
      metadata: Record<string, unknown>;
      collisionMode: 'box' | 'triangle-surface';
      instanceName: string;
      scaleMultiplier: number;
      rotationY: number;
      positionX: number;
      positionY: number;
      positionZ: number;
      placementRole: 'object' | 'environment';
    },
  ) => {
    if (updatingModelInstanceId != null || deletingModelInstanceId != null) return;
    setUpdatingModelInstanceId(instanceId);
    try {
      const response = await fetch(
        `/api/project/threed-markers?id=${instanceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model placement update failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord] },
      }));

      setSelectedMarker((current: any) => reconcileSelectedProjectMarker(
        current,
        instanceId,
        result.data as ProjectThreeDMarkerRecord,
      ));
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'models',
          assetId: instanceId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(
        `${input.instanceName || 'Model placement'} updated`,
        'success',
      );
    } catch (error) {
      console.error('Failed to update Project ThreeD Model instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update ThreeD Model placement',
        'error',
      );
    } finally {
      setUpdatingModelInstanceId(null);
    }
  }, [deletingModelInstanceId, updatingModelInstanceId]);

  const handleMoveModelInstance = useCallback(async (
    instanceId: number,
    position: { x: number; y: number; z: number },
  ): Promise<boolean> => {
    if (updatingModelInstanceId != null || deletingModelInstanceId != null) return false;
    setUpdatingModelInstanceId(instanceId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model position update failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord] },
      }));
      setSelectedMarker((current: any) => reconcileSelectedProjectMarker(
        current,
        instanceId,
        result.data as ProjectThreeDMarkerRecord,
      ));
      showToastRef.current('Model position updated', 'success');
      return true;
    } catch (error) {
      console.error('Failed to move Project ThreeD Model instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to move ThreeD Model',
        'error',
      );
      return false;
    } finally {
      setUpdatingModelInstanceId(null);
    }
  }, [deletingModelInstanceId, updatingModelInstanceId]);

  const handleMoveModelToggle = useCallback((instanceId: number, name: string) => {
    setMovingModelInstance((current) => (
      current?.id === instanceId ? null : { id: instanceId, name }
    ));
    setPlacementModel(null);
    setPlacementCharacter(null);
    setPlacementFarmBot(null);
    setBedPlacementActive(false);
    setPlantingPlacementActive(false);
  }, []);

  const handleUpdateCharacterPosition = useCallback(async (
    markerId: number,
    position: { positionX: number; positionY: number; positionZ: number; characterPhysics?: import("@/libraries/services/threed/characters/character-physics").CharacterPhysics },
  ) => {
    if (updatingCharacterMarkerId != null || controlledCharacterId != null) return false;
    const sourceId = data.threed.raw?.projectThreedMarkers?.find((marker) => marker.id === markerId)?.sourceAssetId;
    const rotation = sourceId == null ? null
      : projectRuntimeMarkerRegistryRef.current?.resolve('characters', sourceId)?.liveRotation;
    setUpdatingCharacterMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'characters', ...position, ...(rotation != null ? { rotation } : {}) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character position update failed (${response.status})`);
      }
      // A successful explicit edit supersedes any pre-edit WASD position.
      // Project Save reads this same registry, so it must see the saved values.
      const savedMarker = result.data as ProjectThreeDMarkerRecord;
      projectRuntimeMarkerRegistryRef.current?.updateLivePosition('characters', savedMarker.sourceAssetId, {
        x: Number(savedMarker.positionX),
        y: Number(savedMarker.positionY),
        z: Number(savedMarker.positionZ),
      });
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord] },
      }));
      setSelectedMarker((current: any) => reconcileSelectedProjectMarker(
        current,
        markerId,
        result.data as ProjectThreeDMarkerRecord,
      ));
      showToastRef.current('Character position updated', 'success');
      return true;
    } catch (error) {
      console.error('Failed to update Project Character position', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Character position',
        'error',
      );
      return false;
    } finally {
      setUpdatingCharacterMarkerId(null);
    }
  }, [controlledCharacterId, updatingCharacterMarkerId, data.threed.raw?.projectThreedMarkers]);

  const handleDeleteCharacterInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (
      deletingCharacterMarkerId != null
      || updatingCharacterMarkerId != null
      || controlledCharacterId != null
    ) return;
    setDeletingCharacterMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character deletion failed (${response.status})`);
      }
      const sourceAssetId = Number(result.data?.sourceAssetId);
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [markerId] },
        sources: Number.isSafeInteger(sourceAssetId) && sourceAssetId > 0
          ? { characters: { removeIds: [sourceAssetId] } }
          : undefined,
      }));
      setSelectedMarker((current: any) => clearSelectedProjectMarker(current, markerId));
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'characters',
          assetId: sourceAssetId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project Character instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete Project Character',
        'error',
      );
    } finally {
      setDeletingCharacterMarkerId(null);
    }
  }, [controlledCharacterId, deletingCharacterMarkerId, updatingCharacterMarkerId]);

  const handleUpdateBedInstance = useCallback(async (
    markerId: number,
    input: {
      widthFeet: number;
      lengthFeet: number;
      heightFeet: number;
      scale: number;
      color: string;
      positionX: number;
      positionY: number;
      positionZ: number;
      rotation: number;
    },
  ) => {
    if (updatingBedMarkerId != null || deletingBedMarkerId != null) return false;
    setUpdatingBedMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'beds', ...input }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Bed instance update failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord, ...(result.affectedMarkers ?? [])] },
      }));
      setSelectedMarker((current: any) => reconcileSelectedProjectMarker(
        current,
        markerId,
        result.data as ProjectThreeDMarkerRecord,
      ));
      showToastRef.current('Project Bed instance updated', 'success');
      return true;
    } catch (error) {
      console.error('Failed to update Project Bed instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Project Bed instance',
        'error',
      );
      return false;
    } finally {
      setUpdatingBedMarkerId(null);
    }
  }, [deletingBedMarkerId, updatingBedMarkerId]);

  const handleUpdatePhysicsSensors = useCallback(async (
    markerId: number,
    sensors: readonly PhysicsSensorCuboid[],
  ) => {
    if (updatingPhysicsSensorMarkerId !== null) return false;
    const validation = validatePhysicsSensorCuboids(sensors);
    if (!validation.success) {
      showToastRef.current(validation.error, 'error');
      return false;
    }
    setPhysicsSensorPlacementResult(null);
    setUpdatingPhysicsSensorMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'update-physics-sensors',
          physicsSensorCuboids: validation.sensors,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Physics Sensor update failed (${response.status})`);
      }
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord] },
      }));
      setSelectedMarker((current: any) => reconcileSelectedProjectMarker(
        current,
        markerId,
        result.data as ProjectThreeDMarkerRecord,
      ));
      setPlacingPhysicsSensor(null);
      showToastRef.current('Physics Sensor Cuboids updated', 'success');
      return true;
    } catch (error) {
      console.error('Failed to update Physics Sensor Cuboids', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Physics Sensor Cuboids',
        'error',
      );
      return false;
    } finally {
      setUpdatingPhysicsSensorMarkerId(null);
    }
  }, [updatingPhysicsSensorMarkerId]);

  const handleZoomToPhysicsSensor = useCallback((owner: RuntimeMarker, sensor: PhysicsSensorCuboid) => {
    const ownerAssetId = Number(owner.data?.id);
    const currentOwnerPosition = Number.isSafeInteger(ownerAssetId) && ownerAssetId > 0
      ? resolveRuntimeMarkerPosition(owner.type, ownerAssetId) ?? owner.position
      : owner.position;
    setSensorFocusPosition(sceneLocalToWorld(sensor.position, sceneOwnerPose(owner, currentOwnerPosition)));
    setSensorFocusRequest((request) => request + 1);
  }, [resolveRuntimeMarkerPosition]);

  const handlePhysicsSensorPlacement = useCallback((world: { x: number; y: number; z: number }) => {
    if (!placingPhysicsSensor) return;
    const owner = placingPhysicsSensor.marker;
    const ownerAssetId = Number(owner.data?.id);
    const currentOwnerPosition = Number.isSafeInteger(ownerAssetId) && ownerAssetId > 0
      ? resolveRuntimeMarkerPosition(owner.type, ownerAssetId) ?? owner.position
      : owner.position;
    const local = sceneWorldToLocal(world, sceneOwnerPose(owner, currentOwnerPosition));
    setPhysicsSensorPlacementResult((current) => ({
      requestId: (current?.requestId ?? 0) + 1,
      markerId: placingPhysicsSensor.markerId,
      sensorId: placingPhysicsSensor.sensor.id,
      position: {
        x: Number(local.x.toFixed(3)),
        y: Number((local.y + placingPhysicsSensor.sensor.height / 2).toFixed(3)),
        z: Number(local.z.toFixed(3)),
      },
    }));
    setPlacingPhysicsSensor(null);
  }, [placingPhysicsSensor, resolveRuntimeMarkerPosition]);

  const handleDeleteBedInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (deletingBedMarkerId != null || updatingBedMarkerId != null) return;
    setDeletingBedMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Bed deletion failed (${response.status})`);
      }
      const deletedBedId = Number(result.data?.sourceAssetId);
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [markerId] },
        sources: Number.isSafeInteger(deletedBedId) && deletedBedId > 0
          ? { beds: { removeIds: [deletedBedId] } }
          : undefined,
      }));
      setSelectedMarker((current: any) => clearSelectedProjectMarker(current, markerId));
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'beds',
          assetId: Number(result.data?.sourceAssetId),
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project Bed instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete Project Bed instance',
        'error',
      );
    } finally {
      setDeletingBedMarkerId(null);
    }
  }, [deletingBedMarkerId, updatingBedMarkerId]);

  const handleUpdateFarmBotInstance = useCallback(async (
    markerId: number,
    input: {
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
    },
  ) => {
    if (updatingFarmBotMarkerId != null || deletingFarmBotMarkerId != null) return false;
    setUpdatingFarmBotMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'farmbots', ...input }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `FarmBot instance update failed (${response.status})`);
      }
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord] },
      }));
      setSelectedMarker((current: any) => reconcileSelectedProjectMarker(
        current,
        markerId,
        result.data as ProjectThreeDMarkerRecord,
      ));
      showToastRef.current('Project FarmBot instance updated', 'success');
      return true;
    } catch (error) {
      console.error('Failed to update Project FarmBot instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Project FarmBot instance',
        'error',
      );
      return false;
    } finally {
      setUpdatingFarmBotMarkerId(null);
    }
  }, [deletingFarmBotMarkerId, updatingFarmBotMarkerId]);

  const handleDeleteFarmBotInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (deletingFarmBotMarkerId != null || updatingFarmBotMarkerId != null) return;
    setDeletingFarmBotMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `FarmBot removal failed (${response.status})`);
      }
      const sourceAssetId = Number(result.data?.sourceAssetId);
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [markerId] },
        sources: Number.isSafeInteger(sourceAssetId) && sourceAssetId > 0
          ? { farmbots: { removeIds: [sourceAssetId] } }
          : undefined,
      }));
      setSelectedMarker((current: any) => clearSelectedProjectMarker(current, markerId));
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'farmbots',
          assetId: sourceAssetId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to remove Project FarmBot instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to remove Project FarmBot instance',
        'error',
      );
    } finally {
      setDeletingFarmBotMarkerId(null);
    }
  }, [deletingFarmBotMarkerId, updatingFarmBotMarkerId]);

  const handleUpdatePlantingInstance = useCallback(async (
    markerId: number,
    input: {
      bedId?: number | null;
      modelScale: number;
      positionX: number;
      positionY: number;
      positionZ: number;
    },
  ) => {
    if (updatingPlantingMarkerId != null || deletingPlantingMarkerId != null) return false;
    setUpdatingPlantingMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'plantings', ...input }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Planting instance update failed (${response.status})`);
      }
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: {
          upsert: [result.data as ProjectThreeDMarkerRecord],
        },
      }));
      setSelectedMarker((current: any) => reconcileSelectedProjectMarker(
        current,
        markerId,
        result.data as ProjectThreeDMarkerRecord,
      ));
      showToastRef.current('Project Planting instance updated', 'success');
      return true;
    } catch (error) {
      console.error('Failed to update Project Planting instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Project Planting instance',
        'error',
      );
      return false;
    } finally {
      setUpdatingPlantingMarkerId(null);
    }
  }, [deletingPlantingMarkerId, updatingPlantingMarkerId]);

  const handleMovePlantingToggle = useCallback((markerId:number, input:{bedId:number|null;modelScale:number}) => {
    const marker = data.threed.raw?.projectThreedMarkers?.find(record=>record.id===markerId && record.markerType==='plantings');
    if (!marker) return;
    setMovingModelInstance(current=>current?.id===markerId && current.planting ? null : {id:markerId,name:marker.name || 'Planting',planting:input});
    setViewMode('3d');
    setPlacementModel(null); setPlacementCharacter(null); setPlacementFarmBot(null);
    setBedPlacementActive(false); setPlantingPlacementActive(false);
  }, [data.threed.raw]);

  const handleMoveModuleToggle = useCallback((markerId:number) => {
    const marker = data.threed.raw?.projectThreedMarkers?.find(record=>record.id===markerId);
    if (!marker || !['beds','farmbots','characters'].includes(marker.markerType)) return;
    if (marker.markerType === 'characters' && controlledCharacterId != null) return;
    setMovingModelInstance(current=>current?.id===markerId && current.module ? null : {id:markerId,name:marker.name,module:marker.markerType as 'beds'|'farmbots'|'characters'});
    setViewMode('3d'); setPlacementModel(null); setPlacementCharacter(null); setPlacementFarmBot(null);
    setBedPlacementActive(false); setPlantingPlacementActive(false);
  }, [data.threed.raw,controlledCharacterId]);

  const handleThreeDModelReposition = useCallback(async (position:{x:number;y:number;z:number}) => {
    if (!movingModelInstance) return;
    const point = {positionX:position.x,positionY:position.y,positionZ:position.z};
    let moved = false;
    if (movingModelInstance.module) {
      const marker = buildThreeDRuntimeMarkerResult(data.threed.raw).markers.find(marker=>Number(marker.data?.projectMarkerId)===movingModelInstance.id);
      if (!marker) return;
      if (movingModelInstance.module === 'characters') {
        moved = await handleUpdateCharacterPosition(movingModelInstance.id,point);
      } else {
        const d = marker.data ?? {};
        const farmbot = movingModelInstance.module === 'farmbots';
        const input = {...point,widthFeet:Number(d.widthFeet ?? d.width ?? (farmbot?3:4)),lengthFeet:Number(d.lengthFeet ?? d.length ?? d.depth ?? (farmbot?6:8)),heightFeet:Number(d.heightFeet ?? (farmbot?3:1)),scale:Number(d.scale ?? 1),color:String(d.color ?? marker.color ?? (farmbot?'#4B5563':'#8B5E3C')),rotation:Number(d.rotation ?? 0)};
        moved = farmbot ? await handleUpdateFarmBotInstance(movingModelInstance.id,input) : await handleUpdateBedInstance(movingModelInstance.id,input);
      }
    } else {
      moved = movingModelInstance.planting
        ? await handleUpdatePlantingInstance(movingModelInstance.id,{...movingModelInstance.planting,...point})
        : await handleMoveModelInstance(movingModelInstance.id,position);
    }
    if (moved) setMovingModelInstance(null);
  }, [movingModelInstance,data.threed.raw,handleUpdatePlantingInstance,handleMoveModelInstance,handleUpdateCharacterPosition,handleUpdateBedInstance,handleUpdateFarmBotInstance]);

  const handleDeletePlantingInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (deletingPlantingMarkerId != null || updatingPlantingMarkerId != null) return;
    setDeletingPlantingMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Planting deletion failed (${response.status})`);
      }
      const deletedPlantingId = Number(result.data?.id);
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [markerId] },
        sources: Number.isSafeInteger(deletedPlantingId) && deletedPlantingId > 0
          ? { plantings: { removeIds: [deletedPlantingId] } }
          : undefined,
      }));
      setSelectedMarker((current: any) => clearSelectedProjectMarker(current, markerId));
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'plantings',
          assetId: deletedPlantingId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project ThreeD Planting instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : 'Unknown deletion error',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete ThreeD Planting',
        'error',
      );
    } finally {
      setDeletingPlantingMarkerId(null);
    }
  }, [deletingPlantingMarkerId, updatingPlantingMarkerId]);

  const handleDeleteModelInstance = useCallback(async (
    instanceId: number,
    name: string,
  ) => {
    if (deletingModelInstanceId != null) return;
    setDeletingModelInstanceId(instanceId);
    try {
      const response = await fetch(
        `/api/project/threed-markers?id=${instanceId}`,
        { method: 'DELETE' },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model deletion failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [instanceId] },
      }));

      setSelectedMarker((current: any) => clearSelectedProjectMarker(current, instanceId));
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'models',
          assetId: instanceId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project ThreeD Model instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete ThreeD Model placement',
        'error',
      );
    } finally {
      setDeletingModelInstanceId(null);
    }
  }, [deletingModelInstanceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const projectRuntimeMarkers = useMemo(
    () => buildThreeDRuntimeMarkerResult(data.threed.raw).markers,
    [data.threed.raw],
  );
  const restoredWorkspaceRef = useRef<ThreeDProjectViewState | null>(null);
  useEffect(() => {
    if ((viewMode !== '2d' && !isThreeDPresentationComplete) || !initialProjectViewState || restoredWorkspaceRef.current === initialProjectViewState) return;
    restoredWorkspaceRef.current = initialProjectViewState;
    const workspace = initialProjectViewState.workspace;
    setSelectedMarker(workspace?.selectedMarkerId
      ? projectRuntimeMarkers.find(marker => marker.id === workspace.selectedMarkerId) ?? null
      : null);
    setIsProjectSummaryOpen(workspace?.panel === 'summary');
    setIsProjectAssetsOpen(workspace?.panel === 'assets');
    setProjectAssetSearch(workspace?.assetSearch ?? '');
    setProjectAssetType(workspace?.assetType && projectRuntimeMarkers.some(marker => marker.type === workspace.assetType)
      ? workspace.assetType : 'all');
  }, [initialProjectViewState, isThreeDPresentationComplete, projectRuntimeMarkers, viewMode]);
  useEffect(() => {
    if (!selectedProjectId || !isThreeDPresentationComplete) {
      setIsProjectSetupOpen(false);
      setIsScenariosOpen(false);
      setIsSetupMenuOpen(false);
      return;
    }
    if (dismissedProjectSetupProjectId === selectedProjectId) return;
    if (projectRuntimeMarkers.length === 0) {
      setProjectSetupSessionProjectId(selectedProjectId);
      setIsScenariosOpen(false);
      setIsSetupMenuOpen(false);
      setIsProjectSetupOpen(true);
      return;
    }
    if (projectSetupSessionProjectId === selectedProjectId) {
      setIsScenariosOpen(false);
      setIsSetupMenuOpen(false);
      setIsProjectSetupOpen(true);
    }
  }, [
    isThreeDPresentationComplete,
    dismissedProjectSetupProjectId,
    projectRuntimeMarkers.length,
    projectSetupSessionProjectId,
    selectedProjectId,
  ]);
  const handleThreeDPresentationComplete = useCallback(() => {
    setIsThreeDPresentationComplete(true);
  }, []);
  const projectEnvironmentMarkers = useMemo(
    () => projectRuntimeMarkers.filter(
      (marker) => marker.type === 'models'
        && marker.metadata?.placementRole === 'environment',
    ),
    [projectRuntimeMarkers],
  );
  const {
    assetTypes: projectAssetTypes,
    assetTypeCounts: projectAssetTypeCounts,
    visibleAssets: visibleProjectAssets,
  } = useProjectAssetCollection(projectRuntimeMarkers, projectAssetSearch, projectAssetType);
  const {
    collections: libraryCollections,
    inspectedModel: inspectedLibraryModel,
    visibleModels: visibleLibraryModels,
  } = useThreeDModelLibraryCollection(
    libraryModels,
    libraryCategorySlug,
    inspectedLibraryModelId,
    libraryModelSearch,
  );
  const { placedCharacterIds, placedFarmBotIds } = useThreeDPlacedLibraryAssets(data.threed.raw);
  const openEnvironmentDetails = useCallback((marker = projectEnvironmentMarkers[0]) => {
    if (!marker) return;
    setSensorInspector(null);
    setGroupInspector(null);
    setSelectedIncident(null);
    setSelectedMarker(marker);
    groundMapInspector?.setOpen(false);
    setIsProjectSummaryOpen(false);
    setIsSceneAddMenuOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setIsProjectAssetsOpen(true);
  }, [projectEnvironmentMarkers, groundMapInspector?.setOpen]);

  const openProjectAssets = useCallback(() => {
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsProjectSummaryOpen(false);
    setIsProjectAssetsOpen(true);
  }, []);

  const openProjectSetup = useCallback(() => {
    setEnvironmentControlsCloseRequest((request) => request + 1);
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsSceneAddMenuOpen(false);
    setIsProjectSummaryOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setIsProjectSetupOpen(true);
  }, []);

  const handleEnvironmentControlsOpenChange = useCallback((open: boolean) => {
    if (!open) return;
    setIsProjectSummaryOpen(false);
    setIsSceneAddMenuOpen(false);
    setIsProjectSetupOpen(false);
    setIsScenariosOpen(false);
    setIsSetupMenuOpen(false);
    setProjectSetupSessionProjectId(null);
    setDismissedProjectSetupProjectId(selectedProjectId);
  }, [selectedProjectId]);

  const closeProjectAssets = useCallback((restoreTriggerFocus = false) => {
    setIsProjectAssetsOpen(false);
    if (restoreTriggerFocus) {
      window.requestAnimationFrame(() => projectAssetsTriggerRef.current?.focus());
    }
  }, []);
  const dismissProjectAssets = useCallback(() => closeProjectAssets(true), [closeProjectAssets]);

  const selectProjectAsset = useCallback((marker: RuntimeMarker) => {
    groundMapInspector?.setOpen(false);
    setSensorInspector(null);
    setGroupInspector(null);
    const sourceAssetId = Number(marker.data?.id);
    const currentPosition = Number.isSafeInteger(sourceAssetId) && sourceAssetId > 0
      ? resolveRuntimeMarkerPosition(marker.type, sourceAssetId)
      : null;
    setSelectedIncident(null);
    setSelectedMarker(currentPosition ? { ...marker, position: currentPosition } : marker);
  }, [resolveRuntimeMarkerPosition, groundMapInspector?.setOpen]);

  // Keep Project data loading visually continuous with the ThreeD Scene
  // presentation that follows it.
  if (loading) {
    return (
      <ThreeDProjectLoadingPresentation
        progress={20}
        label="Loading Project data…"
        className="h-[calc(100dvh-83px)]"
        showProjectHeader
      />
    );
  }

  const hasRealData = data ? (data.traffic.total > 0 || data.threed.total > 0) : false;
  const isLeftSceneWorkspaceOpen = isProjectAssetsOpen
    || isModelLibraryOpen
    || isCharacterLibraryOpen
    || isFarmBotLibraryOpen
    || isBedPlacementOpen
    || isPlantingPlacementOpen;

  return (
    <div className="relative">
      {ToastComponent}

      {/* Project Selector Dialog */}
      <ProjectSelectorDialog
        open={isProjectSelectorOpen}
        onOpenChange={setIsProjectSelectorOpen}
        onSelect={handleProjectSelect}
        onCreateNew={() => setIsProjectTemplateDialogOpen(true)}
      />
      <ProjectTemplateDialog
        open={isProjectTemplateDialogOpen}
        onOpenChange={setIsProjectTemplateDialogOpen}
        onCreated={(projectId) => {
          handleProjectSelect(projectId);
          setDismissedProjectSetupProjectId(null);
          setProjectSetupSessionProjectId(projectId);
        }}
      />

      {/* ✅ Header with Live Data Status Indicator */}
      <div className="relative">
      {viewMode !== '2d' && !isThreeDPresentationComplete && <div className="absolute inset-0 z-50"><ProjectToolbarLoadingSkeleton /></div>}
      <div inert={viewMode !== '2d' && !isThreeDPresentationComplete}
        style={viewMode !== '2d' && !isThreeDPresentationComplete ? { visibility: 'hidden', height: 37, overflow: 'hidden' } : undefined}
        className="threed-project-toolbar m-0 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-0.5 py-1">
        
        <ProjectHeaderMenu
          selectedProjectId={selectedProjectId}
          projectName={projectInfo?.name}
          isOpen={isProjectSummaryOpen}
          trafficItemCount={data.traffic.total || 0}
          threeDItemCount={data.threed.total || 0}
          hasRealData={hasRealData}
          isStale={isStale}
          dataAge={dataAge}
          lastUpdated={lastUpdated}
          savingProject={savingProjectMarkers}
          projectAssetCount={projectRuntimeMarkers.length}
          projectAssetsOpen={isProjectAssetsOpen}
          environments={projectEnvironmentMarkers.map((marker) => ({
            id: marker.id,
            name: marker.name,
          }))}
          onTrigger={() => {
            setIsSetupMenuOpen(false);
            setIsScenariosOpen(false);
            setIsProjectSetupOpen(false);
            setEnvironmentControlsCloseRequest((request) => request + 1);
            setIsSceneAddMenuOpen(false);
            if (selectedProjectId) {
              setIsProjectSummaryOpen((open) => !open);
            } else {
              setIsProjectSelectorOpen(true);
            }
          }}
          onDismiss={dismissProjectSummary}
          onChooseProject={() => {
            setIsProjectSummaryOpen(false);
            setIsProjectSelectorOpen(true);
          }}
          onCreateProject={() => {
            setIsProjectSummaryOpen(false);
            setIsProjectTemplateDialogOpen(true);
          }}
          onSaveProject={handleSaveThreeDProject}
          onOpenProjectAssets={openProjectAssets}
          onOpenEnvironment={(markerId) => {
            const marker = projectEnvironmentMarkers.find((item) => item.id === markerId);
            if (marker) openEnvironmentDetails(marker);
          }}
          onOpenProjectTour={openProjectSetup}
          onOpenProjectSettings={() => window.open(
            `/admin/projects/${selectedProjectId}`,
            '_blank',
            'noopener,noreferrer',
          )}
        />
        
        <ProjectSceneToolbar
          selectedProjectId={selectedProjectId}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            groundMapInspector?.setOpen(false);
            transform.cancel();
            if (mode === '2d') setIsSceneAddMenuOpen(false);
            setViewMode(mode);
          }}
          presentationComplete={isThreeDPresentationComplete}

          sceneAddMenuOpen={isSceneAddMenuOpen}
          hasThreeDModule={projectThreeDModules.length > 0}
          onToggleSceneAddMenu={() => {
            setIsProjectSummaryOpen(false);
            const nextOpen = !isSceneAddMenuOpen;
            if (nextOpen) {
              setEnvironmentControlsCloseRequest((request) => request + 1);
              setIsProjectSetupOpen(false);
              setIsScenariosOpen(false);
              setIsSetupMenuOpen(false);
              setProjectSetupSessionProjectId(null);
              setDismissedProjectSetupProjectId(selectedProjectId);
            }
            setIsSceneAddMenuOpen(nextOpen);
          }}
          onOpenModelLibrary={() => void openModelLibrary()}
          onOpenCharacterLibrary={() => void openCharacterLibrary()}
          onOpenFarmBotLibrary={() => void openFarmBotLibrary()}
          onOpenBedPlacement={openBedPlacement}
          onOpenPlantingPlacement={() => void openPlantingPlacement()}
          activeOperation={activeSceneOperation}
          onCancelOperation={cancelActiveSceneOperation}
          projectAssetsTriggerRef={projectAssetsTriggerRef}
          projectAssetsOpen={isProjectAssetsOpen}
          projectAssetCount={projectRuntimeMarkers.length}
          onToggleProjectAssets={() => {
            if (isProjectAssetsOpen) closeProjectAssets(false);
            else openProjectAssets();
          }}
          setupMenuOpen={isSetupMenuOpen}
          scenariosOpen={isScenariosOpen}
          onSetupMenuOpenChange={(open) => {
            if (open) {
              setEnvironmentControlsCloseRequest(request => request + 1);
              setIsSceneAddMenuOpen(false);
              setIsProjectSummaryOpen(false);
              setIsProjectSetupOpen(false);
              setIsScenariosOpen(false);
              setProjectSetupSessionProjectId(null);
              setDismissedProjectSetupProjectId(selectedProjectId);
            }
            setIsSetupMenuOpen(open);
          }}
          onOpenScenarios={() => {
            setIsSetupMenuOpen(false);
            setIsProjectSetupOpen(false);
            setIsScenariosOpen(true);
            setProjectSetupSessionProjectId(null);
            setDismissedProjectSetupProjectId(selectedProjectId);
          }}
          projectTourOpen={isProjectSetupOpen}
          onOpenProjectTour={() => {
            if (isProjectSetupOpen) {
              setIsProjectSetupOpen(false);
              setIsScenariosOpen(false);
              setIsSetupMenuOpen(false);
              setProjectSetupSessionProjectId(null);
              setDismissedProjectSetupProjectId(selectedProjectId);
              return;
            }
            setDismissedProjectSetupProjectId(null);
            setProjectSetupSessionProjectId(selectedProjectId);
            openProjectSetup();
          }}
          savingProject={savingProjectMarkers}
          onSaveProject={handleSaveThreeDProject}
        />

      </div>

      </div>

      {/* Project Assets is independent of toolbar menu visibility. */}
      <div>
      <ProjectAssetsPanel
        selectedProjectId={selectedProjectId}
        isOpen={isProjectAssetsOpen}
        search={projectAssetSearch}
        setSearch={setProjectAssetSearch}
        typeFilter={projectAssetType}
        setTypeFilter={setProjectAssetType}
        projectRuntimeMarkers={projectRuntimeMarkers}
        projectAssetTypes={projectAssetTypes}
        projectAssetTypeCounts={projectAssetTypeCounts}
        visibleProjectAssets={visibleProjectAssets}
        selectedMarker={selectedMarker}
        resolveRuntimeMarkerPosition={resolveRuntimeMarkerPosition}
        onDismiss={dismissProjectAssets}
        groundMapSelected={groundMapInspector?.open ?? false}
        onOpenGroundMap={viewMode !== '2d' ? () => groundMapInspector?.setOpen(true) : undefined}
        selectedGroupId={groupInspector}
        onSelectGroup={groupId => {
          if (transform.session) return;
          groundMapInspector?.setOpen(false);
          setGroupInspector(groupId);
          setSensorInspector(null);
        }}
        onSelectAsset={selectProjectAsset}
        selectedSensorId={sensorInspector?.ownerId === selectedMarker?.id ? sensorInspector?.sensorId : null}
        onSelectSensor={(marker, sensorId) => {
          if (transform.session) return;
          selectProjectAsset(marker);
          setSensorInspector({ ownerId: marker.id, sensorId });
        }}
      />
      </div>
      <ProjectScenariosPanel
        isOpen={Boolean(selectedProjectId) && isThreeDPresentationComplete && isScenariosOpen}
        projectId={String(selectedProjectId ?? '')}
        markers={projectRuntimeMarkers}
        onClose={() => setIsScenariosOpen(false)}
      />
      <div id="project-setup-panel">
        <ProjectSetupPanel
          isOpen={Boolean(selectedProjectId) && isThreeDPresentationComplete && isProjectSetupOpen}
          hasThreeDModule={projectThreeDModules.length > 0}
          hasEnvironment={projectEnvironmentMarkers.length > 0}
          hasCharacter={projectRuntimeMarkers.some((marker) => marker.type === 'characters')}
          hasSceneModel={projectRuntimeMarkers.some(
            (marker) => marker.type === 'models'
              && marker.metadata?.placementRole !== 'environment',
          )}
          onClose={() => {
            setIsProjectSetupOpen(false);
            setIsScenariosOpen(false);
            setIsSetupMenuOpen(false);
            setProjectSetupSessionProjectId(null);
            setDismissedProjectSetupProjectId(selectedProjectId);
          }}
          onAddEnvironment={() => {
            setIsProjectSetupOpen(false);
            setIsScenariosOpen(false);
            setIsSetupMenuOpen(false);
            void openModelLibrary('environment');
          }}
          onAddCharacter={() => {
            setIsProjectSetupOpen(false);
            setIsScenariosOpen(false);
            setIsSetupMenuOpen(false);
            void openCharacterLibrary();
          }}
          onOpenModelLibrary={() => {
            setIsProjectSetupOpen(false);
            setIsScenariosOpen(false);
            setIsSetupMenuOpen(false);
            void openModelLibrary('object');
          }}
          onOpenProjectSettings={() => {
            setIsProjectSetupOpen(false);
            setIsScenariosOpen(false);
            setIsSetupMenuOpen(false);
            window.open(
              `/admin/projects/${selectedProjectId}`,
              '_blank',
              'noopener,noreferrer',
            );
          }}
        />
      </div>
      <div hidden={isProjectSummaryOpen} inert={isProjectSummaryOpen}>
      <ThreeDModelLibraryPanel
        isOpen={Boolean(selectedProjectId) && isModelLibraryOpen}
        viewMode={viewMode}
        projectModules={projectThreeDModules}
        selectedModuleId={placementThreedId}
        onSelectedModuleChange={setPlacementThreedId}
        collections={libraryCollections}
        selectedCategorySlug={libraryCategorySlug}
        onSelectedCategoryChange={(slug) => {
          setLibraryCategorySlug(slug);
          setInspectedLibraryModelId(null);
        }}
        search={libraryModelSearch}
        onSearchChange={(value) => {
          setLibraryModelSearch(value);
          setInspectedLibraryModelId(null);
        }}
        allModelCount={libraryModels.length}
        visibleModels={visibleLibraryModels}
        inspectedModel={inspectedLibraryModel}
        inspectedModelId={inspectedLibraryModelId}
        onInspectModel={inspectModelLibraryItem}
        placementModel={placementModel}
        placementDraft={modelPlacementDraft}
        onPlacementDraftChange={(field, value) => setModelPlacementDraft(current => ({ ...current, [field]: value }))}
        onPlaceAtCoordinates={(model) => {
          if (![modelPlacementDraft.x, modelPlacementDraft.y, modelPlacementDraft.z].every(value => value.trim() && Number.isFinite(Number(value)))) return;
          void handleModelPlacement({ x: Number(modelPlacementDraft.x), y: Number(modelPlacementDraft.y), z: Number(modelPlacementDraft.z) }, model);
        }}
        placementScaleMultiplier={placementScaleMultiplier}
        onPlacementScaleMultiplierChange={setPlacementScaleMultiplier}
        placementRole={placementModelRole}
        onPlacementRoleChange={setPlacementModelRole}
        loading={loadingLibraryModels}
        placing={placingModel}
        onBeginPlacement={beginModelLibraryPlacement}
        onCancelPlacement={() => {
          setPlacementModel(null);
          setPlacementScaleMultiplier('1');
          setPlacementModelRole('object');
        }}
        onClose={() => {
          setPlacementModel(null);
          setPlacementScaleMultiplier('1');
          setInspectedLibraryModelId(null);
          setIsModelLibraryOpen(false);
        }}
      />
      </div>

      <div hidden={isProjectSummaryOpen} inert={isProjectSummaryOpen}>
      <ThreeDCharacterLibraryPanel
        isOpen={Boolean(selectedProjectId) && isCharacterLibraryOpen}
        projectModules={projectThreeDModules}
        selectedModuleId={placementThreedId}
        onSelectedModuleChange={setPlacementThreedId}
        characters={libraryCharacters}
        placedCharacterIds={placedCharacterIds}
        loading={loadingLibraryCharacters}
        placing={placingCharacter}
        placementCharacter={placementCharacter}
        onSelectCharacter={(character) => {
          setPlacementCharacter(character);
          setViewMode('3d');
        }}
        onCancelPlacement={() => setPlacementCharacter(null)}
        onClose={() => {
          setPlacementCharacter(null);
          setIsCharacterLibraryOpen(false);
        }}
      />
      </div>

      <div hidden={isProjectSummaryOpen} inert={isProjectSummaryOpen}>
      <ThreeDFarmBotLibraryPanel
        isOpen={Boolean(selectedProjectId) && isFarmBotLibraryOpen}
        projectModules={projectThreeDModules}
        selectedModuleId={placementThreedId}
        onSelectedModuleChange={setPlacementThreedId}
        farmBots={libraryFarmBots}
        placedFarmBotIds={placedFarmBotIds}
        loading={loadingLibraryFarmBots}
        placing={placingFarmBot}
        placementFarmBot={placementFarmBot}
        placementDraft={farmBotPlacementDraft}
        onPlacementDraftChange={(field, value) => {
          setFarmBotPlacementDraft((current) => ({ ...current, [field]: value }));
        }}
        onSelectFarmBot={(farmBot) => {
          setPlacementFarmBot(farmBot);
          setViewMode('3d');
        }}
        onCancelPlacement={() => setPlacementFarmBot(null)}
        onClose={() => {
          setPlacementFarmBot(null);
          setIsFarmBotLibraryOpen(false);
        }}
      />
      </div>

      <ThreeDBedPlacementPanel
        isOpen={Boolean(selectedProjectId) && isBedPlacementOpen}
        projectModules={projectThreeDModules}
        selectedModuleId={placementThreedId}
        draft={bedPlacementDraft}
        placementActive={bedPlacementActive}
        placing={placingBed}
        onSelectedModuleChange={setPlacementThreedId}
        onDraftChange={(field, value) => {
          setBedPlacementDraft((current) => ({ ...current, [field]: value }));
        }}
        onBeginPlacement={() => {
          setBedPlacementActive(true);
          setViewMode('3d');
        }}
        onCancelPlacement={() => setBedPlacementActive(false)}
        onClose={() => {
          setBedPlacementActive(false);
          setIsBedPlacementOpen(false);
        }}
      />

      <ThreeDPlantingPlacementPanel
        isOpen={Boolean(selectedProjectId) && isPlantingPlacementOpen}
        projectModules={projectThreeDModules}
        selectedModuleId={placementThreedId}
        plants={plantingOptions}
        beds={(data.threed.raw?.beds ?? []).map((bed: any) => ({
          id: Number(bed.id),
          name: typeof bed.name === 'string' ? bed.name : null,
        }))}
        draft={plantingPlacementDraft}
        loadingPlants={loadingPlantingOptions}
        placementActive={plantingPlacementActive}
        placing={placingPlanting}
        onSelectedModuleChange={setPlacementThreedId}
        onDraftChange={(field, value) => {
          setPlantingPlacementDraft((current) => ({ ...current, [field]: value }));
        }}
        onBeginPlacement={() => setPlantingPlacementActive(true)}
        onCancelPlacement={() => setPlantingPlacementActive(false)}
        onClose={() => {
          setPlantingPlacementActive(false);
          setIsPlantingPlacementOpen(false);
        }}
      />
      {/* ✅ Map Container */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div style={{ height: 'calc(100dvh - 122px)' }}>
            
            {/* Pass cameraMode to combined view's 3D UnifiedMapView */}
            {viewMode === 'combined' && (
              <div 
                ref={containerRef}
                className="flex flex-col w-full h-full gap-0 p-0 relative"
              >
                <div 
                  className="min-h-0 transition-none"
                  style={{ height: `${panelHeight}%` }}
                >
                  <div className="relative w-full h-full rounded-t-lg overflow-hidden border border-white/10 bg-black/5">
                    <UnifiedMapView
                      projectId={selectedProjectId ? Number(selectedProjectId) : null}
                      onThreeDPresentationComplete={handleThreeDPresentationComplete}
                      environmentControlsCloseRequest={environmentControlsCloseRequest}
                      onEnvironmentControlsOpenChange={handleEnvironmentControlsOpenChange}
                      onOpenEnvironmentDetails={() => openEnvironmentDetails()}
                      hasProjectEnvironment={projectEnvironmentMarkers.length > 0}
                      runtimeMarkerRegistry={projectRuntimeMarkerRegistryRef.current}
                      geographicOrigin={projectGeographicOrigin}
                      data={data}
                      layers={layers}
                      viewMode="3d"
                      onIncidentSelect={(incident) => setSelectedIncident(incident)}
                      onMarkerSelect={(marker) => { groundMapInspector?.setOpen(false); setSensorInspector(null); setGroupInspector(null); setSelectedMarker(marker); }}
                      onFocusMarker={handleFocusMarker}
                      selectedIncident={selectedIncident}
                      selectedMarker={selectedMarker}
                      height="100%"
                      visibleAssetTypes={visibleAssetTypes}
                      controlledCharacterId={controlledCharacterId}
                      onControlChange={handleControlChange}
                      cameraMode={cameraMode}
                      onCameraModeChange={setCameraMode}
                      focusRequest={focusRequest}
                      sensorFocusRequest={sensorFocusRequest}
                      sensorFocusPosition={sensorFocusPosition}
                      actionTarget={actionTarget}
                      actionTargetFocusRequest={actionTargetFocusRequest}
                      placementModel={placementModel}
                      onModelPlacement={handleModelPlacement}
                      movingModelName={movingModelInstance?.name ?? null}
                      onModelReposition={handleThreeDModelReposition}
                      placementCharacterName={placementCharacter?.name ?? null}
                      onCharacterPlacement={handleCharacterPlacement}
                      placementFarmBotName={placementFarmBot?.name ?? null}
                      onFarmBotPlacement={handleFarmBotPlacement}
                      placementBedName={bedPlacementActive ? bedPlacementDraft.name : null}
                      onBedPlacement={handleBedPlacement}
                      placementPlantingName={plantingPlacementActive
                        ? plantingOptions.find((plant) => String(plant.id) === plantingPlacementDraft.plantId)?.commonName ?? 'Planting'
                        : null}
                      onPlantingPlacement={handlePlantingPlacement}
                      placementPhysicsSensor={placementPhysicsSensorPreview}
                      onPhysicsSensorPlacement={handlePhysicsSensorPlacement}
                      onProjectMarkerSnapshotProviderChange={handleProjectMarkerSnapshotProviderChange}
                      initialProjectViewState={initialProjectViewState}
                      onProjectThreeDViewStateProviderChange={handleProjectThreeDViewStateProviderChange}
                      onRuntimeMarkerPositionResolverChange={handleRuntimeMarkerPositionResolverChange}
                      onRejectedProjectMarkerDelete={handleRejectedProjectMarkerDelete}
                      onRejectedCharacterMarkerRepair={handleRejectedCharacterMarkerRepair}
                    />
                  </div>
                </div>
                
                <div 
                  className="flex-shrink-0 h-1.5 cursor-row-resize hover:bg-primary/50 transition-colors bg-border/50 my-0.5 rounded-full group"
                  onMouseDown={handleMouseDown}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
                  </div>
                </div>
                
                <div 
                  className="min-h-0 transition-none"
                  style={{ height: `${100 - panelHeight}%` }}
                >
                  <div className="relative w-full h-full rounded-b-lg overflow-hidden border border-white/10 bg-black/5">
                    <UnifiedMapView
                      projectId={selectedProjectId ? Number(selectedProjectId) : null}
                      runtimeMarkerRegistry={projectRuntimeMarkerRegistryRef.current}
                      geographicOrigin={projectGeographicOrigin}
                      data={data}
                      layers={layers}
                      viewMode="2d"
                      onIncidentSelect={(incident) => setSelectedIncident(incident)}
                      onMarkerSelect={(marker) => { groundMapInspector?.setOpen(false); setSensorInspector(null); setGroupInspector(null); setSelectedMarker(marker); }}
                      onFocusMarker={handleFocusMarker}
                      selectedIncident={selectedIncident}
                      selectedMarker={selectedMarker}
                      height="100%"
                      visibleAssetTypes={visibleAssetTypes}
                      controlledCharacterId={controlledCharacterId}
                      placementModel={placementModel}
                      onModelPlacement={handleModelPlacement}
                      onModelMove={handleMoveModelInstance}
                      initialProjectViewState={initialProjectViewState}
                      onProjectMapViewStateProviderChange={handleProjectMapViewStateProviderChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === '3d' && (
              <UnifiedMapView
                projectId={selectedProjectId ? Number(selectedProjectId) : null}
                onThreeDPresentationComplete={handleThreeDPresentationComplete}
                environmentControlsCloseRequest={environmentControlsCloseRequest}
                onEnvironmentControlsOpenChange={handleEnvironmentControlsOpenChange}
                onOpenEnvironmentDetails={() => openEnvironmentDetails()}
                hasProjectEnvironment={projectEnvironmentMarkers.length > 0}
                runtimeMarkerRegistry={projectRuntimeMarkerRegistryRef.current}
                geographicOrigin={projectGeographicOrigin}
                data={data}
                layers={layers}
                viewMode="3d"
                onIncidentSelect={(incident) => setSelectedIncident(incident)}
                onMarkerSelect={(marker) => { groundMapInspector?.setOpen(false); setSensorInspector(null); setGroupInspector(null); setSelectedMarker(marker); }}
                onFocusMarker={handleFocusMarker}
                selectedIncident={selectedIncident}
                selectedMarker={selectedMarker}
                height="100%"
                visibleAssetTypes={visibleAssetTypes}
                controlledCharacterId={controlledCharacterId}
                onControlChange={handleControlChange}
                cameraMode={cameraMode}
                onCameraModeChange={setCameraMode}
                focusRequest={focusRequest}
                sensorFocusRequest={sensorFocusRequest}
                sensorFocusPosition={sensorFocusPosition}
                actionTarget={actionTarget}
                actionTargetFocusRequest={actionTargetFocusRequest}
                placementModel={placementModel}
                onModelPlacement={handleModelPlacement}
                movingModelName={movingModelInstance?.name ?? null}
                onModelReposition={handleThreeDModelReposition}
                placementCharacterName={placementCharacter?.name ?? null}
                onCharacterPlacement={handleCharacterPlacement}
                placementFarmBotName={placementFarmBot?.name ?? null}
                onFarmBotPlacement={handleFarmBotPlacement}
                placementBedName={bedPlacementActive ? bedPlacementDraft.name : null}
                onBedPlacement={handleBedPlacement}
                placementPlantingName={plantingPlacementActive
                  ? plantingOptions.find((plant) => String(plant.id) === plantingPlacementDraft.plantId)?.commonName ?? 'Planting'
                  : null}
                onPlantingPlacement={handlePlantingPlacement}
                placementPhysicsSensor={placementPhysicsSensorPreview}
                onPhysicsSensorPlacement={handlePhysicsSensorPlacement}
                onProjectMarkerSnapshotProviderChange={handleProjectMarkerSnapshotProviderChange}
                initialProjectViewState={initialProjectViewState}
                onProjectThreeDViewStateProviderChange={handleProjectThreeDViewStateProviderChange}
                onRuntimeMarkerPositionResolverChange={handleRuntimeMarkerPositionResolverChange}
                onRejectedProjectMarkerDelete={handleRejectedProjectMarkerDelete}
                onRejectedCharacterMarkerRepair={handleRejectedCharacterMarkerRepair}
              />
            )}

            {viewMode === '2d' && (
              <UnifiedMapView
                projectId={selectedProjectId ? Number(selectedProjectId) : null}
                runtimeMarkerRegistry={projectRuntimeMarkerRegistryRef.current}
                geographicOrigin={projectGeographicOrigin}
                data={data}
                layers={layers}
                viewMode="2d"
                onIncidentSelect={(incident) => setSelectedIncident(incident)}
                onMarkerSelect={(marker) => { groundMapInspector?.setOpen(false); setSensorInspector(null); setGroupInspector(null); setSelectedMarker(marker); }}
                onFocusMarker={handleFocusMarker}
                selectedIncident={selectedIncident}
                selectedMarker={selectedMarker}
                height="100%"
                visibleAssetTypes={visibleAssetTypes}
                controlledCharacterId={controlledCharacterId}
                onControlChange={handleControlChange}
                placementModel={placementModel}
                onModelPlacement={handleModelPlacement}
                onModelMove={handleMoveModelInstance}
                initialProjectViewState={initialProjectViewState}
                onProjectMapViewStateProviderChange={handleProjectMapViewStateProviderChange}
              />
            )}

          </div>
        </CardContent>
      </Card>

      {/* ✅ v0.15.2: Details Card — rendered outside map to avoid Leaflet interference */}
      <div
        hidden={viewMode !== '2d' && !isThreeDPresentationComplete}
        inert={viewMode !== '2d' && !isThreeDPresentationComplete}
      >
      <GroundMapInspector leftOffsetRem={isLeftSceneWorkspaceOpen ? 18.75 : 0.75} available={viewMode !== '2d' && isThreeDPresentationComplete} onSave={handleSaveThreeDProject} saving={savingProjectMarkers} />
      {groupInspector !== null && !groundMapInspector?.open && <SensorGroupInspector
        key={`${selectedProjectId}:${groupInspector}`}
        groupId={groupInspector} markers={projectRuntimeMarkers}
        leftOffsetRem={isLeftSceneWorkspaceOpen ? 18.75 : 0.75}
        onClose={() => setGroupInspector(null)}
        onSelectGroup={setGroupInspector}
        onSelectSensor={(marker, sensorId) => { selectProjectAsset(marker); setSensorInspector({ ownerId: marker.id, sensorId }); }}
      />}
      <div hidden={groupInspector !== null || Boolean(groundMapInspector?.open && viewMode !== '2d')}>
      <DetailsCard
        selected={selectedMarker || selectedIncident}
        projectMarkers={projectRuntimeMarkers}
        onSelectProjectMarker={selectProjectAsset}
        selectedSensorId={sensorInspector?.ownerId === selectedMarker?.id ? sensorInspector?.sensorId : null}
        onSelectSensor={(sensorId) => setSensorInspector(sensorId && selectedMarker ? { ownerId: selectedMarker.id, sensorId } : null)}
        projectId={selectedProjectId}
        leftOffsetRem={isLeftSceneWorkspaceOpen ? 18.75 : 0.75}
        onClose={() => { setSelectedMarker(null); setSelectedIncident(null); }}
        controlledCharacterId={controlledCharacterId}
        liveControlledCharacterPosition={liveControlledCharacterPosition}
        onTakeControl={(id) => {
          setLiveControlledCharacterPosition(null);
          setCameraMode('stationary');
          setControlledCharacterId(id);
        }}
        onReleaseControl={() => {
          setControlledCharacterId(null);
          setLiveControlledCharacterPosition(null);
        }}
        cameraMode={cameraMode}
        onCameraModeChange={(mode) => setCameraMode(mode)}
        onZoomCenter={handleZoomCenter}
        actionTarget={actionTarget}
        orchestrationStatus={orchestrationStatus}
        onSetActionTarget={(target) => {
          setActionTarget(target);
          setOrchestrationStatus(null);
          showToast(`Action target set: ${target.name}`, 'success');
        }}
        onClearActionTarget={() => {
          setActionTarget(null);
          setOrchestrationStatus(null);
          showToast('Action target cleared', 'info');
        }}
        onFocusActionTarget={handleFocusActionTarget}
        resolveRuntimeMarkerPosition={resolveRuntimeMarkerPosition}
        onUpdateModelInstance={handleUpdateModelInstance}
        updatingModelInstanceId={updatingModelInstanceId}
        onDeleteModelInstance={handleDeleteModelInstance}
        deletingModelInstanceId={deletingModelInstanceId}
        movingModelInstanceId={(movingModelInstance?.planting || movingModelInstance?.module) ? null : movingModelInstance?.id ?? null}
        onMoveModelToggle={handleMoveModelToggle}
        onUpdateBedInstance={handleUpdateBedInstance}
        updatingBedMarkerId={updatingBedMarkerId}
        onDeleteBedInstance={handleDeleteBedInstance}
        deletingBedMarkerId={deletingBedMarkerId}
        onUpdateFarmBotInstance={handleUpdateFarmBotInstance}
        updatingFarmBotMarkerId={updatingFarmBotMarkerId}
        onDeleteFarmBotInstance={handleDeleteFarmBotInstance}
        deletingFarmBotMarkerId={deletingFarmBotMarkerId}
        movingModuleMarkerId={movingModelInstance?.module ? movingModelInstance.id : null}
        onMoveModuleToggle={handleMoveModuleToggle}
        movingPlantingMarkerId={movingModelInstance?.planting ? movingModelInstance.id : null}
        onMovePlantingToggle={handleMovePlantingToggle}
        onUpdatePlantingInstance={handleUpdatePlantingInstance}
        updatingPlantingMarkerId={updatingPlantingMarkerId}
        onDeletePlantingInstance={handleDeletePlantingInstance}
        deletingPlantingMarkerId={deletingPlantingMarkerId}
        onUpdatePhysicsSensors={handleUpdatePhysicsSensors}
        updatingPhysicsSensorMarkerId={updatingPhysicsSensorMarkerId}
        placingPhysicsSensor={placingPhysicsSensor ? {
          markerId: placingPhysicsSensor.markerId,
          sensorId: placingPhysicsSensor.sensor.id,
        } : null}
        physicsSensorPlacementResult={physicsSensorPlacementResult}
        onBeginPhysicsSensorPlacement={(marker, markerId, sensor, operation) => {
          setEnvironmentControlsCloseRequest((request) => request + 1);
          setIsProjectSummaryOpen(false);
          setIsSceneAddMenuOpen(false);
          setIsProjectSetupOpen(false);
          setIsScenariosOpen(false);
          setIsSetupMenuOpen(false);
          setMovingModelInstance(null);
          setPlacementModel(null);
          setPlacementCharacter(null);
          setPlacementFarmBot(null);
          setBedPlacementActive(false);
          setPlantingPlacementActive(false);
          setPlacingPhysicsSensor({ marker, markerId, sensor, operation });
          setViewMode('3d');
        }}
        onCancelPhysicsSensorPlacement={() => setPlacingPhysicsSensor(null)}
        onZoomToPhysicsSensor={handleZoomToPhysicsSensor}
        onUpdateCharacterPosition={handleUpdateCharacterPosition}
        updatingCharacterMarkerId={updatingCharacterMarkerId}
        onDeleteCharacterInstance={handleDeleteCharacterInstance}
        deletingCharacterMarkerId={deletingCharacterMarkerId}
      />
      </div>
      </div>
      
    </div>
  );
}
