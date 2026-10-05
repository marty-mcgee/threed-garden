'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ScenarioSetup } from '@/libraries/services/threed/scenarios/scenario-input';

export type LoadableScenario = {
  id: number;
  projectId: number;
  threedId: number;
  name: string;
  description: string | null;
  threedName: string;
  setup: ScenarioSetup | null;
};

const pageSize = 25;

export function ProjectScenarioLoadDialog({ open, projectId, onClose, onLoad }: {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onLoad: (scenario: LoadableScenario) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<LoadableScenario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !/^\d+$/.test(projectId)) return;
    const controller = new AbortController();
    setRows([]);
    setTotal(0);
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ projectId, isActive: 'true', limit: String(pageSize), offset: String(page * pageSize), search, sort: 'name', direction: 'asc' });
      try {
        const response = await fetch(`/api/threed/scenarios?${params}`, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.error || 'Could not load Scenarios.');
        if (controller.signal.aborted) return;
        const nextTotal = Number(result.pagination?.total ?? 0);
        if (page > 0 && page * pageSize >= nextTotal) { setPage(Math.max(0, Math.ceil(nextTotal / pageSize) - 1)); return; }
        setRows(result.data);
        setTotal(nextTotal);
      } catch (cause) {
        if (!controller.signal.aborted) { setRows([]); setError(cause instanceof Error ? cause.message : 'Could not load Scenarios.'); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, search ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, projectId, page, search]);

  return <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <DialogContent className="threed-workspace-panel threed-toolbar-dropdown-surface max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-foreground/10 p-4 text-foreground shadow-2xl backdrop-blur-md sm:max-w-lg">
      <DialogHeader><DialogTitle className="flex items-center gap-2 text-sm"><BookOpen aria-hidden="true" className="h-4 w-4 text-violet-700 dark:text-violet-300" /> Choose Scenario</DialogTitle><DialogDescription className="text-xs">Select an active Scenario saved in this Project. Then review its setup in the guide. Selecting does not run a Simulation.</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search Scenarios to load" placeholder="Search saved Scenarios" className="border-foreground/15 bg-background/50 pl-8 text-xs" maxLength={120} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></div>
        {loading ? <p className="text-sm text-muted-foreground">Loading Scenarios…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : rows.length ? <ul className="grid gap-2 sm:grid-cols-2">{rows.map(row => <li key={row.id}>
          <button type="button" className="h-full w-full rounded-lg border border-foreground/10 bg-foreground/[0.03] p-3 text-left transition-colors hover:bg-foreground/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { if (row.projectId === Number(projectId)) onLoad(row); }}>
            <span aria-hidden="true" className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300"><BookOpen className="h-4 w-4" /></span>
            <span className="block text-sm font-semibold text-foreground">{row.name}</span>
            <span className="block text-[11px] text-muted-foreground">{row.threedName}</span>
            {row.description && <span className="mt-1 block line-clamp-3 text-xs text-muted-foreground">{row.description}</span>}
            <span className="mt-2 block text-xs font-medium text-sky-700 dark:text-sky-300">Select Scenario → Review setup</span>
          </button>
        </li>)}</ul> : <p className="text-xs text-muted-foreground">{search ? 'No matching active Scenarios.' : 'No active Scenarios saved for this Project.'}</p>}
        {!loading && !error && !rows.length && !search && <p className="text-xs text-muted-foreground"><Link className="underline" href={`/admin/threed/scenarios?projectId=${projectId}`}>Review saved Scenarios</Link> and enable Active, or <Link className="underline" href={`/admin/threed/scenarios/new?projectId=${projectId}`}>add a Scenario</Link>.</p>}
        {total > pageSize && <nav aria-label="Load Scenario pages" className="flex items-center justify-between gap-2 text-xs"><span>Page {page + 1} of {Math.ceil(total / pageSize)}</span><div className="flex gap-1"><Button type="button" variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage(value => value - 1)}>Previous</Button><Button type="button" variant="outline" size="sm" disabled={(page + 1) * pageSize >= total || loading} onClick={() => setPage(value => value + 1)}>Next</Button></div></nav>}
      </div>
    </DialogContent>
  </Dialog>;
}
