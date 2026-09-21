import {
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

export const THREED_MQTT_WORKER_AUTH_VERSION = 'v1';
export const THREED_MQTT_WORKER_CLOCK_SKEW_MS = 60_000;
export const THREED_MQTT_WORKER_NONCE_TTL_MS = 120_000;

export interface MqttWorkerAuthInput {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  body: Uint8Array;
}

export interface MqttWorkerAuthHeaders {
  version: typeof THREED_MQTT_WORKER_AUTH_VERSION;
  timestamp: string;
  nonce: string;
  signature: string;
}

export class MqttWorkerAuthError extends Error {
  constructor(
    readonly code:
      | 'invalid_key'
      | 'invalid_request'
      | 'invalid_timestamp'
      | 'expired_timestamp'
      | 'invalid_nonce'
      | 'replayed_nonce'
      | 'invalid_signature'
  ) {
    super(code);
    this.name = 'MqttWorkerAuthError';
  }
}

function decodeKey(encodedKey: string): Buffer {
  const trimmed = encodedKey.trim();
  const key = Buffer.from(trimmed, 'base64');
  if (key.length !== 32 || key.toString('base64') !== trimmed) {
    throw new MqttWorkerAuthError('invalid_key');
  }
  return key;
}

function normalizeMethod(method: string): string {
  const normalized = method.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) {
    throw new MqttWorkerAuthError('invalid_request');
  }
  return normalized;
}

function normalizePath(path: string): string {
  if (!path.startsWith('/') || path.includes('\n') || path.includes('\r')) {
    throw new MqttWorkerAuthError('invalid_request');
  }
  return path;
}

function validateNonce(nonce: string): string {
  if (!/^[A-Za-z0-9_-]{22,86}$/.test(nonce)) {
    throw new MqttWorkerAuthError('invalid_nonce');
  }
  return nonce;
}

function canonicalRequest(input: MqttWorkerAuthInput): string {
  const timestamp = input.timestamp.trim();
  if (!/^\d{10,16}$/.test(timestamp)) {
    throw new MqttWorkerAuthError('invalid_timestamp');
  }

  return [
    THREED_MQTT_WORKER_AUTH_VERSION,
    normalizeMethod(input.method),
    normalizePath(input.path),
    timestamp,
    validateNonce(input.nonce),
    createHash('sha256').update(input.body).digest('base64url'),
  ].join('\n');
}

export function signMqttWorkerRequest(
  input: MqttWorkerAuthInput,
  encodedKey: string
): MqttWorkerAuthHeaders {
  const signature = createHmac('sha256', decodeKey(encodedKey))
    .update(canonicalRequest(input), 'utf8')
    .digest('base64url');

  return {
    version: THREED_MQTT_WORKER_AUTH_VERSION,
    timestamp: input.timestamp.trim(),
    nonce: input.nonce,
    signature,
  };
}

export class MqttWorkerNonceStore {
  private readonly expirations = new Map<string, number>();

  claim(nonce: string, nowMs: number): void {
    for (const [storedNonce, expiresAt] of this.expirations) {
      if (expiresAt <= nowMs) this.expirations.delete(storedNonce);
    }
    if (this.expirations.has(nonce)) {
      throw new MqttWorkerAuthError('replayed_nonce');
    }
    this.expirations.set(nonce, nowMs + THREED_MQTT_WORKER_NONCE_TTL_MS);
  }
}

export function verifyMqttWorkerRequest(
  input: MqttWorkerAuthInput & MqttWorkerAuthHeaders,
  encodedKey: string,
  nonceStore: MqttWorkerNonceStore,
  nowMs = Date.now()
): void {
  if (input.version !== THREED_MQTT_WORKER_AUTH_VERSION) {
    throw new MqttWorkerAuthError('invalid_request');
  }

  const timestampMs = Number(input.timestamp);
  if (!Number.isSafeInteger(timestampMs)) {
    throw new MqttWorkerAuthError('invalid_timestamp');
  }
  if (Math.abs(nowMs - timestampMs) > THREED_MQTT_WORKER_CLOCK_SKEW_MS) {
    throw new MqttWorkerAuthError('expired_timestamp');
  }

  const expected = signMqttWorkerRequest(input, encodedKey).signature;
  const supplied = Buffer.from(input.signature, 'base64url');
  const expectedBytes = Buffer.from(expected, 'base64url');
  if (supplied.length !== expectedBytes.length
    || !timingSafeEqual(supplied, expectedBytes)) {
    throw new MqttWorkerAuthError('invalid_signature');
  }

  nonceStore.claim(validateNonce(input.nonce), nowMs);
}
