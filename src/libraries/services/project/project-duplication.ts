import { createHash, randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { parseThreeDGroups } from '@/libraries/services/threed/design/groups';
import { parseProjectArchitecture } from '@/libraries/services/threed/design/project-architecture';
import { parseThreeDProjectViewState } from '@/libraries/services/threed/markers/project-view-state-core';
import { parseProjectThreeDMarkerSnapshot } from '@/libraries/services/threed/markers/project-marker-snapshot-core';
import { parseTerrainPlacement } from '@/libraries/services/threed/terrains/terrain-core';
import { assertProjectConfigurationCurrent } from './configuration';
import { duplicateProjectGraph, type ProjectDuplicateDraft } from './duplicate-project-graph';

import { completeDuplicate, DuplicateError as ProjectDuplicateError, reserveDuplicate } from '../threed/duplication-receipt';
export { ProjectDuplicateError };

function fields(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !allowed.includes(key))) {
    throw new ProjectDuplicateError('Unexpected Project duplication fields.', 400);
  }
  return value as Record<string, unknown>;
}

export function parseProjectDuplicate(value: unknown) {
  const input = fields(value, ['name', 'sourceProjectId', 'requestKey', 'snapshot']);
  const { sourceProjectId, requestKey } = input;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 120) throw new ProjectDuplicateError('Enter a Project name of up to 120 characters.', 400);
  if (typeof sourceProjectId !== 'number' || !Number.isSafeInteger(sourceProjectId) || sourceProjectId <= 0 || sourceProjectId > 2147483647
    || typeof requestKey !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(requestKey)) {
    throw new ProjectDuplicateError('Invalid source Project or request key.', 400);
  }
  let draft: ProjectDuplicateDraft | undefined;
  let expectedConfiguration: unknown;
  if (input.snapshot !== undefined) {
    const snapshot = fields(input.snapshot, ['markers', 'viewState', 'architecture', 'groups', 'terrain', 'expectedConfiguration']);
    if (!snapshot.expectedConfiguration || snapshot.terrain === undefined) {
      throw new ProjectDuplicateError('The Scene snapshot is incomplete. Wait for the Project to finish loading.', 400);
    }
    expectedConfiguration = snapshot.expectedConfiguration;
    try {
      draft = {
        markers: parseProjectThreeDMarkerSnapshot(snapshot.markers),
        viewState: parseThreeDProjectViewState(snapshot.viewState),
        architecture: parseProjectArchitecture(snapshot.architecture),
        groups: snapshot.groups === undefined ? undefined : parseThreeDGroups(snapshot.groups),
        terrain: parseTerrainPlacement(snapshot.terrain),
      };
    } catch (error) {
      throw new ProjectDuplicateError(error instanceof Error ? error.message : 'Invalid Scene snapshot.', 400);
    }
  }
  // Include the exact captured content, independent of JSON property ordering.
  const content = JSON.stringify({ sourceProjectId, name, snapshot: input.snapshot }, (_, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]))
      : item);
  return {
    sourceProjectId,
    name,
    requestKey,
    requestHash: createHash('sha256').update(content).digest('hex'),
    draft,
    expectedConfiguration,
  };
}

function copyProjectMetadata(value: unknown) {
  // Recovery receipts and fingerprints identify a specific historical Project.
  const metadata = { ...(value as Record<string, unknown> | null) };
  delete metadata.legacyRecoveryFingerprint;
  delete metadata.legacyRecoveryReceipt;
  return metadata;
}

function databaseCode(error: unknown): string | undefined {
  for (let depth = 0; error && typeof error === 'object' && depth < 5; depth++) {
    const cause = error as { code?: string; cause?: unknown };
    if (cause.code) return cause.code;
    error = cause.cause;
  }
}

export async function duplicateProject(owner: string, input: ReturnType<typeof parseProjectDuplicate>) {
  // A conflicting insertion under REPEATABLE READ can require a new snapshot.
  // A replay checks the receipt before testing the editor's original stamp.
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(async tx => {
        const reservation = await reserveDuplicate(tx, {
          userId: owner,
          kind: 'project',
          sourceId: input.sourceProjectId,
          requestKey: input.requestKey,
          name: input.name,
          requestHash: input.requestHash,
        });
        if (reservation.existingId) return { projectId: reservation.existingId, name: input.name, created: false };
        const [source] = await tx.select().from(project)
          .where(and(eq(project.id, input.sourceProjectId), eq(project.userId, owner))).limit(1).for('share');
        if (!source) throw new ProjectDuplicateError('Source Project not found.', 404);
        if (input.draft) assertProjectConfigurationCurrent(source.config, input.expectedConfiguration);
        const slugBase = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'project';
        const [created] = await tx.insert(project).values({
          userId: owner,
          name: input.name,
          slug: `${slugBase}-${randomUUID()}`,
          isPublic: false,
          isActive: source.isActive,
          description: source.description,
          originLatitude: source.originLatitude,
          originLongitude: source.originLongitude,
          originAltitude: source.originAltitude,
          headingDegrees: source.headingDegrees,
          metersPerSceneUnit: source.metersPerSceneUnit,
          calibrationPointALocalX: source.calibrationPointALocalX,
          calibrationPointALocalZ: source.calibrationPointALocalZ,
          calibrationPointALatitude: source.calibrationPointALatitude,
          calibrationPointALongitude: source.calibrationPointALongitude,
          calibrationPointBLocalX: source.calibrationPointBLocalX,
          calibrationPointBLocalZ: source.calibrationPointBLocalZ,
          calibrationPointBLatitude: source.calibrationPointBLatitude,
          calibrationPointBLongitude: source.calibrationPointBLongitude,
          config: source.config,
          metadata: copyProjectMetadata(source.metadata),
          sourceProjectId: source.id,
        }).returning({ id: project.id });
        await duplicateProjectGraph(tx, owner, source, created.id, input.draft);
        await completeDuplicate(tx, reservation, created.id);
        return { projectId: created.id, name: input.name, created: true };
      }, { isolationLevel: 'repeatable read' });
    } catch (error) {
      const code = databaseCode(error);
      if (code !== '40001' && code !== '40P01') throw error;
      if (attempt >= 2) throw new ProjectDuplicateError('The source changed while copying. Retry the same request.', 503);
    }
  }
}
