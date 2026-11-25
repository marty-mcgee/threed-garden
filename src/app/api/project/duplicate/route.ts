import { NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { duplicateProject, parseProjectDuplicate, ProjectDuplicateError } from '@/libraries/services/project/project-duplication';
import { ProjectConfigurationConflict, ProjectConfigurationError } from '@/libraries/services/project/configuration';
import { ProjectArchitectureError } from '@/libraries/services/threed/design/project-architecture';
import { ProjectMarkerSnapshotError } from '@/libraries/services/threed/markers/project-marker-snapshot-core';
import { ProjectModelTransformLockedError } from '@/libraries/services/threed/models/project-model-instance-core';
import { CharacterPhysicsInputError } from '@/libraries/services/threed/characters/character-physics';
import { ProjectPlantingPlacementInputError } from '@/libraries/services/threed/plantings/project-planting-placement-core';
import { TerrainInputError } from '@/libraries/services/threed/terrains/terrain-core';

export const runtime = 'nodejs';
const MAX_BYTES = 1_048_576 + 1024;

export async function POST(request: Request) {
  try {
    const owner = (await auth())?.user?.id;
    if (!owner) throw new ProjectDuplicateError('Sign in to duplicate a Project.', 401);
    const body = await request.text();
    if (Buffer.byteLength(body, 'utf8') > MAX_BYTES) throw new ProjectDuplicateError('Project snapshot is too large.', 413);
    let value: unknown;
    try { value = JSON.parse(body); }
    catch { throw new ProjectDuplicateError('Invalid Project duplication request.', 400); }
    const result = await duplicateProject(owner, parseProjectDuplicate(value));
    return NextResponse.json({
      success: true,
      data: { projectId: result.projectId, name: result.name },
    }, { status: result.created ? 201 : 200 });
  } catch (error) {
    let status = 500;
    if (error instanceof ProjectDuplicateError) status = error.status;
    else if (error instanceof ProjectConfigurationConflict || error instanceof ProjectModelTransformLockedError) status = 409;
    else if (error instanceof ProjectConfigurationError || error instanceof ProjectArchitectureError
      || error instanceof ProjectMarkerSnapshotError || error instanceof CharacterPhysicsInputError
      || error instanceof ProjectPlantingPlacementInputError || error instanceof TerrainInputError) status = 400;
    if (status === 500) console.error('Unable to confirm Project duplication', { name: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({
      success: false,
      error: status === 500 || !(error instanceof Error) ? 'Unable to confirm the new Project. Retry the same request.' : error.message,
    }, { status });
  }
}
