'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, CircleHelp, UserRound, Sprout, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { summarizeScenarioInventory, type ScenarioInventoryAsset } from '@/libraries/services/threed/scenarios/scenario-inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { BookOpen, Pencil } from 'lucide-react';
import { ModelFieldHelp } from '../models/ModelFieldHelp';

type ScenarioSummary = {
  id: number;
  projectId: number;
  projectName: string;
  threedName: string;
  name: string;
  description: string | null;
};

const inventory = [
  { id: 'models', label: 'Models', icon: Boxes, color: 'text-sky-500' },
  { id: 'characters', label: 'Characters', icon: UserRound, color: 'text-violet-500' },
  { id: 'garden', label: 'Beds & Plantings', icon: Sprout, color: 'text-emerald-500' },
  { id: 'farmbots', label: 'FarmBots', icon: Bot, color: 'text-amber-500' },
  { id: 'other', label: 'Other ThreeD assets', icon: CircleHelp, color: 'text-muted-foreground' },
] as const;

function ScenarioDetailSurface({ scenario, standalone, onClose, children }: { scenario: ScenarioSummary | null; standalone: boolean; onClose: () => void; children: ReactNode }) {
  if (standalone) return <>
    <AdminWorkspaceHeader icon={BookOpen} title={scenario?.name ?? 'Scenario'} description="View a saved Scenario and its current Project inventory.">
      {scenario && <div className="ml-auto [&_svg]:text-sky-500"><AdminWorkspaceLink href={`/admin/threed/scenarios/${scenario.id}`} icon={Pencil}>Edit Scenario</AdminWorkspaceLink></div>}
    </AdminWorkspaceHeader>
    <section className="admin-editor-panel min-h-0 overflow-y-auto rounded-lg border p-3 text-xs [&_p]:text-xs [&_h3]:text-xs">{children}</section>
  </>;
  return <Dialog open={Boolean(scenario)} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{scenario?.name ?? 'Scenario'}</DialogTitle></DialogHeader>{children}</DialogContent></Dialog>;
}

export function ScenarioContinuationDialog({ scenario, onClose, standalone = false }: { scenario: ScenarioSummary | null; onClose: () => void; standalone?: boolean }) {
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

  return <ScenarioDetailSurface scenario={scenario} standalone={standalone} onClose={onClose}>
      {scenario && <div className="space-y-3 text-xs">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{scenario.projectName} · {scenario.threedName}</p>
          {scenario.description && <p className="text-xs">{scenario.description}</p>}
        </div>
        <section aria-label="Current Project inventory" className="rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold"><Boxes aria-hidden="true" className="h-4 w-4 text-sky-500" /> Current Project inventory</h3>
            <ModelFieldHelp label="Current Project inventory">This Scenario is a saved plan. These assets are available to its Project; they are not assigned to the Scenario. Review Project assets to add or manage them. Inventory counts do not verify Scene readiness or behavior.</ModelFieldHelp>
          </div>
          {loading ? <p className="text-xs text-muted-foreground">Checking Project assets…</p> : error ? <p role="alert" className="text-xs text-destructive">{error}</p> : <>
            <ul className="grid gap-2 sm:grid-cols-2">{counts.map(item => {
              const Icon = item.icon;
              return <li key={item.id} className="flex items-center gap-2 rounded-md border border-foreground/10 px-2.5 py-1.5 text-xs">
                <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${item.color}`} />
                <span className="flex-1">{item.label}</span><strong>{item.count}</strong>
              </li>;
            })}</ul>
            <p className="mt-2 text-xs text-muted-foreground">{summary.total === 0 ? 'No active ThreeD assets are assigned yet.' : `${summary.total} active ThreeD asset${summary.total === 1 ? '' : 's'} assigned to this Project.`}</p>
          </>}
        </section>
        <div className="admin-editor-actions border-t pt-3">
          <Button asChild variant="success" size="sm" className="h-7 text-xs"><Link href={`/admin/projects/${scenario.projectId}`}>{loading || error ? 'Open Project assets' : summary.nextAction}<ArrowRight aria-hidden="true" className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
        </div>
      </div>}
  </ScenarioDetailSurface>;
}
