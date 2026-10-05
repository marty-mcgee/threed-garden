import { notFound } from 'next/navigation';
import { SimulationEditor } from '@/components/admin/threed/simulations/SimulationEditor';
export default async function AddSimulationPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId } = await searchParams;
  if (projectId !== undefined && (!/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId)) || Number(projectId) > 2_147_483_647)) notFound();
  return <SimulationEditor key={projectId ?? 'new'} projectId={projectId ? Number(projectId) : undefined} />;
}
