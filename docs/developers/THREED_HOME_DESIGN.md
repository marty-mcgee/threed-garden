# ThreeD Home Design

Released in **[v0.24.0-alpha — 3D Object Builder + Home Design Tools](../releases/v0.24.0-alpha.md)**, Developer-confirmed in production October 9, 2026: Milestones 1-4 (roofs with hosted openings), `/admin/threed/models/home-design`, reached through **Admin → ThreeD → Models → Home Design**. Walls/floors, hosted doors/windows, named levels, Flat/Shed/Gable roofs, rectangular roof cutouts and skylights are included. This editable local planning surface performs no Project, Model, File, Texture or database writes. Detailed App/post-deployment acceptance remains separate.

## Reference audit

The supplied `reference/home-design` is a behavioral reference, not a production import. Its `index.html` loads jQuery 1.11.3, Paper.js, an older Three.js, OBJ/MTL loaders, TrackballControls and ThreeCSG. `scripts/threed.js` keeps mutable Paper and Three objects in parallel global collections.

| Landmark in `scripts/threed.js` | Observed behavior |
| --- | --- |
| `initPlanView` (3027), pointer down/drag/up (3244/4336/4085) | Paper hit testing, wall/floor drawing, object/endpoint editing, guide dragging, pan/zoom and property updates. Pointer coordinates use `viewToProject`; edits update Paper paths, global plan records and Three objects before `render()`. |
| `loadWall` (1929), `relinkWallReferences` (1599), `reDrawWallCorners` (5671) | Reconstruct two-point paths, thickness/height and level; match endpoints using integer coordinate equality; rewrite rectangles and old `geometry.vertices` for joined wall corners. |
| `redrawFloor` (7378) | Extrude a Paper polygon, rotate it onto X/Z and place it at a level elevation. Remove/recreate the old floor mesh. |
| `loadRoof` (2024), `reDrawRoofCorners` (5937) | Reconstruct roof paths and mutate paired roof geometry/corners. |
| `applyMasksToWall` (1667), `applyMasksToRoof` (1770) | Bounds-check placed mask objects, then subtract with ThreeBSP. This is obsolete geometry infrastructure, not an adapter for installed Three 0.186.1. |
| `updatePlanHistory` (1008), `doUndo` (506), `doRedo` (582) | Serialize snapshots with operation-specific dirty/added/deleted keys; reconstruct affected geometry on history traversal. Local storage and share-link fields are coupled to history. |
| `savePlan` (1100), `loadFileAsText` (1122), `drawPlan` (1424) | Download `.threed` JSON with a thumbnail; parse/reconstruct paths, objects, levels and annotations. This is Paper-specific serialization, not the new editable format. |
| `newLevel` (7132), `setLevel` (7246), `updateLevelHeight` (7317) | Create/switch Paper layer groups and apply their elevation to wall/roof/floor geometry. |
| `initThreed` (2217), `loadThreed` (2439) | Load OBJ/MTL assets plus top-view images, center them, create Paper footprints and maintain placed transforms/masks. |

The demo JSON contains 53 placed objects, 44 walls, 4 roofs, 11 floors, 3 levels, dimensions, text and horizontal/vertical guides. All six `plans/*.threed` files parse; they contain 32–44 walls and 9–11 floors, with some omitting saved levels. The catalog has 367 entries with author/size/license data (CC BY 3.0/4.0, CC-0 and Free Art License 1.3). Local `objects/` contains 1,417 files, but `objectsURL` still selects remote S3 for catalog loads. Sharing calls a remote `/demo/api/getsharelink`; its availability was not tested. Local drawing, history, export and reconstruction have concrete code paths; a menu item or catalog entry does not prove an external service or asset loads. The old demo was not exercised end to end in this session. No legacy catalog assets/code were copied into the new editor.

Legacy properties explicitly label dimensions in centimetres. `legacyCentimetresToMetres()` implements `cm / 100`; a complete legacy document converter remains deferred. Import rejects `.threed`/Paper payloads instead of interpreting their dimensions as metres.

## Integration and contracts

Repository inspected: `marty-mcgee/threed-garden`, branch `main`. Package/root lockfile remain `0.24.0-alpha`. Installed stack: Next 16.3.8, React 19.3.0, Three 0.186.1, Fiber 9.8.1, Drei 10.7.9, TypeScript 5.9.3. No dependency was added. Existing Cottage/PBR/direct-upload work and Developer-owned `public/home-design/` and `reference-home-design.zip` are preserved.

`UnifiedMapView.tsx` already coordinates geographic Leaflet and a persistent Project ThreeD Scene; it is not a local building-plan editor. Home Design uses a separate retained Canvas and touches no Scene marker registry, Rapier world, Character mixer, Project snapshot, Sensor or Simulation state. The existing Admin Models route family supplies authentication and the fixed Blueprint workspace; the editor supplies scrolling and a stationary status footer.

The authoritative `src/libraries/schema/threed/index.ts` has Model/File/Texture and Project marker contracts, but no Home Design/Structure table. The TypeScript design document is **not** a Drizzle table or a saved Project field. Models remain reusable assets, `mainModelFileId` remains primary authority, and `project_threed_markers` remain separate placed instances. Future exports must use the existing browser GLB/Model/File/Texture flow with explicit new asset registration and explicit Project adoption; generated geometry must not overwrite a selected reusable Model. Existing Models have no asset revision pin.

| File | Responsibility |
| --- | --- |
| `src/app/admin/threed/models/home-design/page.tsx` | Local editor route under the existing Admin host. |
| `src/components/admin/threed/models/home-design/HomeDesignEditor.tsx` | Tools, Imperial properties, shared selection, local import/export, guarded navigation and history. |
| `HomeDesignPlan.tsx` in the same directory | SVG interaction, screen/plan transforms, endpoint/grid snapping, captured movement, drawing drafts and plan framing. |
| `HomeDesignPreview.tsx` in the same directory | Isolated Fiber Canvas, real mesh picking, retained geometry owners and camera-only Fit/Reset. |
| `src/libraries/services/threed/home-design/document.ts` | Version 5 DTO, version 1-4 upgrade, level/host/geometry validation, topology transforms, units and snapping. |
| `history.ts` in the same service directory | Immutable commit/undo/redo, bounded to 100 history entries. |
| `geometry.ts` in the same service directory | Shared wall footprint, modern BufferGeometry extrusion and incremental mesh/resource ownership. |
| Admin Sidebar and `validate.mjs` | Navigation entry, portable CI task and optional native browser task. |

SVG fits the existing dependency set and React event/property model; entity IDs, handles and labels stay inspectable/selectable without Paper globals. Both views derive from one `DesignDocument` (`format='threed-home-design'`, `version=5`, `units='metres'`). Version 1/2 imports retain existing geometry, dimensions and openings on a Ground level at elevation zero; version 1 also gains an empty openings collection and window defaults. Versions 1/2/3 gain an empty roofs collection; version 3 retains its existing levels and offsets. Versions 1-4 gain an empty roofOpenings collection; version 4 retains its roofs. Migration chooses a Ground ID outside the old global ID namespace. Nodes have stable IDs and X/Z coordinates; walls reference start/end nodes and a level, carrying height/thickness/base offset; floors reference a closed ring of nodes and a level, carrying thickness/top offset. Levels carry ID/name/elevation. Roofs carry a level ID, closed node ring, Flat/Shed/Gable kind, pitch, direction, vertical thickness and level-relative eave underside offset. Openings reference a host wall with kind, distance from its first endpoint, width, height and sill relative to its base. Roof openings reference a roof with cutout/skylight kind, along/across offsets and plan width/length in its direction/perpendicular frame. Mesh names and `userData.designEntityId` match entity IDs. Camera/tool/active-level/visibility/selection/drag/drawing state stay outside exported JSON.

Imperial inputs multiply once by 0.0254. Screen coordinates satisfy `pixelX = view.x + planX * scale` and `pixelY = view.y + planZ * scale`. 3D is Y-up; Shape coordinates `(x,-z)` rotate −π/2 onto X/Y/Z. Floors extrude below their top elevation, walls above their base elevation. Default doors are 80 inches high × 36 inches wide; default windows are 48 inches high × 36 inches wide with a 36-inch sill. These defaults are adjustable before placement and individual opening dimensions remain editable afterward.

## Editing and integrity

The centered **ThreeD Design Action Tools** group in the Home Design header contains Select, Wall, Floor, Roof, Roof Cutout, Skylight, Door, Window and Pan. The title stays left and Undo/Redo/Import/Export stay right on wide screens. At narrower widths the tools wrap into a centered row below; the left panel retains levels, visibility, snapping, defaults and selected properties. Tool selection, import busy guards and cancellation behavior are unchanged by this presentation move.

Wall clicks form consecutive segments; Escape ends/cancels the incomplete next segment. While drawing a floor, a dedicated row shows its draft corner count and **Finish Floor**/**Cancel Draft** controls. Finish Floor, Enter, or clicking the first corner saves the polygon and returns to Select with that floor selected. Finish requires at least three corners and a valid polygon; invalid drafts retain their points and show guidance. Escape cancels incomplete drawing and never removes a finished floor. Hover geometry is transient, never committed/exported by itself. Selecting a shape in either view populates the same properties. Dragging its body moves its referenced nodes and therefore adjoining walls/snapped floors; dragging a yellow handle moves that shared corner. Endpoint snapping precedes optional 6-inch grid snapping and uses a zoom-relative 10-pixel radius. Floors snapped to wall endpoints reuse their node IDs. Coincident coordinates imported under different IDs remain disconnected deliberately.

Pointer movement produces immutable previews from the captured base. Release validates/commits one history transaction; Escape, pointer cancellation and capture loss restore the previous committed document. Collapsing/invalid endpoint merges are rejected atomically. Numeric fields update live with validation; each accepted numeric change is a history transaction. Undo/redo clears transient drawing/selection. Import validates before replacement and is undoable; rejected imports retain the committed document. Export contains only committed editable data.

Validation rejects non-finite/out-of-range values, missing/duplicate IDs, walls shorter than one inch, duplicate segments, repeated floor vertices, negligible area and self-touching/intersecting rings. Concave/reversed-winding floors and disconnected walls are supported. Two-wall corners use matching offset-line miters bounded by half the segment length/four half-widths; acute or ambiguous junctions use bounded butt/overlap ends. T/multi-way junctions and mixed elevations do not claim exact boolean unions or structural solids. Unchanged meshes retain identity/geometry; changed signatures dispose replaced geometry; deletion/unmount disposes owned geometry/materials.

Import limits: 1 MiB JSON, 20 levels, 1,200 nodes, 500 walls, 100 floors, 100 roofs, 100 vertices per floor/roof, 200 wall openings and 200 roof openings, with at most 20 per host; X/Z ±1,000 m, level elevation and entity offset each ±100 m, height/width/length up to 30 m and thickness up to 3 m. Roof opening offsets are signed and bounded to ±3,000 m, with actual host fit checked separately. Levels require unique nonblank names of at most 60 characters and globally unique IDs. These are prototype bounds, not construction-code certification. Grid spacing adapts on zoom. Fit Plan/Fit are explicit; pan/zoom only alter view transforms. The editor blocks navigation during import and prompts for unexported changes on links/Back/unload.

## Hosted doors and windows — Milestone 2

Choose **Door** or **Window**, hover a wall for a transient preview and click to place. Placement returns to Select. Drag the opening along its captured host wall, or edit offset/width/height and window sill in inches. Placement uses the nearest wall within a screen-relative tolerance, clamps the proposed position inside its endpoint clearance and optionally snaps its offset to the 6-inch grid; overlap or dimensions that cannot fit produce guidance rather than silent resizing. Escape exits placement without saving a hover preview. Opening selection works through plan symbols and 3D frame/glass/leaf meshes.

Openings stay at an absolute distance from their host's first endpoint, with sill measured from its base elevation. Moving shared endpoints recomputes the host frame; translation/rotation/elevation moves the aperture and trim together. Shortening/thickening/lowering a wall or changing an opening rejects the entire commit if it no longer fits. Explicit wall deletion cascades to its openings within one history transaction; Undo restores both. Deleting one opening fills its aperture while preserving the host and other openings.

Rectangular apertures stay two wall thicknesses from either endpoint (outside the bounded miter region), at least one inch below the wall top and at least one inch apart. Doors have zero sill; windows require at least one inch of sill. These are documented prototype geometry constraints, not building standards.

`wallGeometry()` clips the actual miter footprint into host-axis strips, then extrudes only the solid vertical intervals around openings. Installed `BufferGeometryUtils.mergeGeometries` combines the pieces; temporary pieces and replaced geometry are disposed. Actual wall triangles are absent in apertures; there is no CSG or covering-plane trick. The same wall mesh owner is retained. Local trim groups follow host frames; windows have transparent, depth-write-disabled glazing, and door leaves display open at 90 degrees. This is visual geometry, with no animation, physics, adjustable swing/handing or hardware model. Frame/glass resources dispose once on replacement/deletion/unmount. Materials remain local colors, with no managed Texture writes.

## Levels — Milestone 3

Use **Active level**, **Level name**, **Level elevation**, **Add Level** and **Delete Level** in the left properties panel. New documents start with Ground at zero. Add Level creates an empty named level, suggesting 108 inches above the highest existing level (capped at the elevation limit); this is an editable default, not a computed storey height. The level selector sorts by elevation without reordering the document. Basement/negative elevations are supported. No geometry is copied or reassigned automatically.

The 2D plan displays, snaps, draws and edits only the active level. Coincident corners on different levels have separate IDs; validation rejects cross-level shared nodes. All commits/history/export retain the entire document, never a filtered view. Changing levels cancels in-progress drawing/dragging and clears selection. Import selects its first level; Undo/Redo falls back to the first level when the previous choice no longer exists. Picking another level in the all-level 3D view selects that entity and switches the plan to its level.

World Y equals level elevation plus the wall base/floor top offset. Opening sill/trim follows the host wall, including its level elevation. Existing Base/Top elevation property labels are now **Base offset**/**Top offset**; upgrading old JSON onto a zero-elevation Ground level preserves old world positions. Moving a level updates only affected geometry signatures and opening groups, preserving unrelated mesh owners/resources. Level names do not affect geometry signatures.

**Show all levels in 3D** defaults on. Turning it off displays the active level only and moves the preview grid to its elevation. Visibility does not delete/rebuild meshes or remount Canvas; hidden mesh ancestors are explicitly excluded from raycasts. Fit uses the visible geometry and world elevations; Reset remains camera-only. Active level and 3D visibility are view state rather than export data.

Deleting a populated level asks for confirmation. Deletion cascades to its walls/floors/roofs/openings, prunes orphan nodes and commits one Undo transaction. At least one level must remain. Duplication, entity transfer between levels, stairs, automatic floor alignment, ghost underlays and structural validation are deferred.

## Roofs - Milestone 4, first increment

Choose **Roof** and click at least three footprint corners on the active level. **Finish Roof**, Enter or clicking the first corner closes the roof and returns to Select; Escape cancels only the incomplete draft. Roof corners snap to existing same-level nodes, so connected walls/floors move with them. Select/drag the purple roof label or outline to move its footprint, or use yellow handles and Imperial corner fields. The outline uses stroke-only picking so the floor underneath remains selectable. Roof labels use the vertex average, which may lie outside a concave footprint.

New roofs use Gable, 6/12 pitch, direction 0 degrees, 6-inch vertical thickness and an eave underside offset equal to the current default wall height. Selected Roof properties offer **Flat**, **Shed** and **Gable**, **Pitch (rise / 12)**, **Direction (degrees)**, **Roof thickness** and **Eave offset**. World underside Y is level elevation plus eave offset plus the height profile. Direction follows the gable ridge or shed contour, measured from +X toward +Z; a shed rises toward the perpendicular (-sin(direction), cos(direction)). The gable ridge is midway between the footprint's projected extremes. Flat roofs ignore pitch/direction while retaining those values for later type changes. Roof heights do not automatically follow individual wall heights.

Pitch accepts 0-24 inches of rise per 12 inches of run; direction is at least 0 and less than 360 degrees. Roof edges must be at least one inch, thickness is 1 inch to 3 metres, eave offsets are within +/-100 metres and total rise is at most 30 metres. Invalid edits retain the previous valid document and show guidance. Concave and reversed footprints are supported. The installed Three triangulator subdivides the footprint and hosted holes before each triangle is split at the gable ridge; this avoids bridging concave empty space. Top/bottom surfaces follow the same profile, separated vertically by thickness, with sides around the outer boundary and each aperture. This does not compute hips, building-code framing, gable infill, intersections between separate roofs or overhangs.

**Show roofs in 3D** hides roof and skylight visuals and picking, retaining mesh resources and Canvas. Fit frames visible geometry, including roof rise and skylight rims. Level elevation changes move its roof and openings; changing a wall height does not. Roof deletion/Undo and populated-level deletion/Undo follow the existing atomic history contract. Deleting a wall does not delete a snapped roof. Export produces version 5; versions 1-4 import without geometry changes and gain empty collections for later features. No API, Drizzle schema or storage operation is involved.

## Roof cutouts and skylights - Milestone 4, second increment

Choose **Roof Cutout** or **Skylight**, hover a roof and click to place a 24 x 36 inch rectangle. Placement returns to Select. The selected roof, or the selected opening's host, takes precedence; otherwise the last containing roof on the active level is chosen. Select the intended roof first when footprints overlap. Placement turns Show roofs in 3D on. Escape, leaving the plan or switching tools clears the transient hover without exporting it.

Select the rectangle in 2D and drag it within its captured roof frame, or edit **Width**, **Length**, **Along offset**, **Across offset** and **Opening type**. Skylight frame/glass meshes also select in 3D; an empty cutout has no covering mesh and is selected through the plan. Width/length are horizontal plan dimensions in inches. Offsets start at the roof's first corner; Along follows its direction, Across follows the perpendicular. Optional 6-inch snapping applies to placement/drag offsets. Host translation/elevation and valid direction/corner changes carry the opening and trim with them; they are not independently hosted in world coordinates.

Every opening must remain at least one inch inside every roof edge, including concave notches, and at least one inch from another hosted opening. A skylight on a pitched gable must stay on one plane with one inch of clearance from the ridge. Cutouts may cross a ridge; Flat/Shed skylights have no ridge boundary. Invalid placement, resizing, type conversion or host edits preserve the valid document and show guidance. Openings are never silently clamped or resized. Width/length range from one inch to 30 metres, subject to host fit.

Roof geometry contains real holes through its top, underside and ridge, with closed aperture sides. Skylights add a slope-following one-inch rim and thin transparent glazing above the roof surface; the host profile is retained when forming both. These are local visual materials, with no CSG, physics, Model Textures or storage writes. Changed geometry/rim/glass resources dispose through their committed owners; visibility retains those owners. Deleting a roof or its level cascades to all hosted openings in one undoable transaction; deleting one opening fills only its aperture. Version 5 JSON stores roofOpenings; versions 1-4 upgrade without adding one implicitly. Rehosting, arbitrary hole polygons, independent opening rotation, adjustable rim depth and joins between roofs remain deferred.

## Remaining milestones

1. **Roof follow-up:** overhangs, hips, gable infill and joins between separate roofs. Flat/Shed/Gable roofs with rectangular cutouts/skylights are complete locally.
2. **Catalog:** owner-safe Model references, separate placed-instance transforms and 2D footprints. Retain attribution/licenses for reused assets.
3. **Annotations/tracing:** editable dimensions, text, guides and calibrated background images. Current length labels are derived read-only measurements.
4. **Persistence/export:** separately reviewed Project ownership/revision/draft storage and existing GLB/primary File/Model Textures registration. JSON remains editable authority. No schema migration or mock HTTP endpoint was needed to prove drawing.
5. **Presentation:** managed materials/textures, lights and browser performance/touch/accessibility refinements. Current materials are simple local colors; this is not a physical building/physics simulation.

## Acceptance

See the [implementation and local checks](../plans/v0.24.0-alpha-home-design.md). Browser evidence uses a standalone bundle of the actual React editor/WebGL components with native Edge pointer input and intercepted local downloads. The October 9 follow-up compiles the actual App stylesheet through the installed Tailwind/PostCSS pipeline and verifies height fill/resize/short-screen scrolling. The workspace divides available height between the plan and 3D panes; properties scroll independently on desktop, and short screens scroll the workspace while retaining the status footer. This does not certify the authenticated Next/Sidebar host, touch devices, every junction or production performance.

Manual App steps:

1. Open `/admin/threed/models/home-design`. With **Snap** on, choose **Wall** and draw a 120 × 120 inch room, returning to the first endpoint. Escape ends the chain. Confirm four walls/four nodes and live 3D.
2. Choose **Floor**, click the same four corners, then **Finish Floor** or Enter (alternatively click the first corner again). Confirm one slab/four shared nodes and automatic return to Select with floor properties. Press Escape; the finished floor must remain. Undo removes the floor in one step; Redo restores it. Use **Fit Plan** and **Fit** if needed.
3. **Select** a wall, drag its yellow shared corner and release. Neighboring walls, floor and length labels should update during movement. One **Undo** restores the whole drag; **Redo** reapplies it.
4. Set height to 120 inches and thickness to 8 inches. Confirm live changes. Change X/Z or floor thickness/elevation numerically. Invalid edits show a message and preserve valid geometry.
5. Drag a wall/floor body; connected endpoints move together. Start another wall/floor, then Escape. Export during an incomplete drawing and confirm only completed entities are included.
6. Import JSON, select a shape in 3D and continue editing in 2D. Reject malformed/version-mismatched JSON without losing the plan. Delete a shape, then Undo.
7. Alt-drag/wheel in the plan and orbit/zoom in 3D. Inputs stay in their pane; world dimensions stay unchanged. Fit/Reset retain the Canvas. Enlarge the window: both panes expand to fill the workspace down to the footer. Shorten it: owned scrolling/footer and both previews remain reachable; the Canvas remains mounted.
8. Leave with unexported changes and choose Stay. Verify Back/link/unload guards. Export before intentional navigation. No Project Save, upload, migration or database command is required.

Door/window App acceptance:

1. In a room with 120-inch walls, choose Door, hover/click one wall. Confirm a real aperture, frame/open leaf, selected Door properties and 80 × 36 inch defaults. Choose Window and place it on another wall; confirm transparent glazing and 48 × 36 inch dimensions/36-inch sill.
2. Slide each opening along its wall. Undo once restores the entire drag; Redo reapplies it. Select a frame/leaf/glass in 3D and confirm shared properties.
3. Edit opening width/height/offset/sill. Try an overlap, a window taller than its wall, or moving an opening outside its allowed offset; guidance must retain the valid design. Reduce defaults before placement if a wall is too small.
4. Move a host wall/shared corner and change its base elevation. Apertures/trim must follow. Shorten or lower the wall so an opening cannot fit; the invalid change must reject without losing geometry.
5. Delete one opening; its host becomes solid again. Undo. Delete the host wall; its openings disappear in the same step. Undo restores the wall and both openings.
6. Export/import version 5 JSON and continue editing. Import previously exported version 1/2 documents: geometry/dimensions survive on Ground at zero; version 1 has no openings initially. Export produces version 5. Escape or switching tools during hover never commits an opening.

Level App acceptance:

1. Draw a Ground room/floor/opening. Add Level, rename it Upper, and set elevation to 120 inches. The 2D plan is empty; Ground remains visible in all-level 3D. Draw an upper room at the same X/Z coordinates, floor and door. Ground geometry must remain unchanged.
2. Switch between levels; only that level appears in 2D. Drag an upper corner, change its wall Base offset and change Level elevation. Only Upper moves; its floor/opening follows the correct level/host. Undo/Redo restores each committed operation.
3. Turn off Show all levels in 3D, then switch levels and use Fit. Only the active level renders and can be picked. Turn it back on; picking a different level should switch the plan and properties. Camera controls retain the Canvas.
4. Start an incomplete wall/floor or opening hover, then switch levels. Only the draft disappears. Export still contains both levels and their completed geometry.
5. Delete the populated Upper level: first cancel confirmation, then accept. Its geometry disappears together. Undo restores the level, corners, floor and openings in one step; Redo removes them. The final remaining level cannot be deleted.
6. Export/import a multilevel version 5 document and keep editing. Import older version 1/2 JSON; verify old elevations and openings are preserved. Try duplicate level names or invalid elevation; errors must retain the previous valid document.

Roof App acceptance:

1. On an existing room/level, draw Roof using its four corners. Finish Roof, Enter or first-corner closure must retain it and return to Select. Export during a draft excludes the incomplete roof; Escape retains completed roofs.
2. Select its purple label, change type through Flat/Shed/Gable, pitch to 8/12 and direction to 45/90 degrees. Check eave offset/thickness in inches and live 3D. Try pitch 25 or direction 360; guidance must preserve valid geometry.
3. Drag the label and a yellow shared corner. Connected walls/floor on that level follow during movement; other levels remain unchanged. Undo once restores the drag. Select the underlying floor away from the roof label/outline.
4. Hide/show roofs and use Fit/Reset. The Canvas remains mounted, hidden roofs cannot be picked and rooms remain inspectable. Change the level elevation; its roof moves with the level.
5. Export/import version 5, delete/Undo a roof, and delete/Undo its populated level. Import old versions 1-4; retain their geometry/levels/openings/roofs and add no roof or opening implicitly.
6. Draw a concave footprint and rotate its gable direction. Inspect the empty notch, ridge, underside and sides. Gable infill and joins between separate roofs remain deferred.

Roof opening App acceptance:

1. On a 120 x 120 inch gable roof at direction 0, choose Skylight and click near plan X=72/Z=30 inches. Confirm the 24 x 36 inch rectangle, slope-following rim/glass and selected properties. Hover alone, leaving the plan and Escape must not export a new opening.
2. Set Width to 30 inches and drag the opening by 6 inches along its roof. Undo restores the entire drag. Edit its offsets/dimensions; try crossing a roof edge or the gable ridge. Guidance must retain valid geometry and the committed JSON.
3. Place a Roof Cutout near X=36/Z=60 inches across the ridge. Inspect the true open hole in 3D. Try converting it to Skylight or placing an overlapping opening; guidance must preserve the cutout. Place a skylight on a Flat/Shed roof and inspect its slope.
4. Move the host roof/shared corners and change its level elevation. Valid edits move the aperture/rim together; edits that invalidate fit reject atomically. With overlapping roofs, select the desired host before placing another opening.
5. Hide/show roofs and Fit/Reset; retain Canvas, exclude hidden skylights from picking and frame visible geometry. Delete one opening/Undo; delete the roof or populated level/Undo and restore all hosted records together.
6. Export/import version 5 with both opening kinds and continue editing. Import version 4 with roofs but no roofOpenings; retain roofs and add no opening. Older version 1-3 recovery must remain intact. Verify short-screen scrolling keeps all new tools/properties reachable.
