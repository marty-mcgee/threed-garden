/** Transient loaded-runtime evidence; never persisted as Character assignments. */
const reports = new Map<string, Map<symbol, ReadonlySet<string>>>();
const listeners = new Set<() => void>();
const key = (id: number, url: string) => `${id}:${url}`;
export function subscribeCharacterAnimationAvailability(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getCharacterAnimationAvailability(id: number, url: string): ReadonlySet<string> | null {
  const entries = reports.get(key(id, url));
  return entries ? [...entries.values()].at(-1) ?? null : null;
}
export function reportCharacterAnimationAvailability(id: number, url: string, actions: Iterable<string>) {
  const identity = key(id, url), token = Symbol();
  const entries = reports.get(identity) ?? new Map<symbol, ReadonlySet<string>>();
  entries.set(token, new Set([...actions].map(action => action.toLowerCase())));
  reports.set(identity, entries);
  listeners.forEach(listener => listener());
  return () => {
    if (!entries.delete(token)) return;
    if (!entries.size) reports.delete(identity);
    listeners.forEach(listener => listener());
  };
}
export const DETAILS_ANIMATION_ACTIONS = ['watering','digAndPlantSeeds','plantAPlant','plantTree','pullPlant','pullPlant2','pickFruit','pickFruit2','pickFruit3','cowMilking','point','pointGesture','talk'] as const;
