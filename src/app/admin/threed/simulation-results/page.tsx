import { notFound } from 'next/navigation';
import { SimulationResultsList } from '@/components/admin/threed/simulations/SimulationResultsList';

export default async function SimulationResultsPage({ searchParams }: { searchParams: Promise<{ projectId?: string | string[]; simulationId?: string | string[] }> }) {
  const { projectId, simulationId } = await searchParams;
  for (const value of [projectId, simulationId]) {
    if (value !== undefined && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > 2_147_483_647)) notFound();
  }
  return <SimulationResultsList key={`${projectId ?? ''}:${simulationId ?? ''}`} projectId={projectId ? Number(projectId) : undefined} simulationId={simulationId ? Number(simulationId) : undefined} />;
}
