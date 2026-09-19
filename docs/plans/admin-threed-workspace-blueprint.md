# Admin ThreeD workspace blueprint

Design checkpoint: **v0.19.12 — ThreeD Admin Model Workspace**. The User requested that Admin ThreeD Models become the blueprint for future Admin ThreeD sub-module pages. The rollout is now assigned to [v0.19.13 — ThreeD Admin Sub-Module Workspace UI/UX Updates](v0.19.13.md). Apply it incrementally; the v0.19.12 release itself changed only the Models workspace.

## Reference implementation

- `src/components/admin/threed/models/ThreeDModelsCRUD.tsx`: compact workspace controls, pagination, selection, records panel and sticky table headings.
- `src/components/admin/layout/AdminWorkspaceHeader.tsx`: common title/action layout.
- `src/components/admin/layout/AdminLayout.tsx`: viewport-constrained workspace enabled for individually reviewed standalone routes. Embedded Project components retain natural sizing.
- `src/app/api/threed/models/route.ts`: owner-scoped pagination, shared count filters and server sorting.
- `src/lib/services/threed/models/model-list-query.ts`: bounded query parsing.

## Required presentation and behavior

1. Keep App navigation, workspace controls and pagination stationary. Let records scroll independently, with visible column headings and horizontal scrolling when necessary. Keep the sidebar's own navigation scroll area usable.
2. Place the compact title, total badge, search, create/import actions and related-module links at the top. Keep reusable controls consistent without forcing Model-specific actions onto unrelated modules.
3. Put result range, `|`, selected count, Delete selected and Clear selection on the pagination row. Use compact button text, page-size selection and First/Previous/Page N of M/Next/Last controls. Permit wrapping on narrow screens.
4. Search and sort the complete authorized result set on the server before pagination. Use the same filters for rows and total count, stable ID tie-breakers, bounded inputs, and module-appropriate columns. Show pending/error/empty states honestly; cancel or ignore stale requests.
5. Scope bulk selection to the current page and clear it when paging/filtering/sorting changes. Preserve confirmation and module-specific deletion restrictions. Refresh totals after mutation and recover from an emptied final page.
6. Use text status colors consistently: green Active/success, yellow Pending/uncertain result, orange Needs Attention, red Maintenance/failure and gray Dormant/Retired. Use a green check or gray X for boolean Active when that field exists.
7. Preserve accessible labels for icon actions, keyboard-operable sorting and scroll panels, focus handling, and readable dark/light states. Do not use color as the only status signal.
8. Keep module-specific fields, relationships, permissions and validation. Models' primary-file links, Texture substitution and importer geometry checks are not generic requirements for all pages.

## Proposed incremental rollout

| Stage | Candidate pages | Acceptance focus |
|---|---|---|
| 1 | Model Categories, Model Textures, Model Files | Retain hierarchy, shared-file protections and Model-relative file workflows; adapt only relevant table controls |
| 2 | Plants, Beds, Plantings | Preserve reusable source versus Project-instance distinctions, relationships and existing deletion rules |
| 3 | Characters, Layers, FarmBots | Preserve separate Character runtimes, persistent Scene ownership, Layer safety and physical-operation gates |
| 4 | Waterings and Harvests | Preserve authenticated Project scope, units and module-specific history semantics |

Each stage starts with an implementation audit, a concrete field/action map and separate scoped development. First extract a shared component only when a second implementation proves that the contracts actually match. Do not combine repository restructuring with behavior changes. Embedded Project-admin components must retain their host's sizing and lifecycle unless explicitly adapted.

Tasks/Analytics are excluded from this rollout. Their App removal scope is still unresolved; nothing in this blueprint removes their routes or data. Registration and Settings remain deferred.

## Per-page verification

Use enough records to span several pages, including more than 200. Check older-record search, every sortable field in both directions, null values and ties, empty results, page-size changes, rapid search/navigation, mutation refresh, partial bulk-deletion failures, and selection reset. Verify long-table scrolling, sticky headings, sidebar behavior, horizontal overflow, narrow/short windows and dialogs. Inspect owner/private/public access as applicable. Record automated checks separately from live browser/database evidence; a successful Models-page test does not certify another module.

## Rollout checkpoint

The planned page sequence is implemented through Harvests in the [v0.19.15 release](v0.19.15-release.md). Models/Categories/Textures/Animations were addressed in earlier releases. Model Files remains a specialized editor. Waterings provides separate read-only Schedules and History views; unsupported mutation controls are intentionally absent. This closes the planned workspace UI implementation sequence, not every future Admin feature or specialized Overview/Marker-management page. Manual build and production deployment are User-confirmed; individual live regression cases are not separately certified.

## Tasks follow-up (User-requested)

The User explicitly requested Tasks header and bulk functionality, superseding its earlier rollout exclusion for this work. Tasks retains its standalone scroll panel and embedded natural sizing. Added the compact range/selection/delete/clear row and First/Previous/Page/Next/Last controls, with server paging and search across the authorized result set. Removed the separate filter toolbar. Existing Task order remains status/created date with an ID tie-breaker; sortable column controls are not added in this step.

Bulk deletion uses the existing authenticated single-record DELETE route sequentially, confirms once, limits IDs to the selected page and reports partial failures. Selection resets on page/search/size changes and successful reload. Request sequencing ignores stale responses; empty final pages recover after deletion. Existing API access rules and Task form relationships are unchanged.

Validation: TypeScript and `node src/lib/scripts/validate-threed-task-bulk.cjs` passed; the fixture exercises the actual bulk handler with mocked responses for cancellation, off-page exclusion and partial failures. No live SQL or browser validation performed. Review `/admin/threed/tasks`: search an older Task, change pages/page size, select/clear rows, and use disposable Tasks for confirmed deletion. Check short/narrow screens and embedded hosts. No build, commit or push performed; the User's package version edit is preserved.

Tasks refinement: Due Date now has its own column. Title, Type, Priority, Status and Due Date headers toggle server ordering before pagination; requests use an allowlist, fixed direction fragments, NULLS LAST and an ID tie-breaker. Existing callers without a sort retain the previous ordering. Selection resets when sorting changes. Priority and Status render colored text without capsule backgrounds. Selection and Actions are controls, not sortable data. TypeScript, the bulk handler fixture and diff checks passed; live SQL/date ordering and browser appearance remain manual review.

Tasks column order now follows the User request: Title, Due Date, Assigned To, Type, Priority, Status, Active, Actions (with page-selection checkbox first). Assigned To and Active use existing schema fields and server sorting; Active uses a green check/gray cross with accessible text. The Task interface now includes the existing nullable isActive field; no schema change. TypeScript and diff checks passed.

## Scene DetailsCard primary actions

Place the available Save / Move / Delete (or Remove) row immediately after the title and shared shortcuts, before Character Take/Release Control, instance fields, and module-specific features. Keep existing disabled states and module-owned edit/save behavior. This Scene DetailsCard rule applies to Models, Characters, Beds, FarmBots and Plantings.
