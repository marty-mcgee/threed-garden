export const FARMBOT_MQTT_EVENT_RETENTION_DAYS = 30;
export const MAX_FARMBOT_MQTT_EVENTS_PER_BATCH = 100;
export const MAX_FARMBOT_MQTT_INGESTION_BYTES = 128 * 1024;

export const FARMBOT_MQTT_CONNECTION_STATES = [
  'disconnected',
  'connecting',
  'connected',
  'reconnecting',
  'expired',
  'error',
] as const;

export const FARMBOT_MQTT_EVENT_SOURCES = [
  'lifecycle',
  'status',
  'from_device',
] as const;

export const FARMBOT_MQTT_EVENT_TYPES = [
  'connection_state',
  'position',
  'rpc_ok',
  'rpc_error',
  'invalid_message_summary',
] as const;

export type FarmBotMqttConnectionState = typeof FARMBOT_MQTT_CONNECTION_STATES[number];
export type FarmBotMqttEventSource = typeof FARMBOT_MQTT_EVENT_SOURCES[number];
export type FarmBotMqttEventType = typeof FARMBOT_MQTT_EVENT_TYPES[number];

export interface FarmBotMqttPersistedPosition {
  x: number;
  y: number;
  z: number;
}

export interface FarmBotMqttRuntimeInput {
  connectionState: FarmBotMqttConnectionState;
  stateChangedAt: Date;
  lastMessageAt: Date | null;
  lastStatusAt: Date | null;
  position: FarmBotMqttPersistedPosition | null;
  tokenExpiresAt: Date;
  isStale: boolean;
  reconnectAttempts: number;
  invalidMessageCount: number;
  errorCode: string | null;
}

export interface FarmBotMqttEventInput {
  eventId: string;
  source: FarmBotMqttEventSource;
  eventType: FarmBotMqttEventType;
  connectionState: FarmBotMqttConnectionState | null;
  outcome: 'observed' | 'accepted' | 'rejected' | 'error' | null;
  rpcLabel: string | null;
  errorCode: string | null;
  position: FarmBotMqttPersistedPosition | null;
  payloadBytes: number;
  payloadSha256: string;
  occurredAt: Date;
  summary: string;
}

export interface FarmBotMqttIngestionBatch {
  version: 1;
  farmbotId: number;
  ownerId: string;
  brokerDeviceId: string;
  workerSessionId: string;
  runtime: FarmBotMqttRuntimeInput;
  events: FarmBotMqttEventInput[];
}

export class FarmBotMqttPersistenceInputError extends Error {
  readonly code: 'invalid_batch' | 'batch_too_large';

  constructor(code: 'invalid_batch' | 'batch_too_large') {
    super(code);
    this.name = 'FarmBotMqttPersistenceInputError';
    this.code = code;
  }
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return value as Record<string, unknown>;
}

function boundedString(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return value.trim();
}

function nullableCode(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const code = boundedString(value, 100);
  if (!/^[a-z][a-z0-9_]*$/.test(code)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return code;
}

function positiveInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return value as number;
}

function nonnegativeInteger(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > max) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return value as number;
}

function date(value: unknown): Date {
  if (typeof value !== 'string' || value.length > 40) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return parsed;
}

function nullableDate(value: unknown): Date | null {
  return value === null || value === undefined ? null : date(value);
}

function position(value: unknown): FarmBotMqttPersistedPosition | null {
  if (value === null || value === undefined) return null;
  const input = record(value);
  const values = [input.x, input.y, input.z];
  if (values.some((coordinate) => typeof coordinate !== 'number'
    || !Number.isFinite(coordinate) || Math.abs(coordinate) > 1_000_000)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return { x: values[0] as number, y: values[1] as number, z: values[2] as number };
}

function oneOf<const T extends readonly string[]>(value: unknown, choices: T): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return value as T[number];
}

function parseRuntime(value: unknown): FarmBotMqttRuntimeInput {
  const input = record(value);
  return {
    connectionState: oneOf(input.connectionState, FARMBOT_MQTT_CONNECTION_STATES),
    stateChangedAt: date(input.stateChangedAt),
    lastMessageAt: nullableDate(input.lastMessageAt),
    lastStatusAt: nullableDate(input.lastStatusAt),
    position: position(input.position),
    tokenExpiresAt: date(input.tokenExpiresAt),
    isStale: typeof input.isStale === 'boolean'
      ? input.isStale
      : (() => { throw new FarmBotMqttPersistenceInputError('invalid_batch'); })(),
    reconnectAttempts: nonnegativeInteger(input.reconnectAttempts, 1_000_000),
    invalidMessageCount: nonnegativeInteger(input.invalidMessageCount, 1_000_000_000),
    errorCode: nullableCode(input.errorCode),
  };
}

function buildSummary(event: Omit<FarmBotMqttEventInput, 'summary'>): string {
  switch (event.eventType) {
    case 'connection_state':
      return `Connection state: ${event.connectionState ?? 'unknown'}`;
    case 'position':
      return event.position
        ? `Position: X ${event.position.x}, Y ${event.position.y}, Z ${event.position.z}`
        : 'Position status received';
    case 'rpc_ok':
      return 'FarmBot RPC acknowledged';
    case 'rpc_error':
      return event.errorCode ? `FarmBot RPC rejected: ${event.errorCode}` : 'FarmBot RPC rejected';
    case 'invalid_message_summary':
      return 'Invalid broker messages were rejected';
  }
}

function parseEvent(value: unknown): FarmBotMqttEventInput {
  const input = record(value);
  const source = oneOf(input.source, FARMBOT_MQTT_EVENT_SOURCES);
  const eventType = oneOf(input.eventType, FARMBOT_MQTT_EVENT_TYPES);
  const eventId = boundedString(input.eventId, 36);
  const rpcLabel = input.rpcLabel === null || input.rpcLabel === undefined
    ? null
    : boundedString(input.rpcLabel, 100);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)
    || (rpcLabel && !/^[A-Za-z0-9_-]+$/.test(rpcLabel))) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  const eventWithoutSummary = {
    eventId,
    source,
    eventType,
    connectionState: input.connectionState === null || input.connectionState === undefined
      ? null
      : oneOf(input.connectionState, FARMBOT_MQTT_CONNECTION_STATES),
    outcome: input.outcome === null || input.outcome === undefined
      ? null
      : oneOf(input.outcome, ['observed', 'accepted', 'rejected', 'error'] as const),
    rpcLabel,
    errorCode: nullableCode(input.errorCode),
    position: position(input.position),
    payloadBytes: nonnegativeInteger(input.payloadBytes, 262_144),
    payloadSha256: boundedString(input.payloadSha256, 64).toLowerCase(),
    occurredAt: date(input.occurredAt),
  };
  if (!/^[0-9a-f]{64}$/.test(eventWithoutSummary.payloadSha256)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  if (eventType === 'position' && !eventWithoutSummary.position) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  if (eventType === 'connection_state' && !eventWithoutSummary.connectionState) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  if ((eventType === 'rpc_ok' || eventType === 'rpc_error') && !rpcLabel) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  if ((eventType === 'connection_state' && source !== 'lifecycle')
    || (eventType === 'position' && source !== 'status')
    || ((eventType === 'rpc_ok' || eventType === 'rpc_error') && source !== 'from_device')
    || (eventType === 'invalid_message_summary' && source !== 'lifecycle')) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return {
    ...eventWithoutSummary,
    summary: buildSummary(eventWithoutSummary),
  };
}

export function parseFarmBotMqttIngestionBatch(
  payload: unknown,
  now = new Date()
): FarmBotMqttIngestionBatch {
  const input = record(payload);
  if (input.version !== 1 || !Array.isArray(input.events)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  if (input.events.length > MAX_FARMBOT_MQTT_EVENTS_PER_BATCH) {
    throw new FarmBotMqttPersistenceInputError('batch_too_large');
  }
  const ownerId = boundedString(input.ownerId, 255);
  const brokerDeviceId = boundedString(input.brokerDeviceId, 100);
  const workerSessionId = boundedString(input.workerSessionId, 36);
  if (!/^device_[1-9]\d*$/.test(brokerDeviceId)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(workerSessionId)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  const runtime = parseRuntime(input.runtime);
  const events = input.events.map(parseEvent);
  const latestAllowed = now.getTime() + 60_000;
  const earliestAllowed = now.getTime()
    - FARMBOT_MQTT_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1_000;
  if (runtime.stateChangedAt.getTime() > latestAllowed
    || (runtime.lastMessageAt && runtime.lastMessageAt.getTime() > latestAllowed)
    || (runtime.lastStatusAt && runtime.lastStatusAt.getTime() > latestAllowed)
    || events.some((event) => event.occurredAt.getTime() > latestAllowed
      || event.occurredAt.getTime() < earliestAllowed)) {
    throw new FarmBotMqttPersistenceInputError('invalid_batch');
  }
  return {
    version: 1,
    farmbotId: positiveInteger(input.farmbotId),
    ownerId,
    brokerDeviceId,
    workerSessionId,
    runtime,
    events,
  };
}
