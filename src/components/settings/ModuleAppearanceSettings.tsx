'use client';

import { SettingsSection } from '@/components/settings/SettingsSection';
import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { defaultModuleAppearance, moduleColors, moduleDefinitions, moduleKeys, moduleIconNames, type ModuleAppearanceSnapshot, type ModuleStyle } from '@/libraries/config/module-appearance';
import { useModuleAppearance } from './ModuleAppearanceProvider';
import { moduleIcons } from './module-icons';

const moduleGroups = [
  { key: 'users', label: 'Users', path: '/admin/users' },
  { key: 'projects', label: 'Projects', path: '/admin/projects' },
  { key: 'threed', label: 'ThreeD', path: '/admin/threed' },
  { key: 'multimedia', label: 'Multimedia', path: '/admin/multimedia' },
  { key: 'traffic', label: 'Traffic', path: '/admin/traffic' },
] as const;
const compactControl = 'h-7 min-w-0 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 [@media(pointer:coarse)]:min-h-11';
const compactAction = 'h-7 gap-1.5 px-2 text-xs [@media(pointer:coarse)]:min-h-11';

export function ModuleAppearanceSettings() {
  const context=useModuleAppearance();
  const [draft,setDraft]=useState<ModuleAppearanceSnapshot|null>(null);
  const [message,setMessage]=useState<string|null>(null);
  useEffect(()=>{setDraft(context?.loaded?context.snapshot:null);},[context?.snapshot,context?.loaded]);
  const dirty=!!draft && JSON.stringify(draft)!==JSON.stringify(context?.snapshot);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  if(!context)return null;
  const disabled=context.busy||!context.loaded||!context.canEdit||!!context.error;
  return <SettingsSection section="modules" className="admin-editor-panel rounded-md border border-border/60">
    <summary className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11"><span className="inline-flex items-center gap-1.5 align-middle"><Palette aria-hidden="true" className="h-3.5 w-3.5 text-pink-500" />Module colors and icons <span className="font-normal text-muted-foreground">Global App Settings</span>{dirty && <span className="text-amber-600 dark:text-amber-400">Unsaved</span>}{context.error && <span className="text-destructive">Unavailable</span>}</span></summary>
    <div className="space-y-2 px-3 pb-3">
    <p className="text-xs text-muted-foreground">Shared by every user. Only active Super Admin accounts can save changes. Personal navigation visibility stays unchanged.</p>
    {context.error && <p role="alert" className="text-sm text-destructive">{context.error}</p>}
    {!context.loaded&&!context.error&&<p role="status" className="text-sm">Loading Module appearance…</p>}
    {context.loaded&&!context.canEdit&&<p className="text-xs text-muted-foreground">Read only: an active Super Admin account is required to edit.</p>}
    <fieldset disabled={disabled} className="min-w-0 space-y-1.5">
      {draft&&moduleGroups.map(group=>{
        const keys = moduleKeys.filter(key => moduleDefinitions[key].route === group.path || moduleDefinitions[key].route.startsWith(group.path + '/'));
        const GroupIcon = moduleIcons[draft.styles[group.key].icon];
        const changed = keys.filter(key => JSON.stringify(draft.styles[key]) !== JSON.stringify(context.snapshot.styles[key])).length;
        return <details key={group.key} className="admin-editor-panel min-w-0 rounded-md border border-border/60">
          <summary className="cursor-pointer rounded-md px-2 py-2 text-xs font-semibold hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11">
            <span className="inline-flex items-center gap-1.5 align-middle">
            <GroupIcon aria-hidden="true" className={`h-3.5 w-3.5 ${moduleColors[draft.styles[group.key].color]}`} />
            {group.label}<span className="rounded border px-1 text-[10px] font-normal text-muted-foreground">{keys.length}</span>
            {changed > 0 && <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">{changed} unsaved</span>}
            </span>
          </summary>
          <div className="ml-4 space-y-1 border-l border-border/60 px-2 pb-2">
      {keys.map(key=>{
        const style=draft.styles[key];const Icon=moduleIcons[style.icon];
        const update=(patch:Partial<ModuleStyle>)=>setDraft({...draft,styles:{...draft.styles,[key]:{...style,...patch}}});
        const changed = JSON.stringify(style) !== JSON.stringify(context.snapshot.styles[key]);
        return <details key={key} className="admin-editor-panel min-w-0 rounded-md">
          <summary className="cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11"><span className="inline-flex items-center gap-1.5 align-middle"><Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${moduleColors[style.color]}`}/>{moduleDefinitions[key].label}{changed && <span className="text-[10px] text-amber-600 dark:text-amber-400">Unsaved</span>}</span></summary>
          <div className="ml-4 grid max-w-md grid-cols-2 gap-1.5 px-2 pb-2">
            <label className="min-w-0"><span className="sr-only">Color</span><select aria-label={`${moduleDefinitions[key].label} color`} className={compactControl} value={style.color} onChange={e=>update({color:e.target.value as ModuleStyle['color']})}>{Object.keys(moduleColors).map(color=><option key={color}>{color}</option>)}</select></label>
            <label className="min-w-0"><span className="sr-only">Lucide icon</span><select aria-label={`${moduleDefinitions[key].label} icon`} className={compactControl} value={style.icon} onChange={e=>update({icon:e.target.value as ModuleStyle['icon']})}>{moduleIconNames.map(icon=><option key={icon}>{icon}</option>)}</select></label>
          </div>
        </details>;
      })}
          </div>
        </details>;
      })}
    </fieldset>
    <div className="admin-editor-actions border-t pt-2">
      <Button type="button" size="sm" className={compactAction} disabled={disabled||!dirty} onClick={async()=>{if(!draft)return;try{await context.save(draft);setMessage('Module appearance saved for all users.');}catch(error){setMessage(error instanceof Error?error.message:'Save failed.');}}}>Save Module appearance</Button>
      <Button type="button" size="sm" className={compactAction} variant="outline" disabled={disabled||!dirty} onClick={()=>{setDraft(context.snapshot);setMessage(null);}}>Discard</Button>
      <Button type="button" size="sm" className={compactAction} variant="outline" disabled={disabled} onClick={()=>setDraft({...defaultModuleAppearance(),revision:context.snapshot.revision})}>Restore defaults</Button>
      <Button type="button" size="sm" className={compactAction} variant="outline" disabled={context.busy} onClick={()=>{if(!dirty||window.confirm('Discard unsaved Module appearance changes and reload?'))void context.reload();}}>Reload</Button>
    </div>
    {message&&<p role="status" className="text-sm">{message}</p>}
    </div>
  </SettingsSection>;
}
