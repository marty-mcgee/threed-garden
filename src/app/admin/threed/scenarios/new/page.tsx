import { notFound } from 'next/navigation';
import { ThreeDScenariosCRUD } from '@/components/admin/threed/scenarios/ThreeDScenariosCRUD';

export default async function AddScenarioPage({ searchParams }: { searchParams: Promise<{ projectId?: string | string[] }> }) {
  const { projectId } = await searchParams;
  if (projectId !== undefined && (typeof projectId !== 'string' || !/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId)) || Number(projectId) > 2_147_483_647)) notFound();
  return <ThreeDScenariosCRUD key={projectId ?? 'new'} view="create" projectId={projectId} />;
}
