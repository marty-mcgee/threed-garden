export const FARMBOT_COMMAND_POLICY_VERSION = 1 as const;

export const FARMBOT_SEMANTIC_COMMANDS = ['water'] as const;
export type FarmBotSemanticCommand = typeof FARMBOT_SEMANTIC_COMMANDS[number];

export const FARMBOT_COMMAND_STATES = [
  'requested',
  'validated',
  'accepted',
  'dispatched',
  'acknowledged',
  'completed',
  'rejected',
  'timed_out',
  'cancelled',
] as const;
export type FarmBotCommandState = typeof FARMBOT_COMMAND_STATES[number];

export interface FarmBotCommandIntent {
  policyVersion: typeof FARMBOT_COMMAND_POLICY_VERSION;
  projectId: number;
  semanticCommand: FarmBotSemanticCommand;
  idempotencyKey: string;
}

export type FarmBotCommandPolicyErrorCode =
  | 'invalid_intent'
  | 'unsupported_policy_version'
  | 'unsupported_semantic_command'
  | 'invalid_project_id'
  | 'invalid_idempotency_key'
  | 'unexpected_intent_field';

export class FarmBotCommandPolicyError extends Error {
  readonly code: FarmBotCommandPolicyErrorCode;

  constructor(code: FarmBotCommandPolicyErrorCode) {
    super(code);
    this.name = 'FarmBotCommandPolicyError';
    this.code = code;
  }
}

const INTENT_FIELDS = new Set([
  'policyVersion',
  'projectId',
  'semanticCommand',
  'idempotencyKey',
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseFarmBotCommandIntent(input: unknown): FarmBotCommandIntent {
  if (!isRecord(input)) throw new FarmBotCommandPolicyError('invalid_intent');
  if (Object.keys(input).some((key) => !INTENT_FIELDS.has(key))) {
    throw new FarmBotCommandPolicyError('unexpected_intent_field');
  }
  if (input.policyVersion !== FARMBOT_COMMAND_POLICY_VERSION) {
    throw new FarmBotCommandPolicyError('unsupported_policy_version');
  }
  if (!Number.isSafeInteger(input.projectId) || Number(input.projectId) < 1) {
    throw new FarmBotCommandPolicyError('invalid_project_id');
  }
  if (!FARMBOT_SEMANTIC_COMMANDS.includes(input.semanticCommand as FarmBotSemanticCommand)) {
    throw new FarmBotCommandPolicyError('unsupported_semantic_command');
  }
  if (typeof input.idempotencyKey !== 'string' || !UUID_PATTERN.test(input.idempotencyKey)) {
    throw new FarmBotCommandPolicyError('invalid_idempotency_key');
  }

  return Object.freeze({
    policyVersion: FARMBOT_COMMAND_POLICY_VERSION,
    projectId: Number(input.projectId),
    semanticCommand: input.semanticCommand as FarmBotSemanticCommand,
    idempotencyKey: input.idempotencyKey.toLowerCase(),
  });
}

const ALLOWED_TRANSITIONS: Readonly<Record<FarmBotCommandState, readonly FarmBotCommandState[]>> = {
  requested: ['validated', 'rejected', 'cancelled'],
  validated: ['accepted', 'rejected', 'cancelled'],
  accepted: ['dispatched', 'rejected', 'cancelled'],
  dispatched: ['acknowledged', 'rejected', 'timed_out'],
  acknowledged: ['completed', 'rejected', 'timed_out'],
  completed: [],
  rejected: [],
  timed_out: [],
  cancelled: [],
};

export function canTransitionFarmBotCommand(
  from: FarmBotCommandState,
  to: FarmBotCommandState
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminalFarmBotCommandState(state: FarmBotCommandState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0;
}

// Emergency stop intentionally has no normal command-intent representation.
// Its future authorization and delivery path must remain independent of
// character animation and the normal requested -> completed lifecycle.
