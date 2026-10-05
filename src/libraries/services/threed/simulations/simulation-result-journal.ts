import type { SimulationResultReport } from './simulation-result-input';

export type SimulationRunStart = { simulationId: number; revision: number; runId: string; clientStartedAt: number };
type Entry = { start: SimulationRunStart; projectId: number; report?: SimulationResultReport; status: 'capturing' | 'captured' | 'saving' | 'saved' | 'error'; error?: string; resultId?: number };
class ResultRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
/** Session queue: retries preserve run identity and never replay an Action. No browser storage or credentials. */
export class SimulationResultJournal {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private version = 0;
  private pending = new Map<string, Promise<void>>();
  constructor(private readonly send: typeof fetch = (...args) => fetch(...args)) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.version;
  list = () => [...this.entries.values()];
  private publish() { this.version++; this.listeners.forEach(listener => listener()); }
  private async request(method: string, data: unknown) {
    const body = JSON.stringify(data);
    const response = await this.send('/api/threed/simulation-results', { method, headers: { 'Content-Type': 'application/json' },
      // Browsers restrict keepalive request bodies to 64 KiB. Larger bounded reports save while the page is open.
      body, keepalive: new TextEncoder().encode(body).byteLength <= 65_536, signal: AbortSignal.timeout(30000) });
    const result = await response.json();
    if (!response.ok || !result.success) throw new ResultRequestError(result.error || 'Simulation result could not be saved.', response.status);
    return result.data;
  }
  async begin(start: SimulationRunStart, projectId: number) {
    // Bound memory without discarding unsaved reports.
    for (const [id, entry] of this.entries) if (entry.status === 'saved') this.entries.delete(id);
    if (this.entries.size >= 20) throw new Error('Retry pending Simulation results before starting another run.');
    const entry: Entry = { start: { ...start }, projectId, status: 'capturing' }; this.entries.set(start.runId, entry); this.publish();
    try {
      const saved = await this.request('POST', start);
      if (saved.runId !== start.runId || saved.status !== 'running' || saved.snapshot?.simulationId !== start.simulationId || saved.simulationRevision !== start.revision) throw new Error('Run capture did not match this Simulation.');
      entry.resultId = saved.id; entry.status = 'captured'; this.publish(); return saved;
    } catch (e) {
      if (e instanceof ResultRequestError) this.entries.delete(start.runId);
      else { entry.status = 'error'; entry.error = e instanceof Error ? e.message : 'Run capture failed.'; }
      this.publish(); throw e;
    }
  }
  finish(runId: string, report: SimulationResultReport): Promise<void> {
    const entry = this.entries.get(runId); if (!entry) return Promise.reject(new Error('Run capture is unavailable.'));
    entry.report ??= JSON.parse(JSON.stringify(report));
    return this.save(entry);
  }
  private save(entry: Entry): Promise<void> {
    const runId = entry.start.runId;
    if (this.pending.has(runId)) return this.pending.get(runId)!;
    if (entry.status === 'saved' || !entry.report) return Promise.resolve();
    const task = (async () => {
      entry.status = 'saving'; entry.error = undefined; this.publish();
      try {
        // An ambiguous network response is resolved with the same idempotent capture before finalization.
        if (!entry.resultId) { const captured = await this.request('POST', entry.start); entry.resultId = captured.id; }
        const saved = await this.request('PATCH', { runId, report: entry.report });
        if (saved.runId !== runId || saved.status !== entry.report!.phase || !Number.isSafeInteger(saved.id) || saved.id < 1) throw new Error('Result acknowledgement did not match the run.');
        entry.resultId = saved.id; entry.status = 'saved';
      } catch (e) { entry.status = 'error'; entry.error = e instanceof Error ? e.message : 'Result save failed.'; }
      finally { this.pending.delete(runId); this.publish(); }
    })();
    this.pending.set(runId, task); return task;
  }
  retry(projectId: number) { return Promise.all(this.list().filter(entry => entry.projectId === projectId && entry.status === 'error' && entry.report).map(entry => this.save(entry))); }
}
export const simulationResultJournal = new SimulationResultJournal();
