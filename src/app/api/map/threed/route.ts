// app/api/map/threed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedPlants,
  threedBeds,
  threedCharacters,
  threedMarkers,
  threedLayers,
  threedFarmbots,
  threedPlantings,
  threedTasks,
} from '@/lib/schema/threed';
import { project, projectAssets, projectThreed } from '@/lib/schema/project';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

// ============================================
// GET /api/map/threed - Get ThreeD data for project map
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    // ✅ Validate projectId
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid projectId' },
        { status: 400 }
      );
    }

    // ✅ Verify project exists and user has access
    const [projectData] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parsedProjectId),
          userId ? eq(project.userId, userId) : eq(project.isPublic, true)
        )
      )
      .limit(1);

    if (!projectData) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ Get ThreeD module IDs for this project
    const projectThreeDModules = await db
      .select({ threedId: projectThreed.threedId })
      .from(projectThreed)
      .where(
        and(
          eq(projectThreed.projectId, parsedProjectId),
          userId ? eq(projectThreed.userId, userId) : sql`1=1`
        )
      );

    const threeDModuleIds = projectThreeDModules.map(m => m.threedId);

    if (threeDModuleIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          plantsCount: 0,
          bedsCount: 0,
          charactersCount: 0,
          markersCount: 0,
          layersCount: 0,
          farmbotsCount: 0,
          plantingsCount: 0,
          tasksCount: 0,
          markers: [],
        },
      });
    }

    // ✅ Get ThreeD asset IDs from project_assets
    const threeDAssets = await db
      .select({
        assetType: projectAssets.assetType,
        assetId: projectAssets.assetId,
      })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.moduleType, 'threed'),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          includeInactive ? sql`1=1` : eq(projectAssets.isActive, true)
        )
      );

    if (threeDAssets.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          plantsCount: 0,
          bedsCount: 0,
          charactersCount: 0,
          markersCount: 0,
          layersCount: 0,
          farmbotsCount: 0,
          plantingsCount: 0,
          tasksCount: 0,
          markers: [],
        },
      });
    }

    // ✅ Group asset IDs by type
    const assetIdsByType: Record<string, number[]> = {};
    threeDAssets.forEach((asset) => {
      if (!assetIdsByType[asset.assetType]) {
        assetIdsByType[asset.assetType] = [];
      }
      assetIdsByType[asset.assetType].push(asset.assetId);
    });

    // ✅ Helper function to fetch items
    const fetchItems = async (table: any, ids: number[], orderField: any) => {
      if (ids.length === 0) {
        return [];
      }

      let query = db
        .select()
        .from(table)
        .where(inArray(table.id, ids));

      if (!includeInactive) {
        // Check if table has isActive column
        if (table.isActive) {
          query = query.where(eq(table.isActive, true));
        }
      }

      return await query
        .orderBy(desc(orderField))
        .limit(limit);
    };

    // ✅ Fetch each asset type
    const [
      plants,
      beds,
      characters,
      markers,
      layers,
      farmbots,
      plantings,
      tasks,
    ] = await Promise.all([
      fetchItems(threedPlants, assetIdsByType['threed_plants'] || [], threedPlants.createdAt),
      fetchItems(threedBeds, assetIdsByType['threed_beds'] || [], threedBeds.createdAt),
      fetchItems(threedCharacters, assetIdsByType['threed_characters'] || [], threedCharacters.createdAt),
      fetchItems(threedMarkers, assetIdsByType['threed_markers'] || [], threedMarkers.createdAt),
      fetchItems(threedLayers, assetIdsByType['threed_layers'] || [], threedLayers.createdAt),
      fetchItems(threedFarmbots, assetIdsByType['threed_farmbots'] || [], threedFarmbots.createdAt),
      fetchItems(threedPlantings, assetIdsByType['threed_plantings'] || [], threedPlantings.createdAt),
      fetchItems(threedTasks, assetIdsByType['threed_tasks'] || [], threedTasks.createdAt),
    ]);

    // ✅ Transform to unified marker format
    const transformMarker = (item: any, type: string) => {
      // Extract position from various possible fields
      let x = item.position?.x || item.positionX || item.latitude || item.lat || 0;
      let y = item.position?.y || item.positionY || item.height || 0;
      let z = item.position?.z || item.positionZ || item.longitude || item.lng || 0;
      
      if (typeof x === 'string') x = parseFloat(x);
      if (typeof y === 'string') y = parseFloat(y);
      if (typeof z === 'string') z = parseFloat(z);
      
      // Get name from various possible fields
      const name = item.name || item.commonName || item.modelName || item.markerId || `${type} #${item.id}`;
      
      // Get color
      const color = item.color || getDefaultColor(type);
      
      return {
        id: item.id || `${type}-${Date.now()}`,
        name: name,
        type: type as 'plant' | 'bed' | 'character' | 'marker' | 'layer' | 'farmbot' | 'planting' | 'task',
        position: { x, y, z },
        color: color,
        size: item.size || 'medium',
        metadata: {
          description: item.description || '',
          isActive: item.isActive ?? true,
          status: item.status || 'active',
          ...item,
        },
      };
    };

    const getDefaultColor = (type: string): string => {
      const colors: Record<string, string> = {
        plants: '#22c55e',
        beds: '#f59e0b',
        characters: '#8b5cf6',
        markers: '#ec4899',
        layers: '#06b6d4',
        farmbots: '#64748b',
        plantings: '#22c55e',
        tasks: '#f97316',
      };
      return colors[type] || '#6b7280';
    };

    // ✅ Build response with all counts
    const allMarkers: any[] = [];
    
    // Plants (master data - may not have position, but included for reference)
    plants.forEach((item: any) => allMarkers.push(transformMarker(item, 'plants')));
    
    // Beds (have positionX/Y/Z)
    beds.forEach((item: any) => allMarkers.push(transformMarker(item, 'beds')));
    
    // Characters (have positionX/Y/Z)
    characters.forEach((item: any) => allMarkers.push(transformMarker(item, 'characters')));
    
    // Markers (have position JSON)
    markers.forEach((item: any) => allMarkers.push(transformMarker(item, 'markers')));
    
    // Layers (may not have position, but included for reference)
    layers.forEach((item: any) => allMarkers.push(transformMarker(item, 'layers')));
    
    // FarmBots (have positionX/Y/Z)
    farmbots.forEach((item: any) => allMarkers.push(transformMarker(item, 'farmbots')));
    
    // ✅ Plantings (actual planted instances with positionX/Y/Z)
    plantings.forEach((item: any) => {
      const marker = transformMarker(item, 'plantings');
      // ✅ Add plant name if available for better display
      if (item.plantId) {
        const plant = plants.find((p: any) => p.id === item.plantId);
        if (plant) {
          marker.metadata.plantName = plant.commonName || plant.name;
          marker.name = `${plant.commonName || plant.name} (Planting #${item.id})`;
        }
      }
      allMarkers.push(marker);
    });
    
    // ✅ Tasks (may have position, included for reference)
    tasks.forEach((item: any) => allMarkers.push(transformMarker(item, 'tasks')));

    const total = allMarkers.length;

    return NextResponse.json({
      success: true,
      data: {
        total,
        plantsCount: plants.length,
        bedsCount: beds.length,
        charactersCount: characters.length,
        markersCount: markers.length,
        layersCount: layers.length,
        farmbotsCount: farmbots.length,
        plantingsCount: plantings.length,
        tasksCount: tasks.length,
        markers: allMarkers,
      },
    });
  } catch (error) {
    console.error('Error fetching ThreeD map data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ThreeD data' },
      { status: 500 }
    );
  }
}