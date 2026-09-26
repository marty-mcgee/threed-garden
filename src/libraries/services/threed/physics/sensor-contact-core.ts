/** Collapse compound-body collider callbacks to one body entry/exit per sensor. */
export class SensorContactTracker {
  private contacts = new Map<string, Set<number>>();
  clear() { this.contacts.clear(); }
  observe(kind: 'sensor-enter' | 'sensor-exit', sensorId: string, bodyKey: string, collider: number): boolean {
    const key = `${sensorId}|${bodyKey}`;
    const contacts = this.contacts.get(key) ?? new Set<number>();
    if (kind === 'sensor-enter') {
      const first = contacts.size === 0;
      contacts.add(collider); this.contacts.set(key, contacts);
      return first;
    }
    if (!contacts.delete(collider)) return false;
    if (contacts.size) return false;
    this.contacts.delete(key); return true;
  }
}
