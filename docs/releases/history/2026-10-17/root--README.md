<!-- Historical snapshot: reference only; relative Markdown links relocated; original wording preserved. -->

## Production release confirmed: [v0.26.10 - ThreeD Project Models: DetailsCard simplification](../../v0.26.10.md)

October 17, 2026: Developer confirms v0.26.10 released to production. This supersedes the earlier preparation-only status below. Package/root lockfile remain 0.26.10. Existing offline checks are pre-release evidence; the exact deployed commit and independent post-deployment verification are not established. The pending v0.26.9 level-visibility-subset Save/reopen check is not separately confirmed. This update records the Developer's report only; no agent Git writes, deployment, server operations or live data writes were performed.

## Prepared checkpoint: [v0.26.10 - ThreeD Project Models: DetailsCard simplification](../../v0.26.10.md)

October 17, 2026: local version 0.26.10; production remains Developer-confirmed v0.26.9. DetailsCard section headers are available by default after removing its Show/Hide Character settings button. Existing sections still expand and collapse. Dependencies and schema are unchanged.

Fresh TypeScript and four focused checks passed; full CI/build and browser verification were not rerun. See release notes for validation and manual checks.

Earlier release/status entries below are historical.

## Production release confirmed - v0.26.9

October 17, 2026: Developer confirms **v0.26.9 - ThreeD Designs: Linked Levels and toolbar polish** released to production. This supersedes earlier local-preparation/unreleased status for this version. Package/root lockfile remain 0.26.9. Prior 78-task offline CI, fresh TypeScript and guarded build results remain pre-release evidence; no independent post-deployment check or exact deployed commit is established. Release confirmation does not separately confirm the pending level-visibility-subset Save/reopen check. This documentation update performs no server, live data, Git-write or deployment operations.

## v0.26.9 - ThreeD Designs: Linked Levels and toolbar polish

Local release preparation, October 17, 2026. Package/root lockfile 0.26.9; dependencies/schema unchanged. Developer accepted Project toolbar ordering, removed Model outline and linked Blueprint Levels controls. Named level visibility subsets now follow existing Project workspace Save, with legacy preference compatibility. See [release notes](../../v0.26.9.md). Production remains Developer-confirmed v0.26.8; no deployment or independent production check is claimed. New subset Save/reopen remains manual. Preserve manual edits and leave unstaged; no servers/live writes/Git/deployment operations.

## Production release confirmed - v0.26.8

October 17, 2026: Developer confirms **v0.26.8 - ThreeD Designs: Transparency, top views and canvas tools** released to production. This supersedes earlier local-preparation/unreleased status for this version. Package/root lockfile remain 0.26.8. SQL application, Real Top-View Image Upload and Project Save/Re-open were separately Developer-confirmed. Prior 78-task offline CI, TypeScript and guarded build results remain pre-release evidence; no independent post-deployment verification or exact deployed commit is established. This documentation update performs no deployment, Git writes, live data or server operations.

## v0.26.8 - ThreeD Designs: Transparency, top views and canvas tools

Prepared locally October 17, 2026 on main at 7243155b plus accepted working changes. Package/root lockfile are 0.26.8; dependencies unchanged. This is release preparation, not deployment confirmation. See [release record](../../v0.26.8.md).

Includes saved Design transparency, owned Model top-view PNG uploads and calibrated plan images, Environment measurement controls, adaptive Metric rulers, optional object measurements and a compact right-click Design tools menu. Developer accepted the context menu and condensed styling. Developer confirms the additive SQL is applied; actual uploads and authenticated Save/reopen for these new fields remain manual; older acceptance is not new verification. No servers, live writes or Git/deployment operations. Historical preparation records below are retained.

## Development: v0.26.8 - Design appearance and Model top views

Local, unreleased improvements add saved Project architecture transparency and Model-linked top-view PNGs in the Design plan. See [scope, schema prerequisite and checks](../../../plans/v0.26.8.md). The new database column is not yet applied; real upload/Save-reopen and visual verification remain manual.

## v0.26.7 - ThreeD Simulations: Unified Admin editor

Final preparation passed: all 77 offline CI tasks, four focused suites (eight scripts), fresh TypeScript, metadata consistency, source/config parity and whitespace checks. Guarded production build passed on isolated Next.js 16.4.2 (145/145 pages, exit 0). The existing matching isolated dependency installation was reused; no fresh dependency install is claimed. External network/dev-server access was blocked, credentials scrubbed and dummy database/offline fonts used. CI ran outside the Windows sandbox to avoid the previously confirmed tsx userInfo restriction. The build emitted the known non-failing nested-lockfile workspace-root warning. Next regenerated only the isolated next-env dev/build type paths; the Developer source copy was untouched. Runtime browser/authenticated persistence and production verification remain manual. No servers, live writes, Git writes or deployment.

Prepared locally October 16, 2026 on main at 5b176631 plus accepted changes. Package/root lockfile are 0.26.7; dependencies/schema unchanged. The Developer intends to release v0.26.6, but explicit deployment completion remains unconfirmed; latest explicit confirmed production is v0.26.5. Repository history is not deployed provenance. See [release notes](../../v0.26.7.md). Preserve manual sidebar taxonomy and existing Project/Scene owners. This preparation does not commit, tag, push, publish or deploy. Older statuses below are historical.

## v0.26.6 - Admin Sidebar: Navigation and persistent toggles

Developer accepted the manual entity-focused menu taxonomy and intends to release this checkpoint. Package/root lockfile are now 0.26.6. Production remains Developer-confirmed v0.26.5 until release completion is confirmed. See [release notes](../../v0.26.6.md). Preserve manual labels/order, user-scoped browser toggles, specific active matching and mobile drawer visibility. No commit, tag, push or deployment was performed. Older statuses below are historical.

## Current production: [v0.26.5 — ThreeD Projects: Admin Setup and unified configuration](../../v0.26.5.md)

October 16, 2026: Developer confirmed this release is in production. Package/root lockfile remain 0.26.5. Exact deployed commit and independent production verification remain unconfirmed. Prior 76-task offline CI, TypeScript and guarded build results are pre-release evidence; this confirmation does not establish new browser or authenticated Save/reopen checks. Earlier preparation-only and production-version statements below are historical and superseded. This documentation-only update leaves application code, servers and live data untouched.

## v0.26.5 — ThreeD Projects: Admin Setup and unified configuration

Release validation passed October 16: all 76 offline CI tasks, fresh TypeScript (tsc --noEmit --incremental false), version/Developer-lock preservation and source/config parity checks, checkpoint documentation links, whitespace checks, and guarded production build (145/145 pages, exit 0). The isolated copy reused matching Next.js 16.4.2 dependencies; the Developer installation/server was untouched. No clean install was performed against the edited lockfile. Differences from the reused dependency lock are optional Linux/esbuild and WASI metadata. CI's initial sandbox run hit the known Windows tsx userInfo ENOMEM restriction; the unchanged guarded rerun outside that restriction passed. The build emitted a non-failing nested-lockfile workspace-root warning. No agent browser/authenticated persistence or production check is claimed.

Prepared locally October 16, 2026 on main at 54ede874 plus accepted working changes. Package/root lockfile are 0.26.5. Production remains Developer-confirmed v0.26.4; deployed provenance and independent production verification are unconfirmed. Earlier preparation statuses below are historical.

Admin Project Setup exposes supported Project-owned settings, always-visible details, one Save Changes action and matching New/Edit forms. Typed changed-key merges preserve unrelated content; stamped, row-locked saves detect supported stale workspace/measurement changes. Dependencies and schema are unchanged; existing Developer lockfile edits are preserved.

See [release notes](../../v0.26.5.md) and [configuration plan](../../../plans/project-configuration-authority.md) for checks and manual limitations. No local servers, live writes, Git writes or deployment are included.

![ThreeD Design workspace with the recovered house, Project Assets, Model guidance, and linked 2D plan](../../../images/v0.25.3/design-workspace.png)

## v0.26.4 — ThreeD Simulations: Admin workflows and Results

Release checkpoint prepared locally October 15, 2026. Package/root lockfile are **0.26.4**; production remains Developer-confirmed **v0.26.3**. Dependencies and database schema are unchanged. Earlier preparation statuses below are historical and superseded by this checkpoint.

Manage Simulation definitions in Admin, review captured Results and Sensor observations, and return to the Project Scene to run supported Actions. Scene feedback now separates execution progress from Result saving. Existing Dashboard management URLs redirect to Admin. Scenarios, Characters and Animation workspaces share clearer filters, navigation, status and Save guidance.

The Developer accepted the Scene improvements and Admin direction. Automated verification and remaining browser/authenticated checks are recorded separately in the [v0.26.4 release notes](../../v0.26.4.md). See the [implementation plan](../../../plans/v0.26.4.md) and [Simulation guide](../../../developers/THREED_SIMULATIONS.md). This is local preparation, not a deployment confirmation.

Release checks passed: 75 offline CI tasks, supplemental Animation checks, fresh TypeScript and an isolated guarded production build (145/145 pages). Authenticated Admin/browser smoke checks remain separate; local servers and the development installation were left untouched.

## v0.26.3 — ThreeD Design Tools + Toolbar

Local checkpoint prepared October 15, 2026. Package/root lockfile are 0.26.3; dependencies and schema are unchanged. Production is Developer-confirmed v0.26.2; this checkpoint is not yet reported released. Earlier preparation statuses below are historical.

The canvas-local Design toolbar now groups drawing tools, Undo/Redo, Import/Export JSON and plan navigation with colored icons and bordered groups. Existing accessible names, tooltips, active/disabled states and handlers remain; Project Save stays in the Project header. Developer accepted the toolbar appearance in chat. TypeScript and whitespace checks passed; full CI/build and independent browser/Save-reopen checks were not rerun.

See [release notes](../../v0.26.3.md). Preserve existing Project/Scene owners, import validation and manual edits. Local servers remain untouched; no live writes, commit, tag, push or deployment.

## v0.26.2 — ThreeD Workspace: View Modes + Access Panels

Release checks passed: isolated clean install, fresh TypeScript, four focused offline suites, source/config/version/link checks, and guarded production build (144/144 pages, explicit exit 0) on Next.js 16.4.2. Full CI and independent browser/Save-reopen checks were not rerun. See release notes for initial lockfile repair and non-failing isolated-build warning.

Local release preparation, October 15, 2026, on main at c7d0326e plus accepted working changes. Package/root lockfile version is 0.26.2. This is not a deployment confirmation; prior v0.26.1 checkpoint is committed, while the latest explicit production confirmation in this conversation remains v0.26.0. Earlier status records below are historical.

Model Library, FarmBot Library, Bed and Planting placement now share the upper-left Design Assets dock, bounded sizing and complete-form scrolling. The 2D map has an isolated stacking context and reserves the measured Project toolbar height, keeping the header accessible. Design/Combined continuity from v0.26.1 remains intact; explicit mode order stays 3d, design, 2d, combined. Project data, Save/load, physics and renderer quality are unchanged.

Developer accepted the 2D header correction and requested release preparation. This is user feedback, not independent browser testing. Full four-mode placement, narrow-screen/divider behavior and authenticated Save/reopen remain manual checks. The existing rendering fail-safe does not establish GPU-crash prevention. The Developer's Next.js ^16.4.2 edit is retained with synchronized release dependencies; the active development installation/server is untouched.

See [release record](../../v0.26.2.md) for exact checks and limitations and [implementation plan](../../../plans/v0.26.2.md). No commit, tag, push, publication or deployment is performed by this preparation.

## v0.26.1 ? ThreeD Workspace: Rendering fail-safe and Design mode continuity

Prepared locally October 15, 2026 on main, based on 53372d24 plus accepted working changes. Package/root lockfile are **0.26.1**; dependencies and database schema are unchanged. Production remains **Developer-confirmed v0.26.0**. This checkpoint is not yet released. Earlier preparation/status entries below are historical and superseded by this summary.

- **Rendering fail-safe:** active Scene and preview canvases stop after detected context loss, unhandled recursion/update-depth errors, or caught Canvas rendering failures. The page-local guard latches without automatic retries and defers shutdown notification until the current callback finishes. Project state remains outside the Canvas boundary.
- **Original visual quality:** caller pixel-density/antialias settings and 4096 Scene shadows are preserved. The initial quality reductions were reverted; the Developer confirmed restored quality.
- **Design mode continuity:** Character Library uses the upper-left Assets dock and shared panel sizing. Character placement, DetailsCard movement, transforms, sensors and other viewport-requiring actions retain Design/Combined mode; 2D-only mode switches when a 3D viewport is needed.

Developer feedback accepts the visible quality and workspace improvements. Offline TypeScript and focused mocked/lifecycle checks passed; these are not independent browser or production verification. The reported GPU/whole-computer crash remains undiagnosed: the guard is not a GPU-memory limit or a guarantee against driver failures. Full CI/build and authenticated Save/reopen have not been rerun for this checkpoint.

[Release notes and manual checks](../../v0.26.1.md) ? [Fail-safe implementation and limits](../../../plans/rendering-failsafe.md)

Final release checks: all 72 offline CI tasks passed; TypeScript, seven focused projection/units/physics/asset-sizing checks, version/dependency consistency, release links and whitespace checks passed. Guarded isolated production build compiled and generated 144/144 pages. Runtime source matched the built copy; subsequent changes were validation fixtures and documentation only. Installed Three CommonJS and isolated build-root warnings remain non-failing. No new browser/production verification or deployment is claimed.

## v0.26.0 release candidate - October 15, 2026

Developer requested release preparation of the accepted current checkpoint. Package/root lockfile remain **0.26.0** on main, based on 1e5c9f97 plus local changes. Production remains user-confirmed v0.25.4; this is local preparation, not deployment. [Release notes](../../v0.26.0.md) now cover Project measurement preferences, derived Designs records, architectural Rapier collisions, Character scale/physics compatibility, name editing and inspector labels alongside the v0.25.x navigation consolidation.

User-reported acceptance is recorded separately from offline validation. TypeScript, focused mocked persistence tests, local collision/conversion tests and guarded isolated build (144 pages) passed. No agent browser/production verification, live writes, server operations, migration, commit, tag or deployment. Capsule/world-gravity normalization, legacy apertures/advanced architecture, Builder acceptance and broader touch coverage remain separate limitations. The final full CI run passed all 72 tasks.

## Stable v0.26.0 preparation

The Developer accepted the v0.25.5 navigation checkpoint and requested direct promotion to stable **0.26.0**, consolidating the v0.25.x improvements. Package/root lockfile metadata are 0.26.0; dependencies/schema are unchanged. Production remains Developer-confirmed v0.25.4 until a separate deployment confirmation. v0.25.5 is included in this checkpoint, not claimed as separately released.

See [v0.26.0 release notes](../../v0.26.0.md) for consolidated features, source records, verification and remaining manual checks. This preparation runs TypeScript, version/dependency consistency and whitespace checks; it does not rerun full CI/build or independently verify browser/production behavior. Existing legacy/Builder/touch limitations remain explicit. No local server, database, Git write or deployment operation. Earlier status entries below are historical.

## Release checkpoint: [v0.25.3 — ThreeD Designs: Legacy recovery and Model guidance](../../v0.25.3.md)

## v0.25.4 ? Page titles and Project context

Prepared locally October 14, 2026. Package/root lockfile metadata are 0.25.4; dependencies and schema are unchanged. Production remains Developer-confirmed v0.25.3; v0.25.4 has not been reported deployed. Earlier release-preparation statuses below are historical.

The shared React/TypeScript title owner derives readable titles from the Next.js pathname and appends the loaded Scene Project name and ID. Example: `ThreeD Garden - Dashboard - Scene - Legacy Plan Demo 1 Recovery [17]`. Existing descriptions remain in Next metadata; visible headers and Project persistence are unchanged. See [release notes](../../v0.25.4.md) and [implementation guide](../../../developers/PAGE_TITLES.md).

TypeScript and six mocked route/server-rendered title checks passed during implementation. Developer accepted the result; independent browser navigation, authenticated Project-switch checks and production verification were not executed. No local server, database, Git write or deployment operation.


Prepared locally October 14, 2026 on `main`, based on `8ee6bd14` and the accepted working changes. Package/root lockfile are **0.25.3**; React Three Fiber remains stable **9.8.1**. Current production is **Developer-confirmed v0.25.2**. This checkpoint is ready for the Developer's release process; it has not been committed, published or deployed by the agent. Earlier status entries below are historical.

- **Recover editable architecture:** Import supported legacy Paper.js plan JSON through the existing staged Import JSON dialog. Review omitted content, choose merge or architecture-only replacement, and retain fresh IDs, Imperial editing and the Project Save workflow.
- **Recover a legacy scene deliberately:** The separate `threed:design:recover` CLI prepares and verifies OBJ/MTL/texture bundles, with explicit create-only apply and recovery receipts. The authorized demo recovery created Project #17 with 53 Model placements alongside 38 editable walls, 10 floors, four roofs and three levels. Ordinary Import JSON does not import catalog Models or legacy boolean masks.
- **Understand Models and their settings:** Solid-color OBJ materials can satisfy Library setup through an attached MTL without image textures. Clearer Library labels, usable Inspect actions and compact DetailsCard sections with accessible help distinguish reusable Models, placed instances and architecture.

### Accepted browser checkpoint

![ThreeD Design workspace with the recovered house, Project Assets, Model guidance, and linked 2D plan](../../../images/v0.25.3/design-workspace.png)

Developer-supplied screenshot, October 14, 2026 at 11:28, from the local App. It records the accepted visible checkpoint: recovered Models and architecture together, linked 2D/3D views, Project Assets and updated DetailsCard guidance. [Earlier annotated review](../../../images/v0.25.3/design-review-annotations.png) shows the original orange guidance areas and green accepted views; annotations are review markup, not App styling. Both originals are preserved unchanged.

[Release notes and checks](../../v0.25.3.md) · [Legacy import/recovery guide](../../../plans/legacy-design-json-import.md) · [Architecture capability roadmap](../../../plans/design-architecture-capabilities.md)

The earlier authorized recovery verified committed data and all 60 uploaded files. Screenshots and offline tests do not establish a subsequent authenticated Save/reopen. Catalog-to-opening connections, sloped-top walls, floor holes and advanced roof joins remain documented follow-ups; this release does not claim full legacy geometry parity. Local servers remain under Developer control.

## Historical local release preparation: [v0.25.2 — ThreeD Garden: Design tools and texture linking](../../v0.25.2.md)

Prepared October 13, 2026 on main; package/root lockfile are 0.25.2. Includes grouped Design tools, blank-space drag panning with separate Select/Pan tools, and explicit PNG replacements for FBX TGA requirements. The Developer accepted toolbar/panning behavior. Stable React Three Fiber 9.8.1 is restored; existing optional lockfile cleanup is preserved. See release notes for offline verification and remaining authenticated texture-link, Scene appearance, Save/reopen and touch checks. No database schema change or server operation; leave changes unstaged.

Production remains **Developer-confirmed [v0.25.1 — App Styling (Blueprints + Customizations)](../../../plans/v0.25.1.md)**. Repository checkpoint `038021a4` is visible, not independent deployment evidence. v0.25.2 is prepared locally, not released. Historical production/development labels below are superseded.

## Historical production: [v0.25.0 — ThreeD Garden: CSS polish and App Header consolidation](../../v0.25.0.md)

Developer-confirmed released to production in chat. Repository checkpoint `89e42a23` is visible; exact deployed SHA and independent production verification remain unconfirmed. Local development is now **[v0.25.1 — App Styling (Blueprints + Customizations)](../../../plans/v0.25.1.md)**; package/root lockfile are 0.25.1. The Developer accepted the Home/Dashboard/Learn translucent surfaces, accents and green actions as its opening checkpoint. This work is unreleased; further refinements remain to be selected. Keep local dev servers untouched and changes unstaged. Earlier preparation records below are historical.

## Historical local release preparation: [v0.25.0 — CSS polish and App Header consolidation](../../v0.25.0.md)

The Developer accepted the focused header checkpoint and requested v0.25.0 directly, superseding the unreleased v0.24.7 target. Package/root lockfile are 0.25.0; dependencies/schema unchanged. Includes the Home brand link, left public menu, compact header spacing and Developer Home/menu copy refinements. No larger feature stage is included. Production remains Developer-confirmed v0.24.6; exact deployed SHA and independent production checks remain unconfirmed. See the release record for local verification and manual limitations. Preserve accepted editor/Project behavior and manual edits. Keep port 4444 servers untouched and all changes unstaged; no commit, tag, push or deployment. Earlier planning/status entries below are historical.

## Historical v0.24.7 focus: [v0.24.7 — Styling and React polish](../../../plans/v0.24.7.md)

Developer-approved scope: CSS styling and small React refinements only, as a stabilization step toward v0.25.0. Specific fixes and v0.25.0 features remain TBD. Preserve the accepted layouts, component/Canvas owners, Project persistence and manual edits. No major features, broad restructuring, dependency/schema changes or new styling system. This step documents the plan only; package/root lockfile remain 0.24.6 until checkpoint release preparation. Keep port 4444 dev servers untouched and changes unstaged.

Production: **[v0.24.6 — ThreeD Garden: Home, Dashboard and Learn (Pages + Styling)](../../v0.24.6.md)**, Developer-confirmed in chat. Clean main checkpoint at inspection: 1337b913. Exact deployed SHA and independent post-deployment verification remain unconfirmed; prior local checks are not production verification. The earlier preparation/production labels below are historical and superseded.

## Historical release preparation: [v0.24.6 — ThreeD Garden: Home, Dashboard and Learn](../../v0.24.6.md)

Prepared October 12, 2026 on main; package and root lockfile metadata are 0.24.6. Includes the Developer-accepted Dashboard/Learn presentation, shared Home header/NextAuth controls and garden label cleanup fix. Production remains [v0.24.5](../../v0.24.5.md), Developer-confirmed in chat; exact deployed SHA and independent production verification remain unconfirmed. The release record separates local automated/browser evidence from remaining authenticated App checks. Dependencies/schema and Project save/load are unchanged. Preserve manual changes and leave port 4444 dev servers untouched. Leave changes unstaged; no commit, tag, push or deployment. Earlier production/preparation statements below are historical and superseded by this status.

## Local release preparation: [v0.24.5 — ThreeD Designs: Architecture in Project Assets](../../v0.24.5.md)

Prepared October 12, 2026 on main; package/root lockfile 0.24.5. Architecture inventory, shared selection and mode-preserving Locate are implemented and checked offline. Production remains Developer-confirmed v0.24.4. See release notes for validation, source boundaries and pending manual browser/Save-reopen checks. Dependencies/schema unchanged; preserve manual edits and Developer control of servers. Leave unstaged; no commit, publication or deployment. Earlier preparation records below are historical.

## Next development version: [v0.24.5](../../../plans/v0.24.5.md)

Opened October 11, 2026 on `main`. Local package/root lockfile metadata are `0.24.5`; production remains Developer-confirmed v0.24.4. Approved development scope: Architecture in Project Assets; see the v0.24.5 plan for implementation and acceptance. This is unreleased development. Dependencies and database schema are unchanged. Preserve the released workspace, manual edits and Developer control of local servers. Leave changes unstaged; no Git writes or deployment. Earlier package-version statements describe their historical checkpoints.

## Current production: v0.24.4

**[v0.24.4 — ThreeD Workspace: Save feedback and interface cleanup](../../v0.24.4.md)**. Developer confirmed production release October 11, 2026. Package/root lockfile remain `0.24.4`; dependencies and database schema are unchanged. Prior local TypeScript, 71-task offline CI and guarded build (143 pages) are pre-release evidence, not independent post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%; named-view authenticated smoke, physical-device touch and Builder acceptance remain separately documented. This confirmation changes documentation only; leave changes unstaged under the Manual Release Gate. Earlier preparation-only and production-version statements below are historical and superseded by this confirmation.

## Historical local v0.24.4 release checkpoint

**[v0.24.4 — ThreeD Workspace: Save feedback and interface cleanup](../../v0.24.4.md)**. Prepared locally October 11, 2026 on `main`. Package/root lockfile are `0.24.4`; dependencies and database schema are unchanged. Production remains Developer-confirmed v0.24.3. This checkpoint is not yet published or deployed. Earlier local-version statements below are historical; leave changes unstaged under the Manual Release Gate.

## Previous production: v0.24.3

**[v0.24.3 — ThreeD Scene: Saved views and component cleanup](../../v0.24.3.md)**. Developer confirmed production release October 11, 2026. Package/root lockfile remain `0.24.3`; dependencies and database schema are unchanged. Prior local validation is pre-release evidence, not independent post-deployment verification. Exact deployed SHA and authenticated named-view Save/reload smoke checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. This records release confirmation only; leave changes unstaged under the Manual Release Gate.

This checkpoint preserves the Developer's manual edits and accepted panel extractions, fixes immediate named-view snapshot capture/hydration and adds Designs layer visibility. ThreeDDesign remains unconnected to callers. Historical version/status records below retain their original evidence; this release confirmation supersedes earlier preparation-only and production-version statements.

# ThreeD Garden

Current production: **[v0.24.2 — Workspace Feedback + Responsive Reliability](../../v0.24.2.md)**. Developer confirmed production release October 10, 2026. Package/root lockfile remain 0.24.2; dependencies and schema are unchanged. Prior local validation is pre-release evidence, not post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. New-feedback authenticated smoke testing, physical-device touch and Builder-specific acceptance remain separately documented. This records release confirmation only; leave changes unstaged under the Manual Release Gate.


Previous production: **[v0.24.1 — ThreeD Scene: UI/UX Improvements: App Layout + Page Headers](../../v0.24.1.md)**. Developer confirmed production release October 10, 2026. Package and both root lockfile version fields remain 0.24.1; dependencies and schema are unchanged. Prior local CI/build/browser checks are pre-release evidence, not post-deployment verification. Exact deployed SHA and independent post-deployment checks remain unconfirmed. v0.24.0 authenticated Save/Reload remains Developer-accepted 100%. This documentation update performs no Git write, deployment or live-system operation; leave changes unstaged.

Previous production: **[v0.24.0 — ThreeD Designs: Project workspace and saved state](../../v0.24.0.md)**. Developer confirmed final `0.24.0` released to production October 10, 2026, following authenticated Save/Reload checks reported 100% passed. Released package/root lockfile were `0.24.0`; local preparation is now `0.24.1`. This supersedes earlier pending authenticated Save/Reload and RC-versioning statements below. Verification is Developer-reported, separate from agent automated checks. Production release is Developer-confirmed; exact deployed SHA and independent post-deployment checks remain unconfirmed. Leave changes unstaged; no Git write or deployment is authorized.

Historical development: **[v0.24.0-delta — Cleanup toward release candidacy](../../../plans/v0.24.0-delta-cleanup.md)**. Package/root lockfile are `0.24.0-delta`; the delta planning checkpoint was Developer-confirmed released to production October 10, 2026. This is a prerelease planning baseline, not release-candidate acceptance. Delta is for existing bug fixes and acceptance, before a proposed `0.24.0-rc.1` and stable `0.24.0`. No new runtime fix or release readiness is claimed by this preparation. Earlier package/version statements below describe their historical checkpoints.

Previous production: **[v0.24.0-centaur — ThreeD Designs: Workspace tools and state](../../v0.24.0-centaur.md)**, Developer-confirmed October 10, 2026. Package/root lockfile remain `0.24.0-centaur`. Includes canvas-local tools, staged JSON import, Project workspace snapshot support and compact colored Properties headers. Authenticated Save/reopen, post-deployment verification and exact deployed SHA remain unconfirmed. This records release confirmation only; no Git write or deployment is authorized. Earlier checkpoint statements below are historical.

Previous production: **[v0.24.0-beta — ThreeD Designs: Dashboard workspace](../../v0.24.0-beta.md)**, Developer-confirmed October 10, 2026. Production was released at 0.24.0-beta; local package/root lockfile are now 0.24.0-centaur. The revised Design layout is accepted; authenticated architecture Save/reload and post-deployment verification remain unverified. Exact deployed SHA is unconfirmed.

Previous production: **[v0.24.0-alpha — ThreeD Designs: Project Scene integration](../../v0.24.0-alpha-project-design.md)**, Developer-confirmed October 9, 2026. Detailed authenticated App and post-deployment verification remain separate.

### 🌱 Build your garden. Explore your world. Bring your models to life.

**Turn your assets into an interactive world.** ThreeD Garden brings 3D scenes, geographic maps, animated characters, and multimedia together in one project workspace. Organize your library, compose a scene, and step inside it.

[![Repository validation](https://github.com/marty-mcgee/threed-garden/actions/workflows/validation.yml/badge.svg?branch=main)](https://github.com/marty-mcgee/threed-garden/actions/workflows/validation.yml?query=branch%3Amain)

🟢 **Earlier production release:** [v0.24.0-alpha — 3D Object Builder + Home Design Tools](../../v0.24.0-alpha.md), Developer-confirmed in production October 9, 2026.

🛠️ **3D Object Builder:** [Implementation record](../../../plans/v0.24.0-alpha-model-builder.md) · [Builder guide](../../../developers/THREED_MODEL_BUILDER.md)

**ThreeD Designs:** Edit the active Project/Scene in `design` View Mode using linked 2D/3D walls, floors, doors/windows, levels and roofs with cutouts/skylights. The accepted layout places Assets above Properties on the left and the Scene above the ruled Plan on the right, beneath one shared Project toolbar. Resize the rows, edit Imperial properties, use icon actions/tooltips, snap/pan/zoom, Undo/Redo and validated JSON merge or architecture-only replacement. [ThreeD Designs guide](../../../developers/THREED_DESIGNS.md) · [Dashboard instructions](../../../users/DASHBOARD_GUIDE.md#threed-design-beta).

Architecture uses the existing `project.config.threeDArchitecture` JSONB content and Project snapshot Save/load; no separate table/migration is required. The Developer confirmed authenticated Save/Reload passed 100% for v0.24.0, superseding historical pending beta entries. See [released acceptance](../../v0.24.0.md).

**Released v0.24.1:** Dashboard/Admin beside the App title, a simpler Admin header, right-aligned Dashboard credits and immediate DetailsCard position restoration. [Release notes](../../v0.24.1.md). Builder upload/PBR/placement acceptance and broader mobile/touch coverage remain separate; see [Builder acceptance](../../../plans/v0.24.0-alpha-model-builder.md#9-pending-acceptance-and-retained-exclusions).

[🚀 Get started](../../../users/GETTING_STARTED.md) · [🎮 Explore the controls](../../../users/THREED_CONTROLS.md) · [📚 Browse the docs](../../../README.md) · [🛠️ Run locally](#run-it-locally)

## Create, organize, explore

- 🌍 **Your project, in 2D and 3D.** Connect geographic maps with interactive scenes. Arrange Models, Beds, Plantings, Characters, and FarmBots; organize visibility with Layers and save supported Project state through snapshots. [Explore Ground Maps](../../../users/THREED_GROUND_MAPS.md).
- 🧩 **A library for your 3D assets.** Bulk import **FBX, GLB, GLTF, and OBJ**, inspect supported dependencies, reuse textures, and manage Model Files. Centered Canvas previews, camera Fit/Reset, and transparent PNG exports make assets easier to review and present. [Discover Model management](../../../developers/THREED_MODEL_ADMIN.md).
- 🟣 **Categories that scale with your collection.** Browse expandable parent–child trees, drag siblings to save their Order, and select Models to **Add, Remove, or Replace Categories in bulk**. Model Add/Edit forms use the same hierarchy with independent assignments. [See the latest milestone](../../v0.22.23.md).
- 🎮 **Characters that bring scenes to life.** Add and edit Characters on dedicated Admin pages, preview their Models, and map animation actions. Take control with WASD or let autonomous Characters move through the garden. Physics readiness, moving colliders, and loading feedback support their introduction to the Scene. [Meet the Character runtimes](../../../developers/THREED_CHARACTERS.md) · [Read the Scene improvements](../../v0.22.21.md).
- ⚽ **Play and interact.** Explore playable soccer, select scene objects, and perform supported actions such as watering and picking fruit. [Explore ThreeD Soccer](../../v0.22.10.md) · [Learn the controls](../../../users/THREED_CONTROLS.md).
- 🔵 **A cleaner creative workspace.** Admin organizes reusable content; Dashboard brings it into your Projects. Consistent shadcn/ui forms, transparent rounded panels, title help, clear Save controls, and Toast feedback keep editing focused. [See the Admin Blueprint](../../../plans/admin-threed-workspace-blueprint.md).
- 🎵 **More than a scene editor.** Bring Albums, Tracks, Links, Media, and Speech into your workflow, with Dashboard playback and waveform visualization. Explore traffic and geographic views alongside your Projects. [Open the Admin guide](../../../users/ADMIN_GUIDE.md).

### 🤖 FarmBot, from assets to assembly drafts

Use FarmBot component Models in the shared library and compose local Assembly drafts with relative transforms, repeated components, and JSON import/export. The device integration provides owner-scoped configuration and read-only status; physical commands remain disabled. [Assembly foundations](../../v0.20.12.md) · [FarmBot integration](../../../developers/FARMBOT_INTEGRATION.md).

## Built for interactive worlds

| | Technology |
| --- | --- |
| 🟦 App | Next.js 16 · React 19 · TypeScript |
| 🟪 3D | Three.js · React Three Fiber · Drei |
| 🟧 Motion | Rapier Physics · Ecctrl |
| 🟩 Maps & data | Leaflet · Neon Postgres · Drizzle ORM |
| 🔐 Workspace | Auth.js · Tailwind CSS · shadcn/ui · Radix UI |
| ☁️ Assets | Vercel Blob · AWS S3 integrations |

[🏗️ Architecture](../../../developers/ARCHITECTURE.md) · [🗃️ Data model](../../../developers/DATA_MODEL.md) · [🔌 API guide](../../../developers/API_GUIDE.md)

## Run it locally

Use **Node.js 24 + npm 11**. Install dependencies, configure your development environment and database using the [Local Development guide](../../../developers/LOCAL_DEVELOPMENT.md), then start the app:

```bash
npm install
npm run dev
```

Open [🌐 localhost:4444](http://localhost:4444). The interactive Scene lives at `/dashboard/scene`.

For Drizzle schema updates:

```bash
npm run db:generate
npm run db:push
```

Generation writes local SQL; push shows the database changes for confirmation. [🗃️ Database workflow](../../../developers/LOCAL_DEVELOPMENT.md#database-schema-commands).

For checks and a production build:

```bash
npm run typecheck
npm run validate -- ci
npm run build
npm run next:start
```

[✅ Validation guide](../../../agents/VALIDATION.md) · [🚢 Deployment guide](../../../developers/DEPLOYMENT.md)

## Keep exploring

[📖 Documentation hub](../../../README.md) · [🆕 Release history](../../README.md) · [💻 GitHub repository](https://github.com/marty-mcgee/threed-garden) · [🤝 Agent guide](../../../agents/README.md)

The original app and its history remain available on [📦 legacy-v0.17](https://github.com/marty-mcgee/threed-garden/tree/legacy-v0.17). See the [repository migration record](../../../plans/threed-garden-repository-migration.md) for provenance.

[⚖️ MIT License](../../../../LICENSE)


v0.26.8 release preparation checks passed: 78 offline CI tasks, fresh TypeScript and guarded isolated production build (145 pages). See [release notes](../../v0.26.8.md) for schema confirmation and remaining manual checks.


**v0.26.8 manual acceptance (October 17, 2026):** Developer confirmed Real Top-View Image Upload and Project Save/Re-open passed. Earlier pending status for these checks is superseded; see [release notes](../../v0.26.8.md). This is manual acceptance, not independent production verification.


v0.26.9 release checks passed: 78 offline CI tasks, fresh TypeScript and guarded production build. See [release record](../../v0.26.9.md) for manual limits.
