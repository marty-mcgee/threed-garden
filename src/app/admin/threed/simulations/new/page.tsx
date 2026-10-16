import { notFound } from 'next/navigation';
import { SimulationEditor, type SoccerSimulationDraft } from '@/components/admin/threed/simulations/SimulationEditor';
export default async function AddSimulationPage({ searchParams }: { searchParams: Promise<{ projectId?: string | string[]; recipe?: string | string[]; threedId?: string | string[]; actorMarkerId?: string | string[]; ballMarkerId?: string | string[]; sensorGroupId?: string | string[] }> }) {
  const { projectId, recipe, threedId, actorMarkerId = '', ballMarkerId = '', sensorGroupId = '' } = await searchParams;
  if (projectId !== undefined && (typeof projectId !== 'string' || !/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId)) || Number(projectId) > 2_147_483_647)) notFound();
  if ((recipe !== undefined && typeof recipe !== 'string') || (threedId !== undefined && typeof threedId !== 'string')
    || typeof actorMarkerId !== 'string' || typeof ballMarkerId !== 'string' || typeof sensorGroupId !== 'string') notFound();
  let initialSoccerDraft: SoccerSimulationDraft | undefined;
  if (recipe === 'soccer') {
    if (!projectId || ![threedId].every(value => value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= 2_147_483_647)
      || ![actorMarkerId, ballMarkerId].every(value => /^[a-zA-Z0-9_-]{0,128}$/.test(value)) || !/^[a-zA-Z0-9_-]{0,64}$/.test(sensorGroupId)) notFound();
    initialSoccerDraft = { threedId: Number(threedId), actorMarkerId, ballMarkerId, sensorGroupId };
  }
  return <SimulationEditor key={`${projectId ?? 'new'}:${recipe ?? ''}`} projectId={projectId ? Number(projectId) : undefined} initialSoccerDraft={initialSoccerDraft} />;
}
