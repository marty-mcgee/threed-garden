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

/** Geographic anchor and orientation for one Project ThreeD Scene. */
export interface ThreeDGeographicOrigin {
  latitude: number;
  longitude: number;
  altitude: number;
  /** Clockwise bearing of Scene -Z from geographic north. */
  headingDegrees: number;
  /** Physical metres represented by one local Scene unit. */
  metersPerSceneUnit: number;
}

/** WGS84 position derived from, or resolved into, one Project-local position. */
export interface ThreeDGeographicPosition {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface ThreeDCoordinateCalibrationPoint {
  local: Pick<ThreeDProjectPlanPosition, 'x' | 'z'>;
  geographic: Pick<ThreeDGeographicPosition, 'latitude' | 'longitude'>;
}

export interface ThreeDCoordinateCalibrationInput {
  pointA: ThreeDCoordinateCalibrationPoint;
  pointB: ThreeDCoordinateCalibrationPoint;
  originAltitude?: number;
}

/** ThreeD dimensions and positions use feet: one Scene unit equals one foot. */
export const DEFAULT_THREED_METERS_PER_SCENE_UNIT = 0.3048;

const WGS84_SEMI_MAJOR_AXIS_METERS = 6_378_137;
const WGS84_ECCENTRICITY_SQUARED = 6.69437999014e-3;
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

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

function requireLatitude(value: number, label: string): number {
  const latitude = requireFinite(value, label);
  if (latitude < -90 || latitude > 90) {
    throw new ThreeDMapCoordinateError(`${label} is outside -90..90`);
  }
  return latitude;
}

function requireLongitude(value: number, label: string): number {
  const longitude = requireFinite(value, label);
  if (longitude < -180 || longitude > 180) {
    throw new ThreeDMapCoordinateError(`${label} is outside -180..180`);
  }
  return longitude;
}

function normalizeLongitude(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360;
}

function validateOrigin(origin: ThreeDGeographicOrigin): ThreeDGeographicOrigin {
  const metersPerSceneUnit = requireFinite(
    origin.metersPerSceneUnit,
    'Metres per Scene unit',
  );
  if (metersPerSceneUnit <= 0 || metersPerSceneUnit > 1_000_000) {
    throw new ThreeDMapCoordinateError('Metres per Scene unit must be within 0..1000000');
  }
  return {
    latitude: requireLatitude(origin.latitude, 'Origin latitude'),
    longitude: requireLongitude(origin.longitude, 'Origin longitude'),
    altitude: requireFinite(origin.altitude, 'Origin altitude'),
    headingDegrees: requireFinite(origin.headingDegrees, 'Origin heading'),
    metersPerSceneUnit,
  };
}

function getWgs84Radii(latitudeDegrees: number): {
  meridional: number;
  primeVertical: number;
} {
  const latitudeRadians = latitudeDegrees * DEGREES_TO_RADIANS;
  const sinLatitude = Math.sin(latitudeRadians);
  const denominator = Math.sqrt(
    1 - (WGS84_ECCENTRICITY_SQUARED * sinLatitude * sinLatitude),
  );
  return {
    meridional: (
      WGS84_SEMI_MAJOR_AXIS_METERS
      * (1 - WGS84_ECCENTRICITY_SQUARED)
    ) / (denominator ** 3),
    primeVertical: WGS84_SEMI_MAJOR_AXIS_METERS / denominator,
  };
}


/**
 * Solves one Project origin, heading, and physical scale from two matching
 * local/GPS reference points. This uses the same Project-scale WGS84 tangent
 * plane as the forward and reverse position transforms.
 */
export function calibrateThreeDGeographicOrigin(
  input: ThreeDCoordinateCalibrationInput,
): ThreeDGeographicOrigin {
  const localAX = requireFinite(input.pointA.local.x, 'Point A local X');
  const localAZ = requireFinite(input.pointA.local.z, 'Point A local Z');
  const localBX = requireFinite(input.pointB.local.x, 'Point B local X');
  const localBZ = requireFinite(input.pointB.local.z, 'Point B local Z');
  const latitudeA = requireLatitude(input.pointA.geographic.latitude, 'Point A latitude');
  const longitudeA = requireLongitude(input.pointA.geographic.longitude, 'Point A longitude');
  const latitudeB = requireLatitude(input.pointB.geographic.latitude, 'Point B latitude');
  const longitudeB = requireLongitude(input.pointB.geographic.longitude, 'Point B longitude');
  const localDX = localBX - localAX;
  const localDZ = localBZ - localAZ;
  const localDistance = Math.hypot(localDX, localDZ);
  if (localDistance < 1e-6) {
    throw new ThreeDMapCoordinateError('Calibration local points must be distinct');
  }

  const referenceLatitude = (latitudeA + latitudeB) / 2;
  const radii = getWgs84Radii(referenceLatitude);
  const northMeters = (
    (latitudeB - latitudeA) * DEGREES_TO_RADIANS * radii.meridional
  );
  const eastMeters = (
    normalizeLongitude(longitudeB - longitudeA)
    * DEGREES_TO_RADIANS
    * radii.primeVertical
    * Math.cos(referenceLatitude * DEGREES_TO_RADIANS)
  );
  const geographicDistance = Math.hypot(eastMeters, northMeters);
  if (geographicDistance < 0.01) {
    throw new ThreeDMapCoordinateError('Calibration GPS points must be distinct');
  }

  const metersPerSceneUnit = geographicDistance / localDistance;
  // Three.js ground-plane convention: +X is right/east and -Z is forward/north.
  const localBearing = Math.atan2(localDX, -localDZ);
  const geographicBearing = Math.atan2(eastMeters, northMeters);
  const headingDegrees = normalizeHeading(
    (geographicBearing - localBearing) * RADIANS_TO_DEGREES,
  );
  const heading = headingDegrees * DEGREES_TO_RADIANS;
  const pointAEastMeters = metersPerSceneUnit * (
    (localAX * Math.cos(heading)) - (localAZ * Math.sin(heading))
  );
  const pointANorthMeters = metersPerSceneUnit * (
    (-localAX * Math.sin(heading)) - (localAZ * Math.cos(heading))
  );

  let originLatitude = latitudeA;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const originRadii = getWgs84Radii(originLatitude);
    originLatitude = latitudeA - (
      (pointANorthMeters / originRadii.meridional) * RADIANS_TO_DEGREES
    );
  }
  const originRadii = getWgs84Radii(originLatitude);
  const longitudeScale = originRadii.primeVertical
    * Math.cos(originLatitude * DEGREES_TO_RADIANS);
  if (Math.abs(longitudeScale) < 1e-6) {
    throw new ThreeDMapCoordinateError('Project origins at the geographic poles are unsupported');
  }
  const originLongitude = normalizeLongitude(
    longitudeA - ((pointAEastMeters / longitudeScale) * RADIANS_TO_DEGREES),
  );

  return validateOrigin({
    latitude: originLatitude,
    longitude: originLongitude,
    altitude: requireFinite(input.originAltitude ?? 0, 'Origin altitude'),
    headingDegrees,
    metersPerSceneUnit,
  });
}

/**
 * Converts Project-local coordinates into WGS84 latitude/longitude/altitude.
 * This tangent-plane calculation is for Project-scale Scenes, not long-range
 * navigation.
 */
export function projectLocalPositionToGeographicPosition(
  position: ThreeDProjectPlanPosition,
  rawOrigin: ThreeDGeographicOrigin,
): ThreeDGeographicPosition {
  const origin = validateOrigin(rawOrigin);
  const xMeters = requireFinite(position.x, 'Project X') * origin.metersPerSceneUnit;
  const yMeters = requireFinite(position.y, 'Project Y') * origin.metersPerSceneUnit;
  const zMeters = requireFinite(position.z, 'Project Z') * origin.metersPerSceneUnit;
  const heading = origin.headingDegrees * DEGREES_TO_RADIANS;
  const eastMeters = (xMeters * Math.cos(heading)) - (zMeters * Math.sin(heading));
  const northMeters = (-xMeters * Math.sin(heading)) - (zMeters * Math.cos(heading));
  const radii = getWgs84Radii(origin.latitude);
  const originLatitudeRadians = origin.latitude * DEGREES_TO_RADIANS;
  const longitudeScale = radii.primeVertical * Math.cos(originLatitudeRadians);
  if (Math.abs(longitudeScale) < 1e-6) {
    throw new ThreeDMapCoordinateError('Project origins at the geographic poles are unsupported');
  }
  const latitude = origin.latitude + ((northMeters / radii.meridional) * RADIANS_TO_DEGREES);
  const longitude = normalizeLongitude(
    origin.longitude + ((eastMeters / longitudeScale) * RADIANS_TO_DEGREES),
  );

  return {
    latitude: requireLatitude(latitude, 'Calculated latitude'),
    longitude: requireLongitude(longitude, 'Calculated longitude'),
    altitude: origin.altitude + yMeters,
  };
}

/** Resolves a WGS84 position into the matching Project-local coordinates. */
export function geographicPositionToProjectLocalPosition(
  position: ThreeDGeographicPosition,
  rawOrigin: ThreeDGeographicOrigin,
): ThreeDProjectPlanPosition {
  const origin = validateOrigin(rawOrigin);
  const latitude = requireLatitude(position.latitude, 'Marker latitude');
  const longitude = requireLongitude(position.longitude, 'Marker longitude');
  const altitude = requireFinite(position.altitude, 'Marker altitude');
  const radii = getWgs84Radii(origin.latitude);
  const originLatitudeRadians = origin.latitude * DEGREES_TO_RADIANS;
  const longitudeScale = radii.primeVertical * Math.cos(originLatitudeRadians);
  if (Math.abs(longitudeScale) < 1e-6) {
    throw new ThreeDMapCoordinateError('Project origins at the geographic poles are unsupported');
  }
  const northMeters = (
    (latitude - origin.latitude) * DEGREES_TO_RADIANS * radii.meridional
  );
  const eastMeters = (
    normalizeLongitude(longitude - origin.longitude)
    * DEGREES_TO_RADIANS
    * longitudeScale
  );
  const heading = origin.headingDegrees * DEGREES_TO_RADIANS;

  return {
    x: (
      (eastMeters * Math.cos(heading)) - (northMeters * Math.sin(heading))
    ) / origin.metersPerSceneUnit,
    y: (altitude - origin.altitude) / origin.metersPerSceneUnit,
    z: (
      (-eastMeters * Math.sin(heading)) - (northMeters * Math.cos(heading))
    ) / origin.metersPerSceneUnit,
  };
}

function mapCenterToDefaultOrigin(center: ThreeDMapCenter): ThreeDGeographicOrigin {
  return {
    latitude: center.lat,
    longitude: center.lng,
    altitude: 0,
    headingDegrees: 0,
    metersPerSceneUnit: DEFAULT_THREED_METERS_PER_SCENE_UNIT,
  };
}

/** Backward-compatible Leaflet adapter until Project origin persistence lands. */
export function projectPlanPositionToMapPosition(
  position: ThreeDProjectPlanPosition,
  center: ThreeDMapCenter,
): ThreeDMapPosition {
  const geographic = projectLocalPositionToGeographicPosition(
    position,
    mapCenterToDefaultOrigin(center),
  );
  return { lat: geographic.latitude, lng: geographic.longitude };
}

/** Backward-compatible Leaflet adapter until Project origin persistence lands. */
export function mapPositionToProjectPlanPosition(
  position: ThreeDMapPosition,
  center: ThreeDMapCenter,
  y = 0,
): ThreeDProjectPlanPosition {
  return geographicPositionToProjectLocalPosition({
    latitude: position.lat,
    longitude: position.lng,
    altitude: requireFinite(y, 'Project Y') * DEFAULT_THREED_METERS_PER_SCENE_UNIT,
  }, mapCenterToDefaultOrigin(center));
}
