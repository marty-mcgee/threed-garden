export const FARMBOT_TOKEN_ENDPOINT = 'https://my.farm.bot/api/tokens';
export const FARMBOT_TOKEN_TIMEOUT_MS = 10_000;
export const MAX_FARMBOT_EMAIL_LENGTH = 320;
export const MAX_FARMBOT_PASSWORD_LENGTH = 1_024;
export const MAX_FARMBOT_TOKEN_LENGTH = 16_384;

export class FarmBotLoginRejectedError extends Error {
  constructor() {
    super('FarmBot login was rejected');
    this.name = 'FarmBotLoginRejectedError';
  }
}

export class FarmBotTokenServiceUnavailableError extends Error {
  constructor() {
    super('FarmBot token service is unavailable');
    this.name = 'FarmBotTokenServiceUnavailableError';
  }
}

export interface FarmBotJwtMetadata {
  brokerDeviceId: string | null;
  expiresAt: string | null;
}

export function readFarmBotJwtMetadata(token: string): FarmBotJwtMetadata {
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) return { brokerDeviceId: null, expiresAt: null };

  try {
    const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as unknown;
    if (typeof payload !== 'object' || payload === null) {
      return { brokerDeviceId: null, expiresAt: null };
    }

    const brokerDeviceId = 'bot' in payload && typeof payload.bot === 'string'
      && payload.bot.trim() && payload.bot.length <= 100
      ? payload.bot.trim()
      : null;
    const expirationSeconds = 'exp' in payload && typeof payload.exp === 'number'
      && Number.isSafeInteger(payload.exp) && payload.exp > 0
      ? payload.exp
      : null;
    const expirationDate = expirationSeconds === null
      ? null
      : new Date(expirationSeconds * 1_000);
    const expiresAt = expirationDate && !Number.isNaN(expirationDate.valueOf())
      ? expirationDate.toISOString()
      : null;

    return { brokerDeviceId, expiresAt };
  } catch {
    return { brokerDeviceId: null, expiresAt: null };
  }
}

export function readFarmBotEncodedToken(value: unknown): string {
  if (typeof value !== 'object' || value === null || !('token' in value)) {
    throw new FarmBotTokenServiceUnavailableError();
  }

  const tokenContainer = value.token;
  if (
    typeof tokenContainer !== 'object'
    || tokenContainer === null
    || !('encoded' in tokenContainer)
    || typeof tokenContainer.encoded !== 'string'
  ) {
    throw new FarmBotTokenServiceUnavailableError();
  }

  const token = tokenContainer.encoded.trim();
  if (!token || token.length > MAX_FARMBOT_TOKEN_LENGTH || token.split('.').length !== 3) {
    throw new FarmBotTokenServiceUnavailableError();
  }

  return token;
}
