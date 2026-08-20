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
} from './worker-auth-core';
import {
  MqttJsReadonlyTransport,
  type MqttConnector,
} from './mqttjs-transport';
import { MqttReadonlyTransportError } from './transport';

type FakeListener = (...args: never[]) => void;

// ThreeD owns this service boundary. Provider adapters may import it, but this
// directory must never depend on FarmBot, OpenFarm, or another integration.
const mqttServiceDirectory = dirname(fileURLToPath(import.meta.url));
const providerSegments = ['farmbot', 'openfarm'];
const importSpecifierPattern = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
for (const entry of readdirSync(mqttServiceDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || !['.ts', '.mts'].includes(extname(entry.name))) continue;
  const source = readFileSync(join(mqttServiceDirectory, entry.name), 'utf8');
  for (const match of source.matchAll(importSpecifierPattern)) {
    const specifier = match[1] ?? '';
    assert.equal(
      providerSegments.some((provider) => specifier.split('/').includes(provider)),
      false,
      `ThreeD MQTT service cannot import provider adapter: ${entry.name} -> ${specifier}`
    );
  }
}

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
