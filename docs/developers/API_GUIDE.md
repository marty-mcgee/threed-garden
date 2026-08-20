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

## ThreeD FarmBot routes

The v0.18.0+ FarmBot routes are authenticated and owner-scoped:

- `/api/threed/farmbots` provides sanitized FarmBot CRUD and never returns credential material.
- `/api/threed/farmbots/:id/credential` manages only the encrypted credential boundary; its `login`, `test`, and `refresh` children perform the documented bounded REST workflows.
- `/api/threed/farmbots/:id/peripherals` and `/peripheral-bindings` provide read-only discovery and explicit Water configuration. Assignment does not operate hardware.
- `/api/threed/farmbots/:id/broker-metadata` and `/mqtt-readiness` expose redacted diagnostics for a future MQTT worker.
- `/api/threed/farmbots/:id/mqtt-runtime` and `/mqtt-events` expose owner-scoped current worker status and paginated normalized history. Browser clients may read or clear history but cannot create or edit broker events.
- `/api/threed/farmbots/:id/mqtt-session` starts, reads, or stops an owner-scoped read-only worker session after the existing MQTT readiness checks. The browser never receives the connection grant or credential, and the route exposes no publish or command operation.
- `/api/internal/threed-mqtt/farmbot/events` accepts bounded, HMAC-signed, identity-checked worker batches. It is not a browser API and never accepts raw broker payloads.
- Generic command, polling, Water, and movement routes remain authenticated but return `503`; they do not invoke FarmBot hardware.

Use the [ThreeD FarmBot Integration Plan](FARMBOT_INTEGRATION.md) for credential, identity, MQTT, and physical-command safety requirements. Do not add an assumed REST command endpoint or a new FarmBot resource without reviewing that plan and the official FarmBot API.

Inspect the actual route handler and the relevant Drizzle schema before changing an endpoint. This guide describes policy, not a frozen request/response contract.
