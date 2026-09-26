import {
  createThreeDRuntimeMarkerKey,
  normalizeThreeDRuntimeMarkerModuleType,
  type ThreeDPosition,
  type ThreeDRuntimeMarkerIdentity,
} from '../markers/runtime-marker-core';

export const THREED_PHYSICS_EVENT_VERSION = 1 as const;

export const THREED_PHYSICS_EVENT_KINDS = [
  'sensor-enter',
  'sensor-exit',
  'contact-start',
  'contact-end',
  'impact',
  'rest',
  'wake',
] as const;

export type ThreeDPhysicsEventKind = typeof THREED_PHYSICS_EVENT_KINDS[number];

export interface ThreeDPhysicsEventV1 {
  version: typeof THREED_PHYSICS_EVENT_VERSION;
  projectId: number;
  sceneEventId: string;
  kind: ThreeDPhysicsEventKind;
  source: ThreeDRuntimeMarkerIdentity;
  target?: ThreeDRuntimeMarkerIdentity;
  occurredAt: string;
  magnitude?: number;
  point?: ThreeDPosition;
  tags?: readonly string[];
  sensor?: Readonly<{ ownerMarkerId: number; id: string }>;
}

export interface ThreeDPhysicsEventInput {
  projectId: unknown;
  sceneEventId: unknown;
  kind: unknown;
  source: unknown;
  target?: unknown;
  occurredAt: unknown;
  magnitude?: unknown;
  point?: unknown;
  tags?: unknown;
  sensor?: unknown;
}

export interface ThreeDPhysicsEventIdInput {
  projectId: number;
  kind: ThreeDPhysicsEventKind;
  source: ThreeDRuntimeMarkerIdentity;
  target?: ThreeDRuntimeMarkerIdentity;
  occurredAt: string;
  sequence: number;
}

export type ThreeDPhysicsEventErrorCode =
  | 'invalid_project_id'
  | 'invalid_scene_event_id'
  | 'invalid_kind'
  | 'invalid_identity'
  | 'invalid_occurred_at'
  | 'invalid_magnitude'
  | 'invalid_point'
  | 'invalid_tags'
  | 'invalid_sensor'
  | 'invalid_buffer_options';

export class ThreeDPhysicsEventError extends Error {
  readonly code: ThreeDPhysicsEventErrorCode;

  constructor(code: ThreeDPhysicsEventErrorCode) {
    super(code);
    this.name = 'ThreeDPhysicsEventError';
    this.code = code;
  }
}

const MAX_SCENE_EVENT_ID_LENGTH = 280;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 40;
const MAX_ABSOLUTE_POSITION = 1_000_000;
const MAX_MAGNITUDE = 1_000_000;
const MIN_EVENT_TIME_MS = Date.UTC(2000, 0, 1);
const MAX_EVENT_TIME_MS = Date.UTC(2200, 0, 1);
const SCENE_EVENT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:._-]*$/;
const TAG_PATTERN = /^[a-z0-9][a-z0-9:_-]*$/;

function positiveSafeInteger(value: unknown, code: ThreeDPhysicsEventErrorCode): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new ThreeDPhysicsEventError(code);
  }
  return Number(value);
}

function normalizeIdentity(value: unknown): ThreeDRuntimeMarkerIdentity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ThreeDPhysicsEventError('invalid_identity');
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.moduleType !== 'string') {
    throw new ThreeDPhysicsEventError('invalid_identity');
  }
  const moduleType = normalizeThreeDRuntimeMarkerModuleType(candidate.moduleType);
  if (!moduleType) throw new ThreeDPhysicsEventError('invalid_identity');
  const assetId = positiveSafeInteger(candidate.assetId, 'invalid_identity');
  return Object.freeze({ moduleType, assetId });
}

function normalizeTime(value: unknown): string {
  if (typeof value !== 'string' || value.length > 40) {
    throw new ThreeDPhysicsEventError('invalid_occurred_at');
  }
  const milliseconds = Date.parse(value);
  if (
    !Number.isFinite(milliseconds)
    || milliseconds < MIN_EVENT_TIME_MS
    || milliseconds > MAX_EVENT_TIME_MS
  ) {
    throw new ThreeDPhysicsEventError('invalid_occurred_at');
  }
  return new Date(milliseconds).toISOString();
}

function normalizePoint(value: unknown): Readonly<ThreeDPosition> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ThreeDPhysicsEventError('invalid_point');
  }
  const candidate = value as Record<string, unknown>;
  const point = {
    x: candidate.x,
    y: candidate.y,
    z: candidate.z,
  };
  if (Object.values(point).some((coordinate) => (
    typeof coordinate !== 'number'
    || !Number.isFinite(coordinate)
    || Math.abs(coordinate) > MAX_ABSOLUTE_POSITION
  ))) {
    throw new ThreeDPhysicsEventError('invalid_point');
  }
  return Object.freeze(point as ThreeDPosition);
}

function normalizeTags(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length > MAX_TAGS) {
    throw new ThreeDPhysicsEventError('invalid_tags');
  }
  const tags = value.map((tag) => {
    if (
      typeof tag !== 'string'
      || tag.length === 0
      || tag.length > MAX_TAG_LENGTH
      || !TAG_PATTERN.test(tag)
    ) {
      throw new ThreeDPhysicsEventError('invalid_tags');
    }
    return tag;
  });
  if (new Set(tags).size !== tags.length) {
    throw new ThreeDPhysicsEventError('invalid_tags');
  }
  return Object.freeze([...tags]);
}

function normalizeSensor(value: unknown): Readonly<{ ownerMarkerId: number; id: string }> {
  if (!value || typeof value !== 'object') throw new ThreeDPhysicsEventError('invalid_sensor');
  const sensor = value as Record<string, unknown>;
  const ownerMarkerId = positiveSafeInteger(sensor.ownerMarkerId, 'invalid_sensor');
  if (typeof sensor.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(sensor.id)) throw new ThreeDPhysicsEventError('invalid_sensor');
  return Object.freeze({ ownerMarkerId, id: sensor.id });
}

export function normalizeThreeDPhysicsEvent(
  input: ThreeDPhysicsEventInput,
): Readonly<ThreeDPhysicsEventV1> {
  const projectId = positiveSafeInteger(input.projectId, 'invalid_project_id');
  if (
    typeof input.sceneEventId !== 'string'
    || input.sceneEventId.length === 0
    || input.sceneEventId.length > MAX_SCENE_EVENT_ID_LENGTH
    || !SCENE_EVENT_ID_PATTERN.test(input.sceneEventId)
  ) {
    throw new ThreeDPhysicsEventError('invalid_scene_event_id');
  }
  if (
    typeof input.kind !== 'string'
    || !THREED_PHYSICS_EVENT_KINDS.includes(input.kind as ThreeDPhysicsEventKind)
  ) {
    throw new ThreeDPhysicsEventError('invalid_kind');
  }
  const source = normalizeIdentity(input.source);
  const target = input.target === undefined ? undefined : normalizeIdentity(input.target);
  const occurredAt = normalizeTime(input.occurredAt);
  let magnitude: number | undefined;
  if (input.magnitude !== undefined) {
    if (
      typeof input.magnitude !== 'number'
      || !Number.isFinite(input.magnitude)
      || input.magnitude < 0
      || input.magnitude > MAX_MAGNITUDE
    ) {
      throw new ThreeDPhysicsEventError('invalid_magnitude');
    }
    magnitude = input.magnitude;
  }

  return Object.freeze({
    version: THREED_PHYSICS_EVENT_VERSION,
    projectId,
    sceneEventId: input.sceneEventId,
    kind: input.kind as ThreeDPhysicsEventKind,
    source,
    ...(target ? { target } : {}),
    occurredAt,
    ...(magnitude !== undefined ? { magnitude } : {}),
    ...(input.point !== undefined ? { point: normalizePoint(input.point) } : {}),
    ...(input.sensor !== undefined ? { sensor: normalizeSensor(input.sensor) } : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
  });
}

export function createThreeDPhysicsEventId(input: ThreeDPhysicsEventIdInput): string {
  const projectId = positiveSafeInteger(input.projectId, 'invalid_project_id');
  if (!THREED_PHYSICS_EVENT_KINDS.includes(input.kind)) {
    throw new ThreeDPhysicsEventError('invalid_kind');
  }
  const source = normalizeIdentity(input.source);
  const target = input.target ? normalizeIdentity(input.target) : undefined;
  const occurredAt = normalizeTime(input.occurredAt);
  const sequence = positiveSafeInteger(input.sequence, 'invalid_scene_event_id');
  const targetKey = target ? createThreeDRuntimeMarkerKey(target) : 'none';
  return [
    'physics',
    projectId,
    input.kind,
    createThreeDRuntimeMarkerKey(source),
    targetKey,
    Date.parse(occurredAt),
    sequence,
  ].join(':');
}

export interface ThreeDPhysicsEventBufferOptions {
  capacity?: number;
  minimumIntervalMs?: number;
}

export type ThreeDPhysicsEventAppendResult =
  | { status: 'accepted'; event: Readonly<ThreeDPhysicsEventV1> }
  | { status: 'duplicate'; event: Readonly<ThreeDPhysicsEventV1> }
  | { status: 'rate-limited'; event: Readonly<ThreeDPhysicsEventV1> };

function eventSignature(event: ThreeDPhysicsEventV1): string {
  return [
    event.projectId,
    event.kind,
    createThreeDRuntimeMarkerKey(event.source),
    event.target ? createThreeDRuntimeMarkerKey(event.target) : 'none',
    event.sensor ? `${event.sensor.ownerMarkerId}:${event.sensor.id}` : '',
  ].join(':');
}

export class ThreeDPhysicsEventBuffer {
  private readonly capacity: number;
  private readonly minimumIntervalMs: number;
  private events: Readonly<ThreeDPhysicsEventV1>[] = [];
  private eventIds = new Set<string>();
  private latestTimes = new Map<string, number>();

  constructor(options: ThreeDPhysicsEventBufferOptions = {}) {
    const capacity = options.capacity ?? 256;
    const minimumIntervalMs = options.minimumIntervalMs ?? 16;
    if (
      !Number.isSafeInteger(capacity)
      || capacity < 1
      || capacity > 2_048
      || !Number.isSafeInteger(minimumIntervalMs)
      || minimumIntervalMs < 0
      || minimumIntervalMs > 60_000
    ) {
      throw new ThreeDPhysicsEventError('invalid_buffer_options');
    }
    this.capacity = capacity;
    this.minimumIntervalMs = minimumIntervalMs;
  }

  append(input: ThreeDPhysicsEventInput): ThreeDPhysicsEventAppendResult {
    const event = normalizeThreeDPhysicsEvent(input);
    if (this.eventIds.has(event.sceneEventId)) {
      return { status: 'duplicate', event };
    }

    const signature = eventSignature(event);
    const eventTime = Date.parse(event.occurredAt);
    const latestTime = this.latestTimes.get(signature);
    if (
      latestTime !== undefined
      && eventTime >= latestTime
      && eventTime - latestTime < this.minimumIntervalMs
    ) {
      return { status: 'rate-limited', event };
    }

    this.events.push(event);
    this.eventIds.add(event.sceneEventId);
    this.latestTimes.set(signature, Math.max(eventTime, latestTime ?? eventTime));

    while (this.events.length > this.capacity) {
      const removed = this.events.shift();
      if (removed) {
        this.eventIds.delete(removed.sceneEventId);
        const removedSignature = eventSignature(removed);
        const retainedTimes = this.events
          .filter((candidate) => eventSignature(candidate) === removedSignature)
          .map((candidate) => Date.parse(candidate.occurredAt));
        if (retainedTimes.length === 0) {
          this.latestTimes.delete(removedSignature);
        } else {
          this.latestTimes.set(removedSignature, Math.max(...retainedTimes));
        }
      }
    }
    return { status: 'accepted', event };
  }

  list(): readonly Readonly<ThreeDPhysicsEventV1>[] {
    return Object.freeze([...this.events]);
  }

  clear(): void {
    this.events = [];
    this.eventIds.clear();
    this.latestTimes.clear();
  }
}
