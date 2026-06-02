// src/lib/utils/cityGeocoder.ts
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

// In-memory cache for city coordinates
const cityCache: Record<string, { lat: number; lng: number }> = {};

async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  if (!city || city === 'HM' || city === 'UNKNOWN') return null;
  
  // Check cache first
  if (cityCache[city]) return cityCache[city];
  
  const query = `${city}, California, USA`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  
  try {
    // Rate limit: 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MCNews-Traffic-App/1.0' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data && data[0]) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      cityCache[city] = coords;
      console.log(`  Geocoded city: ${city} → (${coords.lat}, ${coords.lng})`);
      return coords;
    }
    return null;
  } catch (error) {
    console.error(`  Geocoding failed for ${city}:`, error);
    return null;
  }
}

// Predefined fallback coordinates for known cities (no API call needed)
export const fallbackCoords: Record<string, { lat: number; lng: number }> = {
  'Ukiah': { lat: 39.150, lng: -123.207 },
  'Humboldt': { lat: 40.745, lng: -124.010 },
  'Garberville': { lat: 40.100, lng: -123.795 },
  'Clear Lake': { lat: 38.958, lng: -122.626 },
  'Crescent City': { lat: 41.756, lng: -124.202 },
  'Willits': { lat: 39.410, lng: -123.355 },
  'Fort Bragg': { lat: 39.445, lng: -123.805 },
  'Eureka': { lat: 40.802, lng: -124.163 },
};

export async function getCityCoordinates(city: string): Promise<{ lat: number; lng: number } | null> {
  // First check fallback coordinates
  if (fallbackCoords[city]) {
    return fallbackCoords[city];
  }
  
  // Then try geocoding
  return await geocodeCity(city);
}