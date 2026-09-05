import {
  THREE_D_ENVIRONMENT_PRESET_KEYS,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../environment-presets.ts';

export const PROJECT_VIEW_STATE_VERSION = 1 as const;

export type ProjectViewMode = '2d' | '3d' | 'combined';
export type ProjectCameraMode = 'follow' | 'topdown' | 'firstperson' | 'orbit' | 'stationary';

export interface ProjectVector3 {
  x: number;
  y: number;
  z: number;
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
}

export interface ProjectMapViewState {
  center: { lat: number; lng: number };
  zoom: number;
}

export interface ThreeDProjectViewState {
  version: typeof PROJECT_VIEW_STATE_VERSION;
  savedAt: string;
  viewMode: ProjectViewMode;
  panelHeight: number;
  cameraMode: ProjectCameraMode;
  threeD?: ProjectThreeDViewState;
  map?: ProjectMapViewState;
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
