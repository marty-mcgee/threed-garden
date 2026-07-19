// app/api/project/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectAssets } from '@/lib/schema/project';
import { eq, and, desc, sql, inArray, or } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/project/assets
// Query Parameters:
//   - projectId (required): The project ID
//   - type (optional): Filter by asset type (e.g., 'music_albums')
//   - limit (optional): Number of records to return (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
//   - includeDetails (optional): Include full asset details (default: false)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);

    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { limit, offset, total: 0 },
      });
    }

    // Build base query
    let query = db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true)
        )
      );

    // Filter by asset type if provided
    if (assetType) {
      query = query.where(eq(projectAssets.assetType, assetType as any));
    }

    // Get total count
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true)
        )
      );

    if (assetType) {
      countQuery = countQuery.where(eq(projectAssets.assetType, assetType as any));
    }

    const [countResult] = await countQuery;

    // Get paginated assets
    const assets = await query
      .orderBy(desc(projectAssets.createdAt))
      .limit(limit)
      .offset(offset);

    // If includeDetails is true, fetch the actual data from the respective tables
    let assetsWithDetails = assets;
    if (includeDetails && assets.length > 0) {
      assetsWithDetails = await enrichAssetsWithDetails(assets, userId);
    }

    return NextResponse.json({
      success: true,
      data: assetsWithDetails,
      pagination: {
        limit,
        offset,
        total: countResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching project assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/project/assets - Add an asset to a project
// Body: { projectId, assetType, assetId, config? }
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, assetType, assetId, config } = body;

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: projectId, assetType, assetId' 
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);
    const parsedAssetId = parseInt(assetId);

    if (isNaN(parsedProjectId) || isNaN(parsedAssetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID or asset ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify the asset exists and belongs to the user
    const assetExists = await verifyAssetOwnership(assetType, parsedAssetId, userId);
    if (!assetExists) {
      return NextResponse.json(
        { success: false, error: 'Asset not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check if already exists
    const [existing] = await db
      .select()
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parsedAssetId),
          eq(projectAssets.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Asset already added to this project' },
        { status: 409 }
      );
    }

    await ensureTableSequence('project_assets');

    const [newAsset] = await db
      .insert(projectAssets)
      .values({
        userId,
        projectId: parsedProjectId,
        assetType: assetType as any,
        assetId: parsedAssetId,
        config: config || {},
        isActive: true,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: newAsset,
      message: 'Asset added to project successfully'
    });
  } catch (error) {
    console.error('Error adding asset to project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add asset to project' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project/assets - Remove an asset from a project
// Query Parameters: projectId, type, assetId
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('type');
    const assetId = searchParams.get('assetId');

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: projectId, type, assetId' 
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);
    const parsedAssetId = parseInt(assetId);

    if (isNaN(parsedProjectId) || isNaN(parsedAssetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID or asset ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false
    const [deleted] = await db
      .update(projectAssets)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parsedAssetId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Asset not found in this project' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: deleted,
      message: 'Asset removed from project successfully'
    });
  } catch (error) {
    console.error('Error removing asset from project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove asset from project' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/project/assets - Update asset config
// Query Parameters: projectId, type, assetId
// Body: { config: {...} }
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('type');
    const assetId = searchParams.get('assetId');
    const body = await request.json();
    const { config } = body;

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: projectId, type, assetId' 
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedProjectId = parseInt(projectId);
    const parsedAssetId = parseInt(assetId);

    if (isNaN(parsedProjectId) || isNaN(parsedAssetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID or asset ID' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [proj] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!proj) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(projectAssets)
      .set({
        config: config || {},
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.assetType, assetType as any),
          eq(projectAssets.assetId, parsedAssetId),
          eq(projectAssets.userId, userId),
          eq(projectAssets.isActive, true)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Asset not found in this project' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: updated,
      message: 'Asset configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating asset config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update asset config' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

async function verifyAssetOwnership(
  assetType: string,
  assetId: number,
  userId: string
): Promise<boolean> {
  try {
    // Import schemas dynamically based on asset type
    const schemas = await import('@/lib/schema');
    
    let table;
    let idField;
    
    // Map asset type to schema table
    switch (assetType) {
      // Music Module
      case 'music_albums':
        table = schemas.musicAlbums;
        idField = 'id';
        break;
      case 'music_tracks':
        table = schemas.musicTracks;
        idField = 'id';
        break;
      case 'music_links':
        table = schemas.musicLinks;
        idField = 'id';
        break;
      case 'music_media':
        table = schemas.musicMedia;
        idField = 'id';
        break;
      
      // ThreeD Module
      case 'threed_plants':
        table = schemas.threedPlants;
        idField = 'id';
        break;
      case 'threed_beds':
        table = schemas.threedBeds;
        idField = 'id';
        break;
      case 'threed_layers':
        table = schemas.threedLayers;
        idField = 'id';
        break;
      case 'threed_markers':
        table = schemas.threedMarkers;
        idField = 'id';
        break;
      case 'threed_models':
        table = schemas.threedModels;
        idField = 'id';
        break;
      case 'threed_characters':
        table = schemas.threedCharacters;
        idField = 'id';
        break;
      case 'threed_tasks':
        table = schemas.threedTasks;
        idField = 'id';
        break;
      case 'threed_harvests':
        table = schemas.threedHarvests;
        idField = 'id';
        break;
      case 'threed_weather_logs':
        table = schemas.threedWeatherLogs;
        idField = 'id';
        break;
      case 'threed_farmbots':
        table = schemas.threedFarmbots;
        idField = 'id';
        break;
      case 'threed_watering_schedules':
        table = schemas.threedWateringSchedules;
        idField = 'id';
        break;
      
      // Traffic Module
      case 'traffic_chp_cad_incidents':
        table = schemas.trafficChpCadIncidents;
        idField = 'id';
        break;
      case 'traffic_chp_cases':
        table = schemas.trafficChpCases;
        idField = 'id';
        break;
      case 'traffic_caltrans_lane_closures':
        table = schemas.trafficCaltransLaneClosures;
        idField = 'id';
        break;
      case 'traffic_caltrans_cctv_cameras':
        table = schemas.trafficCaltransCctvCameras;
        idField = 'id';
        break;
      case 'traffic_bay_area_511_events':
        table = schemas.trafficBayArea511Events;
        idField = 'id';
        break;
      case 'traffic_calfire_incidents':
        table = schemas.trafficCalfireIncidents;
        idField = 'id';
        break;
      
      default:
        console.error(`Unknown asset type: ${assetType}`);
        return false;
    }

    if (!table) {
      console.error(`Table not found for asset type: ${assetType}`);
      return false;
    }

    // Check if asset exists and belongs to user
    const [result] = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.userId, userId),
          eq(table[idField], assetId)
        )
      )
      .limit(1);

    return !!result;
  } catch (error) {
    console.error(`Error verifying asset ownership for ${assetType}:`, error);
    return false;
  }
}

async function enrichAssetsWithDetails(assets: any[], userId: string) {
  try {
    // Group assets by type
    const groupedAssets: Record<string, number[]> = {};
    assets.forEach(asset => {
      if (!groupedAssets[asset.assetType]) {
        groupedAssets[asset.assetType] = [];
      }
      groupedAssets[asset.assetType].push(asset.assetId);
    });

    // Fetch details for each type
    const detailsMap: Record<string, Record<number, any>> = {};
    
    for (const [assetType, ids] of Object.entries(groupedAssets)) {
      if (ids.length === 0) continue;
      
      const details = await fetchAssetDetails(assetType, ids, userId);
      detailsMap[assetType] = details;
    }

    // Enrich assets with details
    return assets.map(asset => ({
      ...asset,
      details: detailsMap[asset.assetType]?.[asset.assetId] || null
    }));
  } catch (error) {
    console.error('Error enriching assets with details:', error);
    return assets;
  }
}

async function fetchAssetDetails(
  assetType: string,
  ids: number[],
  userId: string
): Promise<Record<number, any>> {
  try {
    const schemas = await import('@/lib/schema');
    
    let table;
    let idField = 'id';
    
    // Map asset type to schema table (same as above)
    switch (assetType) {
      case 'music_albums': table = schemas.musicAlbums; break;
      case 'music_tracks': table = schemas.musicTracks; break;
      case 'music_links': table = schemas.musicLinks; break;
      case 'music_media': table = schemas.musicMedia; break;
      case 'threed_plants': table = schemas.threedPlants; break;
      case 'threed_beds': table = schemas.threedBeds; break;
      case 'threed_layers': table = schemas.threedLayers; break;
      case 'threed_markers': table = schemas.threedMarkers; break;
      case 'threed_models': table = schemas.threedModels; break;
      case 'threed_characters': table = schemas.threedCharacters; break;
      case 'threed_tasks': table = schemas.threedTasks; break;
      case 'threed_harvests': table = schemas.threedHarvests; break;
      case 'threed_weather_logs': table = schemas.threedWeatherLogs; break;
      case 'threed_farmbots': table = schemas.threedFarmbots; break;
      case 'threed_watering_schedules': table = schemas.threedWateringSchedules; break;
      case 'traffic_chp_cad_incidents': table = schemas.trafficChpCadIncidents; break;
      case 'traffic_chp_cases': table = schemas.trafficChpCases; break;
      case 'traffic_caltrans_lane_closures': table = schemas.trafficCaltransLaneClosures; break;
      case 'traffic_caltrans_cctv_cameras': table = schemas.trafficCaltransCctvCameras; break;
      case 'traffic_bay_area_511_events': table = schemas.trafficBayArea511Events; break;
      case 'traffic_calfire_incidents': table = schemas.trafficCalfireIncidents; break;
      default: return {};
    }

    if (!table) return {};

    // Fetch all records with these IDs that belong to the user
    const results = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.userId, userId),
          inArray(table[idField], ids)
        )
      );

    // Map by ID
    const mappedResults: Record<number, any> = {};
    results.forEach(result => {
      mappedResults[result[idField]] = result;
    });

    return mappedResults;
  } catch (error) {
    console.error(`Error fetching details for ${assetType}:`, error);
    return {};
  }
}