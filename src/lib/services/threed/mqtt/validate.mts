import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IClientOptions } from 'mqtt';
import {
  MqttWorkerAuthError,
  MqttWorkerNonceStore,
  signMqttWorkerRequest,
  verifyMqttWorkerRequest,
} from './worker/auth';
import {
  MqttJsReadonlyTransport,
  type MqttConnector,
} from './transports/mqttjs';
import { MqttReadonlyTransportError } from './core/transport';
import {
  isMqttReadonlySessionExpired,
  mqttReadonlySessionTransition,
  planMqttReadonlyReconnect,
} from './core/session-lifecycle';
import { MqttReadonlySessionController } from './core/session-controller';
import type { MqttReadonlyIntegrationAdapter } from './core/integration-adapter';
import type {
  MqttReadonlyConnectionRequest,
  MqttReadonlyTransport,
  MqttReadonlyTransportCallbacks,
  MqttReadonlyTransportConnection,
} from './core/transport';

type FakeListener = (...args: never[]) => void;

// ThreeD owns this service boundary. Provider adapters may import it, but this
// directory must never depend on FarmBot, OpenFarm, or another integration.
const mqttServiceDirectory = dirname(fileURLToPath(import.meta.url));
const sharedMqttDirectories = [
  join(mqttServiceDirectory, 'core'),
  join(mqttServiceDirectory, 'transports'),
  join(mqttServiceDirectory, 'worker'),
];
const providerSegments = ['farmbot', 'openfarm'];
const importSpecifierPattern = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
for (const directory of sharedMqttDirectories) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !['.ts', '.mts'].includes(extname(entry.name))) continue;
    const source = readFileSync(join(directory, entry.name), 'utf8');
    for (const match of source.matchAll(importSpecifierPattern)) {
      const specifier = match[1] ?? '';
      assert.equal(
        providerSegments.some((provider) => specifier.split('/').includes(provider)),
        false,
        `ThreeD MQTT shared service cannot import provider adapter: ${entry.name} -> ${specifier}`
      );
    }
  }
}

const lifecycleNow = new Date('2026-08-20T12:00:00.000Z');
assert.deepEqual(mqttReadonlySessionTransition('connected', null, lifecycleNow), {
  connectionState: 'connected',
  stateChangedAt: lifecycleNow.toISOString(),
  errorCode: null,
});
assert.equal(
  isMqttReadonlySessionExpired(new Date(lifecycleNow.getTime()), lifecycleNow),
  true
);
assert.deepEqual(planMqttReadonlyReconnect({
  now: lifecycleNow,
  expiresAt: new Date(lifecycleNow.getTime() + 60_000),
  reconnectAttempts: 0,
  maxReconnectAttempts: 3,
  reconnectBaseDelayMs: 1_000,
  reconnectMaxDelayMs: 1_500,
  disconnectCode: 'network_closed',
}), {
  connectionState: 'reconnecting',
  stateChangedAt: lifecycleNow.toISOString(),
  errorCode: 'network_closed',
  reconnectAttempts: 1,
  reconnectDelayMs: 1_000,
});
assert.equal(planMqttReadonlyReconnect({
  now: lifecycleNow,
  expiresAt: new Date(lifecycleNow.getTime() + 60_000),
  reconnectAttempts: 1,
  maxReconnectAttempts: 4,
  reconnectBaseDelayMs: 1_000,
  reconnectMaxDelayMs: 1_500,
  disconnectCode: '',
}).reconnectDelayMs, 1_500);
assert.deepEqual(planMqttReadonlyReconnect({
  now: lifecycleNow,
  expiresAt: new Date(lifecycleNow.getTime() + 60_000),
  reconnectAttempts: 1,
  maxReconnectAttempts: 2,
  reconnectBaseDelayMs: 1_000,
  reconnectMaxDelayMs: 30_000,
  disconnectCode: 'network_closed',
}), {
  connectionState: 'error',
  stateChangedAt: lifecycleNow.toISOString(),
  errorCode: 'reconnect_limit_reached',
  reconnectAttempts: 2,
  reconnectDelayMs: null,
});
assert.equal(planMqttReadonlyReconnect({
  now: lifecycleNow,
  expiresAt: lifecycleNow,
  reconnectAttempts: 0,
  maxReconnectAttempts: 3,
  reconnectBaseDelayMs: 1_000,
  reconnectMaxDelayMs: 30_000,
  disconnectCode: 'network_closed',
}).connectionState, 'expired');

interface TestIntegrationGrant {
  id: number;
  ownerId: string;
  expiresAt: Date;
}

const testIntegrationAdapter: MqttReadonlyIntegrationAdapter<
  TestIntegrationGrant,
  { online: boolean }
> = {
  integrationType: 'test_provider',
  capabilities: ['read_status'],
  identify: (grant) => ({
    integrationType: 'test_provider',
    integrationId: grant.id,
    ownerId: grant.ownerId,
    clientId: `test_${grant.id}`,
  }),
  buildConnection: (grant) => ({
    brokerUrl: 'mqtts://broker.example.com:8883',
    username: `test_${grant.id}`,
    password: 'fabricated-secret',
    clientId: `threed_test_${grant.id}`,
    topics: [`test/${grant.id}/status`],
  }),
  acceptsTopic: (grant, topic) => topic === `test/${grant.id}/status`,
  normalizeMessage: (_grant, _topic, payload) => {
    const parsed = JSON.parse(Buffer.from(payload).toString('utf8')) as unknown;
    if (typeof parsed !== 'object' || parsed === null
      || typeof (parsed as { online?: unknown }).online !== 'boolean') return null;
    return { online: (parsed as { online: boolean }).online };
  },
};

class FakeSessionTransport implements MqttReadonlyTransport {
  connectCount = 0;
  closeCount = 0;
  callbacks: MqttReadonlyTransportCallbacks | null = null;
  requests: MqttReadonlyConnectionRequest[] = [];

  async connect(
    request: MqttReadonlyConnectionRequest,
    callbacks: MqttReadonlyTransportCallbacks
  ): Promise<MqttReadonlyTransportConnection> {
    this.connectCount += 1;
    this.requests.push(structuredClone(request));
    this.callbacks = callbacks;
    callbacks.onConnected();
    return { close: async () => { this.closeCount += 1; } };
  }
}

const sessionTransport = new FakeSessionTransport();
const normalizedMessages: Array<{ online: boolean }> = [];
const invalidTopics: string[] = [];
const sessionTransitions: string[] = [];
const sessionGrant: TestIntegrationGrant = {
  id: 7,
  ownerId: 'owner-1',
  expiresAt: new Date(lifecycleNow.getTime() + 60_000),
};
const sessionController = new MqttReadonlySessionController({
  grant: sessionGrant,
  expiresAt: (grant) => grant.expiresAt,
  adapter: testIntegrationAdapter,
  transport: sessionTransport,
  now: () => new Date(lifecycleNow),
  maxReconnectAttempts: 2,
  reconnectBaseDelayMs: 0,
  reconnectMaxDelayMs: 0,
  observer: {
    onTransition: ({ snapshot }) => sessionTransitions.push(snapshot.connectionState),
    onMessage: ({ message }) => normalizedMessages.push(message),
    onInvalidMessage: ({ topic }) => invalidTopics.push(topic),
  },
});
assert.equal((await sessionController.start()).connectionState, 'connected');
assert.equal(sessionTransport.connectCount, 1);
assert.deepEqual(sessionTransport.requests[0]?.topics, ['test/7/status']);
sessionTransport.callbacks?.onMessage(
  'test/7/status',
  Buffer.from(JSON.stringify({ online: true }))
);
assert.deepEqual(normalizedMessages, [{ online: true }]);
sessionTransport.callbacks?.onMessage('test/7/unknown', Buffer.from('{}'));
sessionTransport.callbacks?.onMessage('test/7/status', Buffer.from('{invalid'));
assert.deepEqual(invalidTopics, ['test/7/unknown', 'test/7/status']);
assert.equal(sessionController.snapshot().invalidMessageCount, 2);
assert.equal(sessionController.snapshot().lastMessageAt, lifecycleNow.toISOString());
sessionTransport.callbacks?.onDisconnected('network_closed');
assert.equal(sessionController.snapshot().connectionState, 'reconnecting');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(sessionTransport.connectCount, 2);
assert.equal(sessionController.snapshot().connectionState, 'connected');
await sessionController.stop();
assert.equal(sessionController.snapshot().connectionState, 'disconnected');
assert.equal(sessionTransport.closeCount, 1);
sessionTransport.callbacks?.onConnected();
sessionTransport.callbacks?.onMessage(
  'test/7/status',
  Buffer.from(JSON.stringify({ online: false }))
);
assert.equal(sessionController.snapshot().connectionState, 'disconnected');
assert.deepEqual(normalizedMessages, [{ online: true }]);
assert.deepEqual(sessionTransitions, [
  'connecting',
  'connected',
  'reconnecting',
  'connected',
  'disconnected',
]);

const expiredSessionTransport = new FakeSessionTransport();
const expiredSessionController = new MqttReadonlySessionController({
  grant: { ...sessionGrant, expiresAt: lifecycleNow },
  expiresAt: (grant) => grant.expiresAt,
  adapter: testIntegrationAdapter,
  transport: expiredSessionTransport,
  now: () => new Date(lifecycleNow),
});
assert.equal((await expiredSessionController.start()).connectionState, 'expired');
assert.equal(expiredSessionTransport.connectCount, 0);

class DelayedSessionTransport implements MqttReadonlyTransport {
  closeCount = 0;
  resolveConnection: (() => void) | null = null;

  connect(): Promise<MqttReadonlyTransportConnection> {
    return new Promise((resolve) => {
      this.resolveConnection = () => resolve({
        close: async () => { this.closeCount += 1; },
      });
    });
  }
}

const delayedSessionTransport = new DelayedSessionTransport();
const delayedSessionController = new MqttReadonlySessionController({
  grant: sessionGrant,
  expiresAt: (grant) => grant.expiresAt,
  adapter: testIntegrationAdapter,
  transport: delayedSessionTransport,
  now: () => new Date(lifecycleNow),
});
const delayedStart = delayedSessionController.start();
assert.equal(delayedSessionController.snapshot().connectionState, 'connecting');
await delayedSessionController.stop();
delayedSessionTransport.resolveConnection?.();
await delayedStart;
assert.equal(delayedSessionTransport.closeCount, 1);
assert.equal(delayedSessionController.snapshot().connectionState, 'disconnected');

class FakeReadonlyMqttClient {
  readonly listeners = new Map<string, Set<FakeListener>>();
  readonly subscriptions: Array<{ topics: string[]; options: { qos: 0 } }> = [];
  ended = false;

  on(event: string, listener: FakeListener): this {
    const listeners = this.listeners.get(event) ?? new Set<FakeListener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  off(event: string, listener: FakeListener): this {
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

const authKey = randomBytes(32).toString('base64');
const body = Buffer.from('{"provider":"example"}');
const authInput = {
  method: 'PUT',
  path: '/internal/v1/integrations/7/session',
  timestamp: String(Date.now()),
  nonce: randomBytes(18).toString('base64url'),
  body,
};
const authHeaders = signMqttWorkerRequest(authInput, authKey);
const nonceStore = new MqttWorkerNonceStore();
assert.doesNotThrow(() => verifyMqttWorkerRequest(
  { ...authInput, ...authHeaders },
  authKey,
  nonceStore
));
assert.throws(
  () => verifyMqttWorkerRequest({ ...authInput, ...authHeaders }, authKey, nonceStore),
  (error: unknown) => error instanceof MqttWorkerAuthError
    && error.code === 'replayed_nonce'
);
assert.throws(() => verifyMqttWorkerRequest(
  {
    ...authInput,
    ...authHeaders,
    nonce: randomBytes(18).toString('base64url'),
    body: Buffer.from('{"provider":"tampered"}'),
  },
  authKey,
  new MqttWorkerNonceStore()
));

const fakeClient = new FakeReadonlyMqttClient();
const connections: Array<{ brokerUrl: string; options: IClientOptions }> = [];
const connector: MqttConnector = async (brokerUrl, options) => {
  connections.push({ brokerUrl, options });
  return fakeClient;
};
const messages: Array<{ topic: string; payload: Uint8Array }> = [];
let connected = 0;
let disconnected = 0;
const transport = new MqttJsReadonlyTransport(connector);
const connection = await transport.connect({
  brokerUrl: 'wss://broker.example.com/ws/mqtt',
  username: 'integration-client',
  password: 'fabricated-secret',
  clientId: 'threed_mqtt_integration_7',
  topics: ['integrations/7/status', 'integrations/7/responses'],
}, {
  onConnected: () => { connected += 1; },
  onDisconnected: () => { disconnected += 1; },
  onMessage: (topic, payload) => messages.push({ topic, payload }),
});

assert.equal(connections.length, 1);
assert.equal(connections[0]?.brokerUrl, 'wss://broker.example.com/ws/mqtt');
assert.equal(connections[0]?.options.username, 'integration-client');
assert.equal(connections[0]?.options.reconnectPeriod, 0);
assert.equal(connections[0]?.options.resubscribe, false);
assert.equal(connections[0]?.options.rejectUnauthorized, true);
assert.deepEqual(fakeClient.subscriptions, [{
  topics: ['integrations/7/status', 'integrations/7/responses'],
  options: { qos: 0 },
}]);
assert.equal(connected, 1);
fakeClient.emit('message', 'integrations/7/status', Buffer.from('{"online":true}'));
assert.equal(messages.length, 1);
await connection.close();
assert.equal(fakeClient.ended, true);
assert.equal(disconnected, 0);

await assert.rejects(() => transport.connect({
  brokerUrl: 'wss://broker.example.com/ws/mqtt',
  username: 'integration-client',
  password: 'fabricated-secret',
  clientId: 'threed_mqtt_integration_7',
  topics: [],
}, {
  onConnected: () => undefined,
  onDisconnected: () => undefined,
  onMessage: () => undefined,
}), /invalid_read_only_topics/);

const rejectedConnector: MqttConnector = async () => {
  throw Object.assign(new Error('redacted'), { code: 5 });
};
await assert.rejects(
  () => new MqttJsReadonlyTransport(rejectedConnector).connect({
    brokerUrl: 'wss://broker.example.com/ws/mqtt',
    username: 'integration-client',
    password: 'fabricated-secret',
    clientId: 'threed_mqtt_integration_7',
    topics: ['integrations/7/status'],
  }, {
    onConnected: () => undefined,
    onDisconnected: () => undefined,
    onMessage: () => undefined,
  }),
  (error: unknown) => error instanceof MqttReadonlyTransportError
    && error.code === 'broker_auth_rejected'
);

const unreachableConnector: MqttConnector = async () => {
  throw Object.assign(new Error('redacted'), { code: 'ENOTFOUND' });
};
await assert.rejects(
  () => new MqttJsReadonlyTransport(unreachableConnector).connect({
    brokerUrl: 'wss://broker.example.com/ws/mqtt',
    username: 'integration-client',
    password: 'fabricated-secret',
    clientId: 'threed_mqtt_integration_7',
    topics: ['integrations/7/status'],
  }, {
    onConnected: () => undefined,
    onDisconnected: () => undefined,
    onMessage: () => undefined,
  }),
  (error: unknown) => error instanceof MqttReadonlyTransportError
    && error.code === 'broker_unreachable'
);

console.log('ThreeD MQTT service offline validation passed');
