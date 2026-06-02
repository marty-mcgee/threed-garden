// src/app/api/threed/farmbots/[id]/water/route.ts
import { NextResponse } from 'next/server';
import { FarmBotPoller } from '@/lib/services/threed/FarmBotPoller';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { durationMs = 60000 } = await request.json();
    
    const poller = new FarmBotPoller();
    const result = await poller.water(durationMs);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Watering for ${durationMs / 1000} seconds`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Water command error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}