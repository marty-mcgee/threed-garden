# Codex Instructions

Read CONTEXT.md before architectural work.

## Required workflow

For each development step, work in this order:

1. **Prove** — inspect the current implementation and record the concrete problem, affected files, and acceptance criteria before editing.
2. **Act** — make the smallest scoped change that satisfies those criteria. Preserve unrelated user changes in a dirty worktree.
3. **Document** — run relevant validation, review the diff, and update durable documentation only after the implementation is known.

Do not combine repository restructuring with feature behavior changes in the same step.

## General rules

- Inspect relevant files before editing.
- Prefer incremental changes over rewrites.
- Do not guess schema fields, API paths, auth patterns, or component props.
- Never expose or request secrets.
- Do not edit .env files unless explicitly requested.
- Do not change database schema unless explicitly approved.
- Keep changes scoped to the requested task.
- Run relevant TypeScript/build checks after changes.
- Use `docs/agents/VALIDATION.md` for the repository validation ladder and known baseline limitations.

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

Current production version: v0.17.0 "Character Animation, Music Library, and Admin Improvements".

Current release candidate: v0.17.1 "Production Asset Validation".

v0.17.0 remains the production boundary. Treat uncommitted v0.17.1 validation and CI work as user-owned release-candidate work and do not overwrite or fold it into unrelated changes.

Production character animations are Git-tracked under `public/assets/animations`. When the external animation manifest or those files change, run `npm run validate:assets`. The GitHub workflow treats missing production animation assets as a blocking failure. TypeScript remains a visible, non-blocking CI diagnostic until the documented v0.17.0 baseline is repaired; Vercel remains the production-build gate.

Treat regressions in:
- FBX loading
- external animation asset availability
- idle/walk/run
- Garden wander
- Ecctrl WASD
- DetailsCard
- Take/Release Control
- targeted Water
- targeted Pick Fruit and project-scoped harvest persistence
as release-blocking.
