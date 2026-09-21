'use client';
import { useEffect, useState } from 'react';
import type { AnimationActionSlot } from '@/libraries/services/threed/animations/action-slots';
export function useAnimationActionSlots(refresh = 0) {
  const [slots, setSlots] = useState<AnimationActionSlot[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/threed/animation-action-slots', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Action slots unavailable');
      if (!controller.signal.aborted) { setSlots(result.data); setError(''); }
    }).catch(cause => { if (!controller.signal.aborted) { setSlots([]); setError(cause.message || 'Action slots unavailable'); } });
    return () => controller.abort();
  }, [refresh]);
  return { slots, error };
}
