const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ValidatedFarmBotCommandIntent {
  policyVersion: 1;
  projectId: number;
  semanticCommand: 'water';
  idempotencyKey: string;
}

export type FarmBotCommandRepositoryErrorCode =
  | 'invalid_owner'
  | 'invalid_farmbot_id'
  | 'invalid_command_id'
  | 'invalid_request_time'
  | 'invalid_expiry';

export class FarmBotCommandRepositoryInputError extends Error {
  readonly code: FarmBotCommandRepositoryErrorCode;

  constructor(code: FarmBotCommandRepositoryErrorCode) {
    super(code);
    this.name = 'FarmBotCommandRepositoryInputError';
    this.code = code;
  }
}

export interface FarmBotRequestedCommandRecord {
  commandId: string;
  idempotencyKey: string;
  userId: string;
  projectId: number;
  farmbotId: number;
  policyVersion: 1;
  semanticCommand: 'water';
  state: 'requested';
  requestedAt: Date;
  expiresAt: Date;
}

export function prepareFarmBotRequestedCommand(input: {
  commandId: string;
  userId: string;
  farmbotId: number;
  intent: ValidatedFarmBotCommandIntent;
  requestedAt: Date;
  expiresAt: Date;
}): FarmBotRequestedCommandRecord {
  if (!input.userId.trim()) {
    throw new FarmBotCommandRepositoryInputError('invalid_owner');
  }
  if (!Number.isSafeInteger(input.farmbotId) || input.farmbotId <= 0) {
    throw new FarmBotCommandRepositoryInputError('invalid_farmbot_id');
  }
  if (!UUID_V4_PATTERN.test(input.commandId)) {
    throw new FarmBotCommandRepositoryInputError('invalid_command_id');
  }
  if (!(input.requestedAt instanceof Date) || Number.isNaN(input.requestedAt.valueOf())) {
    throw new FarmBotCommandRepositoryInputError('invalid_request_time');
  }
  if (!(input.expiresAt instanceof Date) || Number.isNaN(input.expiresAt.valueOf())
    || input.expiresAt <= input.requestedAt) {
    throw new FarmBotCommandRepositoryInputError('invalid_expiry');
  }
  const intent = input.intent;
  return Object.freeze({
    commandId: input.commandId.toLowerCase(),
    idempotencyKey: intent.idempotencyKey,
    userId: input.userId.trim(),
    projectId: intent.projectId,
    farmbotId: input.farmbotId,
    policyVersion: intent.policyVersion,
    semanticCommand: intent.semanticCommand,
    state: 'requested',
    requestedAt: new Date(input.requestedAt),
    expiresAt: new Date(input.expiresAt),
  });
}

export function matchesFarmBotIdempotentRequest(
  existing: {
    userId: string;
    projectId: number;
    farmbotId: number;
    policyVersion: number;
    semanticCommand: string;
    idempotencyKey: string;
  },
  requested: FarmBotRequestedCommandRecord
): boolean {
  return existing.userId === requested.userId
    && existing.projectId === requested.projectId
    && existing.farmbotId === requested.farmbotId
    && existing.policyVersion === requested.policyVersion
    && existing.semanticCommand === requested.semanticCommand
    && existing.idempotencyKey.toLowerCase() === requested.idempotencyKey;
}
