import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

export interface FarmBotCredentialContext {
  userId: string;
  farmbotId: number;
}

export interface EncryptedFarmBotCredential {
  version: 1;
  keyVersion: number;
  algorithm: typeof ALGORITHM;
  iv: string;
  ciphertext: string;
  authTag: string;
}

function decodeEncryptionKey(encodedKey: string): Buffer {
  if (!encodedKey.trim()) {
    throw new Error('FarmBot credential encryption key is not configured');
  }

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== KEY_BYTES || key.toString('base64') !== encodedKey.trim()) {
    throw new Error('FarmBot credential encryption key must be exactly 32 bytes encoded as base64');
  }

  return key;
}

export function validateFarmBotCredentialEncryptionKey(encodedKey: string): void {
  decodeEncryptionKey(encodedKey);
}

function credentialAad(context: FarmBotCredentialContext): Buffer {
  if (!context.userId.trim()) {
    throw new Error('FarmBot credential owner is required');
  }
  if (!Number.isSafeInteger(context.farmbotId) || context.farmbotId <= 0) {
    throw new Error('FarmBot credential device ID must be a positive integer');
  }

  return Buffer.from(
    `farmbot-credential:v1:owner:${context.userId}:farmbot:${context.farmbotId}`,
    'utf8'
  );
}

export function encryptFarmBotCredential(
  credential: string,
  encodedKey: string,
  keyVersion: number,
  context: FarmBotCredentialContext
): EncryptedFarmBotCredential {
  if (!credential) {
    throw new Error('FarmBot credential cannot be empty');
  }
  if (!Number.isSafeInteger(keyVersion) || keyVersion <= 0) {
    throw new Error('FarmBot credential key version must be a positive integer');
  }

  const key = decodeEncryptionKey(encodedKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(credentialAad(context));

  const ciphertext = Buffer.concat([
    cipher.update(credential, 'utf8'),
    cipher.final(),
  ]);

  return {
    version: 1,
    keyVersion,
    algorithm: ALGORITHM,
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptFarmBotCredential(
  encrypted: EncryptedFarmBotCredential,
  encodedKey: string,
  context: FarmBotCredentialContext
): string {
  if (encrypted.version !== 1 || encrypted.algorithm !== ALGORITHM) {
    throw new Error('Unsupported FarmBot credential encryption envelope');
  }

  const key = decodeEncryptionKey(encodedKey);
  const iv = Buffer.from(encrypted.iv, 'base64');
  const authTag = Buffer.from(encrypted.authTag, 'base64');
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

  if (iv.length !== IV_BYTES || authTag.length !== 16 || ciphertext.length === 0) {
    throw new Error('Invalid FarmBot credential encryption envelope');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(credentialAad(context));
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
