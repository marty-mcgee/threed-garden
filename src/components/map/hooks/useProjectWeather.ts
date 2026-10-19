'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectWeatherSnapshot } from '@/libraries/services/threed/project-weather-core';

export function useProjectWeather(projectId: string) {
  const [snapshot, setSnapshot] = useState<ProjectWeatherSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const load = useCallback(async (update = false) => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/project/weather?projectId=${encodeURIComponent(projectId)}`, {
        method: update ? 'POST' : 'GET', cache: 'no-store', signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load Project Weather.');
      const data = result.data as ProjectWeatherSnapshot;
      if (data?.projectId !== Number(projectId) || !Array.isArray(data.readings)) throw new Error('Invalid Project Weather response.');
      if (!controller.signal.aborted) setSnapshot(data);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load Project Weather.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, [projectId]);
  useEffect(() => {
    setSnapshot(null);
    void load();
    return () => pending.current?.abort();
  }, [load]);
  return { snapshot, busy, error, reload: () => load(), update: () => load(true) };
}
