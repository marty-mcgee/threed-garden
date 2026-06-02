import { NextRequest, NextResponse } from 'next/server';
import { musicPoller } from '@/lib/services/music/MusicPoller';
// import { auth } from '@/lib/auth/server';
import { minimalAuth as auth } from "@/lib/auth/minimal-server";

export async function GET(request: NextRequest) {
  try {
    // Get session using Better Auth server API
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const detail = searchParams.get('detail');
    
    const stats = await musicPoller.getStats(session.user.id);
    
    if (detail === 'full') {
      const pollingStatus = musicPoller.getPollingStatus();
      return NextResponse.json({
        ...stats,
        pollingStatus,
      });
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}