import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project, projectThreedMarkers } from '@/libraries/schema/project';
import { and, eq } from 'drizzle-orm';
import { readSensorGroups, SensorGroupInputError } from '@/libraries/services/threed/physics/sensor-group-core';
import { IMPORTED_SENSOR_GROUP, readModelVolumeSensor } from '@/libraries/services/threed/physics/sensor-legacy-compat';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';

async function handle(request: NextRequest, write: boolean) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const projectId = Number(request.nextUrl.searchParams.get('projectId'));
  if (!Number.isSafeInteger(projectId) || projectId <= 0) return NextResponse.json({ success: false, error: 'Invalid Project' }, { status: 400 });
  const owner = and(eq(project.id, projectId), eq(project.userId, session.user.id));
  try {
    const body = write ? await request.json() : null;
    const result = await db.transaction(async tx => {
      const [record] = await tx.select().from(project).where(owner).for('update');
      if (!record) return null;
      const metadata = (record.metadata ?? {}) as Record<string, unknown>;
      let groups = readSensorGroups(metadata.physicsSensorGroups ?? []);
      if (!groups.some(group => group.id === IMPORTED_SENSOR_GROUP.id)) groups = [IMPORTED_SENSOR_GROUP, ...groups];
      if (write) {
        const [group] = readSensorGroups([body?.group]);
        if (body.operation === 'delete') {
          const markers = await tx.select({ metadata: projectThreedMarkers.metadata }).from(projectThreedMarkers).where(eq(projectThreedMarkers.projectId, projectId));
          if (markers.some(marker => readPhysicsSensorCuboids(marker.metadata).some(sensor => sensor.groupId === group.id) || readModelVolumeSensor(marker.metadata)?.groupId === group.id)) throw new SensorGroupInputError('Remove sensors from this group before deleting it.');
          if (group.id === IMPORTED_SENSOR_GROUP.id) throw new SensorGroupInputError('The compatibility group can be renamed but not deleted.');
          groups = groups.filter(item => item.id !== group.id);
        } else if (body.operation === 'upsert') {
          groups = [...groups.filter(item => item.id !== group.id), group];
        } else throw new SensorGroupInputError('Invalid group operation.');
        groups = readSensorGroups(groups);
        await tx.update(project).set({ metadata: { ...metadata, physicsSensorGroups: groups }, updatedAt: new Date() }).where(owner);
      }
      return groups;
    });
    if (!result) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof SensorGroupInputError ? error.message : 'Could not update Sensor Groups' }, { status: error instanceof SensorGroupInputError || error instanceof SyntaxError ? 400 : 500 });
  }
}
export const GET = (request: NextRequest) => handle(request, false);
export const PATCH = (request: NextRequest) => handle(request, true);
