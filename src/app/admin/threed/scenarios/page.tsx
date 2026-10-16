import { ThreeDScenariosCRUD } from '@/components/admin/threed/scenarios/ThreeDScenariosCRUD';
import { notFound, redirect } from 'next/navigation';

export default async function AdminThreeDScenariosPage({ searchParams }: { searchParams: Promise<{ projectId?: string | string[]; create?: string | string[] }> }) {
  const { projectId, create } = await searchParams;
  if (projectId !== undefined && (typeof projectId !== 'string' || !/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId)) || Number(projectId) > 2_147_483_647)) notFound();
  if (create === '1') redirect(`/admin/threed/scenarios/new${projectId ? `?projectId=${projectId}` : ''}`);
  return <ThreeDScenariosCRUD key={projectId ?? 'all'} projectId={projectId} />;
}
