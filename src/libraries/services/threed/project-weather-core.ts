export interface ProjectWeatherLocation { latitude: number; longitude: number }
/** Existing ThreeD WeatherPoller location, shared by current/forecast and Project Weather. */
export const THREED_WEATHER_LOCATION: Readonly<ProjectWeatherLocation> = Object.freeze({ latitude: 39.3, longitude: -123.5 });
export interface ProjectWeatherLocationSetting extends ProjectWeatherLocation { version: 1 }
export function weatherLocationSetting(value: unknown): ProjectWeatherLocationSetting | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (input.version !== 1 || Object.keys(input).some(key => !['version', 'latitude', 'longitude'].includes(key))
    || typeof input.latitude !== 'number' || typeof input.longitude !== 'number') return null;
  const location = projectWeatherLocation(input.latitude, input.longitude);
  return location ? { version: 1, ...location } : null;
}
export function resolveProjectWeatherLocation(latitude: unknown, longitude: unknown, metadata: unknown, moduleLocation: ProjectWeatherLocation = THREED_WEATHER_LOCATION) {
  const source = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
  const setting = weatherLocationSetting(source.weatherLocation);
  const origin = projectWeatherLocation(latitude, longitude);
  const location = setting ? { latitude: setting.latitude, longitude: setting.longitude } : origin ?? moduleLocation;
  return { setting, location, locationSource: setting ? 'weather' as const : origin ? 'project' as const : 'module' as const };
}
export interface ProjectWeatherReading {
  id: number;
  recordedAt: string;
  temperature: number | null;
  humidity: number | null;
  rainfallInches: number | null;
  windSpeed: number | null;
  frostWarning: boolean;
  heatWarning: boolean;
  droughtWarning: boolean;
  source: string;
}
export interface ProjectWeatherSnapshot {
  projectId: number;
  location: ProjectWeatherLocation | null;
  locationSource: 'weather' | 'project' | 'module' | null;
  readings: ProjectWeatherReading[];
  providerConfigured: boolean;
}

export function projectWeatherLocation(latitude: unknown, longitude: unknown): ProjectWeatherLocation | null {
  if (!['string', 'number'].includes(typeof latitude) || !['string', 'number'].includes(typeof longitude)
    || String(latitude).trim() === '' || String(longitude).trim() === '') return null;
  const lat = Number(latitude), lon = Number(longitude);
  return Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180
    ? { latitude: lat, longitude: lon } : null;
}

function metric(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

/** Normalize only supported provider fields; a zero measurement is a real value. */
export function normalizeProjectWeather(payload: unknown, now = Date.now()) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid Weather response');
  const data = payload as { main?: { temp?: unknown; humidity?: unknown }; wind?: { speed?: unknown }; rain?: { '1h'?: unknown }; dt?: unknown };
  const temperature = metric(data.main?.temp, -150, 160);
  const humidity = metric(data.main?.humidity, 0, 100);
  if (temperature === null || humidity === null || typeof data.dt !== 'number'
    || !Number.isFinite(data.dt) || data.dt * 1000 > now + 300_000 || data.dt * 1000 < now - 86_400_000) {
    throw new Error('Invalid Weather observation');
  }
  const rain = data.rain?.['1h'] == null ? 0 : metric(data.rain['1h'], 0, 10_000);
  return {
    temperature, humidity,
    windSpeed: metric(data.wind?.speed, 0, 500),
    rainfallInches: rain === null ? null : rain / 25.4,
    recordedAt: new Date(data.dt * 1000).toISOString(),
    frostWarning: temperature < 32, heatWarning: temperature > 90,
    // One dry observation cannot establish drought.
    droughtWarning: false,
    source: 'openweathermap',
  };
}
