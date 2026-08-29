// app/api/project/route.ts - Updated to filter by user

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project, projectThreedMarkers } from '@/lib/schema/project';
import { eq, and, desc } from 'drizzle-orm';
import {
  calibrateThreeDGeographicOrigin,
  projectLocalPositionToGeographicPosition,
  ThreeDMapCoordinateError,
} from '@/lib/services/threed/markers/map-coordinate-core';

function calibrationNumber(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new ThreeDMapCoordinateError(`${label} must be finite`);
  return parsed;
}

// ============================================
// GET /api/project - List all projects for the current user
// Query Parameters:
//   - id (optional): Get a single project by ID
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // ✅ Get a single project by ID (must belong to user)
    if (id) {
      const [singleProject] = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.id, parseInt(id)),
            eq(project.userId, userId)
          )
        )
        .limit(1);

      if (!singleProject) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: singleProject,
      });
    }

    // ✅ List all projects for the current user only
    const projects = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(desc(project.createdAt));

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/project - Create a new project
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
    const { name, description, isPublic, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const [newProject] = await db
      .insert(project)
      .values({
        userId,
        name,
        description: description || null,
        slug,
        isPublic: isPublic || false,
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/project - Update a project
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
    const { name, description, isPublic, isActive, coordinateCalibration } = body;

    const userId = session.user.id;

    // ✅ Verify project exists and belongs to user
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const calibration = coordinateCalibration === undefined
      ? null
      : calibrateThreeDGeographicOrigin({
          pointA: {
            local: {
              x: calibrationNumber(coordinateCalibration?.pointA?.localX, 'Point A local X'),
              z: calibrationNumber(coordinateCalibration?.pointA?.localZ, 'Point A local Z'),
            },
            geographic: {
              latitude: calibrationNumber(coordinateCalibration?.pointA?.latitude, 'Point A latitude'),
              longitude: calibrationNumber(coordinateCalibration?.pointA?.longitude, 'Point A longitude'),
            },
          },
          pointB: {
            local: {
              x: calibrationNumber(coordinateCalibration?.pointB?.localX, 'Point B local X'),
              z: calibrationNumber(coordinateCalibration?.pointB?.localZ, 'Point B local Z'),
            },
            geographic: {
              latitude: calibrationNumber(coordinateCalibration?.pointB?.latitude, 'Point B latitude'),
              longitude: calibrationNumber(coordinateCalibration?.pointB?.longitude, 'Point B longitude'),
            },
          },
          originAltitude: Number(existing.originAltitude),
        });

    const result = await db.transaction(async (tx) => {
      const [updatedProject] = await tx
        .update(project)
        .set({
          name: name || existing.name,
          description: description !== undefined ? description : existing.description,
          isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          ...(calibration ? {
            originLatitude: calibration.latitude.toFixed(7),
            originLongitude: calibration.longitude.toFixed(7),
            headingDegrees: calibration.headingDegrees.toFixed(3),
            metersPerSceneUnit: calibration.metersPerSceneUnit.toFixed(6),
            calibrationPointALocalX: calibrationNumber(
              coordinateCalibration.pointA.localX,
              'Point A local X',
            ).toFixed(3),
            calibrationPointALocalZ: calibrationNumber(
              coordinateCalibration.pointA.localZ,
              'Point A local Z',
            ).toFixed(3),
            calibrationPointALatitude: calibrationNumber(
              coordinateCalibration.pointA.latitude,
              'Point A latitude',
            ).toFixed(7),
            calibrationPointALongitude: calibrationNumber(
              coordinateCalibration.pointA.longitude,
              'Point A longitude',
            ).toFixed(7),
            calibrationPointBLocalX: calibrationNumber(
              coordinateCalibration.pointB.localX,
              'Point B local X',
            ).toFixed(3),
            calibrationPointBLocalZ: calibrationNumber(
              coordinateCalibration.pointB.localZ,
              'Point B local Z',
            ).toFixed(3),
            calibrationPointBLatitude: calibrationNumber(
              coordinateCalibration.pointB.latitude,
              'Point B latitude',
            ).toFixed(7),
            calibrationPointBLongitude: calibrationNumber(
              coordinateCalibration.pointB.longitude,
              'Point B longitude',
            ).toFixed(7),
          } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(project.id, parseInt(id)), eq(project.userId, userId)))
        .returning();

      let markerCount = 0;
      if (calibration) {
        const markers = await tx.select().from(projectThreedMarkers).where(and(
          eq(projectThreedMarkers.projectId, parseInt(id)),
          eq(projectThreedMarkers.userId, userId),
        ));
        for (const marker of markers) {
          const geographic = projectLocalPositionToGeographicPosition({
            x: Number(marker.positionX),
            y: Number(marker.positionY),
            z: Number(marker.positionZ),
          }, calibration);
          await tx.update(projectThreedMarkers).set({
            latitude: geographic.latitude.toFixed(7),
            longitude: geographic.longitude.toFixed(7),
            altitude: geographic.altitude.toFixed(3),
            updatedAt: new Date(),
          }).where(and(
            eq(projectThreedMarkers.id, marker.id),
            eq(projectThreedMarkers.userId, userId),
          ));
        }
        markerCount = markers.length;
      }
      return { updatedProject, markerCount };
    });

    return NextResponse.json({
      success: true,
      data: result.updatedProject,
      markerCount: result.markerCount,
      message: calibration
        ? `Project coordinates calibrated; ${result.markerCount} marker GPS records refreshed`
        : 'Project updated successfully',
    });
  } catch (error) {
    if (error instanceof ThreeDMapCoordinateError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project - Delete a project
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

    // ✅ Verify project exists and belongs to user
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
