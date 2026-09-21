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

export interface ThreeDCoordinateCalibrationResult extends ThreeDGeographicOrigin {
  diagnostics: {
    localDistanceUnits: number;
    geographicDistanceMeters: number;
    referenceErrorMeters: number;
  };
}

/** ThreeD dimensions and positions use feet: one Scene unit equals one foot. */
export const DEFAULT_THREED_METERS_PER_SCENE_UNIT = 0.3048;

const WGS84_SEMI_MAJOR_AXIS_METERS = 6_378_137;
const WGS84_FLATTENING = 1 / 298.257223563;
const WGS84_SEMI_MINOR_AXIS_METERS = WGS84_SEMI_MAJOR_AXIS_METERS
  * (1 - WGS84_FLATTENING);
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;
const VINCENTY_ITERATION_LIMIT = 100;
const VINCENTY_TOLERANCE = 1e-12;

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

interface Wgs84GeodesicVector {
  distanceMeters: number;
  initialBearingRadians: number;
}

function calculateWgs84GeodesicVector(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): Wgs84GeodesicVector {
  const phi1 = latitudeA * DEGREES_TO_RADIANS;
  const phi2 = latitudeB * DEGREES_TO_RADIANS;
  const reducedLatitude1 = Math.atan((1 - WGS84_FLATTENING) * Math.tan(phi1));
  const reducedLatitude2 = Math.atan((1 - WGS84_FLATTENING) * Math.tan(phi2));
  const sinU1 = Math.sin(reducedLatitude1);
  const cosU1 = Math.cos(reducedLatitude1);
  const sinU2 = Math.sin(reducedLatitude2);
  const cosU2 = Math.cos(reducedLatitude2);
  const longitudeDifference = normalizeLongitude(longitudeB - longitudeA)
    * DEGREES_TO_RADIANS;
  let lambda = longitudeDifference;
  let sinSigma = 0;
  let cosSigma = 1;
  let sigma = 0;
  let sinAlpha = 0;
  let cosSquaredAlpha = 1;
  let cosTwoSigmaM = 0;
  let converged = false;

  for (let iteration = 0; iteration < VINCENTY_ITERATION_LIMIT; iteration += 1) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    const first = cosU2 * sinLambda;
    const second = (cosU1 * sinU2) - (sinU1 * cosU2 * cosLambda);
    sinSigma = Math.hypot(first, second);
    if (sinSigma === 0) return { distanceMeters: 0, initialBearingRadians: 0 };
    cosSigma = (sinU1 * sinU2) + (cosU1 * cosU2 * cosLambda);
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSquaredAlpha = 1 - (sinAlpha * sinAlpha);
    cosTwoSigmaM = cosSquaredAlpha > Number.EPSILON
      ? cosSigma - ((2 * sinU1 * sinU2) / cosSquaredAlpha)
      : 0;
    const coefficient = (WGS84_FLATTENING / 16) * cosSquaredAlpha
      * (4 + (WGS84_FLATTENING * (4 - (3 * cosSquaredAlpha))));
    const previousLambda = lambda;
    lambda = longitudeDifference + ((1 - coefficient) * WGS84_FLATTENING * sinAlpha * (
      sigma + (coefficient * sinSigma * (
        cosTwoSigmaM + (coefficient * cosSigma * (-1 + (2 * cosTwoSigmaM * cosTwoSigmaM)))
      ))
    ));
    if (Math.abs(lambda - previousLambda) <= VINCENTY_TOLERANCE) {
      converged = true;
      break;
    }
  }
  if (!converged) {
    throw new ThreeDMapCoordinateError('WGS84 coordinate calculation did not converge');
  }

  const reducedAxis = cosSquaredAlpha * (
    ((WGS84_SEMI_MAJOR_AXIS_METERS ** 2) - (WGS84_SEMI_MINOR_AXIS_METERS ** 2))
    / (WGS84_SEMI_MINOR_AXIS_METERS ** 2)
  );
  const coefficientA = 1 + ((reducedAxis / 16384) * (
    4096 + (reducedAxis * (-768 + (reducedAxis * (320 - (175 * reducedAxis)))))
  ));
  const coefficientB = (reducedAxis / 1024) * (
    256 + (reducedAxis * (-128 + (reducedAxis * (74 - (47 * reducedAxis)))))
  );
  const deltaSigma = coefficientB * sinSigma * (
    cosTwoSigmaM + ((coefficientB / 4) * (
      (cosSigma * (-1 + (2 * cosTwoSigmaM * cosTwoSigmaM)))
      - ((coefficientB / 6) * cosTwoSigmaM
        * (-3 + (4 * sinSigma * sinSigma))
        * (-3 + (4 * cosTwoSigmaM * cosTwoSigmaM)))
    ))
  );
  const initialBearingRadians = Math.atan2(
    cosU2 * Math.sin(lambda),
    (cosU1 * sinU2) - (sinU1 * cosU2 * Math.cos(lambda)),
  );
  return {
    distanceMeters: WGS84_SEMI_MINOR_AXIS_METERS * coefficientA * (sigma - deltaSigma),
    initialBearingRadians,
  };
}

function projectWgs84GeodesicPosition(
  latitude: number,
  longitude: number,
  initialBearingRadians: number,
  distanceMeters: number,
): ThreeDMapPosition {
  if (distanceMeters === 0) return { lat: latitude, lng: longitude };
  const phi1 = latitude * DEGREES_TO_RADIANS;
  const reducedLatitude1 = Math.atan((1 - WGS84_FLATTENING) * Math.tan(phi1));
  const sinU1 = Math.sin(reducedLatitude1);
  const cosU1 = Math.cos(reducedLatitude1);
  const sinBearing = Math.sin(initialBearingRadians);
  const cosBearing = Math.cos(initialBearingRadians);
  const sigma1 = Math.atan2(Math.tan(reducedLatitude1), cosBearing);
  const sinAlpha = cosU1 * sinBearing;
  const cosSquaredAlpha = 1 - (sinAlpha * sinAlpha);
  const reducedAxis = cosSquaredAlpha * (
    ((WGS84_SEMI_MAJOR_AXIS_METERS ** 2) - (WGS84_SEMI_MINOR_AXIS_METERS ** 2))
    / (WGS84_SEMI_MINOR_AXIS_METERS ** 2)
  );
  const coefficientA = 1 + ((reducedAxis / 16384) * (
    4096 + (reducedAxis * (-768 + (reducedAxis * (320 - (175 * reducedAxis)))))
  ));
  const coefficientB = (reducedAxis / 1024) * (
    256 + (reducedAxis * (-128 + (reducedAxis * (74 - (47 * reducedAxis)))))
  );
  let sigma = distanceMeters / (WGS84_SEMI_MINOR_AXIS_METERS * coefficientA);

  for (let iteration = 0; iteration < VINCENTY_ITERATION_LIMIT; iteration += 1) {
    const cosTwoSigmaM = Math.cos((2 * sigma1) + sigma);
    const sinSigma = Math.sin(sigma);
    const cosSigma = Math.cos(sigma);
    const deltaSigma = coefficientB * sinSigma * (
      cosTwoSigmaM + ((coefficientB / 4) * (
        (cosSigma * (-1 + (2 * cosTwoSigmaM * cosTwoSigmaM)))
        - ((coefficientB / 6) * cosTwoSigmaM
          * (-3 + (4 * sinSigma * sinSigma))
          * (-3 + (4 * cosTwoSigmaM * cosTwoSigmaM)))
      ))
    );
    const nextSigma = (distanceMeters / (WGS84_SEMI_MINOR_AXIS_METERS * coefficientA))
      + deltaSigma;
    if (Math.abs(nextSigma - sigma) <= VINCENTY_TOLERANCE) {
      sigma = nextSigma;
      break;
    }
    sigma = nextSigma;
    if (iteration === VINCENTY_ITERATION_LIMIT - 1) {
      throw new ThreeDMapCoordinateError('WGS84 coordinate projection did not converge');
    }
  }

  const sinSigma = Math.sin(sigma);
  const cosSigma = Math.cos(sigma);
  const temporary = (sinU1 * sinSigma) - (cosU1 * cosSigma * cosBearing);
  const latitude2 = Math.atan2(
    (sinU1 * cosSigma) + (cosU1 * sinSigma * cosBearing),
    (1 - WGS84_FLATTENING) * Math.hypot(sinAlpha, temporary),
  );
  const lambda = Math.atan2(
    sinSigma * sinBearing,
    (cosU1 * cosSigma) - (sinU1 * sinSigma * cosBearing),
  );
  const cosTwoSigmaM = Math.cos((2 * sigma1) + sigma);
  const coefficient = (WGS84_FLATTENING / 16) * cosSquaredAlpha
    * (4 + (WGS84_FLATTENING * (4 - (3 * cosSquaredAlpha))));
  const longitudeCorrection = (1 - coefficient) * WGS84_FLATTENING * sinAlpha * (
    sigma + (coefficient * sinSigma * (
      cosTwoSigmaM + (coefficient * cosSigma * (-1 + (2 * cosTwoSigmaM * cosTwoSigmaM)))
    ))
  );
  return {
    lat: latitude2 * RADIANS_TO_DEGREES,
    lng: normalizeLongitude(longitude + ((lambda - longitudeCorrection) * RADIANS_TO_DEGREES)),
  };
}


/**
 * Solves one Project origin, heading, and physical scale from two matching
 * local/GPS reference points using the same ellipsoidal WGS84 calculation as
 * the forward and reverse position transforms.
 */
export function calibrateThreeDGeographicOrigin(
  input: ThreeDCoordinateCalibrationInput,
): ThreeDCoordinateCalibrationResult {
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

  const geographicVector = calculateWgs84GeodesicVector(
    latitudeA,
    longitudeA,
    latitudeB,
    longitudeB,
  );
  const geographicDistance = geographicVector.distanceMeters;
  if (geographicDistance < 0.01) {
    throw new ThreeDMapCoordinateError('Calibration GPS points must be distinct');
  }

  const metersPerSceneUnit = geographicDistance / localDistance;
  // Three.js ground-plane convention: +X is right/east and -Z is forward/north.
  const localBearing = Math.atan2(localDX, -localDZ);
  const geographicBearing = geographicVector.initialBearingRadians;
  const headingDegrees = normalizeHeading(
    (geographicBearing - localBearing) * RADIANS_TO_DEGREES,
  );
  const pointALocalBearing = Math.atan2(localAX, -localAZ);
  const pointADistance = Math.hypot(localAX, localAZ) * metersPerSceneUnit;
  const solvedOrigin = projectWgs84GeodesicPosition(
    latitudeA,
    longitudeA,
    pointALocalBearing + (headingDegrees * DEGREES_TO_RADIANS) + Math.PI,
    pointADistance,
  );

  const origin = validateOrigin({
    latitude: solvedOrigin.lat,
    longitude: solvedOrigin.lng,
    altitude: requireFinite(input.originAltitude ?? 0, 'Origin altitude'),
    headingDegrees,
    metersPerSceneUnit,
  });
  const projectedPointB = projectLocalPositionToGeographicPosition(
    { x: localBX, y: 0, z: localBZ },
    origin,
  );
  const referenceError = calculateWgs84GeodesicVector(
    projectedPointB.latitude,
    projectedPointB.longitude,
    latitudeB,
    longitudeB,
  ).distanceMeters;
  return {
    ...origin,
    diagnostics: {
      localDistanceUnits: localDistance,
      geographicDistanceMeters: geographicDistance,
      referenceErrorMeters: referenceError,
    },
  };
}

/**
 * Converts Project-local coordinates into WGS84 latitude/longitude/altitude.
 * Horizontal distance and bearing use the WGS84 ellipsoid. Vertical position
 * remains Project-local because calibration references do not include altitude.
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
  const horizontalDistance = Math.hypot(eastMeters, northMeters);
  const projected = projectWgs84GeodesicPosition(
    origin.latitude,
    origin.longitude,
    Math.atan2(eastMeters, northMeters),
    horizontalDistance,
  );

  return {
    latitude: requireLatitude(projected.lat, 'Calculated latitude'),
    longitude: requireLongitude(projected.lng, 'Calculated longitude'),
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
  const geographicVector = calculateWgs84GeodesicVector(
    origin.latitude,
    origin.longitude,
    latitude,
    longitude,
  );
  const eastMeters = geographicVector.distanceMeters
    * Math.sin(geographicVector.initialBearingRadians);
  const northMeters = geographicVector.distanceMeters
    * Math.cos(geographicVector.initialBearingRadians);
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
