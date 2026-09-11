# Admin ThreeD workspace continuation

Baseline: [v0.19.13](../releases/v0.19.13.md), commit `c976c77`, User-confirmed production deployment and manual build. The User has resumed the remaining stages. No next release number is designated; changes below are local, unreleased work. The manual build gate remains User-owned.

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
