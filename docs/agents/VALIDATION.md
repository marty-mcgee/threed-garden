# Agent Validation Guide

This repository uses a narrow-first validation ladder. Agents should prove the relevant behavior with the smallest useful check before escalating to slower or broader commands.

## Validation order

1. Inspect `git diff --check` for whitespace and patch errors.
2. Run `npm run typecheck` and filter the output to the files changed by the current task when the repository-wide baseline is not clean.
3. Run a file-scoped lint command only when an ESLint executable/configuration is available.
4. Run targeted tests when a matching test exists.
5. Run `npm run build` only when the change affects bundling, routing, server/client boundaries, or release readiness.
6. Perform the relevant manual regression checklist for interactive ThreeD behavior.

## Commands

```bash
git diff --check
npm run typecheck
npm run build
```

`npm run typecheck` is the canonical full TypeScript command and expands to `tsc --noEmit --pretty false`.

## Known baseline

At the start of v0.17 work, the full TypeScript command reports a large pre-existing repository error baseline across unrelated modules. A successful scoped change therefore requires both:

- no new diagnostic referencing a modified file; and
- an explicit report that the full command is not globally clean.

Do not repair unrelated baseline errors as part of a scoped feature or structural task.

## ThreeD release-blocking manual checks

- Farmer FBX model renders.
- External FBX animations load.
- Idle, walk, and run work.
- `GardenCharacter` autonomous movement works.
- `EcctrlCharacter` Take/Release Control and WASD work.
- Task animations return cleanly to locomotion.
- DetailsCard opens and targeting controls work.
- Targeted Water persists after animation completion.
- Targeted Pick Fruit creates one project-scoped harvest record.

## Reporting

Every completed change should report:

- files changed and responsibility of each change;
- commands run and exact outcomes;
- unrelated worktree changes observed but not modified;
- assumptions, remaining risks, and manual checks still required.
