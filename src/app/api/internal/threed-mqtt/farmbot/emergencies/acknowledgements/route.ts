import { NextResponse } from 'next/server';
import {
  THREED_MQTT_WORKER_AUTH_VERSION,
  MqttWorkerAuthError,
  MqttWorkerNonceStore,
  verifyMqttWorkerRequest,
} from '@/lib/services/threed/mqtt/worker/auth';
import {
  MAX_FARMBOT_EMERGENCY_ACKNOWLEDGEMENT_BYTES,
  FarmBotEmergencyWaterOffAcknowledgementInputError,
  parseFarmBotEmergencyWaterOffAcknowledgement,
} from '@/lib/services/threed/mqtt/integrations/farmbot/emergency-water-off-acknowledgement-core';
import {
  FarmBotEmergencyActionRepositoryScopeError,
  FarmBotEmergencyActionTransitionConflictError,
  getOwnedFarmBotEmergencyAction,
  recordFarmBotEmergencyActionAcknowledgement,
} from '@/lib/services/threed/farmbot/emergency-action-repository';

export const dynamic = 'force-dynamic';
const INTERNAL_PATH = '/api/internal/threed-mqtt/farmbot/emergencies/acknowledgements';
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
    if (length > MAX_FARMBOT_EMERGENCY_ACKNOWLEDGEMENT_BYTES) {
      await reader.cancel();
      throw new FarmBotEmergencyWaterOffAcknowledgementInputError();
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
    return json({ success: false, error: 'FarmBot emergency ingestion is not configured' }, 503);
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

    const acknowledgement = parseFarmBotEmergencyWaterOffAcknowledgement(
      JSON.parse(body.toString('utf8')) as unknown
    );
    const action = await getOwnedFarmBotEmergencyAction(
      acknowledgement.ownerId,
      acknowledgement.emergencyId
    );
    if (!action || action.farmbotId !== acknowledgement.farmbotId) {
      throw new FarmBotEmergencyActionRepositoryScopeError();
    }
    const updated = await recordFarmBotEmergencyActionAcknowledgement({
      userId: acknowledgement.ownerId,
      emergencyId: acknowledgement.emergencyId,
      rpcLabel: acknowledgement.rpcLabel,
      outcome: acknowledgement.state === 'acknowledged' ? 'ok' : 'error',
      now: acknowledgement.receivedAt,
    });
    return json({
      success: true,
      data: { emergencyId: updated.emergencyId, state: updated.state },
    }, 202);
  } catch (error) {
    if (error instanceof FarmBotEmergencyWaterOffAcknowledgementInputError
      || error instanceof SyntaxError) {
      return json({ success: false, error: 'Invalid FarmBot emergency acknowledgement' }, 400);
    }
    if (error instanceof FarmBotEmergencyActionRepositoryScopeError) {
      return json({ success: false, error: 'FarmBot emergency action not found' }, 404);
    }
    if (error instanceof FarmBotEmergencyActionTransitionConflictError) {
      return json({ success: false, error: 'FarmBot emergency action state conflict' }, 409);
    }
    if (error instanceof MqttWorkerAuthError) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('FarmBot emergency acknowledgement ingestion failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot emergency acknowledgement failed' }, 500);
  }
}
