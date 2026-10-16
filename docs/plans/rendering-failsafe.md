# Rendering fail-safe

Status: included in local v0.26.1 preparation after user-confirmed v0.26.0 production; not released. Developer confirmed restored visual quality. Crash prevention remains unverified.

## Implemented

- Shared component: src/components/threed/shared/SafeCanvas.tsx.
- Pure document-local circuit breaker and error classification: src/components/threed/shared/render-failsafe.ts.
- Active Scene, Home hero, Garden, Design and Model/Animation/Simulation preview Canvas hosts use the wrapper without moving children out of R3F context or changing their existing keys/callbacks.
- Context loss and unhandled recursion/update-depth failures stop all registered canvases in this page immediately. React Canvas errors also latch the breaker. React subscribers are notified on a later task so event/physics callbacks can finish before teardown. No automatic retry; newly mounted previews remain stopped until a full page reload.
- Normal unmount removes listeners and renderer registrations. Unrelated network errors do not trip the window-level guard. Existing local asset error boundaries still handle their own recoverable failures.
- Quality reductions were reverted at the Developer's request after poor visual results. SafeCanvas preserves each caller's DPR and renderer options, including normal defaults when omitted; Scene antialiasing is enabled and shadow maps are restored to 4096. The failure guard remains active.
- Scene loading presentation cannot hide the failure fallback. Project state/Save owners remain outside the Canvas boundary. No new persistence or schema changes.

## Limits

No exact recursion stack, VRAM measurements or driver evidence were supplied. The reported machine crashes are not diagnosed or claimed fixed. The browser has no portable reliable available-VRAM limit; these guards react only while JavaScript can still run. They cannot recover an already failed driver, protect against a first oversized allocation, or constrain other tabs/processes/devices. Each document has independent state. Existing caches, asset loading budgets, background activity and texture/geometry sizes require further investigation. No global asset caches are cleared, no physics constants are changed, and no random recursion-depth limit is imposed. The dormant ThreeDDesign.tsx manual copy is not connected or modified.

## Verification

Passed: npm.cmd run typecheck; node src/libraries/scripts/validate-render-failsafe.cjs; node src/libraries/scripts/validate-threed-scene-resources.cjs; node src/libraries/scripts/validate-threed-character-introduction.cjs. The new task is registered in offline CI. Tests use fake event targets/render stores and exercise deferred notification, latched failure, late registration, cleanup, independent documents, recursion filtering, context-loss wiring and preservation of caller quality settings. Installed Three CommonJS and Rapier initialization deprecation warnings are non-failing.

No browser/GPU test or production build was performed for this change. Do not reproduce a machine crash. Local servers remain Developer-owned and untouched.

## Manual follow-up

On the Developer's existing server, inspect a small known Project and one preview: confirm layout, ordinary movement, picking, Save controls and acceptable visual sharpness. Check that ordinary close/reopen does not trip the guard. Failure-path browser testing should use a deliberately dispatched context-loss event on a disposable small fixture, not a stress test or forced driver reset; this has not been executed. Verify fallback visibility and that a new preview does not restart rendering while latched. Do not infer Save/reopen acceptance from offline tests.

Next: collect any existing error stack/driver report without triggering another failure; audit asset/loading budgets before expanding this into automatic quality management.

References: [R3F Canvas](https://r3f.docs.pmnd.rs/api/canvas), [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).
