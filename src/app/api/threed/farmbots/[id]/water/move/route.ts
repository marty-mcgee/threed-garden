// src/app/api/threed/farmbots/[id]/move/route.ts
import { NextResponse } from 'next/server';
import { FarmBotPoller } from '@/lib/services/threed/FarmBotPoller';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { x, y, z, relative = false } = await request.json();
    
    if (x === undefined || y === undefined) {
      return NextResponse.json(
        { success: false, error: 'x and y coordinates are required' },
        { status: 400 }
      );
    }
    
    const poller = new FarmBotPoller();
    let result;
    
    if (relative) {
      result = await poller.moveRelative(x, y, z || 0);
    } else {
      result = await poller.moveAbsolute(x, y, z || 0);
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Moved to ${relative ? 'relative' : 'absolute'} position (${x}, ${y}, ${z || 0})`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Move command error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}