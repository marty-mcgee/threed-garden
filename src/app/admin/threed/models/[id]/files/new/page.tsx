import { notFound } from 'next/navigation';
import { ThreeDModelFileEditor } from '@/components/admin/threed/models/ThreeDModelFileEditor';

export default async function AddModelFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modelId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(modelId)) notFound();
  return <ThreeDModelFileEditor key={modelId} modelId={modelId} />;
}
