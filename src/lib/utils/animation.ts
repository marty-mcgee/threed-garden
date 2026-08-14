// src/lib/utils/animation.ts — v0.16.5
// Single source of truth for matching logical animation "actions" (idle, walk, run,
// jump, dance, ...) to the actual AnimationClip names embedded in a GLB/GLTF/FBX file.
//
// Model files expose their clips via `object.animations` (THREE.AnimationClip[]). Clip
// names vary wildly by author/tool ("walk", "Walk", "mixamo.com|Armature|Walk", "Rig|Run").
// This matcher is case-insensitive and falls back to substring matching so the logical
// state resolves to the right embedded clip.

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