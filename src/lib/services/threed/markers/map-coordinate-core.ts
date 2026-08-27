export interface ThreeDMapCenter {
  lat: number;
  lng: number;
}

export interface ThreeDProjectPlanPosition {
  x: number;
  y: number;
  z: number;
}

export interface ThreeDMapPosition {
  lat: number;
  lng: number;
}

/** Existing Dashboard projection: one ThreeD Scene unit is about 11 metres. */
export const THREED_MAP_DEGREES_PER_UNIT = 0.0001;

export class ThreeDMapCoordinateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThreeDMapCoordinateError';
  }
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new ThreeDMapCoordinateError(`${label} must be finite`);
  }
  return value;
}

function validateCenter(center: ThreeDMapCenter): ThreeDMapCenter {
  const lat = requireFinite(center.lat, 'Map center latitude');
  const lng = requireFinite(center.lng, 'Map center longitude');
  if (lat < -90 || lat > 90) {
    throw new ThreeDMapCoordinateError('Map center latitude is outside -90..90');
  }
  if (lng < -180 || lng > 180) {
    throw new ThreeDMapCoordinateError('Map center longitude is outside -180..180');
  }
  return { lat, lng };
}

export function projectPlanPositionToMapPosition(
  position: ThreeDProjectPlanPosition,
  center: ThreeDMapCenter,
): ThreeDMapPosition {
  const validCenter = validateCenter(center);
  const x = requireFinite(position.x, 'Project X');
  const z = requireFinite(position.z, 'Project Z');
  return {
    lat: validCenter.lat + (z * THREED_MAP_DEGREES_PER_UNIT),
    lng: validCenter.lng + (x * THREED_MAP_DEGREES_PER_UNIT),
  };
}

export function mapPositionToProjectPlanPosition(
  position: ThreeDMapPosition,
  center: ThreeDMapCenter,
  y = 0,
): ThreeDProjectPlanPosition {
  const validCenter = validateCenter(center);
  const lat = requireFinite(position.lat, 'Map latitude');
  const lng = requireFinite(position.lng, 'Map longitude');
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new ThreeDMapCoordinateError('Map position is outside valid latitude/longitude bounds');
  }
  return {
    x: (lng - validCenter.lng) / THREED_MAP_DEGREES_PER_UNIT,
    y: requireFinite(y, 'Project Y'),
    z: (lat - validCenter.lat) / THREED_MAP_DEGREES_PER_UNIT,
  };
}
