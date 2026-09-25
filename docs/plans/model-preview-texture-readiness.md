# Model preview texture readiness follow-up

Included in the v0.20.11 release candidate, ThreeD Models: Bulk Import Tool; production deployment remains unconfirmed. The User reported a visibly textured Scarecrow FBX blocked by “Model textures are not ready for capture” in Edit Model → Export 2D Image.

## Evidence and acceptance

`ModelMarker3D` published material inventory only when the loaded Model reference changed. The FBX loader can resolve its geometry before referenced images finish loading; those images later populate shared Texture sources in place. Rendering sees the updated image while the exported inventory can retain `ready: false`. This proves a stale-readiness race, though the exact Scarecrow asset has not been reproduced in a browser by the agent.

Acceptance: late texture completion refreshes inventory and permits the existing capture gate to reevaluate. Missing images must still block capture. Model switches and unmounts must cancel observation; consumers without material inspection must incur no polling.

## Changes

- `model-material-inventory-core.ts`: add an inventory observer that publishes initially and checks pending textures every 250 ms. Publish only changed snapshots; stop after all inspected textures are ready, or on cleanup. Unavailable images continue to be observed while the inspector/export is mounted so late recovery remains possible.
- `ModelMarker3D.tsx`: use the observer only when a material inventory consumer is present; cancel and clear inventory on cleanup.
- `validate-model-texture-readiness.mts`: cover delayed image completion, missing-image protection, unchanged-snapshot deduplication, cancellation and already-loaded shared textures.
- `validate.mjs`: include the regression in `threed-model-preview-batch`.

No capture guard bypass, asset writes, schema changes, Character runtime changes or animation-mixer changes. Release preparation includes this fix in package 0.20.11.

## Validation

Passed: TypeScript, diff check, `threed-model-preview-batch`, `threed-gltf-material-targets` and `threed-character-preview-switch`.

The User confirmed successful Scarecrow Export 2D Image → Capture PNG on September 25, 2026. The reported browser issue is accepted as fixed. Additional browser checks for slow-loading/missing textures and Model switching were not separately confirmed. The User-owned build and production deployment of this follow-up remain unconfirmed.
