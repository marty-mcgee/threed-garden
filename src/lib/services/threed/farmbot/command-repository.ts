import 'server-only';

import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { project, projectAssets, projectThreed } from '@/lib/schema/project';
import {
  threedFarmbotCommands,
  threedFarmbots,
} from '@/lib/schema/threed';
import {
  matchesFarmBotIdempotentRequest,
  prepareFarmBotRequestedCommand,
} from './command-repository-core';
import { parseFarmBotCommandIntent } from './command-policy-core';

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

async function assertActiveProjectFarmBotAssignment(input: {
  userId: string;
  projectId: number;
  farmbotId: number;
}): Promise<void> {
  const [assignment] = await db
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
