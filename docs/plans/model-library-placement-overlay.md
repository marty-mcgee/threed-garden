# Model Library placement overlay

Problem: the selected Model preview and placement controls are inside the Library scroll area, requiring a return to the top after choosing a lower card.

Acceptance: selection/placement opens a separate Scene overlay outside the Library scroll area and Design Assets portal. Filters/cards retain their scroll owner. Preview, readiness, scale, coordinates, environment role, placement and Cancel retain existing callbacks and guards. Independent bounded scrolling fits narrow viewports; closing the Library removes both surfaces. DetailsCard and the persistent Scene remain mounted. No persistence/API/schema change.

Scope: ThreeDModelLibraryPanel.tsx and responsive App CSS. Scene page remains the placement state owner.

Implemented: the preview, metadata, coordinate/scale/environment controls and active-placement/Cancel block render in an independently scrolling overlay beside the Library, above DetailsCard while open. On narrow screens it overlays the Library; closing Model metadata returns to browsing when no placement is active. Existing state/callbacks and the single preview are retained. No new saved overlay position is introduced.

Validation: threed-library-placement (including the new mocked component/portal/callback/guard/lifecycle regression), threed-library-collections, existing Project overlay-layout checks and whitespace checks passed. Fresh standard TypeScript failed only in three archived ignored Synty capture helper files under reference/imports. A fresh temporary-config TypeScript check excluding reference passed; the tracked configuration/archive were preserved. This is not a standard TypeScript gate pass or full CI/build claim.

Browser placement, Library scroll retention and desktop/narrow-screen visual acceptance remain pending. No server operations, live writes, dependency/version changes or release preparation.

Follow-up acceptance: successful Model placement selects the created Project instance (not the reusable Library Model), dismisses Library placement and competing inspectors, and shows its DetailsCard with Project Assets. Failed requests preserve the selection and placement draft. Existing transaction/renderer owners remain unchanged.

Follow-up implemented in Scene page placement success callback using the existing runtime marker builder and transaction. The Library closes, Project Assets opens and competing inspectors clear; the former automatic return to Project Setup yields to the requested DetailsCard. Actual callback regression passed with mocked successful/failed persistence, verifying created-instance identity, transaction, visibility and failed-request retention. Browser acceptance remains pending.

Final release-preparation evidence is maintained in [v0.26.13](../releases/v0.26.13.md).
