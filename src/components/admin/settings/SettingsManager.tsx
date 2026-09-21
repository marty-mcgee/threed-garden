'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, RotateCcw, RefreshCw } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useWorkspaceSettings } from '@/components/settings/WorkspaceSettingsProvider';
import { defaultWorkspaceSettings, workspaceModules, workspaceModuleLabels, workspaceLinks, type WorkspaceSettings } from '@/libraries/config/workspace-settings';

export function SettingsManager() {
  const { snapshot, loading, saving, error, refresh, save } = useWorkspaceSettings();
  const [draft, setDraft] = useState<WorkspaceSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { setDraft(snapshot?.preferences ?? null); setMessage(null); }, [snapshot]);
  const dirty = !!draft && !!snapshot && JSON.stringify(draft) !== JSON.stringify(snapshot.preferences);
  const unavailable = loading || saving || !snapshot || !!error;
  const control = 'h-8 gap-1.5 text-xs [@media(pointer:coarse)]:min-h-11';

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const handleSave = async () => {
    if (!draft || !snapshot) return;
    setMessage(null);
    try { await save(draft, snapshot.revision); }
    catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Unable to save Settings. Please retry.'); }
  };
  const handleRefresh = () => {
    if (dirty && !window.confirm('Discard unsaved Settings and load the saved preferences?')) return;
    setMessage(null);
    void refresh();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <AdminWorkspaceHeader icon={Settings} title="Settings" description="Your personal workspace appearance and navigation preferences.">
        <span className="text-xs text-muted-foreground">My workspace</span>
        <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {saving ? 'Saving…' : loading ? 'Loading…' : error ? 'Unavailable' : dirty ? 'Unsaved changes' : snapshot?.revision ? 'Saved' : 'Defaults'}
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button size="sm" className={control} disabled={unavailable || !dirty} onClick={handleSave}><Save aria-hidden="true" className="h-3.5 w-3.5" />Save Changes</Button>
          <Button variant="outline" size="sm" className={control} disabled={saving || !dirty} onClick={() => { setDraft(snapshot?.preferences ?? null); setMessage(null); }}><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />Discard</Button>
          <Button variant="outline" size="sm" className={control} disabled={loading || saving} onClick={handleRefresh}><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Refresh</Button>
        </div>
      </AdminWorkspaceHeader>
      {(error || message) && <p role="alert" className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{error || message}</p>}
      {loading && !draft && <p role="status" className="p-2 text-sm text-muted-foreground">Loading your Settings…</p>}
      {draft && <div className="min-h-0 flex-1 overflow-y-auto space-y-3 pb-2">
        <fieldset disabled={unavailable} className="rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">Appearance</legend>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="workspace-theme" className="text-sm">Theme</label>
            <select id="workspace-theme" value={draft.theme} onChange={event => setDraft({ ...draft, theme: event.target.value as WorkspaceSettings['theme'] })} className="h-8 rounded-md border bg-background px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring [@media(pointer:coarse)]:min-h-11">
              <option value="browser">Use browser preference</option><option value="dark">Dark</option><option value="light">Light</option><option value="system">Follow device</option>
            </select>
          </div>
        </fieldset>
        <fieldset disabled={unavailable} className="rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">Module Navigation</legend>
          <p className="mb-2 text-xs text-muted-foreground">Show in the Admin sidebar, Dashboard menu and Dashboard quick links.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {workspaceModules.map(module => <label key={module} htmlFor={`workspace-${module}`} className="flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
              {workspaceModuleLabels[module]}
              <Switch id={`workspace-${module}`} checked={draft.modules[module]} onCheckedChange={checked => setDraft({ ...draft, modules: { ...draft.modules, [module]: checked } })} />
            </label>)}
          </div>
        </fieldset>
        <fieldset disabled={unavailable} className="rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">Dashboard Menu Links</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['threed', 'traffic'] as const).map(module => <div key={module}>
              <h2 className="mb-1 text-xs font-medium text-muted-foreground">{workspaceModuleLabels[module]}</h2>
              <div className="space-y-1">
                {workspaceLinks.filter(link => link.module === module).map(link => <label key={link.key} htmlFor={`workspace-link-${link.key}`} className="flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                  {link.label}
                  <Switch id={`workspace-link-${link.key}`} disabled={!draft.modules[module] || unavailable} checked={draft.links[link.key]} onCheckedChange={checked => setDraft({ ...draft, links: { ...draft.links, [link.key]: checked } })} />
                </label>)}
              </div>
            </div>)}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <details className="min-w-0 flex-1 rounded-md border p-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-foreground">About these Settings</summary>
            <div className="mt-2 space-y-2">
              <p>Save Changes stores these preferences for your signed-in account. Navigation updates immediately; your preferences return when you sign in or reload.</p>
              <p>Hiding navigation does not remove Projects, deny route access or stop services. Settings and Project navigation stay available.</p>
              <p>A saved theme is applied on load and Save. The header theme button still changes this browser temporarily. Use browser preference leaves appearance to that browser; Follow device uses its light/dark setting.</p>
              <p>Polling, scheduled jobs, API documentation and integration controls are not offered here because they are not connected to a supported settings execution path.</p>
            </div>
          </details>
          <Button variant="outline" size="sm" className={control} disabled={unavailable} onClick={() => { setDraft(defaultWorkspaceSettings()); setMessage(null); }}>Restore Defaults</Button>
        </div>
      </div>}
    </div>
  );
}
