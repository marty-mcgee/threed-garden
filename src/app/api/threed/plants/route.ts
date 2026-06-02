// src/app/api/threed/plants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedPlants, threedModels } from '@/lib/auth/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

// GET /api/threed/plants - Fetch plants with their associated models
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const includeModel = searchParams.get('includeModel') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: any;

    if (includeModel) {
      // Join with models to get full model data
      query = db.select({
        plant: threedPlants,
        model: {
          id: threedModels.id,
          modelName: threedModels.modelName,
          modelType: threedModels.modelType,
          filePath: threedModels.filePath,
          scale: threedModels.scale,
          rotationY: threedModels.rotationY,
          offsetX: threedModels.offsetX,
          offsetY: threedModels.offsetY,
          offsetZ: threedModels.offsetZ,
          animations: threedModels.animations,
          defaultAnimation: threedModels.defaultAnimation,
          hasExternalFiles: threedModels.hasExternalFiles,
          textureCount: threedModels.textureCount,
          metadata: threedModels.metadata,
        }
      })
      .from(threedPlants)
      .leftJoin(threedModels, eq(threedPlants.modelId, threedModels.id));
    } else {
      query = db.select().from(threedPlants);
    }

    // Apply filters
    if (type) {
      query = query.where(eq(threedPlants.type, type as any));
    }
    if (status) {
      query = query.where(eq(threedPlants.status, status as any));
    }

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(threedPlants);
    const total = countResult[0];

    // Apply pagination
    const plants = await query
      .orderBy(desc(threedPlants.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: plants,
      pagination: {
        limit,
        offset,
        total: total?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plants' },
      { status: 500 }
    );
  }
}

// POST /api/threed/plants - Create a new plant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.plantId || !body.commonName) {
      return NextResponse.json(
        { success: false, error: 'plantId and commonName are required' },
        { status: 400 }
      );
    }
    
    // Create plant - now using modelId instead of embedded model fields
    const [newPlant] = await db.insert(threedPlants).values({
      plantId: body.plantId,
      commonName: body.commonName,
      scientificName: body.scientificName,
      variety: body.variety,
      family: body.family,
      type: body.type,
      status: body.status,
      
      // Foreign key to model (instead of embedded model fields)
      modelId: body.modelId || null,
      
      // Growth parameters
      growthHabit: body.growthHabit,
      daysToMaturity: body.daysToMaturity,
      daysToGermination: body.daysToGermination,
      daysToHarvest: body.daysToHarvest,
      
      // Spacing
      spacingInches: body.spacingInches,
      rowSpacingInches: body.rowSpacingInches,
      plantingDepthInches: body.plantingDepthInches,
      
      // Environmental
      sunlight: body.sunlight,
      waterNeeds: body.waterNeeds,
      soilType: body.soilType,
      soilPH: body.soilPH,
      hardinessZone: body.hardinessZone,
      frostTolerant: body.frostTolerant,
      perennial: body.perennial,
      
      // Media
      imageUrl: body.imageUrl,
      thumbnailUrl: body.thumbnailUrl,
      description: body.description,
      careInstructions: body.careInstructions,
      harvestInstructions: body.harvestInstructions,
      
      // Companion planting
      companionPlants: body.companionPlants,
      avoidPlants: body.avoidPlants,
      
      // Metadata
      source: body.source,
      rawData: body.rawData,
    }).returning();
    
    // Update model usage tracking if a model was assigned
    if (body.modelId) {
      await db.update(threedModels)
        .set({ usedByPlants: true })
        .where(eq(threedModels.id, body.modelId));
    }
    
    return NextResponse.json({ success: true, data: newPlant });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plant' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/plants - Update a plant
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plant ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Get old model ID to update usage tracking
    const [oldPlant] = await db.select({ modelId: threedPlants.modelId })
      .from(threedPlants)
      .where(eq(threedPlants.id, parseInt(id)));
    
    const [updated] = await db.update(threedPlants)
      .set({
        commonName: body.commonName,
        scientificName: body.scientificName,
        variety: body.variety,
        family: body.family,
        type: body.type,
        status: body.status,
        
        // Foreign key to model
        modelId: body.modelId || null,
        
        // Growth parameters
        growthHabit: body.growthHabit,
        daysToMaturity: body.daysToMaturity,
        daysToGermination: body.daysToGermination,
        daysToHarvest: body.daysToHarvest,
        
        // Spacing
        spacingInches: body.spacingInches,
        rowSpacingInches: body.rowSpacingInches,
        plantingDepthInches: body.plantingDepthInches,
        
        // Environmental
        sunlight: body.sunlight,
        waterNeeds: body.waterNeeds,
        soilType: body.soilType,
        soilPH: body.soilPH,
        hardinessZone: body.hardinessZone,
        frostTolerant: body.frostTolerant,
        perennial: body.perennial,
        
        // Media
        imageUrl: body.imageUrl,
        thumbnailUrl: body.thumbnailUrl,
        description: body.description,
        careInstructions: body.careInstructions,
        harvestInstructions: body.harvestInstructions,
        
        // Companion planting
        companionPlants: body.companionPlants,
        avoidPlants: body.avoidPlants,
        
        updatedAt: new Date(),
      })
      .where(eq(threedPlants.id, parseInt(id)))
      .returning();
    
    // Update model usage tracking
    if (oldPlant?.modelId !== body.modelId) {
      // Check if old model is still used by any plants
      if (oldPlant?.modelId) {
        const otherPlants = await db.select({ count: sql<number>`count(*)` })
          .from(threedPlants)
          .where(eq(threedPlants.modelId, oldPlant.modelId));
        
        if (otherPlants[0]?.count === 0) {
          await db.update(threedModels)
            .set({ usedByPlants: false })
            .where(eq(threedModels.id, oldPlant.modelId));
        }
      }
      
      // Mark new model as used
      if (body.modelId) {
        await db.update(threedModels)
          .set({ usedByPlants: true })
          .where(eq(threedModels.id, body.modelId));
      }
    }
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating plant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plant' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/plants - Delete a plant
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plant ID is required' },
        { status: 400 }
      );
    }
    
    // Get model ID before deleting
    const [plant] = await db.select({ modelId: threedPlants.modelId })
      .from(threedPlants)
      .where(eq(threedPlants.id, parseInt(id)));
    
    await db.delete(threedPlants)
      .where(eq(threedPlants.id, parseInt(id)));
    
    // Update model usage if this was the last plant using it
    if (plant?.modelId) {
      const otherPlants = await db.select({ count: sql<number>`count(*)` })
        .from(threedPlants)
        .where(eq(threedPlants.modelId, plant.modelId));
      
      if (otherPlants[0]?.count === 0) {
        // Also check if any characters use this model
        // You'll add character check after implementing characters
        await db.update(threedModels)
          .set({ usedByPlants: false })
          .where(eq(threedModels.id, plant.modelId));
      }
    }
    
    return NextResponse.json({ success: true, message: 'Plant deleted successfully' });
  } catch (error) {
    console.error('Error deleting plant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete plant' },
      { status: 500 }
    );
  }
}