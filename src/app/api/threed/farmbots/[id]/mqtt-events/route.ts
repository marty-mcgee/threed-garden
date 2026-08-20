import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  FARMBOT_MQTT_EVENT_SOURCES,
  FARMBOT_MQTT_EVENT_TYPES,
} from '@/lib/services/threed/farmbot/mqtt-persistence-core';
import {
  deleteOwnedFarmBotMqttEvents,
  FarmBotMqttPersistenceScopeError,
  listOwnedFarmBotMqttEvents,
} from '@/lib/services/threed/farmbot/mqtt-persistence-repository';

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

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return json({ success: false, error: 'Unauthorized' }, 401);
  const { id } = await context.params;
  const farmbotId = parseId(id);
  if (!farmbotId) return json({ success: false, error: 'Invalid FarmBot ID' }, 400);

  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get('limit') ?? 50);
  const beforeIdValue = searchParams.get('beforeId');
  const beforeId = beforeIdValue && /^[1-9]\d*$/.test(beforeIdValue)
    ? Number(beforeIdValue)
    : null;
  const source = searchParams.get('source');
  const eventType = searchParams.get('eventType');
  if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100
    || (beforeIdValue !== null && !beforeId)
    || (source !== null && !FARMBOT_MQTT_EVENT_SOURCES.includes(
      source as typeof FARMBOT_MQTT_EVENT_SOURCES[number]
    ))
    || (eventType !== null && !FARMBOT_MQTT_EVENT_TYPES.includes(
      eventType as typeof FARMBOT_MQTT_EVENT_TYPES[number]
    ))) {
    return json({ success: false, error: 'Invalid query parameters' }, 400);
  }

  try {
    const result = await listOwnedFarmBotMqttEvents({
      userId: session.user.id,
      farmbotId,
      limit: parsedLimit,
      beforeId,
      source,
      eventType,
    });
    return json({ success: true, ...result });
  } catch (error) {
    if (error instanceof FarmBotMqttPersistenceScopeError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }
    console.error('FarmBot MQTT event history read failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot MQTT event history read failed' }, 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return json({ success: false, error: 'Unauthorized' }, 401);
  const { id } = await context.params;
  const farmbotId = parseId(id);
  if (!farmbotId) return json({ success: false, error: 'Invalid FarmBot ID' }, 400);

  const { searchParams } = new URL(request.url);
  const deleteAll = searchParams.get('all') === 'true';
  const beforeValue = searchParams.get('before');
  const before = beforeValue ? new Date(beforeValue) : null;
  if ((!deleteAll && !beforeValue) || (before && Number.isNaN(before.valueOf()))) {
    return json({ success: false, error: 'Specify all=true or a valid before timestamp' }, 400);
  }

  try {
    const deleted = await deleteOwnedFarmBotMqttEvents({
      userId: session.user.id,
      farmbotId,
      before: deleteAll ? null : before,
    });
    return json({ success: true, data: { deleted } });
  } catch (error) {
    if (error instanceof FarmBotMqttPersistenceScopeError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }
    console.error('FarmBot MQTT event history deletion failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot MQTT event history deletion failed' }, 500);
  }
}
