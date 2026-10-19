'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultimediaRecordsSearch, useMultimediaRecords } from './MultimediaRecordsWorkspace';

export function OwnedMultimediaPicker({ kind, value, albumId, disabled, onChange, onValidityChange }: {
  kind: 'albums' | 'tracks'; value: string; albumId?: number; disabled: boolean;
  onChange: (value: string) => void; onValidityChange: (valid: boolean) => void;
}) {
  const workspace = useMultimediaRecords(kind, true, kind === 'tracks' ? { albumId } : {});
  const [selected, setSelected] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!value) { onValidityChange(true); setSelected(''); setPending(false); return; }
    const controller = new AbortController();
    setPending(true); onValidityChange(false);
    void fetch(`/api/multimedia/${kind}?scope=owner&id=${encodeURIComponent(value)}`, { signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (controller.signal.aborted) return;
        const valid = response.ok && result.success && result.data?.id === Number(value) &&
          (kind !== 'tracks' || !albumId || result.data.albumId === albumId);
        setSelected(valid ? result.data.title : `#${value} (unavailable)`); onValidityChange(Boolean(valid));
      }).catch(() => { if (!controller.signal.aborted) { setSelected(`#${value} (unavailable)`); onValidityChange(false); } })
      .finally(() => { if (!controller.signal.aborted) setPending(false); });
    return () => controller.abort();
  }, [kind, value, albumId, onValidityChange]);
  const label = kind === 'albums' ? 'Album' : 'Track';
  return <div className="space-y-2 rounded-md border p-3">
    <Label className="text-xs" htmlFor={`owned-${kind}`}>{label}</Label>
    <fieldset disabled={disabled} className="space-y-2">
      <MultimediaRecordsSearch workspace={workspace} />
      {workspace.error && <p role="alert" className="text-sm text-red-500">{workspace.error} <Button type="button" variant="outline" size="sm" onClick={workspace.retry}>Retry</Button></p>}
      <select id={`owned-${kind}`} className="h-7 w-full rounded-md border bg-background px-2 text-xs" disabled={workspace.loading} value={value} onChange={event => onChange(event.target.value)}>
        <option value="">No {label.toLowerCase()} selected</option>
        {value && !workspace.rows.some(row => String(row.id) === value) && <option value={value}>{selected || `#${value}`}</option>}
        {workspace.rows.map(row => <option key={row.id} value={row.id}>{String(row.title)} · #{row.id}</option>)}
      </select>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Button type="button" size="sm" variant="outline" disabled={workspace.loading || !workspace.page} onClick={() => workspace.pageChange(workspace.page - 1)}>Previous</Button>
        <span>{workspace.loading ? 'Loading…' : `Page ${workspace.page + 1} of ${Math.max(1, Math.ceil(workspace.total / workspace.size))}`}</span>
        <Button type="button" size="sm" variant="outline" disabled={workspace.loading || (workspace.page + 1) * workspace.size >= workspace.total} onClick={() => workspace.pageChange(workspace.page + 1)}>Next</Button>
        {pending && <span role="status">Checking selected {label.toLowerCase()}…</span>}
      </div>
    </fieldset>
  </div>;
}
