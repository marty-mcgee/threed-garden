import { NextResponse } from 'next/server';
import {
  THREED_MQTT_WORKER_AUTH_VERSION,
  MqttWorkerNonceStore,
  verifyMqttWorkerRequest,
} from '@/lib/services/threed/mqtt/worker/auth';
import {
  MAX_FARMBOT_MQTT_INGESTION_BYTES,
  FarmBotMqttPersistenceInputError,
  parseFarmBotMqttIngestionBatch,
} from '@/lib/services/threed/mqtt/integrations/farmbot/persistence-core';
import {
  FarmBotMqttPersistenceScopeError,
  persistFarmBotMqttBatch,
} from '@/lib/services/threed/mqtt/integrations/farmbot/persistence-repository';

export const dynamic = 'force-dynamic';
const INTERNAL_PATH = '/api/internal/threed-mqtt/farmbot/events';
const nonceStore = new MqttWorkerNonceStore();

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function readBoundedBody(request: Request): Promise<Buffer> {
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_FARMBOT_MQTT_INGESTION_BYTES) {
      await reader.cancel();
      throw new FarmBotMqttPersistenceInputError('batch_too_large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), length);
}

function requiredHeader(request: Request, name: string): string {
  const value = request.headers.get(name);
  if (!value) throw new Error('missing_header');
  return value;
}

export async function POST(request: Request) {
  const encodedKey = process.env.THREED_MQTT_WORKER_TO_APP_HMAC_KEY;
  if (!encodedKey) {
    return json({ success: false, error: 'FarmBot worker ingestion is not configured' }, 503);
  }
  if (request.headers.get('content-type') !== 'application/json') {
    return json({ success: false, error: 'Invalid request' }, 400);
  }

  try {
    const body = await readBoundedBody(request);
    verifyMqttWorkerRequest({
      method: 'POST',
      path: INTERNAL_PATH,
      timestamp: requiredHeader(request, 'x-threed-mqtt-worker-timestamp'),
      nonce: requiredHeader(request, 'x-threed-mqtt-worker-nonce'),
      signature: requiredHeader(request, 'x-threed-mqtt-worker-signature'),
      version: requiredHeader(
        request,
        'x-threed-mqtt-worker-version'
      ) as typeof THREED_MQTT_WORKER_AUTH_VERSION,
      body,
    }, encodedKey, nonceStore);

    const payload = JSON.parse(body.toString('utf8')) as unknown;
    const batch = parseFarmBotMqttIngestionBatch(payload);
    const result = await persistFarmBotMqttBatch(batch);
    return json({ success: true, data: result }, 202);
  } catch (error) {
    if (error instanceof FarmBotMqttPersistenceInputError || error instanceof SyntaxError) {
      return json({ success: false, error: 'Invalid FarmBot MQTT event batch' }, 400);
    }
    if (error instanceof FarmBotMqttPersistenceScopeError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }
    if (error instanceof Error && error.name === 'MqttWorkerAuthError') {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('FarmBot MQTT event ingestion failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot MQTT event ingestion failed' }, 500);
  }
}
