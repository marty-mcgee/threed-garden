// src/app/api/threed/farmbots/commands/route.ts
import { NextResponse } from 'next/server';
import { FarmBotPoller } from '@/lib/services/threed/FarmBotPoller';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command, args } = body;
    
    if (!command) {
      return NextResponse.json(
        { success: false, error: 'Command is required' },
        { status: 400 }
      );
    }
    
    const poller = new FarmBotPoller();
    const result = await poller.sendCommand(command, args || {});
    
    // Log the command
    console.log(`🤖 Command executed: ${command}`, args);
    
    return NextResponse.json({
      success: true,
      data: result,
      command: command,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Command error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}