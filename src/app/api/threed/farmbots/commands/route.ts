// src/app/api/threed/farmbots/commands/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
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
      error: 'FarmBot commands are disabled until the secure device integration is configured',
    },
    { status: 503 }
  );
}
