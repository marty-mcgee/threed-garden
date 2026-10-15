## October 15: Remaining inspector unit-label audit

Implemented a presentation-only pass over existing inspectors. Character, Model, Bed/FarmBot and Planting placement groups explicitly say Position (Scene units), and coordinate inputs include units in their accessible names. DetailsCard metadata coordinates also identify Scene units while preserving the internal Position row key. Model/Planting/Bed scale labels identify dimensionless multipliers. Sensor local offsets and dimensions identify Scene units and rotation degrees. Ground Map image dimensions/centre/elevation identify Scene units, and rotation identifies degrees.

Retained contracts: Bed/FarmBot dimensions remain explicitly feet; FarmBot telemetry bounds remain millimetres and alignment calibration millimetres per Scene unit. Character physics retains legacy Scene units or its explicitly converted metre/second envelope, mass kilograms and degree rotation. Sensor Group inspector has no dimensional editor. Ground Map inspector delegates its fields to ThreeDScene. Catalog Character movementSpeed is shared by legacy animation/movement consumers; no unproven metres/second label was assigned to it.

This pass changes labels only: no input conversion, numeric defaults/ranges, event callbacks, Save payloads, physics or calibration changes. The Project display preference continues to control Design and Assets; legacy inspector inputs retain their explicitly labelled contracts. Converting those inputs to the preference would require a separate draft/conversion pass with precision and pending-edit coverage.

Checks passed: TypeScript, validate-character-physics-units.cjs and validate-project-measurement-units.cjs (mocked boundaries). Agent browser appearance was not checked. Manual check: inspect placement fields, Sensor dimensions and Ground Map image controls; confirm labels fit the narrow panels. No local server, live database, version, Git or deployment operations.

## October 15: Project measurement acceptance and regression follow-up

The Developer reports the Project-wide Metric/Imperial checks passed. This is user-reported browser acceptance of the preceding requested checks, not independent agent production verification.

The formerly blocked Design validation fixtures now load the real shared scene-unit constants and measurement preference parser. The Project roundtrip fixture supplies an explicit mocked Design projection boundary (projection storage remains separately tested), plus current hydration dependencies. It exercises Metric and Imperial through the actual snapshot handler, mocked transaction, load handler, session and Dashboard hydration; invalid units leave the Project unchanged, unrelated configuration and Models survive, and geometry is unchanged.

The restored suite exposed a default-workspace normalization mismatch: defaultDesignWorkspace omitted measurementUnits while Save normalization added Imperial, potentially leaving a default draft dirty after Save. The default now explicitly includes Imperial in canonical field order. The existing client Save/acknowledgement assertion covers this edge case.

Checks run and passed: node src/libraries/scripts/validate-threed-designs.cjs, node src/libraries/scripts/validate-project-measurement-units.cjs, npm.cmd run typecheck. The Design suite emits an installed Three CommonJS deprecation warning; assertions pass. This supersedes the earlier fixture-blocked status. No new agent browser test, live database operation, server operation, version change or release occurred. Capsule/world-physics normalization and remaining legacy inspector unit conversions remain separate work.

# Project units and measurements

## October 15: Project-wide display preference

Developer verified the Character compatibility checks, then clarified that a simple Project-wide Imperial/Metric preference is the priority. Implemented **Project Header > Setup > Project measurement units**, the same selector in Project Setup/Tour, and Admin **Projects > New / Edit Project**. The Design settings selector is an alias of the same active Project draft, not an independent choice.

Canonical storage is `project.config.measurementUnits` (`imperial` or `metric`). Reads fall back to the earlier `config.threeDViewState.design.measurementUnits`, then Imperial. Admin POST/PATCH validate the enum and PATCH merges only this config key using SQL JSONB merge, preserving unrelated configuration. No schema change. Project snapshot Save promotes the captured preference to the canonical key atomically with its existing config/markers/architecture transaction; old requests omitting the preference do not erase the canonical key. A readback checks the saved value. The workspace field remains a compatibility mirror and draft transport; canonical config wins on fresh hydration.

Map load returns the resolved preference, and the sequenced Project session hydrates it into the existing draft/dirty/Save flow. Unsaved drafts remain protected. Unit changes during a pending Save remain dirty. Editing from a second Admin tab requires reloading the Scene to receive the new saved preference; this does not add cross-tab synchronization or concurrent-editor conflict resolution.

Consumers: Design rulers, dimension inputs, length/area/level labels; Architecture inventory dimensions; Project Assets coordinate and origin-distance summaries (now correctly use Project metres-per-Scene-unit rather than assuming feet). Changing display units does not rescale geometry, change snap spacing, calibration, physics, Character sizing or raw Scene coordinates. Other legacy inspectors still explicitly use their existing Scene-unit/feet/physical-unit contracts; they are not silently reinterpreted by this change. Character physics conversion is separate and not a prerequisite.

Files: `src/libraries/services/project/measurement-units.ts`, `src/components/project/ProjectMeasurementUnits.tsx`; Admin `projects/new/page.tsx` and `projects/[id]/page.tsx`; APIs `project/route.ts`, `project/threed-markers/route.ts`, `map/threed/route.ts`; `threed-project-session-core.ts`; Dashboard Scene page; `ProjectSceneToolbar.tsx`, `ProjectSetupPanel.tsx`, `ProjectAssetsPanel.tsx`, `DesignEditor.tsx`, `design/asset-inventory.ts`.

Checks: TypeScript and `validate-project-measurement-units.cjs` pass (actual Admin handlers with mocked auth/DB, legacy/default precedence, config preservation, validation/ownership/failure, session hydration, dirty state and pending-save edits, inventory units with unchanged geometry). The broader `validate-threed-designs.cjs` stops in its existing pointer fixture on `Unexpected Design pointer fixture dependency: ../scene-units`, introduced by the earlier shared-unit constant work; its assertions did not complete. Browser and authenticated end-to-end Save/reopen remain manual. No database/server/Git/version/deployment operations.

Manual check: select Metric in Setup, verify Design and Assets labels, Save Project, reload, then open Admin Edit Project and confirm Metric. Change to Imperial in Admin, save, reload the Scene and confirm Imperial. Create a new Metric Project via Admin. Confirm objects and physics keep their sizes/behavior in both cases.

## October 15: Stage 2A compatibility implementation

The Character DetailsCard's **Character Physics** section now offers **Convert to physical units**. This stages an explicit conversion, saved by the existing Save Character action and retained by the Project snapshot. No record is converted automatically. Legacy values remain Scene units; converted values label clearance in metres, walk/run/jump velocity in metres/second and mass in kilograms. Jump is correctly named velocity rather than strength. Visual Scale remains independent.

`character-physics.ts` defines a version-1 envelope `{version:1, units:'metres', metresPerSceneUnit, values}` in the existing marker metadata `characterPhysics`. The recorded calibration is immutable for this compatibility stage: the resolver divides by that calibration to reproduce the existing runtime values. PATCH and Project snapshot Save validate versioned settings against the owned Project calibration. Invalid values/version/calibration return 400; legacy snapshot metadata remains compatible. There is no schema migration. This envelope is not yet a portable, automatically recalibrated Character profile. A changed Project calibration is rejected on Save rather than silently reinterpreting settings.

The editor retains converted drafts on failed Save, disables controls while saving/controlled, and prevents unsupported saved versions from being overwritten by defaults. Current loaded-model capsule dimensions and world gravity are read-only physical measurements. They are not new editable controls and conversion does not normalize them between Projects.

### Unit audit and remaining runtime work

| Consumer | Current behavior | Remaining work |
| --- | --- | --- |
| `EcctrlCharacter.tsx` / installed `ecctrl/dist/src-Cz0JLHDZ.js` | `maxWalkVel` and `maxRunVel` limit Scene velocity; jump uses `setLinvel` with `jumpVel`. Clearance feeds `floatHeight` and local ground offset. | Converted stored values resolve back to identical runtime inputs. Future portable profiles need coordinated distance conversion. |
| `character-controller-dimensions.ts` | Loaded-model radius 0.3, cylinder half-height 0.6 Scene units; total capsule height 1.8. | Versioned editable capsule sizing must update spawn overlap, navigation/teleport, ground offsets and probes together. |
| Ecctrl fallback cylinder | Uses package half-height 0.3, float height 0.3, walk limit 2 and default run limit 5, unlike the loaded-model path. | Unify deliberately with compatibility coverage; existing controls do not override all fallback values. |
| `ThreeDScene.tsx` Physics | Gravity is -9.81 Scene units/s² for all bodies. | Earth-gravity normalization is a separate world behavior change affecting balls and other Models. |
| Ecctrl gravity lifecycle | `initialGravityScale` is captured in a ref; falling multiplier defaults to 3, terminal speed to 20 Scene units/s. | Live gravity changes cannot rely on changing a prop alone. Preserve stable body/Canvas ownership when implementing. |
| Navigation/placement | Capsule + 0.5 clearance, 0.75 spawn lift, fixed server overlap policy, additional approach distances and controller ray/impulse offsets. | Audit/convert together before claiming equal physical motion across differently calibrated Projects. |

Checks executed: `npm.cmd run typecheck`; `node src/libraries/scripts/validate-character-physics-units.cjs` (actual service, mocked snapshot storage, actual editor with mocked React hooks: legacy compatibility, metre/foot/cm conversions, endpoints, invalid/version/calibration rejection, repeatability, metadata retention, failed Save draft, busy and instance isolation); `node src/libraries/scripts/validate-threed-character-introduction.cjs` (existing offline controller/Rapier lifecycle and spawn checks); whitespace check. Installed Three/Rapier emit deprecation warnings in the older introduction validator; assertions pass. No full App/route/database test or browser physics acceptance is claimed.

Major browser checkpoint before changing capsule/world dynamics: in Projects 16 and 17, release control, convert a Character's physics settings, Save Character, Save Project, reload. Confirm physical labels/values restore, visual size is unchanged, and walking/running/jumping/wall contact behave as before. Other Characters must remain legacy until explicitly converted. Browser verification of this increment remains pending. No live writes or server operations were performed by the agent.

## October 15 continuation: display acceptance and explicit asset sizing

Developer confirms the Measurement units UI works well throughout their Project tests. This is Developer-reported acceptance, not independent browser testing; the exact tested Save/reopen matrix was not specified.

The next asset-sizing increment removes the measurement script's implicit Kate catalog scale and 68-inch target. It now requires combined catalog scale (Model times Character scale, excluding the Project instance multiplier) and Project metres-per-Scene-unit. An optional target height in metres produces a proposed instance multiplier; omitting it reports measured dimensions only. SHA-256 and loaded rest-pose bounds identify the measured source. No source unit is inferred from mesh bounds, and no proposal is applied to saved content.

Usage: `node src/libraries/scripts/measure-character-height.mjs <local.fbx> <combined-catalog-scale> <metres-per-scene-unit> [target-metres]`. For example, an explicitly desired 1.7-metre asset with combined catalog scale 0.02 in a metre Project uses `model.fbx 0.02 1 1.7`. This is a sizing request, not a measurement standard. The old two-argument command intentionally fails rather than assuming units.

`asset-size-report.mjs` validates all supplied dimensions and rejects numeric overflow/underflow. `validate-asset-size-report.mjs` passes explicit sizing across metre/foot/centimetre Projects, optional-target behavior, repeatability and invalid-input checks. TypeScript passes. This increment did not rerun an actual FBX measurement or browser tests.

Inspection also found existing per-instance Character Physics controls (`character-physics.ts`, `CharacterInstancePositionEditor.tsx`) for mass, walk/run speed, jump and clearance, consumed by `EcctrlCharacter.tsx`. Preserve them. The capsule still uses fixed constants; these controls do not yet establish a metre-based physical-size contract. Next: audit the units and persistence semantics of these existing fields before coordinating capsule, clearance and movement conversion. Do not replace their saved values or scale them automatically.

## October 15 correction: mathematical reference, not Character calibration

The Developer clarified that Project measurements must be independent of an arbitrarily scaled Character. This supersedes the Character-reference approach below. Kate's 5-foot-8 target remains optional asset sizing only; it is not a Project measurement standard. No saved scale or calibration was changed.

Project Setup now shows the one-metre conversion and exact foot/inch definitions, with rounded display values identified. The shared inch constant drives Design inputs. `validate-design-unit-reference.ts` constructs a one-metre cube through actual Design floor geometry, checks plan projection and inverse coordinates under pan/zoom, rendered bounds, and Rapier ray intersection. The offline test passed at 1, 0.3048 and 0.01 metres per Scene unit. TypeScript passed. Float32 geometry uses a numerical tolerance; the conversion definitions are exact.

The cube is an offline fixture, not an inserted Project object. These checks establish the architecture conversion chain, not Character physical dimensions or browser rendering acceptance. Next stages are Imperial/Metric display preferences and a separate explicit asset-unit/physical-size contract. Character/collider/movement normalization must follow that contract; do not infer source units or global scale from Kate's mesh. Historical measurements below remain asset-specific evidence only.

October 15, 2026: Developer sets Farmer Kate's intended reference height to **5 feet 8 inches / 1.7272 metres**, superseding the earlier 5-foot and 5-foot-10 references. Character Scale and its Save/reload behavior are Developer-verified; architecture Rapier collisions are also Developer-verified.

## Stage 1: explicit calibration — implemented

Project Setup shows current metres per Scene unit, current Design measurement display and the reference height in Scene units. The indication is read-only and does not resize saved content. Architecture rendering and collider generation share `sceneUnitsPerMetre` from `src/libraries/services/threed/scene-units.ts`; positive finite calibration is required.

Project 16 uses 0.3048 metres per Scene unit, making the reference height 5.6667 units. Project 17 uses 1 metre per Scene unit, making it 1.7272 units. Existing saved positions, scale multipliers and calibration are preserved. This first increment does not claim to resolve Character physical sizing.

## Stage 2: Character physical-size calibration — pending

October 15 measurement increment: fetched the previously identified public Farmer Female FBX read-only (1,407,051 bytes) and parsed its rest pose with Three.js FBXLoader, suppressing texture loading. Precise bounds: Y -1.4495301094510467 to 179.4490818618609, height 180.89861197131194. Catalog scale 0.02 yields 3.617972239426239 Scene units. To reach 1.7272 metres requires instance multipliers approximately 1.5662548775 for Project 16 and 0.4773944867 for Project 17, assuming Model scale 1 and Character scale 0.02. These values replace any assumption that the existing scale already means 5 feet 8 inches.

Added a local-file measurement script (`src/libraries/scripts/measure-character-height.mjs`) and `characterHeightMultiplier` calculation. No saved scales were changed. The calculation excludes the current instance multiplier to prevent compounding on repeated calibration. Model bounds are a rest-pose measurement, not a running-animation height. Ecctrl capsule radius/half-height remain fixed at 0.3/0.6 Scene units; movement, ground offset and clearance still need coordinated conversion before claiming complete physical calibration. The measurement increment does not complete Stage 2.

Measure Kate's source model in a reproducible rest pose before determining the multiplier needed for 1.7272 metres. Audit the existing Character visual scale, fixed capsule, feet offset, navigation clearance, movement speed and animation contact sampling. Apply a shared Project-unit contract across these consumers without multiplying already-derived scales twice. Do not enlarge architecture or rescale recovered Models as a workaround. Verify Projects 16 and 17 and preserve unrelated Character instance overrides.

## Stage 3: Imperial/Metric display — pending

October 15 implementation increment supersedes the pending label for Design display: Design settings now selects Imperial or Metric via optional `measurementUnits` in existing Project Design workspace state. Missing values default to Imperial; unsupported values reject. Dimension fields show inches or centimetres; rulers/wall/level labels show feet or metres and floor areas show square feet or square metres. Existing Project workspace Save carries the preference; no new database field. View preference changes follow existing workspace dirty-state behavior.

Switching display does not change geometry, camera pan/zoom, the six-inch physical snap grid or existing minimum-size validation. Metric rulers currently label the same physical tick positions (rather than changing to a decimal-metre grid). Help describing fixed physical defaults may still use inches. Project Assets summaries retain their existing presentation; this preference is Design-workspace-specific. TypeScript and offline preference/ruler checks passed; authenticated Save/reopen and browser input behavior remain manual. Asset units and Character physics normalization remain separate pending work.

Add a saved workspace preference through existing Project Save. Convert rulers, labels and property input presentation consistently while retaining metre architecture storage. Display changes must not resize geometry or change physical snapping distances implicitly.

## Deferred

Editable Scene calibration, whole-Project resizing and automatic import-unit correction require an explicit conversion/rollback design. No live database writes or migrations are authorized by these local stages.

## Verification

TypeScript and offline unit assertions cover the reference dimensions, scale conversion and invalid calibration rejection. Browser layout remains manual. Existing Rapier wall regression should be rerun when collider geometry changes; this increment retains the same reciprocal scaling operation. No servers were started or stopped.
