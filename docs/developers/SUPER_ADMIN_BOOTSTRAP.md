# First Super Admin bootstrap

The existing Users Module distinguishes Admin (owned content through user_id) from Super Admin (installation-wide settings and User roles). Global permissions now require a current active, non-deleted super_admin account. JWT role values do not grant access. Other content authorization remains unchanged; Super Admin does not implicitly bypass private-content ownership.

Developer confirmed the audit SQL and first-Super-Admin bootstrap succeeded on October 27, 2026. Do not rerun bootstrap on that initialized database. The instructions below apply to another installation or database. Browser permission checks remain separate.

## Manual activation order

1. Review and manually run [audit compatibility SQL](sql/user-role-audit-super-admin.sql). The original user-role-audit-create.sql has already been applied to the Developer database; do not rerun it. A fresh installation needs the original CREATE followed by the compatibility ALTER.
2. Before using the Users CRUD code, manually apply [User soft-delete SQL](sql/user-soft-delete.sql). Existing accounts are backfilled with is_deleted = false; App creation supplies that value explicitly, with no database default. Use this updated code for role management; do not permit older role-management code to write during the transition. The updated interface denies global management until a Super Admin exists.
3. Identify your existing active account by its immutable User ID. If needed, run a manual read-only query in your database console: SELECT id, email, role, is_active, is_deleted FROM public."user" WHERE email = 'YOUR_ACCOUNT_EMAIL';. Confirm exactly the intended account. The command never creates an account or chooses the first registrant.
4. From the repository root, run the eligibility check below. It connects to the configured database but makes no writes.
5. After confirming the target/database and SQL prerequisite, run with --apply. This is a live database write performed by the installing developer.
6. Reload App Settings and Admin > Users. Confirm Super Admin controls work and ordinary Admin accounts cannot access User records or change global styling.

Read-only eligibility check:

    node src/libraries/scripts/bootstrap-super-admin.cjs --user-id "YOUR_EXISTING_USER_ID"

Explicit promotion:

    node src/libraries/scripts/bootstrap-super-admin.cjs --user-id "YOUR_EXISTING_USER_ID" --apply

The command reads DATABASE_URL from the existing environment or local Next.js development environment files. It does not print credentials or load an arbitrary environment supplied by a web request. Verify the intended database in your developer environment before running it. --help loads no database or environment files.

## Safeguards and audit meaning

The command permits only an existing active, non-deleted account whose role is user or admin. Any existing Super Admin, including inactive ones, closes bootstrap. A shared transaction advisory lock serializes bootstrap with current App role writes. Promotion and audit insert commit together; a missing audit table or incompatible constraint rolls back the promotion. Repeated/concurrent bootstrap cannot appoint another Super Admin through this command.

For this developer-operated bootstrap, actor_user_id and target_user_id both identify the promoted account: the installing developer attests to that identity. This is not a claim of a browser-authenticated action. Later App role changes record the authenticated Super Admin as actor. Database operators retain database-level authority outside App guards.

Once initialized, an active Super Admin can appoint another through Admin > Users. Demotion of the last active Super Admin is rejected. A hard maximum of two is not yet enforced because that policy remains undecided. The Users Module now supports confirmed soft deletion with self-deletion, content-ownership and last-active-Super-Admin guards. Account activity remains read-only. Deleted identities cannot be bootstrapped; any existing Super Admin, even deleted, keeps first-account bootstrap closed.

## Ordinary Admin follow-up

New-account defaults belong to App code: the Auth adapter explicitly assigns admin at creation and overrides provider-supplied roles. Existing database defaults are not changed. The signup form now creates an ordinary Admin through /api/auth/register, then signs in through the credentials provider. The registration service and adapter both use the same App default; neither accepts a privileged signup role.

For an existing legacy User, use Admin > Users > Edit > Role: Admin > Save Changes. This uses the audited role editor. The proposed SQL migration was withdrawn; do not use SQL to set the App default or rerun bootstrap.

## Users CRUD and deletion

Super Admins can use Add New User to create a credentials account with name, email and an initial password. The shared registration service assigns Admin, active and not-deleted in App code. NextAuth remains the authentication/session owner. Creation never signs the acting Super Admin into the new account. There is no invitation email or password-reset workflow in this change.

Edit User saves name, normalized email and role with a revision check. Role changes retain their existing atomic audit entry; profile edits and deletion do not add a new general-purpose audit schema. Changing email clears email verification. Deleted-account email addresses stay reserved.

Delete User requires the exact saved email and sets user.is_deleted = true. It never physically deletes a row or removes credentials, preferences, relationships or audit history. The App blocks deletion when the User owns Module content (67 declared ownership columns, including watering created_by); personal preferences and authentication records do not count as content. Deleted Users can be viewed through the list filter but cannot be edited or restored through the App in this stage.

NextAuth checks is_deleted on credentials login and every JWT/session resolution. Missing or deleted accounts receive no authenticated session, including when the flag was changed in an external SQL editor. Existing in-flight requests are not retroactively cancelled and already-rendered data is not remotely erased; the next session check denies access. A deleted User has the same access to public pages as any anonymous visitor. Global Settings and Users mutations also recheck the deletion flag transactionally. The adapter physical-delete method is blocked.

Apply the column SQL before this code: a missing field fails closed and prevents authentication. Retain the field and flags on rollback; reverting to code that ignores them would reopen access. No production DB operation or live signup/deletion test is performed by the agent.
