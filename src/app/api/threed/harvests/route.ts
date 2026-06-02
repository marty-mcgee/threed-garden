// src/app/api/threed/harvests/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedHarvests, threedPlantings, threedPlants, threedBeds } from '@/lib/auth/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/harvests - List harvests with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const plantingId = searchParams.get('plantingId');
  const plantId = searchParams.get('plantId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  try {
    let conditions = [];
    
    if (plantingId) {
      conditions.push(eq(threedHarvests.plantingId, parseInt(plantingId)));
    }
    
    if (plantId) {
      conditions.push(eq(threedHarvests.plantId, parseInt(plantId)));
    }
    
    if (startDate) {
      conditions.push(sql`${threedHarvests.harvestDate} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${threedHarvests.harvestDate} <= ${endDate}`);
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const harvests = await db
      .select({
        harvest: threedHarvests,
        planting: threedPlantings,
        plant: threedPlants,
        bed: threedBeds,
      })
      .from(threedHarvests)
      .leftJoin(threedPlantings, eq(threedHarvests.plantingId, threedPlantings.id))
      .leftJoin(threedPlants, eq(threedHarvests.plantId, threedPlants.id))
      .leftJoin(threedBeds, eq(threedPlantings.bedId, threedBeds.id))
      .where(whereClause)
      .orderBy(desc(threedHarvests.harvestDate))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedHarvests)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: harvests,
      count: harvests.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Harvests GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/harvests - Create new harvest record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate harvestId if not provided
    if (!body.harvestId) {
      const date = new Date().toISOString().split('T')[0];
      body.harvestId = `harvest-${date}-${Date.now()}`;
    }
    
    const newHarvest = await db.insert(threedHarvests).values({
      ...body,
      harvestDate: body.harvestDate || new Date(),
      createdAt: new Date(),
    }).returning();
    
    // Fetch the complete harvest with related data
    const completeHarvest = await db
      .select({
        harvest: threedHarvests,
        planting: threedPlantings,
        plant: threedPlants,
        bed: threedBeds,
      })
      .from(threedHarvests)
      .leftJoin(threedPlantings, eq(threedHarvests.plantingId, threedPlantings.id))
      .leftJoin(threedPlants, eq(threedHarvests.plantId, threedPlants.id))
      .leftJoin(threedBeds, eq(threedPlantings.bedId, threedBeds.id))
      .where(eq(threedHarvests.id, newHarvest[0].id))
      .limit(1);
    
    return NextResponse.json({
      success: true,
      data: completeHarvest[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Harvests POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/harvests/:id - Update harvest record
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Harvest ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const updated = await db
      .update(threedHarvests)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(threedHarvests.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Harvests PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/harvests/:id - Delete harvest record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Harvest ID required' },
        { status: 400 }
      );
    }
    
    const deleted = await db
      .delete(threedHarvests)
      .where(eq(threedHarvests.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deleted[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Harvests DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}