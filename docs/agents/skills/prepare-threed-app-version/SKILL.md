---
name: prepare-threed-app-version
description: Prepare a requested ThreeD App version for the Developer's manual release. Use for a version bump, release notes, candidate validation, and commit-readiness handoff.
---

# Prepare ThreeD App: New Version v0.x.x

Use the version the Developer requests, including any prerelease suffix. An explicit increment such as “next patch” can be resolved from the current version. If the target is still ambiguous or the request contains only `v0.x.x`, inspect the checkout and ask for the target before editing. A request for a plan or read-only check ends with the requested information.

## Chat command parameters

Accept a positional version or named parameters in any order after `ThreeD Skill:`. Plain-language requests use the same workflow. For example:

- `ThreeD Skill: v0.38.next`
- `ThreeD Skill: version=v0.38.8 title="ThreeD Release Skill Parameters" since=v0.38.6`

| Parameter | Meaning |
| --- | --- |
| `version` | Target release. Accept an exact version (optional leading `v`), including a prerelease suffix. For `vX.Y.next`, increment the current checkout package's patch when its major and minor match the requested series. If the series differs or the target is ambiguous, resolve the target with Marty before editing. |
| `title` | Optional release title. Preserve supplied capitalization, spacing and punctuation. Prefix a bare title with the target version once. An existing commit's exact subject remains authoritative for that commit. |
| `since` | Optional preceding release for the GitHub Description. Exclude it and include the target. With no override, use the last published GitHub Release. Verify actual publication and production separately for the series summary even when a baseline is supplied. |

Treat quoted values as literal text. Resolve conflicting targets, versioned titles or impossible ranges before changing release files. Parameters select release inputs; the standard validation gates and manual publication permissions still apply.

## Resume an existing release

Treat “run the skill” as an execution request. “Implement this, then run the skill” includes both the workflow edit and the release run. A request to save or review skill instructions by itself ends with the skill work.

On “continue” or “run the saved sub-tasks,” recover the target and progress from the matching release record, Git state and available conversation. Use that same release record to leave a fresh chat enough evidence to resume: which candidate was checked, which gates passed or failed, which confirmations apply, and the first unfinished step. Preserve approved release wording there when later drafts must reproduce it. Resume an in-progress check or perform the first unfinished, authorized step and continue through the remaining preparation. Reuse passing evidence for matching inputs and revalidate affected inputs when they change.

If the Title and Description have already been delivered and only Marty's manual action remains, identify that action once and stop. Repeat completed deliverables when requested. When Marty confirms deployment, proceed directly to recording that confirmation. Ask for clarification only when a missing fact changes the next action and the available evidence cannot resolve it.

The [v0.38.5 release record](../../../releases/v0.38.5.md) is a worked example of the ordering correction, scoped revalidation, final install evidence and production closeout. Use the current candidate's own measurements. While a long check runs, give a short status update from its actual output and keep monitoring it to completion.

## Establish the release scope

Read [AGENTS.md](../../../../AGENTS.md) and [CONTEXT.md](../../../../CONTEXT.md) in full. Inspect the branch, HEAD, package and lockfile versions, staged and unstaged changes, and untracked release inputs. Compare the working tree with the last documented release and any existing draft for the target. Preserve manual edits and the index. Use the Developer’s title when supplied. Otherwise, name the verified App owner and the change that actually ships. If the diff contains only release metadata, describe it that way.

“Released to production” completes the deployment-confirmation step. Record it once in the matching release record, index and current checkpoint. Validate those documentation changes and report their Git status. Record a subsequent documentation deployment under the same version unless the Developer assigns another. Distinguish the locally observed commit from independently verified deployment and browser evidence.

## Assemble the isolated candidate

Inventory the intended inputs first. Assemble a disposable candidate from the baseline and the in-scope changes, including new files. When unrelated changes share a path, include only the release hunks in the disposable copy and preserve the Developer's files and index. Clarify scope if the changes cannot be separated reliably. Exclude environment files, credentials, developer reference files, active dependencies and build output.

Use the Node version in `.nvmrc` and npm version in `package.json`’s `packageManager`. Inspect the scripts and use matching isolated dependencies for preparation and validation. Bootstrap them here if needed, including for schema generation. The final clean-install milestone still runs after the build and handoff drafting.

## Prepare release metadata and verify the assembled inputs

Migration confirmation belongs to the feature checkpoint that introduced the migration. Carry its recorded status into release preparation. If required evidence is missing, track it under that feature’s rollout prerequisites. A later version or a request to draft historical release notes does not reopen a confirmed migration.

For a release-preparation request, complete the following steps in the feature or documentation checkpoint itself. When the Developer specifies the version, apply it immediately. Before presenting a commit-ready title, verify that the manifest, both root lockfile versions, generated snapshots, release record, index and current checkpoint agree. Then run the candidate validation gates below. A later production confirmation records deployment evidence under the released version. If the Developer assigns follow-up documentation its own version, prepare it under that version and retain the original release history.

1. Set `package.json`’s `version`, `package-lock.json`’s `version`, and `packages[""].version` in the lockfile to the same value, without the leading `v`. For a version-only bump, compare with the pre-edit files to verify that only those fields changed. Preserve any intentional dependency edits already in scope.
2. Run `npm run schema:generate` against the checkout’s source and Git metadata to refresh the Markdown, HTML and JSON schema snapshots. Use the matching isolated dependencies if the checkout has no matching install. Inspect the generated diff. A release version change needs no database operation.
3. Create or update `docs/releases/v<version>.md` with the scope, rollout prerequisites that apply, and observed checks. Update the [release index](../../../releases/README.md) and the current checkpoint in CONTEXT.md. Preserve earlier acceptance and deployment evidence when resuming preparation.

Sync the prepared metadata and any new release files into the candidate. Now compare the assembled files with the intended inputs. Before validation, report the baseline, target, included changes, verified version fields and documents, carried-forward confirmations, outstanding items and next step.

## Verify what will ship

Follow the [repository validation ladder](../../VALIDATION.md) in the isolated candidate.

- Run validation and build with scrubbed credentials, mocked persistence and network isolation that blocks live services and the Developer’s server. A prior release’s ignored tools may be reused after inspection. On a fresh checkout, use a disposable copy and an equivalent guarded environment. Leave Developer servers and live systems untouched.
- Generate fresh route types with the installed Next CLI (`node node_modules/next/dist/bin/next typegen`). Run `npm run typecheck -- --incremental false`, then `npm run validate -- repository-maintenance learn-data-structure` and the checks for the changed features. Include `assets` when production Animation files or their manifest change. Run `npm run validate -- ci`, then the guarded `npm run build`.
- Compare the built candidate’s source, assets and configuration by hash against the intended release inputs. Record actual exit results, warnings, known audit findings and outstanding checks. Revalidate affected inputs if they change. For a documentation-only evidence update, recheck links and final input parity.

## Prepare the handoff

Before suggesting a Git commit, review the release record and conversation for each Next Steps confirmation required before commit. Accept explicit Developer confirmations and record them once. While a prerequisite is outstanding, report the pending item under **Next Steps** and omit the suggested commit, including when asked for a title. Deployment and post-deployment checks follow the commit.

Review the final diff, whitespace and acceptance record. When Marty identifies a technical or workflow defect, turn it into an observable check, make the correction, and record the result against the current candidate. Codex owns the conclusion for checks it can perform. Request Developer input only for a genuinely external prerequisite or decision. Prepare the handoff privately, including the release-record link and any unrelated staged changes. Keep preparation edits unstaged. Each Git write, publication or deployment requires explicit authorization for that action.

### Draft the GitHub Release

Identify the last published GitHub Release using the Developer-supplied baseline or the repository’s published Releases. Cover the documented versions after that baseline through the target version, inclusive. Resolve an unknown baseline before finalizing the range.

For the GitHub Release form, draft exactly two copyable fields, each in its own fenced Markdown block with its label outside the fence:

- **Title** — Use the target version’s exact release commit subject from `git show -s --format=%s <release-commit>`, preserving punctuation and capitalization. For a candidate awaiting its first commit, draft the proposed subject as `v<version> - <release title>`. The Title block also serves as the copyable commit title.
- **Description** — Combine the release entries in one block, oldest first. For a range, use each version’s heading and description, including the target version. Preserve previously accepted headings and prose verbatim, including App terminology. When drafting new entries, use the matching release records and include upgrade instructions only when readers must act.

Keep release status, CI results, working-tree details and Next Steps outside both blocks. Keep internal migration confirmations in the release record.

### Prepare the final version-series summary

Gather the evidence for the full minor series (for example, `v0.38.x`) before the final install. For production, check the latest successful deployment to the Production environment and match its exact commit to the release version. Record its timestamp in Pacific time and link the deployment status. If live evidence is unavailable, attribute any production confirmation to Marty and state what remains unverified. Local HEAD, a prepared release record and a published tag alone cannot establish the running version. Verify the latest published GitHub Release separately and preserve the actual tag spelling in its link.

## Final milestone — npm ci

Run a fresh `npm ci` in the isolated candidate as the last validation check. Monitor it to completion and capture the actual console result, exit status and lockfile hashes before and after. If it fails or the hash changes, diagnose the cause, continue independent work and retry after an authorized correction. Report a blocker only when further progress requires external action. If candidate content changes, revalidate affected inputs and repeat the final clean install. Then carry the work through evidence recording, the handoff, and production closeout when deployment is confirmed.

After success, record the result. When the evidence satisfies the release criteria, deliver the prepared fields and readiness statement directly. In the surrounding chat, show the actual final install console line, exit status and lockfile integrity result. Distinguish gates run this time from prior results verified against matching inputs. Never ask Marty to certify Codex's tests, completion, or resolution of a testable defect. If a criterion is still unmet, identify the specific missing evidence and continue authorized work. A request solely for historical release notes can use the drafting instructions independently.

**Final output rule.** End a completed release handoff with the entire version-series summary in one fenced `markdown` block, after the GitHub form fields. For a request specifically for the summary, provide that block directly. Include all of the following in the block, even when the request corrects only the status:

1. `# ThreeD Garden v<major>.<minor>.x` and a brief overview of the series.
2. `## Version highlights` with one entry per documented version, oldest first, using its release title and a concrete description of what changed.
3. `## Release status` with distinct **Production**, **GitHub Releases**, and **v<target> validation** paragraphs. Use the verified deployment and publication evidence above. Report the target candidate's observed CI count, build result, input parity, and final clean-install console result, exit status, and lockfile integrity where available.

The summary is the last copyable artifact. Finish the remaining authorized work, then use Marty's preferred `-||- done.` on its own final line as a conversational cue.
