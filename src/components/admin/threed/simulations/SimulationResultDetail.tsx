'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, Download, FlaskConical, Map, RotateCw } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { simulationActionLabel } from '@/libraries/services/threed/simulations/simulation-input';
import type { SimulationResultSnapshot, SimulationResultReport } from '@/libraries/services/threed/simulations/simulation-result-input';

type Result = { id: number; runId: string; projectId: number; threedId: number; simulationId: number | null; simulationRevision: number; status: string;
  snapshot: SimulationResultSnapshot; report: SimulationResultReport | null; clientStartedAt: string; clientEndedAt: string | null; createdAt: string };

export function SimulationResultDetail({ runId }: { runId: string }) {
  const [record, setRecord] = useState<Result | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); setRecord(null); setLoading(true); setError('');
    fetch(`/api/threed/simulation-results?runId=${encodeURIComponent(runId)}`, { signal: abort.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success || result.data?.runId !== runId) throw new Error(result.error || 'Simulation Result unavailable.');
      if (!abort.signal.aborted) setRecord(result.data);
    }).catch(cause => { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Simulation Result unavailable.'); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [runId, refresh]);
  function exportReport() {
    if (!record) return;
    // Export only the displayed report context, never API ownership fields.
    const report = { id: record.id, runId: record.runId, projectId: record.projectId, threedId: record.threedId, simulationId: record.simulationId,
      simulationRevision: record.simulationRevision, status: record.status, snapshot: record.snapshot, report: record.report,
      clientStartedAt: record.clientStartedAt, clientEndedAt: record.clientEndedAt, createdAt: record.createdAt };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `simulation-result-${record.id}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  const resultsHref = `/admin/threed/simulation-results${record ? `?projectId=${record.projectId}${record.simulationId ? `&simulationId=${record.simulationId}` : ''}` : ''}`;
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 text-xs">
    <AdminWorkspaceHeader icon={ClipboardList} title={record ? `Simulation Result #${record.id}` : 'Simulation Result'} description="Read the captured definition and browser-reported outcome.">
      <div className="ml-auto flex flex-wrap gap-1">
        <AdminWorkspaceLink href={resultsHref} icon={ArrowLeft}>Results</AdminWorkspaceLink>
        {record?.simulationId && <AdminWorkspaceLink href={`/admin/threed/simulations/${record.simulationId}/view`} icon={FlaskConical}>Current definition</AdminWorkspaceLink>}
        {record && <AdminWorkspaceLink href={`/dashboard/scene?projectId=${record.projectId}`} icon={Map}>Project Scene</AdminWorkspaceLink>}
        <Button variant="outline" size="sm" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RotateCw className="h-3.5 w-3.5" /> Refresh</Button>
        <Button variant="outline" size="sm" disabled={!record || loading} onClick={exportReport}><Download className="h-3.5 w-3.5" /> Export report</Button>
      </div>
    </AdminWorkspaceHeader>
    {loading ? <p role="status">Loading Result...</p> : error ? <p role="alert" className="text-destructive">{error} Use Refresh to retry or return to Results.</p> : record && <div className="min-h-0 flex-1 space-y-3 overflow-auto">
      <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
        <h2 className="text-sm font-semibold">{record.snapshot.name}</h2>
        <p>{record.snapshot.projectName} / {record.snapshot.threedName} / Captured revision {record.simulationRevision}</p>
        <p className={record.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300' : record.status === 'running' ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}>
          {record.status === 'running' ? 'Awaiting final report. The browser session may have ended; this is not a live activity indicator.' : `Run ${record.status}.`}
        </p>
        {record.report?.reason && <p>{record.report.reason}</p>}
        <dl className="grid gap-2 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Started (browser time)</dt><dd>{new Date(record.clientStartedAt).toLocaleString()}</dd></div>
          <div><dt className="text-muted-foreground">Finished (browser time)</dt><dd>{record.clientEndedAt ? new Date(record.clientEndedAt).toLocaleString() : 'No final report'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Run ID</dt><dd className="break-all font-mono">{record.runId}</dd></div>
        </dl>
        <p className="text-muted-foreground">Read-only history. The captured definition remains as it was when this run started; editing the current Simulation does not rewrite this report.</p>
        {!record.simulationId && <p className="text-muted-foreground">The Simulation definition was deleted. Its captured definition and report remain available here.</p>}
      </section>
      <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
        <h2 className="text-xs font-semibold">Captured Actions and outcomes</h2>
        <div className="overflow-auto"><Table className="min-w-[700px] [&_td]:text-xs [&_th]:text-xs">
          <TableHeader><TableRow>{['Action', 'Character marker', 'Target marker', 'Timeout / failure policy', 'Outcome'].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{record.snapshot.definition.steps.map((step, index) => {
            const outcome = record.report?.outcomes.find(item => item.stepId === step.id);
            return <TableRow key={step.id}><TableCell>{index + 1}. {simulationActionLabel(step.action)}</TableCell><TableCell className="break-all">{step.actorMarkerId}</TableCell><TableCell className="break-all">{step.targetMarkerId}</TableCell>
              <TableCell>{step.timeoutMs / 1000}s / {step.onFailure}</TableCell><TableCell>{outcome ? <>{outcome.status} ({((outcome.endedAt - outcome.startedAt) / 1000).toFixed(2)}s){outcome.reason && <p>{outcome.reason}</p>}</> : record.report ? 'No outcome reported' : 'Awaiting report'}</TableCell></TableRow>;
          })}</TableBody>
        </Table></div>
      </section>
      <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
        <h2 className="text-xs font-semibold">Sensor observations</h2>
        <p className="text-muted-foreground">Browser-reported activity during the run. A completed kick and sensor counts do not certify a goal or prove causation.</p>
        {!record.snapshot.definition.observations.length && <p>No observations were configured.</p>}
        {record.snapshot.definition.observations.map(source => {
          const observation = record.report?.observations.find(item => item.groupId === source.sensorGroupId);
          return <div key={source.id} className="rounded-md border p-2">
            <h3 className="font-medium">{observation?.name ?? source.sensorGroupId}</h3>
            <p className="text-muted-foreground">{source.sensors ? `${source.sensors.length} selected Sensors` : 'All Sensors in group'}</p>
            {observation ? <><p>Baseline {observation.baseline} / Final {observation.final} / Change {observation.delta} / Events {observation.events}</p>
              {observation.countersReset && <p>Counter reset observed.</p>}{observation.truncated && <p>Event report limit reached.</p>}
              <ul className="space-y-1">{observation.sensors.map(sensor => <li key={`${sensor.ownerMarkerId}:${sensor.id}`}>{sensor.name} ({sensor.behavior}): {sensor.baseline} to {sensor.final} <span className="text-muted-foreground">/ Owner #{sensor.ownerMarkerId}, Sensor {sensor.id}</span></li>)}</ul>
            </> : <p>{record.report ? 'No observation reported.' : 'Awaiting final readings.'}</p>}
          </div>;
        })}
      </section>
    </div>}
  </div>;
}
