// src/lib/utils/animation.ts — v0.16.5b
// ============================================================
// ThreeD Animation Mapping — PRIMARY ENTRY POINT / RETURN POINT
// ============================================================
// This module is the single source of truth that maps this app's
// LOGICAL ACTIONS (the "exit data values" expected by our consumers)
// to the actual AnimationClip names embedded in a GLB/GLTF/FBX file
// (the "entry data values" a model provides).
//
// Consumers (EcctrlCharacter, GardenCharacter) go THROUGH this module:
//
//   clipNames (from file)  --entry data-->  buildAnimationMap()
//                                                │
//                                                ▼
//   action (logical)      --request-------->  map.resolve(action)
//                                                │
//                                                ▼
//                                             clipName (exit data)
//
// The ACTION CATALOG below covers every consumer:
//   - DB enum `threed_character_animation`:
//     idle, walk, run, fly, dance, sway, float, spin, bounce
//   - ecctrl physics states: jump_start, jump_idle, jump_fall, jump_land
//   - interaction clips: wave (plus dance/bounce/spin already above)
// ============================================================

/** Logical action keys — the canonical "exit data values" of the system. */
export const ANIMATION_ACTIONS = [
  'idle',
  'walk',
  'run',
  'fly',
  'dance',
  'sway',
  'float',
  'spin',
  'bounce',
  'jump_start',
  'jump_idle',
  'jump_fall',
  'jump_land',
  'wave',
] as const;

export type AnimationActionKey = (typeof ANIMATION_ACTIONS)[number];

/**
 * ACTION_CANDIDATES — for each logical action, the clip-name candidates we search for
 * inside the model file (entry-data matchers). Matching is case-insensitive with substring
 * fallback, so "mixamo.com|Armature|Walk" still matches `walk`.
 *
 * `take 001` / `take_001` are included under `idle` as a practical default: many
 * single-clip exports (e.g. Synty) name their only animation "Take 001".
 */
export const ACTION_CANDIDATES: Record<AnimationActionKey, string[]> = {
  idle: ['idle', 'idle_loop', 'stand', 'standing', 'take 001', 'take_001'],
  walk: ['walk', 'walking', 'walk_loop'],
  run: ['run', 'running', 'sprint', 'run_loop'],
  fly: ['fly', 'flying'],
  dance: ['dance', 'dancing'],
  sway: ['sway', 'swaying'],
  float: ['float', 'floating'],
  spin: ['spin', 'spinning'],
  bounce: ['bounce', 'bouncing'],
  jump_start: ['jump_start', 'jumpstart', 'jump', 'jump_up'],
  jump_idle: ['jump_idle', 'jump', 'float'],
  jump_fall: ['jump_fall', 'fall', 'falling'],
  jump_land: ['jump_land', 'land', 'landing'],
  wave: ['wave', 'waving'],
};

/** The default order used for positional (by-clip-index) mapping when names are generic. */
export const ANIMATION_ORDER: AnimationActionKey[] = [...ANIMATION_ACTIONS];

/**
 * ACTION_FALLBACK — ordered fallback for each action when its exact clip is missing.
 * This keeps characters animating even when a model lacks a full clip set (e.g. only
 * "Take 001"). Every chain terminates at `idle`.
 */
export const ACTION_FALLBACK: Record<AnimationActionKey, readonly AnimationActionKey[]> = {
  idle: [],
  walk: ['idle'],
  run: ['walk', 'idle'],
  fly: ['idle'],
  dance: ['idle'],
  sway: ['idle'],
  float: ['idle'],
  spin: ['idle'],
  bounce: ['idle'],
  jump_start: ['jump_idle', 'jump_fall', 'idle'],
  jump_idle: ['jump_start', 'idle'],
  jump_fall: ['jump_idle', 'idle'],
  jump_land: ['idle'],
  wave: ['idle'],
};

// ============================================================
// NAME MATCHING
// ============================================================

/** Match a logical action's candidate names against the file's available clip names. */
export function matchClipName(availableNames: string[], candidates: string[]): string | null {
  if (!availableNames.length || !candidates.length) return null;

  const lowered = availableNames.map((n) => n.toLowerCase());

  // 1) Exact (case-insensitive)
  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const exactIndex = lowered.indexOf(target);
    if (exactIndex >= 0) return availableNames[exactIndex];
  }

  // 2) Substring: an available clip name contains a candidate token.
  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const hit = availableNames.find((_, i) => lowered[i].includes(target));
    if (hit != null) return hit;
  }

  // 3) Substring: a candidate token contains an available clip name (rare, for short ids).
  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const hit = lowered.find((l) => target.includes(l));
    if (hit != null) return availableNames[lowered.indexOf(hit)];
  }

  return null;
}

/** True when a clip name looks like a generic/positional export (Anim_0, Take_1, Action.01). */
export function looksLikePositionalClip(name: string): boolean {
  return /(?:anim|take|action)[_\- ]?\d+/i.test(name) || /^\d+$/.test(name);
}

// ============================================================
// ANIMATION MAP (PRIMARY ENTRY POINT)
// ============================================================

export interface AnimationMap {
  /** The resolved clip names (originals) available on the model. */
  clipNames: string[];
  /** Resolve a logical action to its clip name (case-insensitive), or null. */
  resolve: (action: string) => string | null;
}

/**
 * Builds the animation map for a set of embedded clips.
 * This is the PRIMARY ENTRY POINT for matching GLB clip names to logical actions.
 *
 * Strategy:
 *   1. Name-based matching per action (using ACTION_CANDIDATES).
 *   2. If NO action matched AND every clip looks generic (Anim_/Take_/Action_/numeric),
 *      fall back to POSITIONAL mapping by clip order using ANIMATION_ORDER.
 *
 * Examples:
 *   ['Idle','Walk','Run']                       → name-matched (idle, walk, run)
 *   ['Take 001']                                → name-matches idle ONLY
 *   ['mixamo.com|Armature|Walk','Rig|Run']      → substring-matched
 *   ['Anim_0','Anim_1','Anim_2']                → positional (idle, walk, run)
 *
 * Exit (return) shape: { clipNames, resolve(action) -> clipName | null }
 */
export function buildAnimationMap(
  clipNames: string[],
  /** Per-model explicit mapping (threed_models.metadata.animationMap): action → clipName. */
  overrides?: Record<string, string>,
): AnimationMap {
  const cleaned = (clipNames || []).filter(Boolean);
  const byAction = new Map<string, string>();

  // 0) Explicit per-model overrides win (user-mapped in the admin UI).
  if (overrides) {
    for (const [action, clipName] of Object.entries(overrides)) {
      if (!action || !clipName) continue;
      if (cleaned.includes(clipName)) {
        byAction.set(action.toLowerCase(), clipName);
      }
    }
  }

  // 1) Name-based matching pass (only for actions not already overridden).
  for (const action of ANIMATION_ORDER) {
    if (byAction.has(action)) continue;
    const hit = matchClipName(cleaned, ACTION_CANDIDATES[action]);
    if (hit) byAction.set(action, hit);
  }

  // 2) Positional fallback — ONLY when nothing was mapped AND the clips look generic.
  if (byAction.size === 0 && cleaned.length > 0 && cleaned.every(looksLikePositionalClip)) {
    for (let i = 0; i < ANIMATION_ORDER.length && i < cleaned.length; i++) {
      byAction.set(ANIMATION_ORDER[i], cleaned[i]);
    }
  }

  // Resolve an action, falling back through ACTION_FALLBACK when its clip is missing.
  const resolve = (action: string): string | null => {
    if (!action) return null;
    const lower = action.toLowerCase();
    const chain: string[] = [lower, ...(ACTION_FALLBACK[lower as AnimationActionKey] ?? [])];
    for (const candidate of chain) {
      const hit = byAction.get(candidate);
      if (hit) return hit;
    }
    return null;
  };

  return { clipNames: cleaned, resolve };
}
