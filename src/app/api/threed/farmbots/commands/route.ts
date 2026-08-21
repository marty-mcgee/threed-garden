// src/app/api/threed/farmbots/commands/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { FarmBotCommandPolicyError } from '@/lib/services/threed/farmbot/command-policy-core';
import { FARMBOT_COMMAND_REQUEST_TTL_MS } from '@/lib/services/threed/farmbot/command-validation-core';
import { FarmBotCommandRepositoryInputError } from '@/lib/services/threed/farmbot/command-repository-core';
import {
  FarmBotCommandIdempotencyConflictError,
  FarmBotCommandRepositoryScopeError,
  FarmBotCommandTransitionConflictError,
  createRequestedFarmBotCommand,
  validateRequestedFarmBotCommand,
} from '@/lib/services/threed/farmbot/command-repository';
import {
  FARMBOT_COMMAND_REQUEST_MAX_BYTES,
  FarmBotCommandRequestError,
  parseFarmBotCommandRequestEnvelope,
  toFarmBotCommandAuthorizationStatus,
} from '@/lib/services/threed/farmbot/command-route-core';
import {
  FarmBotCredentialNotConfiguredError,
  FarmBotCredentialNotFoundError,
} from '@/lib/services/threed/farmbot/credential-repository';
import { FarmBotCredentialKeyConfigurationError } from '@/lib/services/threed/farmbot/credential-keyring-core';
import {
  FarmBotConnectionUnavailableError,
  FarmBotCredentialRejectedError,
} from '@/lib/services/threed/farmbot/connection-client-core';

export const dynamic = 'force-dynamic';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > FARMBOT_COMMAND_REQUEST_MAX_BYTES) {
      return json({ success: false, error: 'FarmBot command request is too large' }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ success: false, error: 'Invalid JSON request' }, 400);
    }
    const envelope = parseFarmBotCommandRequestEnvelope(body);
    const requestedAt = new Date();
    const requested = await createRequestedFarmBotCommand({
      userId: session.user.id,
      farmbotId: envelope.farmbotId,
      intent: envelope.intent,
      requestedAt,
      expiresAt: new Date(requestedAt.getTime() + FARMBOT_COMMAND_REQUEST_TTL_MS),
    });

    const result = requested.command.state === 'requested'
      ? await validateRequestedFarmBotCommand({
          userId: session.user.id,
          commandId: requested.command.commandId,
        })
      : { command: requested.command, outcome: requested.command.state };
    const data = toFarmBotCommandAuthorizationStatus(result.command);

    if (data.state === 'rejected') {
      return json({ success: false, error: 'FarmBot command was rejected', data }, 409);
    }
    if (data.state !== 'validated') {
      return json({ success: false, error: 'FarmBot command state cannot be authorized', data }, 409);
    }
    return json({
      success: true,
      data,
      message: 'FarmBot command validated; delivery remains disabled',
    }, requested.created ? 202 : 200);
  } catch (error) {
    if (error instanceof FarmBotCommandRequestError
      || error instanceof FarmBotCommandPolicyError
      || error instanceof FarmBotCommandRepositoryInputError) {
      return json({ success: false, error: 'Invalid FarmBot command request' }, 400);
    }
    if (error instanceof FarmBotCommandRepositoryScopeError
      || error instanceof FarmBotCredentialNotFoundError) {
      return json({ success: false, error: 'FarmBot command target not found' }, 404);
    }
    if (error instanceof FarmBotCommandIdempotencyConflictError
      || error instanceof FarmBotCommandTransitionConflictError) {
      return json({ success: false, error: 'FarmBot command conflict' }, 409);
    }
    if (error instanceof FarmBotCredentialNotConfiguredError) {
      return json({ success: false, error: 'FarmBot credential is not configured' }, 409);
    }
    if (error instanceof FarmBotCredentialRejectedError) {
      return json({ success: false, error: 'Stored FarmBot credential was rejected' }, 401);
    }
    if (error instanceof FarmBotConnectionUnavailableError) {
      return json({ success: false, error: 'FarmBot peripheral service is unavailable' }, 503);
    }
    if (error instanceof FarmBotCredentialKeyConfigurationError) {
      return json({ success: false, error: 'FarmBot credential encryption is not configured' }, 503);
    }

    console.error('FarmBot command authorization failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot command authorization failed' }, 500);
  }
}
