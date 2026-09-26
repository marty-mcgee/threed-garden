'use client';

import { createContext, useContext, useEffect, useRef, useState, type ComponentProps } from 'react';

export const DetailsSectionScope = createContext<string | null>(null);

export function PersistentDetails({ storageId, ...props }: ComponentProps<'details'> & { storageId: string }) {
  const scope = useContext(DetailsSectionScope);
  const storageKey = scope ? `threed:details:v1:${scope}:${storageId}` : null;
  return <StoredDetails key={storageKey ?? storageId} {...props} storageKey={storageKey} />;
}

function StoredDetails({ storageKey, open: defaultOpen = false, onToggle, ...props }: ComponentProps<'details'> & { storageKey: string | null }) {
  const [open, setOpen] = useState(defaultOpen);
  const ready = useRef(false);
  useEffect(() => {
    try {
      const saved = storageKey ? localStorage.getItem(storageKey) : null;
      setOpen(saved === 'true' ? true : saved === 'false' ? false : defaultOpen);
    } catch { /* Browser storage may be unavailable. */ }
    ready.current = true;
  }, [storageKey, defaultOpen]);
  return <details {...props} open={open} onToggle={event => {
    const next = event.currentTarget.open;
    setOpen(next);
    // Ignore initial native toggle notifications that do not change state.
    if (ready.current && next !== open && storageKey) {
      try { localStorage.setItem(storageKey, String(next)); } catch { /* Keep controls usable. */ }
    }
    onToggle?.(event);
  }} />;
}
