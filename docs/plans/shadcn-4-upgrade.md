# shadcn 3.8.5 to 4.22.0 upgrade

Implementation evidence below records the pre-release upgrade. Subsequent Developer local acceptance and v0.26.12 release preparation have one home in [the release record](../releases/v0.26.12.md). The Developer has since successfully run npm ci and npm start; historical statements about the untouched older active installation describe the agent's implementation phase only.

## Baseline and acceptance

Requested October 17, 2026 for the next release. Inspected clean main at 75feac02774d936fda9006d9795cd74ef71c1103; package/root lockfile and Developer-confirmed production are 0.26.11. The installed and locked shadcn version is 3.8.5, declared as ^3.8.5. This task changes the requested dependency, not the App release number or deployment status.

The package is the shadcn CLI, not a versioned bundle of the App's rendered components. The App owns 23 wrappers in src/components/ui; primitives come from the existing radix-ui package. Source inspection found no runtime shadcn import or shadcn CSS import; globals.css imports tailwindcss and tw-animate-css. components.json uses new-york, React Server Components/TSX, Lucide, neutral CSS variables and existing aliases.

Acceptance: exactly shadcn 4.22.0 is installed/locked; clean Linux/Windows npm ci and CLI smoke checks pass; current component/config/CSS/runtime owners are preserved; dependency deltas are explained; TypeScript, focused checks, full CI, native UI comparisons and the guarded production build pass. Any unresolved browser/authenticated limits remain explicit. Developer installation/servers, live data and Git state remain untouched.

## Stage 1: compatibility and controlled resolution

1. Inspect official 4.22.0 npm metadata and v4/default-primitive changes. Node >=20.18.1 is supported by repository Node 24. Exact published metadata is authoritative if the public changelog lags.
2. Pin shadcn to 4.22.0 for this reviewed upgrade, retaining its existing dependency classification. No bulk package update or unrelated direct upgrade. The initial resolution exposed an implicit runtime dependency: src/libraries/config/workspace-settings.ts imports zod, currently supplied by shadcn 3.8.5. Declare the existing zod 3.25.76 directly so this CLI upgrade does not silently migrate App validation to Zod 4.
3. Resolve in an isolated copy with npm 11.6.2; compare every added/removed/changed lock entry and its dependency path. Pay particular attention to shared PostCSS, Babel, browserslist, Tailwind merge, Zod and MCP SDK resolutions.
4. Preserve the missing optional @emnapi/runtime repair and cross-platform lock integrity. Adopt only the reviewed candidate package/lock pair after isolated resolution.

## Stage 2: CLI and component boundaries

1. Clean-install the reviewed lock on Linux and Windows; verify unchanged lock SHA-256 and actual installed version.
2. Run the installed CLI's version/help and inspect its read-only project/config reporting. Use a copied project without .env or credentials. Do not run init, apply, migrate or component-overwrite commands against the workspace.
3. Keep Radix, existing component source, components.json, cn utility, App CSS, React Compiler and runtime ownership intact. CLI v4's Base UI defaults and newer cn generation do not authorize switching existing App primitives or replacing source.
4. Check CLI project detection reports the existing aliases/style and review any compatibility warning. CLI-generated component modernization would be a separately scoped task.

## Stage 3: regression and visual validation

- Capture baseline/candidate component, CSS and configuration hashes and runtime/build dependency versions. Existing source remains identical; investigate shared dependency resolution changes rather than assuming a CLI change has zero impact.
- Inspect relevant scripts before execution. Run fresh TypeScript, shadcn-ui-boundary, application-foundations, theme/workspace/Sidebar/Design/overlay checks and other affected suites.
- Run the complete CI-equivalent group with mocked persistence/device boundaries. Correct actual failures; do not remove checks or weaken assertions.
- Run actual-React file-based native fixtures using the candidate dependency installation: Design panning, status/help keyboard behavior/spacing and narrow layouts, plus shared dialog/menu/select/tab behavior and draft retention. Cover Design toolbar/import/section logic in the focused offline suites; retain full-App interaction as manual acceptance. Include shared primitives in both themes and compare the same fixture/source against baseline dependencies.
- Run the guarded isolated npm production build, with offline fonts, scrubbed credentials, dummy DB and blocked external/dev-server network access. Verify source/config/public parity against the tested copy.

## Stage 4: review and handoff

Record exact dependency deltas, platform/tool versions, commands/results and artifacts here. Update CONTEXT with concise next-release development status; preserve the production confirmation in its release record. Do not assign a new release version without release preparation instructions. Leave changes unstaged; no Git write, deployment, database/storage/device operation or local server start/stop.

Manual follow-up: review real App menus/dialogs/selects/tabs/tooltips/section headers, dark/light and narrow layouts, Model/Character editors, Project Save/reopen and focus restoration. Native fixtures do not establish authentication, real uploads or production behavior.

Rollback is scoped to the upgrade's package/lock and added validation/documentation changes, using the captured baseline files and preserving later Developer edits. No reset, dependency downgrade in the active installation or automatic Git operation is authorized.

## Sources

- [CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [Base UI defaults](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- [CLI reference](https://ui.shadcn.com/docs/cli)
- [Published package](https://www.npmjs.com/package/shadcn/v/4.22.0)
- [Upstream changelog](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/CHANGELOG.md)

## Execution evidence

Plan recorded before dependency edits. Implemented October 17, 2026; App version remains 0.26.11. shadcn is pinned to 4.22.0. App Zod is explicitly pinned to its existing 3.25.76; shadcn/registry use their own nested Zod 4.6.7. No component regeneration or App runtime change.

### Dependency review

Final lock delta: 34 existing package paths changed version (including shadcn), 13 added, 85 removed. Resolution-graph traversal confirms every changed/added path is reachable from the new CLI dependency tree and every removed path from the old CLI tree. Shared packages can still affect builds: browserslist/browser data and selector-parser changes were reviewed with compilation and native comparisons. Exact path additions/removals are reviewable in package-lock.json; removed groups include the old registry/MSW/inquirer/yargs dependency trees. Lockfile dev/peer metadata was reconciled by npm rather than hand-edited.

Retained root versions: `react 19.3.0`, `react-dom 19.3.0`, `radix-ui 1.4.3`, `next 16.4.2`, `tailwindcss 4.3.3`, `@tailwindcss/postcss 4.3.3`, `postcss 8.5.29`, `autoprefixer 10.5.0`, `@babel/core 7.29.7`, `babel-plugin-react-compiler 1.0.0`, `tailwind-merge 3.6.0`, `zod 3.25.76`, `typescript 5.9.3`. The optional @emnapi/runtime lock repair remains present. No unrelated direct package range changed.

| Lock path (under node_modules/) | Before | After |
| --- | --- | --- |
| @hono/node-server | 1.19.14 | 2.1.5 |
| @modelcontextprotocol/sdk | 1.29.0 | 1.32.1 |
| @modelcontextprotocol/sdk/node_modules/jose | 6.2.3 | 6.2.12 |
| baseline-browser-mapping | 2.10.33 | 2.11.29 |
| body-parser | 2.2.2 | 2.3.0 |
| body-parser/node_modules/iconv-lite | 0.7.2 | 0.7.3 |
| browserslist | 4.28.2 | 4.29.3 |
| bundle-name | 4.1.0 | 4.1.1 |
| caniuse-lite | 1.0.30001793 | 1.0.30001816 |
| content-disposition | 1.1.0 | 2.0.1 |
| default-browser | 5.5.0 | 5.5.1 |
| electron-to-chromium | 1.5.365 | 1.5.459 |
| eventsource-parser | 3.1.0 | 3.1.1 |
| express | 5.2.1 | 5.3.0 |
| express-rate-limit | 8.5.2 | 8.7.1 |
| fast-uri | 3.1.2 | 3.1.8 |
| hono | 4.12.23 | 4.13.13 |
| media-typer | 1.1.0 | 1.1.1 |
| negotiator | 1.0.0 | 1.1.0 |
| node-releases | 2.0.47 | 2.0.59 |
| open | 11.0.0 | 11.0.4 |
| path-to-regexp | 6.3.0 | 8.4.2 |
| postcss-selector-parser | 7.1.1 | 7.1.6 |
| powershell-utils | 0.1.0 | 0.2.1 |
| proxy-addr | 2.0.7 | 2.0.8 |
| qs | 6.15.2 | 6.16.1 |
| range-parser | 1.2.1 | 1.3.0 |
| raw-body/node_modules/iconv-lite | 0.7.2 | 0.7.3 |
| shadcn | 3.8.5 | 4.22.0 |
| side-channel | 1.1.0 | 1.1.1 |
| type-fest | 5.7.0 | 4.41.0 |
| type-is/node_modules/content-type | 2.0.0 | 2.1.0 |
| update-browserslist-db | 1.2.3 | 1.3.4 |
| wsl-utils | 0.3.1 | 1.0.1 |

### Automated checks

| Gate | Result |
| --- | --- |
| Linux Node 24.22.0 / npm 11.6.2 clean npm ci | Passed; 674 installed packages; lock SHA-256 unchanged |
| Windows Node 24.13.0 / npm 11.6.2 clean npm ci | Passed; 668 installed packages; lock SHA-256 unchanged; platform-specific optional counts differ |
| Installed CLI --version / --help / info --help | Passed; 4.22.0 |
| CLI info --json | Passed in isolated Windows copy; detects Next.js 16.4.2, Tailwind v4, new-york, radix, Lucide and existing aliases/CSS path. Initial offline attempt was blocked by the network guard; successful retry allowed only public ui.shadcn.com fetch with credentials removed |
| Fresh TypeScript (tsc --noEmit --incremental false) | Passed on Linux and Windows |
| Seven Windows focused tasks | Passed: shadcn-ui-boundary, application-foundations, workspace-settings, theme-provider, threed-designs, threed-overlay-layout, admin-sidebar |
| npm run validate -- ci | Passed all 79 tasks on isolated Linux, mocked/offline persistence and device boundaries |
| Guarded isolated npm run build | Passed Next.js 16.4.2 compilation/TypeScript and 145/145 page generation; offline fonts, scrubbed credentials, unreachable dummy database and external/developer-server network guard |
| Tested-source parity | 1,487 snapshot files match the Linux copy; 1,093 runtime/public/package/config inputs match the workspace. Later edits are validation fixture/documentation only |
| Preserved UI source/config/style | All 26 baseline hashes match: 23 UI files, globals.css, components.json and shared utility |

Windows native checks use actual React/App components, local files, Edge debugging pipes and mocked Project/Scene state. Existing Design checks passed panning, status/help, consistent 4px title/help spacing, desktop/narrow layouts and read-only controls. New shared-UI checks passed dialog initial focus/Tab trap/Escape/restoration, menu/context actions, select changes, tab draft retention, switch/slider keyboard behavior, tooltip keyboard/Escape, disabled controls and no overflow/runtime errors, in dark/light at 1440/375px. Design toolbar/import/section logic has focused offline coverage; real-App interaction remains manual.

Final native comparison: all four shared-UI PNGs and generated CSS are SHA-256 identical between baseline dependencies (OS temp threed-ui-primitives-6gsqCz) and candidate (threed-ui-primitives-89XHQB). All five existing Design PNGs are also identical (threed-design-pan-zQojxl versus threed-design-pan-env7q6). Candidate light/narrow screenshots were visually inspected. Initial automatic Tailwind discovery produced differing utility sets between checkout/copy; the fixture now explicitly scans the same src tree without changing App CSS. The initial light/narrow image differed by two pixels with maximum channel delta 1; the controlled repeat matched exactly. These comparisons certify the fixtures, not full-App visual parity.

Early baseline fixture failures were selector/quoting mistakes corrected before passing comparisons, not App failures. The new optional task is excluded from portable ci/all; no HTTP fixture server was used. No authenticated Save/reopen, live upload, real Scene/Character/FBX/GPU acceptance or production verification is claimed.

### Artifacts and handoff

Ignored local tools/reports: .next/shadcn-upgrade-tools (lock delta, graph/hash audit, install/check logs, public-registry CLI report); isolated Windows installation: .next/shadcn-upgrade-windows. Linux disposable copy/logs: /var/tmp/threed-shadcn-TllHsU. These are local evidence, not committed release assets.

The Developer's active node_modules still contains shadcn 3.8.5; it was intentionally not altered while Developer servers may be using it. After reviewing the checkpoint, the Developer can coordinate their own server/install lifecycle and run npm ci with Node 24/npm 11.6.2 before real-App acceptance. Changes remain unstaged; no server, Git write, deployment or live-system write performed.

