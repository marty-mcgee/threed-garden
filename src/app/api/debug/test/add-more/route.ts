// app/api/test/add-more/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/schema';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  
  const additionalRecords = [
    {
      sourceId: 'test_historical_1',
      district: 1,
      route: 'US-101',
      direction: 'North',
      closureType: 'Construction',
      lanesAffected: 'Right Lane',
      description: 'Historical test record - US-101 North road work (completed)',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      startTime: '22:00',
      endTime: '06:00',
      status: 'completed',
      rawData: {},
    },
    {
      sourceId: 'test_historical_2',
      district: 3,
      route: 'I-80',
      direction: 'West',
      closureType: 'Accident',
      lanesAffected: 'All Lanes',
      description: 'Historical test record - I-80 West accident (cleared)',
      startDate: '2024-02-10',
      endDate: '2024-02-10',
      startTime: '08:30',
      endTime: '11:00',
      status: 'completed',
      rawData: {},
    },
    {
      sourceId: 'test_upcoming_1',
      district: 7,
      route: 'I-405',
      direction: 'South',
      closureType: 'Planned',
      lanesAffected: '2 Lanes',
      description: 'Upcoming test record - I-405 South planned maintenance',
      startDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      startTime: '23:00',
      endTime: '05:00',
      status: 'active',
      rawData: {},
    },
  ];
  
  try {
    let added = 0;
    for (const record of additionalRecords) {
      const existing = await db
        .select()
        .from(laneClosures)
        .where(eq(laneClosures.sourceId, record.sourceId))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(laneClosures).values(record);
        added++;
      }
    }
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(laneClosures);
    
    return NextResponse.json({
      success: true,
      added_records: added,
      total_records: total[0].count,
      message: `Added ${added} historical/upcoming test records`
    });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
