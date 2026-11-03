# Repository maintenance - October 17, 2026

## Baseline and scope

Inspected clean main at e8c8308927daf4e34639a18432e71cb1f3eb806f, package/root lockfile 0.26.10. Developer-confirmed production is v0.26.10; this local maintenance does not bump the version or establish a new release/deployed commit. No manual working changes were present at inspection.

Authorized stages: restore reproducible CI installation, simplify entry-point documentation while retaining evidence, and make bounded extractions from active components. Preserve behavior, explicit Project Save/load, Developer servers/installation and the manual Git/release boundary.

## Stage 1: CI cause and repair

Read-only GitHub inspection confirmed [validation run 39054616544](https://github.com/marty-mcgee/threed-garden/actions/runs/39054616544) failed on the lockfile integrity check at this baseline. Install succeeded, then npm added optional @emnapi/runtime 1.11.3 (tslib ^2.4.0); TypeScript and CI validation were skipped. The lock references that runtime through @img/sharp-wasm32 0.35.5 but omitted its package entry. A separate successful run at the same commit is not a validation success for this workflow.

Node 24/npm 11.6.2 reconciliation in a copied Linux lock also proposed unrelated optional WASI nesting changes. Those were excluded; only the missing runtime entry from the reconciled lock was adopted. No existing dependency version/range was upgraded. CI now uses npm ci with the declared npm setup and retains git diff --exit-code -- package-lock.json, TypeScript and the CI group.

Clean Linux npm ci passed on isolated Node 24.22.0/npm 11.6.2, with unchanged lock SHA-256 and process.platform=linux. The downloaded Node archive matched its published SHA-256. An initial /tmp toolchain did not persist across WSL invocations and a subsequent attempt resolved Windows npm through inherited PATH; that attempt is not Linux evidence. The passing run used a persistent /var/tmp agent directory and Linux-only PATH. Clean Windows npm ci also passed on Node 24.13.0/npm 11.6.2, installing 740 packages without changing the lock SHA-256. The Developer installation was untouched.

No repaired GitHub run has executed: local results do not prove GitHub Actions green. No workflow rerun, push or deployment was performed.

## Stage 2: documentation responsibilities and history

- Root README is a product introduction, one existing approved screenshot, Demo/Learn/start/docs links, capabilities, setup/checks and architecture/contribution/license/history links. GitHub repository metadata confirms https://threedgarden.com as the homepage; Home contains garden-demo and the Learn route exists. Screenshot records prior local appearance, not current production evidence.
- AGENTS contains durable preferences, ownership, safe validation/database/device boundaries, manual release gates and commands. Enduring runtime, model, Character, Simulation and FarmBot rules embedded in history were carried into active instructions.
- CONTEXT contains current version/production evidence, architecture/source locations, active maintenance, known limitations and pending acceptance. Developer-confirmed v0.26.8 acceptance is retained separately from pending v0.26.9 subset acceptance.
- docs/README routes users/developers/agents to maintained guides. docs/agents retains naming/communication preferences and specialized contracts. docs/releases indexes all existing version records.
- Full original entry-point wording is preserved once in [history snapshots](../releases/history/2026-10-17/README.md), including unique acceptance evidence and superseded statuses. Relative Markdown links were relocated; no original release records were removed or rewritten. Original byte/line counts and SHA-256 are recorded in the history index.

Future version scope, checks and production confirmations belong in the corresponding release file, with only concise current-state updates in CONTEXT. Navigation and durable instructions do not accumulate new release diaries.

| File | Before bytes / lines | After bytes / lines | Preserved record |
| --- | ---: | ---: | --- |
| README.md | 41210 / 299 | 3253 / 48 | [Snapshot](../releases/history/2026-10-17/root--README.md) |
| AGENTS.md | 87115 / 403 | 9223 / 67 | [Snapshot](../releases/history/2026-10-17/AGENTS.md) |
| CONTEXT.md | 214350 / 892 | 6248 / 40 | [Snapshot](../releases/history/2026-10-17/CONTEXT.md) |
| docs/README.md | 26622 / 217 | 2337 / 29 | [Snapshot](../releases/history/2026-10-17/docs--README.md) |
| docs/agents/README.md | 28706 / 143 | 3477 / 32 | [Snapshot](../releases/history/2026-10-17/docs--agents--README.md) |
| docs/releases/README.md | 20447 / 205 | 4584 / 157 | [Snapshot](../releases/history/2026-10-17/docs--releases--README.md) |


## Stage 3: component boundaries

Active call chain: Dashboard Scene page -> UnifiedMapView -> ThreeDScene, with DetailsCard composed by the Dashboard page. This mount chain does not replace the Developer-established App hierarchy ThreeD > Project > Model > DetailsCard.

ThreeDDesign has no application caller; its only non-definition source reference is an existing saved-view validation fixture. The v0.24 retention handoff identifies it as Developer work and explicitly rejects interpreting it as a future renderer. It remains byte-for-byte unchanged. Its duplicated Scene responsibilities are acknowledged, not refactored or deleted.

Extracted from active ThreeDScene into presentation/SceneEnvironment.tsx: procedural grass helper/InteractiveGround, procedural sky, loaded environment background and ShadowLight. Canvas placement, JSX ordering, lighting/shadow values, callback wiring and resource cleanup remain; ground props are now explicitly typed. R3F hooks remain under the existing Canvas. No wrapper/group, key, state owner, subscription or store was added.

Extracted from DetailsCard: FarmBotMqttStatusSummary owns the same scoped read-only live-state hook and presentation, while DetailsCardRow supplies the existing KvRow markup. Parent conditions/callbacks, section context/order, component names and React positions are preserved. Existing specialized editors remain in place; no new FarmBot subscription path was introduced.

The existing actual-resource lifecycle fixture follows the moved declarations and retains abandoned-render, replay, background succession, disposal and installed-Drei transition checks. New CI checks cover documentation paths/anchors, install integrity/runtime entry and scoped FarmBot loading/empty/error/position presentation. Remaining opportunities include camera helpers and selected-asset/animation presentation; these need separate bounded review rather than wholesale runtime extraction.

## Verification

All three local stages are complete. Checks actually run:

- Linux Node 24.22.0/npm 11.6.2: clean npm ci with unchanged lock SHA-256; fresh tsc --noEmit --incremental false; npm run validate -- ci (all 79 tasks passed); guarded npm run build on Next.js 16.4.2 (145/145 pages, exit 0).
- Windows Node 24.13.0/npm 11.6.2: clean npm ci with unchanged lock SHA-256; fresh isolated TypeScript; six affected validation groups passed: repository-maintenance, threed-scene-resources, threed-overlay-layout, threed-farmbot-live-state, threed-farmbot-coordinate-alignment and shadcn-ui-boundary. The focused run used the clean installation outside the known Windows tsx sandbox restriction.
- Documentation check: 294 relative paths/anchors in maintained entry points, the final changed-file inventory/report and history index passed. All links in the six historical snapshots resolve to existing files, and comparison against HEAD confirms original wording is preserved apart from relocated relative link destinations.
- Read-only repository metadata confirmed the public homepage; HTTP HEAD requests to Home and Learn both returned 200. The Demo anchor and Learn route were verified in source. No browser interaction or visual/runtime acceptance is claimed.
- Extraction comparison: all moved function bodies and the parent ThreeDScene/DetailsCard bodies are byte-identical. ThreeDDesign is byte-identical to HEAD. Build-input SHA-256 parity passed for 1483 copied files, excluding Next-generated next-env.d.ts. Later documentation updates were checked separately; a final grass-helper comment relocation changed no executable code. No behavior change followed the passing suite/build.
- Version remains 0.26.10; package.json and authoritative schema are unchanged. Whitespace checks passed. Known non-failing Three CommonJS/Rapier notices appeared in fixtures; the Linux build emitted no warning.

The copies omit all .env files. Windows check environment scrubbed credential-like variables; WSL inheritance had zero credential-like variable names, verified without values. Checks/build used a dummy database URL, offline fonts and a network guard blocking external and port-4444 access. Persistence/device boundaries are mocked. Logs/manifests are under ignored .next/maintenance-tools; isolated Linux files are under /var/tmp/threed-maintenance-*. No live schema inspection or persistence test occurred.

A new GitHub Actions result and manual visual/Save-reopen checks remain unverified. The historical interrupted overlay attempt is not retroactively a pass; the new Linux CI and Windows focused overlay runs passed separately.

## Manual regression and boundaries

1. Open an owned Project in 3D/Design/Combined and review ground, environment/sky changes, shadows, navigation and placement hover/click; switch Projects and check selection/DetailsCard continuity.
2. Expand/collapse DetailsCard sections; review a FarmBot's loading/empty/error/recorded status through existing App behavior. Check Model/Character controls, animations and Take/Release Control.
3. Draw/edit architecture, toggle layers/levels, Save/reopen and inspect named views/overlay positions. New level-subset Save/reopen remains pending until the Developer confirms it.
4. Follow README Demo/Learn and documentation navigation. Review desktop/narrow layouts; no new browser visual/runtime result is implied by mocked checks/builds.

No direct Neon/Postgres connection, live migration/seed/storage/device operation, server start/stop, Git writes or deployment. Changes remain unstaged. Review artifacts are agent-owned under ignored .next/maintenance-tools and isolated Linux /var/tmp; active Developer installation remains untouched.

## Changed files

- [.github/workflows/validation.yml](../../.github/workflows/validation.yml)
- [AGENTS.md](../../AGENTS.md)
- [CONTEXT.md](../../CONTEXT.md)
- [README.md](../../README.md)
- [docs/README.md](../README.md)
- [docs/agents/README.md](../agents/README.md)
- [docs/agents/VALIDATION.md](../agents/VALIDATION.md)
- [docs/developers/LOCAL_DEVELOPMENT.md](../developers/LOCAL_DEVELOPMENT.md)
- [docs/plans/repository-maintenance-2026-10-17.md](repository-maintenance-2026-10-17.md)
- [docs/releases/README.md](../releases/README.md)
- [docs/releases/history/2026-10-17/AGENTS.md](../releases/history/2026-10-17/AGENTS.md)
- [docs/releases/history/2026-10-17/CONTEXT.md](../releases/history/2026-10-17/CONTEXT.md)
- [docs/releases/history/2026-10-17/README.md](../releases/history/2026-10-17/README.md)
- [docs/releases/history/2026-10-17/docs--README.md](../releases/history/2026-10-17/docs--README.md)
- [docs/releases/history/2026-10-17/docs--agents--README.md](../releases/history/2026-10-17/docs--agents--README.md)
- [docs/releases/history/2026-10-17/docs--releases--README.md](../releases/history/2026-10-17/docs--releases--README.md)
- [docs/releases/history/2026-10-17/root--README.md](../releases/history/2026-10-17/root--README.md)
- [package-lock.json](../../package-lock.json)
- [src/components/map/ThreeDScene.tsx](../../src/components/map/ThreeDScene.tsx)
- [src/components/map/details/DetailsCard.tsx](../../src/components/map/details/DetailsCard.tsx)
- [src/components/map/details/DetailsCardRow.tsx](../../src/components/map/details/DetailsCardRow.tsx)
- [src/components/map/details/FarmBotMqttStatusSummary.tsx](../../src/components/map/details/FarmBotMqttStatusSummary.tsx)
- [src/components/map/presentation/SceneEnvironment.tsx](../../src/components/map/presentation/SceneEnvironment.tsx)
- [src/libraries/scripts/validate-farmbot-status-summary.cjs](../../src/libraries/scripts/validate-farmbot-status-summary.cjs)
- [src/libraries/scripts/validate-repository-maintenance.cjs](../../src/libraries/scripts/validate-repository-maintenance.cjs)
- [src/libraries/scripts/validate-threed-scene-resources.cjs](../../src/libraries/scripts/validate-threed-scene-resources.cjs)
- [src/libraries/scripts/validate.mjs](../../src/libraries/scripts/validate.mjs)

## November 3: root file organization

The Developer approved moving business notes and grouping Drizzle configurations to simplify the repository root. This follow-up began on clean `main` / `dd9417254b26a9f165b84fc44486622d5036ebef`, with App/package-lock version **0.31.1**. It does not prepare a new release or establish production acceptance.

- Moved `NOTES.md` unchanged to [docs/business/monetization.md](../business/monetization.md), linked from the documentation index.
- Moved both unchanged Drizzle files to [src/libraries/drizzle/](../../src/libraries/drizzle/). Updated `db:generate`, `db:push` and `db:studio` to use explicit paths; Studio previously depended on root config discovery.
- Preserved credential-free generation, central schema identity, root-relative schema/output/environment paths, process/local/fallback connection precedence and strict push confirmation. The existing workflow check also verifies Studio selects the same configuration as push.
- Updated the README layout and current local-development instructions. Existing historical release records remain unchanged. Root `CONTEXT.md`, shared skills/lock and all other tooling entry points retain their established locations.

The three moved files retain their exact baseline SHA-256 hashes. Package-lock bytes, dependencies and App version are unchanged. Initial validation at the proposed root `config/drizzle/` location passed a new isolated clean installation (522 packages), three focused checks, fresh TypeScript (`--noEmit --incremental false`), all **103 offline CI tasks** and credential-free `npm run db:generate`. Initial source/input parity covered 1,236 source files, 73 tracked public assets and copied package/config/documentation inputs.

Following the Developer's location correction and question about ownership, the final destination is `src/libraries/drizzle/`: CLI configuration sits alongside `schema/`, which retains the App's schema declarations and relationships. Both configs moved unchanged; the newly created empty root `config/` and the intermediate empty `schema/drizzle/` were removed. Commands, current documentation and the README tree now use the final location. Fresh TypeScript and four focused config/schema-explorer/documentation/dependency checks pass, reusing the matching isolated installation. Actual offline generation reports **no schema changes, nothing to migrate**; its existing SQL/snapshot hashes remain unchanged. Final source/input parity covers 1,238 source files (including the two relocated configs), 73 tracked public assets and copied package/config/documentation inputs. The full 103-task suite was not repeated after this path correction; its initial evidence is retained above. No App runtime source change or new production build is part of this organization-only follow-up; live push/Studio behavior is not independently verified.

Initial evidence is retained in ignored `.next/root-organization-tools`; final-path logs and parity evidence are under `.next/schema-drizzle-tools`, using `.next/root-organization-validation`. No environment files are copied; credentials are scrubbed and live network/database/port-4444 access is guarded. No Studio/server, push, live operation, Git write or deployment is performed. All changes remain unstaged.

The Developer subsequently accepted the final structure and authorized [v0.31.2 release preparation](../releases/v0.31.2.md). Its version metadata, release gates and deployment status belong to that record; the unchanged-version and no-build statements above describe the earlier implementation checkpoint.

## November 3: GitHub Pages cleanup

The Developer requested investigation, stopping Pages publishing and cleanup of old deployment records. This follow-up began on clean `main` / `46c6b32c3a36a7ab0298570e02846d00eacda530`, with App/package-lock version **0.31.2**.

Read-only GitHub API inspection found legacy Pages publishing from `main:/docs` to `https://marty-mcgee.github.io/threed-garden/`, with no custom domain. GitHub's managed `dynamic/pages/pages-build-deployment` workflow created these records; the latest Pages build succeeded. The separate Vercel Production deployment and repository validation run also reported success. The tracked validation workflow does not deploy Pages.

Archived **477 Pages deployment records**, dating from December 9, 2020 through November 3, 2026, plus their available status histories and Pages configuration. Initial latest-status counts were 289 inactive, 184 successful and four errors. Disabled Pages publishing, marked non-inactive Pages records inactive with `autoInactive: false`, and removed only the archived `github-pages` deployment IDs. One HTTP 502 interrupted a batch after two deletions had taken effect; read-only ID reconciliation recovered those receipts before the journaled cleanup resumed.

After all records were removed, rechecked that the remaining `github-pages` environment had zero deployments, secrets, variables and protection rules, then removed that empty environment. Final API verification confirms Pages returns 404, repository `has_pages` is false, no Pages deployments remain and its environment returns 404. `Production`, `Production – threed-garden` and `Preview – threed-garden` remain present. The existing Vercel Production status remains successful; [repository validation run 41667148856](https://github.com/marty-mcgee/threed-garden/actions/runs/41667148856) passed. These are provider/API observations, not a new authenticated App smoke check.

Preserve the ignored archive at `reference/operations/github-pages-cleanup-2026-11-03/`, including original records/statuses, settings, mutation receipts, 502 reconciliation, final verification and SHA-256 integrity manifest. Execution helpers and initial evidence remain under ignored `.next/github-pages-cleanup-2026-11-03/`. Do not rerun completed mutations. GitHub deployment IDs and original timestamps cannot be restored exactly from the archive.

No Vercel deployment, repository validation configuration, App source, package metadata, dependency, database, server, Git commit/push or publication was changed. Historical Actions run logs remain. Only the deployment guide, this maintenance record and current context are updated locally and left unstaged; documentation paths and whitespace checks pass.
