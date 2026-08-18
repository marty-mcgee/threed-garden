// app/api/traffic/caltrans/closures/[id]/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { trafficCaltransLaneClosures } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // ✅ id comes as string from URL
) {
  const connectionString = process.env.DATABASE_URL!;
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);
  
  try {
    // Step 1: Await the params Promise
    const { id } = await params;  // id is a string, e.g., "123"
    
    // Step 2: Convert string to number for database query
    const recordId = parseInt(id, 10);
    
    if (isNaN(recordId)) {
      return NextResponse.json(
        { error: `Invalid closure ID: "${id}" is not a number` },
        { status: 400 }
      );
    }
    
    // Step 3: Query the numeric primary key from the route segment
    const closures = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(eq(trafficCaltransLaneClosures.id, recordId));
    
    if (closures.length === 0) {
      return NextResponse.json(
        { error: `Closure with ID ${recordId} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      closure: closures[0],
    });
    
  } catch (error) {
    console.error('Closure fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch closure details' },
      { status: 500 }
    );
  }
}
