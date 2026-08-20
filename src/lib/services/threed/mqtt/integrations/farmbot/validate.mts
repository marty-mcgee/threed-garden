import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import {
  MqttWorkerAuthError,
  MqttWorkerNonceStore,
  signMqttWorkerRequest,
  verifyMqttWorkerRequest,
} from '../../worker/auth';
import {
  FarmBotWorkerGrantError,
  parseFarmBotWorkerConnectionGrant,
} from './grant';
import {
  FarmBotWorkerSessionRegistry,
  FarmBotWorkerSessionScopeError,
} from './session-registry';
import {
  farmBotWorkerTopics,
  parseFarmBotWorkerStatusPayload,
} from './status';
import { farmBotMqttReadonlyAdapter } from './adapter';
import { validateMqttReadonlyIntegrationAdapter } from '../../core/integration-adapter';
import type {
  MqttReadonlyConnectionRequest,
  MqttReadonlyTransport,
  MqttReadonlyTransportCallbacks,
  MqttReadonlyTransportConnection,
} from '../../core/transport';
import {
  MqttJsReadonlyTransport,
  type MqttConnector,
} from '../../transports/mqttjs';
import { createFarmBotWorkerServer } from './server';
import {
  DisabledFarmBotWorkerPersistenceSink,
  HttpFarmBotWorkerPersistenceSink,
  type FarmBotWorkerPersistenceRecord,
  type FarmBotWorkerPersistenceSink,
} from './persistence-client';

function testJwt(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

const now = new Date('2027-01-15T12:00:00.000Z');
const claims = {
  mqtt: 'broker.example.com',
  mqtt_ws: 'wss://broker.example.com/ws/mqtt',
  bot: 'device_123',
  vhost: 'test-vhost',
  iat: Math.floor(now.getTime() / 1000) - 60,
  exp: Math.floor(now.getTime() / 1000) + 3_600,
};
const credential = testJwt(claims);
const grantPayload = {
  version: 1,
  farmbotId: 42,
  ownerId: 'owner-1',
  farmbotDeviceId: 123,
  brokerDeviceId: claims.bot,
  mqttHost: claims.mqtt,
  mqttWsUrl: claims.mqtt_ws,
  vhost: claims.vhost,
  tokenIssuedAt: new Date(claims.iat * 1_000).toISOString(),
  tokenExpiresAt: new Date(claims.exp * 1_000).toISOString(),
  grantIssuedAt: now.toISOString(),
  grantExpiresAt: new Date(now.getTime() + 120_000).toISOString(),
  credential,
};

const grant = parseFarmBotWorkerConnectionGrant(grantPayload, now);
assert.equal(grant.brokerDeviceId, 'device_123');
assert.throws(
  () => parseFarmBotWorkerConnectionGrant({ ...grantPayload, brokerDeviceId: 'device_999' }, now),
  FarmBotWorkerGrantError
);

type FakeMqttListener = (...args: never[]) => void;
class FakeReadonlyMqttClient {
  readonly listeners = new Map<string, Set<FakeMqttListener>>();
  subscriptions: { topics: string[]; options: { qos: 0 } }[] = [];
  ended = false;

  on(event: string, listener: FakeMqttListener): this {
    const listeners = this.listeners.get(event) ?? new Set<FakeMqttListener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  off(event: string, listener: FakeMqttListener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args as never[]);
    }
  }

  async subscribeAsync(topics: string[], options: { qos: 0 }) {
    this.subscriptions.push({ topics, options });
    return topics.map((topic) => ({ topic, qos: 0 as const }));
  }

  async endAsync(): Promise<void> {
    this.ended = true;
    this.emit('close');
  }
}

const fakeMqttClient = new FakeReadonlyMqttClient();
const mqttConnectInputs: Array<{ brokerUrl: string; options: Record<string, unknown> }> = [];
const fakeMqttConnector: MqttConnector = async (brokerUrl, options) => {
  mqttConnectInputs.push({ brokerUrl, options: options as Record<string, unknown> });
  return fakeMqttClient;
};
const mqttMessages: Array<{ topic: string; payload: Uint8Array }> = [];
let mqttConnected = 0;
let mqttDisconnected = 0;
const mqttConnection = await new MqttJsReadonlyTransport(fakeMqttConnector).connect(
  {
    brokerUrl: grant.mqttWsUrl,
    username: grant.brokerDeviceId,
    password: grant.credential,
    clientId: `marty_mcgee_farmbot_${grant.farmbotId}`,
    topics: ['bot/device_123/status', 'bot/device_123/from_device'],
  },
  {
    onConnected: () => { mqttConnected += 1; },
    onDisconnected: () => { mqttDisconnected += 1; },
    onMessage: (topic, payload) => mqttMessages.push({ topic, payload }),
  }
);
const mqttConnectInput = mqttConnectInputs[0];
assert.ok(mqttConnectInput);
assert.equal(mqttConnectInput.brokerUrl, claims.mqtt_ws);
assert.equal(mqttConnectInput.options.username, claims.bot);
assert.equal(
  Buffer.from(mqttConnectInput.options.password as Uint8Array).toString('utf8'),
  credential
);
assert.equal(mqttConnectInput.options.reconnectPeriod, 0);
assert.equal(mqttConnectInput.options.resubscribe, false);
assert.equal(mqttConnectInput.options.rejectUnauthorized, true);
assert.deepEqual(fakeMqttClient.subscriptions, [{
  topics: ['bot/device_123/status', 'bot/device_123/from_device'],
  options: { qos: 0 },
}]);
assert.equal(mqttConnected, 1);
fakeMqttClient.emit('message', 'bot/device_123/status', Buffer.from('{"safe":true}'));
assert.equal(mqttMessages.length, 1);
await mqttConnection.close();
assert.equal(fakeMqttClient.ended, true);
assert.equal(mqttDisconnected, 0, 'Intentional close must not report a transport failure');
assert.throws(
  () => parseFarmBotWorkerConnectionGrant({
    ...grantPayload,
    grantExpiresAt: new Date(now.getTime() - 1).toISOString(),
  }, now),
  FarmBotWorkerGrantError
);

const authKey = randomBytes(32).toString('base64');
const otherAuthKey = randomBytes(32).toString('base64');
const authBody = Buffer.from(JSON.stringify(grantPayload));
const authInput = {
  method: 'PUT',
  path: '/internal/v1/farmbots/42/session',
  timestamp: String(now.getTime()),
  nonce: randomBytes(18).toString('base64url'),
  body: authBody,
};
const headers = signMqttWorkerRequest(authInput, authKey);
const nonceStore = new MqttWorkerNonceStore();
assert.doesNotThrow(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers },
  authKey,
  nonceStore,
  now.getTime()
));
assert.throws(
  () => verifyMqttWorkerRequest(
    { ...authInput, ...headers },
    authKey,
    nonceStore,
    now.getTime()
  ),
  (error: unknown) => error instanceof MqttWorkerAuthError
    && error.code === 'replayed_nonce'
);
assert.throws(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers, nonce: randomBytes(18).toString('base64url') },
  otherAuthKey,
  new MqttWorkerNonceStore(),
  now.getTime()
));
assert.throws(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers, body: Buffer.from('tampered') },
  authKey,
  new MqttWorkerNonceStore(),
  now.getTime()
));
assert.throws(() => verifyMqttWorkerRequest(
  { ...authInput, ...headers },
  authKey,
  new MqttWorkerNonceStore(),
  now.getTime() + 61_000
));

assert.deepEqual(farmBotWorkerTopics('device_123'), {
  status: 'bot/device_123/status',
  fromDevice: 'bot/device_123/from_device',
});
assert.deepEqual(parseFarmBotWorkerStatusPayload(Buffer.from(JSON.stringify({
  location_data: { position: { x: 10, y: 20, z: -3 } },
  private_tree: { discarded: true },
}))), { x: 10, y: 20, z: -3 });
assert.throws(() => parseFarmBotWorkerStatusPayload(Buffer.from('{invalid')));
assert.throws(() => farmBotWorkerTopics('device_123/#'));
assert.doesNotThrow(() => validateMqttReadonlyIntegrationAdapter(farmBotMqttReadonlyAdapter));
assert.deepEqual(farmBotMqttReadonlyAdapter.identify(grant), {
  integrationType: 'farmbot',
  integrationId: 42,
  ownerId: 'owner-1',
  clientId: 'device_123',
});
assert.deepEqual(farmBotMqttReadonlyAdapter.buildConnection(grant), {
  brokerUrl: 'mqtts://broker.example.com:8883',
  username: 'device_123',
  password: credential,
  clientId: 'marty_mcgee_farmbot_42',
  topics: ['bot/device_123/status', 'bot/device_123/from_device'],
});
assert.equal(
  farmBotMqttReadonlyAdapter.acceptsTopic(grant, 'bot/device_123/status'),
  true
);
assert.equal(
  farmBotMqttReadonlyAdapter.acceptsTopic(grant, 'bot/device_123/unapproved'),
  false
);
assert.deepEqual(farmBotMqttReadonlyAdapter.normalizeMessage(
  grant,
  'bot/device_123/status',
  Buffer.from(JSON.stringify({ location_data: { position: { x: 4, y: 5, z: 6 } } }))
), { kind: 'status', position: { x: 4, y: 5, z: 6 } });
assert.equal(farmBotMqttReadonlyAdapter.normalizeMessage(
  grant,
  'bot/device_123/unapproved',
  Buffer.from('{}')
), null);

class FakeTransport implements MqttReadonlyTransport {
  connectCount = 0;
  closeCount = 0;
  failConnect = false;
  callbacks: MqttReadonlyTransportCallbacks | null = null;
  requests: MqttReadonlyConnectionRequest[] = [];

  async connect(
    request: MqttReadonlyConnectionRequest,
    callbacks: MqttReadonlyTransportCallbacks
  ): Promise<MqttReadonlyTransportConnection> {
    this.connectCount += 1;
    this.requests.push(structuredClone(request));
    if (this.failConnect) throw new Error('offline transport failure');
    this.callbacks = callbacks;
    callbacks.onConnected();
    return {
      close: async () => {
        this.closeCount += 1;
      },
    };
  }
}

class FakePersistenceSink implements FarmBotWorkerPersistenceSink {
  records: FarmBotWorkerPersistenceRecord[] = [];
  flushCount = 0;

  record(record: FarmBotWorkerPersistenceRecord): void {
    this.records.push(structuredClone(record));
  }

  async flush(): Promise<void> {
    this.flushCount += 1;
  }
}

let testNow = new Date(now);
const transport = new FakeTransport();
const persistence = new FakePersistenceSink();
const registry = new FarmBotWorkerSessionRegistry(transport, {
  now: () => new Date(testNow),
  staleAfterMs: 30_000,
  maxReconnectAttempts: 2,
  reconnectBaseDelayMs: 0,
  reconnectMaxDelayMs: 0,
}, persistence);
assert.equal((await registry.connect(grant)).connectionState, 'connected');
assert.equal(transport.connectCount, 1);
assert.equal(transport.requests[0]?.brokerUrl, 'mqtts://broker.example.com:8883');
assert.equal(transport.requests[0]?.username, 'device_123');
assert.deepEqual(transport.requests[0]?.topics, [
  'bot/device_123/status',
  'bot/device_123/from_device',
]);
assert.equal((await registry.connect(grant)).connectionState, 'connected');
assert.equal(transport.connectCount, 1, 'Matching grants must be idempotent');
await assert.rejects(
  registry.connect({ ...grant, ownerId: 'different-owner' }),
  FarmBotWorkerSessionScopeError
);
assert.equal(transport.connectCount, 1, 'Owner mismatch must not replace the current session');

transport.callbacks?.onMessage(
  'bot/device_123/status',
  Buffer.from(JSON.stringify({ location_data: { position: { x: 1, y: 2, z: 3 } } }))
);
assert.deepEqual(registry.get(42)?.position, { x: 1, y: 2, z: 3 });
assert.equal(registry.get(42)?.stale, false);
const firstPositionRecordCount = persistence.records.filter(
  (record) => record.event?.eventType === 'position'
).length;
transport.callbacks?.onMessage(
  'bot/device_123/status',
  Buffer.from(JSON.stringify({ location_data: { position: { x: 1, y: 2, z: 3 } } }))
);
assert.equal(
  persistence.records.filter((record) => record.event?.eventType === 'position').length,
  firstPositionRecordCount,
  'Unchanged positions inside the heartbeat window must not append history'
);
transport.callbacks?.onMessage(
  'bot/device_123/from_device',
  Buffer.from(JSON.stringify({ kind: 'rpc_ok', args: { label: 'test_rpc_1' } }))
);
assert.equal(
  persistence.records.some((record) => record.event?.eventType === 'rpc_ok'
    && record.event.rpcLabel === 'test_rpc_1'),
  true
);
assert.equal(JSON.stringify(persistence.records).includes(credential), false);
transport.callbacks?.onMessage('bot/device_123/unapproved', Buffer.from('{}'));
assert.equal(registry.get(42)?.invalidMessageCount, 1);
assert.equal(registry.get(42)?.lastMessageAt, now.toISOString());
transport.callbacks?.onMessage('bot/device_123/status', Buffer.from('{invalid'));
assert.equal(registry.get(42)?.invalidMessageCount, 2);
assert.equal(registry.get(42)?.lastMessageAt, testNow.toISOString());

testNow = new Date(now.getTime() + 31_000);
assert.equal(registry.get(42)?.stale, true);
transport.callbacks?.onDisconnected('network_closed');
assert.equal(registry.get(42)?.connectionState, 'reconnecting');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(transport.connectCount, 2);
assert.equal(registry.get(42)?.connectionState, 'connected');
transport.failConnect = true;
transport.callbacks?.onDisconnected('network_closed');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(registry.get(42)?.connectionState, 'error');
await Promise.resolve();

assert.equal(await registry.disconnect(42), true);
assert.equal(transport.closeCount, 0);
assert.equal(registry.get(42), null);
assert.deepEqual(
  persistence.records
    .filter((record) => record.event?.eventType === 'connection_state')
    .map((record) => record.event?.connectionState),
  [
    'connecting',
    'connected',
    'reconnecting',
    'connected',
    'reconnecting',
    'error',
    'disconnected',
  ]
);
await registry.shutdown();
assert.equal(persistence.flushCount, 1);

const originalFetch = globalThis.fetch;
const persistenceRequests: Array<Record<string, unknown>> = [];
let failNextPersistenceRequest = true;
globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
  persistenceRequests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
  if (failNextPersistenceRequest) {
    failNextPersistenceRequest = false;
    return new Response(null, { status: 503 });
  }
  return new Response(null, { status: 204 });
}) as typeof fetch;
try {
  const httpPersistence = new HttpFarmBotWorkerPersistenceSink(
    'http://127.0.0.1:3000',
    authKey
  );
  const runtime = persistence.records.at(-1)?.runtime;
  assert.ok(runtime);
  for (let index = 0; index < 201; index += 1) {
    httpPersistence.record({
      ownerId: grant.ownerId,
      farmbotId: grant.farmbotId,
      brokerDeviceId: grant.brokerDeviceId,
      workerSessionId: '00000000-0000-4000-8000-000000000001',
      runtime,
      event: {
        eventId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        source: 'status',
        eventType: 'position',
        connectionState: 'connected',
        outcome: null,
        rpcLabel: null,
        errorCode: null,
        summary: 'test position',
        position: { x: index, y: 0, z: 0 },
        payloadBytes: 1,
        payloadSha256: 'a'.repeat(64),
        occurredAt: now,
      },
    });
  }
  await httpPersistence.flush();
  assert.equal(persistenceRequests.length, 1);
  await httpPersistence.flush();
  const retriedEventCount = persistenceRequests.slice(1).reduce((total, request) => (
    total + ((request.events as unknown[])?.length ?? 0)
  ), 0);
  assert.equal(retriedEventCount, 201, 'A failed batch must retain all later unsent events');
} finally {
  globalThis.fetch = originalFetch;
}

const workerServer = createFarmBotWorkerServer(
  authKey,
  new DisabledFarmBotWorkerPersistenceSink()
);
await new Promise<void>((resolve, reject) => {
  workerServer.server.once('error', reject);
  workerServer.server.listen(0, '127.0.0.1', resolve);
});
const address = workerServer.server.address() as AddressInfo;
const origin = `http://127.0.0.1:${address.port}`;

const healthResponse = await fetch(`${origin}/health`);
assert.equal(healthResponse.status, 200);
const healthBody = await healthResponse.json() as Record<string, unknown>;
assert.equal(healthBody.ok, true);
assert.equal(healthBody.mqttTransport, 'disabled');
assert.equal(healthBody.commandsEnabled, false);

const liveNow = new Date();
const liveClaims = {
  ...claims,
  iat: Math.floor(liveNow.getTime() / 1000) - 60,
  exp: Math.floor(liveNow.getTime() / 1000) + 3_600,
};
const liveCredential = testJwt(liveClaims);
const liveGrantPayload = {
  ...grantPayload,
  tokenIssuedAt: new Date(liveClaims.iat * 1_000).toISOString(),
  tokenExpiresAt: new Date(liveClaims.exp * 1_000).toISOString(),
  grantIssuedAt: liveNow.toISOString(),
  grantExpiresAt: new Date(liveNow.getTime() + 120_000).toISOString(),
  credential: liveCredential,
};
const liveAuthBody = Buffer.from(JSON.stringify(liveGrantPayload));
const requestPath = '/internal/v1/farmbots/42/session';
const requestTimestamp = String(Date.now());
const requestNonce = randomBytes(18).toString('base64url');
const requestHeaders = signMqttWorkerRequest({
  method: 'PUT',
  path: requestPath,
  timestamp: requestTimestamp,
  nonce: requestNonce,
  body: liveAuthBody,
}, authKey);
const httpHeaders = {
  'content-type': 'application/json',
  'x-threed-mqtt-worker-version': requestHeaders.version,
  'x-threed-mqtt-worker-timestamp': requestHeaders.timestamp,
  'x-threed-mqtt-worker-nonce': requestHeaders.nonce,
  'x-threed-mqtt-worker-signature': requestHeaders.signature,
};
const connectResponse = await fetch(`${origin}${requestPath}`, {
  method: 'PUT',
  headers: httpHeaders,
  body: liveAuthBody,
});
assert.equal(connectResponse.status, 503, 'The Phase 2B executable must not open MQTT');
const connectBody = JSON.stringify(await connectResponse.json());
assert.ok(!connectBody.includes(liveCredential), 'Worker responses must not expose credentials');

const replayResponse = await fetch(`${origin}${requestPath}`, {
  method: 'PUT',
  headers: httpHeaders,
  body: liveAuthBody,
});
assert.equal(replayResponse.status, 401, 'Signed requests must not be replayable');

await workerServer.registry.shutdown();
await new Promise<void>((resolve, reject) => {
  workerServer.server.close((error) => error ? reject(error) : resolve());
});

console.log('FarmBot MQTT worker Phase 2B/2C offline validation passed');
