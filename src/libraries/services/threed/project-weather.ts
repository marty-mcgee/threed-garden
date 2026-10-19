import 'server-only';
import { fetchWeatherObservation, weatherProviderConfigured, WeatherProviderError } from './weather-provider';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { threedWeatherLogs } from '@/libraries/schema/threed';
import { resolveProjectWeatherLocation, projectWeatherLocation, THREED_WEATHER_LOCATION, weatherLocationSetting, type ProjectWeatherLocation, type ProjectWeatherReading, type ProjectWeatherSnapshot } from './project-weather-core';

export class ProjectWeatherError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// Explicit serialization: provider rawData and owner identifiers never leave this boundary.
export const weatherReadingColumns = {
  id: threedWeatherLogs.id, recordedAt: threedWeatherLogs.recordedAt,
  temperature: threedWeatherLogs.temperature, humidity: threedWeatherLogs.humidity,
  rainfallInches: threedWeatherLogs.rainfallInches, windSpeed: threedWeatherLogs.windSpeed,
  frostWarning: threedWeatherLogs.frostWarning, heatWarning: threedWeatherLogs.heatWarning,
  droughtWarning: threedWeatherLogs.droughtWarning, source: threedWeatherLogs.source,
};

type WeatherRow = Pick<typeof threedWeatherLogs.$inferSelect, keyof typeof weatherReadingColumns>;
export function serializeWeatherReading(row: WeatherRow): ProjectWeatherReading {
  const number = (value: string | null) => value === null || !Number.isFinite(Number(value)) ? null : Number(value);
  return {
    id: row.id, recordedAt: row.recordedAt ?? '',
    temperature: number(row.temperature), humidity: number(row.humidity),
    rainfallInches: number(row.rainfallInches), windSpeed: number(row.windSpeed),
    frostWarning: row.frostWarning === true, heatWarning: row.heatWarning === true,
    droughtWarning: row.droughtWarning === true, source: row.source ?? 'unknown',
  };
}

const ownedProject = (ownerId: string, projectId: number) => and(eq(project.id, projectId), eq(project.userId, ownerId));
function scope(ownerId: string, projectId: number, location: ProjectWeatherLocation) {
  return and(eq(threedWeatherLogs.userId, ownerId),
    sql`${threedWeatherLogs.rawData}->'projectWeather' = ${JSON.stringify({ version: 1, projectId, ...location })}::jsonb`);
}

/** Inherit coordinates from the same owned OpenWeatherMap source used by Weather Logs. */
async function moduleWeatherLocation(ownerId: string, reader: Pick<typeof db, 'select'> = db) {
  const sources = await reader.select({ rawData: threedWeatherLogs.rawData }).from(threedWeatherLogs)
    .where(and(eq(threedWeatherLogs.userId, ownerId), eq(threedWeatherLogs.source, 'openweathermap'),
      sql`${threedWeatherLogs.rawData}->'coord' IS NOT NULL`))
    .orderBy(desc(threedWeatherLogs.recordedAt), desc(threedWeatherLogs.id)).limit(20);
  for (const source of sources) {
    const coord = (source.rawData as { coord?: { lat?: unknown; lon?: unknown } } | null)?.coord;
    const location = projectWeatherLocation(coord?.lat, coord?.lon);
    if (location) return location;
  }
  return THREED_WEATHER_LOCATION;
}

async function projectLocation(ownerId: string, projectId: number) {
  const [record] = await db.select({ latitude: project.originLatitude, longitude: project.originLongitude, metadata: project.metadata })
    .from(project).where(ownedProject(ownerId, projectId)).limit(1);
  if (!record) throw new ProjectWeatherError('Project not found.', 404);
  const resolved = resolveProjectWeatherLocation(record.latitude, record.longitude, record.metadata);
  return resolved.locationSource === 'module'
    ? resolveProjectWeatherLocation(record.latitude, record.longitude, record.metadata, await moduleWeatherLocation(ownerId))
    : resolved;
}

export async function readProjectWeather(ownerId: string, projectId: number): Promise<ProjectWeatherSnapshot> {
  const { location, locationSource } = await projectLocation(ownerId, projectId);
  const rows = location ? await db.select(weatherReadingColumns).from(threedWeatherLogs)
    .where(scope(ownerId, projectId, location)).orderBy(desc(threedWeatherLogs.recordedAt), desc(threedWeatherLogs.id)).limit(20) : [];
  return { projectId, location, locationSource, readings: rows.map(serializeWeatherReading), providerConfigured: weatherProviderConfigured() };
}


const refreshing = new Set<string>();
const COOLDOWN_MS = 300_000;
export async function updateProjectWeather(ownerId: string, projectId: number) {
  const key = `${ownerId}:${projectId}`;
  if (refreshing.has(key) || refreshing.size >= 4) throw new ProjectWeatherError('Weather update is busy. Please retry shortly.', 429);
  refreshing.add(key);
  try {
    const { location } = await projectLocation(ownerId, projectId);
    if (!location) throw new ProjectWeatherError('Set a location in Weather Settings before updating Weather.', 409);
    const latest = async () => db.select({ createdAt: threedWeatherLogs.createdAt }).from(threedWeatherLogs)
      .where(scope(ownerId, projectId, location)).orderBy(desc(threedWeatherLogs.createdAt)).limit(1);
    const [recent] = await latest();
    if (recent?.createdAt && Date.now() - recent.createdAt.getTime() < COOLDOWN_MS) return readProjectWeather(ownerId, projectId);
    const { reading } = await fetchWeatherObservation(location);
    await db.transaction(async tx => {
      const [record] = await tx.select({ latitude: project.originLatitude, longitude: project.originLongitude, metadata: project.metadata }).from(project)
        .where(ownedProject(ownerId, projectId)).for('update');
      if (!record) throw new ProjectWeatherError('Project not found.', 404);
      const resolved = resolveProjectWeatherLocation(record.latitude, record.longitude, record.metadata);
      const current = resolved.locationSource === 'module' ? await moduleWeatherLocation(ownerId, tx) : resolved.location;
      if (!current || current.latitude !== location.latitude || current.longitude !== location.longitude) {
        throw new ProjectWeatherError('Project location changed. Reload Weather and try again.', 409);
      }
      // Serialize inserts across server instances after fetching; never hold a row lock during provider access.
      const [last] = await tx.select({ createdAt: threedWeatherLogs.createdAt }).from(threedWeatherLogs)
        .where(scope(ownerId, projectId, location)).orderBy(desc(threedWeatherLogs.createdAt)).limit(1);
      if (last?.createdAt && Date.now() - last.createdAt.getTime() < COOLDOWN_MS) return;
      const decimal = (value: number | null) => value === null ? null : String(value);
      await tx.insert(threedWeatherLogs).values({ ...reading, userId: ownerId,
        temperature: decimal(reading.temperature), humidity: decimal(reading.humidity),
        windSpeed: decimal(reading.windSpeed), rainfallInches: decimal(reading.rainfallInches),
        rawData: { projectWeather: { version: 1, projectId, ...location } },
      });
    });
    return readProjectWeather(ownerId, projectId);
  } catch (error) {
    if (error instanceof WeatherProviderError) throw new ProjectWeatherError(error.message, error.status);
    throw error;
  } finally { refreshing.delete(key); }
}

export async function readProjectWeatherSettings(ownerId: string, projectId: number) {
  return { projectId, ...await projectLocation(ownerId, projectId), providerConfigured: weatherProviderConfigured() };
}

export async function saveProjectWeatherSettings(ownerId: string, projectId: number, input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ProjectWeatherError('Invalid Weather Settings.', 400);
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some(key => !['expected', 'location'].includes(key))
    || !('expected' in body) || !('location' in body)) throw new ProjectWeatherError('Invalid Weather Settings.', 400);
  const expected = weatherLocationSetting(body.expected), location = weatherLocationSetting(body.location);
  if ((body.expected !== null && !expected) || (body.location !== null && !location)) throw new ProjectWeatherError('Enter valid latitude and longitude.', 400);
  await db.transaction(async tx => {
    const [record] = await tx.select({ metadata: project.metadata }).from(project).where(ownedProject(ownerId, projectId)).for('update');
    if (!record) throw new ProjectWeatherError('Project not found.', 404);
    const metadata = record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata) ? record.metadata as Record<string, unknown> : {};
    if (JSON.stringify(weatherLocationSetting(metadata.weatherLocation)) !== JSON.stringify(expected)) {
      throw new ProjectWeatherError('Weather Settings changed in another window. Reload and review before saving.', 409);
    }
    await tx.update(project).set({ metadata: { ...metadata, weatherLocation: location }, updatedAt: new Date() }).where(ownedProject(ownerId, projectId));
  });
  return readProjectWeatherSettings(ownerId, projectId);
}
