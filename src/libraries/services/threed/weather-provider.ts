import 'server-only';
import { normalizeProjectWeather, type ProjectWeatherLocation } from './project-weather-core';

export class WeatherProviderError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export const weatherProviderConfigured = () => Boolean(process.env.OPENWEATHER_API_KEY?.trim());

/** Shared server-only OpenWeatherMap connection for Project Weather and the existing poller. */
export async function fetchWeatherObservation(location: ProjectWeatherLocation) {
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  if (!key) throw new WeatherProviderError('Weather provider is not configured.', 503);
  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.search = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude), units: 'imperial', appid: key }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: 'no-store', redirect: 'error' });
    if (!response.ok || !response.body) throw new Error('Provider unavailable');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 65_536) throw new Error('Response too large');
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return { reading: normalizeProjectWeather(data), rawData: data };
  } catch {
    // Provider errors may include the credential-bearing URL; never forward or log them.
    throw new WeatherProviderError('Weather provider could not be reached or returned an invalid observation. Previous readings are unchanged.', 502);
  }
}

