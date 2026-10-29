'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { EntityAlbumsSection } from './EntityAlbumsSection';
import { albumEntityTables, type AlbumModuleType } from '@/libraries/services/threed/multimedia/album-entity-registry';
import { albumModuleLabels } from '@/libraries/services/threed/multimedia/album-labels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AlbumEntityPicker({ fixedKind, contextual = false }: { fixedKind?: AlbumModuleType; contextual?: boolean } = {}) {
  const { data, status } = useSession();
  const [kind, setKind] = useState<AlbumModuleType>(fixedKind ?? 'model');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const key = `${status}:${data?.user?.id}:${kind}:${search}:${offset}:${retry}`;
  const [result, setResult] = useState<{
    key: string;
    items: Array<{ id: number | string; title: string }>;
    hasMore: boolean;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (status !== 'authenticated') return;
    const abort = new AbortController();
    const params = new URLSearchParams({ scope: 'entities', moduleType: kind, search, offset: String(offset) });
    void fetch(`/api/threed/album-associations/options?${params}`, { signal: abort.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw Error();
        return response.json();
      }).then(value => {
        if (!abort.signal.aborted) setResult({ ...value, key, error: '' });
      }).catch(() => {
        if (!abort.signal.aborted) setResult({ key, items: [], hasMore: false, error: 'Entities could not be loaded.' });
      });
    return () => abort.abort();
  }, [status, kind, search, offset, key]);
  const current = result?.key === key ? result : null;
  return <section className="space-y-3">
    <h1 className="text-sm font-semibold">ThreeD Multimedia Albums</h1>
    <p className="text-sm text-muted-foreground">Find a saved item by name, then edit its Albums. Album editing is also available inside saved Module editors.</p>
    {!fixedKind && <label className="block text-xs">ThreeD Sub-Module
      <select className="ml-2 rounded border bg-background p-2" value={kind} onChange={event => { setKind(event.target.value as AlbumModuleType); setOffset(0); }}>
        {(Object.keys(albumEntityTables) as Array<keyof typeof albumEntityTables>).map(value => <option key={value} value={value}>{albumModuleLabels[value]}</option>)}
      </select>
    </label>}
    <label className="block text-xs">Find by name<Input value={search} maxLength={120} onChange={event => { setSearch(event.target.value); setOffset(0); }} /></label>
    {status === 'unauthenticated' ? <p role="alert">Sign in to manage Album assignments.</p> : !current ? <p role="status">Loading entities…</p> : current.error ? <p role="alert">{current.error}</p> : !current.items.length ? <p>No entities match.</p> : current.items.map(item => contextual ? <div key={item.id} className="rounded border p-2"><p className="text-sm font-medium">{item.title} / #{item.id}</p><EntityAlbumsSection moduleType={kind} entityId={item.id} entityName={item.title} /></div> : <a key={item.id} className="block rounded border p-2 text-sm hover:bg-muted" href={`/admin/threed/album-associations/${kind}/${item.id}`}>{item.title} · #{item.id}</a>)}
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Refresh</Button>
      <Button variant="outline" size="sm" disabled={!offset || !current} onClick={() => setOffset(value => Math.max(0, value - 50))}>Previous</Button>
      <Button variant="outline" size="sm" disabled={!current?.hasMore} onClick={() => setOffset(value => value + 50)}>Next</Button>
    </div>
  </section>;
}
