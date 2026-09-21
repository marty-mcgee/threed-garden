import 'server-only';

import {
  decryptFarmBotCredential,
  encryptFarmBotCredential,
  type EncryptedFarmBotCredential,
  type FarmBotCredentialContext,
} from './credential-crypto-core';
import {
  farmBotCredentialNeedsRotation,
  resolveCurrentFarmBotCredentialKey,
  resolveFarmBotCredentialKey,
} from './credential-keyring-core';

export function encryptFarmBotCredentialWithCurrentKey(
  credential: string,
  context: FarmBotCredentialContext
): EncryptedFarmBotCredential {
  const key = resolveCurrentFarmBotCredentialKey(process.env);
  return encryptFarmBotCredential(credential, key.encodedKey, key.version, context);
}

export function decryptFarmBotCredentialWithKeyring(
  encrypted: EncryptedFarmBotCredential,
  context: FarmBotCredentialContext
): string {
  const key = resolveFarmBotCredentialKey(encrypted.keyVersion, process.env);
  return decryptFarmBotCredential(encrypted, key.encodedKey, context);
}

export function rotateFarmBotCredentialToCurrentKey(
  encrypted: EncryptedFarmBotCredential,
  context: FarmBotCredentialContext
): { encrypted: EncryptedFarmBotCredential; rotated: boolean } {
  const currentKey = resolveCurrentFarmBotCredentialKey(process.env);
  if (!farmBotCredentialNeedsRotation(encrypted, currentKey.version)) {
    return { encrypted, rotated: false };
  }

  const credential = decryptFarmBotCredentialWithKeyring(encrypted, context);
  return {
    encrypted: encryptFarmBotCredential(
      credential,
      currentKey.encodedKey,
      currentKey.version,
      context
    ),
    rotated: true,
  };
}
