# App schema audit — October 24, 2026

## Scope, evidence and outcome

Developer requested the Lyrics-only SQL and a full schema audit after aborting a whole-App `db:push` preview. Acceptance: review every exported schema family, classify every proposed unrelated statement, identify integrity/relationship risks using actual callers, and provide a concrete manual path for remaining live evidence. This is an audit, not authorization to change unrelated schema or data.

Baseline: branch `main`, HEAD `7ad835b3`, working package **0.27.8**. Reviewed all seven schema files (central export plus six module files), both Drizzle configs, package scripts, ignored local SQL/snapshot history, installed Drizzle Kit 0.31.10/ORM 0.45.2 implementation, and relevant API/service consumers. Existing manual changes were preserved.

**The source schema is structurally coherent at the SQL relationship level, but there are concrete pre-existing application/integrity issues to address.** Repeated push proposals have identifiable comparison problems; they are not, by themselves, evidence that earlier pushes corrupted data. The supplied preview does not contain the existing definitions of constraints it proposes to replace, so live equivalence remains unverified.

Developer subsequently confirmed successful manual execution of [Lyrics-only creation SQL](sql/multimedia-lyrics-create.sql), then creation of a first Lyrics record with a Track assignment. These are Developer-confirmed application and persistence evidence; the later public Album Lyrics work was also accepted before release preparation. Broader CRUD/assignment cases, Admin Track-specific browser acceptance and independent live verification remain separate. The agent did not execute SQL or connect to a database. Do not rerun the creation script after this success.

## Complete declared-schema coverage

The offline inventory loads only schema modules and Drizzle libraries, deduplicating the intentional Auth export aliases by object identity. It does not load the database client or environment files. All counts describe **declarations**, not observed live objects.

| Module | Tables | Columns | Foreign keys | Explicit indexes | Unique constraints | Checks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Auth | 4 | 41 | 2 | 7 | 3 | 0 |
| Settings | 5 | 53 | 6 | 19 | 2 | 0 |
| Project | 6 | 84 | 15 | 21 | 1 | 0 |
| ThreeD | 45 | 662 | 104 | 150 | 19 | 73 |
| Traffic | 10 | 227 | 10 | 50 | 10 | 0 |
| Multimedia | 13 | 136 | 24 | 30 | 6 | 7 |
| **Total** | **83** | **1,203** | **161** | **277** | **41** | **80** |

Also reviewed **37 enums** and **160 Drizzle relation mappings**. Explicit-index counts exclude the implicit indexes backing primary/unique constraints. No source tables enable RLS; the App uses server-side authorization. This is an ownership design dependency, not proof that public database access exists.

Structural checks found:

- Every table has a primary key; every declared FK target exists and has suitable primary/unique backing columns.
- FK column SQL types are compatible, treating serial/integer equivalents correctly. No `ON DELETE SET NULL` FK targets a declared NOT NULL referencing column.
- Twelve FK identifiers exceed the standard 63-byte PostgreSQL limit; no collisions between declared constraints after truncation were found.
- Fresh serialized schema content matches ignored `0006_snapshot.json` after object-key normalization, excluding snapshot identity fields. This is local-history consistency, not a live comparison.
- Thirty-six relation mappings cannot be inferred by the installed ORM; these are described below.
- Fifty-four FK definitions lack an index whose leading columns cover the entire FK column set. This is a review candidate count, **not 54 required new indexes**: composite relationships can already have useful partial/unique indexes. Workload and live plans determine changes.

## The aborted push: every unrelated change classified

The pasted preview has **60 statements**: 15 Lyrics statements (four table creates, seven FKs, four indexes), plus **45 unrelated statements** (20 FK drops, 20 FK replacements, five column alterations). It contains no existing-table drops or explicit row deletion statements. Constraint removal/recreation and type changes still require separate review.

All 20 replacement FK definitions match both local snapshots `0001` and `0006`. The four affected column definitions/defaults are unchanged from snapshots `0000` through `0006`. Lyrics did not introduce these existing-table source changes.

### Twelve long foreign-key names

Each dropped name in the preview is exactly the first 63 ASCII bytes of its proposed replacement name. PostgreSQL normally truncates longer identifiers, including quoted names. Reapplying the longer name repeats that truncation. [PostgreSQL identifier rules](https://www.postgresql.org/docs/current/sql-syntax-lexical.html).

| Table | FK column | Declared name bytes |
| --- | --- | ---: |
| `threed_watering_history` | `schedule_id` | 67 |
| `threed_tasks` | `watering_schedule_id` | 65 |
| `settings_deployment_history` | `deployment_id` | 67 |
| `threed_character_animation_assignments` | `character_id` | 75 |
| `threed_farmbot_commands` | `peripheral_binding_id` | 86 |
| `threed_farmbot_emergency_actions` | `farmbot_id` | 65 |
| `threed_farmbot_emergency_actions` | `peripheral_binding_id` | 95 |
| `threed_model_category_assignments` | `category_id` | 75 |
| `threed_farmbot_peripheral_bindings` | `farmbot_id` | 67 |
| `threed_model_material_assignments` | `texture_id` | 72 |
| `threed_simulation_results` | `simulation_id` | 64 |
| `threed_assembly_model_assignments` | `assembly_id` | 67 |

This establishes a naming mismatch. It does **not** establish that each live definition has identical target columns, actions and validation state. After catalog comparison, prefer explicit stable FK names within the identifier limit; preserve deletion/ownership rules. No naming changes were made during this audit.

### Eight composite Animation owner foreign keys

The remaining same-name replacements are:

- `animations_source_owner_fk`
- `character_animation_clip_owner_fk`
- `model_animation_clip_owner_fk`
- `animation_category_clip_owner_fk`
- `animation_category_owner_fk`
- `animation_preset_clip_owner_fk`
- `animation_preset_entry_owner_fk`
- `animation_action_slot_category_owner_fk`

Source declarations correctly map `[related_id, user_id]` to `[id, user_id]`, with unique target pairs and deliberate deletion rules. Installed Kit's introspection query (`node_modules/drizzle-kit/bin.cjs`, around line 17770) independently joins `ANY(conkey)` and `ANY(confkey)` without positional pairing or ordering, then deduplicates each column array separately. Its comparison is order-sensitive. This is a concrete introspection weakness that can produce repeated differences; it is not evidence that these eight live FKs are wrong.

The supplied [catalog query](sql/schema-audit-read-only.sql) preserves each array's ordinality and includes `pg_get_constraintdef`, allowing the actual definitions to settle this question. [PostgreSQL constraint catalog](https://www.postgresql.org/docs/current/catalog-pg-constraint.html).

### Five column alterations

| Proposed alteration | Local finding | Still needed |
| --- | --- | --- |
| Character `animations` default | Installed Kit default parser turns a synthetic empty enum-array default into a different string. Source default is unchanged. | Actual catalog default expression. |
| Character `animations` enum-array type cast | Installed introspection uses the array UDT name for enum lookup; source serialization resolves the base enum schema. | Actual type/schema and array element type before approving any cast. |
| Layer `config` JSONB default | Equivalent objects with different key order compare differently in Kit's serialized strings. | Semantic comparison of the actual JSONB default. |
| Assembly `id` default | Actual Kit parser strips `::text` from a synthetic `(gen_random_uuid())::text` input. | Actual default and function resolution. |
| Simulation `definition` JSONB default | Same key-order comparison issue; intended object remains version 1 with empty steps/observations. | Semantic comparison of the actual JSONB default. |

Parser reproductions used local synthetic inputs, not live expressions. PostgreSQL JSONB does not preserve object key ordering. [PostgreSQL JSON types](https://www.postgresql.org/docs/current/datatype-json.html). The enum-array cast is real DDL and remains unapproved pending evidence.

### Workflow and historical limits

`db:push --strict` compares the complete exported source schema with live introspection; it does not replay local generated SQL. `db:generate` compares local snapshots and needs no database connection. [Drizzle push](https://orm.drizzle.team/docs/drizzle-kit-push), [Drizzle generate](https://orm.drizzle.team/docs/drizzle-kit-generate).

The installed strict abort path exits before the execution loop. The actual apply path issues statements individually without a surrounding transaction in that path (`bin.cjs`, around lines 82741 and 82767–82768). The pasted batch has no transaction wrapper. Therefore a historical interrupted push cannot be assumed atomic; no historical partial failure or damage has been demonstrated here.

Ignored generation history is preserved: `0000` baseline, `0001` Simulation Results, `0002` Simulation/Scenario separation, `0003` Media visibility, `0004` retained Designs/top-view/Media ordering, `0005` initial prefixed Lyrics, `0006` Lyrics renames. It records intended local evolution, not an applied-migration ledger. `db:migrate` remains an informational echo. Do not replay the baseline against the existing database. The Developer-approved native push workflow remains in place.

## Prioritized findings beyond push noise

### 1. High: some legacy CRUD updates allow ownership and identity changes

Plants, Beds, Layers, Plantings, Characters, Traffic Centers and Traffic Districts authenticate and locate an owned row, then spread caller fields into `.set()`. That does not make fields such as `userId` or `id` immutable. A caller can move their existing row to a different valid owner/null owner; single-ID FKs do not preserve ownership equality for its related records. No exploitation or damaged live rows were observed.

Evidence: [Plants route](../../src/app/api/threed/plants/route.ts) around lines 389/490; [Beds](../../src/app/api/threed/beds/route.ts) 292/372; [Layers](../../src/app/api/threed/layers/route.ts) 313/392; [Plantings](../../src/app/api/threed/plantings/route.ts) 448/532; [Characters](../../src/app/api/threed/characters/route.ts) 20/473/574. Server-set update timestamps override that particular input, but other protected fields are not excluded consistently.

The same pattern occurs in [Traffic Centers](../../src/app/api/traffic/chp-centers/route.ts) around lines 294/377 and [Traffic Districts](../../src/app/api/traffic/caltrans-districts/route.ts) 305/389.

Recommended follow-up: typed field allowlists, immutable owner/identity fields, and owner-checked related IDs before any schema tightening. The new Lyrics parser already rejects caller-supplied owner fields.

### 2. High: Tasks uses status as public visibility and omits parent ownership checks

[Tasks GET](../../src/app/api/threed/tasks/route.ts) around lines 34–39 permits all pending Tasks, including unauthenticated reads; selects return all columns, including notes and assignment details. The table has no explicit public flag. No maintained policy was found establishing that pending status should imply public access. The behavior is confirmed; intended publication policy needs confirmation before changing it.

Tasks POST validates related records by ID without owner predicates (around lines 227–282); PUT accepts changed parent IDs without equivalent owned-parent checks (around lines 422–444). Simple FKs verify existence, not owner equality. Recommend owner checks independently of the visibility decision, preserving authorized Project/runtime access.

### 3. High reliability: routine sequence resets race with inserts

[Sequence helper](../../src/libraries/db/sequence.ts) reads `MAX(id)` and then calls `setval(max + 1)` through separate operations before ordinary creates. Another transaction may have allocated a higher ID that the MAX query cannot see; a reset can reuse it and cause uniqueness failures. Two-argument `setval` marks its supplied value as used, so the next value is also one beyond the helper's reported value. [PostgreSQL sequence functions](https://www.postgresql.org/docs/current/functions-sequence.html).

This helper is called by multiple ordinary CRUD routes, including Models, Files, Characters and Tasks. Recommend relying on the existing serial defaults in normal creates and reserving repair for controlled, explicitly authorized maintenance. This source race is separate from `db:push`; no sequence damage was established.

### 4. Medium: several nullable FarmBot CHECK expressions admit incomplete states

[ThreeD schema](../../src/libraries/schema/threed/index.ts) credential envelope (around line 987), command resolution (1266), recovery lifecycle (1298) and emergency resolution (1407) contain comparisons on nullable fields. Some partial states evaluate to UNKNOWN rather than FALSE, which satisfies a PostgreSQL CHECK. [PostgreSQL CHECK semantics](https://www.postgresql.org/docs/current/ddl-constraints.html).

Examples include envelope data present with a null version, or a resolved peripheral/duration with a null pin. Existing application envelope and command validators mitigate these cases. This is a database integrity gap, not an established physical-command bypass. A future reviewed fix should preserve intentional all-null states and reject incomplete alternatives explicitly; inspect existing rows before tightening.

### 5. Medium: Traffic parent references have no physical FKs

`traffic_chp_cad_incidents.center_id`, `traffic_caltrans_lane_closures.district_id` and `traffic_caltrans_cctv_cameras.district_id` are plain integers. Pollers store internal Center/District row IDs, while the Center/District delete routes remove those rows without cleaning child references. This permits dangling references; current orphan counts are unknown.

Evidence: [Traffic schema](../../src/libraries/schema/traffic/index.ts), around lines 150/274/441 and its relation declarations. Review existing references, then choose retention-safe behavior (for example, SET NULL) before adding constraints; do not cascade-delete incident history as an incidental cleanup.

### 6. Medium/latent: 36 ORM relations cannot be inferred

The installed ORM's `normalizeRelation` fails for these declared mappings:

| Owner | Unresolvable relation names |
| --- | --- |
| Project | `projectThreeds`, `projectTraffics`, `projectMultimedias` |
| ThreeD module | `plants`, `beds`, `plantings`, `farmbots`, `models`, `characters`, `tasks`, `weatherLogs`, `wateringSchedules`, `harvests`, `layers` |
| Plants / Plantings / FarmBots | `harvests` / `harvests` / `logs` |
| Traffic module | `projectTraffics`, `projectAssets`, `chpCadIncidents`, `chpCases`, `caltransLaneClosures`, `caltransCctvCameras`, `bayArea511Events`, `calfireIncidents`, `chpCenters`, `caltransDistricts`, `apiRequestLogs` |
| Multimedia module | `projects`, `albums`, `tracks`, `links`, `media`, `pollingLogs`, `playbackHistory` |
| Albums | `media` |

Additionally, Model→Plant/Character declarations use `one` despite multiple records being allowed to reference a Model; Plant→Models uses `many` despite its single Model ID. Source searches found no active App `db.query.*.findMany/findFirst` consumers of these mappings; current handlers use explicit selects/joins. These are latent mapping defects, not proof that current pages fail. Fix mappings to the accepted ownership model; do not fabricate module parent columns to satisfy stale declarations.

### 7. Medium: global uniqueness and caller expectations differ

Multimedia and Traffic module slugs are globally unique, while their handlers derive them only from lowercased names with spaces replaced. Two owners choosing the same name can hit an unhandled uniqueness conflict and receive a generic server error. Some ThreeD natural identifiers likewise have global constraints with owner-scoped duplicate prechecks.

Decide whether identifiers are global or per owner, then align allocation, conflict messages and constraints. Do not remove uniqueness implicitly. Project name-to-slug generation already uses a suffix, reducing the same-name case there.

### 8. Lower-priority integrity and performance work

- Multiple modules declare both column `.unique()` and an equivalent named unique index. Both enforce the same key and duplicate index maintenance. Confirm the actual indexes before consolidating them.
- Many legacy `user_id`, junction endpoint, status and timestamp columns remain nullable. Defaults do not reject explicit null. This permits incomplete association rows; current data prevalence is unknown. Traffic pollers intentionally omit owners for shared feed rows, so blanket owner NOT NULL changes would be inappropriate.
- Owner-scoped Models, Plants, Beds, Characters and Files are among tables lacking a leading owner index. These are performance candidates, not demonstrated slow queries. Measure before adding indexes; avoid blindly adding all 54 inventory candidates.
- `project_assets` intentionally uses polymorphic module/asset references; SQL FKs cannot target the varying entity tables. Application assignment and snapshot checks remain authoritative. Some module/asset deletion paths do not clean these references; audit actual dangling pointers and decide retention behavior before cleanup. Do not confuse this with the new Lyrics junctions' concrete parent FKs.
- `updated_at DEFAULT now()` initializes a value; it is not a database update trigger. Callers must maintain update timestamps. JSONB TypeScript types likewise do not enforce JSON shape in PostgreSQL; critical Design/Simulation checks and service validators remain important.
- Watering History uses NO ACTION for several entity references, so historical records can block parent deletion. This can be a retention choice; do not change it without deciding desired history behavior.

### 9. Latent Settings helpers need review before reuse

[Legacy DB settings helpers](../../src/libraries/config/settings.ts) have a shared process cache across user-specific reads and activate deployments with two separate writes; the schema has no one-active-deployment constraint. No external runtime callers of those helpers were found. The active workspace Settings service uses its own guarded transactional path. These findings are deferred risks before helper reuse, not demonstrated current-user leakage or failed workspace saving.

### Positive module-specific checks

Auth account/session deletion and provider identities are coherent with the current JWT/explicit-table setup. Multimedia public reads and parent changes retain same-owner Album visibility and transactional checks. Media's database public/active defaults preserve historical visibility while current API creates explicitly default private/active; that difference is intentional. Speech accepted-version relationships, unique version/request keys, in-flight partial uniqueness and ready-output checks are coherent. Design/Simulation JSON checks and Assembly compound relationships retain their intended integrity rules. Lyrics remains autonomous with non-null unique junction pairs, exact parent FKs and service-level ownership checks under locks.

## Live evidence needed to close the audit

Run [schema-audit-read-only.sql](sql/schema-audit-read-only.sql) manually and retain its single `schema_audit` JSON result. It targets PostgreSQL 12+ and uses a read-only transaction, catalog queries and a final rollback. It includes visible non-system tables/columns/defaults, array element types, ordered FK definitions, validation state, indexes, enums, domains, sequence configuration/ownership, RLS policy roles/predicates, trigger definitions, views, routine signatures and extensions. It queries no business rows, role passwords, connection settings or current sequence values, and executes no application functions. Schema definitions can contain literal values; review the metadata before sharing. Routine bodies, role grants, workload plans and data-quality counts are outside this metadata capture.

The catalog query has been source-reviewed but not executed against PostgreSQL. Supplying the output will allow exact desired-versus-live comparison and identification of database-only objects. A later targeted, read-only data audit would be needed to establish orphan/duplicate/null counts or investigate historical changes; neither a push preview nor successful Lyrics creation answers those questions.

No live DB connection, push, migration, seed, storage upload, server operation or unrelated schema fix occurred during this audit. The agent left all changes unstaged. The requested source-schema audit is complete; live equivalence and data-health verification remain explicitly open.

## Evidence and follow-up order

Local reproducible inventory and raw desired-schema metadata are retained under ignored `reference/imports/schema-audit-2026-10-24/` (`audit-local.cjs`, `local-schema-audit.json`). They contain schema declarations only. The inventory initially compared JSON object insertion order; after key normalization it reports no semantic snapshot differences. Auth export aliases are deliberately deduplicated rather than counted as extra tables.

1. Retain the successful Lyrics application; verify its standalone and three-parent assignment workflows in the App.
2. Obtain the read-only catalog output and resolve push differences without accepting an unreviewed whole-App batch.
3. Address typed CRUD ownership boundaries, Tasks access/parent checks, and routine sequence resets as separate focused changes.
4. Review CHECK null handling, missing Traffic FKs and ORM relations; assess existing data before DDL.
5. Measure indexing opportunities and consolidate redundant indexes only after inspecting actual definitions.

Version status, scoped check results and Developer confirmations are recorded in [v0.27.8](../releases/v0.27.8.md).

## Table-by-table inventory

Numbers below are declared columns / foreign keys / explicit indexes / unique constraints / checks. Each table's primary key was also verified; it is not counted as a unique constraint here.

| Table | Columns | FKs | Indexes | Unique | Checks |
| --- | ---: | ---: | ---: | ---: | ---: |
| user | 15 | 0 | 2 | 2 | 0 |
| user_accounts | 15 | 1 | 2 | 0 | 0 |
| user_sessions | 6 | 1 | 2 | 1 | 0 |
| user_verifications | 5 | 0 | 1 | 0 | 0 |
| settings | 16 | 0 | 5 | 1 | 0 |
| settings_user_overrides | 7 | 2 | 3 | 0 | 0 |
| settings_deployment | 12 | 1 | 4 | 1 | 0 |
| settings_deployment_history | 9 | 1 | 3 | 0 | 0 |
| settings_audit_logs | 9 | 2 | 4 | 0 | 0 |
| project | 24 | 1 | 3 | 1 | 0 |
| project_threed | 8 | 3 | 3 | 0 | 0 |
| project_traffic | 8 | 3 | 3 | 0 | 0 |
| project_multimedia | 8 | 3 | 3 | 0 | 0 |
| project_assets | 11 | 2 | 5 | 0 | 0 |
| project_threed_markers | 25 | 3 | 4 | 0 | 0 |
| threed_designs | 10 | 2 | 2 | 0 | 2 |
| threed | 13 | 2 | 4 | 1 | 0 |
| threed_scenarios | 11 | 3 | 3 | 0 | 0 |
| threed_simulations | 12 | 3 | 3 | 0 | 4 |
| threed_simulation_results | 14 | 4 | 3 | 0 | 4 |
| threed_plants | 36 | 2 | 5 | 1 | 0 |
| threed_models | 30 | 2 | 5 | 0 | 0 |
| threed_model_categories | 10 | 2 | 4 | 0 | 0 |
| threed_model_category_assignments | 6 | 3 | 4 | 0 | 0 |
| threed_model_files | 14 | 2 | 2 | 0 | 0 |
| threed_model_textures | 13 | 1 | 3 | 0 | 0 |
| threed_ground_maps | 14 | 2 | 3 | 0 | 0 |
| threed_model_material_assignments | 8 | 3 | 4 | 0 | 0 |
| threed_beds | 23 | 1 | 4 | 1 | 0 |
| threed_plantings | 24 | 4 | 6 | 1 | 0 |
| threed_watering_schedules | 27 | 5 | 6 | 1 | 0 |
| threed_watering_history | 20 | 5 | 5 | 1 | 0 |
| threed_harvests | 14 | 3 | 3 | 1 | 0 |
| threed_tasks | 19 | 5 | 10 | 1 | 0 |
| threed_weather_logs | 16 | 1 | 1 | 0 | 0 |
| threed_farmbots | 26 | 2 | 5 | 3 | 1 |
| threed_farmbot_peripheral_bindings | 11 | 2 | 3 | 0 | 3 |
| threed_farmbot_broker_metadata | 13 | 2 | 3 | 0 | 1 |
| threed_mqtt_runtime | 20 | 1 | 3 | 0 | 4 |
| threed_mqtt_events | 21 | 1 | 5 | 0 | 6 |
| threed_farmbot_commands | 32 | 4 | 7 | 0 | 15 |
| threed_farmbot_emergency_actions | 22 | 3 | 5 | 0 | 10 |
| threed_farmbot_logs | 11 | 2 | 3 | 0 | 0 |
| threed_system_logs | 9 | 1 | 2 | 0 | 0 |
| threed_characters | 42 | 2 | 8 | 1 | 0 |
| threed_character_models | 8 | 3 | 3 | 0 | 0 |
| threed_layers | 16 | 1 | 5 | 1 | 0 |
| threed_animation_files | 10 | 1 | 1 | 1 | 1 |
| threed_animations | 11 | 2 | 2 | 1 | 1 |
| threed_model_animation_assignments | 8 | 3 | 3 | 0 | 1 |
| threed_character_animation_assignments | 8 | 3 | 3 | 0 | 1 |
| threed_animation_presets | 7 | 1 | 1 | 1 | 2 |
| threed_animation_preset_entries | 8 | 3 | 2 | 0 | 1 |
| threed_animation_categories | 5 | 1 | 1 | 1 | 1 |
| threed_animation_category_assignments | 4 | 3 | 2 | 0 | 0 |
| threed_animation_action_slots | 9 | 2 | 2 | 0 | 1 |
| threed_assembly | 6 | 1 | 0 | 1 | 1 |
| threed_assembly_model_assignments | 3 | 2 | 1 | 0 | 0 |
| threed_assembly_revisions | 5 | 1 | 0 | 0 | 3 |
| threed_assembly_components | 13 | 2 | 0 | 1 | 10 |
| traffic | 12 | 1 | 3 | 1 | 0 |
| traffic_chp_cad_incidents | 30 | 1 | 8 | 1 | 0 |
| traffic_chp_cases | 30 | 1 | 5 | 1 | 0 |
| traffic_caltrans_lane_closures | 28 | 1 | 6 | 1 | 0 |
| traffic_bay_area_511_events | 24 | 1 | 5 | 1 | 0 |
| traffic_calfire_incidents | 29 | 1 | 7 | 1 | 0 |
| traffic_caltrans_cctv_cameras | 24 | 1 | 5 | 1 | 0 |
| traffic_chp_centers | 20 | 1 | 4 | 1 | 0 |
| traffic_caltrans_districts | 16 | 1 | 4 | 2 | 0 |
| traffic_api_request_logs | 14 | 1 | 3 | 0 | 0 |
| multimedia | 12 | 1 | 3 | 1 | 0 |
| multimedia_albums | 13 | 1 | 3 | 0 | 0 |
| multimedia_media | 14 | 2 | 3 | 0 | 0 |
| multimedia_tracks | 15 | 2 | 2 | 0 | 0 |
| multimedia_lyrics | 9 | 1 | 1 | 0 | 1 |
| multimedia_lyrics_projects | 3 | 2 | 1 | 1 | 0 |
| multimedia_lyrics_albums | 3 | 2 | 1 | 1 | 0 |
| multimedia_lyrics_tracks | 3 | 2 | 1 | 1 | 0 |
| multimedia_links | 14 | 3 | 5 | 0 | 0 |
| multimedia_polling_logs | 9 | 1 | 3 | 0 | 0 |
| multimedia_playback_history | 8 | 3 | 3 | 0 | 0 |
| multimedia_speech | 13 | 2 | 1 | 0 | 2 |
| multimedia_speech_versions | 20 | 2 | 3 | 2 | 4 |
