'use client';

import { ModelPreviewSettings } from '@/components/settings/ModelPreviewSettings';
import { PanelAppearanceSettings, usePanelAppearance, type PanelAppearance } from '@/components/settings/PanelAppearance';
import { useEffect, useState } from 'react';
import { Settings, Save, RotateCcw, RefreshCw, Palette, PanelsTopLeft, Link2, Info, Box, Music, TrafficCone, CloudSun, ChartNoAxesCombined, Radio, History, Route, MapPin, Flame } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useWorkspaceSettings } from '@/components/settings/WorkspaceSettingsProvider';
import { defaultWorkspaceSettings, workspaceModules, workspaceModuleLabels, workspaceLinks, type WorkspaceSettings } from '@/libraries/config/workspace-settings';

const preferenceIcons = {
  threed: { icon: Box, color: 'text-blue-500' },
  multimedia: { icon: Music, color: 'text-violet-500' },
  traffic: { icon: TrafficCone, color: 'text-amber-500' },
  weather: { icon: CloudSun, color: 'text-sky-500' },
  analytics: { icon: ChartNoAxesCombined, color: 'text-emerald-500' },
  chpCad: { icon: Radio, color: 'text-blue-500' },
  chpHistorical: { icon: History, color: 'text-violet-500' },
  caltrans: { icon: Route, color: 'text-amber-500' },
  bayArea511: { icon: MapPin, color: 'text-cyan-500' },
  calfire: { icon: Flame, color: 'text-orange-500' },
} as const;

function PreferenceIcon({ name }: { name: keyof typeof preferenceIcons }) {
  const { icon: Icon, color } = preferenceIcons[name];
  return <Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${color}`} />;
}

export function SettingsManager() {
  const { snapshot, loading, saving, error, refresh, save } = useWorkspaceSettings();
  const panelAppearance = usePanelAppearance();
  const [opacityDraft, setOpacityDraft] = useState<PanelAppearance | null>(null);
  useEffect(() => { setOpacityDraft(panelAppearance?.value ?? null); }, [panelAppearance?.value]);
  const [draft, setDraft] = useState<WorkspaceSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { setDraft(snapshot?.preferences ?? null); setMessage(null); }, [snapshot]);
  const workspaceDirty = !!draft && !!snapshot && JSON.stringify(draft) !== JSON.stringify(snapshot.preferences);
  const opacityDirty = !!opacityDraft && !!panelAppearance && (opacityDraft.idle !== panelAppearance.value.idle || opacityDraft.hover !== panelAppearance.value.hover);
  const dirty = workspaceDirty || opacityDirty;
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
    try {
      if (workspaceDirty) await save(draft, snapshot.revision);
      if (opacityDirty && opacityDraft && panelAppearance && !panelAppearance.update(opacityDraft)) {
        setMessage('Panel opacity could not be saved in this browser. Your changes are retained; please retry.');
      }
    }
    catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Unable to save Settings. Please retry.'); }
  };
  const handleRefresh = () => {
    if (dirty && !window.confirm('Discard unsaved Settings and load the saved preferences?')) return;
    setMessage(null);
    setOpacityDraft(panelAppearance?.value ?? null);
    void refresh();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <AdminWorkspaceHeader icon={Settings} title="Settings" description="Your personal workspace appearance and navigation preferences.">
        <span className="text-xs text-muted-foreground">My workspace</span>
        <span role="status" aria-live="polite" className={`rounded-full border px-2 py-0.5 text-[11px] ${error ? 'border-destructive/30 text-destructive' : dirty ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' : 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
          {saving ? 'Saving…' : loading ? 'Loading…' : error ? 'Unavailable' : dirty ? 'Unsaved changes' : snapshot?.revision ? 'Saved' : 'Defaults'}
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button size="sm" className={control} disabled={unavailable || !dirty} onClick={handleSave}><Save aria-hidden="true" className="h-3.5 w-3.5" />Save Changes</Button>
          <Button variant="outline" size="sm" className={control} disabled={saving || !dirty} onClick={() => { setDraft(snapshot?.preferences ?? null); setOpacityDraft(panelAppearance?.value ?? null); setMessage(null); }}><RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />Discard</Button>
          <Button variant="outline" size="sm" className={control} disabled={loading || saving} onClick={handleRefresh}><RefreshCw aria-hidden="true" className="h-3.5 w-3.5 text-sky-500" />Refresh</Button>
        </div>
      </AdminWorkspaceHeader>
      {(error || message) && <p role="alert" className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{error || message}</p>}
      {loading && !draft && <p role="status" className="p-2 text-sm text-muted-foreground">Loading your Settings…</p>}
      {draft && <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 pb-2">
        <div className="grid items-start gap-3 xl:grid-cols-2">
          {opacityDraft && <PanelAppearanceSettings value={opacityDraft} onChange={setOpacityDraft} disabled={unavailable || !panelAppearance?.ready} />}
          <ModelPreviewSettings />
        </div>
        <fieldset disabled={unavailable} className="rounded-md border p-3">
          <legend className="px-1 text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><Palette aria-hidden="true" className="h-3.5 w-3.5 text-violet-500" />Appearance</span></legend>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="workspace-theme" className="text-xs">Theme</label>
            <select id="workspace-theme" value={draft.theme} onChange={event => setDraft({ ...draft, theme: event.target.value as WorkspaceSettings['theme'] })} className="h-8 rounded-md border bg-background px-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring [@media(pointer:coarse)]:min-h-11">
              <option value="browser">Use browser preference</option><option value="dark">Dark</option><option value="light">Light</option><option value="system">Follow device</option>
            </select>
          </div>
        </fieldset>
        <fieldset disabled={unavailable} className="rounded-md border p-3">
          <legend className="px-1 text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><PanelsTopLeft aria-hidden="true" className="h-3.5 w-3.5 text-blue-500" />Module Navigation</span></legend>
          <p className="mb-2 text-xs text-muted-foreground">Show in the Admin sidebar, Dashboard menu and Dashboard quick links.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {workspaceModules.map(module => <label key={module} htmlFor={`workspace-${module}`} className="flex min-h-9 items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/40 [@media(pointer:coarse)]:min-h-11">
              <span className="flex items-center gap-2"><PreferenceIcon name={module} />{workspaceModuleLabels[module]}</span>
              <Switch id={`workspace-${module}`} checked={draft.modules[module]} onCheckedChange={checked => setDraft({ ...draft, modules: { ...draft.modules, [module]: checked } })} />
            </label>)}
          </div>
        </fieldset>
        <fieldset disabled={unavailable} className="rounded-md border p-3">
          <legend className="px-1 text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><Link2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-500" />Dashboard Menu Links</span></legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['threed', 'traffic'] as const).map(module => <div key={module}>
              <h2 className="mb-1 text-xs font-medium text-muted-foreground">{workspaceModuleLabels[module]}</h2>
              <div className="space-y-1">
                {workspaceLinks.filter(link => link.module === module).map(link => <label key={link.key} htmlFor={`workspace-link-${link.key}`} className="flex min-h-9 items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/40 [@media(pointer:coarse)]:min-h-11">
                  <span className="flex items-center gap-2"><PreferenceIcon name={link.key} />{link.label}</span>
                  <Switch id={`workspace-link-${link.key}`} disabled={!draft.modules[module] || unavailable} checked={draft.links[link.key]} onCheckedChange={checked => setDraft({ ...draft, links: { ...draft.links, [link.key]: checked } })} />
                </label>)}
              </div>
            </div>)}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <details className="min-w-0 flex-1 rounded-md border p-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-foreground"><span className="inline-flex items-center gap-1.5"><Info aria-hidden="true" className="h-3.5 w-3.5 text-sky-500" />About these Settings</span></summary>
            <div className="mt-2 space-y-2">
              <p>Save Changes stores theme and navigation preferences for your signed-in account, and panel opacity in this browser. Navigation updates immediately; your preferences return when you sign in or reload.</p>
              <p>Hiding navigation does not remove Projects, deny route access or stop services. Settings and Project navigation stay available.</p>
              <p>A saved theme is applied on load and Save. The header theme button still changes this browser temporarily. Use browser preference leaves appearance to that browser; Follow device uses its light/dark setting.</p>
            </div>
          </details>
          <Button variant="outline" size="sm" className={control} disabled={unavailable} onClick={() => { setDraft(defaultWorkspaceSettings()); setMessage(null); }}><RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />Restore Defaults</Button>
        </div>
      </div>}
    </div>
  );
}
