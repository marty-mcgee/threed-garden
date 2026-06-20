// app/api/caltrans/closures/update-coordinates/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

// Handle POST requests
export async function POST(request: Request) {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  try {
    const body = await request.json();
    const { closure_id, latitude, longitude } = body;
    
    if (!closure_id) {
      return NextResponse.json(
        { error: 'closure_id is required' },
        { status: 400 }
      );
    }
    
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      UPDATE lane_closures 
      SET latitude = ${latitude}, 
          longitude = ${longitude}
      WHERE closure_id = ${closure_id}
      RETURNING closure_id, route, latitude, longitude
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: `Closure with ID ${closure_id} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated closure ${closure_id} with coordinates`,
      closure: result[0]
    });
    
  } catch (error) {
    console.error('Update coordinates error:', error);
    return NextResponse.json(
      { error: 'Failed to update coordinates', details: String(error) },
      { status: 500 }
    );
  }
}

// Also handle GET to list closures without coordinates
export async function GET(request: Request) {
  const connectionString = process.env.DATABASE_URL!;
  const sql = neon(connectionString);
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'missing') {
      // Get closures that need coordinates
      const missingCoordinates = await sql`
        SELECT closure_id, route, district, closure_type, description
        FROM lane_closures 
        WHERE (latitude IS NULL OR longitude IS NULL)
          AND status = 'active'
        LIMIT 50
      `;
      
      return NextResponse.json({
        success: true,
        count: missingCoordinates.length,
        closures: missingCoordinates
      });
    }
    
    // Default: get all closures with coordinates for the map
    const withCoordinates = await sql`
      SELECT closure_id, route, district, closure_type, description, 
             latitude, longitude, end_date
      FROM lane_closures 
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND status = 'active'
    `;
    
    return NextResponse.json({
      success: true,
      count: withCoordinates.length,
      closures: withCoordinates
    });
    
  } catch (error) {
    console.error('Get coordinates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch closures', details: String(error) },
      { status: 500 }
    );
  }
}
