'use client';

import { useEffect, useRef, useState } from 'react';

type RequestState<T> = { key: string | null; status: 'idle' | 'loading' | 'success' | 'missing' | 'error'; data: T | null };

/** Request identity and abort guards prevent an older search/slug response replacing current content. */
export function usePublicLearn<T>(url: string | null, decode: (value: unknown) => T) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RequestState<T>>({ key: url, status: url ? 'loading' : 'idle', data: null });
  const sequence = useRef(0);
  useEffect(() => {
    const ticket = ++sequence.current;
    const controller = new AbortController();
    setState({ key: url, status: url ? 'loading' : 'idle', data: null });
    if (url) void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (response.status === 404) {
          if (!controller.signal.aborted && sequence.current === ticket) setState({ key: url, status: 'missing', data: null });
          return;
        }
        if (!response.ok) throw new Error('Request unavailable.');
        const data = decode(await response.json());
        if (!controller.signal.aborted && sequence.current === ticket) setState({ key: url, status: 'success', data });
      } catch {
        if (!controller.signal.aborted && sequence.current === ticket) setState({ key: url, status: 'error', data: null });
      }
    })();
    return () => { controller.abort(); sequence.current++; };
  }, [url, decode, attempt]);
  const current: RequestState<T> = state.key === url ? state : { key: url, status: url ? 'loading' : 'idle', data: null };
  return { ...current, retry: () => { setState({ key: url, status: url ? 'loading' : 'idle', data: null }); setAttempt(value => value + 1); } };
}
