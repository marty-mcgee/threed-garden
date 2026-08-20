import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  FarmBotMqttPersistenceScopeError,
  getOwnedFarmBotMqttRuntime,
  getProjectAssignedFarmBotMqttRuntime,
} from '@/lib/services/threed/farmbot/mqtt-persistence-repository';

export const dynamic = 'force-dynamic';
type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return json({ success: false, error: 'Unauthorized' }, 401);
  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return json({ success: false, error: 'Invalid FarmBot ID' }, 400);
  }

  try {
    const projectIdValue = new URL(request.url).searchParams.get('projectId');
    if (projectIdValue !== null && !/^[1-9]\d*$/.test(projectIdValue)) {
      return json({ success: false, error: 'Invalid Project ID' }, 400);
    }

    const runtime = projectIdValue
      ? await getProjectAssignedFarmBotMqttRuntime({
          userId: session.user.id,
          projectId: Number(projectIdValue),
          farmbotId: Number(id),
        })
      : await getOwnedFarmBotMqttRuntime(session.user.id, Number(id));

    if (projectIdValue && runtime) {
      return json({
        success: true,
        data: {
          connectionState: runtime.connectionState,
          stateChangedAt: runtime.stateChangedAt,
          lastMessageAt: runtime.lastMessageAt,
          lastStatusAt: runtime.lastStatusAt,
          positionX: runtime.positionX,
          positionY: runtime.positionY,
          positionZ: runtime.positionZ,
          tokenExpiresAt: runtime.tokenExpiresAt,
          isStale: runtime.isStale,
        },
      });
    }
    return json({ success: true, data: runtime });
  } catch (error) {
    if (error instanceof FarmBotMqttPersistenceScopeError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }
    console.error('FarmBot MQTT runtime read failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot MQTT runtime read failed' }, 500);
  }
}
