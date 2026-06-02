// app/api/test/populate/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  
  try {
    // Check record count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(laneClosures);
    
    const recordCount = Number(countResult[0]?.count || 0);
    
    // If no records, add test records
    if (recordCount === 0) {
      const testClosures = [
        {
          sourceId: 'test_1',
          district: 7,
          route: 'I-405',
          direction: 'South',
          closureType: 'Construction',
          lanesAffected: 'Right Lane',
          description: 'Test closure for debugging - I-405 South near LAX',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          startTime: '22:00',
          endTime: '05:00',
          status: 'active' as const,
          rawData: {},
        },
        {
          sourceId: 'test_2',
          district: 4,
          route: 'I-80',
          direction: 'East',
          closureType: 'Accident',
          lanesAffected: 'Left 2 Lanes',
          description: 'Test closure for debugging - I-80 East near Bay Bridge',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
          startTime: '15:30',
          endTime: '20:00',
          status: 'active' as const,
          rawData: {},
        },
        {
          sourceId: 'test_3',
          district: 3,
          route: 'US-50',
          direction: 'West',
          closureType: 'Road Work',
          lanesAffected: 'Center Lane',
          description: 'Test closure for debugging - US-50 West near Sacramento',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          startTime: '20:00',
          endTime: '06:00',
          status: 'active' as const,
          rawData: {},
        },
      ];
      
      for (const closure of testClosures) {
        await db.insert(laneClosures).values(closure);
      }
      
      const newCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(laneClosures);
      
      return NextResponse.json({
        success: true,
        message: `No data found. Added ${testClosures.length} test record(s). Run the poller to get real Caltrans data.`,
        records_added: testClosures.length,
        total_records: Number(newCount[0]?.count || 0)
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Data already exists in database',
      record_count: recordCount,
      note: recordCount > 0 ? 'Run /api/caltrans/poll?action=poll to fetch fresh data from Caltrans' : null
    });
    
  } catch (error) {
    console.error('Populate error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to populate test data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
