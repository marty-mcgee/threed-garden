# Deployment

Production is deployed from GitHub `main` to Vercel.

Before release:

1. Review the entire diff and confirm the intended version scope.
2. Run `git diff --check`, `npm run typecheck`, and any targeted validation.
3. Run `npm run validate:assets` when static character assets changed.
4. Run `npm run build` when the validation ladder calls for it.
5. Complete relevant manual Admin, Dashboard, ownership, project-scoping, and ThreeD checks.
6. Confirm no secrets, `.env` files, generated output, or unrelated work are staged.

For v0.18.0 also require:

1. Run `npm run validate:farmbot-crypto`.
2. Confirm the production database has the reviewed FarmBot encrypted-envelope, peripheral-binding, broker-metadata, and parent-identity schema before deploying code that selects those columns.
3. Configure `FARMBOT_CREDENTIAL_KEY_VERSION` and every retained `FARMBOT_CREDENTIAL_KEY_V<n>` in the Vercel server environment. Never expose them as `NEXT_PUBLIC_*` values.
4. Confirm existing encrypted records reference key versions that remain configured.
5. Verify general FarmBot CRUD and map responses contain no legacy token, encrypted envelope, or broker snapshot values.
6. Confirm command, polling, Water, and movement routes still return `503` after authentication.
7. Complete the FarmBot Admin and ThreeD targeting checks in [Agent Validation](../agents/VALIDATION.md).

After pushing, require the GitHub validation workflow and Vercel production build to succeed. Smoke-test authentication, project loading, the changed feature, and one unaffected critical path in production. Record the release in `docs/releases` only after the production checkpoint is confirmed.
