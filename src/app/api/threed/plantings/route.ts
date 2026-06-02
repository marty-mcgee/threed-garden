// src/app/api/threed/plantings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedPlantings, threedPlants, threedModels, threedBeds } from '@/lib/auth/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/plantings - List plantings with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bedId = searchParams.get('bedId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select({
      planting: {
        id: threedPlantings.id,
        plantingId: threedPlantings.plantingId,
        plantId: threedPlantings.plantId,
        bedId: threedPlantings.bedId,
        quantity: threedPlantings.quantity,
        spacingInches: threedPlantings.spacingInches,
        positionX: threedPlantings.positionX,
        positionY: threedPlantings.positionY,
        positionZ: threedPlantings.positionZ,
        plantedDate: threedPlantings.plantedDate,
        status: threedPlantings.status,
        growthStage: threedPlantings.growthStage,
        health: threedPlantings.health,
        notes: threedPlantings.notes,
        createdAt: threedPlantings.createdAt,
        updatedAt: threedPlantings.updatedAt,
      },
      plant: {
        id: threedPlants.id,
        plantId: threedPlants.plantId,
        commonName: threedPlants.commonName,
        scientificName: threedPlants.scientificName,
        type: threedPlants.type,
        daysToMaturity: threedPlants.daysToMaturity,
        // Standardized model fields only
        modelId: threedPlants.modelId,
      },
      // Join to get model data
      model: {
        id: threedModels.id,
        modelName: threedModels.modelName,
        modelType: threedModels.modelType,
        filePath: threedModels.filePath,
        scale: threedModels.scale,
        rotationY: threedModels.rotationY,
        animations: threedModels.animations,
      },
      bed: {
        id: threedBeds.id,
        name: threedBeds.name,
        shape: threedBeds.shape,
        widthFeet: threedBeds.widthFeet,
        lengthFeet: threedBeds.lengthFeet,
        positionX: threedBeds.positionX,
        positionY: threedBeds.positionY,
        positionZ: threedBeds.positionZ,
        color: threedBeds.color,
      }
    })
    .from(threedPlantings)
    .leftJoin(threedPlants, eq(threedPlantings.plantId, threedPlants.id))
    .leftJoin(threedModels, eq(threedPlants.modelId, threedModels.id))
    .leftJoin(threedBeds, eq(threedPlantings.bedId, threedBeds.id));

    if (bedId) {
      query = query.where(eq(threedPlantings.bedId, parseInt(bedId)));
    }
    if (status) {
      query = query.where(eq(threedPlantings.status, status));
    }

    const plantings = await query
      .orderBy(desc(threedPlantings.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(threedPlantings);
    const total = countResult[0];

    return NextResponse.json({
      success: true,
      data: plantings,
      pagination: {
        limit,
        offset,
        total: total?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching plantings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plantings' },
      { status: 500 }
    );
  }
}

// POST /api/threed/plantings - Create new planting
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate plantingId if not provided
    if (!body.plantingId) {
      const plant = await db
        .select({ plantId: threedPlants.plantId, commonName: threedPlants.commonName })
        .from(threedPlants)
        .where(eq(threedPlants.id, parseInt(body.plantId)))
        .limit(1);
      
      const date = new Date().toISOString().split('T')[0];
      const plantName = plant[0]?.commonName?.toLowerCase().replace(/\s+/g, '-') || 'plant';
      body.plantingId = `${plantName}-${date}-${Date.now()}`;
    }
    
    // 🔧 FIX: Convert date strings to Date objects
    const plantedDate = body.plantedDate ? new Date(body.plantedDate) : null;
    const expectedGerminationDate = body.expectedGerminationDate ? new Date(body.expectedGerminationDate) : null;
    const expectedHarvestDate = body.expectedHarvestDate ? new Date(body.expectedHarvestDate) : null;
    
    const newPlanting = await db.insert(threedPlantings).values({
      plantingId: body.plantingId,
      plantId: body.plantId ? parseInt(body.plantId) : null,
      bedId: body.bedId ? parseInt(body.bedId) : null,
      quantity: body.quantity || 1,
      spacingInches: body.spacingInches ? parseInt(body.spacingInches) : null,
      positionX: body.positionX ? parseFloat(body.positionX) : null,
      positionY: body.positionY ? parseFloat(body.positionY) : null,
      positionZ: body.positionZ ? parseFloat(body.positionZ) : null,
      plantedDate: plantedDate,
      expectedGerminationDate: expectedGerminationDate,
      expectedHarvestDate: expectedHarvestDate,
      status: body.status || 'planted',
      growthStage: body.growthStage || 'seed',
      health: body.health || 'good',
      notes: body.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Fetch the complete planting with plant and bed info
    const completePlanting = await db
      .select({
        planting: threedPlantings,
        plant: threedPlants,
        bed: threedBeds,
      })
      .from(threedPlantings)
      .leftJoin(threedPlants, eq(threedPlantings.plantId, threedPlants.id))
      .leftJoin(threedBeds, eq(threedPlantings.bedId, threedBeds.id))
      .where(eq(threedPlantings.id, newPlanting[0].id))
      .limit(1);
    
    return NextResponse.json({
      success: true,
      data: completePlanting[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/plantings/:id - Update planting
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Planting ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { id: _, createdAt, updatedAt, plantingId, ...updateData } = body;
    
    // 🔧 FIX: Convert date strings to Date objects
    if (updateData.plantedDate) updateData.plantedDate = new Date(updateData.plantedDate);
    if (updateData.expectedGerminationDate) updateData.expectedGerminationDate = new Date(updateData.expectedGerminationDate);
    if (updateData.expectedHarvestDate) updateData.expectedHarvestDate = new Date(updateData.expectedHarvestDate);
    
    // Convert numeric fields
    if (updateData.plantId) updateData.plantId = parseInt(updateData.plantId);
    if (updateData.bedId) updateData.bedId = parseInt(updateData.bedId);
    if (updateData.quantity) updateData.quantity = parseInt(updateData.quantity);
    if (updateData.spacingInches) updateData.spacingInches = parseInt(updateData.spacingInches);
    if (updateData.positionX) updateData.positionX = parseFloat(updateData.positionX);
    if (updateData.positionY) updateData.positionY = parseFloat(updateData.positionY);
    if (updateData.positionZ) updateData.positionZ = parseFloat(updateData.positionZ);
    
    const updated = await db
      .update(threedPlantings)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(threedPlantings.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/plantings/:id - Delete planting
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Planting ID required' },
        { status: 400 }
      );
    }
    
    const deleted = await db
      .delete(threedPlantings)
      .where(eq(threedPlantings.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deleted[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}