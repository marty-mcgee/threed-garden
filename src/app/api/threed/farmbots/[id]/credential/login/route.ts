import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  FarmBotCredentialKeyConfigurationError,
} from '@/lib/services/threed/farmbot/credential-keyring-core';
import {
  FarmBotCredentialNotFoundError,
  getFarmBotCredentialStatus,
  saveFarmBotCredential,
} from '@/lib/services/threed/farmbot/credential-repository';
import {
  clearFarmBotLoginAttempts,
  consumeFarmBotLoginAttempt,
} from '@/lib/services/threed/farmbot/login-rate-limit';
import {
  FarmBotLoginRejectedError,
  FarmBotTokenServiceUnavailableError,
  MAX_FARMBOT_EMAIL_LENGTH,
  MAX_FARMBOT_PASSWORD_LENGTH,
} from '@/lib/services/threed/farmbot/token-client-core';
import { requestFarmBotToken } from '@/lib/services/threed/farmbot/token-client';
import {
  FarmBotBrokerIdentityMismatchError,
  FarmBotBrokerMetadataError,
} from '@/lib/services/threed/farmbot/broker-metadata-core';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return json({ success: false, error: 'Invalid FarmBot ID' }, 400);
  }
  const farmbotId = Number(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const email = typeof body === 'object' && body !== null && 'email' in body
    && typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body === 'object' && body !== null && 'password' in body
    && typeof body.password === 'string' ? body.password : '';

  if (!email || email.length > MAX_FARMBOT_EMAIL_LENGTH || !password
    || password.length > MAX_FARMBOT_PASSWORD_LENGTH) {
    return json({ success: false, error: 'Valid FarmBot login credentials are required' }, 400);
  }

  try {
    // Resolve ownership before making any external authentication request.
    await getFarmBotCredentialStatus(session.user.id, farmbotId);

    const retryAfter = consumeFarmBotLoginAttempt(session.user.id, farmbotId);
    if (retryAfter !== null) {
      return json(
        { success: false, error: 'Too many FarmBot login attempts; try again later' },
        429,
        { 'Retry-After': String(retryAfter) }
      );
    }

    const token = await requestFarmBotToken(email, password);
    const status = await saveFarmBotCredential(session.user.id, farmbotId, token);
    clearFarmBotLoginAttempts(session.user.id, farmbotId);

    return json({
      success: true,
      data: status,
      message: 'FarmBot credential generated and stored securely; connection not tested',
    });
  } catch (error) {
    if (error instanceof FarmBotCredentialNotFoundError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }
    if (error instanceof FarmBotLoginRejectedError) {
      return json({ success: false, error: 'FarmBot login was not accepted' }, 401);
    }
    if (error instanceof FarmBotTokenServiceUnavailableError) {
      return json({ success: false, error: 'FarmBot login service is unavailable' }, 503);
    }
    if (error instanceof FarmBotBrokerMetadataError) {
      return json({ success: false, error: 'FarmBot returned invalid broker metadata' }, 503);
    }
    if (error instanceof FarmBotBrokerIdentityMismatchError) {
      return json({ success: false, error: 'FarmBot login belongs to a different device' }, 409);
    }
    if (error instanceof FarmBotCredentialKeyConfigurationError) {
      return json({ success: false, error: 'FarmBot credential encryption is not configured' }, 503);
    }

    console.error('FarmBot login credential operation failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot login credential operation failed' }, 500);
  }
}
