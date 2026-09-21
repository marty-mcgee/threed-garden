/** User-defined slots are animation-only; immutable keys never describe world effects. */
export type AnimationActionSlot = { id: number; actionKey: string; name: string; categoryId: number | null; categoryName: string | null; isActive: boolean };
export function isCustomActionKey(key: string): boolean { return /^custom_[a-f0-9]{32}$/.test(key); }
