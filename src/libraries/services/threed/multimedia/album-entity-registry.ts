/** Catalog Sub-Modules, not logs, Results or relationship implementation tables. */
export const albumEntityTables = {
  model: 'threed_models',
  character: 'threed_characters',
  plant: 'threed_plants',
  planting: 'threed_plantings',
  bed: 'threed_beds',
  farmbot: 'threed_farmbots',
  scenario: 'threed_scenarios',
  simulation: 'threed_simulations',
  design: 'threed_designs',
  layer: 'threed_layers',
  task: 'threed_tasks',
  harvest: 'threed_harvests',
  watering: 'threed_watering_schedules',
  model_file: 'threed_model_files',
  model_category: 'threed_model_categories',
  texture: 'threed_model_textures',
  ground_map: 'threed_ground_maps',
  animation: 'threed_animations',
  animation_file: 'threed_animation_files',
  animation_category: 'threed_animation_categories',
  animation_slot: 'threed_animation_action_slots',
  animation_preset: 'threed_animation_presets',
  assembly: 'threed_assembly',
} as const;

export type AlbumModuleType = keyof typeof albumEntityTables;
