import { farmBotCommandRpcLabel } from '../../../farmbot/command-lifecycle-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POST_DISPATCH_STATES = new Set([
  'dispatched',
  'acknowledged',
  'completed',
  'rejected',
  'timed_out',
]);

export interface FarmBotAcceptedCommandAudit {
  commandId: string;
  userId: string;
  policyVersion: number;
  semanticCommand: string;
  state: string;
  rpcLabel: string | null;
  acceptedAt: Date | null;
  expiresAt: Date;
}

export interface FarmBotPilotDispatchResult {
  commandId: string;
  state: string;
  rpcLabel: string | null;
  dispatchedAt: Date;
}

export interface FarmBotCommandPilotDependencies {
  acceptValidated(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<Readonly<FarmBotAcceptedCommandAudit>>;
  dispatchAccepted(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<Readonly<FarmBotPilotDispatchResult>>;
}

export class FarmBotCommandPilotError extends Error {
  constructor() {
    super('farmbot_command_pilot_acceptance_mismatch');
    this.name = 'FarmBotCommandPilotError';
  }
}

export async function acceptAndDispatchFarmBotWaterCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}, dependencies: FarmBotCommandPilotDependencies) {
  const userId = input.userId.trim();
  const commandId = input.commandId.toLowerCase();
  const now = input.now ?? new Date();
  if (!userId || !COMMAND_ID_PATTERN.test(commandId)
    || !(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotCommandPilotError();
  }

  const accepted = await dependencies.acceptValidated({ userId, commandId, now });
  if (accepted.userId !== userId || accepted.commandId !== commandId
    || accepted.policyVersion !== 1 || accepted.semanticCommand !== 'water'
    || accepted.state !== 'accepted' || accepted.rpcLabel !== farmBotCommandRpcLabel(commandId)
    || !(accepted.acceptedAt instanceof Date) || Number.isNaN(accepted.acceptedAt.valueOf())
    || accepted.acceptedAt > now || !(accepted.expiresAt instanceof Date)
    || Number.isNaN(accepted.expiresAt.valueOf()) || accepted.acceptedAt >= accepted.expiresAt
    || now >= accepted.expiresAt) {
    throw new FarmBotCommandPilotError();
  }

  const dispatched = await dependencies.dispatchAccepted({ userId, commandId, now });
  if (dispatched.commandId !== commandId
    || dispatched.rpcLabel !== accepted.rpcLabel
    || !POST_DISPATCH_STATES.has(dispatched.state)
    || !(dispatched.dispatchedAt instanceof Date)
    || Number.isNaN(dispatched.dispatchedAt.valueOf())
    || dispatched.dispatchedAt < accepted.acceptedAt
    || dispatched.dispatchedAt.getTime() > now.getTime() + 60_000) {
    throw new FarmBotCommandPilotError();
  }
  return Object.freeze({
    commandId: dispatched.commandId,
    state: dispatched.state,
    rpcLabel: dispatched.rpcLabel,
    dispatchedAt: new Date(dispatched.dispatchedAt),
  });
}
