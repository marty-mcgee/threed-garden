# FarmBot Adapter for ThreeD MQTT Services

Status: v0.18.2b released and production-verified with the provider-neutral ThreeD MQTT control layer and Phase 3 safety boundary. Phase 4 adds a signed, strictly validated command request and response, dormant server-only worker handoff, process-local idempotency/concurrency gate, RPC correlation, queued signed acknowledgement reporting, and acknowledgement-to-completion coordination only through a disabled executor. MQTT remains read-only, worker health reports commands disabled, and no publish or physical command exists.

## Goal

Phase 2 adds a read-only runtime boundary that can maintain FarmBot MQTT connections outside Vercel. It must prove connection lifecycle, device identity, safe status parsing, and failure handling before command support is considered.

The worker is not part of the ThreeD character runtime. Character animation, World Actions, and physical-device state remain separate systems.

## Phase 1 foundation

The v0.18.0 App already provides:

- owner-scoped encrypted FarmBot credentials;
- verified REST and broker identities on `threed_farmbots`;
- a current broker-metadata snapshot;
- an owner-scoped MQTT-readiness preflight; and
- disabled command routes and a fail-closed poller command boundary.

## Phase 2B implementation

The repository separates shared ThreeD MQTT infrastructure from provider integrations under one MQTT parent. `src/lib/services/threed/mqtt/core`, `transports`, and `worker` own protocol-neutral session, transport, and signed worker behavior. `src/lib/services/threed/mqtt/integrations/farmbot` owns FarmBot grants, identities, topics, status/RPC parsing, session policy, persistence mapping, and the FarmBot worker entry point.

The dependency is one-way: FarmBot imports ThreeD MQTT services. ThreeD MQTT services never import or name FarmBot.

The higher-level ThreeD MQTT boundary is expressed by `MqttReadonlyIntegrationAdapter`. It requires an integration identity, explicit read-only capabilities, a transport connection request, an accepted-topic test, and normalized inbound messages. The shared `session-lifecycle` owns connection states, timestamped transitions, expiry checks, reconnect limits, and capped backoff decisions. `MqttReadonlySessionController` composes these pieces for one provider-neutral read-only session, including stale-callback rejection and late-connect cleanup. The FarmBot registry now uses that controller through provider-owned observer hooks. `FarmBotMqttReadonlyAdapter` implements the provider contract with FarmBot's exact broker identity, secure connection settings, topics, position parsing, and RPC-response parsing.

Implemented and validated:

- versioned HMAC-SHA-256 request signing with body digests, timestamps, nonces, timing-safe comparison, and replay rejection;
- strict five-minute connection-grant acceptance with FarmBot token, endpoint, and REST/MQTT identity cross-checks;
- one owner-bound in-memory session per App FarmBot ID;
- explicit connection states, reconnect-attempt limits, token-expiry handling, cleanup, and graceful registry shutdown;
- exact `status` and `from_device` topic construction with no wildcard or publish interface;
- bounded status payload parsing that retains only numeric X/Y/Z position and discards the full state tree;
- an allowlisted runtime-status model with stale-state and redacted error reporting;
- an internal HTTP skeleton for health, session grant, disconnect, and status; and
- an executable worker whose transport is intentionally `disabled` and returns a safe failure instead of opening MQTT.

`npm run validate:farmbot-worker` exercises the pure modules and a loopback-only HTTP server. It uses fabricated JWT-shaped test data, no database, no stored credential, no FarmBot network request, and no hardware.

The shared MQTT transport and worker authentication have their own provider-neutral `npm run validate:threed-mqtt` check. That test uses neutral integration topics and contains no FarmBot dependency.

## Normalized persistence and Admin activity

The worker now has an optional, batched HTTP persistence sink. It is disabled unless both the App base URL and a dedicated worker-to-App HMAC key are configured in the deployed worker environment. The worker never receives `DATABASE_URL`; the App remains the only Neon/Drizzle boundary.

The signed App ingestion endpoint validates the App FarmBot ID, owner ID, and canonical broker identity before transactionally updating `threed_mqtt_runtime` and deduplicating inserts into `threed_mqtt_events`. Batches contain no credential or raw MQTT payload. Status messages retain only bounded X/Y/Z coordinates plus payload byte count and SHA-256 fingerprint. Unchanged positions produce history no more often than every 30 seconds, while current runtime may still be refreshed. Invalid messages are counted and summarized every ten failures rather than stored individually.

The owner-scoped Admin **MQTT Activity** dialog displays current runtime, stale/expiry information, position, counters, filterable paginated history, payload fingerprints, and an explicit history-cleanup action. Browser clients cannot create or edit these records.

Credential replacement and removal delete the current runtime snapshot because it belongs to the previous worker session. Normalized history is retained until its retention cleanup or an owner explicitly clears it.

`npm run validate:farmbot-mqtt-persistence` validates the allowlisted ingestion shape using fabricated data without a database or network connection. The user successfully applied the approved tables through the reviewed Drizzle workflow.

## Accepted architectural direction

### Runtime

- Use a standalone TypeScript/Node.js worker kept in this repository and deployed as a separate long-running service.
- Do not run the worker in a Next.js route, Vercel Function, browser, ThreeD component, or scheduled request.
- Start Phase 2 with one worker replica and one in-memory connection registry keyed by the App FarmBot database ID.
- Do not add horizontal replicas until a distributed connection lease prevents two workers from owning the same FarmBot session.
- Keep the worker deployment-provider neutral. Selecting or creating the external host remains a separate approval.

### MQTT client selection

FarmBot's official documentation recommends MQTT for non-browser applications. It also states that FarmBotJS is not tested by FarmBot in production Node.js environments. The worker therefore uses a transport-neutral read-only interface and does not depend directly on FarmBotJS.

The test must compare:

1. a maintained Node MQTT client using broker values derived from the FarmBot JWT; and
2. FarmBotJS only if its Node runtime, reconnect behavior, event cleanup, and status parsing can be verified.

Phase 2C selected MQTT.js and added the provider-neutral `MqttJsReadonlyTransport` behind the existing interface. Because the worker is a non-browser Node.js process, the FarmBot adapter derives `mqtts://<token mqtt host>:8883`, supplies the token's broker-device username and encoded JWT, and requests the exact QoS 0 `status` and `from_device` topics. The token's `mqtt_ws` claim remains validated and stored for browser diagnostics but is not used by the worker transport. The transport requires TLS certificate verification, disables MQTT.js automatic reconnect and resubscribe, and exposes no publish method. The FarmBot session registry owns capped exponential reconnect attempts. An injected fake client proves connection options, exact subscriptions, message forwarding, reconnect limits, and cleanup without opening a network connection.

Connection failures are reduced to allowlisted diagnostic codes such as `broker_auth_rejected`, `broker_tls_failed`, `broker_timeout`, `broker_unreachable`, `broker_connect_failed`, or `subscription_failed`. The worker terminal and normalized lifecycle record expose only that code and the App FarmBot ID; raw library errors, broker URLs, usernames, and credentials remain excluded.

The approved live-test boundary selects the adapter only when `THREED_MQTT_TRANSPORT=mqttjs`. The App's authenticated `mqtt-session` route performs owner and readiness checks, decrypts the credential server-side, creates a two-minute identity-bound grant, and sends it over the existing HMAC boundary. Admin **MQTT Activity** exposes explicit Start read-only and Stop controls. The worker remains loopback-bound for this local test.

### Local read-only test environment

Configure these privately without committing them:

- `THREED_MQTT_WORKER_HMAC_KEY` — one 32-byte base64 App-to-worker key shared only by the App and worker.
- `THREED_MQTT_WORKER_BASE_URL=http://127.0.0.1:4456` — App connection to the local worker.
- `THREED_MQTT_TRANSPORT=mqttjs` — explicit opt-in to the read-only adapter.
- `THREED_MQTT_APP_BASE_URL=http://127.0.0.1:4444` — worker persistence destination.
- `THREED_MQTT_WORKER_TO_APP_HMAC_KEY` — a different 32-byte base64 worker-to-App key.

Run the App and worker in separate terminals with `npm run dev` and `npm run farmbot:mqtt-worker`. In Admin, open the verified FarmBot's **MQTT Activity**, select **Start read-only**, wait for `connected` and a position/status timestamp, then select **Stop**. The test must show only `status`, `from_device`, and lifecycle records. It must not publish, move the FarmBot, change a pin, or invoke a sequence.

Local live checkpoint: on August 20, 2026, the user confirmed the complete Phase 2C read-only path through secure MQTT port 8883. **Start read-only**, connected state, message/status timestamps, normalized X/Y/Z position, stale-state recovery, runtime/event persistence, and clean **Stop** all passed. The test did not publish, move the FarmBot, change a pin, or invoke a sequence.

Phase 2D adds a limited read-only runtime summary to the Dashboard FarmBot DetailsCard. The request is authenticated and must match the owner, selected Project, active ThreeD module relationship, active Project Asset assignment, and active FarmBot. The public map response remains unchanged. The Dashboard receives only connection/freshness timestamps, last known position, token expiry, and stale state; broker/session identities, credentials, event history, and worker controls remain outside this response.

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

Phase 2B currently meets these offline acceptance criteria through `npm run validate:farmbot-worker` and the repository TypeScript check.

## Implemented Phase 2B files

The additive implementation includes:

- `src/lib/services/threed/mqtt/integrations/farmbot/index.ts` — executable entry point.
- `src/lib/services/threed/mqtt/integrations/farmbot/server.ts` — loopback-bound health and signed internal HTTP boundary.
- `src/lib/services/threed/mqtt/integrations/farmbot/grant.ts` — strict connection-grant parsing and identity checks.
- `src/lib/services/threed/mqtt/integrations/farmbot/session-registry.ts` — owner-bound lifecycle and allowlisted runtime status.
- `src/lib/services/threed/mqtt/integrations/farmbot/status.ts` — exact topic and position parsing.
- `src/lib/services/threed/mqtt/integrations/farmbot/adapter.ts` — FarmBot implementation of the shared read-only integration contract.
- `src/lib/services/threed/mqtt/core/integration-adapter.ts` — provider-neutral integration identity, capabilities, connection, topic, and message contract.
- `src/lib/services/threed/mqtt/core/session-lifecycle.ts` — provider-neutral read-only connection states, expiry checks, and reconnect decisions.
- `src/lib/services/threed/mqtt/core/session-controller.ts` — provider-neutral single-session transport orchestration and observer hooks used by the FarmBot registry.
- `src/lib/services/threed/mqtt/core/transport.ts` — subscribe-only interface and disabled executable transport.
- `src/lib/services/threed/mqtt/transports/mqttjs.ts` — MQTT.js subscribe-only adapter selected only when `THREED_MQTT_TRANSPORT=mqttjs`.
- `src/lib/services/threed/mqtt/validate.mts` — provider-neutral transport and worker-authentication validation.
- `src/lib/services/threed/mqtt/worker/client.ts` — server-only signed App-to-worker client.
- `src/lib/services/threed/mqtt/integrations/farmbot/worker-client.ts` — FarmBot route wrapper for the generic worker client.
- `src/app/api/threed/farmbots/[id]/mqtt-session/route.ts` — authenticated owner/readiness-checked session controls.
- `src/lib/services/threed/mqtt/integrations/farmbot/validate.mts` — offline focused validation.
- `src/lib/services/threed/mqtt/worker/auth.ts` — shared signing, verification, and replay rules.
- `package.json` — worker start and validation scripts.

The worker-to-App persistence client, signed ingestion route, owner-scoped read/cleanup routes, Admin activity dialog, App-to-worker session controls, and opt-in subscribe-only MQTT.js adapter are implemented. A deployed worker and every MQTT publish or physical-command capability remain separately gated. No ThreeD character file, World Action route, or environment file changed.

## References

- [FarmBot message broker](https://developer.farm.bot/v15/docs/message-broker)
- [FarmBot broker topics and commands](https://developer.farm.bot/v15/docs/message-broker/sending-commands.html)
- [FarmBotJS runtime support](https://developer.farm.bot/v15/docs/farmbot-js.html)
- [FarmBot RPC acknowledgement labels](https://developer.farm.bot/v15/docs/celery-script/identifying-success-and-failure.html)
