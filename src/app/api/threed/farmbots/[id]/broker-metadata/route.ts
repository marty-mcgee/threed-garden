import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  FarmBotCredentialNotFoundError,
  getFarmBotBrokerMetadataStatus,
} from '@/lib/services/threed/farmbot/credential-repository';

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
    const metadata = await getFarmBotBrokerMetadataStatus(session.user.id, Number(id));
    return json({ success: true, data: metadata });
  } catch (error) {
    if (error instanceof FarmBotCredentialNotFoundError) {
      return json({ success: false, error: 'FarmBot not found' }, 404);
    }

    console.error('FarmBot broker metadata read failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return json({ success: false, error: 'FarmBot broker metadata read failed' }, 500);
  }
}
