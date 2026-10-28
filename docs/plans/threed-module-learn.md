# ThreeD Module Learn implementation contract

The Developer assigned this work to v0.29.0 and requested the full front-end/back-end App Blueprint. They confirmed **top-level Learn alongside ThreeD, Multimedia and Traffic**, with **Super Admins managing one shared collection of App guides**. The accepted [Admin Blueprint](admin-threed-workspace-blueprint.md) supplies the list/editor/API patterns; the existing public Learn shell and guide content remain the presentation starting point.

## Scope and acceptance

- One shared `learn_guides` collection: Title, Slug, Summary, Markdown content, Sort Order, Active and Published; default new records are unpublished. Stable IDs, timestamps, revision conflict checks and creator/editor attribution accompany the content.
- Only current active, non-deleted Super Admins can read the editorial API or create, edit, delete and import starter guides. Authority is checked on the server, including inside write transactions. Shared guides are App content, not personally owned Project assets.
- Admin `/admin/learn`, `/admin/learn/new` and `/admin/learn/[id]` use compact headers, green creation/Save controls, stationary actions, independently scrolling records/editor, URL-backed bounded filtering/sorting/paging, page-local selection, confirmed deletion with partial-failure feedback, explicit loading/error/empty states and retry. Editors retain drafts on failed writes and protect unsaved navigation.
- Public `/learn` and `/learn/guides/[slug]` read only Active and Published guides through minimal public DTOs. Draft/unpublished/inactive content is not exposed through list, search or detail. The existing public Dashboard shell remains.
- Markdown supports standard prose, lists, code, links and tables through a maintained parser. Raw HTML is not executed; unsafe URL schemes are rejected. Admin preview and public reading use the same renderer.
- The existing fourteen guide texts become explicit starter data. An authenticated **Import Starter Guides** action inserts only missing slugs and never overwrites an existing guide. No automatic seed or live data operation is part of validation.
- The Developer subsequently requested a manual SQL import query. [learn-guides-import.sql](../developers/sql/learn-guides-import.sql) contains the same fourteen records, requires an explicit active Super Admin ID and preserves existing slugs. It is provided for Developer execution, separate from the table prerequisite.
- Keep global Learn icon/color settings and existing 40/41-Module read compatibility. Keep ordinary sidebar links and current App labels/order.
- Provide a scoped, manually applied SQL prerequisite aligned with Drizzle. Do not run a live migration or full schema push. Package/lock changes and isolated checks belong to the v0.29.0 preparation.

## API and typed boundaries

`src/libraries/services/learn/contracts.ts` defines shared editor and public DTOs. Editorial APIs use `/api/learn/guides`: GET accepts an ID or bounded list parameters; POST creates; PUT requires ID and revision; DELETE requires ID and revision. `/api/learn/guides/import-starters` accepts an explicit POST. Mutations check same-origin requests and bounded bodies. Responses use `{ success, data, pagination? }` or a sanitized `{ success: false, error }`; errors retain useful 400/401/403/404/409/413/503 distinctions.

Public APIs use `/api/learn/public/guides` and `/api/learn/public/guides/[slug]`, with server-side publication filters and no editorial metadata. Both public and editorial reads avoid stale shared caches. Query filters apply before pagination and use deterministic ID tie-breakers.

## Verification

Exercise actual contracts, generated queries, mocked persistence/API boundaries, current-role checks, publication transitions, stale revisions, duplicate slugs, bounded inputs, starter import idempotence and rollback. Exercise real list/editor hooks for stale responses, selection scope, load failure, draft retention and duplicate saves. Render Markdown with malicious HTML/URLs and ordinary guide examples. Run focused tasks, fresh TypeScript, full offline CI and a guarded isolated production build before release preparation is complete. Record results and remaining browser/schema/deployment gates in [v0.29.0](../releases/v0.29.0.md).
