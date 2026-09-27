'use client';
import { createContext, useContext, useEffect, useId, useCallback, useMemo } from 'react';
export type SceneResourceState = 'loading' | 'ready' | 'failed';
export const SceneResourceStatus = createContext<((id: string, state: SceneResourceState | null) => void) | null>(null);
/** Scoped to a mounted Scene; Admin previews have no Scene status provider. */
export function useSceneResourceStatus(loading: boolean, error: unknown) {
  const report = useContext(SceneResourceStatus);
  const id = useId();
  const state = error ? 'failed' : loading ? 'loading' : 'ready';
  useEffect(() => { report?.(id, state); }, [report, id, state]);
  useEffect(() => () => report?.(id, null), [report, id]);
}

export interface SceneResourceIssue { fileName: string; message: string; modelId?: number; modelName?: string }
export const SceneResourceIssues = createContext<((id: string, issue: SceneResourceIssue | null) => void) | null>(null);
export function sceneResourceFileName(url: string) {
  try { return decodeURIComponent(new URL(url, 'https://scene.invalid').pathname.split('/').pop() || 'Unknown file'); }
  catch { return 'Unknown file'; }
}

/** Scene-only diagnostics; stale loads cannot add warnings to a different Model/Project. */
export function useSceneResourceIssueReporter(scope: string, modelId?: number, modelName?: string) {
  const report = useContext(SceneResourceIssues);
  const id = useId();
  const owner = useMemo(() => ({ active: true, keys: new Set<string>() }), [scope, report, modelId, modelName]);
  useEffect(() => {
    owner.active = true;
    return () => { owner.active = false; for (const key of owner.keys) report?.(key, null); owner.keys.clear(); };
  }, [owner, report]);
  const callback = useCallback((url: string, message: string) => {
    if (!owner.active) return;
    const fileName = sceneResourceFileName(url);
    const key = `${id}:${fileName}`;
    if (!message) { owner.keys.delete(key); report?.(key, null); return; }
    owner.keys.add(key);
    report?.(key, { fileName, message, ...(Number.isSafeInteger(modelId) && Number(modelId) > 0 ? { modelId, modelName } : {}) });
  }, [id, owner, report, modelId, modelName]);
  return report ? callback : null;
}
