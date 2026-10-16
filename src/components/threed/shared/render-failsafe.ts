/** A document-local circuit breaker. No GPU allocation, storage or automatic retry. */
export function createRenderFailsafe(
  defer: (notify: () => void) => void = notify => { setTimeout(notify, 0); },
) {
  let failure: string | null = null;
  const listeners = new Set<() => void>();
  const renderers = new Set<() => void>();
  return {
    getSnapshot: () => failure,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    register(stop: () => void) {
      if (failure) stop();
      else renderers.add(stop);
      return () => { renderers.delete(stop); };
    },
    trip(reason: string) {
      if (failure) return;
      failure = reason;
      // Stop all App canvases immediately, but let the current render/physics
      // stack unwind before React unmounts their owners.
      for (const stop of renderers) {
        try { stop(); } catch { /* Continue stopping the remaining renderers. */ }
      }
      defer(() => { for (const listener of listeners) listener(); });
    },
  };
}

export function isRecursionFailure(reason: unknown): boolean {
  const message = typeof reason === 'string' ? reason
    : reason instanceof Error ? reason.message : '';
  return /too much recursion|maximum call stack size exceeded|maximum update depth exceeded/i.test(message);
}

export const renderFailsafe = createRenderFailsafe();
