'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MultimediaRecordsSearch, MultimediaRecordsTable, MultimediaStatus, useMultimediaRecords } from './MultimediaRecordsWorkspace';
import type { MultimediaKind } from '@/libraries/services/multimedia/editor';

export function RelatedMultimediaRecords({ kind, albumId, trackId, disabled, onBusyChange }: {
  kind: Exclude<MultimediaKind, 'albums'>; albumId?: number; trackId?: number; disabled: boolean; onBusyChange: (busy: boolean) => void;
}) {
  // Track-only Links remain valid when their optional albumId is null.
  const workspace = useMultimediaRecords(kind, true, { albumId: trackId ? undefined : albumId, trackId });
  useEffect(() => { onBusyChange(workspace.busy); return () => onBusyChange(false); }, [workspace.busy, onBusyChange]);
  const query = new URLSearchParams();
  if (albumId) query.set('albumId', String(albumId));
  if (trackId) query.set('trackId', String(trackId));
  const title = kind === 'media' ? 'Media' : kind === 'tracks' ? 'Tracks' : 'Links';
  return <fieldset disabled={disabled} className="flex min-h-80 min-w-0 flex-col gap-2 rounded-md border p-3">
    <div className="flex flex-wrap items-center gap-2"><h2 className="text-xs font-semibold">{title} ({workspace.total})</h2><MultimediaRecordsSearch workspace={workspace} />
      <Button type="button" asChild size="sm"><Link href={`/admin/multimedia/${kind}/new?${query}`}>Add {kind === 'tracks' ? 'Track' : kind === 'links' ? 'Link' : 'Media'}</Link></Button>
      <Button type="button" variant="outline" size="sm" onClick={workspace.retry} disabled={workspace.loading || workspace.busy}>Refresh</Button>
    </div>
    <MultimediaRecordsTable workspace={workspace} label={title} columns={[
      { field: kind === 'media' ? 'fileName' : 'title', label: 'Name', render: row => <Link className="underline" href={`/admin/multimedia/${kind}/${row.id}`}>{String(row[kind === 'media' ? 'fileName' : 'title'])}</Link> },
      { field: 'id', label: 'ID' },
      ...(kind === 'tracks' ? [{ field: 'trackNumber', label: 'Sort Order' }] : kind === 'links' ? [{ field: 'displayOrder', label: 'Sort Order' }] : [{ field: 'sortOrder', label: 'Sort Order' }]),
      ...(kind === 'media' ? [{ field: 'fileType', label: 'Type' }, { field: 'isPrimary', label: 'Primary', render: (row: { [key: string]: unknown }) => <MultimediaStatus value={row.isPrimary} /> }] : [{ field: 'status', label: 'Status', render: (row: { [key: string]: unknown }) => <MultimediaStatus value={row.status} /> }]),
    ]} actions={row => <Button type="button" variant="outline" size="sm" asChild><Link href={`/admin/multimedia/${kind}/${row.id}`}>Open</Link></Button>} />
  </fieldset>;
}
