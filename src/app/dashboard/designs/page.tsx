import { redirect } from 'next/navigation';

/** Compatibility entry only: Designs belongs to an existing Project. */
export default async function DesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const { projectId } = await searchParams;
  if (typeof projectId === 'string' && /^[1-9]\d*$/.test(projectId)
    && Number.isSafeInteger(Number(projectId))) {
    redirect('/dashboard/scene?projectId=' + projectId + '&view=design');
  }
  redirect('/dashboard');
}
