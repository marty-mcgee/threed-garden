import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import {
  THREED_MQTT_WORKER_AUTH_VERSION,
  MqttWorkerNonceStore,
  verifyMqttWorkerRequest,
} from '../../worker/auth';
import {
  MAX_FARMBOT_WORKER_GRANT_BYTES,
  parseFarmBotWorkerConnectionGrant,
} from './grant';
import { FarmBotWorkerSessionRegistry } from './session-registry';
import { MqttReadonlyTransportUnavailable } from '../../core/transport';
import type { MqttReadonlyTransport } from '../../core/transport';
import { MqttJsReadonlyTransport } from '../../transports/mqttjs';
import { createFarmBotWorkerPersistenceSink } from './persistence-client';
import {
  MAX_FARMBOT_WORKER_COMMAND_REQUEST_BYTES,
  parseFarmBotWorkerWaterCommandRequest,
} from './command-request-core';
import {
  DisabledFarmBotWorkerCommandExecutor,
  FarmBotWorkerCommandsDisabledError,
  type FarmBotWorkerCommandExecutor,
} from './command-executor';
import { FarmBotWorkerCommandSessionError } from './session-registry';
import {
  FarmBotWorkerCommandExecutionGate,
  FarmBotWorkerCommandGateError,
} from './command-execution-gate';
import {
  DisabledFarmBotWorkerCommandAcknowledgementSink,
  createFarmBotWorkerCommandAcknowledgementSink,
  type FarmBotWorkerCommandAcknowledgementSink,
} from './command-acknowledgement-client';
import {
  MAX_FARMBOT_WORKER_RECOVERY_REQUEST_BYTES,
  parseFarmBotWorkerWaterOffRecoveryRequest,
} from './command-recovery-request-core';
import {
  DisabledFarmBotWorkerRecoveryExecutor,
  FarmBotWorkerRecoveryDisabledError,
  FarmBotWorkerRecoveryExecutionResultError,
  type FarmBotWorkerRecoveryExecutor,
  validateFarmBotWorkerRecoveryExecutionResult,
} from './command-recovery-executor';
import {
  FarmBotWorkerRecoveryExecutionGate,
  FarmBotWorkerRecoveryGateError,
} from './command-recovery-execution-gate';
import { ProcessLocalFarmBotWorkerDeviceExecutionArbiter } from './device-execution-arbiter';
import {
  DisabledFarmBotWorkerRecoveryAcknowledgementSink,
  createFarmBotWorkerRecoveryAcknowledgementSink,
  type FarmBotWorkerRecoveryAcknowledgementSink,
} from './command-recovery-acknowledgement-client';
import {
  DisabledFarmBotWorkerCommandTimeoutSink,
  createFarmBotWorkerCommandTimeoutSink,
  type FarmBotWorkerCommandTimeoutSink,
} from './command-timeout-client';
import { ProcessLocalFarmBotWorkerCommandDeadlineMonitor } from './command-deadline-monitor';
import { createFarmBotWorkerTimeoutReconciliationRunner } from './command-timeout-reconciliation-client';

const DEFAULT_PORT = 4456;
const MAX_INTERNAL_BODY_BYTES = MAX_FARMBOT_WORKER_GRANT_BYTES;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_INTERNAL_BODY_BYTES) throw new Error('body_too_large');
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

function requiredHeader(request: IncomingMessage, name: string): string {
  const value = request.headers[name];
  if (typeof value !== 'string' || !value) throw new Error('unauthorized');
  return value;
}

function parseFarmbotPath(pathname: string): {
  farmbotId: number;
  action: 'status' | 'session' | 'commands' | 'recoveries';
} | null {
  const match = pathname.match(
    /^\/internal\/v1\/farmbots\/([1-9]\d*)\/(status|session|commands|recoveries)$/
  );
  if (!match) return null;
  const farmbotId = Number(match[1]);
  if (!Number.isSafeInteger(farmbotId)) return null;
  return {
    farmbotId,
    action: match[2] as 'status' | 'session' | 'commands' | 'recoveries',
  };
}

export function createFarmBotWorkerServer(
  encodedHmacKey: string,
  persistence = createFarmBotWorkerPersistenceSink(),
  transport: MqttReadonlyTransport = new MqttReadonlyTransportUnavailable(),
  transportName: 'disabled' | 'mqttjs' = 'disabled',
  commandExecutor: FarmBotWorkerCommandExecutor = new DisabledFarmBotWorkerCommandExecutor(),
  acknowledgementSink: FarmBotWorkerCommandAcknowledgementSink
    = new DisabledFarmBotWorkerCommandAcknowledgementSink(),
  recoveryExecutor: FarmBotWorkerRecoveryExecutor = new DisabledFarmBotWorkerRecoveryExecutor(),
  recoveryAcknowledgementSink: FarmBotWorkerRecoveryAcknowledgementSink
    = new DisabledFarmBotWorkerRecoveryAcknowledgementSink(),
  timeoutSink: FarmBotWorkerCommandTimeoutSink
    = new DisabledFarmBotWorkerCommandTimeoutSink()
) {
  const nonceStore = new MqttWorkerNonceStore();
  const deviceExecutionArbiter = new ProcessLocalFarmBotWorkerDeviceExecutionArbiter();
  const guardedCommandExecutor = new FarmBotWorkerCommandExecutionGate(
    commandExecutor,
    acknowledgementSink,
    deviceExecutionArbiter,
    new ProcessLocalFarmBotWorkerCommandDeadlineMonitor(timeoutSink)
  );
  const guardedRecoveryExecutor = new FarmBotWorkerRecoveryExecutionGate(
    recoveryExecutor,
    deviceExecutionArbiter,
    recoveryAcknowledgementSink
  );
  const registry = new FarmBotWorkerSessionRegistry(
    transport,
    {},
    persistence,
    {
      observeResponse(input) {
        const commandAcknowledgement = guardedCommandExecutor.observeResponse(input);
        guardedRecoveryExecutor.observeResponse(input);
        return commandAcknowledgement;
      },
    }
  );
  const processId = randomBytes(8).toString('base64url');

  const server = createServer(async (request, response) => {
    const method = request.method ?? 'GET';
    const url = new URL(request.url ?? '/', 'http://worker.internal');

    if (method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, {
        ok: true,
        processId,
        mqttTransport: transportName,
        commandsEnabled: false,
      });
      return;
    }

    let body: Buffer;
    try {
      body = await readBody(request);
      verifyMqttWorkerRequest({
        method,
        path: url.pathname,
        timestamp: requiredHeader(request, 'x-threed-mqtt-worker-timestamp'),
        nonce: requiredHeader(request, 'x-threed-mqtt-worker-nonce'),
        signature: requiredHeader(request, 'x-threed-mqtt-worker-signature'),
        version: requiredHeader(request, 'x-threed-mqtt-worker-version') as typeof THREED_MQTT_WORKER_AUTH_VERSION,
        body,
      }, encodedHmacKey, nonceStore);
    } catch {
      sendJson(response, 401, { success: false, error: 'Unauthorized' });
      return;
    }

    const route = parseFarmbotPath(url.pathname);
    if (!route) {
      sendJson(response, 404, { success: false, error: 'Not found' });
      return;
    }

    if (route.action === 'status' && method === 'GET') {
      const status = registry.get(route.farmbotId);
      sendJson(response, status ? 200 : 404, status
        ? { success: true, data: status }
        : { success: false, error: 'Session not found' });
      return;
    }

    if (route.action === 'session' && method === 'DELETE') {
      const removed = await registry.disconnect(route.farmbotId);
      sendJson(response, removed ? 200 : 404, removed
        ? { success: true }
        : { success: false, error: 'Session not found' });
      return;
    }

    if (route.action === 'session' && method === 'PUT') {
      try {
        if (request.headers['content-type'] !== 'application/json') {
          throw new Error('invalid_content_type');
        }
        const payload = JSON.parse(body.toString('utf8')) as unknown;
        const grant = parseFarmBotWorkerConnectionGrant(payload);
        if (grant.farmbotId !== route.farmbotId) throw new Error('farmbot_id_mismatch');
        const status = await registry.connect(grant);
        if (status.connectionState === 'error') {
          console.warn('FarmBot MQTT read-only session failed', {
            farmbotId: route.farmbotId,
            errorCode: status.errorCode,
          });
        }
        sendJson(response, status.connectionState === 'error' ? 503 : 202, {
          success: status.connectionState !== 'error',
          data: status,
        });
      } catch {
        sendJson(response, 400, { success: false, error: 'Invalid connection grant' });
      }
      return;
    }

    if (route.action === 'commands' && method === 'POST') {
      try {
        if (request.headers['content-type'] !== 'application/json'
          || body.byteLength > MAX_FARMBOT_WORKER_COMMAND_REQUEST_BYTES) {
          throw new Error('invalid_command_request');
        }
        const command = parseFarmBotWorkerWaterCommandRequest(
          JSON.parse(body.toString('utf8')) as unknown
        );
        if (command.farmbotId !== route.farmbotId) {
          throw new Error('farmbot_id_mismatch');
        }
        registry.assertCommandSession(command);
        const result = await guardedCommandExecutor.execute(command);
        sendJson(response, 202, { success: true, data: result });
      } catch (error) {
        if (error instanceof FarmBotWorkerCommandsDisabledError) {
          sendJson(response, 503, { success: false, error: 'FarmBot commands are disabled' });
          return;
        }
        if (error instanceof FarmBotWorkerCommandSessionError) {
          sendJson(response, 409, { success: false, error: 'FarmBot session is not ready' });
          return;
        }
        if (error instanceof FarmBotWorkerCommandGateError) {
          sendJson(response, 409, { success: false, error: 'FarmBot command conflict' });
          return;
        }
        sendJson(response, 400, { success: false, error: 'Invalid FarmBot command request' });
      }
      return;
    }

    if (route.action === 'recoveries' && method === 'POST') {
      try {
        if (request.headers['content-type'] !== 'application/json'
          || body.byteLength > MAX_FARMBOT_WORKER_RECOVERY_REQUEST_BYTES) {
          throw new Error('invalid_recovery_request');
        }
        const recovery = parseFarmBotWorkerWaterOffRecoveryRequest(
          JSON.parse(body.toString('utf8')) as unknown
        );
        if (recovery.farmbotId !== route.farmbotId) {
          throw new Error('farmbot_id_mismatch');
        }
        registry.assertCommandSession(recovery);
        const result = validateFarmBotWorkerRecoveryExecutionResult({
          request: recovery,
          result: await guardedRecoveryExecutor.execute(recovery),
        });
        sendJson(response, 202, { success: true, data: result });
      } catch (error) {
        if (error instanceof FarmBotWorkerRecoveryDisabledError) {
          sendJson(response, 503, { success: false, error: 'FarmBot recovery is disabled' });
          return;
        }
        if (error instanceof FarmBotWorkerCommandSessionError) {
          sendJson(response, 409, { success: false, error: 'FarmBot session is not ready' });
          return;
        }
        if (error instanceof FarmBotWorkerRecoveryExecutionResultError) {
          sendJson(response, 502, { success: false, error: 'Invalid recovery executor response' });
          return;
        }
        if (error instanceof FarmBotWorkerRecoveryGateError) {
          sendJson(response, 409, { success: false, error: 'FarmBot recovery conflict' });
          return;
        }
        sendJson(response, 400, { success: false, error: 'Invalid FarmBot recovery request' });
      }
      return;
    }

    sendJson(response, 405, { success: false, error: 'Method not allowed' });
  });

  return {
    server,
    registry,
    commandGate: guardedCommandExecutor,
    recoveryGate: guardedRecoveryExecutor,
  };
}

export async function startFarmBotWorker(): Promise<void> {
  const encodedHmacKey = process.env.THREED_MQTT_WORKER_HMAC_KEY;
  if (!encodedHmacKey) throw new Error('THREED_MQTT_WORKER_HMAC_KEY is required');
  const configuredPort = Number(process.env.THREED_MQTT_WORKER_PORT ?? DEFAULT_PORT);
  if (!Number.isSafeInteger(configuredPort) || configuredPort < 1 || configuredPort > 65_535) {
    throw new Error('THREED_MQTT_WORKER_PORT must be a valid TCP port');
  }

  const transportSetting = process.env.THREED_MQTT_TRANSPORT ?? 'disabled';
  if (transportSetting !== 'disabled' && transportSetting !== 'mqttjs') {
    throw new Error('THREED_MQTT_TRANSPORT must be disabled or mqttjs');
  }
  const transport = transportSetting === 'mqttjs'
    ? new MqttJsReadonlyTransport()
    : new MqttReadonlyTransportUnavailable();
  const timeoutReconciliation = createFarmBotWorkerTimeoutReconciliationRunner();
  const { server, registry, commandGate, recoveryGate } = createFarmBotWorkerServer(
    encodedHmacKey,
    createFarmBotWorkerPersistenceSink(),
    transport,
    transportSetting,
    new DisabledFarmBotWorkerCommandExecutor(),
    createFarmBotWorkerCommandAcknowledgementSink(),
    new DisabledFarmBotWorkerRecoveryExecutor(),
    createFarmBotWorkerRecoveryAcknowledgementSink(),
    createFarmBotWorkerCommandTimeoutSink()
  );
  const shutdown = async () => {
    server.close();
    await timeoutReconciliation.shutdown();
    await registry.shutdown();
    await commandGate.shutdown();
    await recoveryGate.flushAcknowledgements();
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
  timeoutReconciliation.start();
  server.listen(configuredPort, '127.0.0.1', () => {
    console.info('ThreeD MQTT FarmBot adapter listening', {
      host: '127.0.0.1',
      port: configuredPort,
      mqttTransport: transportSetting,
      commandsEnabled: false,
    });
  });
}
