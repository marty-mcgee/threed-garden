import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import {
  THREED_MQTT_WORKER_AUTH_VERSION,
  MqttWorkerNonceStore,
  verifyMqttWorkerRequest,
} from '../../mqtt/worker-auth-core';
import {
  MAX_FARMBOT_WORKER_GRANT_BYTES,
  parseFarmBotWorkerConnectionGrant,
} from './grant-core';
import { FarmBotWorkerSessionRegistry } from './session-registry';
import { MqttReadonlyTransportUnavailable } from '../../mqtt/transport';
import type { MqttReadonlyTransport } from '../../mqtt/transport';
import { MqttJsReadonlyTransport } from '../../mqtt/mqttjs-transport';
import { createFarmBotWorkerPersistenceSink } from './persistence-client';

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

function parseFarmbotPath(pathname: string): { farmbotId: number; action: 'status' | 'session' } | null {
  const match = pathname.match(/^\/internal\/v1\/farmbots\/([1-9]\d*)\/(status|session)$/);
  if (!match) return null;
  const farmbotId = Number(match[1]);
  if (!Number.isSafeInteger(farmbotId)) return null;
  return { farmbotId, action: match[2] as 'status' | 'session' };
}

export function createFarmBotWorkerServer(
  encodedHmacKey: string,
  persistence = createFarmBotWorkerPersistenceSink(),
  transport: MqttReadonlyTransport = new MqttReadonlyTransportUnavailable(),
  transportName: 'disabled' | 'mqttjs' = 'disabled'
) {
  const nonceStore = new MqttWorkerNonceStore();
  const registry = new FarmBotWorkerSessionRegistry(
    transport,
    {},
    persistence
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

    sendJson(response, 405, { success: false, error: 'Method not allowed' });
  });

  return { server, registry };
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
  const { server, registry } = createFarmBotWorkerServer(
    encodedHmacKey,
    createFarmBotWorkerPersistenceSink(),
    transport,
    transportSetting
  );
  const shutdown = async () => {
    server.close();
    await registry.shutdown();
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
  server.listen(configuredPort, '127.0.0.1', () => {
    console.info('ThreeD MQTT FarmBot adapter listening', {
      host: '127.0.0.1',
      port: configuredPort,
      mqttTransport: transportSetting,
      commandsEnabled: false,
    });
  });
}
