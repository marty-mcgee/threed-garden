import { NextRequest, NextResponse } from 'next/server';
import { musicPoller } from '@/lib/services/music/MusicPoller';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Trigger poll
    const result = await musicPoller.poll();
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron poll error:', error);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}

// To enable cron job, add to your Vercel cron.json or use a scheduler
// This endpoint can be called by a cron job every 5 minutes