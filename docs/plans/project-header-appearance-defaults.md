# Project Header and Toolbar appearance defaults

Implemented locally October 5, 2026 at package version 0.22.25. The Developer requested the current browser-saved App Settings color scheme as the App's default Project Header and Toolbar scheme, then confirmed production release under `v0.22.25 — ThreeD App: adopt saved Project toolbar appearance defaults`. See the [release record](../releases/v0.22.25.md). Read-only source history identifies implementation `f71c38c0`; exact deployed SHA remains unconfirmed.

## Prove and scope

Read only the `threed:panel-opacity:v1` preference for `http://localhost:4444` from the active Firefox profile's local storage. Saved header opacity was 0% normally and on hover/focus; dark button color was `#000040`, text `#ffffff`, and button opacity 26%/40%/60%. The implementation instead defaulted to a 15%/90% header, pale dark-theme buttons/text and 0%/8%/12% button opacity. CSS fallbacks repeated those older values before provider hydration.

Acceptance: fresh browser preferences, unavailable storage, Reset Defaults and initial CSS use the requested header/toolbar scheme; existing valid saved preferences still override it. Affected files: `PanelAppearance.tsx`, `globals.css` and the existing Workspace Settings UI fixture. Scope is appearance defaults, with the established Settings save/draft behavior and Scene ownership retained.

## Applied defaults

| Setting | Default |
| --- | --- |
| Project Header normal / hover or focus opacity | 0% / 0% |
| Dark toolbar button background / text | `#000040` / `#ffffff` |
| Light toolbar button background / text | `#0f172a` / `#0f172a` |
| Toolbar button normal / hover / active opacity | 26% / 40% / 60% |

Both provider defaults and CSS fallbacks match. The browser storage key/parser and existing saved preferences are retained. Scene panel opacity remains scoped to its existing defaults; the request applies to Project Header and Toolbar. Reading the preference did not write browser settings or access other storage keys. No version bump, schema, dependency, runtime or release change is included.

## Validation

Passed October 5, 2026: `npm run validate -- workspace-settings theme-provider shadcn-ui-boundary`, `npm run typecheck`, diff review/`git diff --check` and guarded agent-owned `npm run build` (134 static pages). The existing UI fixture exercises actual provider/reset/save callbacks for fresh defaults, CSS variables, persisted customization, independent opacity sliders, staged resets and unavailable storage. The build used the established cached-font localhost fixture and process-only offline database/network guards; development was restored on port 4444. No application code changed after the build. These focused checks are separate from the previous 61-task texture release CI run.

Browser paint remains pending: check a fresh browser on `/dashboard/scene`, normal/hover/active controls in both themes, and App Settings Reset Defaults followed by Save. Check a browser with saved customization for unchanged preference precedence. Production release is Developer-confirmed; detailed browser acceptance and post-deployment testing are not inferred. This documentation-only confirmation remains unstaged for Developer review.

Suggested commit: `v0.22.25 — ThreeD App: adopt saved Project toolbar appearance defaults`.
