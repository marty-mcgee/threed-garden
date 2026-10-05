import { notFound } from 'next/navigation';
import { SimulationEditor } from '@/components/admin/threed/simulations/SimulationEditor';
export default async function ViewSimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2_147_483_647) notFound();
  return <SimulationEditor key={id} id={Number(id)} readOnly />;
}
