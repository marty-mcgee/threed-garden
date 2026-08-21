const RPC_LABEL_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const COMMAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const FARMBOT_WATER_ACK_GRACE_MS = 10_000;
export const FARMBOT_WATER_ACK_TIMEOUT_MS = 15_000;

export class FarmBotCommandLifecycleError extends Error {
  readonly code:
    | 'invalid_transition'
    | 'invalid_transition_time'
    | 'invalid_rpc_label'
    | 'command_expired'
    | 'acknowledgement_pending';

  constructor(code: FarmBotCommandLifecycleError['code']) {
    super(code);
    this.name = 'FarmBotCommandLifecycleError';
    this.code = code;
  }
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.valueOf());
}

function transitionTime(now: Date, previous?: Date | null): Date {
  if (!validDate(now) || (previous !== undefined
    && (!validDate(previous) || previous > now))) {
    throw new FarmBotCommandLifecycleError('invalid_transition_time');
  }
  return new Date(now);
}

function assertRpcLabel(value: string): void {
  if (!RPC_LABEL_PATTERN.test(value)) {
    throw new FarmBotCommandLifecycleError('invalid_rpc_label');
  }
}

export function farmBotCommandRpcLabel(commandId: string): string {
  if (!COMMAND_ID_PATTERN.test(commandId)) {
    throw new FarmBotCommandLifecycleError('invalid_rpc_label');
  }
  return `threed_water_${commandId.replaceAll('-', '').toLowerCase()}`;
}

export function farmBotCommandRecoveryRpcLabel(commandId: string): string {
  if (!COMMAND_ID_PATTERN.test(commandId)) {
    throw new FarmBotCommandLifecycleError('invalid_rpc_label');
  }
  return `threed_water_off_${commandId.replaceAll('-', '').toLowerCase()}`;
}

export function prepareAcceptedFarmBotCommand(input: {
  command: { state: string; expiresAt: Date; rpcLabel: string | null };
  rpcLabel: string;
  now: Date;
}) {
  if (input.command.state !== 'validated' || input.command.rpcLabel !== null) {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  const now = transitionTime(input.now);
  if (!validDate(input.command.expiresAt) || now >= input.command.expiresAt) {
    throw new FarmBotCommandLifecycleError('command_expired');
  }
  assertRpcLabel(input.rpcLabel);
  return Object.freeze({ state: 'accepted' as const, rpcLabel: input.rpcLabel, acceptedAt: now });
}

export function prepareDispatchedFarmBotCommand(input: {
  command: { state: string; rpcLabel: string | null; acceptedAt: Date | null };
  now: Date;
}) {
  if (input.command.state !== 'accepted' || input.command.rpcLabel === null) {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  assertRpcLabel(input.command.rpcLabel);
  const now = transitionTime(input.now, input.command.acceptedAt);
  return Object.freeze({ state: 'dispatched' as const, dispatchedAt: now });
}

export function prepareAcknowledgedFarmBotCommand(input: {
  command: { state: string; rpcLabel: string | null; dispatchedAt: Date | null };
  rpcLabel: string;
  outcome: 'ok' | 'error';
  now: Date;
}) {
  if (input.command.state !== 'dispatched' || input.command.rpcLabel === null) {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  assertRpcLabel(input.command.rpcLabel);
  if (input.rpcLabel !== input.command.rpcLabel) {
    throw new FarmBotCommandLifecycleError('invalid_rpc_label');
  }
  const now = transitionTime(input.now, input.command.dispatchedAt);
  return input.outcome === 'error'
    ? Object.freeze({
        state: 'rejected' as const,
        rejectionCode: 'farmbot_rpc_error' as const,
        terminalAt: now,
      })
    : Object.freeze({ state: 'acknowledged' as const, acknowledgedAt: now });
}

export function prepareCompletedFarmBotCommand(input: {
  command: { state: string; acknowledgedAt: Date | null };
  now: Date;
}) {
  if (input.command.state !== 'acknowledged') {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  const now = transitionTime(input.now, input.command.acknowledgedAt);
  return Object.freeze({ state: 'completed' as const, completedAt: now, terminalAt: now });
}

export function prepareTimedOutFarmBotCommand(input: {
  command: { state: string; dispatchedAt: Date | null };
  now: Date;
}) {
  if (input.command.state !== 'dispatched') {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  const now = transitionTime(input.now, input.command.dispatchedAt);
  const deadline = new Date(
    (input.command.dispatchedAt as Date).getTime() + FARMBOT_WATER_ACK_TIMEOUT_MS
  );
  if (now < deadline) {
    throw new FarmBotCommandLifecycleError('acknowledgement_pending');
  }
  return Object.freeze({
    state: 'timed_out' as const,
    rejectionCode: 'ack_timeout' as const,
    terminalAt: now,
  });
}

export function prepareRequiredFarmBotCommandRecovery(input: {
  command: {
    commandId: string;
    state: string;
    dispatchedAt: Date | null;
    recoveryState: string | null;
  };
  now: Date;
}) {
  if (!['timed_out', 'rejected'].includes(input.command.state)
    || input.command.recoveryState !== null) {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  const now = transitionTime(input.now, input.command.dispatchedAt);
  return Object.freeze({
    recoveryState: 'required' as const,
    recoveryRpcLabel: farmBotCommandRecoveryRpcLabel(input.command.commandId),
    recoveryRequiredAt: now,
  });
}

export function prepareDispatchedFarmBotCommandRecovery(input: {
  command: {
    recoveryState: string | null;
    recoveryRpcLabel: string | null;
    recoveryRequiredAt: Date | null;
  };
  now: Date;
}) {
  if (input.command.recoveryState !== 'required'
    || input.command.recoveryRpcLabel === null) {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  assertRpcLabel(input.command.recoveryRpcLabel);
  const now = transitionTime(input.now, input.command.recoveryRequiredAt);
  return Object.freeze({
    recoveryState: 'dispatched' as const,
    recoveryDispatchedAt: now,
  });
}

export function prepareResolvedFarmBotCommandRecovery(input: {
  command: {
    recoveryState: string | null;
    recoveryRpcLabel: string | null;
    recoveryDispatchedAt: Date | null;
  };
  rpcLabel: string;
  outcome: 'ok' | 'error';
  now: Date;
}) {
  if (input.command.recoveryState !== 'dispatched'
    || input.command.recoveryRpcLabel === null) {
    throw new FarmBotCommandLifecycleError('invalid_transition');
  }
  assertRpcLabel(input.command.recoveryRpcLabel);
  if (input.rpcLabel !== input.command.recoveryRpcLabel) {
    throw new FarmBotCommandLifecycleError('invalid_rpc_label');
  }
  const now = transitionTime(input.now, input.command.recoveryDispatchedAt);
  return input.outcome === 'error'
    ? Object.freeze({
        recoveryState: 'failed' as const,
        recoveryErrorCode: 'farmbot_recovery_rpc_error' as const,
        recoveryResolvedAt: now,
      })
    : Object.freeze({
        recoveryState: 'confirmed' as const,
        recoveryErrorCode: null,
        recoveryResolvedAt: now,
      });
}
