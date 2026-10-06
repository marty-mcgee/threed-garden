# Public Project asset loading — authorization audit

> Historical record: version/status statements below apply to this named checkpoint. Current App documentation: [v0.23.0 — ThreeD Garden](../releases/v0.23.0.md).

Status: revised non-blocking Scene warning policy implemented locally and validated offline; browser acceptance and deployment pending. Production checkpoint remains v0.22.1.

## Evidence

The User reproduced incomplete production rendering while signed out at `/dashboard/scene?projectId=8`. The screenshot shows 401 responses for Model details, Ground Maps, Sensor Groups and Animation Action Slots, plus separate Blob 404 responses. This supersedes the earlier download-delay hypothesis as the explanation for the observed authorization failures. Exact missing Blob paths and causes have not been established. No live database or asset permissions were changed.

## Original implementation audit

- `src/app/api/map/threed/route.ts`: anonymous bootstrap checks Project `isPublic`. Signed-in requests currently require Project ownership, so signed-in non-owners also need coverage. Bootstrap already hydrates referenced Models and Files through current relationships. Referenced Model queries filter by IDs; attached Files are filtered to the Model owner. These queries do not independently enforce Model public/library classification. `includeInactive` is accepted from the request. Public serialization and inactive visibility must be audited before extending responses.
- `src/components/threed/markers/ModelMarker3D.tsx`: loadModelAttachments re-fetches `/api/threed/models?id=...`; denied requests become an empty attachment list. The request cache is keyed by Model ID, so any future viewer/Project-specific request must preserve scope in caching.
- `src/libraries/services/threed/models/character-model-textures.ts`: the same authenticated fetch throws on denial, matching the screenshot's Character texture-reference error.
- `src/app/api/threed/models/route.ts`: GET rejects anonymous requests before applying its owner-or-public-library eligibility checks. It enriches files with material assignments and conditionally supplies FBX texture fallbacks. It is not a suitable endpoint to expose wholesale to guests.
- `src/components/map/details/DetailsCard.tsx` also fetches authenticated Model details. Guest selection must use authorized runtime data rather than editor hydration.
- `src/components/map/ThreeDScene.tsx`: Ground Map GET runs for a Project without a viewer-capability check. `src/app/api/threed/ground-maps/route.ts` requires authentication and Project ownership.
- `src/components/threed/physics/SensorGroupsWorkspace.tsx`: uses the owner-only Sensor Groups endpoint. Its server GET locks the Project row in a transaction; public rendering should use a pure read rather than route guests through this management workspace.
- Animation Action Slots GET uses `animationResponse(listActionSlots)`; trace its runtime consumer and necessary semantic data before deciding whether to omit the request or provide a bounded Project-scoped projection.

## Approved approach

Prefer extending the existing Project bootstrap with a minimal rendering projection rather than creating an anonymous version of the Model administration API. Centralize Project read authorization and return viewer capabilities. Authorize referenced Models through active Project relationships, with an explicit distinction between public-Project rendering and reusable-library discovery; do not silently make private assets public. Cover Character, Plant and Planting references as well as direct Model markers.

Supply authorized attachments/material assignments and Ground Map rendering data in that projection. Make Model/Character loaders and guest DetailsCard consume it without authenticated follow-up requests. Keep missing and intentionally empty attachment sets distinguishable. Preserve established authenticated Admin/editor behavior. Gate owner-only workspaces and mutations using capabilities; hiding controls is not a substitute for server checks.

The User approved public-Project rendering of the owner’s assigned Models even when those Models are not public Library items. This does not authorize Library browsing, editing, unrelated Models or another owner’s private assets.

## Acceptance and next verification

Use mocked route/service tests for anonymous public rendering, anonymous private denial, signed-in non-owner public viewing, unrelated/cross-owner asset denial, inactive assignment handling, minimal response fields, and unchanged mutation authorization. Verify required Texture/material/support-file references reach each runtime loader with no Admin API dependency. Preserve cache isolation across Project/viewer changes. Run TypeScript and the existing relevant Model/Character/Project runtime checks.

Then compare signed-in and signed-out browser loading of the same public Project, including Character rendering and guest selection. Track Blob 404s separately: capture exact nonsensitive paths and assignment references before proposing repair; a 404 alone does not establish whether a file is deleted or a dependency URL was resolved incorrectly.

The original audit was documentation-only. Implementation and verification are recorded below.


## Implemented policy

- Project bootstrap and availability checks accept owners or public viewers, including signed-in non-owners. Ownerless Projects are denied. Active module/asset assignments are scoped to the Project owner; guests cannot enable `includeInactive`.
- Referenced Models must belong to the Project owner or qualify as active public Library Models. Read-only viewers receive active Models only. Files and explicit material textures are scoped to the Model owner. The initial implementation limited guest aliases to explicit assignments. The Scene Loading Policy correction below supersedes that restriction with scoped, primary-file-referenced texture resolution for every authorized viewer.
- Hydrated Model data carries `renderingAssetsResolved`; Model and Character loaders consume these resources without requesting the authenticated Model endpoint. Current snapshot resources override stored asset URLs. Guest loading bypasses the owner detail-request cache. Owner detail refresh and Admin access remain authenticated.
- Ground Map GET uses Project read authorization and returns rendering fields for the Project owner’s map. Sensor Group GET is a pure Project-authorized read with no row lock or mutation. Upload/delete/PATCH authorization remains owner-only.
- Server-issued `canEdit` travels through the Project session. Read-only viewers see a Project label rather than management toolbar/DetailsCard, and owner Library/setup panels are neither restored nor opened. This also removes the guest DetailsCard Action Slot fetch. The read-only view does not provide the owner’s Character action editor. Server mutation checks remain authoritative.
- Public bootstrap, Ground Map and Sensor Group responses use private/no-store caching. No schema changes, live data edits, storage changes or deployment were performed. Missing Blob files remain a separate investigation.

## Verification completed

`npm run typecheck` and `git diff --check` passed. All 41 `npm run validate -- ci` tasks passed. Focused Sensor Group handler tests and Ground Map/Project bootstrap tests passed with mocked DB responses. Added assertions cover anonymous and signed-in public reads, private denial, unrelated/cross-owner resources, inactive resources, owner capability, current snapshot authority, minimal file/Ground Map fields, and denied anonymous writes. Character loading tests prove authorized Project resources (including an intentionally empty file list) do not call the Admin Model API.

The existing database-failure fixture was updated for the new policy dependency and required Project owner; retry/error assertions remain intact. The final owner compatibility adjustment was rechecked with the actual-route fixture and TypeScript.

Before release, manually open Project #8 in a signed-out/private browser and an owner session; confirm Model/Character textures, Ground Map, camera interaction, read-only guest UI and normal owner tools. Verify another user can view the public Project and private Projects remain inaccessible. Investigate any remaining Blob 404s separately. The production build remains User-owned; browser, live SQL and hosted production behavior have not been verified by the agent.

## Follow-up — public Character animation assignments

The User found a remaining anonymous 401 in `assignedCharacterAnimations.ts`: both Character runtimes still fetched the authenticated animation-assignment endpoint. The bootstrap now batches rendering-only Character/Model assignment hydration for authorized read-only Characters, including explicitly referenced clips and relevant slot enabled states. Assignment owners must match the authorized Character/Model; clip/file ownership must match the assignment. Unrelated library animations are not returned. Current mappings override saved marker JSON.

GardenCharacter and EcctrlCharacter pass this mapping to the existing resolver instead of fetching Admin assignments. Inheritance, Character overrides, disabled actions, rig binding, explicit failure handling and legacy fallback remain in the same resolver. Owner and preview paths retain their existing behavior. The administration endpoint remains authenticated.

Validation: TypeScript, diff checks, Project bootstrap/ground-map tests, assigned Character animation tests (real FBX parsing with mocked requests), and database failure regressions passed. Added tests verify no assignment API call with a populated or intentionally empty Project mapping, current snapshot mapping, and exclusion of cross-owner animation sources. Browser confirmation of this follow-up remains pending; the earlier full CI result predates this follow-up.

## Admin saved-resource preview follow-up

Problem: the authenticated Model response includes owner-library FBX filename fallbacks. Admin Files previews and PNG exports could therefore look healthy without saved dependencies, unlike public Project rendering.

Implemented in the existing Model Files workspace:
- Saved Model Preview is the default. Rendering receives resolved saved files and explicit material assignments, preventing an implicit owner-library fetch.
- Owner Troubleshooting Preview explicitly enables owner filename fallbacks. Candidates remain labelled “Found, but not assigned”; existing link/upload controls persist repairs.
- Unsaved requirements remain warning badges even when a library candidate exists.
- Single and batch PNG exports use saved resources and saved-only requirement resolution.
- No public access permissions, database schema or asset records changed by this step. This preview checks resource association, not anonymous Project authorization or remote URL availability.

Validation: TypeScript, `threed-model-preview-batch` (readiness, batch lifecycle and saved-only resolution assertions), and diff whitespace check passed. Production build remains the user's gate. Browser acceptance pending: compare both modes for Polygon Farm Demo, link the missing filenames, then verify Saved Model Preview and a signed-out Project view after refresh. Keep signed-in Admin open while testing the Project in a private browser window.


## ThreeD Scene Loading Policy correction — September 27, 2026

Proven code defects: Project owners could still fetch owner-only filename fallbacks after bootstrap, while visitors received a different resource projection. Geometry/error settlement could also advance the loading presentation before required images succeeded. Blob 404s alone never proved a permission denial or an absent storage object.

Implemented:
- Every authorized Project viewer receives resolved Model resources from bootstrap; owner rendering no longer silently broadens those resources via the Admin endpoint.
- Existing explicit files/material assignments retain precedence. For FBX compatibility, the server inspects the authorized primary and returns only unique active, same-owner library matches to referenced texture filenames. Unrelated library entries and owner fields remain server-only. Private/unassigned Model access and write authorization remain unchanged.
- Inspection only fetches owned Blob primary URLs, rejects redirects, caps bytes at 32 MiB and each fetch at 10 seconds, uses batches of three, and caches only reference names (32 entries, one minute). Failed/unsupported inspection grants no extra resources. Explicit associations continue to work outside this compatibility boundary.
- Model and Character loaders wait for their managed dependencies. Scene presentation receives resource loading/failure state; a failed load displays an opaque error with Retry. Ground Map metadata/image failures participate too. Retry reloads the page explicitly; routine loading does not replace Canvas/Rapier.
- Final generic Model materials are checked after saved overrides, so an obsolete texture replaced by a valid saved assignment does not falsely block readiness. Failed source bundles are not added to the Model cache.

Evidence: a local anonymous GET for Project #8 returned 200 and Model #15 now includes `PolygonFarm_Texture_01_A.png`, `PolygonFarm_Signs.png`, and `Leaves_Normals.png`; these were absent in the earlier guest projection. `Leaves_Diff.tga` was not resolved. No asset records or files were edited. Subsequent local verification was unavailable because localhost:4444 could not be reached; remote HEAD checks and browser rendering are not confirmed.

Validation: TypeScript and all 41 CI tasks passed after the main policy change. Follow-up replacement-aware readiness tests and preview tests passed, along with TypeScript. Tests cover anonymous/visitor/owner resource parity, private/cross-owner denial, unique referenced texture selection, untrusted URL rejection, inspection caching, delayed texture completion, failure, timeout, and valid replacements. Production build and owner/private-window browser acceptance remain pending. Do not mark the original Scene fully repaired until those checks and the unresolved TGA dependency are addressed.


## Superseding presentation policy — non-blocking texture diagnostics

User correction: missing/inaccessible textures must not prevent the Project from appearing. The full-screen failure approach above is superseded by a compact non-modal warning overlay visible to both signed-in users and visitors.

- Scene Model/Character loaders retain loaded geometry despite texture failures. Their resource managers report the failed filename; a slow image does not delay geometry and produces a warning after 30 seconds if still pending.
- The overlay lists deduplicated filenames and load messages, without full URLs, query strings or owner paths. It occupies only its corner of the Scene, preserving camera/Scene interaction. Late successful loads clear their warnings; unmount/Project changes remove stale reports.
- Assigned texture failures retain the original material. OBJ texture read/decode failures retain geometry and clear failed material maps, while reporting the filename. Geometry and mandatory OBJ material-library failures still use the established fallback behavior.
- Scene readiness no longer treats a failed texture/resource status as a reason to hide the Project. Ground Map failures are also non-blocking. Project authorization and physics-error containment remain unchanged.
- Admin image capture and import validation retain strict resource readiness. The public/owner Project resource-resolution corrections remain in place.

Validation after this revision: TypeScript, diff check, and four focused tasks passed (`threed-project-session`, `threed-obj-bundle`, `threed-model-preview-batch`, `threed-assigned-character-animations`). Added tests prove progressive geometry completion during texture delay/failure, filename-only diagnostics, late-warning clearance, and actual OBJ geometry retention for a simulated HTTP 404 texture read. The previous 41-task CI result predates this presentation revision. Browser acceptance pending: open Project #8 as owner and anonymous visitor; verify `Leaves_Diff.tga` or another failed texture appears in the overlay while camera/Scene interaction remains available. Build remains User-owned.

## Warning dismissal and Project Assets repair links

The Scene warning overlay now has an accessible X close button. Dismissal affects only presentation for the current Project visit; diagnostics remain available to the existing Project Assets panel. Project changes reset overlay dismissal.

Resource reports carry their reusable Model ID/name from Model and Character loaders. The Scene forwards Project-keyed diagnostics through UnifiedMapView to the dashboard. Project Assets shows the same filename/message list independently of search filters, highlights affected asset rows, and opens `/admin/threed/model-files?modelId=…` in a new tab with `noopener noreferrer`. Model instances use their reusable Model ID, not the Project marker ID; Character assets match their associated Model. Existing guest/owner panel and Admin authorization remain unchanged.

Validation: TypeScript, diff check, Project session/resource-policy tests, new rendered Project Assets tests and Character animation regressions passed. Tests cover correct Model/Character highlighting, unrelated rows, search-independent diagnostics, cleared warnings, and new-tab repair destinations. Browser acceptance remains pending: close the overlay, open Assets, confirm warnings remain, and follow a repair link without losing the Scene tab.

UI follow-up: Project Assets warnings now use the existing PersistentDetails control below the asset groups and above Sensor Tools, collapsed initially with Project-scoped open/closed persistence. Dashboard header actions now use the same 8px gaps and 32px button sizing as Admin. TypeScript, the existing Project Assets warning checks, and diff checks passed; visual browser confirmation remains pending.

Header spacing refinement: both surfaces now share three explicit 32px grid slots (8px gaps on small screens, 12px otherwise). Menu/theme/account triggers use `icon-sm`; menu/theme glyphs share the standard icon size, and the centered 24px avatar/initials have consistent padding and an inset status indicator. This replaces inherited button-size overrides. TypeScript and diff checks passed; visual confirmation remains pending.

Header follow-up: reordered shared controls to theme toggle → navigation menu → account, and tightened all gaps to 4px while retaining equal 32px slots. TypeScript and diff checks passed.

Optical spacing refinement: equal button gaps looked uneven because the icon glyphs are 16px and the avatar is 24px. The shared header now has no extra gap between icon buttons and a 4px margin before the avatar, preserving 32px click targets and the theme/menu/account order. TypeScript and whitespace checks passed; visual acceptance remains user-owned.

### Theme regression correction

The theme provider correctly switched light/dark, but shared workspace CSS forced dark RGB surfaces and pale text in both modes. Workspace backgrounds, fields, menus, and text shadows now use theme-specific variables; shared header and Scene control foreground utilities follow semantic colors. Panel opacity behavior and accepted header icon spacing remain unchanged. Typecheck and workspace-settings validation passed, including independent opacity sliders and saved appearance contracts. Browser acceptance of both themes remains manual; no production build was run.

### Theme follow-up: served CSS mismatch and inspector descendants

User browser evidence rejected the first visual fix: dark backgrounds remained while text became dark. Fetching the stylesheet linked from the running localhost Scene confirmed that it still contained the old hard-coded header background (`#111a28`) and no `--threed-surface-rgb`, despite the updated source. Touching the stylesheet did not refresh that output. Restarting the existing dev server (without deleting `.next`) resolved the mismatch; a fresh HTTP fetch now includes the palette and variable-based header backgrounds.

The inspector child components also retained white field text and pale cyan/status labels. These now use theme foreground utilities and light/dark accent pairs, preserving white text on solid colored actions. Acceptance: headers, toolbar, inspector sections and inputs have matching foreground/background palettes in both themes; opacity and control layout remain unchanged. Typecheck, workspace-settings validation and diff whitespace checks pass. The served stylesheet was verified, but interactive browser appearance remains awaiting user confirmation; the earlier validation did not establish visual correctness.

### Remaining Light Theme surfaces

Updated the user-highlighted loading screen and toolbar placeholders, Environment controls and related Save View/Sensor surfaces, and dismissible file-warning overlay with matching light/dark palettes. Loading behavior, settings, and dismissal remain unchanged. Typecheck, threed-project-session and workspace-settings passed. HTTP inspection confirmed localhost serves the new light and dark utility styles. Visual acceptance remains manual; no production build run.

## v0.22.2 release preparation

Approved title: **ThreeD Scene: Public Loading + Theme Reliability**. User confirmed the final visual checkpoint and successful `npm run build`. Package and lockfile root versions advanced to `0.22.2`, with dependency resolutions unchanged. Release notes: [v0.22.2](../releases/v0.22.2.md). Production deployment is now User-confirmed; README identifies v0.22.2 as the current production release. No schema or environment changes required.
