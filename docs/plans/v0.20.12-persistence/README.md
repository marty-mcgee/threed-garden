# ThreeD Assembly — Drizzle persistence experiment

The User approved the `threed_assembly` sub-module, the title **ThreeD Assembly**, and the proposed persistence structure, then required Drizzle ORM and the existing canonical ThreeD schema location.

## Source of truth

All four tables are defined in `src/libraries/schema/threed/index.ts` and exported by the existing schema index:

- `threedAssembly` → `threed_assembly`: owned reusable identity/name and demo key.
- `threedAssemblyModelAssignments`: Admin-managed eligible Model references.
- `threedAssemblyRevisions`: named composition snapshots.
- `threedAssemblyComponents`: ordered repeated Model occurrences and relative transforms.

The separate candidate raw SQL files have been removed. Do not apply those earlier drafts. Drizzle's schema definitions, foreign keys, checks, unique constraints and indexes are authoritative. Its `sql` tagged expressions are used only for database default/check expressions, not handwritten schema execution.

The installed Drizzle FK builder does not expose deferred foreign keys. The assignment reference uses supported immediate NO ACTION behavior; the demo cleanup service explicitly deletes components, revisions, assignments and then the owned demo group in a single transaction. Source Model deletion remains restricted while assigned. No source Model/File deletion is performed.

## ORM demo services

`src/libraries/services/threed/models/assembly-demo-server.ts` provides `createFarmBotAssemblyDemo(database, authenticatedOwnerId)` and `deleteFarmBotAssemblyDemo(database, authenticatedOwnerId, assemblyId)`. These use the injected application Drizzle database, with select/insert/delete/transaction/returning operations. No raw SQL seed is used. A future authenticated route must derive the owner from the session, never a browser owner field.

Demo creation resolves exactly one active owned GLB each for FarmBot: Box, FarmBot: Farmduino and FarmBot: Belt Clip. Missing, ambiguous and inactive sources block creation. A unique owner/demo key prevents repeat creation from overwriting data. Four occurrences demonstrate independent transforms and two references to the same Belt Clip Model. Positions are illustrative, not mechanically accurate. Cleanup is constrained to the selected owner's marked demo.

No Category is mutated. Future category-based selection expands into explicit Model assignments; later category edits must not silently alter a saved composition.

## Generation and validation

Drizzle generated an isolated preview containing exactly four CREATE TABLE statements and eleven total statements, with no DROP statements. The generated review artifact is `/tmp/threed-assembly-drizzle-review.sql`; it is not a hand-authored migration or an application step. No database connection was opened. A full-export preview encountered duplicate exports/index names in the existing schema index; using canonical user/Model exports plus the four Assembly tables isolated this approved change without editing unrelated schemas.

The repository's development workflow is `npm run db:push` (Drizzle); `db:migrate` is currently an informational stub. No global generation, push or migration application was performed. Inspect the Drizzle plan against the explicitly chosen development database before applying; do not treat the historical migration snapshots as a complete current database baseline.

Offline `threed-assembly-persistence` checks exercise demo query construction, owner predicates, missing/duplicate-source rejection, duplicate-demo refusal, ordered source-preserving cleanup, and Drizzle table constraints. They do not prove actual database rollback/FK behavior. `threed-assembly-group` covers serialization and transforms.

## Remaining experiment work

Identify the development database/branch; apply the approved Drizzle schema there; expose the session-bound demo action and save/load controls; run create/read/delete verification against real database records. No demo data has yet been inserted. Public sharing, revision save concurrency and Project placements remain later integration steps. Revisions must be appended under an expected-revision transaction; schema alone does not enforce that service behavior or the minimum one-component rule.

## Drizzle terminal runner follow-up

User screenshots show Bun 1.3.9 failing with EPERM/read at Drizzle's confirmation prompt. The displayed plan also contains non-Assembly constraint/default/type changes, so it cannot be treated as an approved four-table-only production plan.

Updated db:generate, db:push and db:studio package scripts to invoke the installed Drizzle CLI explicitly with Node. Set strict:true in drizzle.config.ts and corrected its misleading skip-prompts comment. db:push also retains --strict. Use `npm run db:push` in an interactive terminal; no --force is needed. Drizzle's documented --force behavior auto-approves data-loss operations, so it is not a terminal compatibility fix (https://orm.drizzle.team/docs/drizzle-kit-push).

Validated CLI startup/help through `npm run db:push -- --help`, TypeScript and diff whitespace. No live push, database read/write or reproduction of the user's WSL input prompt was performed. User-side confirmation input still needs testing under Node; independently review non-Assembly statements before any production application.
