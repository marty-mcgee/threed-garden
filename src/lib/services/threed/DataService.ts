// lib/services/threed/DataService.ts
import { ThreeDData } from '@/lib/types/threed';

export async function fetchThreeDData(): Promise<ThreeDData> {
  try {
    // Fetch all data sources in parallel
    const [trafficRes, bedsRes, plantsRes, farmbotsRes, weatherRes] = await Promise.all([
      fetch('/api/traffic/all'),
      fetch('/api/threed/beds'),
      fetch('/api/threed/plants'),
      fetch('/api/threed/farmbots'),
      fetch('/api/threed/weather'),
    ]);

    const [traffic, beds, plants, farmbots, weather] = await Promise.all([
      trafficRes.json(),
      bedsRes.json(),
      plantsRes.json(),
      farmbotsRes.json(),
      weatherRes.json(),
    ]);

    return {
      traffic: traffic.data || [],
      beds: beds.data || [],
      plants: plants.data || [],
      farmbots: farmbots.data || [],
      weather: weather.data || null,
    };
  } catch (error) {
    console.error('Error fetching ThreeD data:', error);
    // Return empty data on error
    return {
      traffic: [],
      beds: [],
      plants: [],
      farmbots: [],
      weather: null,
    };
  }
}