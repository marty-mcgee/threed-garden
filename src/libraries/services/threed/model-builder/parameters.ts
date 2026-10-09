import type { CottageParameters } from './types';

export const COTTAGE_DEFAULTS: Readonly<CottageParameters> = Object.freeze({
  units: 'inches', overall_scale: 1, seed: 1117, texture_resolution: 128, interior_enabled: true,
  main_width: 336, main_depth: 456, front_section_depth: 252, front_wall_height: 120, rear_wall_height: 138,
  front_roof_pitch_rise_per_12: 5.5, rear_roof_pitch_rise_per_12: 5.3,
  roof_overhang: 24, wall_thickness: 6, floor_elevation: 12,
  wing_width: 96, wing_depth: 276, wing_wall_height: 96, wing_roof_pitch_rise_per_12: 4,
  porch_depth: 108, door_height: 80, door_width: 36, window_width: 60, window_height: 48,
  window_sill_height: 36, front_glazing_height: 108, chimney_width: 36, chimney_depth: 24, chimney_above_ridge: 20,
  skylight_width: 28, skylight_length: 36, frame_width: 3, walkway_width: 30, roof_thickness: 2.5,
  glass_opacity: .18, interior_lining_thickness: .5, partition_thickness: 4.5, partition_height: 96,
  hall_width: 48, texture_weathering: .45, contact_shading_strength: .35,
});

type NumericKey = { [K in keyof CottageParameters]: CottageParameters[K] extends number ? K : never }[keyof CottageParameters];
export interface CottageParameterField { key: NumericKey; label: string; min: number; max: number; step: number; unit: 'in' | 'ratio' | 'rise/12' | 'integer' }
const bounds: Record<NumericKey, [number, number, number]> = {
  overall_scale: [.1, 10, .1], seed: [0, 4294967295, 1], texture_resolution: [64, 256, 64],
  main_width: [240, 720, 1], main_depth: [360, 960, 1], front_section_depth: [180, 600, 1],
  front_wall_height: [96, 240, 1], rear_wall_height: [96, 300, 1],
  front_roof_pitch_rise_per_12: [3, 12, .1], rear_roof_pitch_rise_per_12: [3, 12, .1],
  roof_overhang: [4, 48, 1], wall_thickness: [3, 12, .5], floor_elevation: [4, 36, 1],
  wing_width: [72, 240, 1], wing_depth: [180, 600, 1], wing_wall_height: [90, 180, 1],
  wing_roof_pitch_rise_per_12: [2, 10, .1], porch_depth: [48, 240, 1],
  door_height: [72, 108, 1], door_width: [28, 48, 1], window_width: [24, 84, 1],
  window_height: [24, 72, 1], window_sill_height: [24, 60, 1], front_glazing_height: [60, 180, 1],
  chimney_width: [24, 72, 1], chimney_depth: [12, 48, 1], chimney_above_ridge: [8, 60, 1],
  skylight_width: [12, 48, 1], skylight_length: [18, 72, 1], frame_width: [1, 6, .25],
  walkway_width: [12, 72, 1], roof_thickness: [1, 8, .25], glass_opacity: [.05, .8, .01],
  interior_lining_thickness: [.25, 2, .25], partition_thickness: [2, 8, .25], partition_height: [80, 180, 1],
  hall_width: [36, 96, 1], texture_weathering: [0, 1, .05], contact_shading_strength: [0, 1, .05],
};

export const COTTAGE_PARAMETER_FIELDS: readonly CottageParameterField[] = Object.entries(bounds).map(([key, [min, max, step]]) => ({
  key: key as NumericKey, label: key.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()), min, max, step,
  unit: key.includes('pitch') ? 'rise/12' : ['seed', 'texture_resolution'].includes(key) ? 'integer' :
    ['overall_scale', 'glass_opacity', 'texture_weathering', 'contact_shading_strength'].includes(key) ? 'ratio' : 'in',
}));

/** Reject malformed/over-budget inputs before allocating textures or geometry. */
export function normalizeCottageParameters(input: unknown = {}): CottageParameters {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Cottage parameters must be an object.');
  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) if (!Object.prototype.hasOwnProperty.call(COTTAGE_DEFAULTS,key)) throw new Error(`Unknown Cottage parameter: ${key}.`);
  const p = { ...COTTAGE_DEFAULTS, ...record } as CottageParameters;
  if (p.units !== 'inches') throw new Error('Cottage dimensions must use inches.');
  if (typeof p.interior_enabled !== 'boolean') throw new Error('Interior enabled must be a boolean.');
  for (const [key, [min, max]] of Object.entries(bounds)) {
    const value = p[key as NumericKey];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${key} must be between ${min} and ${max}.`);
  }
  if (!Number.isInteger(p.seed)) throw new Error('Seed must be an integer.');
  if (![64, 128, 256].includes(p.texture_resolution)) throw new Error('Texture resolution must be 64, 128 or 256.');
  const margin = p.frame_width + 4;
  if (p.front_section_depth > p.main_depth - 144) throw new Error('The rear section needs at least 144 inches of depth.');
  if (p.rear_wall_height < p.front_wall_height + 4) throw new Error('The rear wall must be at least 4 inches taller than the front.');
  if (p.front_glazing_height + 6 + p.frame_width > p.front_wall_height) throw new Error('Front glazing and frame must fit below the front eave.');
  if (p.door_height + margin >= Math.min(p.front_wall_height, p.wing_wall_height)) throw new Error('Doors and frames must fit below the walls.');
  if (p.window_sill_height + p.window_height + margin >= p.front_wall_height || p.window_sill_height + 36 + margin >= p.wing_wall_height) throw new Error('Windows and frames must fit below the walls.');
  if (p.window_width + p.door_width + margin * 2 >= p.front_section_depth - 72) throw new Error('Front side windows and wing passages need separate openings.');
  if (p.window_width + margin * 2 >= p.main_depth - p.front_section_depth) throw new Error('The rear side window must fit in its wall.');
  if (p.window_width/2 + p.door_width/2 + 2*margin >= p.main_width*.29 || p.main_width*.29 + p.window_width/2 + margin >= p.main_width/2) throw new Error('Rear windows, door and frames need separate openings inside the rear wall.');
  if (p.porch_depth > p.wing_depth - 96 || p.wing_depth < p.wing_width + 2 * margin) throw new Error('The wing needs an enclosed room and a positive hip ridge.');
  if (Math.min(48, p.window_width) + margin * 2 >= p.wing_depth - p.porch_depth) throw new Error('The wing window must fit in the enclosed room.');
  const wingPassage = -p.main_depth/2+p.front_section_depth-36, wingRoomFront = -p.wing_depth/2+p.porch_depth;
  if (wingPassage-p.door_width/2 < wingRoomFront || wingPassage+p.door_width/2+margin >= p.wing_depth/2) throw new Error('The main side passage must fit within the enclosed side wing. Adjust front section or porch depth.');
  if (p.hall_width + 2 * p.door_width + 4 * margin >= p.main_width || p.partition_height < p.door_height + 4 || p.partition_height > p.rear_wall_height - 4) throw new Error('The hallway and open interior doors must fit the rear volume.');
  const inner = p.chimney_width / 2 + 14, outer = p.main_width / 2 - 42;
  if (outer <= inner + 24 || (p.main_width / 2 - outer) * p.front_roof_pitch_rise_per_12 / 12 <= 12) throw new Error('Front clerestory glazing needs a positive sloping aperture.');
  const skylightCenter = p.main_width / 2 * .55;
  if (skylightCenter - p.skylight_width / 2 <= margin || skylightCenter + p.skylight_width / 2 >= p.main_width / 2 - margin || p.skylight_length + margin * 2 >= p.front_section_depth * .28) throw new Error('Skylights and frames must fit on the lower roof.');
  return p;
}

export function canonicalCottageParameters(parameters: CottageParameters): string {
  const p = normalizeCottageParameters(parameters);
  return JSON.stringify(Object.fromEntries(Object.keys(p).sort().map(key => [key, p[key as keyof CottageParameters]])));
}

export function cottageInchesToMetres(inches: number, overallScale = 1): number { return inches * .0254 * overallScale; }
