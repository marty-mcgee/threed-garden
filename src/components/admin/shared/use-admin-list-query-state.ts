'use client';
import { useMemo, useState, useSyncExternalStore, type SetStateAction } from 'react';

type QueryValue = string | number | { key: string; direction: string } | { field: string; direction: string };
type QuerySetter<T> = (update: SetStateAction<T>, options?: { replace?: boolean }) => void;
type Options = { values?: readonly string[]; enabled?: boolean; urlDefault?: string };
const eventName = 'threed-admin-list-query';
const subscribe = (notify: () => void) => {
  window.addEventListener('popstate', notify);
  window.addEventListener(eventName, notify);
  return () => { window.removeEventListener('popstate', notify); window.removeEventListener(eventName, notify); };
};
const snapshot = () => window.location.href;
const serverSnapshot = () => '';

export function readAdminListValue<T extends QueryValue>(params: URLSearchParams, key: string, initial: T, options: Options = {}): T {
  const fallback = (options.urlDefault ?? initial) as T;
  const value = params.get(key);
  if (typeof initial === 'number') {
    if (value === null || !/^[0-9]+$/.test(value)) return initial;
    const number = Number(value);
    if (!Number.isSafeInteger(number)) return initial;
    if (key === 'limit') return ([25, 50, 100, 200].includes(number) ? number : initial) as T;
    if (key === 'page') return (number >= 1 && number <= 1000000 ? number - (initial === 0 ? 1 : 0) : initial) as T;
    return (number >= 0 && number <= 2147483647 ? number : initial) as T;
  }
  if (typeof initial === 'object') {
    const field = 'key' in initial ? 'key' : 'field';
    const selected = value && options.values?.includes(value) ? value : initial[field as keyof typeof initial];
    const direction = params.get('direction');
    return {...initial, [field]: selected, direction: direction === 'asc' || direction === 'desc' ? direction : initial.direction} as T;
  }
  if (value === null || value.length > 200 || (options.values && !options.values.includes(value))) return fallback;
  return value as T;
}

export function writeAdminListValue<T extends QueryValue>(params: URLSearchParams, key: string, value: T, initial: T, options: Options = {}) {
  const next = new URLSearchParams(params);
  const fallback = options.urlDefault ?? initial;
  if (typeof value === 'object' && typeof initial === 'object') {
    const field = 'key' in value ? 'key' : 'field';
    const selected = value[field as keyof typeof value];
    if (selected === initial[field as keyof typeof initial]) next.delete(key); else next.set(key, String(selected));
    if (value.direction === initial.direction) next.delete('direction'); else next.set('direction', value.direction);
  } else if (value === fallback) next.delete(key);
  else next.set(key, String(key === 'page' && initial === 0 ? Number(value) + 1 : value));
  return next;
}

let pending: { base: string; url: URL; push: boolean; search: boolean; filter: boolean } | null = null;
function queueQuery(url: URL, key: string, replace: boolean) {
  if (!pending) {
    pending = {base: window.location.href, url, push: false, search: false, filter: false};
    queueMicrotask(() => {
      const change = pending; pending = null;
      if (!change || window.location.href !== change.base || change.url.href === change.base) return;
      const state = {...window.history.state}; delete state.__NA; delete state._N;
      window.history[change.push && (!change.search || change.filter) ? 'pushState' : 'replaceState'](state, '', change.url.pathname + change.url.search + change.url.hash);
      window.dispatchEvent(new Event(eventName));
    });
  }
  pending.url = url;
  pending.search ||= key === 'search';
  pending.filter ||= key !== 'search' && key !== 'page';
  pending.push ||= key !== 'search' && !replace;
}

/** Only canonical list routes own URL state. Embedded editors retain ordinary local state. */
export function useAdminListQueryState(route: string, key: string, initial: string, options?: Options): [string, QuerySetter<string>];
export function useAdminListQueryState(route: string, key: string, initial: number, options?: Options): [number, QuerySetter<number>];
export function useAdminListQueryState<T extends QueryValue>(route: string, key: string, initial: T, options?: Options): [T, QuerySetter<T>];
export function useAdminListQueryState<T extends QueryValue>(route: string, key: string, initial: T, options: Options = {}): [T, QuerySetter<T>] {
  const [local, setLocal] = useState(initial);
  const href = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const active = options.enabled !== false && !!href && new URL(href).pathname === route;
  const initialKey = JSON.stringify(initial), optionsKey = JSON.stringify(options);
  const value = useMemo(() => active ? readAdminListValue(new URL(href).searchParams, key, initial, options) : local, [href, active, key, initialKey, optionsKey, local]);
  const setValue: QuerySetter<T> = (update, updateOptions) => {
    if (!active) { setLocal(update); return; }
    const url = new URL(pending?.url.href ?? window.location.href);
    const current = readAdminListValue(url.searchParams, key, initial, options);
    const next = typeof update === 'function' ? update(current) : update;
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    url.search = writeAdminListValue(url.searchParams, key, next, initial, options).toString();
    queueQuery(url, key, updateOptions?.replace === true);
  };
  return [value, setValue];
}
