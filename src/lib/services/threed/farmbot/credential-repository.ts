import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  threedFarmbotBrokerMetadata,
  threedFarmbotPeripheralBindings,
  threedFarmbots,
} from '@/lib/schema/threed';
import {
  assertFarmBotBrokerIdentityUnchanged,
  assertFarmBotRestAndBrokerIdentityMatch,
  FarmBotBrokerIdentityMismatchError,
  FarmBotBrokerMetadataError,
  readFarmBotBrokerMetadata,
  type FarmBotBrokerMetadata,
} from './broker-metadata-core';
import {
  decryptFarmBotCredentialWithKeyring,
  encryptFarmBotCredentialWithCurrentKey,
  rotateFarmBotCredentialToCurrentKey,
} from './credential-keyring';
import {
  CLEARED_FARMBOT_CREDENTIAL_COLUMNS,
  readFarmBotCredentialEnvelope,
  toFarmBotCredentialEnvelopeColumns,
  type FarmBotCredentialEnvelopeRow,
} from './credential-envelope-core';
import {
  evaluateFarmBotMqttReadiness,
  type FarmBotMqttReadiness,
} from './mqtt-readiness-core';

export interface FarmBotCredentialStatus {
  configured: boolean;
  keyVersion: number | null;
  updatedAt: Date | null;
}

export interface FarmBotBrokerMetadataStatus
  extends Omit<FarmBotBrokerMetadata, 'brokerDeviceId'> {
  brokerDeviceId: string | null;
  observedAt: Date;
  restVerifiedAt: Date | null;
}

export class FarmBotCredentialNotFoundError extends Error {
  constructor() {
    super('FarmBot not found');
    this.name = 'FarmBotCredentialNotFoundError';
  }
}

export class FarmBotCredentialNotConfiguredError extends Error {
  constructor() {
    super('FarmBot credential is not configured');
    this.name = 'FarmBotCredentialNotConfiguredError';
  }
}

export class FarmBotCredentialConcurrentUpdateError extends Error {
  constructor() {
    super('FarmBot credential changed during rotation');
    this.name = 'FarmBotCredentialConcurrentUpdateError';
  }
}

function validateIdentity(userId: string, farmbotId: number): void {
  if (!userId.trim()) {
    throw new Error('FarmBot owner is required');
  }
  if (!Number.isSafeInteger(farmbotId) || farmbotId <= 0) {
    throw new Error('FarmBot ID must be a positive integer');
  }
}

const credentialSelection = {
  id: threedFarmbots.id,
  farmbotDeviceId: threedFarmbots.farmbotDeviceId,
  brokerDeviceId: threedFarmbots.brokerDeviceId,
  credentialCiphertext: threedFarmbots.credentialCiphertext,
  credentialIv: threedFarmbots.credentialIv,
  credentialAuthTag: threedFarmbots.credentialAuthTag,
  credentialEnvelopeVersion: threedFarmbots.credentialEnvelopeVersion,
  credentialKeyVersion: threedFarmbots.credentialKeyVersion,
  credentialUpdatedAt: threedFarmbots.credentialUpdatedAt,
};

async function selectOwnedCredentialRow(
  userId: string,
  farmbotId: number
): Promise<{
  id: number;
  farmbotDeviceId: number | null;
  brokerDeviceId: string | null;
} & FarmBotCredentialEnvelopeRow> {
  validateIdentity(userId, farmbotId);

  const [row] = await db
    .select(credentialSelection)
    .from(threedFarmbots)
    .where(and(
      eq(threedFarmbots.id, farmbotId),
      eq(threedFarmbots.userId, userId)
    ))
    .limit(1);

  if (!row) {
    throw new FarmBotCredentialNotFoundError();
  }

  return row;
}

export async function getFarmBotCredentialStatus(
  userId: string,
  farmbotId: number
): Promise<FarmBotCredentialStatus> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const encrypted = readFarmBotCredentialEnvelope(row);

  return {
    configured: encrypted !== null,
    keyVersion: encrypted?.keyVersion ?? null,
    updatedAt: row.credentialUpdatedAt,
  };
}

export async function saveFarmBotCredential(
  userId: string,
  farmbotId: number,
  credential: string
): Promise<FarmBotCredentialStatus> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const brokerMetadata = readFarmBotBrokerMetadata(credential);
  if (row.brokerDeviceId && row.brokerDeviceId !== brokerMetadata.brokerDeviceId) {
    throw new FarmBotBrokerIdentityMismatchError();
  }
  const updatedAt = new Date();
  if (brokerMetadata.tokenExpiresAt <= updatedAt) {
    throw new FarmBotBrokerMetadataError();
  }
  const encrypted = encryptFarmBotCredentialWithCurrentKey(credential, {
    userId,
    farmbotId,
  });

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(threedFarmbots)
      .set({
        ...toFarmBotCredentialEnvelopeColumns(encrypted, updatedAt),
        apiToken: null,
        updatedAt,
      })
      .where(and(
        eq(threedFarmbots.id, farmbotId),
        eq(threedFarmbots.userId, userId)
      ))
      .returning({ id: threedFarmbots.id });

    if (!updated) {
      throw new FarmBotCredentialNotFoundError();
    }

    await tx
      .delete(threedFarmbotPeripheralBindings)
      .where(and(
        eq(threedFarmbotPeripheralBindings.farmbotId, farmbotId),
        eq(threedFarmbotPeripheralBindings.userId, userId)
      ));

    await tx
      .insert(threedFarmbotBrokerMetadata)
      .values({
        userId,
        farmbotId,
        mqttHost: brokerMetadata.mqttHost,
        mqttWsUrl: brokerMetadata.mqttWsUrl,
        brokerDeviceId: brokerMetadata.brokerDeviceId,
        vhost: brokerMetadata.vhost,
        tokenIssuedAt: brokerMetadata.tokenIssuedAt,
        tokenExpiresAt: brokerMetadata.tokenExpiresAt,
        observedAt: updatedAt,
        restVerifiedAt: null,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: threedFarmbotBrokerMetadata.farmbotId,
        set: {
          userId,
          mqttHost: brokerMetadata.mqttHost,
          mqttWsUrl: brokerMetadata.mqttWsUrl,
          brokerDeviceId: brokerMetadata.brokerDeviceId,
          vhost: brokerMetadata.vhost,
          tokenIssuedAt: brokerMetadata.tokenIssuedAt,
          tokenExpiresAt: brokerMetadata.tokenExpiresAt,
          observedAt: updatedAt,
          restVerifiedAt: null,
          updatedAt,
        },
      });
  });

  return { configured: true, keyVersion: encrypted.keyVersion, updatedAt };
}

export async function loadFarmBotCredential(
  userId: string,
  farmbotId: number
): Promise<string> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const encrypted = readFarmBotCredentialEnvelope(row);
  if (!encrypted) {
    throw new FarmBotCredentialNotConfiguredError();
  }

  return decryptFarmBotCredentialWithKeyring(encrypted, { userId, farmbotId });
}

export async function clearFarmBotCredential(
  userId: string,
  farmbotId: number
): Promise<FarmBotCredentialStatus> {
  validateIdentity(userId, farmbotId);
  const updatedAt = new Date();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(threedFarmbots)
      .set({
        ...CLEARED_FARMBOT_CREDENTIAL_COLUMNS,
        updatedAt,
      })
      .where(and(
        eq(threedFarmbots.id, farmbotId),
        eq(threedFarmbots.userId, userId)
      ))
      .returning({ id: threedFarmbots.id });

    if (!updated) {
      throw new FarmBotCredentialNotFoundError();
    }

    await tx
      .delete(threedFarmbotPeripheralBindings)
      .where(and(
        eq(threedFarmbotPeripheralBindings.farmbotId, farmbotId),
        eq(threedFarmbotPeripheralBindings.userId, userId)
      ));

    await tx
      .delete(threedFarmbotBrokerMetadata)
      .where(and(
        eq(threedFarmbotBrokerMetadata.farmbotId, farmbotId),
        eq(threedFarmbotBrokerMetadata.userId, userId)
      ));
  });

  return { configured: false, keyVersion: null, updatedAt: null };
}

export async function recordFarmBotBrokerMetadataVerification(
  userId: string,
  farmbotId: number,
  credential: string,
  farmbotDeviceId: number
): Promise<FarmBotBrokerMetadataStatus> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const currentEnvelope = readFarmBotCredentialEnvelope(row);
  if (!currentEnvelope) {
    throw new FarmBotCredentialNotConfiguredError();
  }
  const storedCredential = decryptFarmBotCredentialWithKeyring(currentEnvelope, {
    userId,
    farmbotId,
  });
  if (storedCredential !== credential) {
    throw new FarmBotCredentialConcurrentUpdateError();
  }
  const brokerMetadata = readFarmBotBrokerMetadata(credential);
  assertFarmBotRestAndBrokerIdentityMatch(farmbotDeviceId, brokerMetadata.brokerDeviceId);
  if ((row.farmbotDeviceId !== null && row.farmbotDeviceId !== farmbotDeviceId)
    || (row.brokerDeviceId !== null && row.brokerDeviceId !== brokerMetadata.brokerDeviceId)) {
    throw new FarmBotBrokerIdentityMismatchError();
  }
  const now = new Date();

  const metadata = await db.transaction(async (tx) => {
    const [bound] = await tx
      .update(threedFarmbots)
      .set({
        farmbotDeviceId,
        brokerDeviceId: brokerMetadata.brokerDeviceId,
        updatedAt: now,
      })
      .where(and(
        eq(threedFarmbots.id, farmbotId),
        eq(threedFarmbots.userId, userId),
        eq(threedFarmbots.credentialCiphertext, currentEnvelope.ciphertext)
      ))
      .returning({ id: threedFarmbots.id });
    if (!bound) throw new FarmBotCredentialConcurrentUpdateError();

    const [savedMetadata] = await tx
      .insert(threedFarmbotBrokerMetadata)
      .values({
        userId,
        farmbotId,
        mqttHost: brokerMetadata.mqttHost,
        mqttWsUrl: brokerMetadata.mqttWsUrl,
        brokerDeviceId: brokerMetadata.brokerDeviceId,
        vhost: brokerMetadata.vhost,
        tokenIssuedAt: brokerMetadata.tokenIssuedAt,
        tokenExpiresAt: brokerMetadata.tokenExpiresAt,
        observedAt: now,
        restVerifiedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: threedFarmbotBrokerMetadata.farmbotId,
        set: {
          userId,
          mqttHost: brokerMetadata.mqttHost,
          mqttWsUrl: brokerMetadata.mqttWsUrl,
          brokerDeviceId: brokerMetadata.brokerDeviceId,
          vhost: brokerMetadata.vhost,
          tokenIssuedAt: brokerMetadata.tokenIssuedAt,
          tokenExpiresAt: brokerMetadata.tokenExpiresAt,
          observedAt: now,
          restVerifiedAt: now,
          updatedAt: now,
        },
      })
      .returning();
    return savedMetadata;
  });

  return {
    mqttHost: metadata.mqttHost,
    mqttWsUrl: metadata.mqttWsUrl,
    brokerDeviceId: brokerMetadata.brokerDeviceId,
    vhost: metadata.vhost,
    tokenIssuedAt: metadata.tokenIssuedAt,
    tokenExpiresAt: metadata.tokenExpiresAt,
    observedAt: metadata.observedAt,
    restVerifiedAt: metadata.restVerifiedAt,
  };
}

export async function getFarmBotBrokerMetadataStatus(
  userId: string,
  farmbotId: number
): Promise<FarmBotBrokerMetadataStatus | null> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const [metadata] = await db
    .select()
    .from(threedFarmbotBrokerMetadata)
    .where(and(
      eq(threedFarmbotBrokerMetadata.userId, userId),
      eq(threedFarmbotBrokerMetadata.farmbotId, farmbotId)
    ))
    .limit(1);

  if (!metadata) return null;
  return {
    mqttHost: metadata.mqttHost,
    mqttWsUrl: metadata.mqttWsUrl,
    brokerDeviceId: row.brokerDeviceId,
    vhost: metadata.vhost,
    tokenIssuedAt: metadata.tokenIssuedAt,
    tokenExpiresAt: metadata.tokenExpiresAt,
    observedAt: metadata.observedAt,
    restVerifiedAt: metadata.restVerifiedAt,
  };
}

export async function getFarmBotMqttReadiness(
  userId: string,
  farmbotId: number
): Promise<FarmBotMqttReadiness> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const envelope = readFarmBotCredentialEnvelope(row);
  const credentialMetadata = envelope
    ? readFarmBotBrokerMetadata(decryptFarmBotCredentialWithKeyring(envelope, {
      userId,
      farmbotId,
    }))
    : null;
  const [metadata] = await db
    .select()
    .from(threedFarmbotBrokerMetadata)
    .where(and(
      eq(threedFarmbotBrokerMetadata.userId, userId),
      eq(threedFarmbotBrokerMetadata.farmbotId, farmbotId)
    ))
    .limit(1);

  return evaluateFarmBotMqttReadiness({
    checkedAt: new Date(),
    credentialMetadata,
    farmbotDeviceId: row.farmbotDeviceId,
    brokerDeviceId: row.brokerDeviceId,
    snapshot: metadata ? {
      mqttHost: metadata.mqttHost,
      mqttWsUrl: metadata.mqttWsUrl,
      brokerDeviceId: metadata.brokerDeviceId,
      vhost: metadata.vhost,
      tokenIssuedAt: metadata.tokenIssuedAt,
      tokenExpiresAt: metadata.tokenExpiresAt,
      restVerifiedAt: metadata.restVerifiedAt,
    } : null,
  });
}

export async function refreshFarmBotCredential(
  userId: string,
  farmbotId: number,
  currentCredential: string,
  refreshedCredential: string
): Promise<{
  credentialStatus: FarmBotCredentialStatus;
  brokerMetadata: FarmBotBrokerMetadataStatus;
}> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const currentEnvelope = readFarmBotCredentialEnvelope(row);
  if (!currentEnvelope) {
    throw new FarmBotCredentialNotConfiguredError();
  }

  const storedCredential = decryptFarmBotCredentialWithKeyring(currentEnvelope, {
    userId,
    farmbotId,
  });
  if (storedCredential !== currentCredential) {
    throw new FarmBotCredentialConcurrentUpdateError();
  }
  const currentMetadata = readFarmBotBrokerMetadata(currentCredential);
  const refreshedMetadata = readFarmBotBrokerMetadata(refreshedCredential);
  assertFarmBotBrokerIdentityUnchanged(currentMetadata, refreshedMetadata);
  if (row.brokerDeviceId && row.brokerDeviceId !== refreshedMetadata.brokerDeviceId) {
    throw new FarmBotBrokerIdentityMismatchError();
  }

  const updatedAt = new Date();
  if (refreshedMetadata.tokenExpiresAt <= updatedAt) {
    throw new FarmBotBrokerMetadataError();
  }
  const encrypted = encryptFarmBotCredentialWithCurrentKey(refreshedCredential, {
    userId,
    farmbotId,
  });

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(threedFarmbots)
      .set({
        ...toFarmBotCredentialEnvelopeColumns(encrypted, updatedAt),
        apiToken: null,
        updatedAt,
      })
      .where(and(
        eq(threedFarmbots.id, farmbotId),
        eq(threedFarmbots.userId, userId),
        eq(threedFarmbots.credentialCiphertext, currentEnvelope.ciphertext)
      ))
      .returning({ id: threedFarmbots.id });

    if (!updated) {
      throw new FarmBotCredentialConcurrentUpdateError();
    }

    await tx
      .insert(threedFarmbotBrokerMetadata)
      .values({
        userId,
        farmbotId,
        mqttHost: refreshedMetadata.mqttHost,
        mqttWsUrl: refreshedMetadata.mqttWsUrl,
        brokerDeviceId: refreshedMetadata.brokerDeviceId,
        vhost: refreshedMetadata.vhost,
        tokenIssuedAt: refreshedMetadata.tokenIssuedAt,
        tokenExpiresAt: refreshedMetadata.tokenExpiresAt,
        observedAt: updatedAt,
        restVerifiedAt: updatedAt,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: threedFarmbotBrokerMetadata.farmbotId,
        set: {
          userId,
          mqttHost: refreshedMetadata.mqttHost,
          mqttWsUrl: refreshedMetadata.mqttWsUrl,
          brokerDeviceId: refreshedMetadata.brokerDeviceId,
          vhost: refreshedMetadata.vhost,
          tokenIssuedAt: refreshedMetadata.tokenIssuedAt,
          tokenExpiresAt: refreshedMetadata.tokenExpiresAt,
          observedAt: updatedAt,
          restVerifiedAt: updatedAt,
          updatedAt,
        },
      });
  });

  return {
    credentialStatus: {
      configured: true,
      keyVersion: encrypted.keyVersion,
      updatedAt,
    },
    brokerMetadata: {
      ...refreshedMetadata,
      brokerDeviceId: row.brokerDeviceId,
      observedAt: updatedAt,
      restVerifiedAt: updatedAt,
    },
  };
}

export async function rotateFarmBotCredential(
  userId: string,
  farmbotId: number
): Promise<FarmBotCredentialStatus & { rotated: boolean }> {
  const row = await selectOwnedCredentialRow(userId, farmbotId);
  const encrypted = readFarmBotCredentialEnvelope(row);
  if (!encrypted) {
    throw new FarmBotCredentialNotConfiguredError();
  }

  const rotation = rotateFarmBotCredentialToCurrentKey(encrypted, {
    userId,
    farmbotId,
  });
  if (!rotation.rotated) {
    return {
      configured: true,
      keyVersion: encrypted.keyVersion,
      updatedAt: row.credentialUpdatedAt,
      rotated: false,
    };
  }

  const updatedAt = new Date();
  const [updated] = await db
    .update(threedFarmbots)
    .set({
      ...toFarmBotCredentialEnvelopeColumns(rotation.encrypted, updatedAt),
      apiToken: null,
      updatedAt,
    })
    .where(and(
      eq(threedFarmbots.id, farmbotId),
      eq(threedFarmbots.userId, userId),
      eq(threedFarmbots.credentialCiphertext, encrypted.ciphertext)
    ))
    .returning({ id: threedFarmbots.id });

  if (!updated) {
    throw new FarmBotCredentialConcurrentUpdateError();
  }

  return {
    configured: true,
    keyVersion: rotation.encrypted.keyVersion,
    updatedAt,
    rotated: true,
  };
}
