import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return json({ success: false, error: 'Invalid FarmBot ID' }, 400);
  }

  try {
    const token = await loadFarmBotCredential(session.user.id, Number(id));
    const inventory = await listFarmBotPeripherals(token);
    return json({ success: true, data: inventory });
  } catch (error) {
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

    console.error('FarmBot peripheral discovery failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot peripheral discovery failed' }, 500);
  }
}
