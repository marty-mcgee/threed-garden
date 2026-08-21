import { NextResponse } from 'next/server';
import {
  THREED_MQTT_WORKER_AUTH_VERSION,
  MqttWorkerAuthError,
  MqttWorkerNonceStore,
  verifyMqttWorkerRequest,
} from '@/lib/services/threed/mqtt/worker/auth';
import {
  MAX_FARMBOT_COMMAND_TIMEOUT_REPORT_BYTES,
  FarmBotWorkerCommandTimeoutReportError,
  parseFarmBotWorkerCommandTimeoutReport,
} from '@/lib/services/threed/mqtt/integrations/farmbot/command-timeout-report-core';
import {
  FarmBotTimeoutIngestionError,
} from '@/lib/services/threed/mqtt/integrations/farmbot/command-timeout-ingestion-core';
import {
  persistFarmBotWorkerCommandTimeout,
} from '@/lib/services/threed/mqtt/integrations/farmbot/command-timeout-ingestion';
import {
  FarmBotCommandRepositoryScopeError,
  FarmBotCommandTransitionConflictError,
} from '@/lib/services/threed/farmbot/command-repository';
import { FarmBotCommandTimeoutCoordinatorError } from '@/lib/services/threed/mqtt/integrations/farmbot/command-timeout-core';

export const dynamic = 'force-dynamic';
const INTERNAL_PATH = '/api/internal/threed-mqtt/farmbot/commands/timeouts';
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
    if (length > MAX_FARMBOT_COMMAND_TIMEOUT_REPORT_BYTES) {
      await reader.cancel();
      throw new FarmBotWorkerCommandTimeoutReportError();
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
    return json({ success: false, error: 'FarmBot timeout ingestion is not configured' }, 503);
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
    const report = parseFarmBotWorkerCommandTimeoutReport(
      JSON.parse(body.toString('utf8')) as unknown
    );
    const result = await persistFarmBotWorkerCommandTimeout(report);
    return json({
      success: true,
      data: {
        commandId: result.commandId,
        state: result.state,
        recoveryState: result.recoveryState,
        recoveryRpcLabel: result.recoveryRpcLabel,
      },
    }, 202);
  } catch (error) {
    if (error instanceof FarmBotWorkerCommandTimeoutReportError
      || error instanceof SyntaxError) {
      return json({ success: false, error: 'Invalid FarmBot timeout report' }, 400);
    }
    if ((error instanceof FarmBotTimeoutIngestionError && error.code === 'not_found')
      || error instanceof FarmBotCommandRepositoryScopeError) {
      return json({ success: false, error: 'FarmBot command not found' }, 404);
    }
    if (error instanceof FarmBotTimeoutIngestionError
      || error instanceof FarmBotCommandTransitionConflictError
      || error instanceof FarmBotCommandTimeoutCoordinatorError) {
      return json({ success: false, error: 'FarmBot timeout state conflict' }, 409);
    }
    if (error instanceof MqttWorkerAuthError) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('FarmBot timeout ingestion failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot timeout ingestion failed' }, 500);
  }
}
