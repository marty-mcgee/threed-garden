// app/api/traffic/caltrans-cctv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { trafficCaltransCctvCameras, trafficCaltransDistricts } from '@/lib/schema/traffic';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/traffic/caltrans-cctv - List Caltrans CCTV Cameras
// Query Parameters:
//   - id (optional): Get a single camera
//   - isActive (optional): Filter by active status
//   - isPublic (optional): Filter by public status
//   - status (optional): Filter by camera status
//   - county (optional): Filter by county
//   - districtId (optional): Filter by district
//   - includeDistrict (optional): Include district details
//   - limit (optional): Number of records to return (default: 50)
//   - offset (optional): Number of records to skip (default: 0)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');
    const status = searchParams.get('status');
    const county = searchParams.get('county');
    const districtId = searchParams.get('districtId');
    const includeDistrict = searchParams.get('includeDistrict') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get a single camera by ID
    if (id) {
      const [camera] = await db
        .select()
        .from(trafficCaltransCctvCameras)
        .where(
          and(
            eq(trafficCaltransCctvCameras.id, parseInt(id)),
            userId
              ? undefined
              : and(
                  eq(trafficCaltransCctvCameras.isPublic, true),
                  eq(trafficCaltransCctvCameras.isActive, true)
                )
          )
        )
        .limit(1);

      if (!camera) {
        return NextResponse.json(
          { success: false, error: 'Caltrans CCTV camera not found' },
          { status: 404 }
        );
      }

      let result: any = camera;
      if (includeDistrict && camera.districtId) {
        const [district] = await db
          .select()
          .from(trafficCaltransDistricts)
          .where(eq(trafficCaltransDistricts.id, camera.districtId))
          .limit(1);
        result.district = district || null;
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    const conditions = [
      userId
        ? or(
            eq(trafficCaltransCctvCameras.userId, userId),
            and(
              eq(trafficCaltransCctvCameras.isPublic, true),
              eq(trafficCaltransCctvCameras.isActive, true)
            )
          )
        : and(
            eq(trafficCaltransCctvCameras.isPublic, true),
            eq(trafficCaltransCctvCameras.isActive, true)
          ),
    ];

    if (isActive !== null) {
      conditions.push(eq(trafficCaltransCctvCameras.isActive, isActive === 'true'));
    }
    if (isPublic !== null) {
      conditions.push(eq(trafficCaltransCctvCameras.isPublic, isPublic === 'true'));
    }
    if (status) {
      conditions.push(eq(trafficCaltransCctvCameras.status, status));
    }
    if (county) {
      conditions.push(eq(trafficCaltransCctvCameras.county, county));
    }
    if (districtId) {
      conditions.push(eq(trafficCaltransCctvCameras.districtId, parseInt(districtId)));
    }

    const predicate = and(...conditions);

    // ✅ Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trafficCaltransCctvCameras)
      .where(predicate);

    const total = countResult?.count || 0;

    // ✅ Get paginated results
    const cameras = await db
      .select()
      .from(trafficCaltransCctvCameras)
      .where(predicate)
      .orderBy(desc(trafficCaltransCctvCameras.createdAt))
      .limit(limit)
      .offset(offset);

    // ✅ Include district if requested
    if (includeDistrict) {
      const camerasWithDistricts = await Promise.all(
        cameras.map(async (camera) => {
          let result: any = { ...camera };
          if (camera.districtId) {
            const [district] = await db
              .select()
              .from(trafficCaltransDistricts)
              .where(eq(trafficCaltransDistricts.id, camera.districtId))
              .limit(1);
            result.district = district || null;
          }
          return result;
        })
      );
      return NextResponse.json({
        success: true,
        data: camerasWithDistricts,
        pagination: { limit, offset, total },
      });
    }

    return NextResponse.json({
      success: true,
      data: cameras,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Error fetching Caltrans CCTV cameras:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Caltrans CCTV cameras' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/traffic/caltrans-cctv - Create Caltrans CCTV camera (ADMIN ONLY)
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
    console.log('📝 POST /api/traffic/caltrans-cctv - Request body:', body);

    const {
      cameraId,
      sourceId,
      name,
      description,
      latitude,
      longitude,
      address,
      city,
      county,
      cameraType,
      direction,
      imageUrl,
      streamingUrl,
      status,
      districtId,
      caltransId,
      rawData,
      notes,
      isActive,
      isPublic,
    } = body;

    // ✅ Validate required fields
    if (!cameraId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: cameraId' },
        { status: 400 }
      );
    }
    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sourceId' },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if cameraId already exists
    const [existing] = await db
      .select()
      .from(trafficCaltransCctvCameras)
      .where(
        and(
          eq(trafficCaltransCctvCameras.cameraId, cameraId),
          eq(trafficCaltransCctvCameras.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Camera ID already exists' },
        { status: 409 }
      );
    }

    // ✅ Verify district exists if provided
    if (districtId) {
      const [district] = await db
        .select()
        .from(trafficCaltransDistricts)
        .where(eq(trafficCaltransDistricts.id, parseInt(districtId)))
        .limit(1);

      if (!district) {
        return NextResponse.json(
          { success: false, error: 'Caltrans District not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return value;
    };

    await ensureTableSequence('traffic_caltrans_cctv_cameras');

    const [newCamera] = await db
      .insert(trafficCaltransCctvCameras)
      .values({
        userId,
        cameraId,
        sourceId,
        name,
        description: description || null,
        latitude: parseNumeric(latitude),
        longitude: parseNumeric(longitude),
        address: address || null,
        city: city || null,
        county: county || null,
        cameraType: cameraType || null,
        direction: direction || null,
        imageUrl: imageUrl || null,
        streamingUrl: streamingUrl || null,
        status: status || 'active',
        districtId: districtId || null,
        caltransId: caltransId || null,
        rawData: rawData || null,
        notes: notes || null,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
      })
      .returning();

    console.log('✅ Caltrans CCTV camera created:', newCamera);

    return NextResponse.json({
      success: true,
      data: newCamera,
      message: 'Caltrans CCTV camera created successfully',
    });
  } catch (error) {
    console.error('Error creating Caltrans CCTV camera:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Caltrans CCTV camera' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/traffic/caltrans-cctv - Partial update (ADMIN ONLY)
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ✅ Verify camera exists and belongs to user
    const [existing] = await db
      .select()
      .from(trafficCaltransCctvCameras)
      .where(
        and(
          eq(trafficCaltransCctvCameras.id, parsedId),
          eq(trafficCaltransCctvCameras.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caltrans CCTV camera not found' },
        { status: 404 }
      );
    }

    // ✅ Verify district exists if provided
    if (body.districtId) {
      const [district] = await db
        .select()
        .from(trafficCaltransDistricts)
        .where(eq(trafficCaltransDistricts.id, parseInt(body.districtId)))
        .limit(1);

      if (!district) {
        return NextResponse.json(
          { success: false, error: 'Caltrans District not found' },
          { status: 404 }
        );
      }
    }

    // ✅ Helper function to handle numeric fields
    const parseNumeric = (value: any) => {
      if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
        return null;
      }
      return value;
    };

    // ✅ Build update data
    const updateData: any = { updatedAt: new Date() };

    if (body.cameraId !== undefined) updateData.cameraId = body.cameraId;
    if (body.sourceId !== undefined) updateData.sourceId = body.sourceId;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.latitude !== undefined) updateData.latitude = parseNumeric(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = parseNumeric(body.longitude);
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.cameraType !== undefined) updateData.cameraType = body.cameraType;
    if (body.direction !== undefined) updateData.direction = body.direction;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.streamingUrl !== undefined) updateData.streamingUrl = body.streamingUrl;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.districtId !== undefined) updateData.districtId = body.districtId || null;
    if (body.caltransId !== undefined) updateData.caltransId = body.caltransId || null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    const [updatedCamera] = await db
      .update(trafficCaltransCctvCameras)
      .set(updateData)
      .where(
        and(
          eq(trafficCaltransCctvCameras.id, parsedId),
          eq(trafficCaltransCctvCameras.userId, userId)
        )
      )
      .returning();

    console.log('✅ Caltrans CCTV camera updated:', updatedCamera);

    return NextResponse.json({
      success: true,
      data: updatedCamera,
      message: 'Caltrans CCTV camera updated successfully',
    });
  } catch (error) {
    console.error('Error updating Caltrans CCTV camera:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Caltrans CCTV camera' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/traffic/caltrans-cctv - Delete camera (ADMIN ONLY)
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(trafficCaltransCctvCameras)
      .where(
        and(
          eq(trafficCaltransCctvCameras.id, parsedId),
          eq(trafficCaltransCctvCameras.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Caltrans CCTV camera not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Caltrans CCTV camera deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Caltrans CCTV camera:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete Caltrans CCTV camera' },
      { status: 500 }
    );
  }
}
