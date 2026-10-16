import { notFound, redirect } from 'next/navigation';

export default async function SimulationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string | string[] }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2_147_483_647) notFound();
  const { created } = await searchParams;
  redirect(`/admin/threed/simulations/${id}/view${created === '1' ? '?created=1' : ''}`);
}
