import { notFound, redirect } from 'next/navigation';

// Only the old workspace index redirects. Add/Edit File routes remain standalone.
export default async function ModelFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modelId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(modelId)) notFound();
  redirect(`/admin/threed/models/${modelId}?tab=files`);
}
