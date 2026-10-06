# ThreeD Simulations: execution and result analysis

Current App documentation checkpoint: **[v0.23.0 — ThreeD Garden](../releases/v0.23.0.md)**. Older checkpoint sections are historical; the linked record distinguishes package, deployment and validation status.

**Developer correction, October 5, 2026:** a Scenario is a plan (**Open Scenario**); a Simulation executes Actions and collects Results (**Run Simulation**). [Production v0.22.28](../releases/v0.22.28.md), Developer-confirmed October 5, removes all Scenario schema/form/API/runtime dependencies. The Developer also confirmed independent definitions with Project/modules chosen when running; that broader refactor remains pending. Follow [the corrected architecture and implementation record](../plans/v0.22.28-independent-simulations.md). Supplied CLI output confirms native `db:push` applied the Scenario removal; [the release handoff](../plans/v0.22.28-release-handoff.md) distinguishes database evidence, prior local validation and pending detailed browser/live acceptance.

The [v0.22.26 Soccer milestone](../plans/v0.22.26-soccer-scenario-simulation.md) uses existing Character navigation and contact-kick owners. [v0.22.27](../plans/v0.22.27-simulation-results-preparation.md) adds Drizzle-backed result capture, guided preparation and selected Sensor measurements. The [v0.22.28 checkpoint](../plans/v0.22.28-scene-simulation-launch.md) adds one-click preparation and local public visitor runs. General Action executors and physical devices remain outside this implementation.

## Admin preview (local v0.22.29)

The shared Add/Edit/View editor hosts `SimulationPreview.tsx`, with a dynamically loaded `SimulationPreviewCanvas.tsx`. The existing private options endpoint exposes a bounded saved-pose/source projection; it keeps exact owner/Project/module predicates and excludes raw marker data/metadata. Preview loading uses exact existing Character/Model/assignment reads, four workers and per-request deduplication. Aborted/context-stale replies are ignored. Project-instance Model overrides inherit from that actual Model rather than another Character default.

Garden's opt-in `previewMode`/`previewActions` path reuses assigned/inherited/legacy clip loading and semantic mapping, without Scene registration, movement or world tasks. A local one-shot helper completes only the requested mixer action. The timeline snapshots Action order, advances by correlated completion and cancels on Stop, edit, busy/context change or unmount. `runToTarget` previews Run; `kickBall` resolves an active existing foot-kick slot. Other definition Actions can preview their mapped animations even when the Project runner has no world executor for them. Clip durations come from loaded animations; definition timeouts remain bounds. No Results/Sensor or Project write endpoint is involved. Full runtime outcomes remain the responsibility of Run Simulation.

The Animation/Action selector lists compatible loaded mappings/clips and links to existing library/assignment pages. It does not seed duplicate records or expand definitions to arbitrary animations. Non-Model target modules use explicit position markers. Camera-only Fit/Reset retains the preview Canvas. The maintained `threed-simulation-admin` task now includes private projections, loading/source isolation, actual mixer/camera callbacks and timeline lifecycle fixtures. See [scope, validation and pending browser checks](../plans/v0.22.29-simulation-admin-preview.md).

## Project Scene launch

`ProjectSimulationLauncher.tsx` mounts above the persistent Scene, separately from Scenario instructions. It selects a single choice automatically, requires selection when several exist, and reads the saved definition only on an explicit click. `simulationLaunchParticipants` identifies exact visible saved instances; the page updates existing Character control/target state without opening or changing a Scenario. A bounded 20-second preparation waits for settled physics and loaded kick availability. It never repositions participants, saves the Project, resets counters or runs on restoration.

`GET /api/project/simulations?projectId=<id>&offset=0` returns at most 25 `{id,name}` choices and a total. Adding `id=<simulationId>` returns the bounded supported definition and required kick mappings. Reads use the existing public/owner Project policy, active owner/module joins, active Project asset assignments and exact saved marker membership. No Scenario query, field or setup is involved. The projection excludes owner IDs, private metadata, animation file URLs and results. Kick mappings are restricted to the selected Character's own/inherited assignment keys, with active owner slots. CRUD and result APIs remain private.

**Open Scenario** and **Run Simulation** are separate controls. Refresh clears stale Simulation selection and never dispatches Actions. Disabled readiness/editing/choice states explain their cause; preflight and result errors propagate outside collapsed details. Opening/changing a Scenario does not filter choices or cancel a run. Current Project/module bindings still await the independent-definition refactor.

The Developer authorized public visitor runs to stay local. `saveSimulationResults` is derived from the loaded Project's edit capability, independently from launch read access. Both modes reuse `ProjectSimulationControls` and the same `SoccerSimulationRunner`. Owner execution retains private revision/reference preflight and capture-before-dispatch; visitors recheck the projected Project launch record, then collect only transient browser outcomes/observations. Neither visitor completion nor Stop invokes result capture/finalization. Result history remains owner-only. A published Project exposes its active linked supported Soccer Simulations through this endpoint, without cross-Project use or general Action execution.

Preparation and execution retain duplicate-click locks, aborts and scope cleanup. Stop, manual input, unavailable/hidden participants and stale responses cannot resume a request. A changed saved revision or kick mapping requires another review/click. Details remain mounted when collapsed so their runner and cleanup lifecycle persist.

## Definitions, attempts and observations

`threed_simulations` currently contains Project/module-bound definitions with revision-aware CRUD; those bindings are transitional. It has no Scenario column, foreign key, index or relation. Saving or restoring one never starts it. The Soccer runner supports `runToTarget` and `kickBall`; the same saved movable Character/ball must participate throughout. It subscribes before dispatch, requires correlated arrival before kicking and accepts completion only from the exact ball's applied contact result. Interrupted approaches always stop. Readiness checks requested observation groups/Sensors, without requiring a field plan or two goal counters.

`threed_simulation_results` contains one captured attempt per owner/run UUID. The authoritative Drizzle object is `threedSimulationResults` in `src/libraries/schema/threed/index.ts`. Use `npm run db:generate`, then `npm run db:push` through the configured `DATABASE_URL` before result-backed Scene runs. This Developer-requested npm workflow replaces the earlier manual SQL Editor recommendation; see [database commands](LOCAL_DEVELOPMENT.md#database-schema-commands). The targeted [Drizzle-generated SQL](../releases/sql/v0.22.27-threed-simulation-results.sql) remains a review reference. Native push compares the actual database with the App schema rather than executing that file. Do not rerun v0.22.25 SQL.

| Field | Meaning |
| --- | --- |
| `user_id`, `project_id`, `threed_id` | Private immutable ownership/context; owner or Project/module deletion cascades records |
| `simulation_id` | Nullable current definition link; definition deletion sets null, retaining historical snapshot |
| `run_id`, `simulation_revision` | Idempotent attempt UUID and captured saved revision |
| `snapshot` | Server-read Simulation ID/name/revision, Project/module names and definition; historical JSON remains untouched |
| `status` | `running`, `completed`, `failed`, `cancelled`, `timed-out` |
| `report` | Terminal browser-scene report with outcomes and selected Sensor readings; null while unfinished |
| `client_started_at`, `client_ended_at` | Browser epoch timestamps stored as timestamptz; not trusted server execution timestamps |
| `created_at`, `updated_at` | Server capture/finalization timestamps |

Reports are observations from an authenticated browser, not independent server certification. A successful contact kick does not imply a goal. Counters remain shared with other Scene activity. Events cover the run window, are capped and can be rate-limited upstream. Groups contain totals and individual `{ownerMarkerId,id,name,behavior,baseline,final}` readings; a counter decrease flags reset. Trigger sensors have zero counter readings and contribute to group event totals. There is no raw event stream or causal attribution in this version.

## Private API

All requests use the current authenticated owner and return `private, no-store`. Capture validates owned Project/module membership and locks the saved definition revision. Finalization locks the captured row and validates its report against that immutable snapshot. Bodies reject unknown fields and exceed neither the definition's 64 KiB bound nor the result's 256 KiB bound.

| Request | Contract |
| --- | --- |
| `POST /api/threed/simulation-results` | `{simulationId, revision, runId, clientStartedAt}`; server captures before dispatch; no client-authored snapshot |
| `PATCH /api/threed/simulation-results` | `{runId, report}`; finalize once; identical retry accepted, replacement rejected |
| `GET /api/threed/simulation-results?runId=<uuid>` | Exact full owner-scoped snapshot/report |
| `GET /api/threed/simulation-results?projectId=<id>&status=completed&limit=25&offset=0` | Summary list and total; optional `simulationId`; maximum page 100; no full JSON in summaries |

`report` is `{version:1,source:'browser-scene',phase,clientStartedAt,clientEndedAt,outcomes,observations,reason?}`. Outcomes are an ordered prefix of saved steps and retain `stepId`, Action, request UUID, start/end, status and optional reason. Completed reports require all steps completed. Other terminal reports may have no outcomes if cancelled/failed after capture but before dispatch.

Specific Sensor selections use `{ownerMarkerId,id}` references within a selected group. Omitted selections mean the whole group, preserving existing definitions. The definition allows 32 groups, up to 32 references per group and 128 selected references total. Reports contain at most 50 outcomes, 128 individual Sensor readings and 256 total events; larger whole groups report truncated individual readings while retaining their aggregate count.

## Retry and interrupted sessions

The client journal uses the same run UUID for every retry. A failed capture blocks movement. A lost capture response is resolved by idempotently capturing that UUID and finalizing a failed/cancelled attempt; it never resumes execution. Failed final saves retain their exact payload in a bounded page-session queue and display Retry. Retrying never invokes an Action. No final report can replace a different already-finalized report.

Stop, normal scope cleanup and pagehide attempt terminal reporting. Hard closes, crashes or prolonged disconnection can leave `running` records with null reports. Treat them as **unfinished reporting**, not evidence of ongoing execution or success. The page-session queue is lost on hard refresh; no background worker reconstructs missing outcomes. Server receipt time and browser timing must be distinguished in analysis.

## Read-only analysis examples

Run these only against the intended database with an authorized owner UUID substituted for `<owner-user-id>`. Summary APIs are preferable for application lists.

```sql
SELECT id, run_id, snapshot->>'name' AS simulation,
       simulation_revision, status, client_started_at, client_ended_at
FROM threed_simulation_results
WHERE user_id = '<owner-user-id>'
ORDER BY id DESC
LIMIT 100;
```

```sql
SELECT r.run_id, outcome->>'stepId' AS step,
       outcome->>'action' AS action, outcome->>'status' AS status,
       (outcome->>'endedAt')::bigint - (outcome->>'startedAt')::bigint AS duration_ms
FROM threed_simulation_results AS r
CROSS JOIN LATERAL jsonb_array_elements(r.report->'outcomes') AS outcome
WHERE r.user_id = '<owner-user-id>' AND r.status <> 'running';
```

Use `snapshot.simulationId` when the current definition foreign key has been unlinked by deletion. Group/Sensor readings live in `report.observations`; inspect truncation/reset flags before comparing runs. Historical snapshots do not change with later definition edits. Older snapshots may retain historical Scenario JSON, but current schema/capture does not link to Scenarios. These SQL examples were not executed against a live database.

See [user preparation](../help/threed-simulations.md), [local evidence and pending acceptance](../plans/v0.22.27-simulation-results-preparation.md) and [agent validation](../agents/VALIDATION.md). No cross-Project sharing, general metadata collector, automatic Project save, physical-device command or dependency upgrade is included.
