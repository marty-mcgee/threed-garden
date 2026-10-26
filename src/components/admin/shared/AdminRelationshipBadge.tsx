import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const destinations = {
  album: ['/admin/multimedia/albums', 'Album'],
  track: ['/admin/multimedia/tracks', 'Track'],
  project: ['/admin/projects', 'Project'],
  plant: ['/admin/threed/plants', 'Plant'],
  simulation: ['/admin/threed/simulations', 'Simulation'],
} as const;

/** Only established record routes belong here; null relationships are not links. */
export function AdminRelationshipBadge({ kind, id, label }: {
  kind: keyof typeof destinations;
  id: unknown;
  label?: string | null;
}) {
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return <>{label || '—'}</>;
  const [path, name] = destinations[kind];
  return <Badge asChild variant="secondary" className="max-w-full whitespace-normal break-words text-[10px] hover:underline">
    <Link href={`${path}/${id}`} title={`Open ${name} #${id}`} prefetch={false}>{label || `${name} #${id}`}</Link>
  </Badge>;
}
