// src/app/api/bay-area-511/poll/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { BayArea511Poller } from '@/lib/services/traffic/BayArea511Poller';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'poll';
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 500;
  
  const poller = new BayArea511Poller();
  
  try {
    switch (action) {
      case 'poll':
        console.log(`Starting Bay Area 511 poll with limit: ${limit}`);
        const result = await poller.pollAll({ limit });
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Bay Area 511 poll completed' : 'Poll failed',
          stats: result.stats,
          timestamp: new Date().toISOString()
        });
        
      case 'stats':
        // Use raw SQL to avoid Drizzle ORM issues
        const totalResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM bay_area_traffic_events
        `);
        
        const activeResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM bay_area_traffic_events WHERE status = 'active'
        `);
        
        const withCoordsResult = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM bay_area_traffic_events 
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `);
        
        const byTypeResult = await db.execute(sql`
          SELECT event_type, COUNT(*) as count 
          FROM bay_area_traffic_events 
          WHERE status = 'active'
          GROUP BY event_type 
          ORDER BY count DESC 
          LIMIT 10
        `);
        
        return NextResponse.json({
          success: true,
          data: {
            total: parseInt(totalResult.rows[0]?.count || '0'),
            active: parseInt(activeResult.rows[0]?.count || '0'),
            withCoordinates: parseInt(withCoordsResult.rows[0]?.count || '0'),
            byType: byTypeResult.rows,
          },
          isPolling: poller.isPollingActive(),
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action. Use "poll" or "stats"' }, { status: 400 });
    }
  } catch (error) {
    console.error('Bay Area 511 API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}