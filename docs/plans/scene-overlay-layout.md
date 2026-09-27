# Dashboard Scene overlay layout

User requested an edge-to-edge Scene with transparent Project header and footer overlays after v0.22.2. Inspection found responsive Dashboard side padding, a bordered Card, and a canvas height subtracting space for both bars.

The Scene route now removes outer padding and Card border/radius, uses the viewport height below the 48px app navigation, and positions Project controls and footer over the canvas. Footer text passes pointer input through except its repository link. Other Dashboard routes retain their layout. Loading placeholders align with the new Scene geometry. Canvas/physics ownership and Scene data behavior are unchanged.

Typecheck and diff checks passed. Browser review remains: edge-to-edge desktop/mobile layout, wrapped Project controls, dropdowns, footer link, and 2D/combined view switching. No production build run.

## Toolbar consistency follow-up

User accepted the overlay layout. Project title now uses the same outline/active-secondary treatment as other toolbar menus. Each view selector uses that treatment with inherited icon color and an accessible pressed state; the extra group border was removed. Save uses foreground color in Light mode and white in Dark mode, preserving the saving/disabled state. Typecheck and diff checks passed; visual confirmation of this follow-up remains manual.

Light toolbar follow-up: user prefers the existing Dark styling. Added Light-only translucent backgrounds, backdrop blur, dark foreground and subtle borders for top-level outline/secondary toolbar controls. Hover and active states remain distinguishable; dropdown panel contents and Dark styling are excluded.

Correction following user review: removed white fill from Light toolbar controls entirely; idle is transparent and hover/selected states use a subtle dark tint. Restored the three view modes to a single bordered group with ghost inactive buttons and the retained pressed/selected state. The earlier separated-button/white-tint approach was rejected.

## Header and dropdown refinement

Removed toolbar skeleton placeholders while retaining real loading progress/readiness. Header uses a 12% theme surface tint. Setup's Radix trigger overrides data-slot, so the previous selector targeting data-slot=button missed it; toolbar styling now targets buttons by variant. Setup active styling reflects its own open state. Setup and Add dropdown actions share Environment-sized 12px text, 14px icons, compact padding and theme foreground hover styling. Typecheck passed; visual review remains manual.

Localhost again served stale global CSS: opaque header and missing menu-item rules. After restarting the dev server without deleting artifacts, HTTP verification confirmed the 12% header and shared dropdown styles are served. Browser appearance remains pending review.

Header opacity: 15% at rest and 90% on hover/focus-within, transitioning over 150ms unless reduced motion is enabled. Only the background alpha changes. App Settings now exposes separate Project Header default and hover/focus sliders alongside panel opacity, with a preview and the existing Save Changes, Discard and Reset Defaults workflow. Values are browser-local; older saved panel preferences retain their values and receive header defaults of 15%/90%. Header CSS consumes inherited preferences with matching fallback values.

Header Settings validation: `npm run typecheck`, `npm run validate -- workspace-settings dashboard-project-discovery threed-project-session`, and `git diff --check` passed. Extended existing Settings fixtures cover header-only Save, legacy preference defaults, header CSS variables, reload and reset. HTTP inspection of localhost:4444 confirmed the current header CSS is served. Visual browser acceptance remains manual; no production build was run.

## Scene appearance controls

Admin Settings now offers browser-local light/dark surface and control colors, plus Project Header button default, hover/focus and active tint strengths. Existing panel and Project Header opacity controls remain separate. The current light/dark colors and 0%/8%/12% button tints are defaults; old saved opacity preferences gain those defaults on read. Save Changes applies values to the Scene through inherited CSS variables, and Discard/Reset retain the existing draft workflow. TypeScript, `npm run validate -- workspace-settings`, and `git diff --check` passed. Browser visual review of both themes and focus/hover remains.

## Admin Settings layout refinement

The user screenshot showed Scene Appearance stretched down the left side while Model Preview Images occupied a small top-right card. Scene Appearance now uses two responsive groups across the available width: panel/header opacity and previews on one side, colors and button tint on the other. Theme remains a separate section. Model Preview Images follows Theme as its own full-width section, then Module Navigation. Color controls show hex values, tint help explains 0% and 100%, and previews use a neutral background. Draft colors now override the preview surface directly so unsaved changes are visible before Save. TypeScript, `npm run validate -- workspace-settings`, and `git diff --check` passed. Restarted the local dev server on port 4444 and confirmed it serves the new preview CSS. Authenticated browser visual review remains pending.

## Admin Settings two-column follow-up

The colored emerald-to-sky backdrop is restored behind the Scene panel, Project Header and Project Header button previews so opacity changes are visible. Project Header button text now has separate light and dark color controls, saved with the existing browser-local appearance preference; older saved values receive the current text colors as defaults. The setting applies to scoped Project Header buttons and the view-mode group, while the button preview uses draft colors before Save. Below Scene Appearance, Theme and Model Preview Images stack in the left column and Module Navigation occupies the right column at large widths; Dashboard Menu Links remains below. `npm run typecheck`, `npm run validate -- workspace-settings dashboard-project-discovery threed-project-session`, and `git diff --check` passed. Localhost serves the updated CSS; authenticated visual review remains manual.

## Explicit button text color UI

After user review, Scene Appearance color fields are grouped by Light theme and Dark theme. Each group has its own clearly labeled Panel + header, Button background, and Button text color picker. Button text color is a manual saved value for that theme; changing default, hover/focus or active background opacity never changes it. The current theme appears first. The button preview uses draft text color before Save. TypeScript, `npm run validate -- workspace-settings`, and `git diff --check` passed; browser appearance remains for user review.
