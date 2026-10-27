# First Super Admin bootstrap

The existing Users Module distinguishes Admin (owned content through user_id) from Super Admin (installation-wide settings and User roles). Global permissions now require a current active super_admin account. JWT role values do not grant access. Other content authorization remains unchanged; Super Admin does not implicitly bypass private-content ownership.

Developer confirmed the audit SQL and first-Super-Admin bootstrap succeeded on October 27, 2026. Do not rerun bootstrap on that initialized database. The instructions below apply to another installation or database. Browser permission checks remain separate.

## Manual activation order

1. Review and manually run [audit compatibility SQL](sql/user-role-audit-super-admin.sql). The original user-role-audit-create.sql has already been applied to the Developer database; do not rerun it. A fresh installation needs the original CREATE followed by the compatibility ALTER.
2. Use this updated code for role management; do not permit older role-management code to write during the transition. The updated interface denies global management until a Super Admin exists.
3. Identify your existing active account by its immutable User ID. If needed, run a manual read-only query in your database console: SELECT id, email, role, is_active FROM public."user" WHERE email = 'YOUR_ACCOUNT_EMAIL';. Confirm exactly the intended account. The command never creates an account or chooses the first registrant.
4. From the repository root, run the eligibility check below. It connects to the configured database but makes no writes.
5. After confirming the target/database and SQL prerequisite, run with --apply. This is a live database write performed by the installing developer.
6. Reload App Settings and Admin > Users. Confirm Super Admin controls work and ordinary Admin accounts cannot access User records or change global styling.

Read-only eligibility check:

    node src/libraries/scripts/bootstrap-super-admin.cjs --user-id "YOUR_EXISTING_USER_ID"

Explicit promotion:

    node src/libraries/scripts/bootstrap-super-admin.cjs --user-id "YOUR_EXISTING_USER_ID" --apply

The command reads DATABASE_URL from the existing environment or local Next.js development environment files. It does not print credentials or load an arbitrary environment supplied by a web request. Verify the intended database in your developer environment before running it. --help loads no database or environment files.

## Safeguards and audit meaning

The command permits only an existing active account whose role is user or admin. Any existing Super Admin, including inactive ones, closes bootstrap. A shared transaction advisory lock serializes bootstrap with current App role writes. Promotion and audit insert commit together; a missing audit table or incompatible constraint rolls back the promotion. Repeated/concurrent bootstrap cannot appoint another Super Admin through this command.

For this developer-operated bootstrap, actor_user_id and target_user_id both identify the promoted account: the installing developer attests to that identity. This is not a claim of a browser-authenticated action. Later App role changes record the authenticated Super Admin as actor. Database operators retain database-level authority outside App guards.

Once initialized, an active Super Admin can appoint another through Admin > Users. Demotion of the last active Super Admin is rejected. A hard maximum of two is not yet enforced because that policy remains undecided. Account deactivation and deletion are not offered here; future implementations must preserve the same last-active-Super-Admin invariant.

## Remaining stage

No bulk role conversion or account-default change has run. Legacy user values remain readable/filterable; the editor can assign only admin or super_admin. Existing null/unknown values require review. The database account default remains user until the separate reviewed migration/account-creation stage. Do not infer working registration from this bootstrap; it operates on existing accounts only.

Validation is offline with mocked SQL/persistence and UI hooks. Developer execution and real browser acceptance are separate evidence. The agent does not run the live command or migration.
