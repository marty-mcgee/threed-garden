export const PROJECT_GROUND_MAP_VISUAL_MODES = ['procedural', 'image', 'hidden'] as const;
export type ProjectGroundMapVisualMode = typeof PROJECT_GROUND_MAP_VISUAL_MODES[number];

export interface ProjectGroundMapTransform {
  visualMode: ProjectGroundMapVisualMode;
  groundMapId: number | null;
  centerX: number;
  centerZ: number;
  width: number;
  length: number;
  height: number;
  rotationY: number;
  opacity: number;
}

export const DEFAULT_PROJECT_GROUND_MAP_TRANSFORM: ProjectGroundMapTransform = {
  visualMode: 'procedural', groundMapId: null, centerX: 0, centerZ: 0,
  width: 200, length: 200, height: -0.1, rotationY: 0, opacity: 1,
};

function finite(value: unknown, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error('invalid_ground_map_transform');
  return parsed;
}

export function parseProjectGroundMapTransform(value: unknown): ProjectGroundMapTransform {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_ground_map_transform');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['visualMode', 'groundMapId', 'centerX', 'centerZ', 'width', 'length', 'height', 'rotationY', 'opacity'].includes(key))) {
    throw new Error('invalid_ground_map_transform');
  }
  if (!PROJECT_GROUND_MAP_VISUAL_MODES.includes(input.visualMode as ProjectGroundMapVisualMode)) throw new Error('invalid_ground_map_transform');
  const id = input.groundMapId === null ? null : Number(input.groundMapId);
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) throw new Error('invalid_ground_map_transform');
  return {
    visualMode: input.visualMode as ProjectGroundMapVisualMode,
    groundMapId: id,
    centerX: finite(input.centerX, -1_000_000, 1_000_000),
    centerZ: finite(input.centerZ, -1_000_000, 1_000_000),
    width: finite(input.width, 1, 20_000),
    length: finite(input.length, 1, 20_000),
    height: finite(input.height, -1_000, 1_000),
    rotationY: finite(input.rotationY, -360, 360),
    opacity: finite(input.opacity, 0.05, 1),
  };
}
