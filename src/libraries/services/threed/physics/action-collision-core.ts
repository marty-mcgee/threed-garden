/** Runtime contact observations only. World effects remain with the target owner. */
export const THREED_ACTION_COLLISION_SAMPLE_EVENT = 'threed-action-collision-sample';
export const ACTION_COLLISION_MAX_SWEEP = 2;
export type ThreeDActionCollisionPointId = 'left-foot' | 'right-foot';

/** Semantic defaults are independent of a particular renderer or physics provider. */
export function defaultKickCollisionPoints(slotName: string): readonly ThreeDActionCollisionPointId[] {
  slotName = slotName.replace(/[-–—_()]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!/^kick\s*$/i.test(slotName.trim()) && !/\b(?:left|right)\s+foot\b|\bkick\b.*\bsoccer(?:ball)?\b|\bsoccer(?:ball)?\b.*\bkick\b/i.test(slotName)
    || /\b(?:header|pass|penalty)\b/i.test(slotName)) return [];
  const left = /\bleft\b/i.test(slotName);
  const right = /\bright\b/i.test(slotName);
  if (left && !right) return ['left-foot'];
  if (right && !left) return ['right-foot'];
  return ['left-foot', 'right-foot'];
}

export type ActionCollisionPosition = Readonly<{ x: number; y: number; z: number }>;
export type ThreeDActionCollisionContext = Readonly<{
  requestId: string;
  projectId: number;
  actorMarkerId: string;
  targetMarkerId: string;
  action: string;
}>;
export type ThreeDActionCollisionSample = ThreeDActionCollisionContext & Readonly<{
  version: 1;
  clipName: string;
  pointId: string;
  sourceNode: string;
  from: ActionCollisionPosition;
  to: ActionCollisionPosition;
  radius: number;
}>;

function validPosition(value: unknown): value is ActionCollisionPosition {
  if (!value || typeof value !== 'object') return false;
  const position = value as Partial<ActionCollisionPosition>;
  return [position.x, position.y, position.z].every(component =>
    typeof component === 'number' && Number.isFinite(component));
}

function validName(value: unknown, limit: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= limit;
}

export function validThreeDActionCollisionSample(value: unknown): value is ThreeDActionCollisionSample {
  if (!value || typeof value !== 'object') return false;
  const sample = value as Partial<ThreeDActionCollisionSample>;
  if (sample.version !== 1
    || typeof sample.requestId !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(sample.requestId)
    || !Number.isSafeInteger(sample.projectId) || Number(sample.projectId) <= 0
    || !validName(sample.actorMarkerId, 200) || !validName(sample.targetMarkerId, 200)
    || !validName(sample.action, 120) || !validName(sample.clipName, 200)
    || !validName(sample.pointId, 80) || !validName(sample.sourceNode, 200)
    || !validPosition(sample.from) || !validPosition(sample.to)
    || typeof sample.radius !== 'number' || !Number.isFinite(sample.radius)
    || sample.radius <= 0 || sample.radius > 1) return false;
  return Math.hypot(sample.to.x - sample.from.x, sample.to.y - sample.from.y,
    sample.to.z - sample.from.z) <= ACTION_COLLISION_MAX_SWEEP;
}

/** Capsule formed by a moving contact point, tested against the live target sphere. */
export function sweptPointHitsSphere(
  sample: ThreeDActionCollisionSample,
  center: ActionCollisionPosition,
  radius: number,
): boolean {
  if (!validThreeDActionCollisionSample(sample) || !validPosition(center)
    || !Number.isFinite(radius) || radius <= 0) return false;
  const dx = sample.to.x - sample.from.x;
  const dy = sample.to.y - sample.from.y;
  const dz = sample.to.z - sample.from.z;
  const lengthSquared = dx * dx + dy * dy + dz * dz;
  const fraction = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((center.x - sample.from.x) * dx + (center.y - sample.from.y) * dy
      + (center.z - sample.from.z) * dz) / lengthSquared));
  const distance = Math.hypot(sample.from.x + dx * fraction - center.x,
    sample.from.y + dy * fraction - center.y, sample.from.z + dz * fraction - center.z);
  return distance <= sample.radius + radius;
}
