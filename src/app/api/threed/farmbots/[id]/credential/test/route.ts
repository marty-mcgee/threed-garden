import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  FarmBotCredentialConcurrentUpdateError,
  FarmBotCredentialNotConfiguredError,
  FarmBotCredentialNotFoundError,
  loadFarmBotCredential,
  recordFarmBotBrokerMetadataVerification,
} from '@/lib/services/threed/farmbot/credential-repository';
import { FarmBotCredentialKeyConfigurationError } from '@/lib/services/threed/farmbot/credential-keyring-core';
import {
  FarmBotConnectionUnavailableError,
  FarmBotCredentialRejectedError,
} from '@/lib/services/threed/farmbot/connection-client-core';
import { testFarmBotConnection } from '@/lib/services/threed/farmbot/connection-client';
import {
  FarmBotBrokerIdentityMismatchError,
  FarmBotBrokerMetadataError,
} from '@/lib/services/threed/farmbot/broker-metadata-core';

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
    const token = await loadFarmBotCredential(session.user.id, farmbotId);
    const summary = await testFarmBotConnection(token);
    const brokerMetadata = await recordFarmBotBrokerMetadataVerification(
      session.user.id,
      farmbotId,
      token,
      summary.deviceId
    );

    return json({
      success: true,
      data: { ...summary, brokerMetadata },
      message: 'FarmBot REST authentication succeeded; physical device not contacted',
    });
  } catch (error) {
    if (error instanceof FarmBotCredentialNotFoundError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }
    if (error instanceof FarmBotCredentialNotConfiguredError) {
      return json({ success: false, error: 'FarmBot credential is not configured' }, 409);
    }
    if (error instanceof FarmBotCredentialConcurrentUpdateError) {
      return json({ success: false, error: 'FarmBot credential changed during testing' }, 409);
    }
    if (error instanceof FarmBotCredentialRejectedError) {
      return json({ success: false, error: 'Stored FarmBot credential was rejected' }, 401);
    }
    if (error instanceof FarmBotConnectionUnavailableError) {
      return json({ success: false, error: 'FarmBot connection service is unavailable' }, 503);
    }
    if (error instanceof FarmBotCredentialKeyConfigurationError) {
      return json({ success: false, error: 'FarmBot credential encryption is not configured' }, 503);
    }
    if (error instanceof FarmBotBrokerMetadataError) {
      return json({ success: false, error: 'Stored token has invalid broker metadata' }, 500);
    }
    if (error instanceof FarmBotBrokerIdentityMismatchError) {
      return json({ success: false, error: 'FarmBot REST and broker identities do not match' }, 409);
    }

    console.error('FarmBot connection test failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot connection test failed' }, 500);
  }
}
