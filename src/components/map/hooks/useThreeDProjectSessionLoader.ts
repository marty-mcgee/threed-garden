'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchThreeDProjectSession,
  type ThreeDProjectSessionData,
} from '@/lib/services/map/threed-project-session-core';

export type ThreeDProjectSessionLoadOutcome =
  | { status: 'default' }
  | { status: 'loaded'; session: ThreeDProjectSessionData }
  | { status: 'api-error'; error: string }
  | { status: 'network-error'; error: unknown }
  | { status: 'cancelled' };

export function useThreeDProjectSessionLoader() {
  const loadSequenceRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const beginProjectTransition = useCallback(() => {
    setLoading(true);
  }, []);

  const loadProjectSession = useCallback(async (
    projectId: string | null,
    onOutcome: (outcome: ThreeDProjectSessionLoadOutcome) => void | Promise<void>,
    options?: { refresh?: boolean },
  ): Promise<void> => {
    const loadSequence = loadSequenceRef.current + 1;
    loadSequenceRef.current = loadSequence;
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    setLoading(true);
    if (options?.refresh) setRefreshing(true);

    try {
      let outcome: ThreeDProjectSessionLoadOutcome = { status: 'default' };
      if (projectId) {
        try {
          const result = await fetchThreeDProjectSession(projectId, abortController.signal);
          outcome = result.success
            ? { status: 'loaded', session: result.session }
            : { status: 'api-error', error: result.error };
        } catch (error) {
          outcome = abortController.signal.aborted || loadSequenceRef.current !== loadSequence
            ? { status: 'cancelled' }
            : { status: 'network-error', error };
        }
      }

      if (loadSequenceRef.current !== loadSequence || outcome.status === 'cancelled') return;
      await onOutcome(outcome);
    } finally {
      if (loadSequenceRef.current === loadSequence) {
        abortRef.current = null;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => () => {
    loadSequenceRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return {
    loading,
    refreshing,
    beginProjectTransition,
    loadProjectSession,
  };
}
