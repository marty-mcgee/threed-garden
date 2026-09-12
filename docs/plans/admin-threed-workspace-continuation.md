# Admin ThreeD workspace continuation

Baseline: [v0.19.13](../releases/v0.19.13.md), commit `c976c77`, User-confirmed production deployment and manual build. The User has resumed the remaining stages. Current candidate: [v0.19.15 — ThreeD Admin Pages: UI Updates](v0.19.15-release.md); the post-v0.19.14 workspace changes below remain unreleased. Earlier stage notes retain their historical status. The manual build gate remains User-owned.

## Model Animations — presentation step

**Proved:** the page is an action-to-clip mapping editor rather than a record-management table. Its Model selector and Save Mapping button scrolled away with the mapping rows. Preserve every action field, existing selection/save behavior and the specialized Model Files exception. A finite action list does not need record pagination or bulk deletion.

**Implemented:** `model-animations/page.tsx` provides a header slot for the existing controls and a bounded content area. `ThreeDModelAnimations.tsx` keeps compact mapping rows in an independently scrollable region with sticky headings; the Model summary remains above it. The standalone route joins the reviewed fixed-workspace routes in `AdminLayout.tsx`. Optional props preserve ordinary scrolling for other consumers. No API, loader, metadata-write, schema, animation runtime or physics changes.

**Validation:** TypeScript and diff whitespace checks passed. Manual checks remain: scroll all mapping fields, verify selector/Save/links remain reachable, check narrow and short windows, open clip menus near the panel edge and save a mapping on a disposable Model. No build, live writes or deployment ran.

**Existing issues found during assessment (not fixed in this presentation step):** the selector loads only the first 200 full Model records; GLTF discovery reads scene animations rather than the GLTF result's animation list; failed discovery clears the local mapping, and Save remains available once loading stops; selecting another Model while saving is allowed; None and Auto both omit the override when saved. These need a separate behavior audit and targeted coverage before claiming the animation editor is fully validated. Do not broaden those fixes into Scene runtime changes.

## Remaining sequence

1. Resolve or explicitly defer the Model Animations behavior findings above before continuing its functionality work.
2. Plants, Beds and Plantings: apply the workspace blueprint one page at a time, preserving reusable definitions versus Project instances.
3. Characters, Layers and FarmBots: preserve runtime ownership, persistent physics and integration safety.
4. Waterings and Harvests: preserve Project scope and history semantics.

Model Files retains its specialized customization UI. Tasks/Analytics remain excluded; Registration and Settings remain deferred. Keep presentation work separate from API or runtime changes and verify each page before widening the scope.

## User direction — autonomous ThreeD Animations Library

The User clarified that animations must be autonomous reusable assets, assignable to both ThreeD Models and ThreeD Characters, like shared Textures. The next behavior work therefore follows the [Animations Library design](threed-animations-library.md), rather than merely repairing the legacy per-Model clip-mapping editor. The User explicitly approved the four additive schema tables. Stage 1 now implements separate file/clip records and Model/Character assignment APIs with offline validation; live database updates remain separate. Source upload/inspection and library administration are the next stage. See the [API record](../developers/THREED_ANIMATIONS_LIBRARY.md). Existing runtime fallbacks remain intact until the bounded runtime integration stage is verified.

UI correction: Animations now has its own ThreeD sidebar entry and workspace, independent of Models. The interim Model-bound library UI and per-row shortcut were reverted. Assignment consumers remain later work; see the [standalone workspace record](../developers/THREED_ANIMATIONS_LIBRARY.md#standalone-library-workspace--corrected-ownership).


## v0.19.14 released

The autonomous Animations Library is released to production as **v0.19.14 — ThreeD Animations Library**, superseding the staged status above. Upload/bulk import, library management, Character assignment controls and both Character playback paths are implemented. The User confirmed schema application, 46 FBX uploads and the manual Character regression checklist. Final sidebar location is **ThreeD → Models → Animations**; ownership remains independent. Twelve automated release checks pass. Production deployment of `a5491e9` is User-confirmed; separate local build results were not reported. See [the release handoff](v0.19.14-release.md).

After this release, resume the remaining Admin workspace pages in the sequence above. Model animation assignment editing, compatibility preview/retargeting, persistent upload recovery and source cleanup remain separate behavior work; this release does not complete them.

## Plants — workspace presentation (after v0.19.14)

Baseline: v0.19.14 `a5491e9` and its User-confirmed documentation deployment. The worktree was clean before this step. No next release number is designated.

**Proved:** standalone Plants had a large outer heading plus a duplicate CRUD title, page-level scrolling and disappearing controls during loading. The same CRUD component is embedded in Project administration. The list fetch is capped at 100, search filters only fetched rows, and Type/Status/Active controls do not affect the query. These query defects require a separate behavior step.

**Acceptance/implementation:** remove duplicate heading; use AdminWorkspaceHeader for compact title/count/search/Add Plant/Models/Plantings links; constrain only `/admin/threed/plants`; opt the standalone CRUD into a scrollable records panel with sticky column headings. Preserve natural embedded sizing, every care/Model field and existing mutation handlers. Keep loading, empty and error/Retry rows inside the persistent table. Preserve compact `py-1` records, use text status and check/X Active icons, and allow horizontal scrolling instead of hiding fields on smaller screens.

Affected files: `src/app/admin/threed/plants/page.tsx`, `src/components/admin/threed/plants/ThreeDPlantsCRUD.tsx`, and the exact-route allowlist in `src/components/admin/layout/AdminLayout.tsx`. No API, schema, Scene or Project-instance behavior changed.

**Validation:** TypeScript and `git diff --check` passed. No build, browser automation or live mutation ran. Manual checks: scroll Plants vertically and horizontally, confirm header/sidebar/column headings remain reachable, open create/edit dialogs, and verify embedded Plants in Project administration retains natural height.

**Next separate step:** server pagination/search/filter/sort and page-local selection using existing deletion protections. Review shared count filters, owner scoping (including OR-search grouping), bounds and related-Model query batching before enabling controls. Do not claim the current count/search covers more than the existing 100-record fetch; search is labeled “loaded Plants” for this intermediate step. Then continue Beds and Plantings individually.

Plants toolbar refinement: User requested smaller toolbar text, wider dropdowns and right-aligned filters. Add Plant/related links and filter controls now use 11px text; filter triggers have a nonshrinking 160px minimum with automatic width, and menus have a 180px minimum with matching compact option text. The filter row aligns right and wraps on narrow screens. Create/edit form sizing and shared UI primitives are unchanged. TypeScript and diff checks passed; visually confirm all filter labels fit in both closed and open menus.

## Plants — server list and bulk selection

**Proved:** the list was capped at 100 with client-only search, inactive filter controls, unbounded API paging and one related-Model query per row. Search OR terms also lacked explicit grouping within the owner predicate. Acceptance: search/filter/sort the complete owned result set before pagination, share count filters, bound inputs, preserve stable ordering, isolate stale responses, and reuse single-record deletion for selected current-page Plants.

**Implemented:** `plant-list-query.ts` bounds page sizes to 1–200, offsets, search length, booleans and sort/direction. GET validates type/status against existing schema enums; grouped search remains inside owner scope. Common Name, ID, Type, Status, Maturity and Active headings sort on the server with an ID tie-breaker. Existing consumers retain default created-desc ordering and the same response shape. Model enrichment uses one batched lookup, preserving existing relationship behavior.

Plants now offers 25/50/100/200 per page, range/total, page navigation, functional Type/Status/Active filters, whole-result search, current-page selection, clear selection and confirmed sequential bulk deletion. Changes reset selection; requests are debounced and aborted/ignored when superseded. Mutations reload totals; an emptied final page recovers to the last valid page. Bulk errors report partial completion and preserve the existing DELETE endpoint/database restrictions. No new deletion API, schema or cascade behavior was introduced. The previously limited “loaded Plants” search label is superseded.

Affected behavior files: Plants CRUD, Plants API and the new query parser. The existing presentation work remains intact, including 11px right-aligned filter controls and optional standalone scrolling. The Model picker inside create/edit forms still uses its pre-existing 100-Model fetch; this step changes the Plants record list only.

**Validation:** TypeScript, `npm run validate:threed-plant-list` and diff checks passed. The offline fixture executes the actual GET handler with queued database responses and the real bulk-delete handler with mocked requests. It covers auth/input rejection, owner/search grouping, count/filter parity, all sort directions, 1/50/200-row constant query counts, and partial deletion limited to selected current-page rows. The validator is included in CI. No build, live database operation or deletion ran.

Manual acceptance: search for an older Plant beyond the first page; combine filters and clear them; sort each heading both ways including ties/null maturity; switch page sizes and rapidly search/page; select and clear rows; cancel deletion; delete disposable rows with and without an API failure; delete an entire final page and confirm recovery. Recheck standalone scrolling and embedded Project sizing, and open create/edit forms to confirm their fields remain intact.

Plants simplification: at the User's request, removed the dedicated Type/Status/Active filter toolbar and its client state, so no hidden filter can constrain the list. Header search, sorting, pagination and selection remain available; API filter support is retained for other consumers. Columns now read Common Name, ID, Type, Maturity, Status, Active, Actions (after the selection checkbox). Status and Active are adjacent. TypeScript and diff checks passed; this supersedes earlier manual instructions to exercise filter dropdowns on the Plants page.

Plants row icon refinement: every Common Name now uses the same green Lucide Sprout (seedling) icon, per the User’s final color preference, matching the Models blueprint's consistent row identity. Removed the unused type-dependent icon helper/imports; the Type column remains unchanged. TypeScript and diff checks passed.

Plants Type badges now use transparent backgrounds with subtle type-colored outlines and matching text; dark-mode text uses lighter shades for readability. Capsule shape and type colors are retained. Changes are local to the Plants Type column, with no shared Badge component change. TypeScript and diff checks passed.

## Beds — workspace presentation

**Proved:** standalone Beds repeated its title, scrolled the entire workspace and replaced the controls with a spinner during loading. The CRUD component is also embedded in Project administration. Status/Active toolbar controls were disconnected from the list query. The current list remains a 100-record fetch with local search; full server-list behavior is the next separate step.

**Implemented:** Beds now uses the compact shared workspace header with search/Add Bed and Plants/Plantings links, 11px toolbar actions, no separate Filters toolbar, compact rows, one amber Box icon per Bed, outlined amber Shape badges, and adjacent text Status/check-X Active columns. The standalone `/admin/threed/beds` route opts into a bounded records panel with sticky headings and horizontal scrolling; Project-embedded Beds keep natural height. Loading, empty and error/Retry states occupy the table. All dimension, shape, soil, positioning, rotation, scale, color and note form fields and mutation handlers are preserved. No Scene, API, schema or Project-instance behavior changed.

Affected files: `src/app/admin/threed/beds/page.tsx`, `src/components/admin/threed/beds/ThreeDBedsCRUD.tsx`, and the exact-route workspace list in `AdminLayout.tsx`. Existing uncommitted Plants work is preserved.

**Validation:** TypeScript and diff checks passed. No build, live writes or browser validation ran. Manual acceptance: verify stationary header/sidebar and sticky columns during records scrolling, narrow-screen horizontal scrolling, create/edit dialogs with dimensions and position fields intact, and natural sizing in Project administration.

Next: bounded server pagination/search/sorting and page-local bulk selection for Beds, preserving the existing deletion contract. Then continue Plantings. Search is labeled “loaded Beds” until the existing 100-record limit is addressed.

## Beds — Models/Plants header and toolbar parity

**Proved:** the presentation checkpoint lacked the blueprint pagination/selection row, and search covered only 100 loaded Beds. Acceptance: compact header plus working range/selection/page controls, server search/sorting, no separate Filters toolbar, and retained standalone scrolling and embedded sizing.

**Implemented:** header search now queries the full owned Beds collection. The toolbar shows range/total, selected count, Delete selected, Clear selection, page sizes 25/50/100/200 and First/Previous/Next/Last with 11px button text. Table headings sort Name, ID, Shape, Dimensions (width then length), Position (X then Z), Status and Active; ID breaks ties. Search, sorting and paging clear selection; superseded reads are aborted/ignored. Confirmed bulk deletion uses the existing DELETE endpoint sequentially and reports partial failures. Refresh after mutations updates totals and recovers an empty final page. The existing status/active API filters remain supported without a separate UI toolbar.

Affected files: Beds CRUD, Beds GET route, new bounded list-query parser and offline validator, package/CI validation registration. Search OR predicates are explicitly grouped under owner restrictions. No schema, live database, Scene or deletion-contract changes. Previous Plants and Beds presentation work is preserved.

**Validation:** TypeScript and the offline Beds validator passed; diff checks passed. No production build or live writes ran. This supersedes the previous 100-record limit and “loaded Beds” description.

**Manual acceptance:** on Admin → ThreeD → Beds, compare header/toolbar density with Plants; scroll records with headers visible; search older records; sort each heading in both directions; change page size and navigate rapidly; select/clear rows and cancel deletion; delete disposable selected Beds, including the last page. Confirm create/edit fields and embedded Project sizing remain intact. Live PostgreSQL execution and visual checks remain User-owned.

Next remaining sub-module: Plantings.

Pagination alignment refinement: Plants and Beds now place the page indicator between Previous and Next, matching Models: First / Previous / Page N of M / Next / Last. Navigation behavior and compact button sizing are retained. TypeScript and diff checks passed.

## Plantings — workspace presentation

Plants and Beds presentation is User-accepted. Continued the next planned sub-module, Plantings.

**Proved:** Plantings repeated its title, displayed disconnected Status/Active filters and replaced the entire CRUD with a loading spinner. Its table hid fields on smaller screens. Project administration embeds the same CRUD, requiring opt-in viewport sizing. Acceptance: shared compact header, persistent controls, bounded standalone records with sticky headings, all columns available horizontally, adjacent Status/Active, and unchanged specialized forms.

**Implemented:** shared Plantings header with loaded-record count/search, Add Planting and Plants/Beds links; 11px header actions; removed disconnected filter controls. Standalone Plantings opts into the same records scroll panel as Models/Plants/Beds. Compact rows retain green Sprout identity, use outlined Growth badges, plain colored Status and green check/gray X Active. Loading, empty and error/Retry states now stay inside the table. Embedded Project instances keep natural height. Plant/Bed/Model selection, growth/health/date and positioning forms, mutation endpoints and Scene paths are preserved.

Affected files: standalone Plantings page, ThreeDPlantingsCRUD, exact-route AdminLayout workspace list. No API/schema/live database changes. The existing 100-record fetch and local search are retained and labeled as loaded Plantings; server pagination, sorting and bulk selection remain the next functional stage.

**Validation:** TypeScript and diff checks passed. No build or browser test ran. Manual check: Admin → ThreeD → Plantings, scroll records while header/sidebar remain stationary, view all columns on narrow screens, check empty/search results, open create/edit forms, and confirm natural sizing inside Project administration.

## Plantings — server list and selection

**Proved:** the record list was limited to 100 locally searched rows. GET ran separate Plant and Bed queries per record and used ungrouped search OR expressions. Acceptance: blueprint pagination/selection toolbar, full owned-result search and sorting with consistent totals, stable IDs, bounded inputs, and preserved deletion and form contracts.

**Implemented:** 25/50/100/200 page sizes; First / Previous / Page N of M / Next / Last; current-page checkboxes, Clear selection and confirmed sequential Delete selected. Search covers Planting ID, Plant common name, Bed name and notes. Sortable ID, Plant, Bed, Growth, Position (X then Z), Status and Active headings use stable ID ties. Superseded reads are aborted/ignored; paging/search/sort clears selection. Mutation refresh recovers an emptied final page, and bulk failures report partial completion.

GET now uses two queries with identical owner-scoped Plant/Bed left joins and grouped search conditions for count and page, replacing per-record lookups. Relation payloads retain nested Plant/Bed objects. Invalid page, sort, direction, boolean, status and relation-filter IDs return 400. Existing GET defaults, single-record GET and mutation endpoints remain intact. No schema, live database, Scene or Project-marker changes. Existing form pickers retain their separate 100-option fetch limits. This supersedes the previous Plantings record-list cap.

Affected files: Plantings CRUD/API, new planting-list-query parser and offline validator, package/CI validation registration. Earlier Plants/Beds work remains preserved.

**Validation:** TypeScript, `npm run validate:threed-planting-list` and diff checks passed. Offline tests cover input/auth rejection, count/search/join parity and owner scope, page bounds, every sort direction, default sort, constant two-query counts for 1/50/200 rows, cancellation and partial bulk deletion limited to selected page rows. These checks mock the database; live SQL and browser rendering remain manual. No build or live deletion ran.

Manual acceptance: open Admin → ThreeD → Plantings; search an older record by ID/Plant/Bed/notes; sort headings both ways, including missing Bed links; switch page sizes and navigate/search rapidly; select/clear rows and cancel deletion; test deletion on disposable records including an entire final page; verify forms and Project-embedded sizing. Next planned module: Characters, retaining its specialized animation assignments and runtime separation.

Plantings column-order refinement: Plant / Bed / Planting ID / Position / Growth / Status / Active / Actions, following the selection checkbox. Header sort keys and row cells remain aligned. TypeScript and diff checks passed.

Plantings row icon color: the Plant seedling now uses `text-blue-500`, matching the workspace header. The Plants page retains its approved green icon. TypeScript and diff checks passed.

Plantings row icon refinement: replaced the blue seedling with a brown Lucide Bean (`#a87950`), per the User’s latest preference. TypeScript and diff checks passed.

Plantings header now also uses the brown Bean icon, matching its rows. The color override is scoped to this header; shared workspace defaults are preserved. TypeScript and diff checks passed.

## Characters — workspace presentation

Plantings presentation is User-accepted. Continued to Characters.

**Proved:** Characters duplicated its title, replaced all controls while loading, displayed disconnected Type/Status/Active filters and hid table fields on smaller screens. Project administration embeds the same CRUD. Acceptance: compact shared header, stationary standalone controls/sticky headings, scrollable compact records, adjacent Status/Active, and preserved Character forms/animation assignment dialog and embedded sizing.

**Implemented:** shared Characters header with purple Users icon matching the rows, loaded-record search/count, Add Character and Models/Animations links. No separate Filters toolbar. All columns remain available via horizontal scrolling: Name, ID, Type, Position, Status, Active, Actions. Type badges have colored outlines, Status uses plain colored text, Active uses green check/gray X. Loading, empty and error/Retry states occupy the records table. Only the standalone route opts into viewport constraints; Project embeddings retain natural height. Existing animation-assignment entry/dialog, movement configuration, Model selection and create/edit fields remain intact.

Affected files: Characters route, ThreeDCharactersCRUD and exact-route AdminLayout workspace list. No API/schema, animation or Scene runtime changes. Existing 100-record fetch/local search and Model picker limit remain for this presentation stage.

**Validation:** TypeScript and diff checks passed. No build, live writes or browser validation ran. Manual acceptance: Admin → ThreeD → Characters; check header/record scrolling and narrow-screen horizontal access, open create/edit and per-Character Animations dialogs, and verify Project-embedded sizing.

Next Characters stage: bounded server pagination/search/sorting and page-local bulk selection, preserving existing deletion and animation assignment contracts.

## Characters — server list and selection

**Proved:** the Admin list searched only 100 loaded Characters; GET used per-record Model lookups and ungrouped search OR conditions. Acceptance: bounded full-owner-result paging/search/sorting, blueprint selection toolbar, preserved existing Model visibility/Character Library eligibility and animation-assignment contracts.

**Implemented:** 25/50/100/200 page sizes, First / Previous / Page N of M / Next / Last, current-page selection, clear selection and confirmed sequential bulk deletion through the existing DELETE endpoint. Sortable Name, ID, Type, Position (X then Z), Status and Active use stable ID ties. Search/paging/sorting clear selection; superseded reads are aborted/ignored. Mutations refresh totals and recover an emptied final page; bulk failures report partial completion. Animation and Edit actions are disabled during bulk deletion.

GET validates page/sort/direction/boolean/status/type inputs and groups search under owner restrictions. Related Models are fetched once per page with authoritative modelSelection; existing owner or public-library visibility and Garden/Ecctrl eligibility remain applied. Default createdAt descending order, single-record GET and mutation endpoints are retained. The scope=library path retains its existing post-page eligibility filtering and eligible-on-page total; this change improves Admin pagination without redefining Library paging. Model form-picker limits remain separate. No schema, live database, Scene or animation runtime changes.

Affected files: Characters CRUD/API, new character-list-query parser and offline validator, package/CI validation registration. Earlier workspace work is preserved.

**Validation:** TypeScript, `npm run validate:threed-character-list` and diff checks passed. Offline tests cover auth/invalid inputs, grouped owner search, count/filter parity, every sort direction, constant Model lookup count for 1/50/200 rows, private Model exclusion, Garden/Ecctrl library eligibility, default ordering and partial deletion restricted to selected page rows. No build or live writes ran.

Manual acceptance: Admin → ThreeD → Characters; search older records, sort headings, change pages/sizes rapidly, select/clear rows, cancel deletion and test disposable records including an emptied final page. Open per-Character Animations and Edit, and check embedded Project sizing. Verify Add to Scene → Character Library still lists eligible Characters. Next planned module: Layers.

Characters Name-column refinement: removed the Inactive and Mobile tags beside the name. The common icon, Active column and movement configuration remain intact. TypeScript and diff checks passed.

## Layers — workspace presentation

**Proved:** Layers duplicated its title, used a separate filter toolbar and hid all controls while loading. The CRUD is also embedded in Project administration, including a Project-scoped host. Acceptance: compact shared header/search, standalone scrollable records with sticky headings, compact rows and preserved Project-specific forms, color swatches, visibility/lock actions and natural embedded sizing.

**Implemented:** one Layers header with cyan icon, loaded-record count/search and 11px Add Layer action; omitted the Type/Active filter toolbar in line with the workspace preference. The standalone Layers route opts into bounded records scrolling; all columns remain available horizontally. Active uses green check/gray X and the redundant name-adjacent Inactive tag is removed. Loading, error/Retry and empty results remain inside the table. Color swatches, Includes, Visible and Locked information, form fields and mutation handlers are retained.

Affected files: Layers page, ThreeDLayersCRUD and exact-route AdminLayout workspace list. No API/schema, Project relationship or Scene visibility/physics changes. Existing 100-record list fetch and local search remain; server pagination/sorting/bulk selection is the next functional stage and must preserve projectId scoping.

**Validation:** TypeScript and diff checks passed. No build or live writes ran. Manual acceptance: Admin → ThreeD → Layers, verify fixed header/sidebar and sticky columns, horizontal overflow, create/edit forms, visibility/lock actions, and Project-embedded layout. Browser checks remain User-owned.

## Layers — server list and selection

**Proved:** the list searched only 100 loaded Layers; GET accepted unbounded page inputs and ungrouped search OR conditions. Acceptance: full owned-result pagination/search/sorting with Project filtering preserved, stable totals and page-local bulk selection using the existing deletion path.

**Implemented:** 25/50/100/200 page sizes, First / Previous / Page N of M / Next / Last; sortable Name, ID, Type, Visible, Locked and Active (Includes remains informational). Current-page selection, Clear selection and confirmed sequential Delete selected report partial failures. Search/paging/sorting reset selection; superseded reads are aborted/ignored and mutations refresh totals with empty-final-page recovery. The query follows projectId prop changes and retains owner/active Project asset restrictions. Visibility/lock/edit controls are disabled during bulk deletion.

GET validates bounds, sort/direction, booleans and Project IDs; malformed Project filters can no longer fall through to the unscoped owner list. Count and rows share the grouped owner/search/Project predicates. Default createdAt descending and single-record GET remain intact. The existing DELETE removes the Layer and its owner-scoped Project asset links; bulk deletion has the same global source-deletion meaning, not Project unlinking. No schema, live database, Scene or physics changes.

Affected files: Layers CRUD/API, new layer-list-query parser and offline validator, package/CI validation registration. Previous workspace work is preserved.

**Validation:** TypeScript, `npm run validate:threed-layer-list` and diff checks passed. Mocked API/bulk tests cover auth/invalid inputs, grouped owner search/count parity, every sort direction, bounded page sizes, active owner Project links, empty Project responses, default ordering, cancellation and partial deletion restricted to page targets. No build/live writes or browser tests ran.

Manual acceptance: Admin → ThreeD → Layers, test search, sorting, page sizes/navigation and selection. Use disposable Layers for deletion, including the final page. Recheck visibility/lock and edit controls, and Project-embedded lists to verify Project scope and natural sizing. Next planned module: FarmBots, preserving physical-operation gates.

Layers column simplification: removed the redundant Visible and Locked table columns; their existing Actions buttons retain state indicators and toggles. Empty/loading/error cell spans now match the seven remaining columns including selection. TypeScript and diff checks passed.

Layers Visible/Locked columns restored at the User’s request to expose their existing server sorting. State icons have accessible labels; Actions controls remain available. This supersedes the preceding column-removal note. TypeScript, Layers list validation and diff checks passed.

## FarmBots — workspace presentation

Layers presentation is User-accepted. Continued to FarmBots.

**Proved:** FarmBots duplicated its title, displayed disconnected Status/Active filters, hid controls while loading, and hid table fields on narrow screens. Its inline connection portal and MQTT activity rows require preserving specialized table content; Project administration also embeds the CRUD. Acceptance: compact shared header, standalone scrollable records/sticky headings, retained inline panels and embedded sizing, adjacent Status/Active and unchanged device-operation paths.

**Implemented:** FarmBots shared header with slate Bot icon, loaded-record search/count, 11px Add FarmBot and Beds link. Removed disconnected filter toolbar. All columns remain available horizontally: Name, Asset code, Battery, Position, Status, Active, Actions. Status uses plain colored text and Active green check/gray X. Loading/error/Retry/empty states occupy the table. Connection and MQTT activity expansion rows and portal content, battery display, forms and device-control handlers are preserved. Standalone route opts into viewport layout; Project embeddings retain natural height.

Affected files: FarmBots page, ThreeDFarmbotsCRUD, exact-route AdminLayout workspace list. No API/schema, credentials, MQTT connections, physical commands or Scene behavior changed. The 100-record fetch/local search remains for this presentation stage.

**Validation:** TypeScript and diff checks passed. No build, live database or device operation ran. Manual acceptance: Admin → ThreeD → FarmBots; verify header/records scrolling, horizontal access, create/edit forms, expanding/closing connection and activity panels, and Project-embedded layout. No device action is needed to review presentation.

Next: review FarmBots server pagination/sorting and selection against its specialized connection lifecycle and deletion restrictions before implementing the next functional stage.

## FarmBots — server list and selection

**Proved:** the list searched only 100 loaded records and GET issued a Bed lookup per FarmBot. Search OR conditions needed grouping under ownership. Deletion already uses an owner-scoped transaction for the FarmBot and MQTT runtime/events; connection/activity panels are tied to a visible row.

**Implemented:** bounded 25/50/100/200 pagination, blueprint navigation order and selection toolbar, sortable Name/Asset code/Battery/Position/Status/Active, whole-result search and confirmed sequential bulk deletion using the existing DELETE endpoint. Mutation refresh updates totals and recovers an emptied final page; selection clears on search/sort/page changes and superseded reads are aborted/ignored. Open connection/activity panels pause paging, search, sorting and deletion, with a short explanation; closing panels restores list controls. Row actions are guarded during bulk deletion.

GET validates list bounds/sort/direction/boolean/status and shares grouped owner/search conditions for count and page. Related Beds are fetched in one owner-scoped query. All response records still pass through the existing sanitizer and credentialConfigured derivation. No schema, credential handling, MQTT connection, physical command or runtime change. Existing single-record GET, device endpoints and transactional DELETE are retained; Bed form picker limits remain separate.

Affected files: FarmBots CRUD/API, new farmbot-list-query parser and offline validator, package/CI validation registration. Previous workspace work is preserved.

**Validation:** TypeScript, `npm run validate:threed-farmbot-list` and diff checks passed. Actual-handler offline fixtures cover auth/bounds, grouped owner search/count parity, all sort directions, constant Bed-query counts for 1/50/200 rows, sanitized response fields, cancellation, panel/busy guard and partial page-local bulk deletion. No build, live database writes or device action ran.

Manual acceptance: Admin → ThreeD → FarmBots; search/sort/page and select/clear rows. Open connection/activity panels and confirm navigation pauses until closed. Recheck Edit and embedded Project layout. Use disposable records for deletion checks; deletion retains its existing MQTT history/runtime cleanup. Live SQL/browser checks remain User-owned. Next planned pages: Waterings and Harvests.

## Waterings — scope audit before workspace changes

**Proved:** the sidebar Waterings link opens `/admin/threed/watering-schedules`, whose page title is Garden Tasks. `ThreeDWateringSchedulesCRUD` is actually a Plantings editor: GET/POST/PUT/DELETE all target `/api/threed/plantings`, and its forms use Planting growth/harvest fields. Styling it as a Waterings workspace would preserve misleading record ownership and actions. Project administration also embeds this component.

Actual watering infrastructure: `threedWateringSchedules` stores frequency, timing, durationMs, volumeMl, next/last watering, active/weather/recurrence settings and Plant/Planting/Bed/FarmBot relations. `/api/threed/watering-schedules` currently supplies authenticated GET only. `threedWateringHistory` is separate; targeted watering writes history through the established world-actions route. Schedule CRUD and a history browsing API are not supplied by this page.

No implementation changed in this audit. Product clarification is needed on whether Waterings should primarily show schedules, completed history, or both before defining its columns/forms. Recommended split: schedule management and a separate history view; preserve all existing Character world-action and physical-device gates. Schema and live database changes are not necessary merely to establish the correct page identity.

## Waterings — separate Schedules and History views

User confirmed both views and noted early development. Implemented a read-only first checkpoint after proving the existing page was a misplaced Plantings editor. Replaced that component's Planting writes/forms with correct schedule/history tables, keeping its exported name/host props to preserve Project embedding. No repository restructuring or schema changes.

Schedules uses the existing authenticated `/api/threed/watering-schedules` GET, now with validated bounds/IDs/booleans, grouped Schedule ID/notes search, numeric total and stable ID ordering. History uses new authenticated GET `/api/threed/watering-history`, restricted to the signed-in owner with optional Plant/Planting/FarmBot/Schedule filters and history-ID/status/reason search. Both views support 25/50/100/200 pagination, refresh, abortable debounced reads, separate tab identity, loading/error/Retry/empty states, compact records and the standard navigation order. Changing view resets search/page. Standalone scrolling is opt-in; embedded Project sizing remains natural. Default API page size remains 50 for existing consumers.

Schedules shows frequency, next/last watering, duration in ms, volume in mL, target IDs, active and notes. History shows execution time/status, recorded duration/volume, targets, schedule ID, executor and failure/skip reason. Null measurements display a dash, not zero. No unsupported create/edit/delete or execute buttons are shown. Targets are explicit record IDs pending richer relationship navigation.

Scope limit: History has no recorded Project identity. If moduleId is supplied, History uses current active owner-scoped Planting/Schedule Project asset links. This is stated in the embedded UI; it is not a historical Project attribution claim. Standalone history shows all owned records, including manual Character watering. History creation and Character completion semantics remain untouched. No live writes, physical operation, schedule execution, MQTT or schema changes.

Affected files: watering-schedules page/CRUD/API, new watering-history GET and shared watering-list-query parser, exact-route AdminLayout list, offline validator and package/CI registration. The former Garden Tasks title is replaced with Waterings.

Validation: TypeScript, `validate:threed-watering-list` and diff checks passed. Actual GET-handler fixtures with mocked DB test bounds/auth, grouped owner/search count parity, pagination and module scope; they also verify removal of Planting mutation paths from the workspace. No build or live/browser test ran.

Manual acceptance: Admin → ThreeD → Waterings; switch Schedules/History, search each, page/resize/refresh, verify units and blank measurements, and compare known completed watering records. Empty Schedules is valid when none exist. Verify Project embedding and the current-link scope note. Schedule editing, richer target labels/navigation, history details and any execution remain future work. Next workspace page: Harvests.

## Harvests — workspace presentation checkpoint

User accepted the Waterings two-view approach and requested Harvests next. Inspection found a duplicate page title, a separate search/filter toolbar, whole-component loading replacement, breakpoint-hidden columns and redundant Active badges. Acceptance for this step: shared compact header that remains visible while records load/scroll, all columns reachable, preserved quantities/units, Project scope and record-management forms.

Applied AdminWorkspaceHeader with orange Package icon, loaded-record search, Project selector, Add Harvest, Refresh and Plantings navigation. Removed the separate Filters toolbar. Standalone Harvests opts into bounded records scrolling and sticky column headings through its exact AdminLayout route; embedded Project usage retains natural sizing. Rows retain World Action provenance and use green Check/gray X Active indicators. Loading, failed-load/Retry and empty states now occupy the table. Create/edit/delete behavior, quantities, units, Project associations and world-action persistence are unchanged.

Validation: TypeScript and diff checks passed. No build, live database writes or browser testing ran. Existing 100-record fetch/local search remains explicitly a presentation-stage limit; server pagination, sorting and page-local bulk selection are the next step, preserving Project scope and World Action provenance.

Manual acceptance: Admin → ThreeD → Harvests; check header/sidebar remain stationary while records scroll, narrow-screen access to every column, Project selection, Refresh and Add/Edit form layout. Compare displayed quantities/units and World Action badges with known records; also check embedded Project layout.

## Harvests — server list and bulk-selection checkpoint

After User acceptance of presentation, inspection proved search/Project filtering only considered the first 100 loaded records. Acceptance: full owner-scoped pagination/search/Project scope, stable sortable columns, page-local confirmed bulk deletion, retained provenance/units and existing mutation APIs.

Implemented server search across Harvest ID, notes and resolved Plant name (including owner-scoped Planting fallback). Shared WHERE conditions govern rows and numeric total. GET validates limits 1–200, offsets, IDs, sort/direction, search length and optional isActive. Defaults remain 50 records, harvest date descending, with stable creation/ID ties. Existing active Project/module association scope and batched enrichment remain. Numeric quantity/weight sorting uses stored decimal values; quantity units remain displayed and are not converted.

Workspace now has 25/50/100/200 pages, First/Previous/Page/Next/Last, sortable ID/Plant/Quantity/Weight/Date/Active, debounced abortable reads, last-page recovery, and page-only selection cleared on list changes. Project filtering runs before pagination. Confirmed bulk deletion sequentially uses the existing owner-scoped DELETE (including existing Project-link cleanup), reports successes/failures and refreshes. Single-delete pending state prevents overlapping bulk deletion. Existing Create/Edit forms and world-action persistence remain unchanged. Related form option loaders retain their existing 100-record limits; this step addresses the Harvest records list.

Validation: `npm run typecheck`, `npm run validate:threed-harvest-list`, and diff checks passed. The new offline fixture exercises real GET and bulk handler code with mocked DB/fetch: bounds/auth, owner and grouped search, scope/count parity, all sorting directions, default ordering, Planting-derived Plant enrichment, World Action provenance, off-page selection exclusion and partial/cancelled deletion. Registered in package/CI. No build or live database/browser tests ran.

Manual acceptance: Admin → ThreeD → Harvests; page and change page size, search a known older Harvest/Plant, select a Project, sort each heading both ways, confirm selection clears on list changes. With disposable records, cancel then confirm bulk deletion; test deletion on the last page and verify totals/recovery. Verify existing Add/Edit, units and World Action badges remain correct, including Project embedding.

Harvests column refinement: User requested Harvest Name | Plant | ID | Quantity | Weight | Date | Active | Actions. Schema inspection confirms no separate name/status field: Harvest Name displays the existing editable harvestId, while ID displays the numeric record id with server sorting. Active retains check/X semantics. Orange Package and World Action provenance move with Harvest Name. Updated table state colspans. TypeScript, Harvest list validation (including numeric ID sort) and diff checks passed; no schema changes or build.

## Milestone review — v0.19.15 candidate

User accepted Harvests and approved milestone validation/release preparation. The planned eight-page sequence is implemented. Reviewed exact-route viewport opt-ins, embedded defaults, compact headings, selection/pagination layouts, preserved specialized actions, changed GET scopes and CI registration. No additional feature changes were needed during this review. Earlier proposed “remaining sequence” entries above are historical; use the candidate handoff for current status.

TypeScript, all eight new list validators, and Model list API/database failure/Character position/animation restart/assignment editor regression fixtures passed (14 commands total); diff checks passed. User's incremental visual acceptance is recorded separately from pending final live CRUD/Project embedding and manual build. Package advances to 0.19.15; v0.19.14 remains production until deployment is confirmed. No build, database updates, commit or deployment performed. See [release scope, limitations and smoke checklist](v0.19.15-release.md).

Manual build confirmation: User supplied successful `npm run build` output for package 0.19.15: compilation, TypeScript, page-data collection, 110/110 static pages and final optimization completed. This supersedes the pending-build status above. Deployment and the full live smoke checklist are not separately confirmed.
