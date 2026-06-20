// src/app/api/chp-historical/collisions/stats/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { chpCollisions } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chpCollisions);
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCollisions: Number(total[0]?.count || 0),
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Collisions stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: String(error) },
      { status: 500 }
    );
  }
}