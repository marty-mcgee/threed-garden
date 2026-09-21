const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RPC_LABEL_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const FIELDS = new Set([
  'version',
  'ownerId',
  'farmbotId',
  'commandId',
  'rpcLabel',
  'state',
  'rejectionCode',
  'receivedAt',
]);

export const MAX_FARMBOT_COMMAND_ACKNOWLEDGEMENT_BYTES = 1024;

export interface FarmBotCommandAcknowledgementInput {
  version: 1;
  ownerId: string;
  farmbotId: number;
  commandId: string;
  rpcLabel: string;
  state: 'acknowledged' | 'rejected';
  rejectionCode: 'farmbot_rpc_error' | null;
  receivedAt: Date;
}

export class FarmBotCommandAcknowledgementInputError extends Error {
  constructor() {
    super('invalid_farmbot_command_acknowledgement');
    this.name = 'FarmBotCommandAcknowledgementInputError';
  }
}

function invalid(): never {
  throw new FarmBotCommandAcknowledgementInputError();
}

export function parseFarmBotCommandAcknowledgement(
  payload: unknown,
  now = new Date()
): Readonly<FarmBotCommandAcknowledgementInput> {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())
    || typeof payload !== 'object' || payload === null || Array.isArray(payload)) return invalid();
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).length !== FIELDS.size
    || Object.keys(input).some((field) => !FIELDS.has(field))
    || input.version !== 1
    || typeof input.ownerId !== 'string' || !input.ownerId.trim() || input.ownerId.length > 255
    || !Number.isSafeInteger(input.farmbotId) || Number(input.farmbotId) <= 0
    || typeof input.commandId !== 'string' || !UUID_V4_PATTERN.test(input.commandId)
    || typeof input.rpcLabel !== 'string' || !RPC_LABEL_PATTERN.test(input.rpcLabel)
    || (input.state !== 'acknowledged' && input.state !== 'rejected')
    || typeof input.receivedAt !== 'string') {
    return invalid();
  }
  if ((input.state === 'acknowledged' && input.rejectionCode !== null)
    || (input.state === 'rejected' && input.rejectionCode !== 'farmbot_rpc_error')) {
    return invalid();
  }
  const receivedAt = new Date(input.receivedAt);
  if (Number.isNaN(receivedAt.valueOf()) || receivedAt.toISOString() !== input.receivedAt) {
    return invalid();
  }
  if (receivedAt.getTime() > now.getTime() + 60_000) return invalid();
  return Object.freeze({
    version: 1,
    ownerId: input.ownerId.trim(),
    farmbotId: Number(input.farmbotId),
    commandId: input.commandId.toLowerCase(),
    rpcLabel: input.rpcLabel,
    state: input.state,
    rejectionCode: input.rejectionCode as 'farmbot_rpc_error' | null,
    receivedAt,
  });
}
