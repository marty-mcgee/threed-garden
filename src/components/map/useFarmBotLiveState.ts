'use client';

import { useEffect, useState } from 'react';
import type { FarmBotLiveStateV1 } from '@/libraries/services/threed/farmbot/live-state-core';

export function useFarmBotLiveState(input: {
  projectId: number | string | null | undefined;
  farmbotId: number | null;
  enabled?: boolean;
  refreshIntervalMs?: number;
}) {
  const { projectId, farmbotId, enabled = true, refreshIntervalMs = 5_000 } = input;
  const [state, setState] = useState<Readonly<FarmBotLiveStateV1> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setState(null);
    setError(false);
    if (!enabled || !projectId || !farmbotId || !Number.isSafeInteger(farmbotId)) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const read = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/threed/farmbots/${farmbotId}/mqtt-runtime?projectId=${encodeURIComponent(projectId)}`,
          { cache: 'no-store', signal: controller.signal },
        );
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'FarmBot state unavailable');
        if (!controller.signal.aborted) {
          setState(result.data as Readonly<FarmBotLiveStateV1>);
          setError(false);
        }
      } catch (readError) {
        if (readError instanceof Error && readError.name === 'AbortError') return;
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(read, Math.max(1_000, refreshIntervalMs));
        }
      }
    };
    void read();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [enabled, farmbotId, projectId, refreshIntervalMs]);

  return { state, loading, error } as const;
}
