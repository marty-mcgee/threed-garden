'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/themes/provider';
import { defaultWorkspaceSettings, workspaceSnapshotSchema, type WorkspaceSettings, type WorkspaceSnapshot } from '@/libraries/config/workspace-settings';

interface WorkspaceContext {
  preferences: WorkspaceSettings;
  snapshot: WorkspaceSnapshot | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (preferences: WorkspaceSettings, revision: string | null) => Promise<void>;
}
const Context = createContext<WorkspaceContext | null>(null);
const defaults = defaultWorkspaceSettings();

export function WorkspaceSettingsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = status === 'authenticated' ? session?.user?.id : undefined;
  const identity = useRef(userId);
  identity.current = userId;
  const [stored, setStored] = useState<{ owner: string; snapshot: WorkspaceSnapshot } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{ owner: string; message: string } | null>(null);
  const sequence = useRef(0);
  const pendingSave = useRef(false);
  const { theme, setTheme } = useTheme();
  const themeAccess = useRef({ theme, setTheme });
  themeAccess.current = { theme, setTheme };
  const appliedTheme = useRef<{ previous: typeof theme } | null>(null);
  const snapshot = stored && stored.owner === userId ? stored.snapshot : null;

  const refresh = useCallback(async () => {
    if (!userId || pendingSave.current) return;
    const requestId = ++sequence.current;
    setLoading(true);
    setFailure(null);
    try {
      const response = await fetch('/api/settings/workspace', { cache: 'no-store' });
      if (!response.ok) throw new Error('Settings could not be loaded. Please retry.');
      const next = workspaceSnapshotSchema.parse(await response.json());
      if (identity.current === userId && sequence.current === requestId) setStored({ owner: userId, snapshot: next });
    } catch {
      if (identity.current === userId && sequence.current === requestId) setFailure({ owner: userId, message: 'Settings could not be loaded. Please retry.' });
    } finally {
      if (identity.current === userId && sequence.current === requestId) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    pendingSave.current = false;
    setSaving(false);
    setStored(null);
    setFailure(null);
    setLoading(false);
    void refresh();
    return () => { sequence.current++; };
  }, [refresh]);

  // Restore the browser appearance when leaving an account with a saved theme.
  useEffect(() => () => {
    if (appliedTheme.current) themeAccess.current.setTheme(appliedTheme.current.previous);
    appliedTheme.current = null;
  }, [userId]);
  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.preferences.theme !== 'browser') {
      appliedTheme.current ??= { previous: themeAccess.current.theme };
      themeAccess.current.setTheme(snapshot.preferences.theme);
    } else if (appliedTheme.current) {
      themeAccess.current.setTheme(appliedTheme.current.previous);
      appliedTheme.current = null;
    }
  }, [snapshot]);

  const save = async (preferences: WorkspaceSettings, revision: string | null) => {
    if (!userId || !snapshot || loading || pendingSave.current) throw new Error('Wait for your Settings to finish loading.');
    pendingSave.current = true;
    setSaving(true);
    const requestId = ++sequence.current;
    try {
      const response = await fetch('/api/settings/workspace', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, revision }),
      });
      if (!response.ok) {
        if (response.status === 409) throw new Error('Settings changed in another window. Refresh before saving again.');
        throw new Error('Settings could not be saved. Your changes are still available to retry.');
      }
      const saved = workspaceSnapshotSchema.parse(await response.json());
      if (identity.current !== userId || sequence.current !== requestId) throw new Error('Your session changed. Refresh Settings.');
      setStored({ owner: userId, snapshot: saved });
      setFailure(null);
    } finally {
      if (sequence.current === requestId) {
        pendingSave.current = false;
        setSaving(false);
      }
    }
  };

  return <Context.Provider value={{ preferences: snapshot?.preferences ?? defaults, snapshot, loading: status === 'loading' || loading, saving, error: failure && failure.owner === userId ? failure.message : null, refresh, save }}>{children}</Context.Provider>;
}

export function useWorkspaceSettings() {
  const context = useContext(Context);
  if (!context) throw new Error('WorkspaceSettingsProvider is required');
  return context;
}
