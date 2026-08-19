import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  clearFarmBotCredential,
  FarmBotCredentialNotFoundError,
  getFarmBotCredentialStatus,
  saveFarmBotCredential,
} from '@/lib/services/threed/farmbot/credential-repository';
import { FarmBotCredentialKeyConfigurationError } from '@/lib/services/threed/farmbot/credential-keyring-core';
import {
  FarmBotBrokerIdentityMismatchError,
  FarmBotBrokerMetadataError,
} from '@/lib/services/threed/farmbot/broker-metadata-core';

export const dynamic = 'force-dynamic';

const MAX_CREDENTIAL_LENGTH = 16_384;

type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function resolveOwnerAndFarmBotId(context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: json({ success: false, error: 'Unauthorized' }, 401) };
  }

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id)) {
    return { response: json({ success: false, error: 'Invalid FarmBot ID' }, 400) };
  }

  const farmbotId = Number(id);
  if (!Number.isSafeInteger(farmbotId)) {
    return { response: json({ success: false, error: 'Invalid FarmBot ID' }, 400) };
  }

  return { userId: session.user.id, farmbotId };
}

function handleRepositoryError(error: unknown) {
  if (error instanceof FarmBotCredentialNotFoundError) {
    return json({ success: false, error: 'FarmBot not found' }, 404);
  }
  if (error instanceof FarmBotCredentialKeyConfigurationError) {
    return json(
      { success: false, error: 'FarmBot credential encryption is not configured' },
      503
    );
  }
  if (error instanceof FarmBotBrokerMetadataError) {
    return json({ success: false, error: 'Credential has invalid FarmBot broker metadata' }, 400);
  }
  if (error instanceof FarmBotBrokerIdentityMismatchError) {
    return json({ success: false, error: 'Credential belongs to a different FarmBot' }, 409);
  }

  console.error('FarmBot credential operation failed', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  });
  return json({ success: false, error: 'FarmBot credential operation failed' }, 500);
}

export async function GET(_request: Request, context: RouteContext) {
  const identity = await resolveOwnerAndFarmBotId(context);
  if ('response' in identity) return identity.response;

  try {
    const status = await getFarmBotCredentialStatus(identity.userId, identity.farmbotId);
    return json({ success: true, data: status });
  } catch (error) {
    return handleRepositoryError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const identity = await resolveOwnerAndFarmBotId(context);
  if ('response' in identity) return identity.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const submittedCredential = typeof body === 'object'
    && body !== null
    && 'credential' in body
    && typeof body.credential === 'string'
    ? body.credential
    : null;

  if (submittedCredential === null || !submittedCredential.trim()) {
    return json({ success: false, error: 'Credential is required' }, 400);
  }

  const credential = submittedCredential.trim();
  if (credential.length > MAX_CREDENTIAL_LENGTH) {
    return json({ success: false, error: 'Credential is too long' }, 400);
  }

  try {
    const status = await saveFarmBotCredential(
      identity.userId,
      identity.farmbotId,
      credential
    );
    return json({
      success: true,
      data: status,
      message: 'FarmBot credential stored securely; connection not tested',
    });
  } catch (error) {
    return handleRepositoryError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const identity = await resolveOwnerAndFarmBotId(context);
  if ('response' in identity) return identity.response;

  try {
    const status = await clearFarmBotCredential(identity.userId, identity.farmbotId);
    return json({
      success: true,
      data: status,
      message: 'FarmBot credential removed',
    });
  } catch (error) {
    return handleRepositoryError(error);
  }
}
