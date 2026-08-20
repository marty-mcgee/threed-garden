import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readFarmBotBrokerMetadata } from '@/lib/services/threed/farmbot/broker-metadata-core';
import {
  FarmBotCredentialNotConfiguredError,
  FarmBotCredentialNotFoundError,
  getFarmBotMqttReadiness,
  loadFarmBotCredential,
} from '@/lib/services/threed/farmbot/credential-repository';
import { FarmBotCredentialKeyConfigurationError } from '@/lib/services/threed/farmbot/credential-keyring-core';
import {
  connectFarmBotWorkerSession,
  disconnectFarmBotWorkerSession,
  getFarmBotWorkerSession,
} from '@/lib/services/threed/mqtt/integrations/farmbot/worker-client';
import {
  MqttWorkerConfigurationError,
  MqttWorkerUnavailableError,
} from '@/lib/services/threed/mqtt/worker/client';

export const dynamic = 'force-dynamic';
type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function parseId(id: string): number | null {
  return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : null;
}

async function ownedReadyFarmBot(userId: string, farmbotId: number) {
  const readiness = await getFarmBotMqttReadiness(userId, farmbotId);
  if (!readiness.ready || readiness.farmbotDeviceId === null
    || readiness.brokerDeviceId === null) {
    return { readiness, ready: false as const };
  }
  return { readiness, ready: true as const };
}

function routeError(error: unknown) {
  if (error instanceof FarmBotCredentialNotFoundError) {
    return json({ success: false, error: 'FarmBot not found' }, 404);
  }
  if (error instanceof FarmBotCredentialNotConfiguredError) {
    return json({ success: false, error: 'FarmBot credential is not configured' }, 409);
  }
  if (error instanceof FarmBotCredentialKeyConfigurationError
    || error instanceof MqttWorkerConfigurationError) {
    return json({ success: false, error: 'FarmBot MQTT worker is not configured' }, 503);
  }
  if (error instanceof MqttWorkerUnavailableError) {
    return json({ success: false, error: 'FarmBot MQTT worker is unavailable' }, 503);
  }
  console.error('FarmBot MQTT session request failed', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  });
  return json({ success: false, error: 'FarmBot MQTT session request failed' }, 500);
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return json({ success: false, error: 'Unauthorized' }, 401);
  const { id } = await context.params;
  const farmbotId = parseId(id);
  if (!farmbotId) return json({ success: false, error: 'Invalid FarmBot ID' }, 400);

  try {
    const scoped = await ownedReadyFarmBot(session.user.id, farmbotId);
    if (!scoped.ready) {
      return json({
        success: false,
        error: 'FarmBot is not ready for MQTT',
        issues: scoped.readiness.issues,
      }, 409);
    }
    const credential = await loadFarmBotCredential(session.user.id, farmbotId);
    const metadata = readFarmBotBrokerMetadata(credential);
    const grantIssuedAt = new Date();
    const grantExpiresAt = new Date(Math.min(
      grantIssuedAt.getTime() + 2 * 60_000,
      metadata.tokenExpiresAt.getTime()
    ));
    if (grantExpiresAt <= grantIssuedAt) {
      return json({ success: false, error: 'FarmBot token has expired' }, 409);
    }
    const result = await connectFarmBotWorkerSession(farmbotId, {
      version: 1,
      farmbotId,
      ownerId: session.user.id,
      farmbotDeviceId: scoped.readiness.farmbotDeviceId,
      brokerDeviceId: scoped.readiness.brokerDeviceId,
      mqttHost: metadata.mqttHost,
      mqttWsUrl: metadata.mqttWsUrl,
      vhost: metadata.vhost,
      tokenIssuedAt: metadata.tokenIssuedAt.toISOString(),
      tokenExpiresAt: metadata.tokenExpiresAt.toISOString(),
      grantIssuedAt: grantIssuedAt.toISOString(),
      grantExpiresAt: grantExpiresAt.toISOString(),
      credential,
    });
    return json(result, 202);
  } catch (error) {
    return routeError(error);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return json({ success: false, error: 'Unauthorized' }, 401);
  const { id } = await context.params;
  const farmbotId = parseId(id);
  if (!farmbotId) return json({ success: false, error: 'Invalid FarmBot ID' }, 400);
  try {
    const scoped = await ownedReadyFarmBot(session.user.id, farmbotId);
    if (!scoped.ready) return json({ success: false, error: 'FarmBot is not ready for MQTT' }, 409);
    return json(await getFarmBotWorkerSession(farmbotId));
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return json({ success: false, error: 'Unauthorized' }, 401);
  const { id } = await context.params;
  const farmbotId = parseId(id);
  if (!farmbotId) return json({ success: false, error: 'Invalid FarmBot ID' }, 400);
  try {
    await getFarmBotMqttReadiness(session.user.id, farmbotId);
    return json(await disconnectFarmBotWorkerSession(farmbotId));
  } catch (error) {
    return routeError(error);
  }
}
