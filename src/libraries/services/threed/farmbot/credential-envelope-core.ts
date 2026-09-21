import type { EncryptedFarmBotCredential } from './credential-crypto-core';

export interface FarmBotCredentialEnvelopeRow {
  credentialCiphertext: string | null;
  credentialIv: string | null;
  credentialAuthTag: string | null;
  credentialEnvelopeVersion: number | null;
  credentialKeyVersion: number | null;
  credentialUpdatedAt: Date | null;
}

export interface FarmBotCredentialEnvelopeColumns {
  credentialCiphertext: string;
  credentialIv: string;
  credentialAuthTag: string;
  credentialEnvelopeVersion: 1;
  credentialKeyVersion: number;
  credentialUpdatedAt: Date;
}

export function readFarmBotCredentialEnvelope(
  row: FarmBotCredentialEnvelopeRow
): EncryptedFarmBotCredential | null {
  const values = [
    row.credentialCiphertext,
    row.credentialIv,
    row.credentialAuthTag,
    row.credentialEnvelopeVersion,
    row.credentialKeyVersion,
    row.credentialUpdatedAt,
  ];

  if (values.every((value) => value === null)) {
    return null;
  }
  if (values.some((value) => value === null)) {
    throw new Error('FarmBot credential envelope is incomplete');
  }
  if (row.credentialEnvelopeVersion !== 1) {
    throw new Error('FarmBot credential envelope version is unsupported');
  }
  if (
    !Number.isSafeInteger(row.credentialKeyVersion)
    || (row.credentialKeyVersion as number) <= 0
  ) {
    throw new Error('FarmBot credential key version is invalid');
  }

  return {
    version: 1,
    keyVersion: row.credentialKeyVersion as number,
    algorithm: 'aes-256-gcm',
    iv: row.credentialIv as string,
    ciphertext: row.credentialCiphertext as string,
    authTag: row.credentialAuthTag as string,
  };
}

export function toFarmBotCredentialEnvelopeColumns(
  encrypted: EncryptedFarmBotCredential,
  updatedAt: Date
): FarmBotCredentialEnvelopeColumns {
  if (Number.isNaN(updatedAt.getTime())) {
    throw new Error('FarmBot credential update time is invalid');
  }

  return {
    credentialCiphertext: encrypted.ciphertext,
    credentialIv: encrypted.iv,
    credentialAuthTag: encrypted.authTag,
    credentialEnvelopeVersion: encrypted.version,
    credentialKeyVersion: encrypted.keyVersion,
    credentialUpdatedAt: updatedAt,
  };
}

export const CLEARED_FARMBOT_CREDENTIAL_COLUMNS = {
  apiToken: null,
  credentialCiphertext: null,
  credentialIv: null,
  credentialAuthTag: null,
  credentialEnvelopeVersion: null,
  credentialKeyVersion: null,
  credentialUpdatedAt: null,
} as const;
