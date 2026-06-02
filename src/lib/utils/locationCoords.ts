// Create a mapping file: src/lib/utils/locationCoords.ts
export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Ukiah': { lat: 39.150, lng: -123.207 },
  'Humboldt': { lat: 40.745, lng: -124.010 },
  'Garberville': { lat: 40.100, lng: -123.795 },
  'Clear Lake': { lat: 38.958, lng: -122.626 },
  'Crescent City': { lat: 41.756, lng: -124.202 },
  'HM': { lat: 40.745, lng: -124.010 },
};

// In your poller, use city as fallback
const coords = cityCoordinates[city] || cityCoordinates[center.name] || null;