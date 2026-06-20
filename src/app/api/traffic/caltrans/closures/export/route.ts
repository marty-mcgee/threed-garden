// app/api/caltrans/closures/export/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { laneClosures } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  const status = searchParams.get('status') || 'active';
  
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);
    
    // Build conditions
    const conditions = [eq(laneClosures.status, status)];
    const whereClause = and(...conditions);
    
    // Fetch data
    const data = await db
      .select({
        closureId: laneClosures.closureId,
        district: laneClosures.district,
        route: laneClosures.route,
        direction: laneClosures.direction,
        closureType: laneClosures.closureType,
        lanesAffected: laneClosures.lanesAffected,
        description: laneClosures.description,
        city: laneClosures.city,
        county: laneClosures.county,
        startDate: laneClosures.startDate,
        endDate: laneClosures.endDate,
        status: laneClosures.status,
        createdAt: laneClosures.createdAt,
      })
      .from(laneClosures)
      .where(whereClause)
      .orderBy(laneClosures.endDate);
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = ['closure_id', 'district', 'route', 'direction', 'closure_type', 
                       'lanes_affected', 'description', 'city', 'county', 
                       'start_date', 'end_date', 'status', 'created_at'];
      
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            const stringValue = String(value || '');
            // Escape quotes and wrap in quotes if contains comma
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ];
      
      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=closures_${status}_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }
    
    // Default: JSON format
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      format,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        error: 'Export failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
