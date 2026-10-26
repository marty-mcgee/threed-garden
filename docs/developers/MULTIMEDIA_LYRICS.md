# Multimedia Lyrics

## Admin workflow

Assignment badges link to their existing Admin record routes: Albums at `/admin/multimedia/albums/[id]`, Tracks at `/admin/multimedia/tracks/[id]`, and Projects at `/admin/projects/[id]`. They retain compact styling with hover and keyboard-focus feedback.

Open **Admin > Multimedia > Lyrics** at `/admin/multimedia/lyrics`. The compact shared Multimedia workspace provides search, sortable columns, paging, Add/Edit dialogs and selected-record deletion.

The list includes **Albums**, **Tracks** and **Projects** columns after Title. Each directly assigned record appears as a compact secondary badge, matching Model Category presentation; multiple names wrap, and unassigned cells show a dash. These three association columns are display-only; Title, Sort Order, Active and Updated retain sorting. Owned assignments remain visible in Admin even when their parent is private or inactive. Edit the Lyrics record to change assignments.

A Lyrics record is autonomous: Title is required; Lyrics text may be empty while drafting. Sort Order defaults to 0 and accepts integers from -10000 to 10000. Active is independent of associations. Optional JSON metadata is stored on the Lyrics record; it is owner-managed and is not publicly serialized.

Projects, Albums and Tracks are optional many-to-many assignments. Search each owned collection and check records to attach; remove selected chips or uncheck to detach. Up to 100 records of each type can be assigned per Lyrics record. Assignments do not copy or dictate the Lyrics title and text. There is no requirement to assign a Track and its Album together, or to assign a Multimedia module to a Project first.

Lyrics text is plain text, limited to 100,000 characters; metadata is a JSON object limited to 16 KiB. The UI preserves failed saves and prompts before discarding changed forms. Failed detail loads cannot be saved over the existing record.

## Admin Track playback

The **Lyrics** tab at `/admin/multimedia/tracks/[id]` shows active Lyrics directly assigned to the selected Track. Selecting another Track or using Previous/Next updates the Lyrics selection. Records are ordered by Sort Order, then ID; ten records are shown per page. Titles and text are displayed as plain text with line breaks preserved. Empty assignments, empty draft text, loading and retry states are explicit.

The player reads `/api/multimedia/lyrics?trackId=[id]&offset=0` only through the authenticated Admin panel. Both the Track and each Lyrics record must belong to the signed-in User. Responses include only ID, title and content, plus a paging flag, and are private/non-cacheable. Pending requests are cancelled when the panel closes or the Track/account changes. Album-only and Project-only assignments do not implicitly become Track assignments. The legacy Track `lyrics` field remains separate.

## Public Album playback

Open `/dashboard/multimedia?albumId=[id]` and select **Lyrics**. The public Album player (including the Home featured player) displays active Lyrics assigned directly to the Album or to its active Tracks. Album badges and Track titles identify the assignments; a Lyrics record linked in several ways appears once. Direct Album Lyrics also works when the Album has no active Tracks. The Album collection is shown regardless of which Track is playing.

Public visibility follows the existing Album rules: the Album must be Public and Published, and the Lyrics must be Active and owned by that Album's User. Track-linked content additionally requires an active Track belonging to the same Album and User. Project-only assignments do not publish Lyrics. Disabling Lyrics hides that record from public display; changing Album visibility/status or removing the qualifying assignments changes subsequent reads. No new assignments are created by display.

The anonymous read endpoint is `/api/multimedia/albums/[id]/lyrics?offset=0`. It returns ten distinct Lyrics records ordered by Sort Order then ID, with a `hasMore` flag. Each record contains only ID, title, content, direct-Album assignment flag and eligible Track ID/title labels. Metadata, ownership fields and private or unrelated Track labels are excluded. The endpoint always applies public eligibility, including for signed-in owners, and uses `Cache-Control: no-store`. Private CRUD stays on its existing authenticated endpoint. The shared panel preserves plain-text line breaks and provides loading, empty, retry and paging states, cancelling old requests when the Album changes or the tab closes.

## Schema and ownership

| Table | Purpose |
| --- | --- |
| `multimedia_lyrics` | Owned standalone records: id, user_id, title, content, sort_order, is_active, metadata, created_at, updated_at. |
| `multimedia_lyrics_projects` | Unique lyrics_id/project_id pairs referencing `project`. |
| `multimedia_lyrics_albums` | Unique lyrics_id/album_id pairs referencing `multimedia_albums`. |
| `multimedia_lyrics_tracks` | Unique lyrics_id/track_id pairs referencing `multimedia_tracks`. |

Both junction foreign keys cascade **junction rows**. Deleting a Project, Album or Track removes its assignments while preserving Lyrics records. Deleting Lyrics removes its assignments while preserving parent records. Deleting the owning User removes their Lyrics.

`/api/multimedia/lyrics` supports owner-only detail reads, paged owned assignment options, POST, PUT and DELETE. Writes validate all selected parents under share locks and lock an existing owned Lyrics row before replacing associations in one transaction. Invalid or foreign assignments cause no partial commit. Ownership is enforced in the App service; the junction foreign keys enforce existence, not cross-table User equality.

The shared `/api/multimedia/admin-list?kind=lyrics` returns list summary fields and `albums`, `tracks` and `projects` arrays of `{ id, title }`; it omits content and metadata. Association names are ordered by title/name, then ID. Three batched reads enrich only the current page and check ownership of both Lyrics and parent; empty pages skip these reads. Default Lyrics order is ascending Sort Order with ID tie-breaking. Existing Track `lyrics` text, public Album/Track responses and playback behavior are preserved. Public Lyrics uses the separate read endpoint above. No automatic import or synchronization is included.

## Schema application and rollback

Initial local generation produced ignored `drizzle/0005_real_meltdown.sql` under the originally requested names. Following the Developer's naming correction, credential-free generation produced `drizzle/0006_complex_thanos.sql`: four table renames to the `multimedia_lyrics` family plus corresponding constraint/index replacement, with no table drops or data-copy operations. Original generated files/snapshots are preserved as local history. No live SQL was executed by the agent.

Apply through the Developer-owned [database schema workflow](LOCAL_DEVELOPMENT.md#database-schema-commands): review the live comparison before accepting `npm run db:push`. If the earlier Lyrics tables were already applied, select their corresponding renames rather than deletion/recreation; existing records and assignments must be preserved. If none were applied, create only the four correctly named tables. The Lyrics page reports an unavailable/schema message until the correct tables exist. Do not replay historical migration baselines against the existing database.

The Developer's October 24 live `db:push` preview proposes the four correct Lyrics table creations **and** 20 unrelated constraint drops/re-additions plus five existing-column alteration statements. Do not accept that entire plan solely to install Lyrics. `db:push` compares the whole live App schema, while local generation compares saved snapshots; the earlier narrow generation did not certify the live push scope.

For the shown pending-create state, [Lyrics-only creation SQL](sql/multimedia-lyrics-create.sql) provides one explicit transaction creating only the four new tables, their seven foreign keys and four indexes. Run the file manually in the database SQL editor only when none of these tables exist. It intentionally fails if a target table already exists, rather than overwriting or silently skipping mismatched definitions. It does not rename earlier prefixed tables; use the separately reviewed rename path if those contain data. The agent has not executed this SQL. Unrelated live drift requires a separate review.

**Application confirmed:** the Developer reported successful manual execution of this Lyrics-only script on October 24, 2026, after aborting the full push, then confirmed creating a first Lyrics record and assigning it to a Track. Do not rerun its CREATE statements. The Developer subsequently accepted the public Album Lyrics work and requested release preparation. Admin Track-specific browser acceptance and independent live/browser verification remain separate. The [full declared-schema audit](SCHEMA_AUDIT_2026-10-24.md) records unrelated findings and provides a separate read-only catalog query for live comparison.

Rollback requires reverting the Lyrics code/navigation first. If removal of the new data is explicitly authorized after backup, remove the three junction tables before the standalone Lyrics table; retain every existing table and the legacy `multimedia_tracks.lyrics` column. No rollback was performed.

## Verification

Assignment columns and linked Admin relationships are included in [v0.27.9 - Admin: Relationship links](../releases/v0.27.9.md), with fresh isolated TypeScript, all 93 offline CI tasks and a guarded production build. No additional schema update is required for these list enhancements.

`npm run validate -- multimedia-lyrics multimedia-admin-workspace admin-sidebar` exercises actual schema metadata, owner/parent guards, transactional assignment replacement/failure, input bounds, list query behavior, actual dialog callbacks and sidebar routing with mocked persistence/UI. Lyrics checks also cover the Track-linked read's owner/active/order/projection bounds and the actual player panel's selection, cancellation, paging, retry and plain-text display. These checks do not certify live foreign-key application or browser interaction. Full checkpoint evidence is tracked in [v0.27.8](../releases/v0.27.8.md).

Public Lyrics checks execute the service's generated SELECTs against in-memory SQLite fixtures, covering direct/Track assignment deduplication, owner/active/public filters, minimal output, paging and Album visibility rechecks. Route and component fixtures cover anonymous reads, session-independent eligibility, invalid parameters, redacted errors, association labels and cancelled Album requests. Run `multimedia-dashboard multimedia-authority multimedia-order-display` alongside Lyrics checks for public integration/playback regressions. These are offline checks, not live PostgreSQL or rendered-browser acceptance.
