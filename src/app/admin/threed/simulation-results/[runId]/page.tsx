import { notFound } from 'next/navigation';
import { SimulationResultDetail } from '@/components/admin/threed/simulations/SimulationResultDetail';
import { simulationRunId } from '@/libraries/services/threed/simulations/simulation-result-input';

export default async function SimulationResultPage({ params }: { params: Promise<{ runId: string }> }) {
  let runId: string;
  try { runId = simulationRunId((await params).runId); } catch { notFound(); }
  return <SimulationResultDetail key={runId} runId={runId} />;
}
