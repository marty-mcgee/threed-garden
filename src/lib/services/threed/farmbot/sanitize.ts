import 'server-only';

const SENSITIVE_FARMBOT_FIELDS = [
  'apiToken',
  'credentialCiphertext',
  'credentialIv',
  'credentialAuthTag',
  'credentialEnvelopeVersion',
  'credentialKeyVersion',
  'credentialUpdatedAt',
] as const;

type SensitiveFarmBotField = (typeof SENSITIVE_FARMBOT_FIELDS)[number];

export function sanitizeFarmBotRecord<T extends Record<string, unknown>>(
  farmbot: T
): Omit<T, SensitiveFarmBotField> {
  const safeFarmbot = { ...farmbot };

  for (const field of SENSITIVE_FARMBOT_FIELDS) {
    delete safeFarmbot[field];
  }

  return safeFarmbot;
}

export function containsFarmBotCredentialMaterial(value: unknown): boolean {
  return typeof value === 'object'
    && value !== null
    && SENSITIVE_FARMBOT_FIELDS.some((field) => (
      Object.prototype.hasOwnProperty.call(value, field)
    ));
}
