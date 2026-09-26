'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { validSceneTransform, type SceneOwnerPose, type SceneTransformDraft } from '@/libraries/services/threed/transforms/scene-transform-core';

export interface SceneTransformSession {
  ownerKey: string;
  objectKey: string;
  name: string;
  owner: SceneOwnerPose;
  dimensions: [number, number, number];
  draft: SceneTransformDraft;
  commit: (draft: SceneTransformDraft) => Promise<boolean>;
}

function useWorkspaceState() {
  const [session, setSession] = useState<SceneTransformSession | null>(null);
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const begin = useCallback((next: SceneTransformSession) => {
    if (busy.current) return;
    if (!validSceneTransform(next.draft)
      || !next.dimensions.every(value => Number.isFinite(value) && value >= 0.05 && value <= 10_000)
      || ![...Object.values(next.owner.position), ...next.owner.rotation].every(Number.isFinite)) return;
    setMode('translate');
    setError(null);
    setSession(next);
  }, []);
  const cancel = useCallback(() => {
    if (!busy.current) setSession(null);
  }, []);
  useEffect(() => {
    if (!session) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      cancel();
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [Boolean(session), cancel]);
  const releaseOwner = useCallback((ownerKey: string) => {
    setSession(current => current?.ownerKey === ownerKey ? null : current);
  }, []);
  const update = useCallback((draft: SceneTransformDraft) => {
    if (busy.current) return;
    setSession(current => current ? { ...current, draft } : null);
  }, []);
  const save = async () => {
    if (!session || busy.current) return;
    if (!validSceneTransform(session.draft)) {
      setError('Keep coordinates within −10,000 to 10,000 and dimensions between 0.05 and 10,000.');
      return;
    }
    busy.current = true;
    setSaving(true);
    setError(null);
    try {
      if (await session.commit(session.draft)) {
        setSession(current => current?.objectKey === session.objectKey ? null : current);
      } else setError('Could not save. Your transform is still here; retry or cancel.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save. Your transform is still here; retry or cancel.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return { session, mode, setMode, saving, error, begin, cancel, releaseOwner, update, save };
}
const WorkspaceContext = createContext<ReturnType<typeof useWorkspaceState> | null>(null);
export function SceneTransformWorkspace({ children }: { children: ReactNode }) {
  const workspace = useWorkspaceState();
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}
export function useOptionalSceneTransform() { return useContext(WorkspaceContext); }
export function useSceneTransform() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error('Scene transforms require SceneTransformWorkspace');
  return workspace;
}

export function SceneTransformActions() {
  const { session, mode, setMode, saving, error, save, cancel } = useSceneTransform();
  if (!session) return null;
  return <div className="space-y-2 rounded border border-cyan-300/30 bg-cyan-950/30 p-2 text-[10px] text-cyan-100">
    <p>Drag arrows to move, the Y ring to rotate, or Resize handles to change width, height and depth around the center. Physics is paused while editing.</p>
    <div className="flex gap-1">
      {(['translate', 'rotate', 'scale'] as const).map(value => <button key={value} type="button" disabled={saving}
        aria-pressed={mode === value} onClick={() => setMode(value)}
        className={`flex-1 rounded border border-white/20 p-1 ${mode === value ? 'bg-cyan-600/50' : ''}`}>
        {value === 'translate' ? 'Move XYZ' : value === 'rotate' ? 'Rotate Y' : 'Resize'}
      </button>)}
    </div>
    <p aria-live="polite">Local X {session.draft.position.x.toFixed(2)} · Y {session.draft.position.y.toFixed(2)} · Z {session.draft.position.z.toFixed(2)} · Rotation {session.draft.rotationY.toFixed(1)}°</p>
    <p>Width {session.draft.width.toFixed(2)} · Height {session.draft.height.toFixed(2)} · Depth {session.draft.depth.toFixed(2)}</p>
    {error && <p role="alert" className="text-red-200">{error}</p>}
    <div className="flex gap-1">
      <button type="button" disabled={saving} onClick={() => void save()} className="flex-1 rounded bg-cyan-700 p-1.5">{saving ? 'Saving…' : 'Save Transform'}</button>
      <button type="button" disabled={saving} onClick={cancel} className="rounded border border-white/20 p-1.5">Cancel</button>
    </div>
  </div>;
}
