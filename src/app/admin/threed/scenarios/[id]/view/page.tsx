import { notFound } from 'next/navigation';
import { ThreeDScenariosCRUD } from '@/components/admin/threed/scenarios/ThreeDScenariosCRUD';

export default async function ViewScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenarioId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(scenarioId)) notFound();
  return <ThreeDScenariosCRUD key={scenarioId} view="detail" scenarioId={scenarioId} />;
}
