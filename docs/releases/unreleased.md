# Unreleased: Users CRUD, account defaults and sign-in

Developer corrected the approach: defaults belong to ThreeD App, not SQL. The proposed bulk migration/default SQL is withdrawn and contains no executable statements. Existing schema/database default declaration is retained to avoid a database change; App account creation explicitly supplies admin through its Auth adapter wrapper, overriding any role supplied by provider input. Existing account updates and Super Admin bootstrap remain separate.

Developer inventory reported one active Super Admin and one active legacy User. Change the legacy account using Admin > Users > Edit role > Admin > Save Changes; existing audited role-save behavior handles this. No live data changes or migration were run by the agent.

NextAuth remains the App's authentication and session owner. Its configured Credentials provider signs in existing accounts; the signup service below creates the account before calling NextAuth signIn. Focused tests verify explicit ordinary Admin assignment and rejection of provider-supplied privileged defaults. Package remains 0.28.0; this is unreleased follow-up.

## Signup flow

Signup now POSTs to /api/auth/register before credentials sign-in. The new service validates bounded name/email/password input, rejects extra fields including role, assigns the App default admin and active status, hashes the password with bcrypt cost 12, and atomically inserts User and credentials account. Case-normalized email registrations serialize under a per-email transaction lock and check existing email case-insensitively. Request origin and actual streamed body length are checked; database errors remain generic. No SQL/default migration or privileged role selection is needed.

The form retains existing styling, prevents duplicate submissions, clears passwords after completion, and explains when account creation succeeded but sign-in failed, directing the User to the existing Sign in link. No automatic Super Admin assignment or email-verification claim is introduced. Account ownership/global guards remain unchanged.

Fresh TypeScript and focused offline registration/role tests passed. Service persistence/hash and UI network are mocked; real signup/sign-in/browser acceptance remains pending. No live accounts created by the agent.

## Users CRUD and soft deletion

Developer approved Super Admin Add/Edit/Delete in the existing Users Module, chose blocking deletion while the User owns content, and required soft deletion only via `user.is_deleted`. New User uses the shared credentials creation transaction with App-owned Admin/active/not-deleted values. NextAuth remains the authentication/session owner; creating a User does not replace the acting Super Admin's session.

The existing Users workspace now provides Add New User, editable name/email/role, explicit Save/Discard, typed-email deletion confirmation and Current/Deleted/All filters. Deleted records remain readable but not editable. Role changes preserve their atomic audit; this change does not add profile/deletion audit events or a restore/password-reset/invitation workflow.

Deletion sets the flag only; identity, credentials, preferences, relationships and history remain. Self-deletion and last-active-Super-Admin removal are blocked. The ownership check covers 67 declared Module tables/columns, including the non-FK watering creator. Deleted emails cannot be reused. Stale revisions, duplicate creation and forbidden extra fields are rejected. API bodies are bounded and origin checked. No destructive live operation occurred.

NextAuth denies credentials login and JWT/session resolution when `is_deleted` is not false, including external SQL updates. Fresh session reads refresh edited name/email. Global Settings and Users transactional authority checks also reject deleted accounts. Adapter physical deletion is blocked. Already-authorized in-flight requests are not retroactively cancelled; anonymous public visibility is unchanged.

**Manual prerequisite:** apply [user-soft-delete.sql](../developers/sql/user-soft-delete.sql) before this code. It adds the non-null column and backfills existing accounts false, with no SQL default or role/activity changes. Existing-column failure prevents overwriting flags. No full db:push is needed. Developer confirmed application of the prerequisite and restored login, followed by the requested Users check. Independent PostgreSQL concurrency verification remains pending. Retain flags on rollback; older code without the check would reopen access.

Fresh TypeScript and focused `users-admin signup module-appearance` checks passed with mocked database/hash/network boundaries. Expanded Users UI tests cover create payload/duplicate-submit protection, edit drafts, failed/successful deletion and read-only deleted records. The access test exercises the actual NextAuth configuration and all 67 ownership checks with mocked persistence. Full offline CI passed all 96 tasks after retrying outside the Windows sandbox: the initial attempt stopped in an unrelated tsx FBX test with uv_os_get_passwd ENOMEM. Fresh TypeScript and whitespace checks passed. No agent-run production build or deployment is claimed.

## Sign-in presentation

Developer confirmed login restored after applying the User soft-delete prerequisite, then confirmed the requested Users CRUD check. These are Developer acceptance reports, not independent database observations. Do not rerun the column creation script.

The main /auth/sign-in page now uses the Home green/blue palette, ThreeD Garden / ThreeD App branding, a responsive introduction and sign-in card, larger form controls, Home/Learn/signup links, password visibility, accessible error/status feedback and a synchronous duplicate-submit guard. NextAuth Credentials and the existing /admin destination remain. No authentication provider or database change is part of this presentation work.

Fresh TypeScript and focused signup/sign-in checks passed (mocked authentication/hooks). Developer accepted the sign-in presentation on October 27, 2026 and requested its inclusion in this same unreleased checkpoint. Separate mobile/theme coverage was not reported; earlier full CI evidence applies to the preceding checkpoint.

## Prepared checkpoint scope

Includes App-owned account defaults, NextAuth signup handoff, Super Admin Users CRUD, retained soft-deleted accounts/access denial, and the accepted sign-in presentation. Documentation and acceptance are consolidated here. Package/root lock remain 0.28.0; no new release number was requested. Changes remain unstaged and unreleased. The latest presentation passed fresh TypeScript and focused authentication UI checks; the Developer subsequently reported final verification after the production-build verification handoff. Build logs, command details and exact verified commit were not supplied; this is Developer confirmation, not an independently observed build.

## Developer verification ? October 27, 2026

Developer reported ?Verified? following the final production-build verification handoff and requested documentation updates and a Git commit title. The checkpoint includes all accepted Users/signup/sign-in changes above. No deployment, staging or commit is performed by the agent. Preserve the distinction between Developer verification and the recorded offline automated checks.
