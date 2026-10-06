import { notFound } from 'next/navigation';
import { SimulationEditor } from '@/components/admin/threed/simulations/SimulationEditor';

export default async function SimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2_147_483_647) notFound();
  return <div className="h-[calc(100dvh-100px)] p-2"><SimulationEditor surface="dashboard" id={Number(id)} /></div>;
}
