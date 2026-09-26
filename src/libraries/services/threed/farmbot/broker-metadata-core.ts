export interface FarmBotBrokerMetadata {
  mqttHost: string;
  mqttWsUrl: string;
  brokerDeviceId: string;
  vhost: string;
  tokenIssuedAt: Date;
  tokenExpiresAt: Date;
}

export class FarmBotBrokerMetadataError extends Error {
  constructor() {
    super('FarmBot token does not contain valid broker metadata');
    this.name = 'FarmBotBrokerMetadataError';
  }
}

export class FarmBotBrokerIdentityMismatchError extends Error {
  constructor() {
    super('Refreshed FarmBot token belongs to a different broker device');
    this.name = 'FarmBotBrokerIdentityMismatchError';
  }
}

export function expectedFarmBotBrokerDeviceId(farmbotDeviceId: number): string {
  if (!Number.isSafeInteger(farmbotDeviceId) || farmbotDeviceId <= 0) {
    throw new FarmBotBrokerIdentityMismatchError();
  }
  return `device_${farmbotDeviceId}`;
}

export function assertFarmBotRestAndBrokerIdentityMatch(
  farmbotDeviceId: number,
  brokerDeviceId: string
): void {
  if (brokerDeviceId !== expectedFarmBotBrokerDeviceId(farmbotDeviceId)) {
    throw new FarmBotBrokerIdentityMismatchError();
  }
}

export function assertFarmBotBrokerIdentityUnchanged(
  current: FarmBotBrokerMetadata,
  refreshed: FarmBotBrokerMetadata
): void {
  if (current.brokerDeviceId !== refreshed.brokerDeviceId) {
    throw new FarmBotBrokerIdentityMismatchError();
  }
}

function requiredString(
  payload: Record<string, unknown>,
  field: string,
  maxLength: number
): string {
  const value = payload[field];
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new FarmBotBrokerMetadataError();
  }
  return value.trim();
}

function numericDate(payload: Record<string, unknown>, field: string): Date {
  const value = payload[field];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new FarmBotBrokerMetadataError();
  }
  const date = new Date(value * 1_000);
  if (Number.isNaN(date.valueOf())) {
    throw new FarmBotBrokerMetadataError();
  }
  return date;
}

export function readFarmBotBrokerMetadata(token: string): FarmBotBrokerMetadata {
  const segments = token.split('.');
  if (segments.length !== 3 || !segments[1]) {
    throw new FarmBotBrokerMetadataError();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8')) as unknown;
  } catch {
    throw new FarmBotBrokerMetadataError();
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new FarmBotBrokerMetadataError();
  }

  const claims = payload as Record<string, unknown>;
  const mqttHost = requiredString(claims, 'mqtt', 253).toLowerCase();
  if (!/^(?=.{1,253}$)(?![.-])[a-z0-9.-]+(?<![.-])$/.test(mqttHost)
    || mqttHost.includes('..')) {
    throw new FarmBotBrokerMetadataError();
  }

  const mqttWsUrl = requiredString(claims, 'mqtt_ws', 500);
  let parsedWebSocketUrl: URL;
  try {
    parsedWebSocketUrl = new URL(mqttWsUrl);
  } catch {
    throw new FarmBotBrokerMetadataError();
  }
  if (parsedWebSocketUrl.protocol !== 'wss:' || parsedWebSocketUrl.username
    || parsedWebSocketUrl.password || parsedWebSocketUrl.hostname !== mqttHost) {
    throw new FarmBotBrokerMetadataError();
  }

  const brokerDeviceId = requiredString(claims, 'bot', 100);
  if (!/^device_[1-9]\d*$/.test(brokerDeviceId)) {
    throw new FarmBotBrokerMetadataError();
  }

  const vhost = requiredString(claims, 'vhost', 255);
  if (/[^\x20-\x7E]/.test(vhost)) {
    throw new FarmBotBrokerMetadataError();
  }

  const tokenIssuedAt = numericDate(claims, 'iat');
  const tokenExpiresAt = numericDate(claims, 'exp');
  if (tokenExpiresAt <= tokenIssuedAt) {
    throw new FarmBotBrokerMetadataError();
  }

  return {
    mqttHost,
    mqttWsUrl,
    brokerDeviceId,
    vhost,
    tokenIssuedAt,
    tokenExpiresAt,
  };
}
