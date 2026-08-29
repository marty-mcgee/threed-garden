import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, notInArray, or, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { ensureTableSequence } from '@/lib/db/sequence';
import {
  project,
  projectAssets,
  projectThreed,
  projectThreedMarkers,
} from '@/lib/schema/project';
import {
  threed,
  threedBeds,
  threedCharacters,
  threedFarmbots,
  threedModels,
  threedPlantings,
  threedPlants,
} from '@/lib/schema/threed';
import {
  parseCreateProjectBedPlacement,
  parseUpdateProjectBedPlacement,
  ProjectBedPlacementInputError,
} from '@/lib/services/threed/beds/project-bed-placement-core';
import {
  parseCreateProjectCharacterPlacement,
  parseUpdateProjectCharacterPlacement,
  ProjectCharacterPlacementInputError,
} from '@/lib/services/threed/characters/project-character-placement-core';
import {
  resolveThreeDCharacterLibraryAccess,
} from '@/lib/services/threed/characters/character-library-access-core';
import {
  parseCreateProjectFarmBotPlacement,
  parseUpdateProjectFarmBotPlacement,
  ProjectFarmBotPlacementInputError,
} from '@/lib/services/threed/farmbot/project-farmbot-placement-core';
import { sanitizeFarmBotRecord } from '@/lib/services/threed/farmbot/sanitize';
import {
  calculateProjectPlantingVisualPositions,
  parseCreateProjectPlantingPlacement,
  parseUpdateProjectPlantingPlacement,
  ProjectPlantingPlacementInputError,
} from '@/lib/services/threed/plantings/project-planting-placement-core';
import {
  parseProjectThreeDMarkerSnapshot,
  ProjectMarkerSnapshotError,
} from '@/lib/services/threed/markers/project-marker-snapshot-core';
import {
  projectLocalPositionToGeographicPosition,
  type ThreeDGeographicOrigin,
} from '@/lib/services/threed/markers/map-coordinate-core';
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
    .select({
      id: project.id,
      originLatitude: project.originLatitude,
      originLongitude: project.originLongitude,
      originAltitude: project.originAltitude,
      headingDegrees: project.headingDegrees,
      metersPerSceneUnit: project.metersPerSceneUnit,
    })
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

type OwnedProject = NonNullable<Awaited<
  ReturnType<typeof requireOwnedProject>
>>;

function getProjectOrigin(
  ownedProject: OwnedProject,
): ThreeDGeographicOrigin | null {
  if (ownedProject.originLatitude === null || ownedProject.originLongitude === null) return null;
  return {
    latitude: Number(ownedProject.originLatitude),
    longitude: Number(ownedProject.originLongitude),
    altitude: Number(ownedProject.originAltitude),
    headingDegrees: Number(ownedProject.headingDegrees),
    metersPerSceneUnit: Number(ownedProject.metersPerSceneUnit),
  };
}

function getMarkerGeographicValues(
  position: { x: number; y: number; z: number },
  ownedProject: OwnedProject | null,
): {
  latitude: string | null;
  longitude: string | null;
  altitude: string | null;
} {
  const origin = ownedProject ? getProjectOrigin(ownedProject) : null;
  if (!origin) return { latitude: null, longitude: null, altitude: null };
  const geographic = projectLocalPositionToGeographicPosition(position, origin);
  return {
    latitude: geographic.latitude.toFixed(7),
    longitude: geographic.longitude.toFixed(7),
    altitude: geographic.altitude.toFixed(3),
  };
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

async function readEligibleCharacter(userId: string, characterId: number) {
  const [result] = await db
    .select({ character: threedCharacters, model: threedModels })
    .from(threedCharacters)
    .innerJoin(threedModels, eq(threedModels.id, threedCharacters.modelId))
    .where(and(
      eq(threedCharacters.id, characterId),
      eq(threedCharacters.userId, userId),
      or(
        eq(threedModels.userId, userId),
        and(
          eq(threedModels.isPublic, true),
          eq(threedModels.isLibraryItem, true),
        ),
      ),
    ))
    .limit(1);
  if (!result) return null;
  const libraryAccess = resolveThreeDCharacterLibraryAccess(
    result.character,
    result.model,
  );
  return libraryAccess.eligible
    ? { ...result, libraryAccess }
    : null;
}

async function readOwnedActivePlant(userId: string, plantId: number) {
  const [plant] = await db.select().from(threedPlants).where(and(
    eq(threedPlants.id, plantId),
    eq(threedPlants.userId, userId),
    eq(threedPlants.isActive, true),
    eq(threedPlants.status, 'active'),
  )).limit(1);
  return plant ?? null;
}

async function requireAssignedBed(
  userId: string,
  projectId: number,
  threedId: number,
  bedId: number,
) {
  const [assigned] = await db.select({ id: projectAssets.id })
    .from(projectAssets)
    .innerJoin(threedBeds, and(
      eq(threedBeds.id, projectAssets.assetId),
      eq(threedBeds.userId, userId),
      eq(threedBeds.isActive, true),
    ))
    .where(and(
      eq(projectAssets.userId, userId),
      eq(projectAssets.projectId, projectId),
      eq(projectAssets.moduleId, threedId),
      eq(projectAssets.moduleType, 'threed'),
      eq(projectAssets.assetType, 'threed_beds'),
      eq(projectAssets.assetId, bedId),
      eq(projectAssets.isActive, true),
    )).limit(1);
  return assigned ?? null;
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

async function readOwnedProjectMarker(userId: string, id: number) {
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

    const ownedProject = await requireOwnedProject(userId, projectId);
    if (!ownedProject) {
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
      const geographic = getMarkerGeographicValues(marker.position, ownedProject);
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
        ...geographic,
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
      if (rows.length === 0) {
        await tx.delete(projectThreedMarkers).where(and(
          eq(projectThreedMarkers.projectId, projectId),
          eq(projectThreedMarkers.userId, userId),
        ));
        return [];
      }

      const savedRows = await tx.insert(projectThreedMarkers)
        .values(rows)
        .onConflictDoUpdate({
          target: [projectThreedMarkers.projectId, projectThreedMarkers.markerId],
          set: {
            userId: sql`excluded.user_id`,
            threedId: sql`excluded.threed_id`,
            markerType: sql`excluded.marker_type`,
            sourceAssetId: sql`excluded.source_asset_id`,
            name: sql`excluded.name`,
            positionX: sql`excluded.position_x`,
            positionY: sql`excluded.position_y`,
            positionZ: sql`excluded.position_z`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            altitude: sql`excluded.altitude`,
            positionSource: sql`excluded.position_source`,
            color: sql`excluded.color`,
            icon: sql`excluded.icon`,
            label: sql`excluded.label`,
            isVisible: sql`excluded.is_visible`,
            isActive: sql`excluded.is_active`,
            data: sql`excluded.data`,
            metadata: sql`excluded.metadata`,
            savedAt: sql`excluded.saved_at`,
            updatedAt: sql`excluded.updated_at`,
          },
        })
        .returning();

      await tx.delete(projectThreedMarkers).where(and(
        eq(projectThreedMarkers.projectId, projectId),
        eq(projectThreedMarkers.userId, userId),
        notInArray(projectThreedMarkers.markerId, rows.map((row) => row.markerId)),
      ));
      return savedRows;
    });

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        markerCount: saved.length,
        markers: saved,
        savedAt: new Date().toISOString(),
      },
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
    const body = await readJsonBody(request);
    if (
      typeof body === 'object'
      && body !== null
      && !Array.isArray(body)
      && (body as Record<string, unknown>).markerType === 'beds'
    ) {
      const input = parseCreateProjectBedPlacement(body);
      const userId = session.user.id;
      const ownedProject = await requireOwnedProject(userId, input.projectId);
      if (!ownedProject) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      const assignment = await requireActiveThreeDAssignment(userId, input.projectId, input.threedId);
      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'Active ThreeD Project assignment not found' },
          { status: 404 },
        );
      }
      const geographic = getMarkerGeographicValues({
        x: input.positionX,
        y: input.positionY,
        z: input.positionZ,
      }, ownedProject);

      await ensureTableSequence('threed_beds');
      const created = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`project-threed-markers:${input.projectId}`}))`,
        );
        const [bed] = await tx.insert(threedBeds).values({
          userId,
          bedId: `BED-${crypto.randomUUID()}`,
          name: input.name,
          shape: input.shape,
          widthFeet: input.widthFeet.toFixed(2),
          lengthFeet: input.lengthFeet.toFixed(2),
          squareFeet: (input.widthFeet * input.lengthFeet).toFixed(2),
          heightFeet: input.heightFeet.toFixed(2),
          positionX: input.positionX.toFixed(2),
          positionY: input.positionY.toFixed(2),
          positionZ: input.positionZ.toFixed(2),
          rotation: input.rotation.toFixed(2),
          scale: input.scale.toFixed(2),
          isActive: true,
          status: 'active',
          color: input.color,
        }).returning();

        await tx.insert(projectAssets).values({
          userId,
          projectId: input.projectId,
          moduleId: input.threedId,
          moduleType: 'threed',
          assetType: 'threed_beds',
          assetId: bed.id,
          config: {},
          isActive: true,
        });

        const [marker] = await tx.insert(projectThreedMarkers).values({
          userId,
          projectId: input.projectId,
          threedId: input.threedId,
          markerType: 'beds',
          sourceAssetId: bed.id,
          markerId: `beds-${bed.id}`,
          name: bed.name,
          positionX: input.positionX.toFixed(3),
          positionY: input.positionY.toFixed(3),
          positionZ: input.positionZ.toFixed(3),
          ...geographic,
          positionSource: 'asset',
          color: input.color,
          icon: '🧑‍🌾',
          label: bed.name,
          isVisible: true,
          isActive: true,
          data: bed,
          metadata: {
            source: 'project-marker',
            placementKind: 'dashboard-created',
          },
        }).returning();

        return { bed, marker };
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (
      typeof body === 'object'
      && body !== null
      && !Array.isArray(body)
      && (body as Record<string, unknown>).markerType === 'farmbots'
    ) {
      const input = parseCreateProjectFarmBotPlacement(body);
      const userId = session.user.id;
      const ownedProject = await requireOwnedProject(userId, input.projectId);
      if (!ownedProject) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      const assignment = await requireActiveThreeDAssignment(userId, input.projectId, input.threedId);
      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'Active ThreeD Project assignment not found' },
          { status: 404 },
        );
      }
      const geographic = getMarkerGeographicValues({
        x: input.positionX,
        y: input.positionY,
        z: input.positionZ,
      }, ownedProject);
      const [farmbot] = await db.select().from(threedFarmbots).where(and(
        eq(threedFarmbots.id, input.farmbotId),
        eq(threedFarmbots.userId, userId),
        eq(threedFarmbots.isActive, true),
      )).limit(1);
      if (!farmbot) {
        return NextResponse.json(
          { success: false, error: 'FarmBot is not available for Project placement' },
          { status: 404 },
        );
      }

      const markerId = `farmbots-${farmbot.id}`;
      const safeFarmBot = sanitizeFarmBotRecord(farmbot);
      const created = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`project-threed-farmbots:${input.projectId}`}))`,
        );
        const [existingMarker] = await tx.select({ id: projectThreedMarkers.id })
          .from(projectThreedMarkers)
          .where(and(
            eq(projectThreedMarkers.projectId, input.projectId),
            eq(projectThreedMarkers.userId, userId),
            eq(projectThreedMarkers.markerId, markerId),
          ))
          .limit(1);
        if (existingMarker) {
          throw new ProjectFarmBotPlacementInputError(
            'FarmBot is already placed in this ThreeD Project',
          );
        }

        const [existingAssignment] = await tx.select({ id: projectAssets.id })
          .from(projectAssets)
          .where(and(
            eq(projectAssets.projectId, input.projectId),
            eq(projectAssets.moduleId, input.threedId),
            eq(projectAssets.assetType, 'threed_farmbots'),
            eq(projectAssets.assetId, farmbot.id),
          ))
          .limit(1);
        if (existingAssignment) {
          await tx.update(projectAssets).set({
            userId,
            moduleType: 'threed',
            isActive: true,
            updatedAt: new Date(),
          }).where(eq(projectAssets.id, existingAssignment.id));
        } else {
          await tx.insert(projectAssets).values({
            userId,
            projectId: input.projectId,
            moduleId: input.threedId,
            moduleType: 'threed',
            assetType: 'threed_farmbots',
            assetId: farmbot.id,
            config: {},
            isActive: true,
          });
        }

        const markerData = {
          ...safeFarmBot,
          widthFeet: input.widthFeet,
          lengthFeet: input.lengthFeet,
          heightFeet: input.heightFeet,
          scale: input.scale,
          color: input.color,
          positionX: input.positionX,
          positionY: input.positionY,
          positionZ: input.positionZ,
          rotation: input.rotation,
        };
        const [marker] = await tx.insert(projectThreedMarkers).values({
          userId,
          projectId: input.projectId,
          threedId: input.threedId,
          markerType: 'farmbots',
          sourceAssetId: farmbot.id,
          markerId,
          name: farmbot.name,
          positionX: input.positionX.toFixed(3),
          positionY: input.positionY.toFixed(3),
          positionZ: input.positionZ.toFixed(3),
          ...geographic,
          positionSource: 'asset',
          color: input.color,
          icon: '🤖',
          label: farmbot.name,
          isVisible: true,
          isActive: true,
          data: markerData,
          metadata: {
            source: 'project-marker',
            placementKind: 'farmbot-library',
          },
        }).returning();
        return { farmbot: safeFarmBot, marker };
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (
      typeof body === 'object'
      && body !== null
      && !Array.isArray(body)
      && (body as Record<string, unknown>).markerType === 'plantings'
    ) {
      const input = parseCreateProjectPlantingPlacement(body);
      const userId = session.user.id;
      const ownedProject = await requireOwnedProject(userId, input.projectId);
      if (!ownedProject) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      const assignment = await requireActiveThreeDAssignment(userId, input.projectId, input.threedId);
      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'Active ThreeD Project assignment not found' },
          { status: 404 },
        );
      }
      const plant = await readOwnedActivePlant(userId, input.plantId);
      if (!plant) {
        return NextResponse.json({ success: false, error: 'Plant not found' }, { status: 404 });
      }
      const assignedBed = input.bedId
        ? await requireAssignedBed(userId, input.projectId, input.threedId, input.bedId)
        : null;
      if (input.bedId && !assignedBed) {
        return NextResponse.json(
          { success: false, error: 'Assigned Project Bed not found' },
          { status: 404 },
        );
      }

      const model = plant.modelId
        ? (await db.select().from(threedModels)
            .where(and(eq(threedModels.id, plant.modelId), eq(threedModels.isActive, true)))
            .limit(1))[0] ?? null
        : null;

      await ensureTableSequence('threed_plantings');
      const created = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`project-threed-markers:${input.projectId}`}))`,
        );
        const offsets = calculateProjectPlantingVisualPositions(
          input.quantity,
          input.spacingInches,
        );
        const positions = offsets.map((offset) => ({
          x: input.positionX + offset.x,
          y: input.positionY,
          z: input.positionZ + offset.z,
        }));
        const plantings = [];
        const markers = [];
        for (const position of positions) {
          const positionX = position.x;
          const positionY = position.y;
          const positionZ = position.z;
          const geographic = getMarkerGeographicValues(position, ownedProject);
          const [planting] = await tx.insert(threedPlantings).values({
            userId,
            plantingId: `PLANTING-${crypto.randomUUID()}`,
            plantId: input.plantId,
            bedId: input.bedId,
            customModelId: null,
            modelScale: input.modelScale.toFixed(2),
            modelOffset: { x: 0, y: 0, z: 0 },
            quantity: 1,
            spacingInches: input.spacingInches,
            positionX: positionX.toFixed(2),
            positionY: positionY.toFixed(2),
            positionZ: positionZ.toFixed(2),
            plantedDate: new Date().toISOString(),
            isActive: true,
            status: 'planted',
            growthStage: 'seed',
            health: 'good',
          }).returning();

          await tx.insert(projectAssets).values({
            userId,
            projectId: input.projectId,
            moduleId: input.threedId,
            moduleType: 'threed',
            assetType: 'threed_plantings',
            assetId: planting.id,
            config: {},
            isActive: true,
          });

          const markerData = {
            ...planting,
            quantity: 1,
            plantName: plant.commonName,
            commonName: plant.commonName,
            scientificName: plant.scientificName,
            plant,
            model,
          };
          const [marker] = await tx.insert(projectThreedMarkers).values({
            userId,
            projectId: input.projectId,
            threedId: input.threedId,
            markerType: 'plantings',
            sourceAssetId: planting.id,
            markerId: `plantings-${planting.id}`,
            name: plant.commonName,
            positionX: positionX.toFixed(3),
            positionY: positionY.toFixed(3),
            positionZ: positionZ.toFixed(3),
            ...geographic,
            positionSource: 'asset',
            color: '#22c55e',
            icon: '🌱',
            label: plant.commonName,
            isVisible: true,
            isActive: true,
            data: markerData,
            metadata: { source: 'project-marker' },
          }).returning();
          plantings.push(planting);
          markers.push(marker);
        }
        return { plantings, markers };
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (
      typeof body === 'object'
      && body !== null
      && !Array.isArray(body)
      && (body as Record<string, unknown>).markerType === 'characters'
    ) {
      const input = parseCreateProjectCharacterPlacement(body);
      const userId = session.user.id;
      const ownedProject = await requireOwnedProject(userId, input.projectId);
      if (!ownedProject) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      const assignment = await requireActiveThreeDAssignment(userId, input.projectId, input.threedId);
      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'Active ThreeD Project assignment not found' },
          { status: 404 },
        );
      }
      const geographic = getMarkerGeographicValues({
        x: input.positionX,
        y: input.positionY,
        z: input.positionZ,
      }, ownedProject);
      const eligible = await readEligibleCharacter(userId, input.characterId);
      if (!eligible) {
        return NextResponse.json(
          { success: false, error: 'Character is not eligible for Character Library placement' },
          { status: 404 },
        );
      }

      const positionX = input.positionX.toFixed(3);
      const positionY = input.positionY.toFixed(3);
      const positionZ = input.positionZ.toFixed(3);
      const markerId = `characters-${eligible.character.id}`;
      const created = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`project-threed-characters:${input.projectId}`}))`,
        );
        const [existingMarker] = await tx.select({ id: projectThreedMarkers.id })
          .from(projectThreedMarkers)
          .where(and(
            eq(projectThreedMarkers.projectId, input.projectId),
            eq(projectThreedMarkers.userId, userId),
            eq(projectThreedMarkers.markerId, markerId),
          ))
          .limit(1);
        if (existingMarker) {
          throw new ProjectCharacterPlacementInputError(
            'Character is already placed in this ThreeD Project',
          );
        }
        if (eligible.libraryAccess.runtime === 'ecctrl') {
          const [occupiedSpawn] = await tx.select({ markerId: projectThreedMarkers.markerId })
            .from(projectThreedMarkers)
            .where(and(
              eq(projectThreedMarkers.projectId, input.projectId),
              eq(projectThreedMarkers.userId, userId),
              eq(projectThreedMarkers.markerType, 'characters'),
              eq(projectThreedMarkers.isActive, true),
              eq(projectThreedMarkers.positionX, positionX),
              eq(projectThreedMarkers.positionY, positionY),
              eq(projectThreedMarkers.positionZ, positionZ),
            ))
            .limit(1);
          if (occupiedSpawn) {
            throw new ProjectCharacterPlacementInputError(
              `Character spawn is already occupied by ${occupiedSpawn.markerId}`,
            );
          }
        }

        const [existingAssignment] = await tx.select({ id: projectAssets.id })
          .from(projectAssets)
          .where(and(
            eq(projectAssets.projectId, input.projectId),
            eq(projectAssets.moduleId, input.threedId),
            eq(projectAssets.assetType, 'threed_characters'),
            eq(projectAssets.assetId, eligible.character.id),
          ))
          .limit(1);
        if (existingAssignment) {
          await tx.update(projectAssets).set({
            userId,
            moduleType: 'threed',
            isActive: true,
            updatedAt: new Date(),
          }).where(eq(projectAssets.id, existingAssignment.id));
        } else {
          await tx.insert(projectAssets).values({
            userId,
            projectId: input.projectId,
            moduleId: input.threedId,
            moduleType: 'threed',
            assetType: 'threed_characters',
            assetId: eligible.character.id,
            config: {},
            isActive: true,
          });
        }

        const markerData = {
          ...eligible.character,
          model: eligible.model,
          positionX: input.positionX,
          positionY: input.positionY,
          positionZ: input.positionZ,
          rotation: input.rotation,
          scaleMultiplier: input.scaleMultiplier,
        };
        const [marker] = await tx.insert(projectThreedMarkers).values({
          userId,
          projectId: input.projectId,
          threedId: input.threedId,
          markerType: 'characters',
          sourceAssetId: eligible.character.id,
          markerId,
          name: eligible.character.name,
          positionX,
          positionY,
          positionZ,
          ...geographic,
          positionSource: 'asset',
          color: '#8b5cf6',
          icon: '🧚',
          label: eligible.character.name,
          isVisible: true,
          isActive: true,
          data: markerData,
          metadata: {
            source: 'project-marker',
            placementKind: 'character-library',
            characterRuntime: eligible.libraryAccess.runtime,
          },
        }).returning();
        return {
          character: eligible.character,
          marker,
          libraryAccess: eligible.libraryAccess,
        };
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    const input = parseCreateProjectModelInstance(body);
    const userId = session.user.id;
    const ownedProject = await requireOwnedProject(userId, input.projectId);
    if (!ownedProject) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const assignment = await requireActiveThreeDAssignment(userId, input.projectId, input.threedId);
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Active ThreeD Project assignment not found' },
        { status: 404 },
      );
    }
    const geographic = getMarkerGeographicValues({
      x: input.positionX,
      y: input.positionY,
      z: input.positionZ,
    }, ownedProject);
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
        ...geographic,
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
    if (
      error instanceof ProjectModelInstanceInputError
      || error instanceof ProjectBedPlacementInputError
      || error instanceof ProjectPlantingPlacementInputError
      || error instanceof ProjectCharacterPlacementInputError
      || error instanceof ProjectFarmBotPlacementInputError
    ) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Failed to create Project ThreeD marker', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      ...getSafeDatabaseError(error),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to create Project ThreeD marker' },
      { status: 500 },
    );
  }
}

async function updateProjectMarker(request: NextRequest, id: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const ownerId = session.user.id;

  try {
    const body = await readJsonBody(request);
    const marker = await readOwnedProjectMarker(ownerId, id);
    if (!marker) {
      return NextResponse.json({ success: false, error: 'Project marker not found' }, { status: 404 });
    }
    const ownedProject = await requireOwnedProject(ownerId, marker.projectId);
    if (!ownedProject) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    const currentData = marker.data && typeof marker.data === 'object' ? marker.data : {};

    if (marker.markerType === 'characters') {
      const updateBody = typeof body === 'object' && body !== null && !Array.isArray(body)
        ? body as Record<string, unknown>
        : {};
      const update = parseUpdateProjectCharacterPlacement({
        ...updateBody,
        rotation: updateBody.rotation ?? (currentData as Record<string, unknown>).rotation ?? 0,
        scaleMultiplier: updateBody.scaleMultiplier
          ?? (currentData as Record<string, unknown>).scaleMultiplier
          ?? 1,
      });
      const positionX = update.positionX.toFixed(3);
      const positionY = update.positionY.toFixed(3);
      const positionZ = update.positionZ.toFixed(3);
      const geographic = getMarkerGeographicValues({
        x: update.positionX,
        y: update.positionY,
        z: update.positionZ,
      }, ownedProject);
      const updated = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`project-threed-characters:${marker.projectId}`}))`,
        );
        const occupiedSpawns = await tx.select({
          id: projectThreedMarkers.id,
          markerId: projectThreedMarkers.markerId,
        }).from(projectThreedMarkers).where(and(
          eq(projectThreedMarkers.projectId, marker.projectId),
          eq(projectThreedMarkers.userId, ownerId),
          eq(projectThreedMarkers.markerType, 'characters'),
          eq(projectThreedMarkers.isActive, true),
          eq(projectThreedMarkers.positionX, positionX),
          eq(projectThreedMarkers.positionY, positionY),
          eq(projectThreedMarkers.positionZ, positionZ),
        ));
        const occupiedSpawn = occupiedSpawns.find((candidate) => candidate.id !== id);
        if (occupiedSpawn) {
          throw new ProjectCharacterPlacementInputError(
            `Character spawn is already occupied by ${occupiedSpawn.markerId}`,
          );
        }
        const [saved] = await tx.update(projectThreedMarkers).set({
          positionX,
          positionY,
          positionZ,
          ...geographic,
          positionSource: 'asset',
          data: {
            ...currentData,
            positionX: update.positionX,
            positionY: update.positionY,
            positionZ: update.positionZ,
            rotation: update.rotation,
            scaleMultiplier: update.scaleMultiplier,
          },
          updatedAt: new Date(),
        }).where(and(
          eq(projectThreedMarkers.id, id),
          eq(projectThreedMarkers.userId, ownerId),
          eq(projectThreedMarkers.markerType, 'characters'),
        )).returning();
        return saved;
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (marker.markerType === 'beds') {
      const update = parseUpdateProjectBedPlacement(body);
      const geographic = getMarkerGeographicValues({
        x: update.positionX,
        y: update.positionY,
        z: update.positionZ,
      }, ownedProject);
      const [updated] = await db.update(projectThreedMarkers).set({
        positionX: update.positionX.toFixed(3),
        positionY: update.positionY.toFixed(3),
        positionZ: update.positionZ.toFixed(3),
        ...geographic,
        positionSource: 'asset',
        color: update.color,
        data: {
          ...currentData,
          widthFeet: update.widthFeet,
          lengthFeet: update.lengthFeet,
          heightFeet: update.heightFeet,
          color: update.color,
          scale: update.scale,
          positionX: update.positionX,
          positionY: update.positionY,
          positionZ: update.positionZ,
          rotation: update.rotation,
        },
        updatedAt: new Date(),
      }).where(and(
        eq(projectThreedMarkers.id, id),
        eq(projectThreedMarkers.userId, session.user.id),
        eq(projectThreedMarkers.markerType, 'beds'),
      )).returning();
      return NextResponse.json({ success: true, data: updated });
    }

    if (marker.markerType === 'plantings') {
      const update = parseUpdateProjectPlantingPlacement(body);
      const geographic = getMarkerGeographicValues({
        x: update.positionX,
        y: update.positionY,
        z: update.positionZ,
      }, ownedProject);
      const [updated] = await db.update(projectThreedMarkers).set({
        positionX: update.positionX.toFixed(3),
        positionY: update.positionY.toFixed(3),
        positionZ: update.positionZ.toFixed(3),
        ...geographic,
        positionSource: 'asset',
        data: {
          ...currentData,
          quantity: 1,
          modelScale: update.modelScale,
          positionX: update.positionX,
          positionY: update.positionY,
          positionZ: update.positionZ,
        },
        updatedAt: new Date(),
      }).where(and(
        eq(projectThreedMarkers.id, id),
        eq(projectThreedMarkers.userId, session.user.id),
        eq(projectThreedMarkers.markerType, 'plantings'),
      )).returning();
      return NextResponse.json({ success: true, data: updated });
    }

    if (marker.markerType === 'farmbots') {
      const update = parseUpdateProjectFarmBotPlacement(body);
      const geographic = getMarkerGeographicValues({
        x: update.positionX,
        y: update.positionY,
        z: update.positionZ,
      }, ownedProject);
      const [updated] = await db.update(projectThreedMarkers).set({
        positionX: update.positionX.toFixed(3),
        positionY: update.positionY.toFixed(3),
        positionZ: update.positionZ.toFixed(3),
        ...geographic,
        positionSource: 'asset',
        color: update.color,
        data: {
          ...currentData,
          widthFeet: update.widthFeet,
          lengthFeet: update.lengthFeet,
          heightFeet: update.heightFeet,
          scale: update.scale,
          color: update.color,
          positionX: update.positionX,
          positionY: update.positionY,
          positionZ: update.positionZ,
          rotation: update.rotation,
        },
        updatedAt: new Date(),
      }).where(and(
        eq(projectThreedMarkers.id, id),
        eq(projectThreedMarkers.userId, ownerId),
        eq(projectThreedMarkers.markerType, 'farmbots'),
      )).returning();
      return NextResponse.json({ success: true, data: updated });
    }

    if (marker.markerType !== 'models') {
      return NextResponse.json(
        { success: false, error: 'Marker type is not editable here' },
        { status: 400 },
      );
    }

    const update = parseUpdateProjectModelInstance(body);
    const values: Partial<typeof projectThreedMarkers.$inferInsert> = { updatedAt: new Date() };
    if (update.instanceName !== undefined) {
      values.name = update.instanceName || marker.name;
      values.label = update.instanceName || marker.label;
    }
    if (update.positionX !== undefined) values.positionX = update.positionX.toFixed(3);
    if (update.positionY !== undefined) values.positionY = update.positionY.toFixed(3);
    if (update.positionZ !== undefined) values.positionZ = update.positionZ.toFixed(3);
    if (
      update.positionX !== undefined
      || update.positionY !== undefined
      || update.positionZ !== undefined
    ) {
      const geographic = getMarkerGeographicValues({
        x: update.positionX ?? Number(marker.positionX),
        y: update.positionY ?? Number(marker.positionY),
        z: update.positionZ ?? Number(marker.positionZ),
      }, ownedProject);
      values.latitude = geographic.latitude;
      values.longitude = geographic.longitude;
      values.altitude = geographic.altitude;
    }
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
    if (
      error instanceof ProjectModelInstanceInputError
      || error instanceof ProjectBedPlacementInputError
      || error instanceof ProjectPlantingPlacementInputError
      || error instanceof ProjectCharacterPlacementInputError
      || error instanceof ProjectFarmBotPlacementInputError
    ) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Failed to update Project ThreeD marker', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to update Project ThreeD marker' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const id = parsePositiveId(new URL(request.url).searchParams.get('id'));
  return id ? updateProjectMarker(request, id) : saveSnapshot(request);
}

export async function PATCH(request: NextRequest) {
  const id = parsePositiveId(new URL(request.url).searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ success: false, error: 'Invalid marker ID' }, { status: 400 });
  }
  return updateProjectMarker(request, id);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const id = parsePositiveId(new URL(request.url).searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ success: false, error: 'Invalid marker ID' }, { status: 400 });
  }
  const marker = await readOwnedProjectMarker(userId, id);
  const snapshotOnly = new URL(request.url).searchParams.get('snapshotOnly') === '1';
  if (snapshotOnly) {
    if (!marker) {
      return NextResponse.json({ success: false, error: 'Project marker not found' }, { status: 404 });
    }
    const [deleted] = await db.delete(projectThreedMarkers).where(and(
      eq(projectThreedMarkers.id, id),
      eq(projectThreedMarkers.userId, userId),
    )).returning({ id: projectThreedMarkers.id });
    return NextResponse.json({ success: true, data: deleted });
  }
  if (!marker || !['models', 'plantings', 'beds', 'characters', 'farmbots'].includes(marker.markerType)) {
    return NextResponse.json({ success: false, error: 'Project marker not found' }, { status: 404 });
  }
  if (marker.markerType === 'characters') {
    const sourceAssetId = Number(marker.sourceAssetId);
    if (!Number.isSafeInteger(sourceAssetId) || sourceAssetId <= 0) {
      return NextResponse.json({ success: false, error: 'Character source not found' }, { status: 404 });
    }
    const deleted = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`project-threed-characters:${marker.projectId}`}))`,
      );
      const [deletedMarker] = await tx.delete(projectThreedMarkers).where(and(
        eq(projectThreedMarkers.id, id),
        eq(projectThreedMarkers.userId, userId),
        eq(projectThreedMarkers.markerType, 'characters'),
      )).returning({ id: projectThreedMarkers.id });
      await tx.delete(projectAssets).where(and(
        eq(projectAssets.userId, userId),
        eq(projectAssets.projectId, marker.projectId),
        eq(projectAssets.moduleId, marker.threedId),
        eq(projectAssets.assetType, 'threed_characters'),
        eq(projectAssets.assetId, sourceAssetId),
      ));
      return { marker: deletedMarker, sourceAssetId, sourceDeleted: false };
    });
    return NextResponse.json({ success: true, data: deleted });
  }
  if (marker.markerType === 'farmbots') {
    const sourceAssetId = Number(marker.sourceAssetId);
    if (!Number.isSafeInteger(sourceAssetId) || sourceAssetId <= 0) {
      return NextResponse.json({ success: false, error: 'FarmBot source not found' }, { status: 404 });
    }
    const deleted = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`project-threed-farmbots:${marker.projectId}`}))`,
      );
      const [deletedMarker] = await tx.delete(projectThreedMarkers).where(and(
        eq(projectThreedMarkers.id, id),
        eq(projectThreedMarkers.userId, userId),
        eq(projectThreedMarkers.markerType, 'farmbots'),
      )).returning({ id: projectThreedMarkers.id });
      await tx.delete(projectAssets).where(and(
        eq(projectAssets.userId, userId),
        eq(projectAssets.projectId, marker.projectId),
        eq(projectAssets.moduleId, marker.threedId),
        eq(projectAssets.assetType, 'threed_farmbots'),
        eq(projectAssets.assetId, sourceAssetId),
      ));
      return { marker: deletedMarker, sourceAssetId, sourceDeleted: false };
    });
    return NextResponse.json({ success: true, data: deleted });
  }
  if (marker.markerType === 'beds') {
    const metadata = marker.metadata && typeof marker.metadata === 'object' && !Array.isArray(marker.metadata)
      ? marker.metadata as Record<string, unknown>
      : {};
    const isDashboardCreated = metadata.placementKind === 'dashboard-created';
    const sourceAssetId = Number(marker.sourceAssetId);
    if (!Number.isSafeInteger(sourceAssetId) || sourceAssetId <= 0) {
      return NextResponse.json({ success: false, error: 'Bed source not found' }, { status: 404 });
    }
    const assignedPlantings = await db.select({ id: threedPlantings.id })
      .from(threedPlantings)
      .where(and(
        eq(threedPlantings.userId, userId),
        eq(threedPlantings.bedId, sourceAssetId),
        eq(threedPlantings.isActive, true),
      ))
      .limit(1);
    if (assignedPlantings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Move or delete the Plantings assigned to this Bed before deleting it',
      }, { status: 409 });
    }
    const deleted = await db.transaction(async (tx) => {
      const [deletedMarker] = await tx.delete(projectThreedMarkers).where(and(
        eq(projectThreedMarkers.id, id),
        eq(projectThreedMarkers.userId, userId),
        eq(projectThreedMarkers.markerType, 'beds'),
      )).returning({ id: projectThreedMarkers.id });

      await tx.delete(projectAssets).where(and(
        eq(projectAssets.userId, userId),
        eq(projectAssets.projectId, marker.projectId),
        eq(projectAssets.moduleId, marker.threedId),
        eq(projectAssets.assetType, 'threed_beds'),
        eq(projectAssets.assetId, sourceAssetId),
      ));
      if (!isDashboardCreated) {
        return { marker: deletedMarker, sourceAssetId, sourceDeleted: false };
      }
      const [source] = await tx.delete(threedBeds).where(and(
        eq(threedBeds.id, sourceAssetId),
        eq(threedBeds.userId, userId),
      )).returning({ id: threedBeds.id });
      return { marker: deletedMarker, sourceAssetId, sourceDeleted: Boolean(source) };
    });
    return NextResponse.json({ success: true, data: deleted });
  }
  if (marker.markerType === 'plantings') {
    const sourceAssetId = Number(marker.sourceAssetId);
    if (!Number.isSafeInteger(sourceAssetId) || sourceAssetId <= 0) {
      return NextResponse.json({ success: false, error: 'Planting source not found' }, { status: 404 });
    }
    const deleted = await db.transaction(async (tx) => {
      await tx.delete(projectThreedMarkers).where(and(
        eq(projectThreedMarkers.id, id),
        eq(projectThreedMarkers.userId, userId),
        eq(projectThreedMarkers.markerType, 'plantings'),
      ));
      await tx.delete(projectAssets).where(and(
        eq(projectAssets.userId, userId),
        eq(projectAssets.projectId, marker.projectId),
        eq(projectAssets.moduleId, marker.threedId),
        eq(projectAssets.assetType, 'threed_plantings'),
        eq(projectAssets.assetId, sourceAssetId),
      ));
      const [planting] = await tx.delete(threedPlantings).where(and(
        eq(threedPlantings.id, sourceAssetId),
        eq(threedPlantings.userId, userId),
      )).returning({ id: threedPlantings.id });
      return planting;
    });
    return NextResponse.json({ success: true, data: deleted });
  }
  if (!await readOwnedModelMarker(userId, id)) {
    return NextResponse.json({ success: false, error: 'Model marker not found' }, { status: 404 });
  }
  const [deleted] = await db.delete(projectThreedMarkers).where(and(
    eq(projectThreedMarkers.id, id),
    eq(projectThreedMarkers.userId, userId),
    eq(projectThreedMarkers.markerType, 'models'),
  )).returning({ id: projectThreedMarkers.id });
  return NextResponse.json({ success: true, data: deleted });
}
