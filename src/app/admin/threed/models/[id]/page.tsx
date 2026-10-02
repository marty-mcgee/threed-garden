import { notFound } from 'next/navigation';
import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';

export default async function EditModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modelId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(modelId)) notFound();
  return <ThreeDModelsCRUD key={modelId} view="edit" linkedModelId={modelId} />;
}
