# OBJ Model names: Design prefix and sentence case

Developer specified `Design: ` followed by the existing imported Model name in sentence case, scoped to OBJ-based Models. The actual schema field is `threed_models.model_name`, exposed as `modelName` in the existing Admin API. The formatting rule does not add an attribution suffix.

Examples:

| Before | After |
| --- | --- |
| armchair2 | Design: Armchair 2 |
| tableWithTablecloth | Design: Table with tablecloth |
| Couch: Large 1 | Design: Couch: large 1 |
| tvShelfUnit | Design: TV shelf unit |

## Script and boundaries

[Planner](../../src/libraries/scripts/plan-obj-model-names.ts) · [formatter and Admin executor](../../src/libraries/scripts/obj-model-names-core.ts) · [offline checks](../../src/libraries/scripts/validate-obj-model-names.cjs)

The formatter retains words, punctuation and numeric variants, separates camelCase, underscores and letter/number boundaries, and uses sentence case with common technical abbreviations preserved. It removes repeated leading Design prefixes before applying exactly one. The 255-character schema limit is enforced rather than silently truncating names. It does not translate words, replace Model names with Category labels, rename Files or change licensing/author metadata.

Eligibility uses the selected primary File's `.obj` extension, case-insensitively, with exact File ID/name checks before writes. Other file formats and Models without an OBJ primary are excluded. New name collisions block application; already-existing duplicate-name groups are retained as separate records with stable IDs, not merged or arbitrarily numbered.

To generate a new preview from an owner-scoped snapshot:

```powershell
node --experimental-strip-types src/libraries/scripts/plan-obj-model-names.ts --snapshot reference/imports/obj-model-names-2026-10-21/snapshot.json --out reference/imports/obj-model-names-2026-10-21/new-review.json
```

The snapshot contains ownerId and models with id, modelName, modelType, mainModelFileId and primaryFileName. Include the full owner Model inventory for collision checking. The CLI only writes new local JSON/Markdown reports and refuses to overwrite existing files. Original names are retained verbatim in the report's `before` values and before snapshots; no extra original-name database field was introduced.

The core exports `applyObjModelNames(plan, request, journal)` for use in the existing signed-in same-origin Admin browser. It validates the deterministic plan, owner, primary File identity and current name, preflights every change, and submits only `{ modelName }` to PATCH `/api/threed/models?id=<id>`. Every write requires a durable pending journal acknowledgment and saved-name read-back; failures stop without automatic retry. Inspect any uncertain receipt before resuming. Correctly formatted names are skipped on repeat runs. Direct database access, credentials/environment-file exports and new servers are unnecessary.

Saved Project instance labels are a separate owner and are not rewritten. Model IDs, File URLs and Project references remain stable. The GET/check/PATCH API has no atomic name revision stamp, so a concurrent rename between the last read and PATCH remains a limitation; avoid overlapping edits when applying a future plan.

## Completed authorized execution — October 21, 2026

Fresh owner-scoped App reads found 1,026 Models, including 284 with selected OBJ primary Files. Four duplicate-name groups existed before formatting (Internal Door Open, Tree 1 w Leaves, Tree Willow No Leaves and Window 2x3); those separate records were retained. No newly introduced collision was present in the reviewed plan.

All 284 name changes were applied through the existing authenticated Admin API and verified afterward. All 742 non-target Models retained their names and updated timestamps. Full read-back comparison preserved all 71 Category definitions, all Model Category selections, all 2,668 File records, primary selections, metadata/material assignments, images, flags and other protected fields. Target Models changed only modelName and the normal updated timestamp. No Files, attachments or storage objects were renamed/uploaded, and no Project instance data was changed.

Private evidence is retained under `reference/imports/obj-model-names-2026-10-21`: snapshot.json, rename-plan-reviewed.json/md, before-models.json, apply-before-models.json, apply-before-categories.json, execution.json and verification.json. `rename-plan-reviewed.json` supersedes the initial collision-reporting draft; the initial draft remains untouched. execution.json is complete: do not replay the apply runner. The original imported wording/names and original OBJ/MTL filenames remain traceable in those records and the unchanged File records.

Verification: fresh targeted strict TypeScript compilation passed; `npm run validate -- obj-model-names` passed mocked formatting, scope, acronym/punctuation/numeric handling, duplicate/length, owner/stale-plan and journal/name-only-write checks. Live execution independently verified the saved records. No full App CI/build, rendered-page acceptance, schema change, package version change, server start/stop, Git write or deployment is claimed.

The reusable [Renaming Models helper](THREED_MODEL_RENAMING.md) also exposes this rule as obj-design and provides the separate leading-SM to Synty rule. Completed OBJ receipts remain historical and must not be replayed.

On October 22, 2026, the Developer replaced sentence case with Title Case for the existing Design: OBJ Models. See the [Title Case correction](THREED_MODEL_RENAMING.md#october-22-2026-title-case-correction). The sentence-case execution above is historical; preserve its original receipts and do not replay it over the corrected names.
