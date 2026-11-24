---
name: prepare-threed-app-version
description: Prepare a requested ThreeD App version for the Developer's manual release. Use for a version bump, release notes, candidate validation, and commit-readiness handoff.
---

# Prepare ThreeD App: New Version v0.x.x

Use the version the Developer requests, including any prerelease suffix. An explicit increment such as “next patch” can be resolved from the current version. If the target is still ambiguous or the request contains only `v0.x.x`, inspect the checkout and ask for the target before editing. A request for a plan or read-only check ends with the requested information.

## Establish the release scope

Read [AGENTS.md](../../../../AGENTS.md) and [CONTEXT.md](../../../../CONTEXT.md) in full. Inspect the branch, HEAD, package and lockfile versions, staged and unstaged changes, and untracked release inputs. Compare the working tree with the last documented release and any existing draft for the target. Preserve manual edits and the index. Use the Developer’s title when supplied. Otherwise, name the verified App owner and the change that actually ships. If the diff contains only release metadata, describe it that way.

## Complete release prerequisites before handoff

For a release-preparation request, complete the following steps in the feature or documentation checkpoint itself. When the Developer specifies the version, apply it immediately. Before presenting a commit-ready title, verify that the manifest, both root lockfile versions, generated snapshots, release record, index and current checkpoint agree. Then run the candidate validation gates below. A later production confirmation records deployment evidence under the released version. If the Developer assigns follow-up documentation its own version, prepare it under that version and retain the original release history.

1. Set `package.json`’s `version`, `package-lock.json`’s `version`, and `packages[""].version` in the lockfile to the same value, without the leading `v`. For a version-only bump, compare with the pre-edit files to verify that only those fields changed. Preserve any intentional dependency edits already in scope.
2. Run `npm run schema:generate` against the checkout’s source and Git metadata to refresh the Markdown, HTML and JSON schema snapshots. Use the matching isolated dependencies if the checkout has no matching install. Inspect the generated diff. A release version change needs no database operation.
3. Create or update `docs/releases/v<version>.md` with the scope, rollout prerequisites that apply, and observed checks. Update the [release index](../../../releases/README.md) and the current checkpoint in CONTEXT.md. Preserve earlier acceptance and deployment evidence when resuming preparation.

## Verify what will ship

Use the Node version in `.nvmrc` and npm version in `package.json`’s `packageManager`. Inspect the current scripts. Follow the [repository validation ladder](../../VALIDATION.md) in a separate candidate directory with its own dependencies and build output.

- Assemble the candidate from the release baseline and the changes intended to ship, including in-scope untracked files. If unrelated staged or unstaged work shares a path, apply only the release hunks in the disposable copy and preserve the Developer’s index and files. Clarify scope if those changes cannot be separated reliably. Exclude `.env*`, credentials, developer reference files, active `node_modules` and build output. Run `npm ci` there and compare the lockfile hash before and after installation, or reuse an isolated install whose versions and integrity match the target lockfile. On Windows, use `npm.cmd` if PowerShell blocks the npm launcher. Distinguish a Developer-reported install from one observed during preparation.
- Run validation and build with scrubbed credentials, mocked persistence and network isolation that blocks live services and the Developer’s server. A prior release’s ignored tools may be reused after inspection. On a fresh checkout, use a disposable copy and an equivalent guarded environment. Leave Developer servers and live systems untouched.
- Generate fresh route types with the installed Next CLI (`node node_modules/next/dist/bin/next typegen`). Run `npm run typecheck -- --incremental false`, then `npm run validate -- repository-maintenance learn-data-structure` and the checks for the changed features. Include `assets` when production Animation files or their manifest change. Run `npm run validate -- ci`, then the guarded `npm run build`.
- Compare the built candidate’s source, assets and configuration by hash against the intended release inputs. Record actual exit results, warnings, known audit findings and outstanding checks. Revalidate affected inputs if they change. For a documentation-only evidence update, recheck links and final input parity.

## Hand off

Before suggesting a Git commit, review the release record and conversation for each Next Steps confirmation required before commit. Accept explicit Developer confirmations and record them once. While a prerequisite is outstanding, report the pending item under **Next Steps** and omit the suggested commit, including when asked for a title. Deployment and post-deployment checks follow the commit.

Review the final diff and whitespace. Once the required gates pass and all pre-commit Next Steps are confirmed, tell the Developer the candidate is ready to commit and link the release record. End the release handoff with a **Suggested Git Commit** heading and the exact versioned title on its own copyable line: `v<version> - <release title>`. Flag any unrelated staged changes that a plain commit would include. If a gate is blocked or fails, record the specific result and what is pending. Keep preparation edits unstaged. Each Git write, publication or deployment requires explicit authorization for that action.

When the Developer confirms a versioned release reached production, update its release record, index status and current checkpoint. If a subsequent `docs:` commit reaches production, record it as a follow-up under the existing version. Identify any locally observed commit as local evidence. Record independent deployed-commit verification and post-deployment browser checks only when observed.
