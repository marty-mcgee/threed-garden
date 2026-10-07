// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { parseProjectSensorSnapshot, type ProjectSensorSnapshot } from '../physics/sensor-snapshot-core.ts';
import {
  THREE_D_ENVIRONMENT_PRESET_KEYS,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../environment-presets.ts';
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { parseProjectGroundMapTransform, type ProjectGroundMapTransform } from '../ground-maps/project-ground-map-core.ts';

export const PROJECT_VIEW_STATE_VERSION = 1 as const;

export type ProjectViewMode = '2d' | '3d' | 'combined';
export type ProjectCameraMode = 'follow' | 'topdown' | 'firstperson' | 'orbit' | 'stationary';

export type ProjectOverlayPositions = Partial<Record<'simulations' | 'scenarios' | 'tour' | 'sensorGroup' | 'sensors', { x: number; y: number }>>;

export interface ProjectVector3 {
  x: number;
  y: number;
  z: number;
}

export type ProjectScenarioKind = 'soccer' | 'farming';
export interface ProjectScenarioSelection {
  id: number;
  projectId: number;
  threedId?: number;
  name: string;
  threedName: string;
  setup: { version: 1; kind: ProjectScenarioKind; environmentMarkerId: string | null; sensorGroupId: string | null } | null;
}
export interface ProjectScenarioGuideState {
  kind: ProjectScenarioKind;
  environmentId: string;
  groupId: string;
  farmbotId: string;
}
export interface ProjectScenarioPanelState {
  panelOpen: boolean;
  selected: ProjectScenarioSelection | null;
  guide: ProjectScenarioGuideState;
}
export function emptyProjectScenarioPanelState(): ProjectScenarioPanelState {
  return { panelOpen: false, selected: null, guide: { kind: 'soccer', environmentId: '', groupId: '', farmbotId: '' } };
}

export interface ProjectScenarioRuntimeState {
  projectId: number;
  active: { projectId: number; name: string; kind: ProjectScenarioKind; environmentName: string; groupId: string; groupName: string;
    scenarioId?: number; threedId?: number; environmentMarkerId?: string } | null;
  instructionVisible: boolean;
  sensorsVisible: boolean;
}

export interface ProjectThreeDViewState {
  cameraPosition: ProjectVector3;
  cameraTarget: ProjectVector3;
  activeLayers: string[];
  /** Layers that existed when this view was saved; absent on legacy saves. */
  availableLayers?: string[];
  environment: string;
  autoRotate: boolean;
  showGrid: boolean;
  showLegend: boolean;
  showGizmo: boolean;
  showControls?: boolean;
  physicsDebug?: boolean;
  scenarioRuntime?: ProjectScenarioRuntimeState;
  sensorState?: ProjectSensorSnapshot;
  viewPresets?: Array<{
    id: string; name: string; position: ProjectVector3; target: ProjectVector3;
    layers: string[]; createdAt: string;
  }>;
  sunlight?: { azimuth: number; elevation: number };
  ground?: { enabled: boolean; size: number; height: number };
  groundMap?: ProjectGroundMapTransform;
}

export interface ProjectMapViewState {
  center: { lat: number; lng: number };
  zoom: number;
}

export interface ThreeDProjectViewState {
  projectTourOpen?: boolean;
  overlayPositions?: ProjectOverlayPositions;
  version: typeof PROJECT_VIEW_STATE_VERSION;
  savedAt: string;
  viewMode: ProjectViewMode;
  panelHeight: number;
  cameraMode: ProjectCameraMode;
  threeD?: ProjectThreeDViewState;
  map?: ProjectMapViewState;
  scenario?: ProjectScenarioPanelState;
  workspace?: {
    selectedMarkerId: string | null;
    panel: 'none' | 'summary' | 'assets' | 'models';
    assetSearch: string;
    assetType: string;
  };
}

export class ProjectViewStateError extends Error {
  constructor() {
    super('invalid_project_view_state');
    this.name = 'ProjectViewStateError';
  }
}

const CAMERA_MODES = new Set<ProjectCameraMode>([
  'follow', 'topdown', 'firstperson', 'orbit', 'stationary',
]);
const VIEW_MODES = new Set<ProjectViewMode>(['2d', '3d', 'combined']);
const SCENE_LAYERS = new Set(['beds', 'characters', 'farmbots', 'models', 'plantings', 'layers']);
const ENVIRONMENTS = new Set(THREE_D_ENVIRONMENT_PRESET_KEYS);

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finite(value: unknown, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new ProjectViewStateError();
  return parsed;
}

function vector(value: unknown): ProjectVector3 {
  const item = record(value);
  if (!item) throw new ProjectViewStateError();
  return {
    x: finite(item.x, -1_000_000, 1_000_000),
    y: finite(item.y, -1_000_000, 1_000_000),
    z: finite(item.z, -1_000_000, 1_000_000),
  };
}

function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new ProjectViewStateError();
  return value;
}

function scenarioBindingId(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0 || Number(value) > 2_147_483_647) throw new ProjectViewStateError();
  return Number(value);
}

function sceneLayers(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > SCENE_LAYERS.size) throw new ProjectViewStateError();
  const layers = value.map((layer) => {
    if (typeof layer !== 'string' || !SCENE_LAYERS.has(layer)) throw new ProjectViewStateError();
    return layer;
  });
  if (new Set(layers).size !== layers.length) throw new ProjectViewStateError();
  return layers;
}

export function resolveRestoredThreeDActiveLayers(
  savedActiveLayers: readonly string[],
  savedAvailableLayers: readonly string[] | undefined,
  currentAvailableLayers: readonly string[],
): string[] {
  const active = new Set(savedActiveLayers);
  const knownWhenSaved = savedAvailableLayers ? new Set(savedAvailableLayers) : null;
  for (const layer of currentAvailableLayers) {
    if (!knownWhenSaved || !knownWhenSaved.has(layer)) active.add(layer);
  }
  return Array.from(active);
}

export function parseProjectViewPresets(value: unknown): NonNullable<ProjectThreeDViewState['viewPresets']> {
  if (!Array.isArray(value) || value.length > 50) throw new ProjectViewStateError();
  const ids = new Set<string>();
  return value.map(candidate => {
    const preset = record(candidate);
    if (!preset || typeof preset.id !== 'string' || !preset.id || preset.id.length > 200
      || ids.has(preset.id) || typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 120
      || typeof preset.createdAt !== 'string' || !Number.isFinite(Date.parse(preset.createdAt))) throw new ProjectViewStateError();
    ids.add(preset.id);
    return { id: preset.id, name: preset.name, position: vector(preset.position), target: vector(preset.target),
      layers: sceneLayers(preset.layers), createdAt: preset.createdAt };
  });
}

function boundedText(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max) throw new ProjectViewStateError();
  return value;
}

function scenarioKind(value: unknown): ProjectScenarioKind {
  if (value !== 'soccer' && value !== 'farming') throw new ProjectViewStateError();
  return value;
}

function scenarioPanel(value: unknown): ProjectScenarioPanelState {
  const input = record(value);
  const guide = record(input?.guide);
  if (!input || !guide) throw new ProjectViewStateError();
  let selected: ProjectScenarioSelection | null = null;
  if (input.selected !== null) {
    const source = record(input.selected);
    if (!source || !Number.isSafeInteger(source.id) || Number(source.id) <= 0) throw new ProjectViewStateError();
    let setup: ProjectScenarioSelection['setup'] = null;
    if (source.setup !== null) {
      const details = record(source.setup);
      if (!details || details.version !== 1) throw new ProjectViewStateError();
      setup = {
        version: 1,
        kind: scenarioKind(details.kind),
        environmentMarkerId: details.environmentMarkerId === null ? null : boundedText(details.environmentMarkerId, 200),
        sensorGroupId: details.sensorGroupId === null ? null : boundedText(details.sensorGroupId, 200),
      };
    }
    if (!Number.isSafeInteger(source.projectId) || Number(source.projectId) <= 0) throw new ProjectViewStateError();
    selected = { id: Number(source.id), projectId: Number(source.projectId),
      ...(source.threedId === undefined ? {} : { threedId: scenarioBindingId(source.threedId) }), name: boundedText(source.name, 120),
      threedName: boundedText(source.threedName, 120), setup };
  }
  return { panelOpen: boolean(input.panelOpen), selected, guide: {
    kind: scenarioKind(guide.kind), environmentId: boundedText(guide.environmentId, 200),
    groupId: boundedText(guide.groupId, 200), farmbotId: boundedText(guide.farmbotId, 200),
  } };
}

function scenarioRuntime(value: unknown): ProjectScenarioRuntimeState {
  const input = record(value);
  if (!input) throw new ProjectViewStateError();
  let active: ProjectScenarioRuntimeState['active'] = null;
  if (input.active !== null) {
    const source = record(input.active);
    if (!source) throw new ProjectViewStateError();
    if (!Number.isSafeInteger(source.projectId) || Number(source.projectId) <= 0) throw new ProjectViewStateError();
    active = { projectId: Number(source.projectId), name: boundedText(source.name, 120), kind: scenarioKind(source.kind),
      ...(source.scenarioId === undefined ? {} : { scenarioId: scenarioBindingId(source.scenarioId) }),
      ...(source.threedId === undefined ? {} : { threedId: scenarioBindingId(source.threedId) }),
      ...(source.environmentMarkerId === undefined ? {} : { environmentMarkerId: boundedText(source.environmentMarkerId, 200) }),
      environmentName: boundedText(source.environmentName, 200), groupId: boundedText(source.groupId, 200),
      groupName: boundedText(source.groupName, 120) };
  }
  if (!Number.isSafeInteger(input.projectId) || Number(input.projectId) <= 0) throw new ProjectViewStateError();
  const projectId = Number(input.projectId);
  const instructionVisible = boolean(input.instructionVisible);
  const sensorsVisible = boolean(input.sensorsVisible);
  if ((instructionVisible && !active) || (active && active.projectId !== projectId)) throw new ProjectViewStateError();
  return { projectId, active, instructionVisible, sensorsVisible };
}

function sensorSnapshot(value: unknown): ProjectSensorSnapshot {
  try { return parseProjectSensorSnapshot(value); } catch { throw new ProjectViewStateError(); }
}

export function parseThreeDProjectViewState(value: unknown): ThreeDProjectViewState {
  const input = record(value);
  if (!input || input.version !== PROJECT_VIEW_STATE_VERSION) throw new ProjectViewStateError();
  if (typeof input.savedAt !== 'string' || !Number.isFinite(Date.parse(input.savedAt))) {
    throw new ProjectViewStateError();
  }
  if (typeof input.viewMode !== 'string' || !VIEW_MODES.has(input.viewMode as ProjectViewMode)) {
    throw new ProjectViewStateError();
  }
  if (typeof input.cameraMode !== 'string' || !CAMERA_MODES.has(input.cameraMode as ProjectCameraMode)) {
    throw new ProjectViewStateError();
  }

  const result: ThreeDProjectViewState = {
    version: PROJECT_VIEW_STATE_VERSION,
    savedAt: input.savedAt,
    viewMode: input.viewMode as ProjectViewMode,
    panelHeight: finite(input.panelHeight, 20, 80),
    cameraMode: input.cameraMode as ProjectCameraMode,
  };

  if (input.projectTourOpen !== undefined) result.projectTourOpen = boolean(input.projectTourOpen);
  if (input.overlayPositions !== undefined) {
    const positions = record(input.overlayPositions);
    if (!positions || Object.keys(positions).some(key => !['simulations', 'scenarios', 'tour', 'sensorGroup', 'sensors'].includes(key))) throw new ProjectViewStateError();
    result.overlayPositions = {};
    for (const key of ['simulations', 'scenarios', 'tour', 'sensorGroup', 'sensors'] as const) {
      if (positions[key] === undefined) continue;
      const position = record(positions[key]);
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') throw new ProjectViewStateError();
      result.overlayPositions[key] = { x: finite(position.x, 0, 1), y: finite(position.y, 0, 1) };
    }
  }
  if (input.scenario !== undefined) result.scenario = scenarioPanel(input.scenario);

  if (input.workspace !== undefined) {
    const workspace = record(input.workspace);
    if (!workspace || !['none', 'summary', 'assets', 'models'].includes(String(workspace.panel))) throw new ProjectViewStateError();
    const text = (value: unknown, limit: number): string => {
      if (typeof value !== 'string' || value.length > limit) throw new ProjectViewStateError();
      return value;
    };
    result.workspace = {
      selectedMarkerId: workspace.selectedMarkerId === null ? null : text(workspace.selectedMarkerId, 200),
      panel: workspace.panel as 'none' | 'summary' | 'assets' | 'models',
      assetSearch: text(workspace.assetSearch, 200),
      assetType: text(workspace.assetType, 80),
    };
  }

  if (input.threeD !== undefined) {
    const threeD = record(input.threeD);
    if (!threeD) throw new ProjectViewStateError();
    const activeLayers = sceneLayers(threeD.activeLayers);
    const availableLayers = threeD.availableLayers === undefined
      ? undefined
      : sceneLayers(threeD.availableLayers);
    if (typeof threeD.environment !== 'string' || !ENVIRONMENTS.has(threeD.environment)) {
      throw new ProjectViewStateError();
    }
    result.threeD = {
      cameraPosition: vector(threeD.cameraPosition),
      cameraTarget: vector(threeD.cameraTarget),
      activeLayers,
      ...(availableLayers ? { availableLayers } : {}),
      environment: threeD.environment,
      autoRotate: boolean(threeD.autoRotate),
      showGrid: boolean(threeD.showGrid),
      showLegend: boolean(threeD.showLegend),
      showGizmo: boolean(threeD.showGizmo),
      ...(threeD.showControls === undefined ? {} : { showControls: boolean(threeD.showControls) }),
      ...(threeD.physicsDebug === undefined ? {} : { physicsDebug: boolean(threeD.physicsDebug) }),
      ...(threeD.scenarioRuntime === undefined ? {} : { scenarioRuntime: scenarioRuntime(threeD.scenarioRuntime) }),
      ...(threeD.sensorState === undefined ? {} : { sensorState: sensorSnapshot(threeD.sensorState) }),
      ...(threeD.viewPresets === undefined ? {} : { viewPresets: parseProjectViewPresets(threeD.viewPresets) }),
      ...(threeD.sunlight === undefined ? {} : { sunlight: {
        azimuth: finite(record(threeD.sunlight)?.azimuth, 0, 360),
        elevation: finite(record(threeD.sunlight)?.elevation, 5, 90),
      } }),
      ...(threeD.ground === undefined ? {} : { ground: {
        enabled: boolean(record(threeD.ground)?.enabled),
        size: finite(record(threeD.ground)?.size, 10, 2000),
        height: finite(record(threeD.ground)?.height, -1000, 1000),
      } }),
      ...(threeD.groundMap === undefined ? {} : { groundMap: parseProjectGroundMapTransform(threeD.groundMap) }),
    };
  }

  if (input.map !== undefined) {
    const map = record(input.map);
    const center = record(map?.center);
    if (!map || !center) throw new ProjectViewStateError();
    result.map = {
      center: {
        lat: finite(center.lat, -90, 90),
        lng: finite(center.lng, -180, 180),
      },
      zoom: finite(map.zoom, 1, 22),
    };
  }

  return result;
}

export function readThreeDProjectViewStateFromConfig(config: unknown): ThreeDProjectViewState | null {
  const source = record(config);
  if (!source?.threeDViewState) return null;
  try {
    return parseThreeDProjectViewState(source.threeDViewState);
  } catch {
    return null;
  }
}
