export const FARMBOT_LIVE_STATE_VERSION = 1 as const;

export const FARMBOT_LIVE_CONNECTION_STATES = [
  'disconnected',
  'connecting',
  'connected',
  'reconnecting',
  'expired',
  'error',
] as const;

export type FarmBotLiveConnectionState = typeof FARMBOT_LIVE_CONNECTION_STATES[number];
export type FarmBotLiveCondition = 'unavailable' | 'disconnected' | 'stale' | 'live';

export interface FarmBotLiveStateV1 {
  version: typeof FARMBOT_LIVE_STATE_VERSION;
  source: 'farmbot_mqtt';
  projectId: number;
  farmbotId: number;
  condition: FarmBotLiveCondition;
  connectionState: FarmBotLiveConnectionState | null;
  position: Readonly<{ x: number; y: number; z: number }> | null;
  observedAt: string | null;
  stateChangedAt: string | null;
}

export interface FarmBotLiveRuntimeInput {
  connectionState?: unknown;
  stateChangedAt?: unknown;
  lastMessageAt?: unknown;
  positionX?: unknown;
  positionY?: unknown;
  positionZ?: unknown;
  isStale?: unknown;
}

export class FarmBotLiveStateError extends Error {
  constructor(readonly code: 'invalid_identity' | 'invalid_connection_state' | 'invalid_time' | 'invalid_position' | 'invalid_stale_state') {
    super(code);
    this.name = 'FarmBotLiveStateError';
  }
}

const MAX_ABSOLUTE_POSITION = 1_000_000;
const MIN_TIME_MS = Date.UTC(2000, 0, 1);
const MAX_TIME_MS = Date.UTC(2200, 0, 1);

function positiveSafeInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new FarmBotLiveStateError('invalid_identity');
  }
  return Number(value);
}

function optionalTime(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const milliseconds = value instanceof Date ? value.getTime() : Date.parse(String(value));
  if (!Number.isFinite(milliseconds) || milliseconds < MIN_TIME_MS || milliseconds > MAX_TIME_MS) {
    throw new FarmBotLiveStateError('invalid_time');
  }
  return new Date(milliseconds).toISOString();
}

function optionalPosition(input: FarmBotLiveRuntimeInput): Readonly<{ x: number; y: number; z: number }> | null {
  const values = [input.positionX, input.positionY, input.positionZ];
  if (values.every((value) => value === null || value === undefined)) return null;
  if (values.some((value) => value === null || value === undefined)) {
    throw new FarmBotLiveStateError('invalid_position');
  }
  const coordinates = values.map((value) => Number(value));
  if (coordinates.some((value) => !Number.isFinite(value) || Math.abs(value) > MAX_ABSOLUTE_POSITION)) {
    throw new FarmBotLiveStateError('invalid_position');
  }
  return Object.freeze({ x: coordinates[0], y: coordinates[1], z: coordinates[2] });
}

export function createFarmBotLiveState(input: {
  projectId: unknown;
  farmbotId: unknown;
  runtime: FarmBotLiveRuntimeInput | null;
}): Readonly<FarmBotLiveStateV1> {
  const projectId = positiveSafeInteger(input.projectId);
  const farmbotId = positiveSafeInteger(input.farmbotId);
  if (!input.runtime) {
    return Object.freeze({
      version: FARMBOT_LIVE_STATE_VERSION,
      source: 'farmbot_mqtt',
      projectId,
      farmbotId,
      condition: 'unavailable',
      connectionState: null,
      position: null,
      observedAt: null,
      stateChangedAt: null,
    });
  }
  if (
    typeof input.runtime.connectionState !== 'string'
    || !FARMBOT_LIVE_CONNECTION_STATES.includes(input.runtime.connectionState as FarmBotLiveConnectionState)
  ) {
    throw new FarmBotLiveStateError('invalid_connection_state');
  }
  if (typeof input.runtime.isStale !== 'boolean') {
    throw new FarmBotLiveStateError('invalid_stale_state');
  }
  const connectionState = input.runtime.connectionState as FarmBotLiveConnectionState;
  const position = optionalPosition(input.runtime);
  const observedAt = optionalTime(input.runtime.lastMessageAt);
  const stateChangedAt = optionalTime(input.runtime.stateChangedAt);
  const condition: FarmBotLiveCondition = connectionState !== 'connected'
    ? 'disconnected'
    : input.runtime.isStale || !position || !observedAt
      ? 'stale'
      : 'live';

  return Object.freeze({
    version: FARMBOT_LIVE_STATE_VERSION,
    source: 'farmbot_mqtt',
    projectId,
    farmbotId,
    condition,
    connectionState,
    position,
    observedAt,
    stateChangedAt,
  });
}
