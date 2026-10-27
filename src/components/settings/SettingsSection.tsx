'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export const settingsSectionDefaults = {
  modules: true,
  scene: false,
  appearance: true,
  previews: true,
  navigation: true,
  links: true,
} as const;

export function SettingsSection({ section, className, children }: {
  section: keyof typeof settingsSectionDefaults;
  className?: string;
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const owner = session?.user?.id;
  const storageKey = owner ? `threed:settings-sections:v1:${owner}:${section}` : null;
  const fallback = settingsSectionDefaults[section];
  const [stored, setStored] = useState<{ key: string | null; open: boolean } | null>(null);
  const ready = stored !== null && stored.key === storageKey;
  const open = ready ? stored.open : fallback;

  useEffect(() => {
    const read = () => {
      let value: string | null = null;
      try { if (storageKey) value = localStorage.getItem(storageKey); } catch { /* Browser storage is optional. */ }
      setStored({ key: storageKey, open: value === 'true' ? true : value === 'false' ? false : fallback });
    };
    read();
    const sync = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) read(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [storageKey, fallback]);

  return <details key={storageKey} className={className} open={open} onClick={event => {
    // Handle only this disclosure's summary. Nested Module trees keep native behavior.
    const summary = (event.target as Element).closest('summary');
    if (!summary || summary.parentElement !== event.currentTarget) return;
    event.preventDefault();
    if (!ready) return;
    const next = !open;
    setStored({ key: storageKey, open: next });
    try { if (storageKey) localStorage.setItem(storageKey, String(next)); } catch { /* Keep the current in-memory choice. */ }
  }}>{children}</details>;
}
