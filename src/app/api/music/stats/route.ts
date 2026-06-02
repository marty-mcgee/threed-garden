import { NextRequest, NextResponse } from 'next/server';
import { musicPoller } from '@/lib/services/music/MusicPoller';
import { getSession } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
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