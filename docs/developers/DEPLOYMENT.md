# Deployment

Production is deployed from GitHub `main` to Vercel.

Before release:

1. Review the entire diff and confirm the intended version scope.
2. Run `git diff --check`, `npm run typecheck`, and any targeted validation.
3. Run `npm run validate:assets` when static character assets changed.
4. Run `npm run build` when the validation ladder calls for it.
5. Complete relevant manual Admin, Dashboard, ownership, project-scoping, and ThreeD checks.
6. Confirm no secrets, `.env` files, generated output, or unrelated work are staged.

After pushing, require the GitHub validation workflow and Vercel production build to succeed. Smoke-test authentication, project loading, the changed feature, and one unaffected critical path in production. Record the release in `docs/releases` only after the production checkpoint is confirmed.
