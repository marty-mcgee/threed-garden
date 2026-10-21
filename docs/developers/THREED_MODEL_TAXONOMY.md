# Model Category enrichment script

## Purpose and current review plan

The [planner](../../src/libraries/scripts/plan-model-taxonomy.ts) proposes functional Categories and additional Model assignments using the existing ThreeD schema:

- `threed_model_categories`: owner-scoped Categories, `parent_id` hierarchy, active state and Sort Order.
- `threed_model_category_assignments`: owner-scoped Model/Category relationships.
- `threed_models`: existing Model IDs and the normal category-only Admin PATCH operation.

No schema changes or new persistence contract are required. Initial generation was review-only. The Developer subsequently approved application; the completed Admin execution is recorded below.

October 21, 2026: an authenticated read-only Admin snapshot found 1,026 owned Models and 21 Categories. Existing roots are ThreeDs (#40) and Polygons (#6). The snapshot includes only owner identity, Category fields, Model names/types, primary filenames, legacy asset names and assigned Category IDs; it contains no session credentials or file URLs.

The generated review plan proposes **50 additional Category nodes**, classifications for **771 Models**, and manual review for **255 Models**. All Model approval flags are false. These are name-based suggestions, not visual or semantic acceptance. The existing hierarchies, manual labels, parent relationships, Sort Order and assignments remain intact.

Private snapshot and full per-Model review files:

- `reference/imports/model-taxonomy-2026-10-21/snapshot.json`
- `reference/imports/model-taxonomy-2026-10-21/review-plan.json`
- `reference/imports/model-taxonomy-2026-10-21/review-plan.json.md`

The earlier `plan.json` is an initial draft; use `review-plan.json` for the current rules. Original snapshots/plans are preserved, not overwritten. The source capture helper is retained privately beside them and performs only authenticated App reads.

## Proposed hierarchy

New functional branches live under the existing ThreeDs root. An existing Category at the same full path is reused, including ThreeDs and its Vehicles branch. Existing Polygons Categories are preserved; they are not moved into another tree. Matching is by full path rather than leaf name because names such as Vehicles already occur in different branches.

| Branch | Proposed examples |
| --- | --- |
| Architecture | Buildings; Building Parts; Doors; Windows; Stairs and Railings; Fences and Gates; Outdoor Structures |
| Furniture | Seating; Tables and Desks; Beds; Storage |
| Appliances | Kitchen Appliances; Laundry and Climate |
| Plumbing | Bathroom Fixtures |
| Lighting | Lamps and Fixtures |
| Decor | Mirrors and Artwork; Textiles; Household Accessories |
| Electronics | Computers and Displays; Audio Equipment |
| Nature | Trees; Plants and Flowers; Rocks; Water; Terrain and Roads |
| Farming | Crops and Produce; Equipment and Supplies |
| Tools | Hand Tools |
| Storage and Supplies | Containers |
| Animals | Animals |
| People | Characters; Character Attachments |
| Vehicles | Farm Vehicles; Road Vehicles |
| Sports and Recreation | Sports and Games; Musical Instruments |

Rules are editable in [model-taxonomy-rules.ts](../../src/libraries/scripts/model-taxonomy-rules.ts). CamelCase, separators and numeric export suffixes are normalized. Explicit rules examine Model name, legacy asset name and primary filename. More specific rules take precedence; equal-ranked conflicting matches, FX/helper assets and unknown names stay for manual review. No generic catch-all assignment is made. File extension alone never determines a semantic Category.

## Generate a review plan

From the repository root using Node 24:

```powershell
node --experimental-strip-types src/libraries/scripts/plan-model-taxonomy.ts --snapshot reference/imports/model-taxonomy-2026-10-21/snapshot.json --out reference/imports/model-taxonomy-2026-10-21/new-review-plan.json
```

Planning is offline and writes only new local JSON/Markdown reports. Existing output files are never overwritten. The source snapshot must come from the relevant owner's current authenticated Admin reads; repeat separately per owner rather than treating one account's Categories as global data.

Review the complete paths and each Model ID/name. To correct a suggested classification, edit the rules and regenerate. Only reviewed Model rows should have `approved: true`; every row starts false. Changes to other plan content are rejected by the executor's deterministic regeneration check.

## Apply after review

The pure [core module](../../src/libraries/scripts/model-taxonomy-core.ts) exports `applyModelTaxonomy(plan, request, journal)`. The CLI deliberately has no live apply switch or direct database connection. Application uses the existing signed-in same-origin Admin browser workflow, passing browser fetch and a durable journal callback. No cookie, token, credential or environment-file export is needed. Codex can bundle the core for that browser and execute the reviewed plan through these existing endpoints:

- GET `/api/auth/session`: enforce snapshot owner.
- GET/POST `/api/threed/model-categories`: reuse existing paths/slugs and create approved missing parents before children.
- GET/PATCH `/api/threed/models?id=<id>`: submit only `categoryIds`, merging existing assignments with the approved path.

The journal callback must durably save every pending/verified/needs-review event outside the browser. Before resuming a partial run, inspect pending/uncertain events and read actual state; never automatically replay an uncertain POST. The executor stops on the first error and does not retry requests. Category creation and assignment are separate normal Admin transactions, not one transaction across the whole batch.

All approved Models are checked before the first write and again before assignment. Existing category names/parents/order/state, Model owner/name/type/primary filename/provenance and assignment changes are guarded. Existing valid assignments are retained. Inactive Categories, broken hierarchy, duplicate sibling names/slugs, slug conflicts and the 50-assignment limit require review. New nodes are active, with deterministic sibling Sort Order increments of 100; existing order is unchanged. Model primary Files, materials, images, flags, metadata, Projects and placed instances are not patched by this script.

Parent paths are explicitly assigned alongside leaves because current Model Library/Admin filtering uses direct Category membership. This preserves filtering by both a broad parent and a specific leaf without changing query semantics. Existing forms read Categories from the same owner-scoped endpoint, and Library collections derive counts from associated Categories; fresh reads after application can expose the additions. Hierarchy labels in flat controls may still share leaf names across branches, so review full paths. Project Assets does not currently provide a Model Category taxonomy control; this script does not add that UI or rewrite saved Project instances. That presentation improvement is a separate follow-up.

The normal GET-then-PATCH API has no atomic Category revision stamp: concurrent edits between the final read and PATCH remain a live limitation. Apply during a quiet editing window. Owner checks and fresh reads reduce stale writes; offline tests do not prove database concurrency behavior.

## Verification

```powershell
npm run validate -- model-taxonomy
```

Mocked Admin tests cover hierarchy creation, ancestor assignment, preservation of manual assignments, owner mismatch, stale taxonomy/Model assignments, ambiguous names, FX exclusions, cycles/inactive Categories, approval/tamper checks, repeated-run idempotence and write-ahead journal/error behavior. Fresh targeted strict TypeScript compilation of the planner/core/rules passed using the App's library targets. Those offline results apply to script generation; the later authorized live Admin application is recorded below. No full App CI/build, browser visual acceptance or release is claimed.

## Completed approved application ? October 21, 2026

Developer approved the reviewed plan with ?PERFECT. Please implement.? The 771 classified rows were copied into approved-plan.json with approval enabled; all 255 unclassified rows remained unapproved. The original review JSON/Markdown remains unchanged as historical evidence.

Execution used the existing separate signed-in Admin browser and canonical Category POST/Model category-only PATCH endpoints. A fresh before snapshot and complete 771-Model identity/assignment preflight preceded writes. Each write had a durably acknowledged pending journal event and a verified result. No credentials were extracted; no direct database connection or schema change was used.

| Verified outcome | Count |
| --- | ---: |
| Categories created | 50 |
| Categories now available | 71 |
| Original Category records unchanged | 21 |
| Models updated | 771 |
| Unapproved Models unchanged | 255 |
| Additional Model/Category relationships | 1,551 |
| Prior Model/Category relationships retained | 2,240 |
| Existing Model Files preserved | 2,668 |

The Model count remains 1,026. Protected Model fields, primary Files, metadata/material assignments, images, flags and original File records were compared against the before snapshot. Only Category selections and the normal updated timestamp changed on approved Models; unapproved Models retained their original timestamp and selections. Existing Category IDs, names, parents, Sort Order, state and timestamps were unchanged. The standard Admin transaction recreates junction rows when saving Categories, so relationship preservation means the same Model/Category associations, not immutable junction-row IDs.

Six actual Admin and Library Category queries matched the saved assignments: ThreeDs (#40), Furniture (#48), Seating (#78), Nature (#62), Trees (#118) and Architecture (#44). Examples: Furniture has 82 owned/82 Library Models; Seating 33/33; Nature 333/217; Trees 107/72. Library counts retain existing availability rules; no Model was activated or published by this operation. These are live API results, not new rendered-page acceptance. Project Assets taxonomy controls remain a separate UI follow-up.

Private evidence is retained under reference/imports/model-taxonomy-2026-10-21: approved-plan.json, execution.json, before-models.json, before-categories.json, verification.json, query-verification.json and implementation-summary.md. The summary lists every new/reused Category path and its actual App ID. execution.json is complete; do not replay apply or create duplicate Categories. Local servers and active dependencies were untouched; no staging, commit, push or deployment occurred.

## Completed full replacement ? October 21, 2026

After accepting the additive pass, the Developer requested reassignment of all available Models and explicitly selected ?Replace existing selections with the new hierarchy.? This authorizes removal of old Model/Category selections and supersedes the earlier requirement to retain them for this pass. Existing Category definitions were not deleted, renamed or reparented.

A fresh owner-scoped snapshot contained 1,026 Models and 71 Categories. The previously reviewed 771 classifications were retained as canonical paths. Remaining assets were reviewed using names/source filenames, procedural metadata and local thumbnails where necessary. FarmBot Models/parts use the existing ThreeDs > FarmBots branch; Shapes and Maps reuse their existing ThreeDs branches. Broad existing parents were used when no accurate leaf exists; no additional Category nodes were invented. replacement-plan-v2.json/md contains every exact Model ID and target path. The unexecuted earlier draft is preserved but superseded.

The existing Admin bulk Category Replace implementation performed category-only PATCH requests through the signed-in browser, with two bounded workers, stale-selection checks and durably acknowledged per-write journals. No uncertain request was retried.

| Final verified result | Count |
| --- | ---: |
| Models matching their canonical path | 1,026 |
| Model records updated | 777 |
| Already canonical; not patched | 249 |
| Old relationships removed | 1,228 |
| Relationships added | 413 |
| Current relationships | 2,976 |
| Category definitions retained unchanged | 71 |
| Model File records retained unchanged | 2,668 |

All protected Model fields, primary Files, source metadata/material assignments, images and availability flags were verified unchanged against the fresh before snapshot. The 249 unpatched Models retained their updated timestamp. All Models have the ThreeDs root and only their selected ancestor/leaf path; old Polygons selections are gone. The Category records, including unused Polygons branches, remain available for later explicit maintenance.

Six Models have only the broad ThreeDs (#40) assignment because the current hierarchy has no accurate narrower Category: #1717 FX Sphere, #1719 FX SprayerLocation, #1721 FX Wheat Location, #1819 Synty: Prop Arrow 01, #1871 Synty: Prop Skull 01 and #1807 Synty: Wep Shotgun 01. They are categorized, but finer classification remains a documented follow-up.

Seven live Admin/Library query checks passed. ThreeDs returns 1,026 owned/864 Library Models; Furniture 89/88; Seating 36/36; Nature 350/229; Trees 107/72; Architecture 162/141; Polygons 0/0. Counts differ according to the existing Library eligibility rules; this pass did not change those rules or publish/activate Models. Actual rendered-page acceptance remains separate.

Private evidence: reference/imports/model-taxonomy-reassignment-2026-10-21 contains capture snapshots, replacement-plan-v2.json/md, apply-before-models.json, apply-before-categories.json, execution.json, verification.json, query-verification.json and implementation-summary.md. execution.json is complete; do not replay the replacement. No direct database connection, schema change, server start/stop, physical command, staging/commit/push or deployment occurred.

The three Synty labels above reflect the subsequent [Model renaming pass](THREED_MODEL_RENAMING.md); taxonomy receipts retain their original SM names and stable IDs.
