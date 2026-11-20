# ThreeD Module Learn

Learn is a top-level App Module with one shared collection of Markdown guides. Active, non-deleted Super Admins manage and can read the full collection. Active Guide owners can read their own Guides. Other readers can read Guides with Active, Published and Public enabled.

## Database setup and starter records

### Categories schema

`learn_categories` is Learn's shared taxonomy table. It has a name, unique slug, optional description, sort order, Active flag, revision UUID, timestamps and creator/editor attribution. Like Model Categories, it has an indexed `parent_id` that references a category in the same table. A missing parent makes the category top-level. PostgreSQL rejects a missing referenced parent, direct self-parenting and deletion of a category with children. The Learn Category service serializes hierarchy writes and checks ancestry to reject indirect cycles.

The [additive SQL](sql/learn-categories.sql) runs in one transaction. Review it against an approved [isolated database branch](https://neon.com/docs/introduction/branching) before applying it to an explicitly selected target. The existing shared `public.user` table supplies the attribution references. A failure rolls back the transaction. After a successful apply, a code rollback can retain the unused table and any data. Table removal is a separate operation.

**Application confirmed by the Developer on November 19, 2026.** The updated `learn-categories.sql`, including `parent_id`, ran successfully in the Neon Console SQL Editor. The target branch was not independently checked. Retain this script as the migration record for the database where it was applied.

### Guide Category Assignments schema

`learn_guide_category_assignments` connects shared Guides and Categories many to many. The unique `(guide_id, category_id)` index blocks duplicate pairs and supports lookup by Guide. An index beginning with `category_id` supports lookup by Category. Deleting either endpoint removes its assignment rows, while the other endpoint remains available for its own assignments. The junction follows Learn's shared editorial ownership.

The [assignment SQL](sql/learn-guide-category-assignments.sql) is a separate create-only transaction. It requires both `learn_guides` and `learn_categories` on the target database. A failure rolls back the transaction. A later App rollback can retain the table and its assignments.

**Application confirmed by the Developer on November 19, 2026.** The assignment SQL ran successfully in the Neon Console SQL Editor. The target branch was not independently checked. Retain the script as the migration record for the database where it was applied.

### Admin authoring

Active Super Admins manage the shared hierarchy under **Admin > Learn > Categories**. A Parent Category is optional, and the editor shows each Category's full path. Move or delete child Categories before removing their parent. Deleting a Category removes its Guide assignments and preserves the Guides.

In **Add Guide** or **Edit Guide**, the **Categories** field supports multiple optional selections. Existing assignments to inactive Categories stay visible and can be removed. Guide content, visibility settings and assignments save together in one revision-checked transaction. **All Guides** shows assigned Category names and sorts across the full list by the alphabetically first assigned name. Guides with no Categories sort last in both directions.

### Guide visibility schema

Apply the [Guide Public column migration](sql/learn-guides-is-public.sql) after the original Guide table prerequisite. It adds `learn_guides.is_public` with a default of true so existing Guides and starter imports keep their Active and Published behavior. The Guide editor persists **Public** with the other Guide settings. Category assignments are independent of public access.

**Application and browser behavior confirmed by the Developer on November 19, 2026.** The SQL ran successfully in the Neon Console SQL Editor. The Developer verified sorting by Categories and confirmed that switching Public off hid the Guide from public Learn while Published stayed on. The target branch was not independently checked.

### Guide ownership schema

The [Guide ownership migration](sql/learn-guides-owner.sql) adds the required `learn_guides.user_id` reference and backfills it from `created_by`. Coordinate the migration with switching to the updated App and starter import because Guide inserts need an owner ID. Newly created or imported Guides use the acting User as owner. Later editing preserves ownership and updates editor attribution separately.

The Learn library and individual Guide URLs use the signed-in User ID. An active, non-deleted owner can see their own Guides and active Super Admins can see the full collection regardless of the visibility switches. Guests and other readers use Active, Published and Public. Reader responses stay private and uncached.

While the ownership migration is pending, the library and individual Guide reads use the recorded creator as the owner when the owner column is missing. Creating Guides and importing starters require the ownership migration.

**Application and Super Admin browser access confirmed by the Developer on November 19, 2026.** The ownership SQL ran successfully in the Neon Console SQL Editor. Learn loaded while signed in, and the Developer verified that all Guides were visible as Super Admin. The target branch was not independently verified.

### Guide setup

1. Review and manually apply [learn-guides.sql](sql/learn-guides.sql) once, before using the new API. It creates only the Learn table, constraints and indexes. Do not use a full `db:push` or rerun earlier Users scripts. If the table already exists, inspect its actual definition before taking further schema action.
2. Install the declared dependencies with Node 24 and npm 11.6.2 using `npm ci`. The Developer controls the running App and any server restart.
3. Sign in as an active Super Admin and open **Admin > Learn > All Guides** (`/admin/learn`). Choose **Import Starter Guides** and confirm the import.
4. The action inserts the fourteen existing ThreeD Learn guides as actual `learn_guides` rows, with Markdown content, stable slugs, Sort Order, Active, Published and Public enabled, timestamps and actor attribution. It reports how many were imported or skipped. Existing slugs are skipped without changing their content or publication state, so repeating an import is safe for edited guides.
5. Open a guide through its Edit action, review the Markdown preview, save a change and read the published guide at `/learn/guides/<slug>`. These are live acceptance steps; automated fixtures do not establish that they have happened.

The Developer-requested [SQL import query](sql/learn-guides-import.sql) is an alternative to step 3. Replace `REPLACE_WITH_SUPER_ADMIN_USER_ID` with an existing active, non-deleted Super Admin's User ID, review the intended database and run the whole transaction after the table prerequisite. The script verifies and locks that account, inserts the same fourteen starter records with UUID revisions and attribution, skips existing slugs and reports imported/skipped counts. It does not create the table or change an account. Neither import method must be run merely to validate the code.

The starter source is [starter-guides.ts](../../src/libraries/data/learn/starter-guides.ts). It preserves the existing guide wording, ordered instructions, expected results and links to fuller repository Markdown documentation. Updating that source does not update previously imported rows. After import, the database is the content authority. A deleted starter slug can be recreated by a subsequent explicit import.

There is no seed on startup, schema creation, page load or public read, and no static fallback that makes an empty or unavailable database appear populated. The public page reports loading, empty and retryable error states.

## Public Learn navigation

The main `/learn` page leads with **Browse guides** and **Start your first Project**, followed by a separate garden demo link. Topic shortcuts lead to first-Project instructions, guides, troubleshooting and App information. **Open Project workspace** opens the existing workspace; creation and Save still require the appropriate account and ownership. Each published guide has a distinct **Read guide** button.

The guide library defaults to 20 records per page, so the fourteen starter guides fit together when published. Visitors can choose 20, 40 or 60; pagination controls appear only when needed. Search, publication checks and legacy guide anchors retain their existing behavior.

## Visual guides

The [Learn Art Image Development Requirement](LEARN_ART_IMAGE_REQUIREMENT.md) uses captures of actual App screens to document the interface. Created illustrations are supporting material only. It covers capture context, accuracy, accessibility and shared presentation. The existing topic SVGs below remain conceptual support illustrations; they are not actual screen captures.

The public reader and Admin preview share topic-specific, conceptual illustrations for all fourteen starter-guide slugs. The Learn landing page also illustrates the first Project and the four peer Top Modules. These are explanatory drawings, not screenshots or additional interactive controls.

The SVG assets live in [public/learn/illustrations](../../public/learn/illustrations). Their accessible descriptions and captions are maintained in [guide-illustrations.ts](../../src/components/learn/guide-illustrations.ts); [LearnGuideIllustration](../../src/components/learn/LearnGuideIllustration.tsx) reserves image dimensions and scales each image to its container. README and the linked user/help Markdown reuse those same assets.

Existing database records gain illustrations through the reader; no SQL, starter import or content rewrite is needed. Database Markdown remains authoritative. Only recognized topic slugs receive automatic illustrations, after a guide has loaded successfully. Custom slugs retain their authored content without an unrelated automatic image. Changing a recognized slug changes its automatic topic selection.

Authors can include an image through ordinary Markdown, for example `![Connected walls, finished floor and 3D room](/learn/illustrations/draw-room.svg)`. Referencing that built-in image in the body suppresses its automatic copy. Other Markdown images remain in their authored positions. Repository Markdown needs a relative path such as `../../public/learn/illustrations/draw-room.svg` because GitHub and the App serve files differently. Keep raw HTML disabled.

### Illustration coverage

Each repository starter guide has one supporting SVG through the existing topic mapping. These drawings explain concepts; they do not replace actual App screen captures. Custom database guides require an appropriate authored image or an explicitly reviewed topic mapping.

| Guide / artwork | Learning objective |
| --- | --- |
| [Draw a room](../../public/learn/illustrations/draw-room.svg) | Connect walls, finish a floor and inspect the same architecture in the Scene. |
| [Add a Model](../../public/learn/illustrations/add-model.svg) | Distinguish a reusable catalog Model from independent Project placements. |
| [Object properties](../../public/learn/illustrations/object-properties.svg) | Select before editing; changing measurement units does not resize geometry. |
| [View modes](../../public/learn/illustrations/view-modes.svg) | Compare Design, 3D, 2D geographic map and Combined in toolbar order. |
| [Save and reopen](../../public/learn/illustrations/save-reopen.svg) | Save explicitly, check the outcome and verify the reopened Project. |
| [Design JSON](../../public/learn/illustrations/design-json.svg) | Review architecture import scope while preserving Project Model placements. |
| [Model Files](../../public/learn/illustrations/model-files.svg) | Distinguish geometry/materials from Library and Top View images. |
| [Ground Map](../../public/learn/illustrations/ground-map.svg) | Align a flat reference image independently of placed objects. |
| [Character Actions](../../public/learn/illustrations/character-actions.svg) | Match Character, target and readiness before running a supported Action. |
| [Scenarios and Simulations](../../public/learn/illustrations/scenarios-simulations.svg) | Separate guidance from Action execution and captured Results. |
| [Multimedia and Lyrics](../../public/learn/illustrations/multimedia-lyrics.svg) | Understand Album Track order and independent Lyrics eligibility. |
| [Admin navigation](../../public/learn/illustrations/admin-navigation.svg) | Recognize the four peer Top Modules and eligible Project assignments. |
| [App Settings](../../public/learn/illustrations/app-settings.svg) | Distinguish shared appearance, account preferences and browser-local state. |
| [Manage Users](../../public/learn/illustrations/manage-users.svg) | Recognize Super Admin account management and protected soft deletion. |

## Authoring and publishing

Use **Add Guide** for a new unpublished guide. The editor provides Title, Slug, Summary, Markdown, Sort Order, Categories, Active, Published and Public, with the same renderer for preview and public reading. Save is explicit. Failed saves retain the draft; stale revisions require reviewing the current record before retrying. Editor navigation buttons, same-tab links, reload/discard and destructive actions have confirmation guards. Learn Admin entry/exit uses document navigation so browser Back/Forward crosses the same unsaved-work/pending-write unload guard.

Active, Published and Public must all be enabled for guest access. Turning any of them off hides the Guide from guest list, search and detail requests. Owners and Super Admins retain their signed-in access as described above. Slugs identify Guide URLs, and IDs remain the editorial identity. Deletion removes the Guide record. Starter source and linked documentation have their own lifecycles.

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
