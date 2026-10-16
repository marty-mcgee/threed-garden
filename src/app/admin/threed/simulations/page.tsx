import { SimulationsList } from '@/components/admin/threed/simulations/SimulationsList';
import { notFound } from 'next/navigation';

export default async function SimulationsPage({ searchParams }: { searchParams: Promise<{ projectId?: string | string[] }> }) {
  const { projectId } = await searchParams;
  if (projectId !== undefined && (typeof projectId !== 'string' || !/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId)) || Number(projectId) > 2_147_483_647)) notFound();
  return <SimulationsList key={projectId ?? 'all'} initialProjectId={projectId ? Number(projectId) : undefined} />;
}
