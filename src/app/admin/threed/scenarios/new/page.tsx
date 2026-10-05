import { notFound } from 'next/navigation';
import { ThreeDScenariosCRUD } from '@/components/admin/threed/scenarios/ThreeDScenariosCRUD';

export default async function AddScenarioPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId } = await searchParams;
  if (projectId !== undefined && (!/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId)))) notFound();
  return <ThreeDScenariosCRUD key={projectId ?? 'new'} view="create" projectId={projectId} />;
}
