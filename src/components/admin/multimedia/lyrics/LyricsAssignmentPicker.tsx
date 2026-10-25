'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type LyricsAssignment = { id: number; title: string };
export type LyricsAssignmentKind = 'projects' | 'albums' | 'tracks';
export function LyricsAssignmentPicker({ kind, selected, onChange, disabled }: {
  kind: LyricsAssignmentKind; selected: LyricsAssignment[]; onChange: (items: LyricsAssignment[]) => void; disabled: boolean;
}) {
  const [search, setSearch] = useState(''), [page, setPage] = useState(0), [retry, setRetry] = useState(0);
  const [rows, setRows] = useState<LyricsAssignment[]>([]), [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    const timer = setTimeout(() => {
      void fetch(`/api/multimedia/lyrics?options=${kind}&search=${encodeURIComponent(search)}&offset=${page * 25}`, { signal: controller.signal, cache: 'no-store' })
        .then(async response => {
          const result = await response.json();
          if (!response.ok) throw Error(result.error || 'Assignments unavailable.');
          if (!controller.signal.aborted) {
            const last = Math.max(0, Math.ceil(result.total / 25) - 1);
            if (page > last) { setPage(last); return; }
            setRows(result.data); setTotal(result.total);
          }
        }).catch(reason => { if (!controller.signal.aborted) { setRows([]); setError(reason instanceof Error ? reason.message : 'Assignments unavailable.'); } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, search, page, retry]);
  const title = kind[0].toUpperCase() + kind.slice(1);
  return <details className="rounded-md border p-2">
    <summary className="cursor-pointer text-xs font-medium">{title} ({selected.length})</summary>
    <fieldset disabled={disabled} className="mt-2 space-y-2">
      {selected.length > 0 && <div className="flex flex-wrap gap-1">{selected.map(item => <Button type="button" key={item.id} size="sm" variant="secondary" className="h-auto min-h-7 max-w-full whitespace-normal px-2 text-xs" aria-label={`Remove ${title} assignment ${item.title} #${item.id}`} onClick={() => onChange(selected.filter(existing => existing.id !== item.id))}>{item.title} · #{item.id} ×</Button>)}</div>}
      <Input className="h-7 text-xs" aria-label={`Search ${title} assignments`} placeholder={`Search your ${kind}…`} maxLength={255} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} />
      {error ? <p role="alert" className="text-xs text-destructive">{error} <button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></p> : loading ? <p role="status" className="text-xs text-muted-foreground">Loading…</p> : <div className="max-h-32 space-y-1 overflow-auto">{rows.length ? rows.map(item => <label key={item.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.some(existing => existing.id === item.id)} disabled={!selected.some(existing => existing.id === item.id) && selected.length >= 100} onChange={event => onChange(event.target.checked ? [...selected, item] : selected.filter(existing => existing.id !== item.id))} />{item.title} <span className="text-muted-foreground">#{item.id}</span></label>) : <p className="text-xs text-muted-foreground">No matching {kind}.</p>}</div>}
      <div className="flex items-center gap-2 text-xs"><Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={loading || page === 0} onClick={() => setPage(value => value - 1)}>Previous</Button><span>Page {page + 1}</span><Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={loading || (page + 1) * 25 >= total} onClick={() => setPage(value => value + 1)}>Next</Button></div>
    </fieldset>
  </details>;
}
