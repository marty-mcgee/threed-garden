import { ANIMATION_ACTIONS } from '@/lib/utils/animation';
import type { ExternalCharacterAnimationAction } from '@/lib/utils/externalCharacterAnimations';

// Explicit bridge to the existing external action vocabulary, without importing its loaders.
const externalActions = {
  idle: true, walk: true, run: true, walkBackwards: true, turnLeft: true, turnRight: true,
  talk: true, point: true, pointGesture: true, drive: true, holdingIdle: true,
  holdingWalk: true, holdingTurnLeft: true, holdingTurnRight: true, boxIdle: true,
  boxTurn: true, boxTurn2: true, boxWalkArc: true, kneelingIdle: true, watering: true,
  digAndPlantSeeds: true, plantAPlant: true, plantTree: true, pullPlant: true, pullPlant2: true,
  pickFruit: true, pickFruit2: true, pickFruit3: true, cowMilking: true, wheelbarrowIdle: true,
  wheelbarrowWalk: true, wheelbarrowWalk2: true, wheelbarrowWalkTurn: true,
  wheelbarrowWalkTurn2: true, wheelbarrowDump: true,
} satisfies Record<ExternalCharacterAnimationAction, true>;
export const LIBRARY_ACTIONS = [...new Set<string>([...ANIMATION_ACTIONS, ...Object.keys(externalActions)])];
export class AnimationLibraryError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function positiveId(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^\d+$/.test(String(value))) {
    throw new AnimationLibraryError(400, 'Invalid ID');
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new AnimationLibraryError(400, 'Invalid ID');
  return id;
}
export function objectInput(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !keys.includes(key))) throw new AnimationLibraryError(400, 'Invalid fields');
  return value as Record<string, unknown>;
}
export function parseTarget(target: unknown, targetId: unknown) {
  if (target !== 'model' && target !== 'character') throw new AnimationLibraryError(400, 'Target must be model or character');
  return { target, targetId: positiveId(targetId) };
}
export type AnimationTarget = ReturnType<typeof parseTarget>;
export function parseAction(value: unknown): string {
  if (typeof value !== 'string' || !LIBRARY_ACTIONS.includes(value)) throw new AnimationLibraryError(400, 'Unknown animation action');
  return value;
}
export function parseAssignment(value: unknown) {
  const body = objectInput(value, ['target', 'targetId', 'actionKey', 'mode', 'animationId']);
  const target = parseTarget(body.target, body.targetId);
  const actionKey = parseAction(body.actionKey);
  if (body.mode !== 'assigned' && body.mode !== 'disabled') throw new AnimationLibraryError(400, 'Mode must be assigned or disabled; DELETE restores inheritance');
  if (body.mode === 'disabled' && body.animationId != null) throw new AnimationLibraryError(400, 'Disabled actions cannot reference an animation');
  return { ...target, actionKey, mode: body.mode, animationId: body.mode === 'assigned' ? positiveId(body.animationId) : null };
}
export function parseList(params: URLSearchParams) {
  const number = (key: string, fallback: number, max: number, min = 0) => {
    const raw = params.get(key) ?? String(fallback);
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < min || value > max) throw new AnimationLibraryError(400, `Invalid ${key}`);
    return value;
  };
  const sort = params.get('sort') ?? 'name';
  const direction = params.get('direction') ?? 'asc';
  const search = (params.get('search') ?? '').trim();
  if (!['name', 'created', 'size', 'duration', 'active', 'fileName', 'type', 'references'].includes(sort) || !['asc', 'desc'].includes(direction) || search.length > 200) throw new AnimationLibraryError(400, 'Invalid list query');
  return { limit: number('limit', 25, 200, 1), offset: number('offset', 0, 2147483647), search, sort, direction };
}
export function parseClipUpdate(value: unknown) {
  const body = objectInput(value, ['id', 'name', 'isActive']);
  const id = positiveId(body.id);
  const changes: { name?: string; isActive?: boolean } = {};
  if ('name' in body) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 255) throw new AnimationLibraryError(400, 'Invalid animation name');
    changes.name = body.name.trim();
  }
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') throw new AnimationLibraryError(400, 'Invalid active state');
    changes.isActive = body.isActive;
  }
  if (!Object.keys(changes).length) throw new AnimationLibraryError(400, 'No changes supplied');
  return { id, changes };
}
export type Assignment = { actionKey: string; mode: string; animationId: number | null };
export type AvailableClip = { id: number; isActive: boolean; filePath: string };
// Absence requests the existing runtime behavior; an invalid explicit selection never falls through.
export function resolveAssignments(model: Assignment[], character: Assignment[], clips: AvailableClip[]) {
  const byId = new Map(clips.map(clip => [clip.id, clip]));
  return LIBRARY_ACTIONS.map(actionKey => {
    const own = character.find(row => row.actionKey === actionKey);
    const inherited = model.find(row => row.actionKey === actionKey);
    const row = own ?? inherited;
    if (!row) return { actionKey, source: 'legacy' as const, state: 'legacy' as const, animationId: null };
    const source = own ? 'character' as const : 'model' as const;
    if (row.mode === 'disabled') return { actionKey, source, state: 'disabled' as const, animationId: null };
    const clip = row.animationId === null ? undefined : byId.get(row.animationId);
    return { actionKey, source, state: clip?.isActive && clip.filePath.trim() ? 'assigned' as const : 'unavailable' as const, animationId: row.animationId };
  });
}
