import { NextResponse } from 'next/server';
import {
  THREED_MQTT_WORKER_AUTH_VERSION,
  MqttWorkerAuthError,
  MqttWorkerNonceStore,
  verifyMqttWorkerRequest,
} from '@/lib/services/threed/mqtt/worker/auth';
import {
  MAX_FARMBOT_TIMEOUT_RECONCILIATION_REQUEST_BYTES,
  FarmBotTimeoutReconciliationRequestError,
  parseFarmBotTimeoutReconciliationRequest,
} from '@/lib/services/threed/mqtt/integrations/farmbot/command-timeout-reconciliation-request-core';
import { reconcileDormantFarmBotCommandTimeouts } from '@/lib/services/threed/mqtt/integrations/farmbot/command-timeout-reconciliation';

export const dynamic = 'force-dynamic';
const INTERNAL_PATH = '/api/internal/threed-mqtt/farmbot/commands/timeouts/reconcile';
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
    if (length > MAX_FARMBOT_TIMEOUT_RECONCILIATION_REQUEST_BYTES) {
      await reader.cancel();
      throw new FarmBotTimeoutReconciliationRequestError();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), length);
}

function requiredHeader(request: Request, name: string): string {
  const value = request.headers.get(name);
  if (!value) throw new MqttWorkerAuthError('invalid_request');
  return value;
}

export async function POST(request: Request) {
  const encodedKey = process.env.THREED_MQTT_WORKER_TO_APP_HMAC_KEY;
  if (!encodedKey) {
    return json({ success: false, error: 'FarmBot timeout reconciliation is not configured' }, 503);
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
      version: requiredHeader(request, 'x-threed-mqtt-worker-version') as typeof THREED_MQTT_WORKER_AUTH_VERSION,
      body,
    }, encodedKey, nonceStore);
    const input = parseFarmBotTimeoutReconciliationRequest(
      JSON.parse(body.toString('utf8')) as unknown
    );
    const result = await reconcileDormantFarmBotCommandTimeouts({ limit: input.limit });
    return json({ success: true, data: result }, 200);
  } catch (error) {
    if (error instanceof FarmBotTimeoutReconciliationRequestError
      || error instanceof SyntaxError) {
      return json({ success: false, error: 'Invalid reconciliation request' }, 400);
    }
    if (error instanceof MqttWorkerAuthError) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('FarmBot timeout reconciliation failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot timeout reconciliation failed' }, 500);
  }
}
