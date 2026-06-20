// src/app/api/threed/beds/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedBeds } from '@/lib/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const showAll = searchParams.get('showAll') === 'true';
  
  try {
    let conditions = [];
    
    if (!showAll) {
      conditions.push(eq(threedBeds.isActive, true));
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const beds = await db
      .select()
      .from(threedBeds)
      .where(whereClause)
      .orderBy(desc(threedBeds.createdAt))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedBeds)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: beds,
      count: beds.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate bedId if not provided
    if (!body.bedId) {
      body.bedId = body.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Calculate square feet if dimensions provided
    const widthFeet = body.widthFeet ? parseFloat(body.widthFeet) : null;
    const lengthFeet = body.lengthFeet ? parseFloat(body.lengthFeet) : null;
    const squareFeet = (widthFeet && lengthFeet) ? widthFeet * lengthFeet : null;
    
    const newBed = await db.insert(threedBeds).values({
      ...body,
      widthFeet,
      lengthFeet,
      squareFeet,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return NextResponse.json({
      success: true,
      data: newBed[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bed ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { id: _, createdAt, updatedAt, ...updateData } = body;
    
    // Recalculate square feet if dimensions changed
    const widthFeet = updateData.widthFeet ? parseFloat(updateData.widthFeet) : undefined;
    const lengthFeet = updateData.lengthFeet ? parseFloat(updateData.lengthFeet) : undefined;
    if (widthFeet && lengthFeet) {
      updateData.squareFeet = widthFeet * lengthFeet;
    }
    
    const updated = await db
      .update(threedBeds)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(threedBeds.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bed ID required' },
        { status: 400 }
      );
    }
    
    const deleted = await db
      .delete(threedBeds)
      .where(eq(threedBeds.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deleted[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}