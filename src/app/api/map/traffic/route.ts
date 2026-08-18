// app/api/map/traffic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  trafficChpCadIncidents,
  trafficChpCases,
  trafficChpCenters,
  trafficCaltransLaneClosures,
  trafficCaltransCctvCameras,
  trafficCaltransDistricts,
  trafficBayArea511Events,
  trafficCalfireIncidents,
} from '@/lib/schema/traffic';
import { project, projectAssets, projectTraffic } from '@/lib/schema/project';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

// ============================================
// GET /api/map/traffic - Get traffic data for project map
// Query Parameters:
//   - projectId (required): Project ID to get assets for
//   - includeInactive (optional): Include inactive records
//   - limit (optional): Max records per source (default: 100)
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

    // ✅ Get traffic module IDs for this project
    const projectTrafficModules = await db
      .select({ trafficId: projectTraffic.trafficId })
      .from(projectTraffic)
      .where(
        and(
          eq(projectTraffic.projectId, parsedProjectId),
          userId ? eq(projectTraffic.userId, userId) : sql`1=1`,
          eq(projectTraffic.isActive, true)
        )
      );

    const trafficModuleIds = projectTrafficModules
      .map(m => m.trafficId)
      .filter((id): id is number => id !== null);

    if (trafficModuleIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          chpCadCount: 0,
          chpCasesCount: 0,
          chpCentersCount: 0,
          caltransClosuresCount: 0,
          caltransCctvCount: 0,
          caltransDistrictsCount: 0,
          bayArea511Count: 0,
          calfireIncidentsCount: 0,
          incidents: [],
        },
      });
    }

    // ✅ Get traffic asset IDs from project_assets
    const trafficAssets = await db
      .select({
        assetType: projectAssets.assetType,
        assetId: projectAssets.assetId,
      })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.projectId, parsedProjectId),
          eq(projectAssets.moduleType, 'traffic'),
          inArray(projectAssets.moduleId, trafficModuleIds),
          userId ? eq(projectAssets.userId, userId) : sql`1=1`,
          includeInactive ? sql`1=1` : eq(projectAssets.isActive, true)
        )
      );

    if (trafficAssets.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          chpCadCount: 0,
          chpCasesCount: 0,
          chpCentersCount: 0,
          caltransClosuresCount: 0,
          caltransCctvCount: 0,
          caltransDistrictsCount: 0,
          bayArea511Count: 0,
          calfireIncidentsCount: 0,
          incidents: [],
        },
      });
    }

    // ✅ Group asset IDs by type
    const assetIdsByType: Record<string, number[]> = {};
    trafficAssets.forEach((asset) => {
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

      const assignedAssetCondition = inArray(table.id, ids);
      const query = db
        .select()
        .from(table)
        .where(
          !includeInactive
            ? and(assignedAssetCondition, eq(table.isActive, true))
            : assignedAssetCondition
        );

      return await query
        .orderBy(desc(orderField))
        .limit(limit);
    };

    // ✅ Fetch each traffic asset type
    const [
      chpCadIncidents,
      chpCases,
      chpCenters,
      caltransClosures,
      caltransCctv,
      caltransDistricts,
      bayArea511Events,
      calfireIncidents,
    ] = await Promise.all([
      fetchItems(trafficChpCadIncidents, assetIdsByType['traffic_chp_cad_incidents'] || [], trafficChpCadIncidents.reportedAt),
      fetchItems(trafficChpCases, assetIdsByType['traffic_chp_cases'] || [], trafficChpCases.occurredAt),
      fetchItems(trafficChpCenters, assetIdsByType['traffic_chp_centers'] || [], trafficChpCenters.createdAt),
      fetchItems(trafficCaltransLaneClosures, assetIdsByType['traffic_caltrans_lane_closures'] || [], trafficCaltransLaneClosures.startDate),
      fetchItems(trafficCaltransCctvCameras, assetIdsByType['traffic_caltrans_cctv_cameras'] || [], trafficCaltransCctvCameras.createdAt),
      fetchItems(trafficCaltransDistricts, assetIdsByType['traffic_caltrans_districts'] || [], trafficCaltransDistricts.createdAt),
      fetchItems(trafficBayArea511Events, assetIdsByType['traffic_bay_area_511_events'] || [], trafficBayArea511Events.reportedAt),
      fetchItems(trafficCalfireIncidents, assetIdsByType['traffic_calfire_incidents'] || [], trafficCalfireIncidents.reportedAt),
    ]);

    // ✅ Transform to unified incident format with source identifiers
    const transformIncident = (item: any, source: string, sourceName: string) => {
      let lat = item.latitude || item.lat || null;
      let lng = item.longitude || item.lng || null;
      
      if (lat && typeof lat === 'string') lat = parseFloat(lat);
      if (lng && typeof lng === 'string') lng = parseFloat(lng);
      
      const title = item.title || item.name || item.incidentId || item.caseId || item.closureId || item.cameraId || 'Incident';
      const location = item.location || item.address || item.city || item.county || '';
      const timestamp = item.reportedAt || item.occurredAt || item.startDate || item.createdAt || new Date().toISOString();
      const type = item.type || item.incidentType || item.eventType || item.closureType || item.cameraType || 'Incident';
      
      return {
        id: item.id || `${source}-${Date.now()}`,
        source: source, // ✅ This is the key for layer toggling: 'chpCad', 'caltransClosures', etc.
        sourceName: sourceName, // Display name: 'CHP CAD', 'Caltrans Closures', etc.
        type: type,
        title: title,
        description: item.description || item.details || item.notes || '',
        location: location,
        lat: lat || 0,
        lng: lng || 0,
        severity: determineSeverity(item),
        timestamp: timestamp,
        details: item,
      };
    };

    // ✅ Helper to determine severity
    const determineSeverity = (item: any): 'low' | 'medium' | 'high' | 'critical' => {
      if (item.severity) {
        const sev = String(item.severity).toLowerCase();
        if (sev === 'critical' || sev === '5' || sev === 'fatal') return 'critical';
        if (sev === 'high' || sev === '4' || sev === 'severe') return 'high';
        if (sev === 'medium' || sev === '3' || sev === 'moderate') return 'medium';
        if (sev === 'low' || sev === '1' || sev === '2') return 'low';
      }
      
      if (item.status) {
        const status = String(item.status).toLowerCase();
        if (status === 'active' || status === 'pending') return 'medium';
        if (status === 'cleared' || status === 'resolved') return 'low';
      }
      
      if (item.containment !== undefined && item.containment !== null) {
        const containment = parseInt(item.containment);
        if (containment < 30) return 'critical';
        if (containment < 60) return 'high';
        if (containment < 90) return 'medium';
        return 'low';
      }
      
      return 'medium';
    };

    // ✅ Build response with Count suffix and source identifiers
    const allIncidents: any[] = [];
    
    // CHP CAD Incidents
    chpCadIncidents.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'chpCad', 'CHP CAD'));
    });
    
    // CHP Cases
    chpCases.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'chpCases', 'CHP Cases'));
    });
    
    // CHP Centers
    chpCenters.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'chpCenters', 'CHP Centers'));
    });
    
    // Caltrans Lane Closures
    caltransClosures.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'caltransClosures', 'Caltrans Closures'));
    });
    
    // Caltrans CCTV Cameras
    caltransCctv.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'caltransCctv', 'Caltrans CCTV'));
    });
    
    // Caltrans Districts
    caltransDistricts.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'caltransDistricts', 'Caltrans Districts'));
    });
    
    // Bay Area 511 Events
    bayArea511Events.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'bayArea511', 'Bay Area 511'));
    });
    
    // CalFire Incidents
    calfireIncidents.forEach((item: any) => {
      allIncidents.push(transformIncident(item, 'calfireIncidents', 'CalFire'));
    });

    const total = allIncidents.length;

    return NextResponse.json({
      success: true,
      data: {
        total,
        chpCadCount: chpCadIncidents.length,
        chpCasesCount: chpCases.length,
        chpCentersCount: chpCenters.length,
        caltransClosuresCount: caltransClosures.length,
        caltransCctvCount: caltransCctv.length,
        caltransDistrictsCount: caltransDistricts.length,
        bayArea511Count: bayArea511Events.length,
        calfireIncidentsCount: calfireIncidents.length,
        incidents: allIncidents,
      },
    });
  } catch (error) {
    console.error('Error fetching traffic map data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch traffic data' },
      { status: 500 }
    );
  }
}
