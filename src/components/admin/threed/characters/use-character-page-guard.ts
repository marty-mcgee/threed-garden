'use client';

import { useEffect, useRef } from 'react';

/** Page links use document navigation so browser Back/Forward shares beforeunload protection. */
export function useCharacterPageGuard(enabled: boolean, dirty: boolean, busy: boolean) {
  const current = useRef({ dirty, busy });
  current.current = { dirty, busy };
  useEffect(() => {
    if (!enabled) return;
    const unload = (event: BeforeUnloadEvent) => {
      if (current.current.dirty || current.current.busy) { event.preventDefault(); event.returnValue = ''; }
    };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (anchor.href === window.location.href) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      if (current.current.busy || (current.current.dirty && !window.confirm('Discard unsaved changes and leave this Character workspace?'))) {
        event.preventDefault(); event.stopImmediatePropagation(); return;
      }
      // Use one guarded document transition even for surrounding Next navigation links.
      event.preventDefault(); event.stopImmediatePropagation();
      current.current = { dirty: false, busy: false };
      window.location.assign(anchor.href);
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); };
  }, [enabled]);
  return () => { current.current = { dirty: false, busy: false }; };
}
