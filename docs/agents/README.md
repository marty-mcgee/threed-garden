# Agent Documentation

Local v0.22.25 candidate: [Simulation schema and Admin pages](../plans/v0.22.25-simulation-admin.md), with [user help](../help/threed-simulations.md). Developer confirmed the definition table in the production Neon database; application deployment remains pending. Preserve strict bounded definitions, scoped reference choices, immutable bindings, revision conflict handling, Blueprint pages and draft/busy guards. Saving never executes Actions or collects readings. TypeScript, focused checks, 60-task CI and guarded npm build (134 static pages) passed; browser/live CRUD verification remains pending. The schema-only preparation below is superseded by this implementation.

Developer-reported production [v0.22.24](../releases/v0.22.24.md), confirmed October 4, 2026: dedicated Scenario Admin pages and compact Blueprint styling. Preserve exact owner-scoped reads, draft/busy guards, locked bindings and Project-host workflows. Prior TypeScript, 58-task CI and guarded npm build (131 static pages) passed; detailed live checks remain pending, deployed SHA unconfirmed and no post-deployment testing is claimed. Cross-Project application remains theoretical; v0.22.25 now authorizes the [Simulation definition schema](../plans/v0.22.25-threed-simulations-schema.md) only.

Developer-reported production [v0.22.23](../releases/v0.22.23.md), confirmed October 4, 2026: Category Trees, sibling Order reordering and bulk Model category assignments. Preserve independent checkbox assignments, owner-scoped category-only mutations, captured page-local targets and honest partial-write Toast/refresh. Prior focused checks/TypeScript passed; detailed browser/live verification remains pending, deployed SHA unconfirmed and no post-deployment testing or v0.22.23 agent build is claimed. Earlier candidate notes below are historical.

Local release candidate: [v0.22.22 Admin editor Blueprint styling](../releases/v0.22.22.md), with Developer appearance approval and production release requested. Preserve opt-in transparent panels, title-adjacent help, green enabled/muted disabled Save and bottom-left wrapping actions. Production remains v0.22.21 pending confirmation; Manual Release Gate applies.

Developer-reported production [v0.22.21 release record](../releases/v0.22.21.md), confirmed October 4, 2026: Scene Character introduction, physics readiness, Garden collider motion and session-safe placement. Preserve separate runtime owners, first-pose/fallback gating, explicit Garden proxy and 0.6 capsule clearance. Prior 58-task CI, TypeScript and guarded npm build (130 pages) passed locally; [detailed browser checks](../plans/v0.22.21-character-scene-introduction.md) remain pending, no post-deployment testing is claimed and deployed SHA is unconfirmed (implementation commit `effaaf9a`). Prior production checkpoint: [v0.22.20](../releases/v0.22.20.md), Character Admin pages and previews.

Developer-reported production [v0.22.19 release record](../releases/v0.22.19.md): compact Model Edit Interface, collapsed rounded Categories with visible assigned names and independent hierarchy selections, accessible help and scoped switches. Preserve existing draft/source/Canvas boundaries. Production release confirmed October 4, 2026. Prior local validation remains separate from pending detailed browser verification; no post-deployment testing is claimed and deployed SHA remains unconfirmed.

Developer-reported production v0.22.18 [release record](../releases/v0.22.18.md) covers foundations and coordinated Model editing/source switching. Preserve its retained-source/runtime/preview boundaries and distinguish local checks, Developer readiness feedback, browser verification and deployment evidence.

Canonical development repository: `marty-mcgee/threed-garden`; work from the active repository root supplied by the environment. The released [v0.22.0 repository handoff](../plans/v0.22.0.md) starts the independent release line. `marty-mcgee-neon` is retained as historical source, not the target for new app changes.

Coding agents must read the root [AGENTS.md](../../AGENTS.md) and [CONTEXT.md](../../CONTEXT.md) before architectural work.

Source-of-truth order:

1. Current implementation and Drizzle schemas.
2. Root `AGENTS.md` safety and workflow requirements.
3. Root `CONTEXT.md` current checkpoint and architectural history.
4. Audience guides in `docs/`.
5. Historical context snapshots, which are reference material only.

Use [Safe change areas](SAFE_CHANGE_AREAS.md), [Task checklists](TASK_CHECKLISTS.md), and [Validation](VALIDATION.md) for every development step. If documentation conflicts with code, prove the current behavior and correct the documentation within the same scoped task.

Read [ThreeD character runtimes](../developers/THREED_CHARACTERS.md) before changing GardenCharacter, EcctrlCharacter, character routing, or Phase 5 orchestration.

Read [ThreeD Marker architecture](../developers/THREED_MARKERS.md) before changing Runtime Marker creation, marker identity, ThreeD Layers, marker visibility, Action Target resolution, or marker adapters.

Read [CONTEXT.md](../../CONTEXT.md) for the current local candidate and Developer-reported production checkpoint, with validation and browser/release evidence kept separate. [Application architecture](../developers/ARCHITECTURE.md) maps framework, provider, renderer, resource and physics ownership; the [v0.22.18 foundation plan](../plans/v0.22.18-application-foundations.md) records its focused maintenance. [v0.22.10 — ThreeD Playable Soccer](../releases/v0.22.10.md), commit `b952b885`, is a historical User-confirmed production checkpoint; its [release plan](../plans/v0.22.10-playable-soccer.md) retains shipped scope and manual checks. Node 24 and npm 11 are the active tooling; use `npm install` and include matching `package-lock.json` edits with dependency changes, leaving all files unstaged under the Manual Release Gate. The agent runs `npm run build` during release preparation after validation; production deployment remains separate. The [v0.20.1 ThreeD Physics boundary](../plans/v0.20.1-release.md) remains in effect. Preserve generic Physics Sensors, Sensor Groups, sensor TransformControls and the optional Sensors panel; whole-Model TransformControls and further FarmBot expansion remain deferred. Preserve the `src/libraries` source boundary, canonical `/dashboard/scene` route, Multimedia module identity, shadcn/ui component boundary, Project ownership rules, persistent Canvas/physics, and separate Garden/Ecctrl runtimes.

The autonomous [ThreeD Animations Library](../developers/THREED_ANIMATIONS_LIBRARY.md), uploads, Character assignment editor and Character playback integration shipped in v0.19.14. Dedicated Model assignment editing and compatibility/retargeting remain separate work.
