'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SensorGroup } from '@/libraries/services/threed/physics/sensor-group-core';
import { IMPORTED_SENSOR_GROUP } from '@/libraries/services/threed/physics/sensor-legacy-compat';

type Workspace = { groups: SensorGroup[]; loading: boolean; saving: boolean; error: string | null; save: (group: SensorGroup, operation?: 'upsert' | 'delete') => Promise<boolean> };
const Context = createContext<Workspace | null>(null);
export const useSensorGroups = () => useContext(Context);
function ProjectGroups({ projectId, children }: { projectId: string | null; children: ReactNode }) {
  const [groups, setGroups] = useState<SensorGroup[]>([IMPORTED_SENSOR_GROUP]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const projectRef = useRef(projectId);
  projectRef.current = projectId;
  const [loadedProject, setLoadedProject] = useState<string | null | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    const controller = new AbortController();
    mounted.current = true;
    setLoading(true); setError(null);
    if (!projectId) { setLoadedProject(projectId); setLoading(false); return; }
    fetch(`/api/project/sensor-groups?projectId=${encodeURIComponent(projectId)}`, { signal: controller.signal })
      .then(async response => { const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'Could not load groups'); return result.data; })
      .then(data => { if (!controller.signal.aborted) { setGroups(data); setLoadedProject(projectId); } })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { mounted.current = false; controller.abort(); };
  }, [projectId]);
  const save: Workspace['save'] = async (group, operation = 'upsert') => {
    if (!projectId || busy.current || loading || loadedProject !== projectId) return false;
    busy.current = true; setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/project/sensor-groups?projectId=${encodeURIComponent(projectId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation, group }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save group');
      if (mounted.current && projectRef.current === projectId) setGroups(result.data);
      return true;
    } catch (error) { if (mounted.current && projectRef.current === projectId) setError(error instanceof Error ? error.message : 'Could not save group'); return false; }
    finally { busy.current = false; if (mounted.current) setSaving(false); }
  };
  return <Context.Provider value={{ groups: loadedProject === projectId ? groups : [IMPORTED_SENSOR_GROUP], loading: loading || loadedProject !== projectId, saving, error, save }}>{children}</Context.Provider>;
}
export function SensorGroupsWorkspace({ children }: { children: ReactNode }) {
  const projectId = useSearchParams().get('projectId');
  return <ProjectGroups projectId={projectId}>{children}</ProjectGroups>;
}
export function SensorGroupEditor() {
  const workspace = useSensorGroups();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  if (!workspace) return null;
  return <details className="rounded border border-white/10 p-2 text-[10px]">
    <summary>Manage Sensor Groups</summary>
    <div className="mt-2 space-y-2">
      <select aria-label="Group to edit" value={id} onChange={event => { setId(event.target.value); setName(workspace.groups.find(group => group.id === event.target.value)?.name ?? ''); }}>
        <option value="">New group</option>
        {workspace.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select>
      <input aria-label="Group name" placeholder="Group name" value={name} maxLength={80} onChange={event => setName(event.target.value)} />
      <button type="button" disabled={!name.trim() || workspace.saving || workspace.loading} onClick={async () => {
        const groupId = id || crypto.randomUUID();
        if (await workspace.save({ id: groupId, name })) { setId(groupId); }
      }} className="rounded border border-white/20 p-1">Save Group</button>
      {id && <button type="button" disabled={workspace.saving || workspace.loading} onClick={async () => { if (await workspace.save({ id, name: name || 'Group' }, 'delete')) { setId(''); setName(''); } }} className="ml-2 rounded border border-red-300/30 p-1">Delete Empty Group</button>}
      {workspace.error && <p role="alert" className="text-red-200">{workspace.error}</p>}
      <p>Group names save immediately. Sensor membership saves with the sensor.</p>
    </div>
  </details>;
}
