import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  threedFarmbotPeripheralBindings,
  threedFarmbots,
} from '@/lib/schema/threed';
import {
  FarmBotCredentialNotConfiguredError,
  FarmBotCredentialNotFoundError,
  loadFarmBotCredential,
} from '@/lib/services/threed/farmbot/credential-repository';
import { FarmBotCredentialKeyConfigurationError } from '@/lib/services/threed/farmbot/credential-keyring-core';
import {
  FarmBotConnectionUnavailableError,
  FarmBotCredentialRejectedError,
} from '@/lib/services/threed/farmbot/connection-client-core';
import { listFarmBotPeripherals } from '@/lib/services/threed/farmbot/peripheral-client';
import { isFarmBotSemanticAction } from '@/lib/services/threed/farmbot/peripheral-binding-core';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function resolveIdentity(context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: json({ success: false, error: 'Unauthorized' }, 401) };
  }

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return { response: json({ success: false, error: 'Invalid FarmBot ID' }, 400) };
  }

  const farmbotId = Number(id);
  const [farmbot] = await db
    .select({ id: threedFarmbots.id })
    .from(threedFarmbots)
    .where(and(
      eq(threedFarmbots.id, farmbotId),
      eq(threedFarmbots.userId, session.user.id)
    ))
    .limit(1);

  if (!farmbot) {
    return { response: json({ success: false, error: 'FarmBot not found' }, 404) };
  }

  return { userId: session.user.id, farmbotId };
}

function handleExternalError(error: unknown) {
  if (error instanceof FarmBotCredentialNotFoundError) {
    return json({ success: false, error: 'FarmBot not found' }, 404);
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

  console.error('FarmBot peripheral binding operation failed', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  });
  return json({ success: false, error: 'FarmBot peripheral binding operation failed' }, 500);
}

export async function GET(_request: Request, context: RouteContext) {
  const identity = await resolveIdentity(context);
  if ('response' in identity) return identity.response;

  const bindings = await db
    .select()
    .from(threedFarmbotPeripheralBindings)
    .where(and(
      eq(threedFarmbotPeripheralBindings.farmbotId, identity.farmbotId),
      eq(threedFarmbotPeripheralBindings.userId, identity.userId)
    ));

  return json({ success: true, data: bindings });
}

export async function PUT(request: Request, context: RouteContext) {
  const identity = await resolveIdentity(context);
  if ('response' in identity) return identity.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const semanticAction = typeof body === 'object' && body !== null
    && 'semanticAction' in body && typeof body.semanticAction === 'string'
    ? body.semanticAction.trim().toLowerCase()
    : '';
  const peripheralId = typeof body === 'object' && body !== null
    && 'peripheralId' in body && typeof body.peripheralId === 'number'
    ? body.peripheralId
    : null;

  if (!isFarmBotSemanticAction(semanticAction)) {
    return json({ success: false, error: 'Unsupported FarmBot semantic action' }, 400);
  }
  if (peripheralId === null || !Number.isSafeInteger(peripheralId) || peripheralId <= 0) {
    return json({ success: false, error: 'Valid FarmBot peripheral ID is required' }, 400);
  }

  try {
    const token = await loadFarmBotCredential(identity.userId, identity.farmbotId);
    const inventory = await listFarmBotPeripherals(token);
    const peripheral = inventory.peripherals.find((item) => item.id === peripheralId);
    if (!peripheral) {
      return json({ success: false, error: 'Peripheral is not available for this FarmBot' }, 409);
    }

    const now = new Date();
    const [binding] = await db
      .insert(threedFarmbotPeripheralBindings)
      .values({
        userId: identity.userId,
        farmbotId: identity.farmbotId,
        semanticAction,
        peripheralId: peripheral.id,
        peripheralLabel: peripheral.label,
        peripheralPin: peripheral.pin,
        peripheralMode: peripheral.mode,
        isActive: true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          threedFarmbotPeripheralBindings.farmbotId,
          threedFarmbotPeripheralBindings.semanticAction,
        ],
        set: {
          userId: identity.userId,
          peripheralId: peripheral.id,
          peripheralLabel: peripheral.label,
          peripheralPin: peripheral.pin,
          peripheralMode: peripheral.mode,
          isActive: true,
          updatedAt: now,
        },
      })
      .returning();

    return json({
      success: true,
      data: binding,
      message: `FarmBot ${semanticAction} peripheral assigned; physical commands remain disabled`,
    });
  } catch (error) {
    return handleExternalError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await resolveIdentity(context);
  if ('response' in identity) return identity.response;

  const semanticAction = new URL(request.url).searchParams.get('semanticAction')
    ?.trim().toLowerCase() ?? '';
  if (!isFarmBotSemanticAction(semanticAction)) {
    return json({ success: false, error: 'Unsupported FarmBot semantic action' }, 400);
  }

  await db
    .delete(threedFarmbotPeripheralBindings)
    .where(and(
      eq(threedFarmbotPeripheralBindings.userId, identity.userId),
      eq(threedFarmbotPeripheralBindings.farmbotId, identity.farmbotId),
      eq(threedFarmbotPeripheralBindings.semanticAction, semanticAction)
    ));

  return json({
    success: true,
    data: null,
    message: `FarmBot ${semanticAction} peripheral assignment removed`,
  });
}
