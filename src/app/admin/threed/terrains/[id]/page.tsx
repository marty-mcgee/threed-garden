import { notFound } from 'next/navigation';
import { TerrainEditor } from '@/components/admin/threed/terrains/TerrainEditor';

export default async function EditTerrainPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const terrainId = Number(id);
  if (!Number.isSafeInteger(terrainId) || terrainId <= 0) notFound();
  return <TerrainEditor recordId={terrainId} />;
}
