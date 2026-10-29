import { notFound } from 'next/navigation';
import { albumEntityTables, type AlbumModuleType } from '@/libraries/services/threed/multimedia/album-entity-registry';
import { EntityAlbumWorkspace } from '@/components/admin/threed/multimedia/EntityAlbumWorkspace';
import { parseAlbumEntityId } from '@/libraries/services/threed/multimedia/album-association-contract';

export default async function AlbumAssignmentsPage({ params }: { params: Promise<{ moduleType: string; id: string }> }) {
  const { moduleType, id } = await params;
  if (!Object.hasOwn(albumEntityTables, moduleType)) notFound();
  const kind = moduleType as AlbumModuleType;
  let entityId;
  try {
    entityId = parseAlbumEntityId(kind, id);
  } catch {
    notFound();
  }
  return <EntityAlbumWorkspace moduleType={kind} entityId={entityId} />;
}
