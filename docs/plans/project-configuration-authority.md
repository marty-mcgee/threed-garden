# ThreeD Projects: configuration authority and Admin Setup

October 15, 2026. Developer direction: Projects should hold their rightful authority over the User Experience of the Project Scene. Production v0.26.4 is Developer-confirmed and manually verified; repository HEAD at inspection is `54ede874`, with a clean working tree before this documentation. This does not independently establish deployed commit provenance or repair prior offline test failures. No next release number is assigned by this plan.

## Intended outcome

Admin Project Setup provides a clear configuration entry point for the active Project. Opening that Project restores its existing Scene content and supported saved workspace settings. Dashboard tools edit the same Project through established APIs and state owners. Switching View Mode changes the presentation of that Project; switching Projects loads the other Project's content and settings.

The Project is the authority for its Scene experience. App-wide styling, account permissions and device/runtime safety limits retain their existing scope. Reusable Library resources retain their identities; Project placements and associations define their use in this Scene.

## Existing implementation inspected

| Responsibility | Actual existing source/storage |
| --- | --- |
| Project identity, ownership, access flags, coordinate origin, heading and scale | `src/libraries/schema/project/index.ts` defines `project` and its columns. |
| Module associations and their configuration | The same schema defines `projectThreed`, `projectTraffic` and `projectMultimedia` junction records. Do not assume junction config currently configures every Scene setting. |
| Admin Project editing and asset management | `src/app/admin/projects/[id]/page.tsx`; `src/components/admin/projects/ProjectAssetManager.tsx`. Existing edit form exposes identity, Public/Active, measurement preference and geographic calibration; no dedicated Setup/Configurations section currently exists. |
| Admin read/update boundary | `src/app/api/project/route.ts`: owner-scoped GET/PATCH; measurement updates merge one config key; coordinate calibration updates Project columns and saved geographic marker metadata in a transaction. It is not currently a general workspace-config editor API. |
| Measurement preference | `project.config.measurementUnits`, read/validated by `src/libraries/services/project/measurement-units.ts`, with legacy saved-Design preference fallback. |
| Editable Design content | `project.config.threeDArchitecture`, parsed by `design/project-architecture.ts`; native document validation in `design/document.ts`. |
| Derived Designs record | `design/project-design-projection.ts` maintains `threed_designs` within Project snapshot Save. It is not a replacement authority for the active Project document. |
| Scene placements and snapshot Save/load | `src/app/api/project/threed-markers/route.ts` uses Project-scoped marker records and merges validated architecture/workspace preferences into Project config, preserving unrelated keys. |
| Saved Scene/workspace settings | `project.config.threeDViewState`, validated by `markers/project-view-state-core.ts`: View Mode, camera mode/position/target/settings, layers, environment, sunlight/ground, saved views, supported panels/inspectors and Design workspace. These are existing saved-state fields, not an already implemented separate launch-defaults contract. |
| Client Project hydration and runtime owners | `src/libraries/services/map/threed-project-session-core.ts`, `src/app/dashboard/scene/page.tsx` and `src/components/map/ThreeDScene.tsx`. Keep their Project identity, load/save, draft and Canvas/physics ownership. |

Service paths abbreviated above are under `src/libraries/services/threed/`. Inspect each field's actual runtime consumer before exposing it for editing; presence in JSON alone does not establish an Admin control or complete restoration behavior.

## Proposed Admin Setup organization

1. **Project identity and access:** existing name, description, Active/Public controls and owned Project context.
2. **Measurements and coordinates:** existing Metric/Imperial preference, current scale/origin/heading and explicit geographic calibration workflow. Unit display changes must not rescale stored objects. Keep calibration as a deliberate operation with its current effects explained.
3. **Scene configuration:** expose supported existing environment, ground, sunlight and layer settings through typed controls after tracing their consumers. Preserve established defaults for absent settings.
4. **Workspace restoration:** identify the currently saved View Mode, camera/view presets, panel state and Design workspace. Clearly distinguish editing a saved snapshot from any future choice to introduce separate launch defaults; do not create two conflicting authorities.
5. **Modules and content:** retain existing asset/module management and show the relationship to Project Models, Characters, Designs and Simulations. Content editors and their ownership rules remain in their established modules.

This organization is a proposal, not a claim these new sections or controls are implemented. Avoid a raw JSON editor as the primary experience. Do not expose arbitrary config writes or silently reset existing architecture, Models or workspace state.

## Focused implementation boundaries

- Reuse shared Admin components, themes, field labels/help, loading/error/dirty feedback and responsive conventions.
- Preserve the existing Project API and Scene snapshot pipeline. Extend typed patch validation only for specific supported settings; merge targeted keys without replacing unrelated Project config.
- Define how Admin edits interact with an already open Scene draft. Avoid stale whole-document writes from either surface. Preserve pending edits, failed-save recovery and Project switching isolation.
- Add an Open Project Scene action using the actual Project identity and supported navigation. Distinguish an explicit navigation View Mode override from the saved View Mode.
- Do not invent new schema fields, universal per-Project overrides, visibility/access guarantees or physics changes. A schema extension requires an identified gap and explicit data-lifecycle reasoning.
- Keep the remaining legacy architecture roadmap separate from this Project configuration work. This task does not resume floor openings, Model plan rendering or other new Design geometry stages.

## Proposed acceptance

- Admin and Dashboard identify the same active Project and read the same supported settings.
- Editing measurement display preserves physical dimensions, calibration and existing placements.
- Saving supported Scene/workspace settings preserves architecture, Model instances, module associations and unrelated config keys.
- Project reopening restores supported saved state after its required entities/components load; defaults do not overwrite loaded state.
- Failed saves preserve the draft; edits during Save remain dirty; Project switching isolates state.
- Owner access remains enforced server-side; public visibility does not grant edit access.
- Focused tests use mocked persistence. Visual Admin/Scene checks and authenticated Save/reopen are recorded separately.

## Current status

Implemented locally October 15 after explicit Developer authorization. Package remains 0.26.4; this increment is unreleased. The earlier inspection table and proposed organization above describe the starting point/specification.

### Delivered entry point

October 16 New/Edit parity follow-up: `/admin/projects/new` now reuses `ProjectConfigurations` and new `ProjectDetailsFields.tsx`, which also supplies Edit's identity/access fields. New has matching Setup presentation, All Projects navigation, name/description/Public/Active controls, measurement preference, one Create Project action and one Reset. Existing POST creation remains authoritative and redirects only after a confirmed positive Project ID. Failed creation retains the draft. This adds no new creation API, schema, modules, Models, architecture or camera snapshot.

Creation uses an explicit absent Project ID (`null`), never a fake persisted identity. Saved workspace, environment and layer controls follow the same unavailable-snapshot behavior as a fresh Edit page. Guidance explains: create the Project, add modules/content, then Save Project in its Scene. Coordinate calibration becomes available after creation through the existing Edit workflow. No invalid Open Scene link or Reload configuration action is displayed before a Project exists. These lifecycle limits are intentional; this increment does not add separately persisted launch defaults.

New/Edit checks: fresh TypeScript, `project-configurations` and `shadcn-ui-boundary` (three scripts), and whitespace checks passed. Mocked tests execute the New page's actual creation callback and verify Public/Active/Metric payloads, owner-scoped API creation, confirmation/redirect, reset, blank-name rejection, failed-create retention and absence of fabricated Scene content. Existing Edit unified-save, conflict and persistence preservation checks still pass. Visual/authenticated creation and subsequent Scene Save/reopen remain manual. No server/live writes, version/schema/dependency or Git changes were performed; Developer lockfile changes remain untouched.

Files for this follow-up: `src/app/admin/projects/new/page.tsx`, `src/app/admin/projects/[id]/page.tsx`, `src/components/admin/projects/ProjectDetailsFields.tsx`, `ProjectConfigurations.tsx`, and the two existing configuration validation scripts. Manually compare New/Edit at desktop/narrow widths, create a Project through the normal authenticated App, verify submitted flags/units on Edit, then add its module/content and save a Scene before editing saved workspace settings.

October 16 unified-save follow-up: the Developer requested one Save Changes action for Project Details and Configurations. `ProjectConfigurations` now owns one outer form containing both cards and delegates its single submit to the page's `updateProject` callback. That callback sends captured identity/access fields and any changed configuration in one existing PATCH transaction. Identity-only edits omit an empty configuration patch. The separate calibration operation remains explicit because it recalculates marker geographic metadata. One Reset changes action restores both drafts; Reload configuration retains its narrower scope. The page no longer refetches/reset forms after Save: it acknowledges returned values while retaining edits made during the request. Re-entrant saves are guarded. This supersedes the earlier two-save-control description and the earlier identity-only Reset behavior below.

Unified-save checks: fresh TypeScript, `project-configurations` and `shadcn-ui-boundary` (three scripts), and whitespace checks passed. Actual page/component callbacks and mocked PATCH coverage verify one save control, one combined payload, conflict/failure retention, edits during Save, identity-only submission, reset and Project isolation. No new browser/authenticated writes, build, schema/version change or server operation occurred.

October 16 follow-up: Project details/access and the existing calibration form are now visible immediately on Setup, without an Edit Project toggle. The header action is All Projects, linking to `/admin/projects`. Save leaves the form visible; Reset changes restores saved identity/calibration values without hiding it or resetting the separate configuration draft. Existing loading/ownership/save behavior remains. Fresh TypeScript, the two scripts in `project-configurations`, and whitespace checks passed for this follow-up; rendered-browser checks remain manual. The Developer's package-lock changes were preserved.

- Admin Project detail now has **Setup** and **Modules and assets** tabs. Setup retains Project identity/access editing and geographic calibration and adds the shared App-styled Configurations form. Setup stays mounted across tab changes to retain configuration drafts; ordinary module/identity refreshes no longer unmount the entire page. Sequenced Project reads reject obsolete results after a Project switch.
- `src/components/admin/projects/ProjectConfigurations.tsx` exposes Metric/Imperial preference; saved View Mode/camera mode; environment, auto-rotation, grid, orientation gizmo, Simulations visibility, sunlight, extra ground and available saved layers. Calibration scale/origin/heading are displayed with an action opening the existing explicit calibration form. Existing module/asset management remains on its tab.
- Camera positions/targets, named views, DetailsCards/inspectors, Design level, split layout, architecture and Models are retained rather than edited by this form. An Open Project Scene link has no explicit View Mode override. The form edits the existing saved snapshot; no separate launch-defaults contract is introduced.
- Without a valid saved workspace, measurement editing remains available and Scene configuration asks the User to open the Scene and Save Project once. A missing 3D snapshot similarly disables environment editing. No synthetic camera or empty architecture is written to initialize configuration.
- Saves send changed fields only. Pending/failed edits remain in the form; edits made during a pending Save remain dirty. Reload latest requires discard confirmation for a dirty form. Existing Admin-style navigation/unload warnings protect ordinary links and page unload while dirty/busy. Programmatic navigation by unrelated module controls is not covered by that link handler and remains a manual limitation.

### Save and concurrency boundaries

- New `src/libraries/services/project/configuration.ts` validates an allowlisted patch and a stamp containing the loaded saved-workspace timestamp and canonical measurement preference. It reuses `parseThreeDProjectViewState` and rejects invalid values or unsupported writes to camera transforms, ownership, architecture or arbitrary configuration.
- Existing `PATCH /api/project?id=…` applies this patch under an owner-scoped Project row lock, merging changed JSONB keys. Identity fields are written only when supplied, preventing a configuration-only Save from writing stale unrelated identity/access values. The old identity/units/calibration request shapes remain compatible.
- Existing Scene snapshot Save sends the loaded stamp, checks it under the same Project row lock before marker/content writes, and advances its local stamp only after successful Save. Admin edits advance the saved-workspace timestamp; measurement-only changes are detected through the stamp's units field. Conflicts return 409 and retain local edits. No automatic merge/reload of a dirty Scene is attempted; review/export unsaved content before reloading.
- Older clients omitting the optional snapshot stamp retain legacy behavior. This conflict check protects updated clients; it is not a universal cross-version locking guarantee. Geographic calibration remains the existing separate operation and is not newly covered by this settings stamp.
- No schema/migration, new store, new save endpoint, runtime Canvas/physics ownership or geometry change. App-wide styling, account access and device safety retain their existing scope.

### Exact implementation files

- `src/app/admin/projects/[id]/page.tsx`
- `src/components/admin/projects/ProjectConfigurations.tsx` (new)
- `src/libraries/services/project/configuration.ts` (new)
- `src/app/api/project/route.ts`
- `src/app/api/project/threed-markers/route.ts`
- `src/app/dashboard/scene/page.tsx`
- Validation: new `validate-project-configurations-ui.cjs`, extended `validate-project-measurement-units.cjs`, `validate-threed-designs.cjs`, `validate-threed-character-position-save.cjs`, and task registration in `validate.mjs`, all under `src/libraries/scripts/`.

### Verification

- `node src/libraries/scripts/validate.mjs project-configurations threed-designs threed-character-position-save shadcn-ui-boundary` passed all four tasks. API/auth/persistence are mocked. Coverage includes actual Admin PATCH validation/conflicts/failure, preservation of architecture/cameras/presets/cards/unrelated config, actual form pending/failed-edit behavior and cancelled reload, fresh-Project isolation, actual Scene stale-save rollback and existing Project Save/GET/hydration/camera/Character regressions.
- Fresh `tsc --noEmit --incremental false` and `git diff --check` passed. Existing Three CommonJS deprecation output and the deliberately mocked Character failure log are non-failing.
- No browser connector was available; rendered desktop/narrow/light/dark appearance and authenticated Admin-to-Scene persistence remain manual. No full CI/production build was run for this development increment. Prior v0.26.4 release checks are historical evidence for that baseline.
- No live database/storage/device access, real writes, migrations/seeds, local server operations, dependency/version changes, Git writes or deployment.

Manual acceptance: open `/admin/projects/16`, inspect Setup and Modules/Assets, change Grid or Environment and Save configuration, then open the Project Scene and verify appearance plus retained Models/Designs/camera/cards. Check Metric/Imperial changes preserve physical sizes. With a Scene already open, save Admin settings, then attempt Save from the stale Scene: expect a conflict and retained draft. Reload safely after reviewing/exporting unsaved content. Test a fresh Project, failed request, a configuration edit during a slow Save, tab switching, both themes/narrow windows and Project switching.


## v0.26.5 checkpoint preparation

Developer accepted the unified Edit Save and matching New page and requested release preparation October 16. See [release record](../releases/v0.26.5.md) for final checks and remaining manual acceptance. Earlier per-increment version/check exclusions above are historical.

Release validation passed October 16: all 76 offline CI tasks, fresh TypeScript (tsc --noEmit --incremental false), version/Developer-lock preservation and source/config parity checks, checkpoint documentation links, whitespace checks, and guarded production build (145/145 pages, exit 0). The isolated copy reused matching Next.js 16.4.2 dependencies; the Developer installation/server was untouched. No clean install was performed against the edited lockfile. Differences from the reused dependency lock are optional Linux/esbuild and WASI metadata. CI's initial sandbox run hit the known Windows tsx userInfo ENOMEM restriction; the unchanged guarded rerun outside that restriction passed. The build emitted a non-failing nested-lockfile workspace-root warning. No agent browser/authenticated persistence or production check is claimed.

