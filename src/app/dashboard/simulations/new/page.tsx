import { notFound, redirect } from 'next/navigation';

export default async function NewSimulationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const draft = new URLSearchParams();
  // Preserve supported draft context; Admin validates it before mounting the editor.
  for (const key of ['projectId', 'recipe', 'threedId', 'actorMarkerId', 'ballMarkerId', 'sensorGroupId']) {
    const value = query[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') notFound();
    draft.set(key, value);
  }
  const suffix = draft.toString();
  redirect(`/admin/threed/simulations/new${suffix ? `?${suffix}` : ''}`);
}
