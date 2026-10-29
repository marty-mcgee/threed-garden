'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchemaTableDetails } from './SchemaTableDetails';
import {
  filterTables,
  relationshipKinds,
  relationshipLabels,
  tableFromHash,
  tableHref,
  visibleRelationships,
  type RelationshipKind,
  type SchemaSnapshot,
} from './schema-explorer';

export function SchemaExplorer({ schema }: { schema: SchemaSnapshot }) {
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kinds, setKinds] = useState<RelationshipKind[]>(['foreign-key']);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocus = useRef(false);

  useEffect(() => {
    const readHash = () => {
      shouldFocus.current = true;
      setSelectedId(tableFromHash(window.location.hash, schema.tables)?.id ?? null);
    };
    // Initial hash is read after hydration so server/client initial markup agrees.
    setSelectedId(tableFromHash(window.location.hash, schema.tables)?.id ?? null);
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [schema.tables]);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: 'start' });
  }, [selectedId]);

  const selected = schema.tables.find(table => table.id === selectedId);
  const filtered = filterTables(schema.tables, domain, search);
  const edges = selected ? visibleRelationships(schema.edges, selected.id, kinds) : [];

  function chooseDomain(id: string) {
    setDomain(id);
    setSearch('');
    if (window.location.hash) window.location.hash = '';
    setSelectedId(null);
  }

  function toggleKind(kind: RelationshipKind) {
    setKinds(current => current.includes(kind) ? current.filter(value => value !== kind) : [...current, kind]);
  }

  return <div className="min-w-0 space-y-6" data-schema-explorer>
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border p-4 text-sm" aria-label="Schema totals">
      <span><strong>{schema.summary.tables}</strong> tables</span>
      <span><strong>{schema.summary.columns.toLocaleString('en-US')}</strong> columns</span>
      <span><strong>{schema.summary.foreignKeys}</strong> SQL foreign keys</span>
      <span><strong>{schema.summary.enums}</strong> enums</span>
      <span><strong>{schema.summary.applicationLinks}</strong> application mappings</span>
    </div>
    <section aria-labelledby="schema-modules-title" className="space-y-3">
      <h2 id="schema-modules-title" className="text-lg font-semibold">Four peer Top Modules</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {schema.domains.filter(item => item.kind === 'top').map(item => {
          const count = schema.tables.filter(table => table.domain === item.id).length;
          return <Button key={item.id} variant="outline" aria-pressed={domain === item.id} onClick={() => chooseDomain(item.id)} className="h-auto min-w-0 justify-start whitespace-normal border-t-4 p-4 text-left" style={{ borderTopColor: item.color }}>
            <span className="min-w-0 space-y-2">
              <span className="block text-base font-semibold">{item.label} <span className="text-xs font-normal text-muted-foreground">{count} {count === 1 ? 'table' : 'tables'}</span></span>
              <span className="block text-sm font-normal text-muted-foreground">{item.description}</span>
            </span>
          </Button>;
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <span className="mr-2 text-sm font-medium">Shared foundations</span>
        {schema.domains.filter(item => item.kind === 'shared').map(item => <Button key={item.id} variant="outline" size="sm" aria-pressed={domain === item.id} onClick={() => chooseDomain(item.id)}>{item.label}</Button>)}
      </div>
    </section>
    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-3 rounded-xl border p-4 lg:sticky lg:top-4" aria-label="Table catalog">
        <h2 className="font-semibold">Table catalog</h2>
        <label className="block space-y-2 text-sm"><span>Find a table or column</span><Input type="search" placeholder="e.g. model, album_id" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label id="schema-domain-label" className="block text-sm">Owning domain</label>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger aria-labelledby="schema-domain-label" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All domains</SelectItem>{schema.domains.map(item => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-xs text-muted-foreground">{filtered.length} of {schema.tables.length} tables</p>
          <Button variant="ghost" size="sm" onClick={() => chooseDomain('all')}>Reset filters</Button>
        </div>
        <nav aria-label="Schema tables" className="max-h-64 space-y-1 overflow-y-auto lg:max-h-[60vh]">
          {filtered.map(table => <a key={table.id} href={tableHref(table.id)} aria-current={selectedId === table.id ? 'page' : undefined} className="block rounded px-2 py-1.5 font-mono text-xs [overflow-wrap:anywhere] hover:bg-accent focus-visible:outline-2 aria-[current=page]:bg-accent aria-[current=page]:font-bold">{table.name}</a>)}
          {filtered.length === 0 && <p className="py-4 text-sm text-muted-foreground">No matching tables. Try a different search or domain.</p>}
        </nav>
      </aside>
      <section className="min-w-0 space-y-5 rounded-xl border p-4 sm:p-6" aria-labelledby="schema-detail-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="schema-detail-title" ref={headingRef} tabIndex={-1} className="scroll-mt-24 text-xl font-semibold [overflow-wrap:anywhere]">{selected?.name ?? 'All tables, grouped by owner'}</h2>
          {selected && <Button asChild variant="outline" size="sm"><a href="#">All tables</a></Button>}
        </div>
        {selected ? <>
          <fieldset className="flex flex-wrap gap-4 border-y py-3">
            <legend className="sr-only">Relationship layers</legend>
            {relationshipKinds.map(kind => <label key={kind} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={kinds.includes(kind)} onChange={() => toggleKind(kind)} />{relationshipLabels[kind]}</label>)}
          </fieldset>
          <SchemaTableDetails table={selected} tables={schema.tables} edges={edges} allEdges={schema.edges} />
        </> : <>
          <p className="text-sm text-muted-foreground">Select a table to inspect its fields and relationships. These groups express App ownership; they do not imply additional foreign keys.</p>
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            {schema.domains.map(item => {
              const tables = filtered.filter(table => table.domain === item.id);
              if (!tables.length) return null;
              return <section key={item.id} className="min-w-0 rounded-lg border border-t-4 p-3" style={{ borderTopColor: item.color }}>
                <h3 className="mb-3 font-semibold">{item.label} <span className="text-xs font-normal text-muted-foreground">{tables.length} {tables.length === 1 ? 'table' : 'tables'}</span></h3>
                {tables.map(table => <a key={table.id} href={tableHref(table.id)} className="block border-t py-2 font-mono text-xs underline-offset-4 [overflow-wrap:anywhere] hover:underline">{table.name} <span className="text-muted-foreground">· {table.columns.length} columns</span></a>)}
              </section>;
            })}
          </div>
          {filtered.length === 0 && <p>No tables match the current filters.</p>}
        </>}
      </section>
    </div>
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-semibold">Enum definitions ({schema.enums.length})</summary>
      <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
        {schema.enums.map(item => <article key={item.name} className="min-w-0 rounded-lg border p-3 [overflow-wrap:anywhere]"><h3 className="font-mono text-sm font-semibold">{item.name}</h3><p className="text-xs text-muted-foreground">{item.domain}</p><p className="mt-2 font-mono text-xs">{item.values.join(' · ')}</p></article>)}
      </div>
    </details>
    <details className="rounded-xl border p-4 text-sm text-muted-foreground">
      <summary className="cursor-pointer font-medium">About this schema snapshot</summary>
      <p className="mt-3">Generated {schema.generatedAt} · App {schema.version}. Source links open current main and may differ from this snapshot.</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">{schema.notes.map(note => <li key={note}>{note}</li>)}</ul>
    </details>
  </div>;
}
