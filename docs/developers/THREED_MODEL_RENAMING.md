# Renaming Models

The reusable [planner](../../src/libraries/scripts/plan-model-renaming.ts) offers explicit rules through the [core helper](../../src/libraries/scripts/model-renaming-core.ts):

| Rule | Scope | Example |
| --- | --- | --- |
| obj-design | Selected primary File is OBJ | armchair2 to Design: Armchair 2 |
| obj-design-title | Existing Design: name and selected primary File is OBJ | Design: TV shelf unit to Design: TV Shelf Unit |
| sm-synty | Name starts with uppercase SM token | SM Prop Chair 01 to Synty: Prop Chair 01 |

The existing [OBJ Design workflow](THREED_OBJ_MODEL_NAMES.md) remains available unchanged. Synty replacement preserves the remainder's case, wording, numbers and punctuation. A space, underscore or colon separates the leading SM token; those separator characters are replaced by one colon and space. Internal SM, lowercase sm, Small, SMITH and already-prefixed Synty names are untouched. Source filenames and saved Project instance labels are separate and are not renamed.

## Preview and apply

Use a fresh full owner-scoped snapshot with ownerId and models containing id, modelName, modelType, mainModelFileId and primaryFileName:

```powershell
node src/libraries/scripts/plan-model-renaming.ts --rule sm-synty --snapshot <snapshot.json> --out <new-plan.json>
```

The planner creates exclusive local JSON and Markdown reports with original names. It performs no network requests or writes to the App. Choose obj-design explicitly for the prior rule; rules are never combined implicitly.

For an authorized apply, use applySyntyModelNames(plan, request, journal) inside the existing signed-in Admin browser. The helper verifies deterministic plan contents, ownership, primary File identity, current names, 255-character limits and collisions. Every changed Model must have an identifiable saved primary File. Preflight completes before writes; each name-only PATCH requires a durable pending journal acknowledgment and read-back verification. Uncertain writes stop for review, with no automatic retry. New plans omit already-renamed Synty rows; old reviewed plans skip rows already at their expected result. The existing API has no atomic name revision stamp: avoid concurrent editing during application.

Only threed_models.model_name (API modelName) and its normal updated timestamp change. IDs, primary selections, Files, images, Categories, materials, metadata and visibility flags are preserved. No schema or additional persisted naming contract is introduced.

Offline checks: npm run validate -- model-renaming obj-model-names. These use mocked requests; live receipts and rendered-page acceptance remain separate.

## October 21, 2026 Synty pass

Fresh inventory: 1,026 owned Models; 681 leading-SM names selected, with no new collisions. Private snapshots, reviewed plan and durable execution receipt are retained in reference/imports/model-renaming-synty-2026-10-21. Do not replay a completed receipt. Execution is complete: all 681 names were saved and verified through authenticated Admin CRUD. The 345 non-target Models retained names and timestamps. Full before/after comparison preserved 2,668 File records, all Model Category assignments, all 71 Category definitions and all other protected Model fields. Target rows changed only modelName and their normal updated timestamp. No newly introduced duplicate-name group was found. Preserve snapshot.json, rename-plan-reviewed.json/md, apply-before-models.json, apply-before-categories.json, execution.json and verification.json; do not replay this completed batch.

Fresh targeted strict TypeScript compilation and focused model-renaming, obj-model-names and repository-maintenance checks passed. Requests in automated checks were mocked; saved-record verification was a separate authorized live operation. No full App CI/build or rendered-page/production acceptance is claimed. No version, schema, storage upload, server operation, Git write or deployment change.

## October 22, 2026 Title Case correction

Developer explicitly limited this correction to the Design: OBJ Models previously formatted in sentence case. The obj-design-title rule capitalizes each existing word, preserving current acronyms, internal case, apostrophes, punctuation, whitespace and numbers. It preserves the Design: prefix and does not apply the sentence-case rule or change Synty/unprefixed/non-OBJ Models. Examples: Design: Table with tablecloth becomes Design: Table With Tablecloth; Design: TV shelf unit becomes Design: TV Shelf Unit.

The [Title Case helper](../../src/libraries/scripts/obj-model-title-names-core.ts) uses the existing owner/primary/stale-name/collision/journal checks. It is available through the master planner with --rule obj-design-title. The prior obj-design sentence-case rule and completed receipts remain historical and unchanged; do not replay them to revert the correction.

Fresh owner inventory contains 1,026 Models: 284 Design OBJ Models, of which 189 require Title Case changes and 95 already match. No new collision; four pre-existing duplicate groups are retained. Private snapshots, reviewed plan and new execution receipt are under reference/imports/obj-title-names-2026-10-22. Execution completed through authenticated Admin CRUD: 189 names updated and verified, 95 Design OBJ names already correct. Across all 1,026 Models, the 837 non-target names and timestamps, all 2,668 File records, all 71 Category definitions, Model Category selections, primary selections, metadata and other protected fields were preserved. Four existing duplicate-name groups were retained. Preserve the new execution.json and verification.json alongside before snapshots and rename-plan-reviewed.json/md; do not replay the completed apply.

Focused model-renaming/obj-model-names checks and fresh targeted strict TypeScript passed with mocked request boundaries. Saved-record verification is separate authorized live evidence. No direct SQL, schema change, storage upload, package/version change, App renderer change, server operation, Git write or deployment was performed; full App CI/build and rendered-page acceptance are not newly claimed.
