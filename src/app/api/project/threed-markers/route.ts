import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  project,
  projectAssets,
  projectThreed,
  projectThreedMarkers,
} from '@/lib/schema/project';
import {
  parseProjectThreeDMarkerSnapshot,
  ProjectMarkerSnapshotError,
} from '@/lib/services/threed/markers/project-marker-snapshot-core';
import type { ThreeDRuntimeMarkerModuleType } from '@/lib/types/map';

const MAX_REQUEST_BYTES = 1_048_576;

const PROJECT_ASSET_TYPE_BY_MARKER: Record<
  ThreeDRuntimeMarkerModuleType,
  typeof projectAssets.assetType.enumValues[number]
> = {
  plantings: 'threed_plantings',
  beds: 'threed_beds',
  characters: 'threed_characters',
  farmbots: 'threed_farmbots',
  models: 'threed_models',
};

function parsePositiveId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireOwnedProject(userId: string, projectId: number) {
  const [ownedProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .limit(1);
  return ownedProject ?? null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const projectId = parsePositiveId(new URL(request.url).searchParams.get('projectId'));
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
  }

  if (!await requireOwnedProject(userId, projectId)) {
    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  }

  const markers = await db
    .select()
    .from(projectThreedMarkers)
    .where(and(
      eq(projectThreedMarkers.projectId, projectId),
      eq(projectThreedMarkers.userId, userId),
    ));

  return NextResponse.json({ success: true, data: markers });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_BYTES) {
      return NextResponse.json({ success: false, error: 'Snapshot is too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid snapshot' }, { status: 400 });
    }

    const requestBody = body as Record<string, unknown>;
    const projectId = parsePositiveId(requestBody.projectId);
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
    }
    const markers = parseProjectThreeDMarkerSnapshot(requestBody.markers);

    if (!await requireOwnedProject(userId, projectId)) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const assignmentRows = markers.length === 0
      ? []
      : await db
          .select({
            moduleId: projectAssets.moduleId,
            assetType: projectAssets.assetType,
            assetId: projectAssets.assetId,
          })
          .from(projectAssets)
          .innerJoin(
            projectThreed,
            and(
              eq(projectThreed.projectId, projectAssets.projectId),
              eq(projectThreed.threedId, projectAssets.moduleId),
              eq(projectThreed.userId, projectAssets.userId),
              eq(projectThreed.isActive, true),
            ),
          )
          .where(and(
            eq(projectAssets.projectId, projectId),
            eq(projectAssets.userId, userId),
            eq(projectAssets.moduleType, 'threed'),
            eq(projectAssets.isActive, true),
            inArray(projectAssets.assetType, Object.values(PROJECT_ASSET_TYPE_BY_MARKER)),
          ));

    const moduleIdsByIdentity = new Map<string, Set<number>>();
    for (const assignment of assignmentRows) {
      const markerType = Object.entries(PROJECT_ASSET_TYPE_BY_MARKER)
        .find(([, assetType]) => assetType === assignment.assetType)?.[0];
      if (!markerType) continue;
      const identity = `${markerType}:${assignment.assetId}`;
      const moduleIds = moduleIdsByIdentity.get(identity) ?? new Set<number>();
      moduleIds.add(assignment.moduleId);
      moduleIdsByIdentity.set(identity, moduleIds);
    }

    const rows = markers.map((marker) => {
      const moduleIds = moduleIdsByIdentity.get(`${marker.moduleType}:${marker.assetId}`);
      if (!moduleIds || moduleIds.size !== 1) {
        throw new ProjectMarkerSnapshotError('invalid_snapshot');
      }
      const [threedId] = moduleIds;
      return {
        userId,
        projectId,
        threedId,
        markerType: marker.moduleType,
        sourceAssetId: marker.assetId,
        markerId: `${marker.moduleType}-${marker.assetId}`,
        name: marker.name,
        positionX: marker.position.x.toFixed(3),
        positionY: marker.position.y.toFixed(3),
        positionZ: marker.position.z.toFixed(3),
        positionSource: marker.positionSource,
        color: marker.color,
        icon: marker.icon,
        label: marker.label,
        isVisible: marker.isVisible,
        isActive: marker.isActive,
        data: marker.data,
        metadata: marker.metadata,
        savedAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const saved = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`project-threed-markers:${projectId}`}))`,
      );
      await tx
        .delete(projectThreedMarkers)
        .where(and(
          eq(projectThreedMarkers.projectId, projectId),
          eq(projectThreedMarkers.userId, userId),
        ));
      if (rows.length > 0) {
        await tx.insert(projectThreedMarkers).values(rows);
      }
      return rows.length;
    });

    return NextResponse.json({
      success: true,
      data: { projectId, markerCount: saved, savedAt: new Date().toISOString() },
    });
  } catch (error) {
    if (error instanceof ProjectMarkerSnapshotError) {
      return NextResponse.json(
        { success: false, error: 'Invalid ThreeD Project marker snapshot' },
        { status: error.code === 'too_many_markers' ? 413 : 400 },
      );
    }
    console.error('Failed to save ThreeD Project marker snapshot', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to save ThreeD Project marker snapshot' },
      { status: 500 },
    );
  }
}
