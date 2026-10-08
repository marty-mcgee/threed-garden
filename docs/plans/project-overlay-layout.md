# Project overlay layout

Developer-authorized implementation October 7, 2026, following v0.23.0.

## Problem and acceptance

Simulations, Scenarios and Project Tour used fixed centered positions. Users need independent movable panels, saved with the Project, responsive bounds, default-position reset and local-only public layout changes. Preserve panel controls, Scene/Simulation ownership, explicit Save and private write authorization.

## Implementation

The Dashboard owns shared overlay positions. Each title provides pointer-captured dragging and 16px arrow-key movement. Form controls and links do not start dragging; pointer cancellation ends the drag. ResizeObserver and window resize measurements keep moved panels within their containing viewport. Panels retain existing scrolling, Close and reopen behavior without remounting the Simulation runner or Canvas.

Positions are normalized fractions of available panel travel, stored in optional `overlayPositions` in the existing Project view-state JSON. Save Project captures all three positions; the existing sequenced Project loader restores them and clears local positions on Project changes. The server parser allows only these three panel keys and finite numeric coordinates between zero and one. Older saves retain default positions. No Drizzle schema or migration changes.

Setup → Reset Overlay Positions restores defaults locally; Save Project persists that reset. Public Simulation repositioning affects local state only; existing owner authorization controls Project saves.

## Validation

TypeScript passed. Focused overlay drag/resize/cancellation/control-exclusion/keyboard/reset tests and saved-layout round-trip/invalid-input checks passed. Existing Simulation launch, Scenario, Runtime Marker and inspector checks passed. The new `threed-overlay-layout` validation task is included in CI. No full production build or browser/live persistence acceptance is claimed for this development step.

Browser checklist: drag each title with mouse/touch; keyboard arrows; interact with form controls; Close/reopen; resize and expand tall panels; save/reload; reset/save/reload; switch Projects; run/stop Simulation while moving its panel; verify public movement cannot persist owner changes.

October 7 screenshot correction: Tailwind 4 applies centered positioning through the independent CSS `translate` property. Clearing `transform` alone retained the negative half-width offset. Moved positions now clear both properties, including restored positions. Regression checks cover the independent translation override and the rendered left-edge calculation. Browser confirmation remains pending.

Changes remain unstaged for Developer review. No Git write, deployment, package bump or database operation.

October 7 visibility refinement: opening Setup now preserves open Scenarios and Project Tour rather than closing them. All three open overlays retain 20% opacity while obscured, with inert/pointer-disabled controls; dismissing Setup restores normal visibility. Explicit Close remains separate. Inspector regression checks now assert retained open state, 20% visibility and disabled interaction.

Project title menu follow-up: its trigger also preserves open Tour/Scenarios state; both panels now dim for either Setup or the Project title menu. Existing Simulation dimming already covers both. Handler regression checks exercise the title trigger and both dimming bindings.

## Superseding UX correction — October 7

Developer requested simpler independent overlay handling. The preceding 20%-dimming design is superseded: these three panels no longer receive menu-driven dimming or inert state. Setup, title, Add and Environment menu activation preserve open panels. Opening Scenarios preserves Tour; opening Tour preserves Scenarios. Tour Close closes only Tour. Simulation menu selection always opens the panel and does not stop an existing run; its explicit Close still stops and hides it. Saved positions and owner persistence remain unchanged. TypeScript and focused inspector/Simulation checks passed; detailed browser acceptance remains pending.

Tour follow-up: the onboarding effect still closed Scenarios when the toolbar updated Tour session state. Removed that cross-panel write from both populated and empty Project branches. Regression checks execute those effect branches and verify Scenarios is preserved; context/permission reset guards remain intact.

Screenshot presentation refinement: the default and minimum moved top position now use 40px instead of 56px, recovering the space below the Project toolbar. All three full header rows provide drag/keyboard handling; links, buttons and explicitly marked Tooltip controls remain interactive and do not initiate dragging. Scenario explanations moved to title/step help Tooltips while actionable readiness warnings remain visible. Simulations now uses the shared navy workspace/dropdown surface and field styling, a cyan flask icon, and a far-right Close button. TypeScript, overlay bounds/persistence, Simulation/Scenario and inspector checks passed. Browser layout/drag confirmation remains pending.

Edge follow-up: moved panels now reach the exact right viewport/container edge, removing the 8px right inset. The top movement limit uses the actual toolbar bottom relative to each panel's containing block, replacing the fixed 40px reserve; this avoids double-counting the toolbar for nested Scene panels. Regression checks assert exact right-edge reach and toolbar-relative top placement.

Simulation header alignment: matches Scenarios' full draggable row, icon/title typography, title-adjacent help and 28px Close control at the far right. Create Simulation sits below the header so it cannot separate the title from help. TypeScript and focused Simulation checks passed.

Header polish: titles shortened to Scenarios and Simulations. Create Simulation is now an accessible, titled plus-icon link immediately left of Refresh/Close, using the existing owner-only route. Assets and Model Library top offsets changed from 36px to 38px for toolbar alignment, including the requested additional 1px adjustment. TypeScript and Simulation checks passed.

Left-panel polish: Project Assets adds a cyan Boxes icon and title-adjacent help; Model Library adds a violet Box icon and moves its placement explanation into title help. Model Library opening no longer closes Tour/Scenarios, including Tour's environment/model entry points. Assets retains its independent opening handler. Regression checks execute the Model Library opening preamble and existing Assets handler to verify overlay state is preserved. Actual placement/run safety guards remain unchanged.

Project Tour visibility persistence: Save Project now captures optional `projectTourOpen` alongside positions. The workspace restore applies saved true/false, and the automatic onboarding effect respects either explicit saved value. Legacy saves without this field retain existing onboarding behavior. Strict boolean validation and open/closed round-trip checks pass, along with TypeScript and focused overlay/inspector checks. No schema migration; browser save/reload verification remains pending.

Sensor overlay refinement: Sensor Group and Physics Sensors now use the shared bounded drag/keyboard position handling, with optional sensorGroup/sensors positions captured by Save Project. Physics Sensors renders independently of Scenario guidance and no longer dims or becomes inert when other panels or menus open. Both headers add cyan Radio icons, title-adjacent help and full-row dragging while preserving interactive Close/Tooltip controls. Sensor Tools in Assets adds matching icon/help. Sensor Group save semantics moved into its header Tooltip; other shared editor hosts retain their existing explanation. Existing physics, counts and group CRUD are unchanged. No schema migration.

Validation: TypeScript and threed-overlay-layout, threed-inspectors and threed-sensors passed, including saved Sensor position round trips and existing Rapier/count/owner API regressions. Browser drag, viewport, menu independence and save/reload verification remain pending. Changes remain unstaged; no release or database operation.

Left-panel/Add refinement: Character and FarmBot libraries, Bed/Planting placement, DetailsCard and Ground Map inspectors now share the 38px top offset; bounded inspector heights reserve the same 38px. Existing Assets, Model Library and Sensor Group offsets already match. Opening Characters, FarmBots, Beds or Plantings no longer closes Tour or Scenarios; the Tour Add Character shortcut also preserves them. Models and Shapes already preserve these overlays. Mutually exclusive placement state remains intact. TypeScript and focused inspector regression checks passed; browser confirmation remains pending.

Final v0.23.1 header polish: Character/FarmBot libraries and Bed/Planting placement headers now include colored module icons and title-adjacent help Tooltips in place of their introductory paragraphs. Ground Map and asset/Physics Sensor inspector headers also include icons and help, completing the left-panel presentation. Placement controls and save semantics remain unchanged. Final release validation is recorded in docs/releases/v0.23.1.md.

Post-release Character texture follow-up October 7: Developer supplied a 404 for Scarecrow's embedded PolygonFarm_Texture_01_A.png. Character Edit passed its selected Model through the strict Model editor resource filter, discarding the exact API's authorized saved FBX texture candidates. Character geometry preview now retains those candidates via the existing explicit-resource preview option, matching the Character runtime's unique filename alias resolution without fetching additional libraries or creating assignments. Genuine missing/ambiguous textures still fail strict readiness. Final material diagnostics now identify texture/material slot and omit URL query values. Focused Character/editor/FBX/resource tests and TypeScript passed; live Character #1 reload remains pending. No database/Git writes or release operation.

Character Save follow-up: native numeric step/min constraints could block submit before the existing draft validator, particularly for saved fractional transforms or zero movement inside collapsed sections. The Character form now uses noValidate so bounded explicit draft validation supplies Toast errors and existing save guards/API checks remain authoritative. Missing edit context also reports a Toast instead of silently returning. Actual save callback/precision/invalid-draft/lock fixtures and TypeScript passed; browser Save confirmation pending.

Scenario guidance consolidation: removed the standalone read-only Scenario instruction card from the Scene. Soccer/Farm explanations now live in the Scenarios title help Tooltip. Existing active Scenario/group selection and restored state remain intact. Physics Sensors reset uses the existing handler in an accessible titled RotateCcw icon immediately left of Close, retaining empty-counter disabling. Focused Scenario/inspector/Sensor checks and TypeScript passed; browser presentation confirmation pending.

Open Scenario visibility follow-up: removed the Scenarios panel's automatic Close call from its start callback. Open Scenario now retains the panel while the existing Soccer request enables Physics Sensors; explicit Close remains independent. Actual panel callback regression and TypeScript passed. Browser confirmation pending.

Dashboard Simulation Save feedback: the shared editor silently disabled Save for parser-invalid definitions. Changed drafts now allow Save to request existing bounded validation, reporting its precise error inline and through Toast without issuing a write. Loading/auth/reference-choice/active-empty/clean/busy guards remain intact; preview readiness remains independent. Editor regression confirms invalid saves produce feedback and no requests. Simulation Admin/editor/preview and TypeScript checks passed; live Dashboard confirmation pending.

Simulation Save requirements follow-up: every disabled-button condition now derives from a single saveBlockedReason and is rendered persistently beside Save through an accessible status. Covers busy/loading/read errors, choice loading/errors, missing Project/module/name/slug, active-empty Actions and unchanged saved drafts. Ready/invalid-draft status is also explicit. TypeScript and Simulation Admin/editor/preview checks passed. Live diagnosis remains pending the visible reason on the Developer's record.

Simulation workspace arrangement: shared Dashboard/Admin editor now puts definition controls first (left at desktop widths, above preview on smaller screens) and Preview Canvas second. Save/Cancel and save status moved outside both scrolling columns into a separate bottom-left shrink-free footer. Existing preview identity, callbacks and busy/read-only guards remain intact. Simulation checks and TypeScript passed; browser layout confirmation pending.

Action participant consistency: removed the conditional shared Soccer participant section. Every Action now renders inline Character/Target selectors, filtered by its compatibility requirements. Changing Action type retains compatible bindings and clears only incompatible ones; editing one step never clears another. Run/Kick still require movable participants and matching pairs for supported execution. Existing definitions/schema remain unchanged. Actual editor regressions cover independent bindings and compatible Run-to-Kick switching; Simulation checks and TypeScript passed. Browser confirmation pending.

Animation preview clarity: renamed the loaded clip audition section Animation Clip Previews, with title help distinguishing local playback from saved Action mappings. Character rows show clip counts and retain the active manual selection while playing. Configuration links identify the Character and open a new tab to preserve the draft. Missing kick mapping remains a legitimate readiness requirement; no assignment is fabricated. Simulation checks and TypeScript passed; live mapping/clip acceptance pending.

Independent clip selection follow-up: manual audition selections are retained per Character instead of deriving all dropdown values from the single current playback request. One manual audition plays at a time. Each timeline Action now offers a local Preview clip override; readiness and playback resolve the same override or saved mapping. Kick overrides must retain supported foot-contact sampling. These local choices do not save Character mappings or change Scene execution. Simulation Admin/editor/preview checks and TypeScript passed; browser playback acceptance remains pending.

Animation Action Map presentation follow-up: both preview dropdowns now project active configured slots using their saved titles and exact Action keys, instead of mixing raw rig clip names with semantic aliases. Mapped Actions without loaded compatible clips remain visible as unavailable; inactive slots are excluded. Counts use this same projection. Legacy sources without slot metadata retain their loaded choices. Regression checks cover labels, unavailable/inactive slots and legacy fallback; Simulation checks and TypeScript passed. Browser acceptance remains pending.

Default Action catalog extension: preview choices now combine the established App Action catalog (Idle, Walk, Run, jump phases and other defaults) with configured slots. Saved titles take precedence, explicitly inactive slots remain excluded, and missing compatible clips stay unavailable. No raw rig aliases, assignments or runtime behavior are added. Focused regressions cover default choices and disabled/custom mappings; browser verification remains pending.

Developer designated the mapping/default/Kick findings as the next [v0.23.2 Goal Milestone](v0.23.2-animation-action-mappings.md). Strict/broad set behavior and contact-resolution improvements are planned there; no v0.23.2 release is inferred.
