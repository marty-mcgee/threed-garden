'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, CircleHelp, UserRound, Sprout, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { summarizeScenarioInventory, type ScenarioInventoryAsset } from '@/libraries/services/threed/scenarios/scenario-inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ScenarioSummary = {
  id: number;
  projectId: number;
  projectName: string;
  threedName: string;
  name: string;
  description: string | null;
};

const inventory = [
  { id: 'models', label: 'Models', icon: Boxes },
  { id: 'characters', label: 'Characters', icon: UserRound },
  { id: 'garden', label: 'Beds & Plantings', icon: Sprout },
  { id: 'farmbots', label: 'FarmBots', icon: Bot },
  { id: 'other', label: 'Other ThreeD assets', icon: CircleHelp },
] as const;

export function ScenarioContinuationDialog({ scenario, onClose }: { scenario: ScenarioSummary | null; onClose: () => void }) {
  const [assets, setAssets] = useState<ScenarioInventoryAsset[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!scenario) return;
    const controller = new AbortController();
    setAssets(null);
    setError('');
    setLoading(true);
    fetch(`/api/project/assets?projectId=${encodeURIComponent(scenario.projectId)}&moduleType=threed`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.error || 'Project inventory unavailable.');
        if (!controller.signal.aborted) setAssets(result.data);
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Project inventory unavailable.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scenario]);

  const summary = summarizeScenarioInventory(assets ?? []);
  const counts = inventory.map(item => ({ ...item, count: summary.counts[item.id] }));

  return <Dialog open={Boolean(scenario)} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{scenario?.name ?? 'Scenario'}</DialogTitle></DialogHeader>
      {scenario && <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{scenario.projectName} · {scenario.threedName}</p>
          {scenario.description && <p className="text-sm">{scenario.description}</p>}
          <p className="text-xs text-muted-foreground">Saved outline. Project assets below are available to this Project, not assigned to this Scenario.</p>
        </div>
        <section aria-label="Current Project inventory" className="rounded-lg border p-3">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Boxes aria-hidden="true" className="h-4 w-4 text-sky-700 dark:text-sky-300" /> Current Project inventory</h3>
          {loading ? <p className="text-xs text-muted-foreground">Checking Project assets…</p> : error ? <p role="alert" className="text-xs text-destructive">{error}</p> : <>
            <ul className="grid gap-2 sm:grid-cols-2">{counts.map(item => {
              const Icon = item.icon;
              return <li key={item.id} className="flex items-center gap-2 rounded-md border border-foreground/10 bg-foreground/[0.03] px-2.5 py-2 text-xs">
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" />
                <span className="flex-1">{item.label}</span><strong>{item.count}</strong>
              </li>;
            })}</ul>
            <p className="mt-2 text-xs text-muted-foreground">{summary.total === 0 ? 'No active ThreeD assets are assigned yet.' : `${summary.total} active ThreeD asset${summary.total === 1 ? '' : 's'} assigned to this Project.`}</p>
          </>}
        </section>
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-foreground/80"><CircleHelp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" /><span>Inventory is a starting point. Use the Scene setup guide to check specific Models and Sensors; these counts do not verify behavior.</span></div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs font-medium">Next step</p>
          <Button asChild size="sm"><Link href={`/admin/projects/${scenario.projectId}`}>{loading || error ? 'Open Project assets' : summary.nextAction}<ArrowRight aria-hidden="true" className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
        </div>
      </div>}
    </DialogContent>
  </Dialog>;
}
