import 'server-only';

import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  threedFarmbotEmergencyActions,
  threedFarmbotPeripheralBindings,
  threedFarmbots,
} from '@/lib/schema/threed';
import {
  FarmBotEmergencyActionError,
  prepareAcceptedFarmBotEmergencyAction,
  prepareDispatchedFarmBotEmergencyAction,
  prepareExpiredFarmBotEmergencyAction,
  prepareRejectedFarmBotEmergencyAction,
  prepareRequestedFarmBotEmergencyAction,
  prepareResolvedFarmBotEmergencyAction,
  prepareValidatedFarmBotEmergencyAction,
} from './emergency-action-core';

export class FarmBotEmergencyActionRepositoryScopeError extends Error {
  constructor() {
    super('farmbot_emergency_action_scope_mismatch');
    this.name = 'FarmBotEmergencyActionRepositoryScopeError';
  }
}

export class FarmBotEmergencyActionTransitionConflictError extends Error {
  constructor() {
    super('farmbot_emergency_action_transition_conflict');
    this.name = 'FarmBotEmergencyActionTransitionConflictError';
  }
}

export class FarmBotEmergencyActionDeliveryContextError extends Error {
  constructor(readonly code: 'invalid_delivery_time' | 'action_not_accepted'
    | 'broker_identity_missing') {
    super(code);
    this.name = 'FarmBotEmergencyActionDeliveryContextError';
  }
}

function lockKey(farmbotId: number): string {
  return `farmbot-command:${farmbotId}`;
}

export async function getOwnedFarmBotEmergencyAction(userId: string, emergencyId: string) {
  const [action] = await db
    .select()
    .from(threedFarmbotEmergencyActions)
    .where(and(
      eq(threedFarmbotEmergencyActions.userId, userId.trim()),
      eq(threedFarmbotEmergencyActions.emergencyId, emergencyId.toLowerCase())
    ))
    .limit(1);
  return action ?? null;
}

export async function createRequestedFarmBotEmergencyAction(input: {
  userId: string;
  farmbotId: number;
  requestedAt?: Date;
}) {
  const requested = prepareRequestedFarmBotEmergencyAction({
    emergencyId: randomUUID(),
    userId: input.userId,
    farmbotId: input.farmbotId,
    requestedAt: input.requestedAt ?? new Date(),
  });

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey(requested.farmbotId)}))`);
    const [farmbot] = await tx
      .select({ id: threedFarmbots.id })
      .from(threedFarmbots)
      .where(and(
        eq(threedFarmbots.id, requested.farmbotId),
        eq(threedFarmbots.userId, requested.userId)
      ))
      .limit(1);
    if (!farmbot) throw new FarmBotEmergencyActionRepositoryScopeError();

    const [created] = await tx
      .insert(threedFarmbotEmergencyActions)
      .values(requested)
      .returning();
    if (!created) throw new FarmBotEmergencyActionTransitionConflictError();
    return created;
  });
}

export async function validateRequestedFarmBotEmergencyAction(input: {
  userId: string;
  emergencyId: string;
  now?: Date;
}) {
  const action = await getOwnedFarmBotEmergencyAction(input.userId, input.emergencyId);
  if (!action) throw new FarmBotEmergencyActionRepositoryScopeError();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey(action.farmbotId)}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotEmergencyActions)
      .where(and(
        eq(threedFarmbotEmergencyActions.id, action.id),
        eq(threedFarmbotEmergencyActions.userId, action.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotEmergencyActionRepositoryScopeError();
    if (current.state === 'validated' || current.state === 'rejected'
      || current.state === 'expired') return current;
    if (current.state !== 'requested' || current.policyVersion !== 1
      || current.semanticAction !== 'emergency_water_off') {
      throw new FarmBotEmergencyActionTransitionConflictError();
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
    const now = input.now ?? new Date();

    try {
      const validated = prepareValidatedFarmBotEmergencyAction({
        action: {
          emergencyId: current.emergencyId,
          userId: current.userId,
          farmbotId: current.farmbotId,
          policyVersion: 1,
          semanticAction: 'emergency_water_off',
          state: 'requested',
          rpcLabel: current.rpcLabel,
          requestedAt: current.requestedAt,
          expiresAt: current.expiresAt,
        },
        binding: binding ?? null,
        now,
      });
      const [updated] = await tx
        .update(threedFarmbotEmergencyActions)
        .set({ ...validated, outcomeErrorCode: null, updatedAt: validated.validatedAt })
        .where(and(
          eq(threedFarmbotEmergencyActions.id, current.id),
          eq(threedFarmbotEmergencyActions.userId, current.userId),
          eq(threedFarmbotEmergencyActions.state, 'requested')
        ))
        .returning();
      if (!updated) throw new FarmBotEmergencyActionTransitionConflictError();
      return updated;
    } catch (error) {
      if (!(error instanceof FarmBotEmergencyActionError)) throw error;
      if (error.code === 'emergency_expired') {
        const expired = prepareExpiredFarmBotEmergencyAction({ action: current, now });
        const [updated] = await tx
          .update(threedFarmbotEmergencyActions)
          .set({ ...expired, updatedAt: expired.terminalAt })
          .where(and(
            eq(threedFarmbotEmergencyActions.id, current.id),
            eq(threedFarmbotEmergencyActions.userId, current.userId),
            eq(threedFarmbotEmergencyActions.state, 'requested')
          ))
          .returning();
        if (!updated) throw new FarmBotEmergencyActionTransitionConflictError();
        return updated;
      }
      if (!['binding_missing', 'binding_inactive', 'binding_metadata_changed',
        'unsupported_peripheral_mode'].includes(error.code)) throw error;
      const rejected = prepareRejectedFarmBotEmergencyAction({
        action: current,
        errorCode: error.code as 'binding_missing' | 'binding_inactive'
          | 'binding_metadata_changed' | 'unsupported_peripheral_mode',
        now,
      });
      const [updated] = await tx
        .update(threedFarmbotEmergencyActions)
        .set({ ...rejected, updatedAt: rejected.terminalAt })
        .where(and(
          eq(threedFarmbotEmergencyActions.id, current.id),
          eq(threedFarmbotEmergencyActions.userId, current.userId),
          eq(threedFarmbotEmergencyActions.state, 'requested')
        ))
        .returning();
      if (!updated) throw new FarmBotEmergencyActionTransitionConflictError();
      return updated;
    }
  });
}

export async function acceptValidatedFarmBotEmergencyAction(input: {
  userId: string;
  emergencyId: string;
  now?: Date;
}) {
  const action = await getOwnedFarmBotEmergencyAction(input.userId, input.emergencyId);
  if (!action) throw new FarmBotEmergencyActionRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey(action.farmbotId)}))`);
    const [current] = await tx.select().from(threedFarmbotEmergencyActions).where(and(
      eq(threedFarmbotEmergencyActions.id, action.id),
      eq(threedFarmbotEmergencyActions.userId, action.userId)
    )).limit(1);
    if (!current) throw new FarmBotEmergencyActionRepositoryScopeError();
    if (current.state === 'accepted') return current;
    const accepted = prepareAcceptedFarmBotEmergencyAction({
      action: current,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx.update(threedFarmbotEmergencyActions)
      .set({ ...accepted, updatedAt: accepted.acceptedAt })
      .where(and(
        eq(threedFarmbotEmergencyActions.id, current.id),
        eq(threedFarmbotEmergencyActions.userId, current.userId),
        eq(threedFarmbotEmergencyActions.state, 'validated')
      )).returning();
    if (!updated) throw new FarmBotEmergencyActionTransitionConflictError();
    return updated;
  });
}

export async function getAcceptedFarmBotEmergencyActionDeliveryContext(input: {
  userId: string;
  emergencyId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new FarmBotEmergencyActionDeliveryContextError('invalid_delivery_time');
  }
  const action = await getOwnedFarmBotEmergencyAction(input.userId, input.emergencyId);
  if (!action) throw new FarmBotEmergencyActionRepositoryScopeError();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey(action.farmbotId)}))`);
    const [current] = await tx
      .select()
      .from(threedFarmbotEmergencyActions)
      .where(and(
        eq(threedFarmbotEmergencyActions.id, action.id),
        eq(threedFarmbotEmergencyActions.userId, action.userId)
      ))
      .limit(1);
    if (!current) throw new FarmBotEmergencyActionRepositoryScopeError();
    if (current.policyVersion !== 1 || current.semanticAction !== 'emergency_water_off'
      || current.state !== 'accepted' || current.peripheralId === null
      || current.peripheralPin === null || current.peripheralMode !== 0
      || !(current.acceptedAt instanceof Date) || Number.isNaN(current.acceptedAt.valueOf())
      || current.acceptedAt > now || current.acceptedAt >= current.expiresAt
      || current.expiresAt <= now) {
      throw new FarmBotEmergencyActionDeliveryContextError('action_not_accepted');
    }

    const [farmbot] = await tx
      .select({ brokerDeviceId: threedFarmbots.brokerDeviceId })
      .from(threedFarmbots)
      .where(and(
        eq(threedFarmbots.id, current.farmbotId),
        eq(threedFarmbots.userId, current.userId)
      ))
      .limit(1);
    if (!farmbot?.brokerDeviceId || !/^device_[1-9]\d*$/.test(farmbot.brokerDeviceId)) {
      throw new FarmBotEmergencyActionDeliveryContextError('broker_identity_missing');
    }

    return Object.freeze({ action: current, brokerDeviceId: farmbot.brokerDeviceId });
  });
}

export async function recordFarmBotEmergencyActionDispatch(input: {
  userId: string;
  emergencyId: string;
  rpcLabel: string;
  workerAcceptedAt: Date;
}) {
  const action = await getOwnedFarmBotEmergencyAction(input.userId, input.emergencyId);
  if (!action) throw new FarmBotEmergencyActionRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey(action.farmbotId)}))`);
    const [current] = await tx.select().from(threedFarmbotEmergencyActions).where(and(
      eq(threedFarmbotEmergencyActions.id, action.id),
      eq(threedFarmbotEmergencyActions.userId, action.userId)
    )).limit(1);
    if (!current || current.rpcLabel !== input.rpcLabel) {
      throw new FarmBotEmergencyActionTransitionConflictError();
    }
    const alreadyRecorded = ['dispatched', 'acknowledged', 'failed'].includes(current.state)
      && current.dispatchedAt instanceof Date
      && input.workerAcceptedAt instanceof Date
      && current.dispatchedAt.getTime() === input.workerAcceptedAt.getTime();
    if (alreadyRecorded) return current;
    const dispatched = prepareDispatchedFarmBotEmergencyAction({
      action: current,
      now: input.workerAcceptedAt,
    });
    const [updated] = await tx.update(threedFarmbotEmergencyActions)
      .set({ ...dispatched, updatedAt: dispatched.dispatchedAt })
      .where(and(
        eq(threedFarmbotEmergencyActions.id, current.id),
        eq(threedFarmbotEmergencyActions.userId, current.userId),
        eq(threedFarmbotEmergencyActions.state, 'accepted'),
        eq(threedFarmbotEmergencyActions.rpcLabel, input.rpcLabel)
      )).returning();
    if (!updated) throw new FarmBotEmergencyActionTransitionConflictError();
    return updated;
  });
}

export async function recordFarmBotEmergencyActionAcknowledgement(input: {
  userId: string;
  emergencyId: string;
  rpcLabel: string;
  outcome: 'ok' | 'error';
  now?: Date;
}) {
  const action = await getOwnedFarmBotEmergencyAction(input.userId, input.emergencyId);
  if (!action) throw new FarmBotEmergencyActionRepositoryScopeError();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey(action.farmbotId)}))`);
    const [current] = await tx.select().from(threedFarmbotEmergencyActions).where(and(
      eq(threedFarmbotEmergencyActions.id, action.id),
      eq(threedFarmbotEmergencyActions.userId, action.userId)
    )).limit(1);
    if (!current) throw new FarmBotEmergencyActionRepositoryScopeError();
    const alreadyRecorded = current.rpcLabel === input.rpcLabel
      && ((input.outcome === 'ok' && current.state === 'acknowledged'
        && current.outcomeErrorCode === null)
        || (input.outcome === 'error' && current.state === 'failed'
          && current.outcomeErrorCode === 'farmbot_emergency_rpc_error'));
    if (alreadyRecorded) return current;
    const resolved = prepareResolvedFarmBotEmergencyAction({
      action: current,
      rpcLabel: input.rpcLabel,
      outcome: input.outcome,
      now: input.now ?? new Date(),
    });
    const [updated] = await tx.update(threedFarmbotEmergencyActions)
      .set({ ...resolved, updatedAt: resolved.terminalAt })
      .where(and(
        eq(threedFarmbotEmergencyActions.id, current.id),
        eq(threedFarmbotEmergencyActions.userId, current.userId),
        eq(threedFarmbotEmergencyActions.state, 'dispatched'),
        eq(threedFarmbotEmergencyActions.rpcLabel, input.rpcLabel)
      )).returning();
    if (!updated) throw new FarmBotEmergencyActionTransitionConflictError();
    return updated;
  });
}
