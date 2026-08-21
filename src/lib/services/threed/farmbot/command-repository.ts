import 'server-only';

import { randomUUID } from 'node:crypto';
import { and, asc, eq, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { project, projectAssets, projectThreed } from '@/lib/schema/project';
import {
  threedFarmbotCommands,
  threedFarmbotPeripheralBindings,
  threedFarmbots,
} from '@/lib/schema/threed';
import {
  matchesFarmBotIdempotentRequest,
  prepareFarmBotRequestedCommand,
} from './command-repository-core';
import { parseFarmBotCommandIntent } from './command-policy-core';
import {
  FARMBOT_BLOCKING_COMMAND_STATES,
  FarmBotCommandValidationError,
  prepareRejectedFarmBotCommand,
  prepareValidatedFarmBotWaterCommand,
} from './command-validation-core';
import {
  FarmBotPeripheralBindingNotFoundError,
  validateFarmBotPeripheralBinding,
} from './peripheral-binding-validator';
import type { FarmBotPeripheralBindingValidation } from './peripheral-binding-core';
import {
  farmBotCommandRpcLabel,
  prepareAcceptedFarmBotCommand,
  prepareAcknowledgedFarmBotCommand,
  prepareCompletedFarmBotCommand,
  prepareDispatchedFarmBotCommand,
  prepareDispatchedFarmBotCommandRecovery,
  prepareRequiredFarmBotCommandRecovery,
  prepareResolvedFarmBotCommandRecovery,
  prepareTimedOutFarmBotCommand,
} from './command-lifecycle-core';

export class FarmBotCommandRepositoryScopeError extends Error {
  constructor() {
    super('farmbot_command_scope_mismatch');
    this.name = 'FarmBotCommandRepositoryScopeError';
  }
}

export class FarmBotCommandIdempotencyConflictError extends Error {
  constructor() {
    super('farmbot_command_idempotency_conflict');
    this.name = 'FarmBotCommandIdempotencyConflictError';
  }
}

export class FarmBotCommandTransitionConflictError extends Error {
  constructor() {
    super('farmbot_command_transition_conflict');
    this.name = 'FarmBotCommandTransitionConflictError';
  }
}

type FarmBotCommandQueryClient = Pick<typeof db, 'select'>;

async function assertActiveProjectFarmBotAssignment(input: {
  userId: string;
  projectId: number;
  farmbotId: number;
}, database: FarmBotCommandQueryClient = db): Promise<void> {
  const [assignment] = await database
    .select({ farmbotId: threedFarmbots.id })
    .from(projectAssets)
    .innerJoin(project, and(
      eq(project.id, projectAssets.projectId),
      eq(project.userId, input.userId),
      eq(project.isActive, true)
    ))
    .innerJoin(projectThreed, and(
      eq(projectThreed.projectId, projectAssets.projectId),
      eq(projectThreed.threedId, projectAssets.moduleId),
      eq(projectThreed.userId, input.userId),
      eq(projectThreed.isActive, true)
    ))
    .innerJoin(threedFarmbots, and(
      eq(threedFarmbots.id, projectAssets.assetId),
      eq(threedFarmbots.userId, input.userId),
      eq(threedFarmbots.isActive, true)
    ))
    .where(and(
      eq(projectAssets.projectId, input.projectId),
      eq(projectAssets.userId, input.userId),
      eq(projectAssets.moduleType, 'threed'),
      eq(projectAssets.assetType, 'threed_farmbots'),
      eq(projectAssets.assetId, input.farmbotId),
      eq(projectAssets.isActive, true)
    ))
    .limit(1);

  if (!assignment) throw new FarmBotCommandRepositoryScopeError();
}

export async function createRequestedFarmBotCommand(input: {
  userId: string;
  farmbotId: number;
  intent: unknown;
  requestedAt: Date;
  expiresAt: Date;
}) {
  const requested = prepareFarmBotRequestedCommand({
    ...input,
    commandId: randomUUID(),
    intent: parseFarmBotCommandIntent(input.intent),
  });
  await assertActiveProjectFarmBotAssignment({
    userId: requested.userId,
    projectId: requested.projectId,
    farmbotId: requested.farmbotId,
  });

  const [created] = await db
    .insert(threedFarmbotCommands)
    .values(requested)
    .onConflictDoNothing({
      target: [
        threedFarmbotCommands.userId,
        threedFarmbotCommands.farmbotId,
        threedFarmbotCommands.idempotencyKey,
      ],
    })
    .returning();
  if (created) return { command: created, created: true as const };

  const [existing] = await db
    .select()
    .from(threedFarmbotCommands)
    .where(and(
      eq(threedFarmbotCommands.userId, requested.userId),
      eq(threedFarmbotCommands.farmbotId, requested.farmbotId),
      eq(threedFarmbotCommands.idempotencyKey, requested.idempotencyKey)
    ))
    .limit(1);
  if (!existing || !matchesFarmBotIdempotentRequest(existing, requested)) {
    throw new FarmBotCommandIdempotencyConflictError();
  }
  return { command: existing, created: false as const };
}

export async function getOwnedFarmBotCommand(userId: string, commandId: string) {
  const [command] = await db
    .select()
    .from(threedFarmbotCommands)
    .where(and(
      eq(threedFarmbotCommands.userId, userId),
      eq(threedFarmbotCommands.commandId, commandId.toLowerCase())
    ))
    .limit(1);
  return command ?? null;
}

export async function validateRequestedFarmBotCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  if (input.now !== undefined
    && (!(input.now instanceof Date) || Number.isNaN(input.now.valueOf()))) {
    throw new FarmBotCommandValidationError('invalid_validation_time');
  }
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  if (command.state !== 'requested'
    || command.policyVersion !== 1
    || command.semanticCommand !== 'water') {
    throw new FarmBotCommandTransitionConflictError();
  }
  await assertActiveProjectFarmBotAssignment({
    userId: command.userId,
    projectId: command.projectId,
    farmbotId: command.farmbotId,
  });

  const [bindingBeforeValidation] = await db
    .select()
    .from(threedFarmbotPeripheralBindings)
    .where(and(
      eq(threedFarmbotPeripheralBindings.userId, command.userId),
      eq(threedFarmbotPeripheralBindings.farmbotId, command.farmbotId),
      eq(threedFarmbotPeripheralBindings.semanticAction, 'water')
    ))
    .limit(1);

  let bindingValidation: FarmBotPeripheralBindingValidation | null
    = bindingBeforeValidation && !bindingBeforeValidation.isActive
    ? { valid: false as const, reason: 'binding_inactive' as const, peripheral: null }
    : null;
  if (bindingBeforeValidation?.isActive) {
    try {
      bindingValidation = await validateFarmBotPeripheralBinding(
        command.userId,
        command.farmbotId,
        'water'
      );
    } catch (error) {
      if (!(error instanceof FarmBotPeripheralBindingNotFoundError)) throw error;
    }
  }

  return db.transaction(async (tx) => {
    const now = input.now ?? new Date();
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    await assertActiveProjectFarmBotAssignment({
      userId: command.userId,
      projectId: command.projectId,
      farmbotId: command.farmbotId,
    }, tx);

    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, command.userId)
      ))
      .limit(1);
    if (!current || current.state !== 'requested'
      || current.policyVersion !== 1 || current.semanticCommand !== 'water') {
      throw new FarmBotCommandTransitionConflictError();
    }

    const [binding] = await tx
      .select()
      .from(threedFarmbotPeripheralBindings)
      .where(and(
        eq(threedFarmbotPeripheralBindings.userId, current.userId),
        eq(threedFarmbotPeripheralBindings.farmbotId, current.farmbotId),
        eq(threedFarmbotPeripheralBindings.semanticAction, 'water')
      ))
      .limit(1);
    const [inFlight] = await tx
      .select({ id: threedFarmbotCommands.id })
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.userId, current.userId),
        eq(threedFarmbotCommands.farmbotId, current.farmbotId),
        ne(threedFarmbotCommands.id, current.id),
        inArray(threedFarmbotCommands.state, [...FARMBOT_BLOCKING_COMMAND_STATES])
      ))
      .limit(1);
    const [earlierRequested] = await tx
      .select({ id: threedFarmbotCommands.id })
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.userId, current.userId),
        eq(threedFarmbotCommands.farmbotId, current.farmbotId),
        eq(threedFarmbotCommands.state, 'requested'),
        or(
          lt(threedFarmbotCommands.requestedAt, current.requestedAt),
          and(
            eq(threedFarmbotCommands.requestedAt, current.requestedAt),
            lt(threedFarmbotCommands.id, current.id)
          )
        )
      ))
      .orderBy(asc(threedFarmbotCommands.requestedAt), asc(threedFarmbotCommands.id))
      .limit(1);

    try {
      if (!binding || !bindingValidation) {
        throw new FarmBotCommandValidationError('binding_missing');
      }
      const validated = prepareValidatedFarmBotWaterCommand({
        command: {
          commandId: current.commandId,
          idempotencyKey: current.idempotencyKey,
          userId: current.userId,
          projectId: current.projectId,
          farmbotId: current.farmbotId,
          policyVersion: 1,
          semanticCommand: 'water',
          state: 'requested',
          requestedAt: current.requestedAt,
          expiresAt: current.expiresAt,
        },
        binding,
        bindingValidation,
        anotherCommandActive: Boolean(inFlight || earlierRequested),
        now,
      });
      const [updated] = await tx
        .update(threedFarmbotCommands)
        .set({
          state: validated.state,
          peripheralBindingId: validated.peripheralBindingId,
          peripheralId: validated.peripheralId,
          peripheralPin: validated.peripheralPin,
          durationMs: validated.durationMs,
          commandFingerprint: validated.commandFingerprint,
          validatedAt: validated.validatedAt,
          rejectionCode: null,
          terminalAt: null,
          updatedAt: now,
        })
        .where(and(
          eq(threedFarmbotCommands.id, current.id),
          eq(threedFarmbotCommands.state, 'requested')
        ))
        .returning();
      if (!updated) throw new FarmBotCommandTransitionConflictError();
      return { command: updated, outcome: 'validated' as const };
    } catch (error) {
      if (!(error instanceof FarmBotCommandValidationError)) throw error;
      const rejected = prepareRejectedFarmBotCommand(error, now);
      const [updated] = await tx
        .update(threedFarmbotCommands)
        .set({
          state: rejected.state,
          rejectionCode: rejected.rejectionCode,
          terminalAt: rejected.terminalAt,
          updatedAt: now,
        })
        .where(and(
          eq(threedFarmbotCommands.id, current.id),
          eq(threedFarmbotCommands.state, 'requested')
        ))
        .returning();
      if (!updated) throw new FarmBotCommandTransitionConflictError();
      return { command: updated, outcome: 'rejected' as const };
    }
  });
}

export async function acceptValidatedFarmBotCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    await assertActiveProjectFarmBotAssignment({
      userId: current.userId,
      projectId: current.projectId,
      farmbotId: current.farmbotId,
    }, tx);
    const accepted = prepareAcceptedFarmBotCommand({
      command: current,
      rpcLabel: farmBotCommandRpcLabel(current.commandId),
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set({ ...accepted, updatedAt: accepted.acceptedAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        eq(threedFarmbotCommands.state, 'validated')
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}

export async function markAcceptedFarmBotCommandDispatched(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    await assertActiveProjectFarmBotAssignment({
      userId: current.userId,
      projectId: current.projectId,
      farmbotId: current.farmbotId,
    }, tx);
    const dispatched = prepareDispatchedFarmBotCommand({
      command: current,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set({ ...dispatched, updatedAt: dispatched.dispatchedAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        eq(threedFarmbotCommands.state, 'accepted')
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}

export async function recordFarmBotCommandAcknowledgement(input: {
  userId: string;
  commandId: string;
  rpcLabel: string;
  outcome: 'ok' | 'error';
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    const result = prepareAcknowledgedFarmBotCommand({
      command: current,
      rpcLabel: input.rpcLabel,
      outcome: input.outcome,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set(result.state === 'acknowledged'
        ? { ...result, rejectionCode: null, updatedAt: result.acknowledgedAt }
        : { ...result, updatedAt: result.terminalAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        eq(threedFarmbotCommands.state, 'dispatched')
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}

export async function completeAcknowledgedFarmBotCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    const completed = prepareCompletedFarmBotCommand({
      command: current,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set({ ...completed, rejectionCode: null, updatedAt: completed.completedAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        eq(threedFarmbotCommands.state, 'acknowledged')
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}

export async function timeOutDispatchedFarmBotCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    const timedOut = prepareTimedOutFarmBotCommand({
      command: current,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set({ ...timedOut, updatedAt: timedOut.terminalAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        eq(threedFarmbotCommands.state, 'dispatched')
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}

export async function requireFarmBotCommandRecovery(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    const required = prepareRequiredFarmBotCommandRecovery({
      command: current,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set({ ...required, updatedAt: required.recoveryRequiredAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        inArray(threedFarmbotCommands.state, ['timed_out', 'rejected']),
        isNull(threedFarmbotCommands.recoveryState)
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}

export async function markFarmBotCommandRecoveryDispatched(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    const dispatched = prepareDispatchedFarmBotCommandRecovery({
      command: current,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set({ ...dispatched, updatedAt: dispatched.recoveryDispatchedAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        eq(threedFarmbotCommands.recoveryState, 'required')
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}

export async function recordFarmBotCommandRecoveryAcknowledgement(input: {
  userId: string;
  commandId: string;
  rpcLabel: string;
  outcome: 'ok' | 'error';
  now?: Date;
}) {
  const command = await getOwnedFarmBotCommand(input.userId, input.commandId);
  if (!command) throw new FarmBotCommandRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`farmbot-command:${command.farmbotId}`}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotCommands)
      .where(and(
        eq(threedFarmbotCommands.id, command.id),
        eq(threedFarmbotCommands.userId, input.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotCommandTransitionConflictError();
    const resolved = prepareResolvedFarmBotCommandRecovery({
      command: current,
      rpcLabel: input.rpcLabel,
      outcome: input.outcome,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx
      .update(threedFarmbotCommands)
      .set({ ...resolved, updatedAt: resolved.recoveryResolvedAt })
      .where(and(
        eq(threedFarmbotCommands.id, current.id),
        eq(threedFarmbotCommands.userId, input.userId),
        eq(threedFarmbotCommands.recoveryState, 'dispatched'),
        eq(threedFarmbotCommands.recoveryRpcLabel, input.rpcLabel)
      ))
      .returning();
    if (!updated) throw new FarmBotCommandTransitionConflictError();
    return updated;
  });
}
