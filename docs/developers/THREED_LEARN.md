# ThreeD Module Learn

Learn is a top-level App Module with one shared collection of Markdown guides. Current active, non-deleted Super Admins manage the collection; public visitors can read only guides that are both Active and Published. Creator/editor attribution is not personal ownership and grants no access to another User's private Projects or assets.

## Database setup and starter records

1. Review and manually apply [learn-guides.sql](sql/learn-guides.sql) once, before using the new API. It creates only the Learn table, constraints and indexes. Do not use a full `db:push` or rerun earlier Users scripts. If the table already exists, inspect its actual definition before taking further schema action.
2. Install the declared dependencies with Node 24 and npm 11.6.2 using `npm ci`. The Developer controls the running App and any server restart.
3. Sign in as an active Super Admin and open **Admin > Learn > All Guides** (`/admin/learn`). Choose **Import Starter Guides** and confirm the import.
4. The action inserts the fourteen existing ThreeD Learn guides as actual `learn_guides` rows, with Markdown content, stable slugs, Sort Order, Active and Published flags, timestamps and actor attribution. It reports how many were imported or skipped. Existing slugs are skipped without changing their content or publication state, so repeating an import is safe for edited guides.
5. Open a guide through its Edit action, review the Markdown preview, save a change and read the published guide at `/learn/guides/<slug>`. These are live acceptance steps; automated fixtures do not establish that they have happened.

The Developer-requested [SQL import query](sql/learn-guides-import.sql) is an alternative to step 3. Replace `REPLACE_WITH_SUPER_ADMIN_USER_ID` with an existing active, non-deleted Super Admin's User ID, review the intended database and run the whole transaction after the table prerequisite. The script verifies and locks that account, inserts the same fourteen starter records with UUID revisions and attribution, skips existing slugs and reports imported/skipped counts. It does not create the table or change an account. Neither import method must be run merely to validate the code.

The starter source is [starter-guides.ts](../../src/libraries/data/learn/starter-guides.ts). It preserves the existing guide wording, ordered instructions, expected results and links to fuller repository Markdown documentation. Updating that source does not update previously imported rows. After import, the database is the content authority. A deleted starter slug can be recreated by a subsequent explicit import.

There is no seed on startup, schema creation, page load or public read, and no static fallback that makes an empty or unavailable database appear populated. The public page reports loading, empty and retryable error states.

## Authoring and publishing

Use **Add Guide** for a new unpublished guide. The editor provides Title, Slug, Summary, Markdown, Sort Order, Active and Published, with the same renderer for preview and public reading. Save is explicit. Failed saves retain the draft; stale revisions require reviewing the current record before retrying. Editor navigation buttons, same-tab links, reload/discard and destructive actions have confirmation guards. Learn Admin entry/exit uses document navigation so browser Back/Forward crosses the same unsaved-work/pending-write unload guard.

Both Active and Published must be enabled for public access. Unpublishing or disabling removes the guide from subsequent public list, search and detail requests; it cannot revoke content a visitor already loaded. Slugs identify public URLs; changing a slug changes that URL. IDs remain the editorial identity. Deletion removes the guide record; it does not remove the original starter source or linked documentation.

The list applies search, publication/active filters and sorting before bounded pagination. URL state retains those choices, selection stays within the current page, and selected deletion reports individual failures. Creation/Save actions follow App styling; sidebar creation links retain ordinary navigation styling.

## Source and API boundaries

| Layer | Location |
| --- | --- |
| Schema | `src/libraries/schema/learn/index.ts`, exported by the central schema index |
| Typed DTOs, validation, persistence and HTTP guards | `src/libraries/services/learn` |
| Editorial API | `/api/learn/guides` and `/api/learn/guides/import-starters` |
| Public API | `/api/learn/public/guides` and `/api/learn/public/guides/[slug]` |
| Admin list/editor | `src/components/admin/learn`, mounted at `/admin/learn`, `/new`, `/[id]` |
| Public reading and shared Markdown | `src/components/learn`, mounted under `/learn` |

Editorial authorization reads the current User row; session role claims alone are insufficient. Mutations recheck authority inside their transaction, validate inputs and same-origin requests, and require a matching revision for existing-record writes. Slugs are unique. Errors do not expose database details.

Public list responses contain summaries, not full bodies. Public detail responses omit editorial identifiers, revisions, attribution and flags. Publication filtering happens on the server, and responses use no-store caching. Markdown uses `react-markdown` with `remark-gfm`; raw HTML is disabled and unsafe URL protocols are rejected. Do not add raw HTML execution to support a guide.

Learn uses the shared Module appearance registry with `/admin/learn` and public `/learn` identities. Previous 40/41-Module settings retain their saved values and revisions; the new Learn style is filled only in memory until an authorized explicit settings save.

## Validation and rollback

Run `npm run validate -- learn module-appearance admin-sidebar repository-maintenance`, fresh TypeScript and the applicable release gates. Learn checks use mocked persistence/network and exercise authorization, published-only reads, stale revisions, import idempotence, editor/list behavior and Markdown safety. They do not apply SQL or seed live data.

For an App rollback, retain the Learn table and its content; stop exposing the new editorial routes until a compatible version is restored. Do not drop populated tables as part of a code rollback. The scoped SQL includes its own transaction boundary. Current scope, results and pending acceptance belong to [v0.29.0](../releases/v0.29.0.md) and the [implementation contract](../plans/threed-module-learn.md).

### Surface destinations and management routes

`src/libraries/config/module-appearance.ts` keeps appearance metadata in `moduleDefinitions`, header destinations in `workspaceSurfaces`, and Module management destinations in `moduleManagementRoutes`. The Learn surface uses `/learn`; Learn management uses `/admin/learn`. Both refer to the same `learn` appearance key. Dashboard and Admin are surfaces, with no invented `/admin/dashboard` management route. The header reads `workspaceSurfaces`; Settings grouping reads management routes. Saved settings contain icon/color values and a revision, not these route definitions.
