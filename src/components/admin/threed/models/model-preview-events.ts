import { events } from '@react-three/fiber';

/** Canvas may finish its deferred Provider setup after its host ref is cleared. */
export function modelPreviewEvents(store: Parameters<typeof events>[0]) {
  const manager = events(store);
  const connect = manager.connect;
  manager.connect = target => {
    if (!target) {
      manager.disconnect?.();
      return;
    }
    connect?.(target);
  };
  return manager;
}
