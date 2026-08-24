import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  project,
  projectAssets,
  projectThreed,
  projectThreedMarkers,
} from '@/lib/schema/project';
import {
  threed,
  threedModels,
} from '@/lib/schema/threed';
import {
  parseProjectThreeDMarkerSnapshot,
  ProjectMarkerSnapshotError,
} from '@/lib/services/threed/markers/project-marker-snapshot-core';
import {
  parseCreateProjectModelInstance,
  parseUpdateProjectModelInstance,
  ProjectModelInstanceInputError,
} from '@/lib/services/threed/models/project-model-instance-core';
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

function getSafeDatabaseError(error: unknown) {
  if (typeof error !== 'object' || error === null) return {};
  const candidate = error as { code?: unknown; constraint?: unknown };
  return {
    errorCode: typeof candidate.code === 'string' ? candidate.code : undefined,
    constraint: typeof candidate.constraint === 'string' ? candidate.constraint : undefined,
  };
}

async function requireOwnedProject(userId: string, projectId: number) {
  const [ownedProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .limit(1);
  return ownedProject ?? null;
}

async function requireActiveThreeDAssignment(
  userId: string,
  projectId: number,
  threedId: number,
) {
  const [assignment] = await db
    .select({ id: projectThreed.id })
    .from(projectThreed)
    .innerJoin(threed, and(
      eq(threed.id, projectThreed.threedId),
      eq(threed.userId, userId),
      eq(threed.isActive, true),
    ))
    .where(and(
      eq(projectThreed.projectId, projectId),
      eq(projectThreed.threedId, threedId),
      eq(projectThreed.userId, userId),
      eq(projectThreed.isActive, true),
    ))
    .limit(1);
  return assignment ?? null;
}

async function readEligibleModel(userId: string, modelId: number) {
  const [model] = await db
    .select()
    .from(threedModels)
    .where(and(
      eq(threedModels.id, modelId),
      eq(threedModels.isActive, true),
      eq(threedModels.status, 'active'),
      sql`${threedModels.usedByCharacters} IS NOT TRUE`,
      or(
        eq(threedModels.userId, userId),
        and(eq(threedModels.isPublic, true), eq(threedModels.isLibraryItem, true)),
      ),
    ))
    .limit(1);
  return model ?? null;
}

async function readOwnedModelMarker(userId: string, id: number) {
  const [marker] = await db
    .select()
    .from(projectThreedMarkers)
    .innerJoin(project, and(
      eq(project.id, projectThreedMarkers.projectId),
      eq(project.userId, userId),
    ))
    .where(and(
      eq(projectThreedMarkers.id, id),
      eq(projectThreedMarkers.userId, userId),
      eq(projectThreedMarkers.markerType, 'models'),
    ))
    .limit(1);
  return marker?.project_threed_markers ?? null;
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_BYTES) {
    throw new ProjectModelInstanceInputError('Request body is too large');
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new ProjectModelInstanceInputError('Invalid JSON');
  }
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

async function saveSnapshot(request: NextRequest) {
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
        markerId: marker.markerId,
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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = parseCreateProjectModelInstance(await readJsonBody(request));
    const userId = session.user.id;
    if (!await requireOwnedProject(userId, input.projectId)) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    if (!await requireActiveThreeDAssignment(userId, input.projectId, input.threedId)) {
      return NextResponse.json(
        { success: false, error: 'Active ThreeD Project assignment not found' },
        { status: 404 },
      );
    }
    const model = await readEligibleModel(userId, input.modelId);
    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model is not eligible for direct Scene placement' },
        { status: 404 },
      );
    }

    const marker = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`project-threed-markers:${input.projectId}`}))`,
      );
      await tx.insert(projectAssets).values({
          userId,
          projectId: input.projectId,
          moduleId: input.threedId,
          moduleType: 'threed',
          assetType: 'threed_models',
          assetId: input.modelId,
          config: {},
          isActive: true,
        }).onConflictDoUpdate({
          target: [
            projectAssets.projectId,
            projectAssets.moduleId,
            projectAssets.assetType,
            projectAssets.assetId,
          ],
          targetWhere: sql`"is_active" = true`,
          set: {
            userId,
            moduleType: 'threed',
            isActive: true,
            updatedAt: new Date(),
          },
        });

      const markerId = `models-${crypto.randomUUID()}`;
      const [created] = await tx.insert(projectThreedMarkers).values({
        userId,
        projectId: input.projectId,
        threedId: input.threedId,
        markerType: 'models',
        sourceAssetId: input.modelId,
        markerId,
        name: input.instanceName || model.modelName,
        positionX: input.positionX.toFixed(3),
        positionY: input.positionY.toFixed(3),
        positionZ: input.positionZ.toFixed(3),
        positionSource: 'asset',
        color: '#06b6d4',
        icon: '🧊',
        label: input.instanceName || model.modelName,
        isVisible: input.isVisible,
        isActive: input.isActive,
        data: {
          modelId: input.modelId,
          rotationX: input.rotationX,
          rotationYInstance: input.rotationY,
          rotationZ: input.rotationZ,
          scaleMultiplier: input.scaleMultiplier,
        },
        metadata: { ...input.metadata, source: 'project-marker' },
      }).returning();
      return created;
    });

    return NextResponse.json({ success: true, data: marker }, { status: 201 });
  } catch (error) {
    if (error instanceof ProjectModelInstanceInputError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Failed to create Project ThreeD Model marker', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      ...getSafeDatabaseError(error),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to create Project ThreeD Model marker' },
      { status: 500 },
    );
  }
}

async function updateModelMarker(request: NextRequest, id: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = parseUpdateProjectModelInstance(await readJsonBody(request));
    const marker = await readOwnedModelMarker(session.user.id, id);
    if (!marker) {
      return NextResponse.json({ success: false, error: 'Model marker not found' }, { status: 404 });
    }
    const currentData = marker.data && typeof marker.data === 'object' ? marker.data : {};
    const values: Partial<typeof projectThreedMarkers.$inferInsert> = { updatedAt: new Date() };
    if (update.instanceName !== undefined) {
      values.name = update.instanceName || marker.name;
      values.label = update.instanceName || marker.label;
    }
    if (update.positionX !== undefined) values.positionX = update.positionX.toFixed(3);
    if (update.positionY !== undefined) values.positionY = update.positionY.toFixed(3);
    if (update.positionZ !== undefined) values.positionZ = update.positionZ.toFixed(3);
    if (update.isVisible !== undefined) values.isVisible = update.isVisible;
    if (update.isActive !== undefined) values.isActive = update.isActive;
    if (update.metadata !== undefined) values.metadata = update.metadata;
    values.data = {
      ...currentData,
      ...(update.rotationX !== undefined ? { rotationX: update.rotationX } : {}),
      ...(update.rotationY !== undefined ? { rotationYInstance: update.rotationY } : {}),
      ...(update.rotationZ !== undefined ? { rotationZ: update.rotationZ } : {}),
      ...(update.scaleMultiplier !== undefined ? { scaleMultiplier: update.scaleMultiplier } : {}),
    };

    const [updated] = await db.update(projectThreedMarkers).set(values).where(and(
      eq(projectThreedMarkers.id, id),
      eq(projectThreedMarkers.userId, session.user.id),
      eq(projectThreedMarkers.markerType, 'models'),
    )).returning();
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ProjectModelInstanceInputError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Failed to update Project ThreeD Model marker', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to update Project ThreeD Model marker' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const id = parsePositiveId(new URL(request.url).searchParams.get('id'));
  return id ? updateModelMarker(request, id) : saveSnapshot(request);
}

export async function PATCH(request: NextRequest) {
  const id = parsePositiveId(new URL(request.url).searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ success: false, error: 'Invalid marker ID' }, { status: 400 });
  }
  return updateModelMarker(request, id);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = parsePositiveId(new URL(request.url).searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ success: false, error: 'Invalid marker ID' }, { status: 400 });
  }
  if (!await readOwnedModelMarker(session.user.id, id)) {
    return NextResponse.json({ success: false, error: 'Model marker not found' }, { status: 404 });
  }
  const [deleted] = await db.delete(projectThreedMarkers).where(and(
    eq(projectThreedMarkers.id, id),
    eq(projectThreedMarkers.userId, session.user.id),
    eq(projectThreedMarkers.markerType, 'models'),
  )).returning({ id: projectThreedMarkers.id });
  return NextResponse.json({ success: true, data: deleted });
}
