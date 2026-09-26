import {
  validateFarmBotCredentialEncryptionKey,
  type EncryptedFarmBotCredential,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './credential-crypto-core.ts';

const CURRENT_KEY_VERSION_VARIABLE = 'FARMBOT_CREDENTIAL_KEY_VERSION';
const KEY_VARIABLE_PREFIX = 'FARMBOT_CREDENTIAL_KEY_V';

export type FarmBotCredentialKeyEnvironment = Record<string, string | undefined>;

export interface FarmBotCredentialKey {
  version: number;
  encodedKey: string;
}

export class FarmBotCredentialKeyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FarmBotCredentialKeyConfigurationError';
  }
}

function parseKeyVersion(value: string | undefined, label: string): number {
  if (!value) {
    throw new FarmBotCredentialKeyConfigurationError(`${label} is not configured`);
  }
  if (!/^[1-9]\d*$/.test(value)) {
    throw new FarmBotCredentialKeyConfigurationError(`${label} must be a positive integer`);
  }

  const version = Number(value);
  if (!Number.isSafeInteger(version)) {
    throw new FarmBotCredentialKeyConfigurationError(`${label} exceeds the supported integer range`);
  }

  return version;
}

export function resolveFarmBotCredentialKey(
  version: number,
  environment: FarmBotCredentialKeyEnvironment
): FarmBotCredentialKey {
  if (!Number.isSafeInteger(version) || version <= 0) {
    throw new FarmBotCredentialKeyConfigurationError(
      'FarmBot credential key version must be a positive integer'
    );
  }

  const variableName = `${KEY_VARIABLE_PREFIX}${version}`;
  const encodedKey = environment[variableName];
  if (!encodedKey) {
    throw new FarmBotCredentialKeyConfigurationError(
      `FarmBot credential key version ${version} is not configured`
    );
  }

  try {
    validateFarmBotCredentialEncryptionKey(encodedKey);
  } catch {
    throw new FarmBotCredentialKeyConfigurationError(
      `FarmBot credential key version ${version} is malformed`
    );
  }

  return { version, encodedKey };
}

export function resolveCurrentFarmBotCredentialKey(
  environment: FarmBotCredentialKeyEnvironment
): FarmBotCredentialKey {
  const version = parseKeyVersion(
    environment[CURRENT_KEY_VERSION_VARIABLE],
    CURRENT_KEY_VERSION_VARIABLE
  );

  return resolveFarmBotCredentialKey(version, environment);
}

export function farmBotCredentialNeedsRotation(
  encrypted: Pick<EncryptedFarmBotCredential, 'keyVersion'>,
  currentKeyVersion: number
): boolean {
  if (!Number.isSafeInteger(currentKeyVersion) || currentKeyVersion <= 0) {
    throw new Error('Current FarmBot credential key version must be a positive integer');
  }

  return encrypted.keyVersion !== currentKeyVersion;
}
