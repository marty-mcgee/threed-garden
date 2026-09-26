# ThreeD Garden repository migration

## Status

Completed through [PR #48](https://github.com/marty-mcgee/threed-garden/pull/48), merged to main as `4ec590e28b160851b54b88f8a5ce37b1375281ff`. Both histories and the legacy archive references remain preserved. The User reported the migration working successfully. The new clone now prepares [v0.22.0](v0.22.0.md) as its independent release checkpoint.

The User approved the migration and confirmed that the new deployment should reuse the existing Marty McGee Neon database and uploaded assets. No database creation, data import, schema push, credential copying, or domain/deployment settings changes were performed.

## Provenance and preservation

| Reference | Commit / purpose |
| --- | --- |
| Legacy destination main | `3685494592b5bbbf1a6295b5d9ead5d84605dcf8` — package v0.17.4-alpha.2 |
| `legacy-v0.17` | Remote branch preserving that exact legacy commit |
| `legacy-v0.17.4-alpha.2` | Remote archival tag preserving the same commit |
| Modern source main | `c3380867c44d4f81850a7d2ccc107b00583bc548` — ThreeD Garden v0.21.1 from `marty-mcgee/marty-mcgee-neon` |
| Migration tree | Modern source application, destination identity updates, migration documentation, and the existing MIT license |

The migration is a two-parent merge: the legacy main history is the first parent, and the modern source history is the second. The working tree intentionally adopts the modern application instead of mixing legacy and modern toolchains. The legacy MIT license is retained byte-for-byte.

Use **Create a merge commit** for the final pull request. Do not squash or rebase this migration: the source-history parent must remain reachable from destination main. Existing repository issues, stars, watchers and releases remain in the original repository. The source repository remains intact.

The archival branch preserves source history; it does not by itself provide a separately configured live legacy deployment. External legacy application data also remains outside this Git migration.

## Scoped adaptations

- Package identity becomes `threed-garden`, with destination repository/issue metadata and the retained MIT license declaration.
- README CI badge, repository references and application repository links target `marty-mcgee/threed-garden`.
- README links directly to `legacy-v0.17` and distinguishes the modern app baseline from destination deployment status.
- Setup instructions ask for an untracked local environment file because no environment template is tracked in the modern source.
- Dependency resolutions, the modern Drizzle schema, runtime implementations and API behavior are preserved. Application source changes only update repository hyperlinks.

## Validation

Completed in an isolated checkout without environment files:

- Fresh `npm install` passed under Node 24.13.0 / npm 11.6.2.
- Dependency lock data matches the modern source except package name and root license metadata.
- `npm run typecheck` passed.
- `npm run validate -- ci` passed all 41 tasks.
- The modern schema matches the source commit exactly.
- Legacy license preservation is byte-for-byte.
- Migration-specific diff and README local-link checks passed. The full legacy-to-modern diff includes pre-existing whitespace in imported files; those files were not reformatted.

The migration's [hosted main-branch CI](https://github.com/marty-mcgee/threed-garden/actions/runs/36263523874) and [Vercel production deployment](https://vercel.com/marty-mcgees-projects/threed-garden/Azocix5Dt2bo3M2QacT6iEQeqSiq) succeeded. The User subsequently reported that the migration worked successfully. Future release builds remain User-owned. Existing dependency audit findings and Three.js/postprocessing peer warnings are inherited, not resolved by this repository migration.

## Original deployment review checklist

At preparation time, Vercel was already attached and the separate GitHub Pages `main:/docs` build had failed. After the merge, both Vercel and GitHub Pages deployments succeeded. The checklist below records the original cutover review; the User is managing environment/settings alignment separately.

1. Review the draft PR and its GitHub validation result.
2. In the destination Vercel project, verify Next.js framework detection, Node 24, npm installation, `npm run build`, and the existing database/storage/auth configuration. Transfer or reference configuration through the hosting dashboard; never commit secrets.
3. Configure the preview auth URL/allowed origins for the selected hostname while retaining the production configuration. Verify that uploaded assets resolve from the existing storage.
4. Test sign-in, Project loading, Scene Models/Characters, Admin access and multimedia in the preview. The preview will use the existing database, so avoid destructive test actions.
5. Decide whether to disable the old Pages deployment or configure a deliberate documentation site. It is not the Next.js application host, and its build notifications are separate from app CI and Vercel.
6. Complete the User-owned production build gate and explicitly approve the main-branch merge. Use a merge commit, then verify the production deployment and domains.
7. Keep `marty-mcgee-neon` intact until destination production is confirmed. Any source-repository archival notice or Vercel reconnection is a later, explicit step.

## Recovery

Before merging, abandoning the migration branch leaves both production branches untouched. After merging, prefer reverting the final merge commit through review over force-pushing history. Coordinate any application rollback with Vercel; no database rollback is implied or performed. The legacy branch and tag remain available regardless of that decision.
