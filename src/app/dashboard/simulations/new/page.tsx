import { notFound } from 'next/navigation';
import { SimulationEditor } from '@/components/admin/threed/simulations/SimulationEditor';

export default async function NewSimulationPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId } = await searchParams;
  if (projectId !== undefined && (!/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId)) || Number(projectId) > 2_147_483_647)) notFound();
  return <div className="h-[calc(100dvh-100px)] p-2"><SimulationEditor surface="dashboard" projectId={projectId ? Number(projectId) : undefined} /></div>;
}
