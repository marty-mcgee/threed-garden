'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LearnGuideReader } from './LearnGuideReader';
import { isLearnGuideSlug, readPublicLearnPage } from './learn-public-data';
import { usePublicLearn } from './use-public-learn';

const sectionAnchors = new Set(['first-project', 'how-to', 'troubleshooting', 'about', 'learn-path-title']);

export function LearnGuideLibrary() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(12);
  const [legacySlug, setLegacySlug] = useState<string | null>(null);
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search) query.set('search', search);
  const request = usePublicLearn(`/api/learn/public/guides?${query}`, readPublicLearnPage);
  useEffect(() => {
    const readHash = () => {
      let hash = '';
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { /* Ignore malformed anchors. */ }
      setLegacySlug(isLearnGuideSlug(hash) && !sectionAnchors.has(hash) ? hash : null);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);
  const page = request.data;
  const busy = request.status === 'loading';
  const unavailable = request.status === 'error' || request.status === 'missing';
  return <div className="space-y-6">
    <p className="text-center text-muted-foreground">Browse published guides, search for a skill, or open a guide to follow its steps.</p>
    <form role="search" aria-label="Search Learn guides" className="mx-auto flex max-w-3xl flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); setSearch(input.trim()); setOffset(0); }}>
      <label className="min-w-0 flex-1 basis-64 space-y-1 text-sm"><span>Search guides</span><input type="search" maxLength={200} value={input} onChange={event => setInput(event.target.value)} placeholder="Search title, slug or summary…" className="h-10 w-full rounded-lg border border-input bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" /></label>
      <Button type="submit" variant="outline" className="h-10"><Search aria-hidden="true" className="size-4" />Search</Button>
      {(input || search) && <Button type="button" variant="ghost" className="h-10" onClick={() => { setInput(''); setSearch(''); setOffset(0); }}>Clear</Button>}
    </form>
    {legacySlug && <LearnGuideReader key={legacySlug} slug={legacySlug} embedded />}
    <div aria-busy={busy} className="space-y-4">
      {busy && <p role="status" className="rounded-xl border p-5 text-center text-muted-foreground">Loading Learn guides…</p>}
      {unavailable && <div role="alert" className="space-y-3 rounded-xl border p-5 text-center"><p>Learn guides could not be loaded. Please try again.</p><Button variant="outline" onClick={request.retry}>Retry guides</Button></div>}
      {page && <>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p role="status">{page.data.length ? `${page.pagination.offset + 1}–${page.pagination.offset + page.data.length} of ${page.pagination.total} guides` : `${page.pagination.total} guides`}{search && <> matching “{search}”</>}</p>
          <label className="flex items-center gap-2">Per page<select value={limit} onChange={event => { setLimit(Number(event.target.value)); setOffset(0); }} className="h-9 rounded-md border border-input bg-background px-2">{[12, 24, 48].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
        </div>
        {page.data.length > 0 ? <div className="grid items-stretch gap-6 lg:grid-cols-2">
          {page.data.map(guide => <Card key={guide.slug} id={guide.slug === legacySlug || sectionAnchors.has(guide.slug) ? undefined : guide.slug} className="threed-workspace-panel threed-presentation-surface scroll-mt-24 gap-0 rounded-2xl shadow-none"><CardContent className="flex h-full flex-col gap-4 p-6 sm:p-8">
            <h3 className="flex items-start gap-2 text-lg font-semibold"><ModuleIcon moduleKey="learn" className="mt-1 size-4 shrink-0" />{guide.title}</h3>
            <p className="flex-1 text-sm leading-7 text-muted-foreground">{guide.summary}</p>
            <Link href={`/learn/guides/${guide.slug}`} className="inline-flex items-center gap-2 self-start text-sm font-medium underline underline-offset-4" aria-label={`Read ${guide.title}`}>Read guide<ArrowRight aria-hidden="true" className="size-4" /></Link>
          </CardContent></Card>)}
        </div> : <p role="status" className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">{search ? 'No published guides match this search. Try another term or clear the search.' : page.pagination.total ? 'No guides on this page. Return to the previous page.' : 'Guides are awaiting publication. You can still use the first-Project steps and troubleshooting on this page.'}</p>}
        <nav aria-label="Guide pages" className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" disabled={busy || offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {Math.floor(offset / limit) + 1} of {Math.max(1, Math.ceil(page.pagination.total / limit))}</span>
          <Button variant="outline" disabled={busy || offset + limit >= page.pagination.total} onClick={() => setOffset(offset + limit)}>Next</Button>
        </nav>
      </>}
    </div>
  </div>;
}
