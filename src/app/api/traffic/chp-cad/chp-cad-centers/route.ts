// src/app/api/chp-cad-centers/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { chpCadCenters } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    const conditions = [eq(chpCadCenters.isActive, true)];
    const whereClause = and(...conditions);
    
    const centers = await db
      .select()
      .from(chpCadCenters)
      .where(whereClause)
      .orderBy(chpCadCenters.centerName);
    
    return NextResponse.json({
      success: true,
      data: centers,
      count: centers.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching centers:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}