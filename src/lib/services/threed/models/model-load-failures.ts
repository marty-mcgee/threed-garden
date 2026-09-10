/** Transient visual errors only; never persisted to Project snapshots. */
const reports = new Map<string, Set<symbol>>();
const listeners = new Set<() => void>();
const key = (id: number, url: string) => `${id}:${url}`;
const notify = () => listeners.forEach((listener) => listener());
export function subscribeModelLoadFailures(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function hasModelLoadFailure(id: number, url: string) {
  return Boolean(reports.get(key(id, url))?.size);
}
export function reportModelLoadFailure(id: number, url: string) {
  const identity = key(id, url);
  const token = Symbol();
  const instances = reports.get(identity) ?? new Set<symbol>();
  instances.add(token);
  reports.set(identity, instances);
  notify();
  return () => {
    if (!instances.delete(token)) return;
    if (!instances.size) reports.delete(identity);
    notify();
  };
}
