// src/app/api/threed/farmbots/poll/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'FarmBot synchronization is disabled until the secure device integration is configured',
    },
    { status: 503 }
  );
}
