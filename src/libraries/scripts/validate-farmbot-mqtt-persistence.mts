import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import {
  FarmBotMqttPersistenceInputError,
  MAX_FARMBOT_MQTT_EVENTS_PER_BATCH,
  parseFarmBotMqttIngestionBatch,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/mqtt/integrations/farmbot/persistence-core.ts';

let completedValidationSteps = 0;
function validationStep(label: string): void {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD FarmBot MQTT persistence validation');
console.log('─'.repeat(40));

const now = new Date('2027-01-15T12:00:00.000Z');
const statusPayload = Buffer.from(JSON.stringify({
  location_data: { position: { x: 12.5, y: 4, z: -1 } },
  discarded: { secret: true },
}));
const payloadSha256 = createHash('sha256').update(statusPayload).digest('hex');
const sessionId = randomUUID();

const validBatch = {
  version: 1,
  farmbotId: 42,
  ownerId: 'owner-1',
  brokerDeviceId: 'device_123',
  workerSessionId: sessionId,
  runtime: {
    connectionState: 'connected',
    stateChangedAt: now.toISOString(),
    lastMessageAt: now.toISOString(),
    lastStatusAt: now.toISOString(),
    position: { x: 12.5, y: 4, z: -1 },
    tokenExpiresAt: new Date(now.getTime() + 60_000).toISOString(),
    isStale: false,
    reconnectAttempts: 0,
    invalidMessageCount: 0,
    errorCode: null,
  },
  events: [
    {
      eventId: randomUUID(),
      source: 'lifecycle',
      eventType: 'connection_state',
      connectionState: 'connected',
      outcome: 'observed',
      rpcLabel: null,
      errorCode: null,
      position: null,
      payloadBytes: 0,
      payloadSha256: createHash('sha256').update('').digest('hex'),
      occurredAt: now.toISOString(),
      rawData: { must: 'be ignored' },
    },
    {
      eventId: randomUUID(),
      source: 'status',
      eventType: 'position',
      connectionState: null,
      outcome: 'observed',
      rpcLabel: null,
      errorCode: null,
      position: { x: 12.5, y: 4, z: -1 },
      payloadBytes: statusPayload.byteLength,
      payloadSha256,
      occurredAt: now.toISOString(),
      rawPayload: statusPayload.toString('base64'),
    },
  ],
};

const parsed = parseFarmBotMqttIngestionBatch(validBatch, now);
assert.equal(parsed.events.length, 2);
assert.equal(parsed.events[0]?.summary, 'Connection state: connected');
assert.equal(parsed.events[1]?.summary, 'Position: X 12.5, Y 4, Z -1');
assert.ok(!JSON.stringify(parsed).includes('must'));
assert.ok(!JSON.stringify(parsed).includes(statusPayload.toString('base64')));
assert.equal(parsed.events[1]?.payloadSha256, payloadSha256);
validationStep('Runtime and normalized event ingestion');

assert.throws(() => parseFarmBotMqttIngestionBatch({
  ...validBatch,
  brokerDeviceId: 'device_123/#',
}, now), FarmBotMqttPersistenceInputError);
assert.throws(() => parseFarmBotMqttIngestionBatch({
  ...validBatch,
  events: [{ ...validBatch.events[1], payloadSha256: 'not-a-hash' }],
}, now), FarmBotMqttPersistenceInputError);
assert.throws(() => parseFarmBotMqttIngestionBatch({
  ...validBatch,
  events: [{ ...validBatch.events[0], connectionState: null }],
}, now), FarmBotMqttPersistenceInputError);
assert.throws(() => parseFarmBotMqttIngestionBatch({
  ...validBatch,
  events: Array.from({ length: MAX_FARMBOT_MQTT_EVENTS_PER_BATCH + 1 }, () => validBatch.events[0]),
}, now), (error: unknown) => error instanceof FarmBotMqttPersistenceInputError
  && error.code === 'batch_too_large');
assert.throws(() => parseFarmBotMqttIngestionBatch({
  ...validBatch,
  events: [{ ...validBatch.events[1], source: 'lifecycle' }],
}, now), FarmBotMqttPersistenceInputError);

validationStep('Strict identity, event shape, hash, and batch limits');
console.log('─'.repeat(40));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
console.log('FarmBot MQTT persistence validation passed\n');
