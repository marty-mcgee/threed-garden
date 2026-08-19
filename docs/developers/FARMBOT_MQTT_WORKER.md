# FarmBot MQTT Worker Design

Status: v0.18.1 Phase 2A design review. No worker process, MQTT connection, runtime-status endpoint, database change, or physical command is implemented by this document.

## Goal

Phase 2 adds a read-only runtime boundary that can maintain FarmBot MQTT connections outside Vercel. It must prove connection lifecycle, device identity, safe status parsing, and failure handling before command support is considered.

The worker is not part of the ThreeD character runtime. Character animation, World Actions, and physical-device state remain separate systems.

## Current implementation

The v0.18.0 App already provides:

- owner-scoped encrypted FarmBot credentials;
- verified REST and broker identities on `threed_farmbots`;
- a current broker-metadata snapshot;
- an owner-scoped MQTT-readiness preflight; and
- disabled command routes and a fail-closed poller command boundary.

The repository does not currently contain an MQTT client dependency, worker entry point, service-to-service authentication boundary, worker health endpoint, or runtime-status store.

## Approved architectural direction for review

### Runtime

- Use a standalone TypeScript/Node.js worker kept in this repository and deployed as a separate long-running service.
- Do not run the worker in a Next.js route, Vercel Function, browser, ThreeD component, or scheduled request.
- Start Phase 2 with one worker replica and one in-memory connection registry keyed by the App FarmBot database ID.
- Do not add horizontal replicas until a distributed connection lease prevents two workers from owning the same FarmBot session.
- Keep the worker deployment-provider neutral. Selecting or creating the external host remains a separate approval.

### MQTT client selection

FarmBot's official documentation recommends MQTT for non-browser applications. It also states that FarmBotJS is not tested by FarmBot in production Node.js environments. Phase 2B must therefore begin with a local, read-only compatibility test before the transport is selected.

The test must compare:

1. a maintained Node MQTT client using broker values derived from the FarmBot JWT; and
2. FarmBotJS only if its Node runtime, reconnect behavior, event cleanup, and status parsing can be verified.

No package should be added until that test plan is approved. The selected adapter must expose a small internal interface so later code does not depend directly on either library.

### Credential transfer

- The browser never calls the worker and never receives the FarmBot JWT, encrypted envelope, broker password, or worker shared secret.
- The App remains the only component that reads and decrypts stored FarmBot credentials.
- After App authentication, ownership checks, and MQTT readiness pass, the App may push a connection grant to the worker over HTTPS.
- A grant is valid for acceptance for at most five minutes and cannot outlive the FarmBot token. The worker may retain the token in memory only for the accepted session and must discard it on disconnect, replacement, expiry, or shutdown.
- The worker must not persist credentials, include them in errors, or place them in structured logs.
- A worker restart begins empty; the App must explicitly grant each connection again. Automatic fleet startup is deferred.

### Service-to-service authentication

App-to-worker requests use a dedicated versioned HMAC-SHA-256 protocol over TLS. The signed input includes:

- protocol version;
- HTTP method and normalized path;
- Unix timestamp;
- cryptographically random nonce; and
- SHA-256 digest of the exact request body.

The worker rejects invalid signatures, timestamps outside a short clock window, previously used nonces, unsupported protocol versions, oversized bodies, and unexpected content types. Signature comparison must be timing-safe. Nonces are retained at least as long as the accepted clock window.

The shared service key belongs only in the App and worker deployment environments. It is independent of FarmBot credential-encryption keys. Environment names and key rotation steps will be chosen when Phase 2B is approved; no environment file is changed in Phase 2A.

### Connection identity

Before connecting, the worker requires one immutable grant containing only:

- App FarmBot ID;
- App owner ID used as an opaque scope value;
- verified `farmbotDeviceId`;
- verified `brokerDeviceId`;
- MQTT endpoint and vhost derived from the current credential;
- FarmBot token issue and expiration times;
- connection-grant issue and expiration times; and
- the FarmBot JWT.

The worker reparses the token and requires all supplied broker fields to match its claims. It also requires `brokerDeviceId === "device_" + farmbotDeviceId`. A mismatch fails before opening a socket.

### Read-only topic policy

Phase 2 may subscribe only to exact topics built by the worker from the verified broker device ID:

- `bot/{brokerDeviceId}/status`
- `bot/{brokerDeviceId}/from_device`

Human-readable `logs` are deferred because they may contain user or device information that does not belong in the initial status summary. Wildcard subscriptions, `from_clients`, resource-sync topics, telemetry, and every publish operation are prohibited in Phase 2.

The transport interface must not expose a publish method. This makes command publication unavailable by construction during the read-only phase.

### Runtime status

The first worker status model is volatile and allowlisted:

- connection state;
- connection-state change time;
- last broker message time;
- last valid status time;
- last known numeric X/Y/Z position;
- FarmBot token expiration time;
- stale flag;
- reconnect attempt count; and
- a stable redacted error code.

The worker must discard the complete status tree after extracting approved fields. It must not log or return raw MQTT payloads. Invalid JSON, excessive payload size, wrong topic, invalid coordinates, and unexpected message shapes are ignored and counted without terminating the process.

The initial App status path should query the worker through a signed internal request and proxy only this allowlisted model after normal App authentication, ownership, and active Project-asset checks. This avoids a Phase 2 database change. Durable status history can be proposed later if a proven product need justifies schema approval.

## Connection lifecycle

Each FarmBot session has these states:

```text
disconnected -> connecting -> connected
                     |            |
                     v            v
                   error <- reconnecting
                     |
                     v
                  expired
```

Required rules:

- Only one active or connecting session may exist for an App FarmBot ID.
- A repeated matching grant is idempotent; a changed credential replaces the old session only after validation.
- Token expiry cancels reconnect work and moves the session to `expired`.
- Reconnect uses capped exponential backoff with jitter and a maximum consecutive-attempt limit.
- Disconnect and shutdown remove subscriptions, timers, event listeners, token references, and cached raw messages.
- The process handles termination signals and stops accepting grants before closing sessions.
- Health distinguishes process health from FarmBot connection health.

Exact timeout, payload-size, stale-status, and reconnect values will be fixed in Phase 2B tests rather than hidden as unexplained constants.

## Proposed internal boundaries

These are design-level boundaries, not implemented routes:

| Boundary | Direction | Responsibility |
|---|---|---|
| Connection grant | App -> worker | Start or replace one verified, read-only FarmBot session. |
| Disconnect | App -> worker | Remove one session and clear its in-memory credential and status. |
| Runtime status | App -> worker | Return one allowlisted in-memory status summary. |
| Worker health | deployment platform -> worker | Report process readiness without FarmBot credentials or fleet details. |

Browser-facing App routes must continue using Next Auth.js and owner/project checks. They must never proxy arbitrary worker paths or bodies.

## Phase 2B acceptance criteria

Before any live MQTT test, Phase 2B must prove locally that:

- request signing rejects tampering, replay, expired timestamps, and wrong keys;
- grant parsing rejects identity and broker-metadata mismatches;
- the session registry enforces one connection per FarmBot;
- lifecycle transitions, reconnect limits, expiry, and shutdown are deterministic;
- status parsing returns only approved fields and rejects unsafe payloads;
- no worker interface contains a publish operation;
- credentials and raw messages are absent from logs and serialized status; and
- the existing App typecheck and FarmBot validation still pass.

A later read-only live test requires separate approval to configure a worker host and open the MQTT connection. Passing Phase 2B does not authorize Phase 3 commands.

## Files expected in Phase 2B

The likely implementation is additive and may include:

- `workers/farmbot-mqtt/` for the standalone entry point, lifecycle registry, transport adapter, status parser, internal HTTP boundary, and focused tests;
- `src/lib/services/threed/farmbot/worker-auth-core.ts` for shared pure signing and verification rules;
- `src/lib/services/threed/farmbot/worker-client.ts` for the server-only App client;
- narrow authenticated App routes for connect, disconnect, and status only after their owner/project rules are specified;
- `package.json` scripts and the selected MQTT dependency after the compatibility test; and
- validation documentation after the implementation passes.

No schema file, ThreeD character file, World Action route, or environment file belongs in Phase 2B unless separately approved.

## References

- [FarmBot message broker](https://developer.farm.bot/v15/docs/message-broker)
- [FarmBot broker topics and commands](https://developer.farm.bot/v15/docs/message-broker/sending-commands.html)
- [FarmBotJS runtime support](https://developer.farm.bot/v15/docs/farmbot-js.html)
- [FarmBot RPC acknowledgement labels](https://developer.farm.bot/v15/docs/celery-script/identifying-success-and-failure.html)
