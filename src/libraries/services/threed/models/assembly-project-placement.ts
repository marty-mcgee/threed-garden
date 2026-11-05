import { createHash } from 'node:crypto';
import { and, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import type { db } from '@/libraries/db/client';
import { project, projectAssets, projectThreed, projectThreedMarkers } from '@/libraries/schema/project';
import { threed, threedAssembly, threedAssemblyComponents, threedAssemblyRevisions, threedModels } from '@/libraries/schema/threed';
import { readGuid, readInteger, readStrictObject } from '@/libraries/utils/input-validation';
import { projectLocalPositionToGeographicPosition } from '../markers/map-coordinate-core';
import { MAX_PROJECT_MARKER_SNAPSHOT_ROWS } from '../markers/project-marker-snapshot-core';
import { calculateThreeDModelGroundedY, calculateThreeDModelInstanceScale } from '../markers/model-visual-fit-core';
import { buildThreeDRuntimeMarkerResult } from '../markers/runtime-marker-builder';
import { MAX_ASSEMBLY_COMPONENTS, parseAssemblyDefinition, parseAssemblyTransform, resolveAssemblyComponents, type AssemblyTransform } from './assembly-group-core';
import { modelSelection } from './model-primary-file';
import { resolveActiveModelGeometry } from './model-source-core';
import { refreshModelMarkerData } from './model-snapshot-assets';

export class AssemblyProjectPlacementError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'AssemblyProjectPlacementError';
  }
}

export interface AssemblyProjectPlacementInput {
  projectId: number;
  threedId: number;
  assemblyId: string;
  assemblyRevision: number;
  requestId: string;
  transform: AssemblyTransform;
}

export function parseAssemblyProjectPlacement(value: unknown): AssemblyProjectPlacementInput {
  const input = readStrictObject(value, [
    'projectId',
    'threedId',
    'assemblyId',
    'assemblyRevision',
    'requestId',
    'transform',
  ]);
  return {
    projectId: readInteger(input.projectId, 1, 2147483647),
    threedId: readInteger(input.threedId, 1, 2147483647),
    assemblyId: readGuid(input.assemblyId).toLowerCase(),
    assemblyRevision: readInteger(input.assemblyRevision, 1, 2147483647),
    requestId: readGuid(input.requestId).toLowerCase(),
    transform: parseAssemblyTransform(input.transform),
  };
}

function componentMarkerId(requestId: string, componentId: string) {
  return `models-assembly-${requestId}-${createHash('sha256').update(componentId).digest('hex')}`;
}

/** One authorized command creates ordinary Project Model markers; the saved
 * Assembly definition remains unchanged. Existing markers are never repositioned
 * by a retry. Receipt lifetime follows the existing marker rows, not a new ledger.
 */
export async function placeAssemblyInProject(database: typeof db, ownerId: string, value: unknown) {
  const input = parseAssemblyProjectPlacement(value);
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return database.transaction(async tx => {
    // Same lock/order as Project marker Save and direct placement.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`project-threed-markers:${input.projectId}`}))`);
    const [ownedProject] = await tx.select().from(project).where(and(
      eq(project.id, input.projectId),
      eq(project.userId, ownerId),
      eq(project.isActive, true),
    )).limit(1).for('update');
    if (!ownedProject) throw new AssemblyProjectPlacementError('Project not found.', 404);
    const [assignment] = await tx.select({
      id: projectThreed.id,
    }).from(projectThreed).innerJoin(threed, and(
      eq(threed.id, projectThreed.threedId),
      eq(threed.userId, ownerId),
      eq(threed.isActive, true),
    )).where(and(
      eq(projectThreed.projectId, input.projectId),
      eq(projectThreed.threedId, input.threedId),
      eq(projectThreed.userId, ownerId),
      eq(projectThreed.isActive, true),
    )).limit(1).for('share');
    if (!assignment) throw new AssemblyProjectPlacementError('Active ThreeD Project assignment not found.', 404);
    const [assembly] = await tx.select({
      id: threedAssembly.id,
    }).from(threedAssembly).where(and(
      eq(threedAssembly.id, input.assemblyId),
      eq(threedAssembly.userId, ownerId),
    )).for('share');
    if (!assembly) throw new AssemblyProjectPlacementError('Assembly not found.', 404);

    const existing = await tx.select().from(projectThreedMarkers).where(and(
      eq(projectThreedMarkers.projectId, input.projectId),
      eq(projectThreedMarkers.userId, ownerId),
      like(projectThreedMarkers.markerId, `models-assembly-${input.requestId}-%`),
    )).orderBy(projectThreedMarkers.id).limit(MAX_ASSEMBLY_COMPONENTS + 1).for('update');
    if (existing.length) {
      const complete = existing.every(marker => {
        const metadata = marker.metadata as Record<string, unknown> | null;
        const receipt = metadata?.assemblyPlacement as Record<string, unknown> | undefined;
        return receipt?.fingerprint === fingerprint
          && receipt.componentCount === existing.length
          && typeof receipt.componentId === 'string'
          && marker.markerId === componentMarkerId(input.requestId, receipt.componentId)
          && marker.threedId === input.threedId
          && marker.markerType === 'models';
      });
      if (!complete || existing.length > MAX_ASSEMBLY_COMPONENTS) {
        throw new AssemblyProjectPlacementError('This placement request was already used or its components changed. Review the Project before placing another Assembly.', 409);
      }
      return {
        markers: existing,
        placementId: input.requestId,
        assemblyId: input.assemblyId,
        assemblyRevision: input.assemblyRevision,
        replayed: true,
      };
    }

    const [revision] = await tx.select().from(threedAssemblyRevisions).where(
      eq(threedAssemblyRevisions.assemblyId, input.assemblyId),
    ).orderBy(desc(threedAssemblyRevisions.revision)).limit(1);
    if (!revision || revision.revision !== input.assemblyRevision) {
      throw new AssemblyProjectPlacementError('This Assembly changed elsewhere. Reload its saved composition before placing it.', 409);
    }
    const components = await tx.select().from(threedAssemblyComponents).where(and(
      eq(threedAssemblyComponents.assemblyId, input.assemblyId),
      eq(threedAssemblyComponents.revision, input.assemblyRevision),
    )).orderBy(threedAssemblyComponents.ordinal);
    const definition = parseAssemblyDefinition({
      formatVersion: revision.formatVersion,
      id: input.assemblyId,
      ownerId,
      name: revision.name,
      revision: revision.revision,
      components: components.map(component => ({
        id: component.componentId,
        modelId: component.modelId,
        label: component.label,
        transform: {
          position: {
            x: component.positionX,
            y: component.positionY,
            z: component.positionZ,
          },
          rotation: {
            x: component.rotationX,
            y: component.rotationY,
            z: component.rotationZ,
          },
          scale: component.scale,
        },
      })),
    });
    const modelIds = [...new Set(definition.components.map(component => component.modelId))];
    const models = await tx.select(modelSelection()).from(threedModels).where(and(
      inArray(threedModels.id, modelIds),
      eq(threedModels.isActive, true),
      eq(threedModels.status, 'active'),
      sql`${threedModels.usedByCharacters} IS NOT TRUE`,
      or(
        eq(threedModels.userId, ownerId),
        and(eq(threedModels.isPublic, true), eq(threedModels.isLibraryItem, true)),
      ),
    )).for('share');
    if (models.length !== modelIds.length || models.some(model => {
      const geometry = resolveActiveModelGeometry(model);
      return !geometry.filePath && geometry.modelType !== 'procedural';
    })) {
      throw new AssemblyProjectPlacementError('A referenced Model is unavailable or is no longer eligible for Scene placement.', 409);
    }
    // Snapshot Save requires one unambiguous active ThreeD assignment per asset.
    const otherAssignments = await tx.select({
      moduleId: projectAssets.moduleId,
    }).from(projectAssets).innerJoin(projectThreed, and(
      eq(projectThreed.projectId, projectAssets.projectId),
      eq(projectThreed.threedId, projectAssets.moduleId),
      eq(projectThreed.userId, ownerId),
      eq(projectThreed.isActive, true),
    )).where(and(
      eq(projectAssets.projectId, input.projectId),
      eq(projectAssets.moduleType, 'threed'),
      eq(projectAssets.assetType, 'threed_models'),
      inArray(projectAssets.assetId, modelIds),
      eq(projectAssets.isActive, true),
    )).for('share');
    if (otherAssignments.some(row => row.moduleId !== input.threedId)) {
      throw new AssemblyProjectPlacementError('A component Model belongs to another active ThreeD Module in this Project. Choose that Module or review its asset assignments.', 409);
    }
    const [count] = await tx.select({
      total: sql<number>`count(*)`.mapWith(Number),
    }).from(projectThreedMarkers).where(
      eq(projectThreedMarkers.projectId, input.projectId),
    );
    if (Number(count.total) + definition.components.length > MAX_PROJECT_MARKER_SNAPSHOT_ROWS) {
      throw new AssemblyProjectPlacementError('This Assembly would exceed the Project marker limit.', 409);
    }

    const resolved = resolveAssemblyComponents(definition, {
      id: input.requestId,
      ownerId,
      projectId: input.projectId,
      assemblyId: input.assemblyId,
      assemblyRevision: input.assemblyRevision,
      transform: input.transform,
    });
    const modelsById = new Map(models.map(model => [model.id, model]));
    const rows = resolved.map((component, index) => {
      const position = new Vector3();
      const orientation = new Quaternion();
      const scale = new Vector3();
      new Matrix4().fromArray(component.worldMatrix).decompose(position, orientation, scale);
      const model = modelsById.get(component.modelId)!;
      const geometry = resolveActiveModelGeometry(model);
      const baseScale = calculateThreeDModelInstanceScale(model.scale, 1);
      const componentScale = input.transform.scale * definition.components[index].transform.scale;
      let instanceScale = componentScale;
      if (geometry.filePath) {
        // AssemblyCanvas applies the catalog scale inside the loader, then its
        // configured offset. Scene applies base × instance scale outside. Move
        // only this new instance to preserve the same final geometry matrix.
        const offset = new Vector3(
          parseFloat(String(model.offsetX || '0')),
          calculateThreeDModelGroundedY(0, parseFloat(String(model.offsetY || '0'))),
          parseFloat(String(model.offsetZ || '0')),
        );
        position.add(offset.multiplyScalar(componentScale * (1 - baseScale)).applyQuaternion(orientation));
      } else if (model.modelType === 'procedural' && !model.filePath) {
        // Match the existing AssemblyCanvas procedural wrapper; the Scene's
        // native fallback has no catalog offset/rotation wrapper of its own.
        const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
        position.add(new Vector3(
          finite(model.offsetX),
          finite(model.offsetY),
          finite(model.offsetZ),
        ).multiplyScalar(componentScale).applyQuaternion(orientation));
        orientation.multiply(new Quaternion().setFromEuler(new Euler(0, finite(model.rotationY) * Math.PI / 180, 0, 'XYZ')));
        instanceScale = componentScale * Math.max(0.01, finite(model.scale, 1)) / baseScale;
      } else {
        // A retained but inactive File is not loaded when activeSource is Shape.
        // AssemblyCanvas renders that fallback at one unit inside the component.
        instanceScale = componentScale / baseScale;
      }
      const rotation = new Euler().setFromQuaternion(orientation, 'XYZ');
      // Composed values also need bounds: two valid transforms can overflow them.
      const transform = parseAssemblyTransform({
        position: {
          x: position.x,
          y: position.y,
          z: position.z,
        },
        rotation: {
          x: rotation.x,
          y: rotation.y,
          z: rotation.z,
        },
        // Both transforms require positive uniform scale. Multiplication avoids
        // decompose rounding a valid minimum scale just below its lower bound.
        scale: instanceScale,
      });
      const geographic = ownedProject.originLatitude === null || ownedProject.originLongitude === null
        ? null
        : projectLocalPositionToGeographicPosition(transform.position, {
          latitude: Number(ownedProject.originLatitude),
          longitude: Number(ownedProject.originLongitude),
          altitude: Number(ownedProject.originAltitude),
          headingDegrees: Number(ownedProject.headingDegrees),
          metersPerSceneUnit: Number(ownedProject.metersPerSceneUnit),
        });
      // Assembly labels allow 255 characters; Project snapshots allow 250.
      const label = definition.components[index].label.slice(0, 250).trimEnd();
      return {
        userId: ownerId,
        projectId: input.projectId,
        threedId: input.threedId,
        markerType: 'models' as const,
        sourceAssetId: component.modelId,
        markerId: componentMarkerId(input.requestId, component.componentId),
        name: label,
        positionX: transform.position.x.toFixed(3),
        positionY: transform.position.y.toFixed(3),
        positionZ: transform.position.z.toFixed(3),
        latitude: geographic?.latitude.toFixed(7) ?? null,
        longitude: geographic?.longitude.toFixed(7) ?? null,
        altitude: geographic?.altitude.toFixed(3) ?? null,
        positionSource: 'asset' as const,
        color: '#06b6d4',
        icon: '🧊',
        label,
        isVisible: true,
        isActive: true,
        data: {
          modelId: component.modelId,
          rotationX: transform.rotation.x,
          rotationYInstance: transform.rotation.y,
          rotationZ: transform.rotation.z,
          scaleMultiplier: transform.scale,
        },
        metadata: {
          source: 'project-marker',
          placementRole: 'object',
          assemblyPlacement: {
            requestId: input.requestId,
            assemblyId: input.assemblyId,
            assemblyRevision: input.assemblyRevision,
            componentId: component.componentId,
            componentCount: definition.components.length,
            fingerprint,
          },
        },
      };
    });
    // The Assembly editor permits a wider scale range than Project runtime.
    // Validate the exact hydrated representation that the Scene will receive,
    // including catalog dimensions/scales, before persisting any part of it.
    const runtime = buildThreeDRuntimeMarkerResult({
      plants: [],
      beds: [],
      characters: [],
      layers: [],
      farmbots: [],
      models: [],
      plantings: [],
      tasks: [],
      harvests: [],
      weatherLogs: [],
      projectThreedMarkers: rows.map((row, index) => ({
        ...row,
        // The insert supplies the real row identity; this positive temporary
        // identity only exercises the existing runtime validation contract.
        id: index + 1,
        data: refreshModelMarkerData(row.data, row.sourceAssetId, modelsById.get(row.sourceAssetId)),
      })),
    });
    if (runtime.issues.length || runtime.markers.length !== rows.length) {
      const reason = runtime.issues[0]?.reasons[0] ?? 'component is not eligible for Scene rendering';
      throw new AssemblyProjectPlacementError(`Assembly cannot be placed: ${reason}. Review its component transforms and Models.`, 409);
    }
    // Placement commands hold the Project lock above. Preserve existing asset
    // configuration without relying on a particular deployed conflict index.
    const missingModelIds: number[] = [];
    for (const modelId of modelIds) {
      const assignments = await tx.update(projectAssets).set({
        isActive: true,
        updatedAt: new Date(),
      }).where(and(
        eq(projectAssets.userId, ownerId),
        eq(projectAssets.projectId, input.projectId),
        eq(projectAssets.moduleId, input.threedId),
        eq(projectAssets.moduleType, 'threed'),
        eq(projectAssets.assetType, 'threed_models'),
        eq(projectAssets.assetId, modelId),
      )).returning({ id: projectAssets.id });
      if (!assignments.length) missingModelIds.push(modelId);
    }
    if (missingModelIds.length) await tx.insert(projectAssets).values(missingModelIds.map(modelId => ({
      userId: ownerId,
      projectId: input.projectId,
      moduleId: input.threedId,
      moduleType: 'threed',
      assetType: 'threed_models' as const,
      assetId: modelId,
      config: {},
      isActive: true,
    }))).returning({ id: projectAssets.id });
    const markers = await tx.insert(projectThreedMarkers).values(rows).returning();
    if (markers.length !== rows.length) throw new AssemblyProjectPlacementError('Assembly placement could not be completed. Please retry.', 409);
    return {
      markers,
      placementId: input.requestId,
      assemblyId: input.assemblyId,
      assemblyRevision: input.assemblyRevision,
      replayed: false,
    };
  });
}
