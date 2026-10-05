'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FlaskConical, Pencil, RotateCcw } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { ModelFieldHelp } from '../models/ModelFieldHelp';
import { SimulationDefinitionEditor, emptySimulationChoices, type SimulationChoices } from './SimulationDefinitionEditor';
import { emptySimulationDefinition, parseSimulationDefinition, simulationFields, type SimulationDefinition } from '@/libraries/services/threed/simulations/simulation-input';

type Form = { projectId: string; threedId: string; scenarioId: string; name: string; slug: string; description: string; isActive: boolean; definition: SimulationDefinition };
type RecordData = { id: number; revision: number; projectName: string; threedName: string; projectId: number; threedId: number; scenarioId: number | null; name: string; slug: string; description: string | null; isActive: boolean; definition: unknown };
const blank = (projectId?: number): Form => ({ projectId: projectId ? String(projectId) : '', threedId: '', scenarioId: '', name: '', slug: '', description: '', isActive: false, definition: emptySimulationDefinition() });
const toForm = (row: RecordData): Form => ({ projectId: String(row.projectId), threedId: String(row.threedId), scenarioId: row.scenarioId ? String(row.scenarioId) : '', name: row.name, slug: row.slug, description: row.description ?? '', isActive: row.isActive, definition: parseSimulationDefinition(row.definition) });
export function SimulationEditor({ id, projectId, readOnly = false }: { id?: number; projectId?: number; readOnly?: boolean }) {
  const router = useRouter(), { showToast, ToastComponent } = useToast();
  const lock = useRef(false);
  const [form, setForm] = useState<Form>(() => blank(projectId)), [baseline, setBaseline] = useState(() => JSON.stringify(blank(projectId)));
  const [record, setRecord] = useState<RecordData | null>(null), [loading, setLoading] = useState(!!id), [loadError, setLoadError] = useState(''), [reload, setReload] = useState(0);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]), [modules, setModules] = useState<{ id: number; name: string }[]>([]);
  const [choices, setChoices] = useState<SimulationChoices>(emptySimulationChoices), [choicesLoading, setChoicesLoading] = useState(false), [choicesError, setChoicesError] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const dirty = !readOnly && JSON.stringify(form) !== baseline;
  function close() { if (lock.current || busy || (dirty && !window.confirm('Discard unsaved Simulation changes?'))) return; router.push('/admin/threed/simulations'); }
  function refresh() { if (lock.current || (dirty && !window.confirm('Reload and discard unsaved Simulation changes?'))) return; setReload(value => value + 1); }
  function changeBinding(projectId: string, threedId = '') {
    if ((form.scenarioId || form.definition.steps.length || form.definition.observations.length) && !window.confirm('Changing the Project or module clears its Scenario, Actions and observation choices. Continue?')) return;
    setForm(value => ({ ...value, projectId, threedId, scenarioId: '', definition: emptySimulationDefinition(), isActive: false })); setError('');
  }
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download') || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (lock.current || busy || !window.confirm('Discard unsaved Simulation changes?')) return;
      window.removeEventListener('beforeunload', warn); window.location.assign(anchor.href);
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [dirty, busy]);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController(); setLoading(true); setLoadError(''); setError('');
    fetch(`/api/threed/simulations?id=${id}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success || result.data?.id !== id) throw new Error(result.error || 'Simulation unavailable.');
      const draft = toForm(result.data);
      if (!controller.signal.aborted) { setRecord(result.data); setForm(draft); setBaseline(JSON.stringify(draft)); }
    }).catch(e => { if (!controller.signal.aborted) setLoadError(e instanceof Error ? e.message : 'Simulation unavailable.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reload]);
  useEffect(() => {
    if (id) return;
    const controller = new AbortController();
    fetch('/api/project', { signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Projects unavailable.');
      if (!controller.signal.aborted) setProjects(result.data);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    if (id || !form.projectId) { setModules([]); return; }
    const controller = new AbortController(); setModules([]);
    fetch(`/api/project/modules?projectId=${form.projectId}`, { signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok || !result.success) throw new Error('ThreeD modules unavailable.');
      if (!controller.signal.aborted) setModules(result.data?.threed ?? []);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [id, form.projectId]);
  useEffect(() => {
    setChoices(emptySimulationChoices); setChoicesError('');
    if (!form.projectId || !form.threedId) { setChoicesLoading(false); return; }
    const controller = new AbortController(); setChoicesLoading(true);
    fetch(`/api/threed/simulations?options=1&projectId=${form.projectId}&threedId=${form.threedId}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'Project choices unavailable.');
      if (!controller.signal.aborted) setChoices(result.data);
    }).catch(e => { if (!controller.signal.aborted) setChoicesError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setChoicesLoading(false); });
    return () => controller.abort();
  }, [form.projectId, form.threedId, reload]);
  async function save() {
    if (lock.current || loading || loadError || choicesLoading || choicesError || readOnly) return;
    let fields;
    try { fields = simulationFields({ name: form.name, slug: form.slug, description: form.description, isActive: form.isActive, scenarioId: form.scenarioId ? Number(form.scenarioId) : null, definition: form.definition }, false); }
    catch (e) { const message = e instanceof Error ? e.message : 'Check the Simulation definition.'; setError(message); showToast(message, 'error'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/threed/simulations', { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000), body: JSON.stringify({ ...fields, ...(id ? { id, revision: record?.revision } : { projectId: Number(form.projectId), threedId: Number(form.threedId) }) }) });
      const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'Could not save Simulation.');
      const draft = toForm({ ...result.data, projectName: record?.projectName ?? '', threedName: record?.threedName ?? '' });
      setRecord({ ...result.data, projectName: record?.projectName ?? '', threedName: record?.threedName ?? '' }); setForm(draft); setBaseline(JSON.stringify(draft));
      showToast(id ? 'Simulation updated.' : 'Simulation created.', 'success');
      if (!id) router.replace(`/admin/threed/simulations/${result.data.id}?created=1`);
    } catch (e) { const message = e instanceof Error ? e.message : 'Could not save Simulation.'; setError(message); showToast(message, 'error'); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { if (id && new URLSearchParams(window.location.search).get('created') === '1') showToast('Simulation created.', 'success'); }, [id]);
  return <div className="flex min-h-0 flex-1 flex-col gap-2 text-xs">
    {ToastComponent}
    <AdminWorkspaceHeader icon={FlaskConical} title={readOnly ? 'View Simulation' : id ? 'Edit Simulation' : 'New Simulation'} description="Manage a Project-owned Simulation definition.">
      <ModelFieldHelp label="Simulation">A Simulation plans ordered Actions and Sensor Group observations. Saving stores its definition. Scene execution and results are added separately.</ModelFieldHelp>
      {record && <span className="text-xs text-muted-foreground">#{record.id} · Revision {record.revision}</span>}
      <div className="ml-auto flex gap-1"><AdminWorkspaceLink href="/admin/threed/simulations" icon={ArrowLeft}>Simulations</AdminWorkspaceLink>{readOnly && id && <AdminWorkspaceLink href={`/admin/threed/simulations/${id}`} icon={Pencil}>Edit</AdminWorkspaceLink>}{id && <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Reload Simulation" disabled={busy || loading} onClick={refresh}><RotateCcw className="h-3.5 w-3.5" /></Button>}</div>
    </AdminWorkspaceHeader>
    {loading ? <p role="status">Loading Simulation…</p> : loadError ? <p role="alert" className="text-destructive">{loadError}</p> : <div className="min-h-0 flex-1 overflow-y-auto">
      <fieldset disabled={busy} className="admin-editor-panel space-y-3 text-xs [&_input]:h-8 [&_input]:text-xs [&_label]:text-xs [&_select]:h-8 [&_select]:rounded-md [&_select]:border [&_select]:bg-background [&_select]:px-2 [&_select]:text-xs [&_textarea]:text-xs [&_[data-slot=switch]]:h-4 [&_[data-slot=switch]]:w-7 [&_[data-slot=switch-thumb]]:size-3">
        <section className="admin-editor-panel grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <div><Label htmlFor="simulation-project">Project</Label>{id ? <Input id="simulation-project" disabled value={record?.projectName ?? form.projectId} /> : <select id="simulation-project" className="w-full" value={form.projectId} onChange={event => changeBinding(event.target.value)}><option value="">Choose a Project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>}</div>
          <div><Label htmlFor="simulation-module">ThreeD module</Label>{id ? <Input id="simulation-module" disabled value={record?.threedName ?? form.threedId} /> : <select id="simulation-module" className="w-full" value={form.threedId} disabled={!form.projectId} onChange={event => changeBinding(form.projectId, event.target.value)}><option value="">Choose an assigned ThreeD module</option>{modules.map(module => <option key={module.id} value={module.id}>{module.name}</option>)}</select>}</div>
          <div><Label htmlFor="simulation-name">Name *</Label><Input id="simulation-name" disabled={readOnly} maxLength={120} value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value, slug: !id && (!value.slug || value.slug === value.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) ? event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/, '') : value.slug }))} /></div>
          <div><Label htmlFor="simulation-slug">Slug *</Label><Input id="simulation-slug" disabled={readOnly} maxLength={100} value={form.slug} onChange={event => setForm(value => ({ ...value, slug: event.target.value }))} /></div>
          <div className="sm:col-span-2"><Label htmlFor="simulation-description">Description</Label><Textarea id="simulation-description" disabled={readOnly} maxLength={2000} value={form.description} onChange={event => setForm(value => ({ ...value, description: event.target.value }))} /></div>
          <div className="sm:col-span-2"><Label htmlFor="simulation-scenario">Scenario (optional)</Label><select id="simulation-scenario" disabled={readOnly || choicesLoading || !!choicesError} className="w-full" value={form.scenarioId} onChange={event => setForm(value => ({ ...value, scenarioId: event.target.value }))}><option value="">No Scenario</option>{form.scenarioId && !choices.scenarios.some(row => String(row.id) === form.scenarioId) && <option value={form.scenarioId}>Unavailable Scenario ({form.scenarioId})</option>}{choices.scenarios.map(row => <option key={row.id} value={row.id}>{row.name}{row.isActive ? '' : ' (inactive)'}</option>)}</select></div>
          <div className="flex items-center gap-2"><Switch id="simulation-active" disabled={readOnly} checked={form.isActive} onCheckedChange={isActive => setForm(value => ({ ...value, isActive }))} /><Label htmlFor="simulation-active">Active</Label><ModelFieldHelp label="Simulation Active">Active makes a saved definition available. It does not run the Simulation or certify Scene readiness.</ModelFieldHelp></div>
        </section>
        {choicesLoading && <p role="status" className="text-muted-foreground">Loading Project choices…</p>}{choicesError && <p role="alert" className="text-destructive">{choicesError}</p>}
        <fieldset disabled={choicesLoading || !!choicesError || !form.threedId}><SimulationDefinitionEditor value={form.definition} choices={choices} readOnly={readOnly} onChange={definition => setForm(value => ({ ...value, definition }))} /></fieldset>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {!readOnly && <footer className="admin-editor-actions border-t pt-3"><Button variant="success" size="sm" disabled={busy || loading || !!loadError || choicesLoading || !!choicesError || !form.projectId || !form.threedId || !form.name.trim() || !form.slug.trim() || (!!id && !dirty)} onClick={() => void save()}>{busy ? 'Saving…' : 'Save Changes'}</Button><Button variant="outline" size="sm" disabled={busy} onClick={close}>Cancel</Button></footer>}
      </fieldset>
    </div>}
  </div>;
}
