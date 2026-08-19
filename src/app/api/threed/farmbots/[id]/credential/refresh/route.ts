import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  FarmBotBrokerIdentityMismatchError,
  FarmBotBrokerMetadataError,
} from '@/lib/services/threed/farmbot/broker-metadata-core';
import {
  FarmBotCredentialConcurrentUpdateError,
  FarmBotCredentialNotConfiguredError,
  FarmBotCredentialNotFoundError,
  loadFarmBotCredential,
  refreshFarmBotCredential,
} from '@/lib/services/threed/farmbot/credential-repository';
import { FarmBotCredentialKeyConfigurationError } from '@/lib/services/threed/farmbot/credential-keyring-core';
import { FarmBotCredentialRejectedError } from '@/lib/services/threed/farmbot/connection-client-core';
import { refreshFarmBotToken } from '@/lib/services/threed/farmbot/token-client';
import { FarmBotTokenServiceUnavailableError } from '@/lib/services/threed/farmbot/token-client-core';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return json({ success: false, error: 'Invalid FarmBot ID' }, 400);
  }
  const farmbotId = Number(id);

  try {
    const currentToken = await loadFarmBotCredential(session.user.id, farmbotId);
    const refreshedToken = await refreshFarmBotToken(currentToken);
    const result = await refreshFarmBotCredential(
      session.user.id,
      farmbotId,
      currentToken,
      refreshedToken
    );

    return json({
      success: true,
      data: result,
      message: 'FarmBot broker metadata refreshed; token expiration was not extended',
    });
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
    if (error instanceof FarmBotTokenServiceUnavailableError) {
      return json({ success: false, error: 'FarmBot token service is unavailable' }, 503);
    }
    if (error instanceof FarmBotBrokerIdentityMismatchError) {
      return json({ success: false, error: 'FarmBot broker identity changed unexpectedly' }, 409);
    }
    if (error instanceof FarmBotBrokerMetadataError) {
      return json({ success: false, error: 'FarmBot returned invalid broker metadata' }, 503);
    }
    if (error instanceof FarmBotCredentialConcurrentUpdateError) {
      return json({ success: false, error: 'FarmBot credential changed during refresh' }, 409);
    }
    if (error instanceof FarmBotCredentialKeyConfigurationError) {
      return json({ success: false, error: 'FarmBot credential encryption is not configured' }, 503);
    }

    console.error('FarmBot credential refresh failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot credential refresh failed' }, 500);
  }
}
