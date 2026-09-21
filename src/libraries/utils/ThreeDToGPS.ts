// lib/utils/ThreeDToGPS.ts

// ✅ Default GPS center for ThreeD garden (can be configured per project)
const DEFAULT_GPS_CENTER = {
  lat: 39.514719,  // Fort Bragg default
  lng: -123.760382,
};

// ✅ Scale factor for 3D coordinates to GPS degrees
// 1 unit in 3D space ≈ 0.001 degrees GPS (roughly 100 meters)
const SCALE_FACTOR = 0.001;

// ✅ Convert 3D position to GPS coordinates
export function threeDToGPS(
  x: number, 
  z: number, 
  center?: { lat: number; lng: number }
): { lat: number; lng: number } {
  const centerLat = center?.lat || DEFAULT_GPS_CENTER.lat;
  const centerLng = center?.lng || DEFAULT_GPS_CENTER.lng;
  
  return {
    lat: centerLat + (z * SCALE_FACTOR), // z maps to latitude
    lng: centerLng + (x * SCALE_FACTOR), // x maps to longitude
  };
}

// ✅ Convert GPS coordinates to 3D position
export function gpsToThreeD(
  lat: number, 
  lng: number, 
  center?: { lat: number; lng: number }
): { x: number; z: number } {
  const centerLat = center?.lat || DEFAULT_GPS_CENTER.lat;
  const centerLng = center?.lng || DEFAULT_GPS_CENTER.lng;
  
  return {
    x: (lng - centerLng) / SCALE_FACTOR,
    z: (lat - centerLat) / SCALE_FACTOR,
  };
}

// ✅ Get default ThreeD center (can be overridden by project config)
export function getThreeDCenter(projectConfig?: any): { lat: number; lng: number } {
  if (projectConfig?.gpsCenter) {
    return {
      lat: projectConfig.gpsCenter.lat,
      lng: projectConfig.gpsCenter.lng,
    };
  }
  return DEFAULT_GPS_CENTER;
}