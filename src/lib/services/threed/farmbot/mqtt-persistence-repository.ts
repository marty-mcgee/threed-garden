import 'server-only';

import { and, desc, eq, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  threedMqttEvents,
  threedMqttRuntime,
  threedFarmbots,
} from '@/lib/schema/threed';
import { project, projectAssets, projectThreed } from '@/lib/schema/project';
import {
  FARMBOT_MQTT_EVENT_RETENTION_DAYS,
  type FarmBotMqttIngestionBatch,
} from './mqtt-persistence-core';

export class FarmBotMqttPersistenceScopeError extends Error {
  constructor() {
    super('FarmBot MQTT persistence scope does not match');
    this.name = 'FarmBotMqttPersistenceScopeError';
  }
}

function coordinate(value: number | undefined): string | null {
  return value === undefined ? null : value.toFixed(3);
}

export async function persistFarmBotMqttBatch(batch: FarmBotMqttIngestionBatch): Promise<{
  insertedEvents: number;
  runtimeUpdated: boolean;
}> {
  const [farmbot] = await db
    .select({
      id: threedFarmbots.id,
      userId: threedFarmbots.userId,
      brokerDeviceId: threedFarmbots.brokerDeviceId,
    })
    .from(threedFarmbots)
    .where(and(
      eq(threedFarmbots.id, batch.farmbotId),
      eq(threedFarmbots.userId, batch.ownerId),
      eq(threedFarmbots.brokerDeviceId, batch.brokerDeviceId)
    ))
    .limit(1);

  if (!farmbot || !farmbot.userId || !farmbot.brokerDeviceId) {
    throw new FarmBotMqttPersistenceScopeError();
  }

  const now = new Date();
  const retentionCutoff = new Date(
    now.getTime() - FARMBOT_MQTT_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1_000
  );
  const runtimePosition = batch.runtime.position;

  return db.transaction(async (tx) => {
    const [runtime] = await tx
      .insert(threedMqttRuntime)
      .values({
        userId: batch.ownerId,
        integrationType: 'farmbot',
        integrationId: batch.farmbotId,
        clientId: batch.brokerDeviceId,
        sessionId: batch.workerSessionId,
        connectionState: batch.runtime.connectionState,
        stateChangedAt: batch.runtime.stateChangedAt,
        lastMessageAt: batch.runtime.lastMessageAt,
        lastStatusAt: batch.runtime.lastStatusAt,
        positionX: coordinate(runtimePosition?.x),
        positionY: coordinate(runtimePosition?.y),
        positionZ: coordinate(runtimePosition?.z),
        credentialExpiresAt: batch.runtime.tokenExpiresAt,
        isStale: batch.runtime.isStale,
        reconnectAttempts: batch.runtime.reconnectAttempts,
        invalidMessageCount: batch.runtime.invalidMessageCount,
        errorCode: batch.runtime.errorCode,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [threedMqttRuntime.integrationType, threedMqttRuntime.integrationId],
        set: {
          userId: batch.ownerId,
          clientId: batch.brokerDeviceId,
          sessionId: batch.workerSessionId,
          connectionState: batch.runtime.connectionState,
          stateChangedAt: batch.runtime.stateChangedAt,
          lastMessageAt: batch.runtime.lastMessageAt,
          lastStatusAt: batch.runtime.lastStatusAt,
          positionX: coordinate(runtimePosition?.x),
          positionY: coordinate(runtimePosition?.y),
          positionZ: coordinate(runtimePosition?.z),
          credentialExpiresAt: batch.runtime.tokenExpiresAt,
          isStale: batch.runtime.isStale,
          reconnectAttempts: batch.runtime.reconnectAttempts,
          invalidMessageCount: batch.runtime.invalidMessageCount,
          errorCode: batch.runtime.errorCode,
          updatedAt: now,
        },
        setWhere: sql`excluded.state_changed_at >= ${threedMqttRuntime.stateChangedAt}`,
      })
      .returning({ id: threedMqttRuntime.id });

    const inserted = batch.events.length === 0
      ? []
      : await tx
        .insert(threedMqttEvents)
        .values(batch.events.map((event) => ({
          eventId: event.eventId,
          userId: batch.ownerId,
          integrationType: 'farmbot',
          integrationId: batch.farmbotId,
          clientId: batch.brokerDeviceId,
          sessionId: batch.workerSessionId,
          source: event.source,
          eventType: event.eventType,
          connectionState: event.connectionState,
          outcome: event.outcome,
          rpcLabel: event.rpcLabel,
          errorCode: event.errorCode,
          positionX: coordinate(event.position?.x),
          positionY: coordinate(event.position?.y),
          positionZ: coordinate(event.position?.z),
          summary: event.summary,
          payloadBytes: event.payloadBytes,
          payloadSha256: event.payloadSha256,
          occurredAt: event.occurredAt,
        })))
        .onConflictDoNothing({ target: threedMqttEvents.eventId })
        .returning({ id: threedMqttEvents.id });

    await tx
      .delete(threedMqttEvents)
      .where(and(
        eq(threedMqttEvents.userId, batch.ownerId),
        eq(threedMqttEvents.integrationType, 'farmbot'),
        eq(threedMqttEvents.integrationId, batch.farmbotId),
        lt(threedMqttEvents.occurredAt, retentionCutoff)
      ));

    return { insertedEvents: inserted.length, runtimeUpdated: Boolean(runtime) };
  });
}

export async function getOwnedFarmBotMqttRuntime(userId: string, farmbotId: number) {
  const [farmbot] = await db
    .select({ id: threedFarmbots.id })
    .from(threedFarmbots)
    .where(and(eq(threedFarmbots.id, farmbotId), eq(threedFarmbots.userId, userId)))
    .limit(1);
  if (!farmbot) throw new FarmBotMqttPersistenceScopeError();

  const [runtime] = await db
    .select({
      brokerDeviceId: threedMqttRuntime.clientId,
      workerSessionId: threedMqttRuntime.sessionId,
      connectionState: threedMqttRuntime.connectionState,
      stateChangedAt: threedMqttRuntime.stateChangedAt,
      lastMessageAt: threedMqttRuntime.lastMessageAt,
      lastStatusAt: threedMqttRuntime.lastStatusAt,
      positionX: threedMqttRuntime.positionX,
      positionY: threedMqttRuntime.positionY,
      positionZ: threedMqttRuntime.positionZ,
      tokenExpiresAt: threedMqttRuntime.credentialExpiresAt,
      isStale: threedMqttRuntime.isStale,
      reconnectAttempts: threedMqttRuntime.reconnectAttempts,
      invalidMessageCount: threedMqttRuntime.invalidMessageCount,
      errorCode: threedMqttRuntime.errorCode,
      updatedAt: threedMqttRuntime.updatedAt,
    })
    .from(threedMqttRuntime)
    .where(and(
      eq(threedMqttRuntime.userId, userId),
      eq(threedMqttRuntime.integrationType, 'farmbot'),
      eq(threedMqttRuntime.integrationId, farmbotId)
    ))
    .limit(1);
  return runtime ?? null;
}

export async function getProjectAssignedFarmBotMqttRuntime(input: {
  userId: string;
  projectId: number;
  farmbotId: number;
}) {
  const [assignment] = await db
    .select({ farmbotId: threedFarmbots.id })
    .from(projectAssets)
    .innerJoin(project, and(
      eq(project.id, projectAssets.projectId),
      eq(project.userId, input.userId)
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

  if (!assignment) throw new FarmBotMqttPersistenceScopeError();
  return getOwnedFarmBotMqttRuntime(input.userId, input.farmbotId);
}

export async function listOwnedFarmBotMqttEvents(input: {
  userId: string;
  farmbotId: number;
  limit: number;
  beforeId: number | null;
  source: string | null;
  eventType: string | null;
}) {
  const [farmbot] = await db
    .select({ id: threedFarmbots.id })
    .from(threedFarmbots)
    .where(and(
      eq(threedFarmbots.id, input.farmbotId),
      eq(threedFarmbots.userId, input.userId)
    ))
    .limit(1);
  if (!farmbot) throw new FarmBotMqttPersistenceScopeError();

  const conditions = [
    eq(threedMqttEvents.userId, input.userId),
    eq(threedMqttEvents.integrationType, 'farmbot'),
    eq(threedMqttEvents.integrationId, input.farmbotId),
  ];
  if (input.beforeId) conditions.push(lt(threedMqttEvents.id, input.beforeId));
  if (input.source) conditions.push(eq(threedMqttEvents.source, input.source));
  if (input.eventType) conditions.push(eq(threedMqttEvents.eventType, input.eventType));

  const rows = await db
    .select({
      id: threedMqttEvents.id,
      eventId: threedMqttEvents.eventId,
      source: threedMqttEvents.source,
      eventType: threedMqttEvents.eventType,
      connectionState: threedMqttEvents.connectionState,
      outcome: threedMqttEvents.outcome,
      rpcLabel: threedMqttEvents.rpcLabel,
      errorCode: threedMqttEvents.errorCode,
      positionX: threedMqttEvents.positionX,
      positionY: threedMqttEvents.positionY,
      positionZ: threedMqttEvents.positionZ,
      summary: threedMqttEvents.summary,
      payloadBytes: threedMqttEvents.payloadBytes,
      payloadSha256: threedMqttEvents.payloadSha256,
      occurredAt: threedMqttEvents.occurredAt,
    })
    .from(threedMqttEvents)
    .where(and(...conditions))
    .orderBy(desc(threedMqttEvents.id))
    .limit(input.limit + 1);
  const hasMore = rows.length > input.limit;
  const data = hasMore ? rows.slice(0, input.limit) : rows;
  return {
    data,
    nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null,
  };
}

export async function deleteOwnedFarmBotMqttEvents(input: {
  userId: string;
  farmbotId: number;
  before: Date | null;
}): Promise<number> {
  const [farmbot] = await db
    .select({ id: threedFarmbots.id })
    .from(threedFarmbots)
    .where(and(
      eq(threedFarmbots.id, input.farmbotId),
      eq(threedFarmbots.userId, input.userId)
    ))
    .limit(1);
  if (!farmbot) throw new FarmBotMqttPersistenceScopeError();

  const conditions = [
    eq(threedMqttEvents.userId, input.userId),
    eq(threedMqttEvents.integrationType, 'farmbot'),
    eq(threedMqttEvents.integrationId, input.farmbotId),
  ];
  if (input.before) conditions.push(lt(threedMqttEvents.occurredAt, input.before));
  const where = and(...conditions);
  const [count] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(threedMqttEvents)
    .where(where);
  await db.delete(threedMqttEvents).where(where);
  return count?.value ?? 0;
}
