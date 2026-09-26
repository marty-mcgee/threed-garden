import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import {
  decryptFarmBotCredential,
  encryptFarmBotCredential,
  type EncryptedFarmBotCredential,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/credential-crypto-core.ts';
import {
  farmBotCredentialNeedsRotation,
  resolveCurrentFarmBotCredentialKey,
  resolveFarmBotCredentialKey,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/credential-keyring-core.ts';
import {
  CLEARED_FARMBOT_CREDENTIAL_COLUMNS,
  readFarmBotCredentialEnvelope,
  toFarmBotCredentialEnvelopeColumns,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/credential-envelope-core.ts';
import {
  FarmBotTokenServiceUnavailableError,
  readFarmBotEncodedToken,
  readFarmBotJwtMetadata,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/token-client-core.ts';
import {
  FarmBotConnectionUnavailableError,
  readFarmBotConnectionSummary,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/connection-client-core.ts';
import {
  MAX_FARMBOT_PERIPHERALS,
  readFarmBotPeripheralInventory,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/peripheral-client-core.ts';
import {
  isFarmBotSemanticAction,
  validateFarmBotPeripheralBindingSnapshot,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/peripheral-binding-core.ts';
import {
  assertFarmBotBrokerIdentityUnchanged,
  assertFarmBotRestAndBrokerIdentityMatch,
  expectedFarmBotBrokerDeviceId,
  FarmBotBrokerIdentityMismatchError,
  FarmBotBrokerMetadataError,
  readFarmBotBrokerMetadata,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/broker-metadata-core.ts';
import {
  evaluateFarmBotMqttReadiness,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/farmbot/mqtt-readiness-core.ts';

let completedValidationSteps = 0;
function validationStep(label: string): void {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
}

console.log('\nThreeD FarmBot credential security validation');
console.log('─'.repeat(40));

const key = randomBytes(32).toString('base64');
const otherKey = randomBytes(32).toString('base64');
const credential = 'test-only-farmbot-token';
const context = { userId: 'test-user', farmbotId: 42 };

const first = encryptFarmBotCredential(credential, key, 1, context);
const second = encryptFarmBotCredential(credential, key, 1, context);

assert.equal(decryptFarmBotCredential(first, key, context), credential);
assert.equal(first.version, 1);
assert.equal(first.keyVersion, 1);
assert.equal(first.algorithm, 'aes-256-gcm');
assert.notEqual(first.iv, second.iv, 'Each encryption must use a unique IV');
assert.ok(!JSON.stringify(first).includes(credential), 'Envelope must not contain plaintext');

const tampered: EncryptedFarmBotCredential = {
  ...first,
  ciphertext: Buffer.from(`tampered:${first.ciphertext}`, 'utf8').toString('base64'),
};

assert.throws(() => decryptFarmBotCredential(tampered, key, context));
assert.throws(() => decryptFarmBotCredential(first, otherKey, context));
assert.throws(() => decryptFarmBotCredential(first, key, { ...context, farmbotId: 43 }));
assert.throws(() => decryptFarmBotCredential(first, key, { ...context, userId: 'other-user' }));
assert.throws(() => encryptFarmBotCredential('', key, 1, context));
assert.throws(() => encryptFarmBotCredential(credential, 'not-a-32-byte-key', 1, context));
assert.throws(() => encryptFarmBotCredential(credential, key, 0, context));
validationStep('Credential encryption, tamper resistance, and owner/device binding');

const keyEnvironment = {
  FARMBOT_CREDENTIAL_KEY_VERSION: '2',
  FARMBOT_CREDENTIAL_KEY_V1: key,
  FARMBOT_CREDENTIAL_KEY_V2: otherKey,
};

assert.deepEqual(resolveFarmBotCredentialKey(1, keyEnvironment), {
  version: 1,
  encodedKey: key,
});
assert.deepEqual(resolveCurrentFarmBotCredentialKey(keyEnvironment), {
  version: 2,
  encodedKey: otherKey,
});
assert.equal(farmBotCredentialNeedsRotation(first, 2), true);
assert.equal(farmBotCredentialNeedsRotation({ keyVersion: 2 }, 2), false);
assert.throws(() => resolveCurrentFarmBotCredentialKey({}));
assert.throws(() => resolveCurrentFarmBotCredentialKey({
  FARMBOT_CREDENTIAL_KEY_VERSION: 'invalid',
}));
assert.throws(() => resolveCurrentFarmBotCredentialKey({
  FARMBOT_CREDENTIAL_KEY_VERSION: '3',
}));
assert.throws(() => resolveCurrentFarmBotCredentialKey({
  FARMBOT_CREDENTIAL_KEY_VERSION: '1',
  FARMBOT_CREDENTIAL_KEY_V1: 'malformed',
}));
assert.throws(() => resolveFarmBotCredentialKey(0, keyEnvironment));
validationStep('Encryption key selection and rotation policy');

const updatedAt = new Date('2026-08-18T12:00:00.000Z');
const envelopeColumns = toFarmBotCredentialEnvelopeColumns(first, updatedAt);
assert.deepEqual(readFarmBotCredentialEnvelope(envelopeColumns), first);
assert.equal(readFarmBotCredentialEnvelope({
  credentialCiphertext: null,
  credentialIv: null,
  credentialAuthTag: null,
  credentialEnvelopeVersion: null,
  credentialKeyVersion: null,
  credentialUpdatedAt: null,
}), null);
assert.throws(() => readFarmBotCredentialEnvelope({
  ...envelopeColumns,
  credentialAuthTag: null,
}));
assert.throws(() => readFarmBotCredentialEnvelope({
  ...envelopeColumns,
  credentialEnvelopeVersion: 2,
}));
assert.throws(() => toFarmBotCredentialEnvelopeColumns(
  first,
  new Date(Number.NaN)
));
assert.ok(Object.values(CLEARED_FARMBOT_CREDENTIAL_COLUMNS).every((value) => value === null));
validationStep('Database envelope conversion and cleared credential fields');

const testJwt = 'test-header.test-payload.test-signature';
assert.equal(readFarmBotEncodedToken({ token: { encoded: ` ${testJwt} ` } }), testJwt);
assert.throws(
  () => readFarmBotEncodedToken({ token: { encoded: '' } }),
  FarmBotTokenServiceUnavailableError
);
assert.throws(
  () => readFarmBotEncodedToken({ token: { encoded: 'not-a-jwt' } }),
  FarmBotTokenServiceUnavailableError
);
assert.throws(
  () => readFarmBotEncodedToken({ error: 'upstream response shape' }),
  FarmBotTokenServiceUnavailableError
);

const metadataPayload = Buffer.from(JSON.stringify({
  bot: 'device_123',
  exp: 1_800_000_000,
  secret_claim: 'must-not-be-returned',
})).toString('base64url');
assert.deepEqual(readFarmBotJwtMetadata(`header.${metadataPayload}.signature`), {
  brokerDeviceId: 'device_123',
  expiresAt: '2027-01-15T08:00:00.000Z',
});
assert.deepEqual(readFarmBotJwtMetadata('malformed'), {
  brokerDeviceId: null,
  expiresAt: null,
});
validationStep('FarmBot token extraction and limited JWT metadata');

function testFarmBotJwt(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

const validBrokerClaims = {
  mqtt: 'clever-octopus.rmq.cloudamqp.com',
  mqtt_ws: 'wss://clever-octopus.rmq.cloudamqp.com:443/ws/mqtt',
  bot: 'device_123',
  vhost: 'example-vhost',
  iat: 1_800_000_000,
  exp: 1_800_086_400,
};
assert.deepEqual(readFarmBotBrokerMetadata(testFarmBotJwt(validBrokerClaims)), {
  mqttHost: 'clever-octopus.rmq.cloudamqp.com',
  mqttWsUrl: 'wss://clever-octopus.rmq.cloudamqp.com:443/ws/mqtt',
  brokerDeviceId: 'device_123',
  vhost: 'example-vhost',
  tokenIssuedAt: new Date('2027-01-15T08:00:00.000Z'),
  tokenExpiresAt: new Date('2027-01-16T08:00:00.000Z'),
});
const currentBrokerMetadata = readFarmBotBrokerMetadata(testFarmBotJwt(validBrokerClaims));
const movedBrokerMetadata = readFarmBotBrokerMetadata(testFarmBotJwt({
  ...validBrokerClaims,
  mqtt: 'new-broker.example.com',
  mqtt_ws: 'wss://new-broker.example.com/ws/mqtt',
  vhost: 'new-vhost',
}));
assert.doesNotThrow(() => assertFarmBotBrokerIdentityUnchanged(
  currentBrokerMetadata,
  movedBrokerMetadata
));
assert.throws(
  () => assertFarmBotBrokerIdentityUnchanged(currentBrokerMetadata, {
    ...movedBrokerMetadata,
    brokerDeviceId: 'device_999',
  }),
  FarmBotBrokerIdentityMismatchError
);
assert.equal(expectedFarmBotBrokerDeviceId(123), 'device_123');
assert.doesNotThrow(() => assertFarmBotRestAndBrokerIdentityMatch(123, 'device_123'));
assert.throws(
  () => assertFarmBotRestAndBrokerIdentityMatch(123, 'device_999'),
  FarmBotBrokerIdentityMismatchError
);
assert.throws(() => expectedFarmBotBrokerDeviceId(0), FarmBotBrokerIdentityMismatchError);
const readyAt = new Date('2027-01-15T12:00:00.000Z');
const readySnapshot = {
  ...currentBrokerMetadata,
  restVerifiedAt: readyAt,
};
assert.deepEqual(evaluateFarmBotMqttReadiness({
  checkedAt: readyAt,
  credentialMetadata: currentBrokerMetadata,
  farmbotDeviceId: 123,
  brokerDeviceId: 'device_123',
  snapshot: readySnapshot,
}).issues, []);
assert.deepEqual(evaluateFarmBotMqttReadiness({
  checkedAt: new Date('2027-01-17T12:00:00.000Z'),
  credentialMetadata: currentBrokerMetadata,
  farmbotDeviceId: null,
  brokerDeviceId: null,
  snapshot: { ...readySnapshot, restVerifiedAt: null },
}).issues, ['identity_not_verified', 'token_expired', 'rest_verification_required']);
assert.throws(
  () => readFarmBotBrokerMetadata(testFarmBotJwt({
    ...validBrokerClaims,
    mqtt_ws: 'ws://clever-octopus.rmq.cloudamqp.com/ws/mqtt',
  })),
  FarmBotBrokerMetadataError
);
validationStep('Broker identity, secure metadata, and MQTT readiness');
assert.throws(
  () => readFarmBotBrokerMetadata(testFarmBotJwt({
    ...validBrokerClaims,
    mqtt_ws: 'wss://different-broker.example/ws/mqtt',
  })),
  FarmBotBrokerMetadataError
);
assert.throws(
  () => readFarmBotBrokerMetadata(testFarmBotJwt({ ...validBrokerClaims, bot: 'not-a-device' })),
  FarmBotBrokerMetadataError
);
assert.throws(
  () => readFarmBotBrokerMetadata(testFarmBotJwt({
    ...validBrokerClaims,
    exp: validBrokerClaims.iat,
  })),
  FarmBotBrokerMetadataError
);

assert.deepEqual(readFarmBotConnectionSummary({
  id: 29,
  name: 'Test FarmBot',
  fbos_version: '17.0.0',
  last_saw_api: '2026-08-18T12:00:00.000Z',
  last_saw_mq: null,
  timezone: 'America/Los_Angeles',
  serial_number: 'must-not-be-returned',
}), {
  authenticated: true,
  deviceId: 29,
  name: 'Test FarmBot',
  firmwareVersion: '17.0.0',
  lastSawApi: '2026-08-18T12:00:00.000Z',
  lastSawMessageBroker: null,
  timezone: 'America/Los_Angeles',
  brokerDeviceId: null,
  credentialExpiresAt: null,
});
assert.throws(
  () => readFarmBotConnectionSummary({ error: 'unexpected response' }),
  FarmBotConnectionUnavailableError
);

assert.deepEqual(readFarmBotPeripheralInventory([{
  id: 7,
  pin: 8,
  label: 'Water Valve',
  mode: 0,
  secret_field: 'must-not-be-returned',
}]), {
  peripherals: [{ id: 7, pin: 8, label: 'Water Valve', mode: 0 }],
  totalCount: 1,
  truncated: false,
});
assert.throws(
  () => readFarmBotPeripheralInventory([{ id: 7, pin: 'invalid', label: 'Valve', mode: 0 }]),
  FarmBotConnectionUnavailableError
);
const oversizedPeripheralList = Array.from({ length: MAX_FARMBOT_PERIPHERALS + 1 }, (_, index) => ({
  id: index + 1,
  pin: index,
  label: `Peripheral ${index + 1}`,
  mode: 0,
}));
const cappedPeripheralInventory = readFarmBotPeripheralInventory(oversizedPeripheralList);
assert.equal(cappedPeripheralInventory.peripherals.length, MAX_FARMBOT_PERIPHERALS);
assert.equal(cappedPeripheralInventory.totalCount, MAX_FARMBOT_PERIPHERALS + 1);
assert.equal(cappedPeripheralInventory.truncated, true);
validationStep('Safe connection summary and bounded peripheral discovery');

const waterPeripheral = { id: 8, pin: 8, label: 'Water', mode: 0 as const };
const waterBinding = {
  semanticAction: 'water',
  peripheralId: 8,
  peripheralLabel: 'Water',
  peripheralPin: 8,
  peripheralMode: 0,
  isActive: true,
};
assert.equal(isFarmBotSemanticAction('water'), true);
assert.equal(isFarmBotSemanticAction('arbitrary_command'), false);
assert.deepEqual(validateFarmBotPeripheralBindingSnapshot(waterBinding, [waterPeripheral]), {
  valid: true,
  reason: 'valid',
  peripheral: waterPeripheral,
});
assert.equal(
  validateFarmBotPeripheralBindingSnapshot(
    { ...waterBinding, isActive: false },
    [waterPeripheral]
  ).reason,
  'binding_inactive'
);
assert.equal(validateFarmBotPeripheralBindingSnapshot(waterBinding, []).reason, 'peripheral_missing');
assert.equal(
  validateFarmBotPeripheralBindingSnapshot(waterBinding, [
    { ...waterPeripheral, pin: 9 },
  ]).reason,
  'metadata_changed'
);

validationStep('Semantic Water binding validation');
console.log('─'.repeat(40));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
console.log('FarmBot credential security validation passed.\n');
