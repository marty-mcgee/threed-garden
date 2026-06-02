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
    
    // Allow public polling status without auth
    const searchParams = request.nextUrl.searchParams;
    const getStatus = searchParams.get('status') === 'true';
    
    if (getStatus) {
      const status = musicPoller.getPollingStatus();
      return NextResponse.json(status);
    }
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Trigger manual poll
    const result = await musicPoller.poll();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        musicPoller.startPolling();
        return NextResponse.json({ success: true, message: 'Polling started' });
      
      case 'stop':
        musicPoller.stopPolling();
        return NextResponse.json({ success: true, message: 'Polling stopped' });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Poll control error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}