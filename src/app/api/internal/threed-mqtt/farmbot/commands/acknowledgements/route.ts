import { NextResponse } from 'next/server';
import {
  THREED_MQTT_WORKER_AUTH_VERSION,
  MqttWorkerAuthError,
  MqttWorkerNonceStore,
  verifyMqttWorkerRequest,
} from '@/lib/services/threed/mqtt/worker/auth';
import {
  MAX_FARMBOT_COMMAND_ACKNOWLEDGEMENT_BYTES,
  FarmBotCommandAcknowledgementInputError,
  parseFarmBotCommandAcknowledgement,
} from '@/lib/services/threed/mqtt/integrations/farmbot/command-acknowledgement-core';
import {
  FarmBotCommandRepositoryScopeError,
  FarmBotCommandTransitionConflictError,
  getOwnedFarmBotCommand,
} from '@/lib/services/threed/farmbot/command-repository';
import { persistFarmBotCommandAcknowledgement } from '@/lib/services/threed/mqtt/integrations/farmbot/command-completion';
import { FarmBotCommandCompletionError } from '@/lib/services/threed/mqtt/integrations/farmbot/command-completion-core';

export const dynamic = 'force-dynamic';
const INTERNAL_PATH = '/api/internal/threed-mqtt/farmbot/commands/acknowledgements';
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
    if (length > MAX_FARMBOT_COMMAND_ACKNOWLEDGEMENT_BYTES) {
      await reader.cancel();
      throw new FarmBotCommandAcknowledgementInputError();
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
    return json({ success: false, error: 'FarmBot command ingestion is not configured' }, 503);
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

    const acknowledgement = parseFarmBotCommandAcknowledgement(
      JSON.parse(body.toString('utf8')) as unknown
    );
    const command = await getOwnedFarmBotCommand(
      acknowledgement.ownerId,
      acknowledgement.commandId
    );
    if (!command || command.farmbotId !== acknowledgement.farmbotId) {
      throw new FarmBotCommandRepositoryScopeError();
    }
    const updated = await persistFarmBotCommandAcknowledgement({
      userId: acknowledgement.ownerId,
      commandId: acknowledgement.commandId,
      rpcLabel: acknowledgement.rpcLabel,
      outcome: acknowledgement.state === 'acknowledged' ? 'ok' : 'error',
      receivedAt: acknowledgement.receivedAt,
    });
    return json({
      success: true,
      data: { commandId: updated.commandId, state: updated.state },
    }, 202);
  } catch (error) {
    if (error instanceof FarmBotCommandAcknowledgementInputError
      || error instanceof SyntaxError) {
      return json({ success: false, error: 'Invalid FarmBot command acknowledgement' }, 400);
    }
    if (error instanceof FarmBotCommandRepositoryScopeError) {
      return json({ success: false, error: 'FarmBot command not found' }, 404);
    }
    if (error instanceof FarmBotCommandTransitionConflictError
      || error instanceof FarmBotCommandCompletionError) {
      return json({ success: false, error: 'FarmBot command state conflict' }, 409);
    }
    if (error instanceof MqttWorkerAuthError) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('FarmBot command acknowledgement ingestion failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot command acknowledgement failed' }, 500);
  }
}
