# Safe Change Areas

| Change area | Normal requirement |
|---|---|
| Documentation and comments | Verify links and factual accuracy; no behavior changes. |
| UI styling and copy | Inspect shared layout and responsive behavior; run typecheck and manual UI checks. |
| CRUD/API behavior | Verify auth, ownership, project scope, validation, and consumers. |
| ThreeD scene or character behavior | Preserve both character paths, semantic actions, external FBX loading, and crossfades; run the manual checklist. |
| FarmBot credentials, identity, or REST behavior | Preserve server-only secrets, owner scope, fixed-host requests, bounded responses, and redacted errors; run FarmBot validation. |
| MQTT or physical FarmBot behavior | Requires approval for the next ThreeD FarmBot Integration Plan phase; do not implement inside a Vercel request handler. |
| Database schema or persistence expansion | Requires explicit user approval and a rollback/migration plan. |
| Environment or secrets | Do not edit or expose unless explicitly requested. |

Do not combine repository restructuring with feature behavior changes. Preserve unrelated user changes in a dirty worktree. Treat production ThreeD behavior listed in `AGENTS.md` as release-blocking.
