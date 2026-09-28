'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';

type ScenarioSummary = { id: number; name: string; description: string | null };

/** Read-only Project annotation; Scenario definitions do not create Scene objects. */
export function ProjectScenarioSceneCard({ projectId }: { projectId: string }) {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback((signal: AbortSignal) => {
    const params = new URLSearchParams({ projectId, isActive: 'true', limit: '3', sort: 'createdAt', direction: 'desc' });
    void fetch(`/api/threed/scenarios?${params}`, { signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Scenario list unavailable');
      if (signal.aborted) return;
      setScenarios(Array.isArray(result.data) ? result.data : []);
      setTotal(Number(result.pagination?.total ?? 0));
      setLoaded(true);
    }).catch(() => { if (!signal.aborted) { setScenarios([]); setLoaded(true); } });
  }, [projectId]);
  useEffect(() => {
    const controller = new AbortController();
    setDismissed(false); setLoaded(false); setScenarios([]);
    load(controller.signal);
    const refresh = () => { if (document.visibilityState === 'visible') load(controller.signal); };
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, [load]);
  if (!loaded || dismissed || !scenarios.length) return null;
  return <aside data-scene-hover-obstacle aria-label="Project Scenarios" className="threed-workspace-panel threed-scene-panel-surface pointer-events-auto absolute left-1/2 top-14 z-20 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-foreground/15 p-3 text-foreground shadow-xl backdrop-blur-md">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold"><BookOpen aria-hidden="true" className="h-3.5 w-3.5 text-blue-500" /> Project Scenarios{total > 1 ? ` · ${total}` : ''}</span>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss Project Scenarios" className="rounded p-1 text-foreground/60 hover:bg-foreground/10"><X className="h-3.5 w-3.5" /></button>
    </div>
    <div className="mt-2 space-y-2">{scenarios.map(scenario => <div key={scenario.id} className="rounded border border-foreground/10 bg-foreground/5 px-2 py-1.5">
      <div className="text-xs font-medium">{scenario.name}</div>
      {scenario.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/70">{scenario.description}</p>}
    </div>)}</div>
    <p className="mt-2 text-[10px] text-foreground/55">Definitions for this Project · read-only Scene view</p>
  </aside>;
}
