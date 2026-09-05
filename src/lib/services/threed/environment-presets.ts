export interface ThreeDEnvironmentPreset {
  key: string;
  label: string;
  lightingPreset: string;
  backgroundUrl?: string;
  proceduralSky?: boolean;
}

export const DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY = 'default-daylight';

export const THREE_D_ENVIRONMENT_PRESETS: readonly ThreeDEnvironmentPreset[] = [
  {
    key: DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY,
    label: 'Default Daylight',
    lightingPreset: 'park',
    proceduralSky: true,
  },
  {
    key: 'sunset-forest-hd',
    label: 'Sunset Forest HD',
    lightingPreset: 'forest',
    backgroundUrl: '/assets/environments/sunset-forest-8k.jpg',
  },
  ...['sunset', 'dawn', 'night', 'city', 'forest', 'park', 'warehouse', 'apartment', 'studio', 'lobby']
    .map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      lightingPreset: key,
    })),
];

export const THREE_D_ENVIRONMENT_PRESET_KEYS = THREE_D_ENVIRONMENT_PRESETS
  .map((preset) => preset.key);

export function resolveThreeDEnvironmentPreset(key: string): ThreeDEnvironmentPreset {
  return THREE_D_ENVIRONMENT_PRESETS.find((preset) => preset.key === key)
    ?? THREE_D_ENVIRONMENT_PRESETS.find(
      (preset) => preset.key === DEFAULT_THREE_D_ENVIRONMENT_PRESET_KEY,
    )!;
}
