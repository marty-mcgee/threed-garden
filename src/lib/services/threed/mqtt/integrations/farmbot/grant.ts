import {
  readFarmBotBrokerMetadata,
} from '../../../farmbot/broker-metadata-core';

export const MAX_FARMBOT_WORKER_GRANT_BYTES = 24 * 1024;
export const MAX_FARMBOT_WORKER_GRANT_LIFETIME_MS = 5 * 60 * 1000;

export interface FarmBotWorkerConnectionGrant {
  version: 1;
  farmbotId: number;
  ownerId: string;
  farmbotDeviceId: number;
  brokerDeviceId: string;
  mqttHost: string;
  mqttWsUrl: string;
  vhost: string;
  tokenIssuedAt: Date;
  tokenExpiresAt: Date;
  grantIssuedAt: Date;
  grantExpiresAt: Date;
  credential: string;
}

export class FarmBotWorkerGrantError extends Error {
  constructor(readonly code: 'invalid_grant' | 'expired_grant' | 'identity_mismatch') {
    super(code);
    this.name = 'FarmBotWorkerGrantError';
  }
}

function requiredString(
  input: Record<string, unknown>,
  field: string,
  maxLength: number
): string {
  const value = input[field];
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new FarmBotWorkerGrantError('invalid_grant');
  }
  return value.trim();
}

function positiveInteger(input: Record<string, unknown>, field: string): number {
  const value = input[field];
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new FarmBotWorkerGrantError('invalid_grant');
  }
  return value as number;
}

function isoDate(input: Record<string, unknown>, field: string): Date {
  const value = requiredString(input, field, 40);
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()) || date.toISOString() !== value) {
    throw new FarmBotWorkerGrantError('invalid_grant');
  }
  return date;
}

export function parseFarmBotWorkerConnectionGrant(
  payload: unknown,
  now = new Date()
): FarmBotWorkerConnectionGrant {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new FarmBotWorkerGrantError('invalid_grant');
  }
  const input = payload as Record<string, unknown>;
  if (input.version !== 1) throw new FarmBotWorkerGrantError('invalid_grant');

  const farmbotId = positiveInteger(input, 'farmbotId');
  const ownerId = requiredString(input, 'ownerId', 255);
  const farmbotDeviceId = positiveInteger(input, 'farmbotDeviceId');
  const brokerDeviceId = requiredString(input, 'brokerDeviceId', 100);
  const mqttHost = requiredString(input, 'mqttHost', 253).toLowerCase();
  const mqttWsUrl = requiredString(input, 'mqttWsUrl', 500);
  const vhost = requiredString(input, 'vhost', 255);
  const tokenIssuedAt = isoDate(input, 'tokenIssuedAt');
  const tokenExpiresAt = isoDate(input, 'tokenExpiresAt');
  const grantIssuedAt = isoDate(input, 'grantIssuedAt');
  const grantExpiresAt = isoDate(input, 'grantExpiresAt');
  const credential = requiredString(input, 'credential', 16 * 1024);

  const metadata = readFarmBotBrokerMetadata(credential);
  if (brokerDeviceId !== `device_${farmbotDeviceId}`
    || metadata.brokerDeviceId !== brokerDeviceId
    || metadata.mqttHost !== mqttHost
    || metadata.mqttWsUrl !== mqttWsUrl
    || metadata.vhost !== vhost
    || metadata.tokenIssuedAt.getTime() !== tokenIssuedAt.getTime()
    || metadata.tokenExpiresAt.getTime() !== tokenExpiresAt.getTime()) {
    throw new FarmBotWorkerGrantError('identity_mismatch');
  }

  if (grantIssuedAt.getTime() > now.getTime() + 60_000
    || grantExpiresAt <= now
    || grantExpiresAt <= grantIssuedAt
    || grantExpiresAt.getTime() - grantIssuedAt.getTime()
      > MAX_FARMBOT_WORKER_GRANT_LIFETIME_MS
    || grantExpiresAt > tokenExpiresAt) {
    throw new FarmBotWorkerGrantError('expired_grant');
  }

  return {
    version: 1,
    farmbotId,
    ownerId,
    farmbotDeviceId,
    brokerDeviceId,
    mqttHost,
    mqttWsUrl,
    vhost,
    tokenIssuedAt,
    tokenExpiresAt,
    grantIssuedAt,
    grantExpiresAt,
    credential,
  };
}
