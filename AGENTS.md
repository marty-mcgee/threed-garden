# Codex Instructions

Read CONTEXT.md before architectural work.

## General rules

- Inspect relevant files before editing.
- Prefer incremental changes over rewrites.
- Do not guess schema fields, API paths, auth patterns, or component props.
- Never expose or request secrets.
- Do not edit .env files unless explicitly requested.
- Do not change database schema unless explicitly approved.
- Keep changes scoped to the requested task.
- Run relevant TypeScript/build checks after changes.

## ThreeD character rules

- Preserve GardenCharacter and EcctrlCharacter as separate runtime paths.
- `isMovable` determines Ecctrl routing.
- Preserve external FBX animation loading and semantic Animation Action Mapping.
- Preserve task → locomotion crossfade behavior.
- Avoid direct animation-mixer manipulation outside the established character action path.
- Character animation and world-state mutation are separate responsibilities.
- World actions occur only after one-shot animation completion.
- Do not expand harvest/world persistence without explicit approval.

## Stable checkpoint

Current stable version: v0.16.7 "Visual Action Targeting".

v0.16.7 includes the stable v0.16.6b World Actions v2 targeted Water workflow and is the release boundary for subsequent v0.16.8+ work.

Treat regressions in:
- FBX loading
- idle/walk/run
- Garden wander
- Ecctrl WASD
- DetailsCard
- Take/Release Control
- targeted Water
as release-blocking.
