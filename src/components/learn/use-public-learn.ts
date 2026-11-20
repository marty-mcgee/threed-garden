'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

type RequestState<T> = { key: string | null; status: 'idle' | 'loading' | 'success' | 'missing' | 'error'; data: T | null };

/** Match responses to both the current Learn request and signed-in viewer. */
export function usePublicLearn<T>(url: string | null, decode: (value: unknown) => T) {
  const { data: session, status } = useSession();
  const viewerId = status === 'authenticated' ? session?.user?.id : null;
  const key = url && status !== 'loading' ? JSON.stringify([url, viewerId]) : null;
  const pending = { key, status: url ? 'loading' : 'idle', data: null } as const;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RequestState<T>>(pending);
  const sequence = useRef(0);
  useEffect(() => {
    const ticket = ++sequence.current;
    const controller = new AbortController();
    setState({ key, status: url ? 'loading' : 'idle', data: null });
    if (url && key) void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (response.status === 404) {
          if (!controller.signal.aborted && sequence.current === ticket) setState({ key, status: 'missing', data: null });
          return;
        }
        if (!response.ok) throw new Error('Request unavailable.');
        const data = decode(await response.json());
        if (!controller.signal.aborted && sequence.current === ticket) setState({ key, status: 'success', data });
      } catch {
        if (!controller.signal.aborted && sequence.current === ticket) setState({ key, status: 'error', data: null });
      }
    })();
    return () => { controller.abort(); sequence.current++; };
  }, [url, key, decode, attempt]);
  const current = state.key === key ? state : pending;
  return { ...current, retry: () => { setState(pending); setAttempt(value => value + 1); } };
}
