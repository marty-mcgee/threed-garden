'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ThreeDProjectViewState } from '@/libraries/services/threed/markers/project-view-state-core';

/** Compare workspace preferences, never timestamps or live Sensor readings. */
export function workspaceFingerprint(snapshot: ThreeDProjectViewState): string {
  const { savedAt: _savedAt, threeD, ...workspace } = snapshot;
  const { sensorState: _sensorState, ...scene } = threeD ?? {};
  return JSON.stringify({ ...workspace, threeD: scene }, (_key, value) =>
    typeof value === 'number' ? Math.round(value * 10000) / 10000 : value);
}

/** Reads retained camera providers without subscribing React to every frame. */
export function useWorkspaceSaveFeedback(projectKey: string, ready: boolean, capture: () => ThreeDProjectViewState) {
  const baseline = useRef<{ key: string; value: string } | null>(null);
  const latestCapture = useRef(capture);
  useEffect(() => { latestCapture.current = capture; }, [capture]);
  const [status, setStatus] = useState({ key: projectKey, dirty: false });
  useEffect(() => {
    if (!ready) { setStatus({ key: projectKey, dirty: false }); return; }
    const check = () => {
      const value = workspaceFingerprint(latestCapture.current());
      if (baseline.current?.key !== projectKey) baseline.current = { key: projectKey, value };
      const dirty = value !== baseline.current.value;
      setStatus(current => current.key === projectKey && current.dirty === dirty ? current : { key: projectKey, dirty });
    };
    // Allow hydration effects to restore providers and inspectors first.
    const initial = window.setTimeout(check, 0);
    const timer = window.setInterval(check, 750);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [projectKey, ready]);
  const acknowledge = useCallback((snapshot: ThreeDProjectViewState) => {
    baseline.current = { key: projectKey, value: workspaceFingerprint(snapshot) };
    setStatus({ key: projectKey, dirty: workspaceFingerprint(latestCapture.current()) !== baseline.current.value });
  }, [projectKey]);
  return { dirty: ready && status.key === projectKey && status.dirty, acknowledge };
}
