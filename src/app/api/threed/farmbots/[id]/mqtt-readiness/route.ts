import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  FarmBotCredentialNotFoundError,
  getFarmBotMqttReadiness,
} from '@/lib/services/threed/farmbot/credential-repository';
import { FarmBotCredentialKeyConfigurationError } from '@/lib/services/threed/farmbot/credential-keyring-core';
import { FarmBotBrokerMetadataError } from '@/lib/services/threed/farmbot/broker-metadata-core';

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
  if (!session?.user?.id) return json({ success: false, error: 'Unauthorized' }, 401);

  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return json({ success: false, error: 'Invalid FarmBot ID' }, 400);
  }

  try {
    const readiness = await getFarmBotMqttReadiness(session.user.id, Number(id));
    return json({
      success: true,
      data: readiness,
      message: readiness.ready
        ? 'FarmBot configuration is ready for a future MQTT worker'
        : 'FarmBot configuration is not ready for MQTT',
    });
  } catch (error) {
    if (error instanceof FarmBotCredentialNotFoundError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }
    if (error instanceof FarmBotCredentialKeyConfigurationError) {
      return json({ success: false, error: 'FarmBot credential encryption is not configured' }, 503);
    }
    if (error instanceof FarmBotBrokerMetadataError) {
      return json({ success: false, error: 'Stored token has invalid broker metadata' }, 500);
    }
    console.error('FarmBot MQTT readiness check failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot MQTT readiness check failed' }, 500);
  }
}
