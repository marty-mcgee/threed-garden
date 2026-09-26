import 'server-only';

import { randomBytes } from 'node:crypto';
import { signMqttWorkerRequest } from './auth';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 128 * 1024;

export class MqttWorkerConfigurationError extends Error {
  constructor() {
    super('ThreeD MQTT worker is not configured');
    this.name = 'MqttWorkerConfigurationError';
  }
}

export class MqttWorkerUnavailableError extends Error {
  constructor() {
    super('ThreeD MQTT worker is unavailable');
    this.name = 'MqttWorkerUnavailableError';
  }
}

function workerConfiguration(environment: NodeJS.ProcessEnv = process.env) {
  const baseUrlValue = environment.THREED_MQTT_WORKER_BASE_URL;
  const encodedHmacKey = environment.THREED_MQTT_WORKER_HMAC_KEY;
  if (!baseUrlValue || !encodedHmacKey) throw new MqttWorkerConfigurationError();

  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlValue);
  } catch {
    throw new MqttWorkerConfigurationError();
  }
  const localHttp = baseUrl.protocol === 'http:'
    && (baseUrl.hostname === '127.0.0.1' || baseUrl.hostname === 'localhost');
  if ((baseUrl.protocol !== 'https:' && !localHttp) || baseUrl.username || baseUrl.password
    || baseUrl.search || baseUrl.hash) {
    throw new MqttWorkerConfigurationError();
  }
  baseUrl.pathname = '/';
  return { baseUrl, encodedHmacKey };
}

async function readBoundedResponse(response: Response): Promise<unknown> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new MqttWorkerUnavailableError();
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), length).toString());
  } catch {
    throw new MqttWorkerUnavailableError();
  }
}

export async function mqttWorkerRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  payload?: unknown
) {
  const { baseUrl, encodedHmacKey } = workerConfiguration();
  const body = payload === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(payload));
  const timestamp = String(Date.now());
  const nonce = randomBytes(18).toString('base64url');
  const auth = signMqttWorkerRequest({ method, path, timestamp, nonce, body }, encodedHmacKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(new URL(path, baseUrl), {
      method,
      headers: {
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
        'X-ThreeD-MQTT-Worker-Version': auth.version,
        'X-ThreeD-MQTT-Worker-Timestamp': auth.timestamp,
        'X-ThreeD-MQTT-Worker-Nonce': auth.nonce,
        'X-ThreeD-MQTT-Worker-Signature': auth.signature,
      },
      body: body.byteLength > 0 ? body : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });
    const result = await readBoundedResponse(response);
    if (!response.ok) throw new MqttWorkerUnavailableError();
    return result;
  } catch (error) {
    if (error instanceof MqttWorkerConfigurationError) throw error;
    if (error instanceof MqttWorkerUnavailableError) throw error;
    throw new MqttWorkerUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}
