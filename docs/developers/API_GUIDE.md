# API Guide

API routes live under `src/app/api`. The maintained domain families include:

- `/api/project` for project, module, and asset management.
- `/api/music` for owner-scoped Music CRUD and media behavior.
- `/api/threed` for ThreeD CRUD and world actions.
- `/api/traffic` for Traffic CRUD and integrations.
- `/api/map` for project-scoped Dashboard loading.

## Access conventions

- Authenticate before returning or mutating private data.
- Scope owner-managed records to the authenticated user.
- For Dashboard project loading, require the relevant module relationship and explicit active asset assignment.
- Validate route parameters and request bodies before database work.
- Return a clear status and error message without exposing credentials or internal connection details.

`/api/threed/world-actions` is an intentional write path used by supported ThreeD actions. Its persistence must remain project-scoped and follow successful animation completion in the client.

Inspect the actual route handler and the relevant Drizzle schema before changing an endpoint. This guide describes policy, not a frozen request/response contract.
