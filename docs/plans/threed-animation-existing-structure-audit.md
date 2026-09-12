# Existing ThreeD Animations/Actions — repository audit

Baseline: v0.19.13 with local Animations Library Stage 1 changes. User supplied the Model Animations screenshot for Model #935, “SM Veh Tractor Old 01” (FBX). This is a repository/screenshot assessment, not a live database query or inspection of that remote FBX. No application or schema behavior changed in this audit.

## What the screenshot establishes

The page reports `0 clips` and “No animation clips found in this model”. It is the existing `ThreeDModelAnimations.tsx` embedded-clip mapping editor. It does not read the new library APIs, the external Character manifest, or Character-specific assignments.

It loads the selected Model URL with FBXLoader, extracts `obj.animations`, maps to names and filters out empty names. Thus the displayed count is named embedded clips, not all available App animations. The same zero state also follows a missing URL or a load failure. We cannot conclude from this screenshot alone that the actual tractor file has no animation tracks. Its FBX must be successfully inspected to establish that.

The GLB/GLTF branch has a separate known discovery issue: it reads `.scene.animations` instead of the GLTF result's `.animations`. This does not explain an FBX result, but must be corrected in the replacement inspection flow.

Save Mapping remains enabled with zero clips or after failure; a failed discovery clears local mappings, and saving can overwrite existing mappings with an empty object. These are existing findings, not fixes delivered by this audit. The replacement must keep loading/error/valid-zero states distinct and never save cleared state caused by discovery failure.

## Where the existing structure lives

| Layer | Current source | What it contains |
|---|---|---|
| Embedded animation bytes | Model's primary FBX/GLB/GLTF, referenced through `threed_model_files` | Keyframe clips; tracks target bones, nodes or animated properties. |
| Shared Character animation bytes | Git-tracked `public/assets/animations/*.fbx` | Standalone sources such as `Idle.fbx`, `Walking.fbx`, `Running.fbx`; not copies embedded into each Character Model. |
| External source catalog | `src/lib/utils/externalCharacterAnimations.ts`, `FARMER_FEMALE_ANIMATION_SOURCES` | Explicit semantic action, source URL and loop flag. Model name/path matching enables it only for the known Farmer Female family. |
| Embedded action mapping | `threed_models.metadata.animationMap` | Action → clip-name mapping saved by the displayed editor; no animation bytes. |
| Model animation configuration | `threed_models.animations`, `default_animation` | JSON configuration and default clip selection; not a normalized shared-source library. |
| Character behavior configuration | `threed_characters.animations`, `default_animation`, `animation_speed` | Enum behavior choices and playback settings, distinct from clip references. |
| Semantic action vocabulary | `src/lib/utils/animation.ts`; `src/lib/types/character-actions.ts`; external catalog | Locomotion/fallback keys and task-action vocabulary. These catalogs have different roles and are not interchangeable lists. |
| New library persistence | Four approved local tables and `/api/threed/animations`, `/animation-files`, `/animation-assignments` | Source/clip identities and Model/Character relationships. Stage 1 APIs exist; source registration, UI and runtime consumption are still pending. No live table/data state is inferred. |

## How playback works today

**Characters:** GardenCharacter and EcctrlCharacter independently load the selected Model and call the same external source loader. That loader selects the first clip from each manifest FBX, clones it and normalizes its name to the action key. It caches loaded library results and returns cloned clips. Both runtimes merge embedded and external clips, with normalized external names taking precedence over same-named embedded clips, then use their existing mapping/action systems and runtime-owned mixers.

`isMovable` determines the Character runtime. Reusing clips must preserve this separation, task-to-locomotion crossfades, per-instance mutable animation state and first-pose visibility readiness. The verified name/path gate must not simply be broadened to every Model: another FBX file is not proof of skeleton compatibility.

**Generic Models:** `src/components/threed/markers/ModelMarker3D.tsx` already creates an AnimationMixer when its loaded Model contains clips. It plays the configured `defaultAnimation` when found, otherwise the first clip, using the supplied animation speed. It does not consume the new library assignment resolver or provide the Character task-action dispatch contract. A static tractor is not made animated by adding its name to the Farmer catalog.

**World actions:** Character completion events reach the dashboard coordinator, which handles eligible authenticated world-action requests. Animation playback and world mutation are separate. Assigning a watering clip does not independently authorize watering persistence; adding an object animation must not grant movement, harvesting or physical-device behavior.

## Replication plan for other ThreeD objects

Replicate the relationship and playback contracts, not per-object copies of FBX files:

```text
one source file → reusable clip(s) → target action assignment
                                      ↓
                          compatible target runtime
                                      ↓
                         visual animation playback
```

1. **Expose the existing inventory accurately.** Separate embedded clips, shared library choices and effective assignments. Include the tracked Character manifest as a clearly identified built-in source inventory before replacing any runtime dependency on it. Uploaded owner-managed sources remain separate from built-in assets. Do not copy/re-upload the tracked sources or auto-create records for every User merely to display them.
2. **Complete source inspection and library administration.** Inspect each source's clip index/name/duration and track targets, including unnamed or duplicate-named clips. Keep source errors separate from successful zero-clip results. Load the Model selector beyond the current 200-record cap. Display assignable library sources even when the target has zero embedded clips.
3. **Add Model and Character assignment editors.** Preserve existing embedded mappings; show inherited versus explicit assignments and Disabled. A selected clip must identify its source/index rather than assume the first clip or depend on a mutable filename. Failed loading must retain saved selections and prevent destructive saves.
4. **Validate target compatibility before playback.** For Characters, inspect skeleton/bone targets. For objects such as a tractor, inspect named wheel/steering/body nodes and supported animated properties. Matching track names alone is a preliminary check; preview verifies actual motion. A rigged Farmer walking clip is not a universal tractor animation. A static asset with no appropriate authored tracks needs authored animation or a separately scoped procedural behavior, not a fabricated clip assignment.
5. **Integrate through each runtime's existing owner.** First prove library-backed idle/walk/task clips in both Character paths; retain static external fallback until verified. Then add compatible generic Model clip resolution to ModelMarker3D, preserving its saved transforms, selection, fixed-collider rules and persistent Scene identity. Whole-object motion and physics synchronization require their own contract; they are not authorized merely by assigning clips.
6. **Extend object action catalogs deliberately.** The current library API uses existing Character/locomotion keys. Object-specific roles such as wheel spin or door open need an explicit catalog/dispatch extension with appropriate target support. Do not repurpose Character task keys or expose unsupported operations. Additional sub-modules can initially inherit animations from their assigned Model rather than adding new tables for every type.

## Acceptance for the next implementation stages

- The tractor page distinguishes successful “No embedded clips” from source/load errors and still offers the independent library.
- A compatible external clip can animate a target with no embedded clips; the same source/clip is reused by multiple targets without Blob duplication.
- Unnamed/multiple clips are discoverable by source/index; incompatible track targets are reported and previewable before assignment is represented as working.
- Character overrides, Model inheritance, explicit Disabled and removal are distinguishable and preserve existing saved mappings on failure.
- Generic Model animation never changes its runtime routing or grants Character/world-action abilities.
- Existing Farmer idle/walk/run, one-shot completion, Take/Release Control, saved position/rotation and no-T-pose readiness remain verified.

This audit refines the approved [Animations Library plan](threed-animations-library.md). No additional schema is proposed or applied. Validation here is source inspection and `git diff --check`; no build, database or Blob operation ran.
