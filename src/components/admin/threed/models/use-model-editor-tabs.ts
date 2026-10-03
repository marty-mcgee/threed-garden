'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export type ModelEditorTab = 'details' | 'files';

// Tabs change the URL without remounting either workspace. Back/Forward requests
// pass through the same draft and operation guards as a click.
export function useModelEditorTabs({ enabled, dirty, busy, save, discard, refresh }: {
  enabled: boolean;
  dirty: boolean;
  busy: boolean;
  save: () => Promise<boolean>;
  discard: () => Promise<boolean>;
  refresh: () => Promise<boolean>;
}) {
  const searchParams = useSearchParams();
  const requested: ModelEditorTab = searchParams.get('tab') === 'files' ? 'files' : 'details';
  const [tab, setTab] = useState<ModelEditorTab>(enabled ? requested : 'details');
  const [pending, setPending] = useState<ModelEditorTab | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [notice, setNotice] = useState('');
  const transitionLock = useRef(false);
  const historyIndex = useRef(0);
  const navigationRevision = useRef(0);
  const latest = useRef({ tab, dirty, busy, save, discard, refresh });
  latest.current = { tab, dirty, busy, save, discard, refresh };

  const writeUrl = useCallback((next: ModelEditorTab, replace = false) => {
    const url = new URL(window.location.href);
    if (next === 'files') url.searchParams.set('tab', 'files');
    else url.searchParams.delete('tab');
    const href = `${url.pathname}${url.search}${url.hash}`;
    const index = replace ? historyIndex.current : historyIndex.current + 1;
    const state = { ...window.history.state, modelEditorTabIndex: index };
    if (replace) window.history.replaceState(state, '', href);
    else window.history.pushState(state, '', href);
    historyIndex.current = index;
  }, []);

  const restoreHistory = useCallback(() => {
    const index: unknown = window.history.state?.modelEditorTabIndex;
    if (typeof index === 'number' && index !== historyIndex.current) {
      // Return to the original entry instead of overwriting a Back/Forward
      // destination. The user can revisit it once the operation finishes.
      window.history.go(historyIndex.current - index);
    } else writeUrl(latest.current.tab, true);
  }, [writeUrl]);

  useEffect(() => {
    if (!enabled) return;
    historyIndex.current = window.history.state?.modelEditorTabIndex ?? 0;
    window.history.replaceState({ ...window.history.state, modelEditorTabIndex: historyIndex.current }, '', window.location.href);
  }, [enabled]);

  const apply = useCallback(async (next: ModelEditorTab, fromHistory = false) => {
    if (transitionLock.current || latest.current.busy) return false;
    transitionLock.current = true;
    const revision = navigationRevision.current;
    const destinationIndex = fromHistory ? window.history.state?.modelEditorTabIndex : undefined;
    setTransitioning(true);
    try {
      // Disable Details first. A failed refresh may show the old record for
      // context, but it must never become an editable/savable stale draft.
      if (next === 'details') await latest.current.refresh();
      if (revision !== navigationRevision.current) return false;
      setTab(next);
      setPending(null);
      setNotice('');
      if (!fromHistory) writeUrl(next);
      else if (typeof destinationIndex === 'number') historyIndex.current = destinationIndex;
      return true;
    } finally {
      transitionLock.current = false;
      setTransitioning(false);
    }
  }, [writeUrl]);

  const requestTab = useCallback((next: ModelEditorTab, fromHistory = false) => {
    const current = latest.current;
    if (!enabled) return;
    if (next === current.tab) {
      if (fromHistory && transitionLock.current) ++navigationRevision.current;
      return;
    }
    if (current.busy || transitionLock.current) {
      setNotice('Wait for the current operation to finish before changing tabs.');
      if (fromHistory) restoreHistory();
      return;
    }
    if (current.tab === 'details' && current.dirty) {
      setPending(next);
      if (fromHistory) restoreHistory();
      return;
    }
    void apply(next, fromHistory);
  }, [apply, enabled, restoreHistory]);

  useEffect(() => {
    requestTab(requested, true);
    // A URL change is a navigation request; form changes are not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  useEffect(() => {
    if (!enabled) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (latest.current.dirty || latest.current.busy || transitionLock.current) {
        event.preventDefault(); event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [enabled]);

  async function resolve(choice: 'save' | 'discard' | 'stay') {
    if (choice === 'stay') { if (!transitionLock.current) setPending(null); return; }
    if (!pending || latest.current.busy || transitionLock.current) return;
    transitionLock.current = true;
    setTransitioning(true);
    let succeeded = false;
    try {
      succeeded = await (choice === 'save' ? latest.current.save() : latest.current.discard());
    } finally {
      transitionLock.current = false;
      setTransitioning(false);
    }
    if (succeeded) {
      // React may not have rendered the save's final busy=false yet. This is
      // the completion of our locked operation, not a second navigation.
      setTab(pending);
      writeUrl(pending);
      setPending(null);
      setNotice('');
    }
  }

  return { tab, pending, transitioning, notice, requestTab, resolve };
}
