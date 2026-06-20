// src/app/api/threed/farmbots/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedFarmbots, threedBeds } from '@/lib/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/farmbots - List farmbots with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status');
  const bedId = searchParams.get('bedId');
  
  try {
    let conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(threedFarmbots.status, status as any));
    }
    
    if (bedId) {
      conditions.push(eq(threedFarmbots.bedId, parseInt(bedId)));
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const farmbots = await db
      .select({
        farmbot: threedFarmbots,
        bed: threedBeds,
      })
      .from(threedFarmbots)
      .leftJoin(threedBeds, eq(threedFarmbots.bedId, threedBeds.id))
      .where(whereClause)
      .orderBy(desc(threedFarmbots.createdAt))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: farmbots,
      count: farmbots.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('FarmBots GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/farmbots - Create new farmbot
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate deviceId if not provided
    if (!body.deviceId) {
      body.deviceId = `farmbot-${Date.now()}`;
    }
    
    const newFarmbot = await db.insert(threedFarmbots).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return NextResponse.json({
      success: true,
      data: newFarmbot[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('FarmBots POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/farmbots/:id - Update farmbot
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'FarmBot ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const updated = await db
      .update(threedFarmbots)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(threedFarmbots.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('FarmBots PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/farmbots/:id - Soft delete farmbot
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'FarmBot ID required' },
        { status: 400 }
      );
    }
    
    const updated = await db
      .update(threedFarmbots)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(threedFarmbots.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('FarmBots DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}