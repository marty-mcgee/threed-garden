'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { readModelAdminListState, writeModelAdminListState, type ModelAdminListState } from '@/libraries/services/threed/models/model-list-query';

export function useModelListState(urlEnabled: boolean) {
  const params = useSearchParams();
  const [local, setLocal] = useState(() => readModelAdminListState(new URLSearchParams()));
  const state = urlEnabled ? readModelAdminListState(new URLSearchParams(params.toString())) : local;
  function update(patch: Partial<ModelAdminListState>, replace = false) {
    if (!urlEnabled) { setLocal(current => ({...current,...patch})); return; }
    const url = new URL(window.location.href);
    const current = readModelAdminListState(url.searchParams);
    url.search = writeModelAdminListState(url.searchParams, {...current,...patch}).toString();
    if (url.href !== window.location.href) {
      // Next treats these markers as its own navigation and skips search-param notification.
      // Its patched history API restores the internal router state after notifying consumers.
      const historyState = {...window.history.state};
      delete historyState.__NA;
      delete historyState._N;
      window.history[replace ? 'replaceState' : 'pushState'](historyState, '', url.pathname+url.search+url.hash);
    }
  }
  return {state,update,reset: () => update(readModelAdminListState(new URLSearchParams()))};
}
