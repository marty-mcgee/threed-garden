import { farmBotCommandRpcLabel } from '../../../farmbot/command-lifecycle-core';

const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FarmBotCommandCompletionAudit {
  commandId: string;
  rpcLabel: string | null;
  state: string;
  rejectionCode: string | null;
  acknowledgedAt: Date | null;
  completedAt: Date | null;
  terminalAt: Date | null;
}

export interface FarmBotCommandCompletionDependencies {
  recordAcknowledgement(input: {
    userId: string;
    commandId: string;
    rpcLabel: string;
    outcome: 'ok' | 'error';
    now: Date;
  }): Promise<Readonly<FarmBotCommandCompletionAudit>>;
  completeAcknowledged(input: {
    userId: string;
    commandId: string;
    now: Date;
  }): Promise<Readonly<FarmBotCommandCompletionAudit>>;
}

export class FarmBotCommandCompletionError extends Error {
  constructor() {
    super('farmbot_command_completion_mismatch');
    this.name = 'FarmBotCommandCompletionError';
  }
}

function exactDate(value: Date | null, expected: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.valueOf())
    && value.getTime() === expected.getTime();
}

export async function recordAndCompleteFarmBotCommandAcknowledgement(input: {
  userId: string;
  commandId: string;
  rpcLabel: string;
  outcome: 'ok' | 'error';
  receivedAt: Date;
}, dependencies: FarmBotCommandCompletionDependencies) {
  const userId = input.userId.trim();
  const commandId = input.commandId.toLowerCase();
  if (!userId || !COMMAND_ID_PATTERN.test(commandId)
    || input.rpcLabel !== farmBotCommandRpcLabel(commandId)
    || !(input.receivedAt instanceof Date) || Number.isNaN(input.receivedAt.valueOf())) {
    throw new FarmBotCommandCompletionError();
  }

  const acknowledged = await dependencies.recordAcknowledgement({
    userId,
    commandId,
    rpcLabel: input.rpcLabel,
    outcome: input.outcome,
    now: new Date(input.receivedAt),
  });
  if (acknowledged.commandId !== commandId || acknowledged.rpcLabel !== input.rpcLabel) {
    throw new FarmBotCommandCompletionError();
  }
  if (input.outcome === 'error') {
    if (acknowledged.state !== 'rejected'
      || acknowledged.rejectionCode !== 'farmbot_rpc_error'
      || !exactDate(acknowledged.terminalAt, input.receivedAt)) {
      throw new FarmBotCommandCompletionError();
    }
    return Object.freeze({ commandId, state: 'rejected' as const });
  }

  if (acknowledged.state === 'completed') {
    if (!exactDate(acknowledged.completedAt, input.receivedAt)) {
      throw new FarmBotCommandCompletionError();
    }
    return Object.freeze({ commandId, state: 'completed' as const });
  }
  if (acknowledged.state !== 'acknowledged'
    || !exactDate(acknowledged.acknowledgedAt, input.receivedAt)) {
    throw new FarmBotCommandCompletionError();
  }
  const completed = await dependencies.completeAcknowledged({
    userId,
    commandId,
    now: new Date(input.receivedAt),
  });
  if (completed.commandId !== commandId || completed.rpcLabel !== input.rpcLabel
    || completed.state !== 'completed'
    || !exactDate(completed.completedAt, input.receivedAt)) {
    throw new FarmBotCommandCompletionError();
  }
  return Object.freeze({ commandId, state: 'completed' as const });
}
