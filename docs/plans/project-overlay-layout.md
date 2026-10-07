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
