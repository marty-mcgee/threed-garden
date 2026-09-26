export const FARMBOT_DEVICE_ENDPOINT = 'https://my.farm.bot/api/device';
export const FARMBOT_CONNECTION_TIMEOUT_MS = 10_000;

export interface FarmBotConnectionSummary {
  authenticated: true;
  deviceId: number;
  name: string | null;
  firmwareVersion: string | null;
  lastSawApi: string | null;
  lastSawMessageBroker: string | null;
  timezone: string | null;
  brokerDeviceId: string | null;
  credentialExpiresAt: string | null;
}

export class FarmBotCredentialRejectedError extends Error {
  constructor() {
    super('Stored FarmBot credential was rejected');
    this.name = 'FarmBotCredentialRejectedError';
  }
}

export class FarmBotConnectionUnavailableError extends Error {
  constructor() {
    super('FarmBot connection service is unavailable');
    this.name = 'FarmBotConnectionUnavailableError';
  }
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function readFarmBotConnectionSummary(
  value: unknown,
  tokenMetadata: { brokerDeviceId: string | null; expiresAt: string | null } = {
    brokerDeviceId: null,
    expiresAt: null,
  }
): FarmBotConnectionSummary {
  if (typeof value !== 'object' || value === null || !('id' in value)
    || typeof value.id !== 'number' || !Number.isSafeInteger(value.id) || value.id <= 0) {
    throw new FarmBotConnectionUnavailableError();
  }

  return {
    authenticated: true,
    deviceId: value.id,
    name: 'name' in value ? nullableString(value.name) : null,
    firmwareVersion: 'fbos_version' in value ? nullableString(value.fbos_version) : null,
    lastSawApi: 'last_saw_api' in value ? nullableString(value.last_saw_api) : null,
    lastSawMessageBroker: 'last_saw_mq' in value ? nullableString(value.last_saw_mq) : null,
    timezone: 'timezone' in value ? nullableString(value.timezone) : null,
    brokerDeviceId: tokenMetadata.brokerDeviceId,
    credentialExpiresAt: tokenMetadata.expiresAt,
  };
}
