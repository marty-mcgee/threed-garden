import { notFound } from 'next/navigation';
import { ThreeDModelFileEditor } from '@/components/admin/threed/models/ThreeDModelFileEditor';

export default async function EditModelFilePage({ params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId: rawFileId } = await params;
  const modelId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  const fileId = /^[1-9]\d*$/.test(rawFileId) ? Number(rawFileId) : NaN;
  if (![modelId, fileId].every(Number.isSafeInteger)) notFound();
  return <ThreeDModelFileEditor key={`${modelId}:${fileId}`} modelId={modelId} fileId={fileId} />;
}
