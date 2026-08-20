# ThreeD FarmBot Integration Plan

Status: v0.18.1b released to production with the ThreeD MQTT control layer and FarmBot read-only connectivity. MQTT publishing and physical device commands are disabled. Later phases remain separately gated.

## Integration boundary

FarmBot's REST API stores and synchronizes resources. Real-time device control uses the FarmBot message broker, FarmBotJS, and CeleryScript. The application must not treat an assumed REST command endpoint as hardware control.

Official references:

- [FarmBot REST API](https://developer.farm.bot/v15/docs/web-app/rest-api)
- [FarmBotJS](https://developer.farm.bot/v15/docs/farmbot-js.html)
- [CeleryScript](https://developer.farm.bot/v15/docs/celery-script.html)

## Security rules

- FarmBot credentials are server-only and must never appear in browser state, API responses, map payloads, logs, or public environment variables.
- Every operation must authenticate the application user and resolve a FarmBot owned by that user.
- Project interactions must additionally validate the active ThreeD module and `project_assets` assignment.
- Physical commands remain fail-closed until an allowlisted command adapter, bounds checks, audit records, and acknowledgement handling are implemented.
- Arbitrary CeleryScript, coordinates, pin control, and raw command names are not accepted from clients.
- Emergency stop must remain independent of character animation.

## Phased delivery

### Phase 1 — Secure App foundation

Status: released to production and verified through GitHub-to-Vercel deployment and production smoke testing.

- Protect credentials with owner-bound server-side encryption.
- Verify REST and MQTT device identity without exposing the token.
- Discover and validate an explicit Water peripheral assignment without operating it.
- Track redacted broker metadata and evaluate readiness for a future worker.
- Support animation-only ThreeD FarmBot targeting.
- Keep every physical command path disabled.

### Phase 2 — MQTT worker foundation

Status: Phases 2A–2D were released in v0.18.1a; the provider-neutral control layer and FarmBot controller integration were released and production-verified in v0.18.1b. See [FarmBot Adapter for ThreeD MQTT Services](FARMBOT_MQTT_WORKER.md).

- Choose and document the separately deployed, long-running worker runtime.
- Define App-to-worker authentication, authorization, request signing, and replay protection.
- Define how the worker receives a short-lived connection grant without exposing stored credentials to browsers or logs.
- Add connection lifecycle handling, reconnect limits, health reporting, and read-only status subscriptions.
- Prove device identity and acknowledgement parsing before enabling commands.

The worker runs outside Vercel request handlers, uses signed/replay-protected App boundaries, maintains bounded read-only sessions, subscribes only to exact approved topics, persists normalized runtime/event data, and exposes limited owner/project-scoped App status. It has no publish interface. Phase 3 requires separate approval before command work starts.

### Phase 3 — Command safety and audit boundary

Status: Phase 3A policy foundation implemented and the explicitly approved Phase 3B dormant audit schema declared in development. Schema application, command transport, MQTT publishing, and physical operations remain separately gated.

- Define a small semantic command allowlist; never accept raw CeleryScript or arbitrary command names from a client.
- Add server-owned coordinate, duration, pin, and device-state limits.
- Add command idempotency, per-device concurrency control, timeouts, acknowledgements, and an audit record.
- Design emergency stop as an independent high-priority operation.
- Keep ThreeD animation completion separate from physical command success.

Phase 3A currently provides only a pure semantic-intent parser and lifecycle transition model. It accepts no pin, duration, coordinate, MQTT topic, CeleryScript, or arbitrary command name from a caller. It has no API or worker caller and does not enable the existing fail-closed command routes. Emergency stop remains outside the normal command lifecycle.

Phase 3B declares `threed_farmbot_commands` as an additive audit/request-state table after explicit schema approval. The user generated, reviewed, and applied it to the intended database. It stores scoped identities, idempotency, lifecycle timestamps, optional server-resolved Water binding snapshots, RPC correlation, and redacted outcomes without raw payloads. At that checkpoint it had no writer; application does not authorize dispatch or hardware.

Phase 3C adds a server-only initial-request repository. It re-validates semantic intent and requires the authenticated owner, active Project, active ThreeD relationship, active Project Asset assignment, and active owned FarmBot before an initial `requested` record can be inserted. Idempotent retries return the matching existing record; conflicting reuse fails closed. No route calls the repository, and no lifecycle transition, MQTT publish, worker command, or physical operation is added.

### Phase 4 — Single Water pilot

Status: planned and requires explicit physical-device test approval.

- Permit only the Water semantic action for one verified, project-assigned FarmBot.
- Require the current owner, Project assignment, verified device identity, current Water binding, worker health, and command-safety checks.
- Report accepted, acknowledged, completed, timed-out, and rejected states separately.
- Do not infer success from the character animation or from sending a message.

### Phase 5 — ThreeD interaction expansion

Status: future work.

- Add character approach/orientation behavior only after the single Water pilot is stable.
- Add further semantic actions one at a time with separate allowlist and safety review.
- Keep App world-state records, FarmBot command audit records, and character animation events distinct.

Each phase has its own approval and validation gate. Completing one phase does not automatically authorize the next phase, database changes, a new external resource, or physical device operation.

## Phase 1 status

The legacy `apiToken` database column remains in place temporarily, but general FarmBot CRUD no longer accepts or returns it. The Admin UI no longer edits it, map responses remove it, and preliminary polling and hardware routes return `503` after authentication without invoking the legacy client. FarmBot statistics are owner-scoped.

Encrypted per-device credential storage, key management, and the initial Admin connection workflow are now implemented. No repository environment file contains a credential or encryption key.

## Credential encryption primitive

The server-only credential boundary uses a versioned AES-256-GCM envelope with a unique 96-bit IV. Authenticated additional data binds each ciphertext to its owner ID and database FarmBot ID, preventing a valid encrypted token from being moved to another record without detection.

The primitive requires an exact 32-byte base64 key and a positive key version. `npm run validate:farmbot-crypto` verifies round-trip decryption, unique IV generation, plaintext exclusion, tamper detection, wrong-key rejection, cross-owner and cross-device rejection, and input validation.

The primitive is used only through the server-only credential repository and dedicated credential endpoint.

## Encrypted persistence envelope

The `threed_farmbots` Drizzle schema now declares nullable fields for ciphertext, IV, authentication tag, envelope version, key version, and credential update time. An all-or-none check constraint permits either no credential or one complete version 1 envelope with a positive key version. Existing rows therefore remain valid without a credential backfill.

General FarmBot CRUD rejects both the legacy token and encrypted-envelope fields. A shared server-only sanitizer removes all credential material and internal credential metadata from FarmBot CRUD and map responses. Only the dedicated credential endpoint may write the envelope.

The schema is active in the confirmed production environment. This repository currently ignores generated `/drizzle` artifacts and uses an explicitly controlled `db:push` workflow; do not run it against an unknown database. Full-record Drizzle selections require the declared columns to exist.

## Key provider and rotation

The server-only key provider reads the current positive version from `FARMBOT_CREDENTIAL_KEY_VERSION` and resolves retained keys from `FARMBOT_CREDENTIAL_KEY_V<n>`. Values must be independently generated 32-byte base64 keys. These names are documented here without adding secrets or placeholders to repository environment files.

Rotation order:

1. Retain every key version referenced by stored envelopes.
2. Add the new versioned key to each server environment.
3. Change the current version only after the new key is available everywhere.
4. Decrypt each old envelope with its recorded key version and re-encrypt it with the current key.
5. Verify that no envelope references the retired version before removing that key.

Missing key configuration and malformed keys fail distinctly. Authentication failures during decryption are treated as corrupt, swapped, or incorrectly keyed ciphertext and must never fall back to plaintext.

## Credential repository

The internal server-only repository provides owner-scoped status, save/replace, load, clear, and rotation operations:

- Secret reads use an explicit credential-only column selection.
- Save and clear are single atomic updates constrained by FarmBot ID and owner ID.
- Successful encrypted writes clear the quarantined legacy plaintext field.
- Rotation decrypts with the recorded key version and uses a ciphertext compare-and-swap condition so a concurrent credential change cannot be overwritten.
- Returned status contains only `configured`, key version, update time, and rotation outcome; it never contains ciphertext or plaintext.
- Missing FarmBots, missing credentials, and concurrent updates have distinct internal errors.

Envelope conversion and completeness checks run in `npm run validate:farmbot-crypto`. Repository functions have not contacted FarmBot hardware.

## Credential endpoint

`/api/threed/farmbots/:id/credential` is the only HTTP boundary allowed to manage the encrypted credential:

- `GET` returns redacted configuration status after authentication and ownership validation.
- `PUT` accepts one non-empty `credential` string, trims surrounding whitespace, enforces a 16 KiB maximum, encrypts it with the current key, and returns redacted status. It does not test a FarmBot connection.
- `DELETE` atomically clears the encrypted envelope and quarantined plaintext field.

Responses use `Cache-Control: no-store`. Invalid IDs and bodies return `400`, unauthenticated requests return `401`, inaccessible FarmBots return `404`, and missing server key configuration returns `503`. The credential is never logged or echoed. Rotation remains internal until an explicit administrative operation is designed.

## Admin connection workflow

The FarmBots Admin list exposes only a safe `credentialConfigured` boolean. Its **FarmBot Connection** dialog reads redacted status from the dedicated endpoint and supports secure credential storage, replacement, and disconnect. Existing credentials are never returned to or displayed in the browser, and the input is cleared after a successful write or when the dialog closes.

“Credential stored” means that a complete encrypted envelope exists. It does not mean the credential is valid, the FarmBot is online, or a connection test has succeeded.

The dialog also supports a server-side FarmBot login exchange. `POST /api/threed/farmbots/:id/credential/login` accepts a bounded email and password after App authentication, verifies FarmBot-record ownership, and posts them to the fixed `https://my.farm.bot/api/tokens` endpoint with a 10-second timeout. The returned JWT is validated, encrypted, and stored directly; it is never returned to the browser. The FarmBot password is never persisted or logged, and the browser clears it after every attempt.

The login route returns generic errors and applies five-attempt, ten-minute throttling per App user and FarmBot record. This in-memory throttle is defense in depth for a single server process, not a distributed production rate limiter. A durable/shared limiter should be introduced before treating this as comprehensive brute-force protection. Self-hosted FarmBot API origins are intentionally unsupported until an explicit origin allowlist is designed.

## Read-only connection test

`POST /api/threed/farmbots/:id/credential/test` verifies App authentication and FarmBot ownership, decrypts the stored JWT server-side, and performs only `GET https://my.farm.bot/api/device` with a 10-second timeout. The JWT is sent only in the fixed-host Authorization header and is never returned to the browser.

The response parser allowlists the FarmBot database device ID, name, FarmBot OS version, last API contact, last message-broker contact, and timezone. After the REST API accepts the JWT, only its `bot` and `exp` claims are decoded into broker identity and credential expiration metadata. Fields such as serial number, location, other JWT claims, and the remainder of the upstream device object are discarded. Rejected credentials and unavailable upstream service have distinct redacted responses.

The Admin dialog exposes this as **Test** and labels success as “REST authentication verified.” This proves that the stored JWT can read the FarmBot Web App API; it does not prove the physical device is online or connected to the message broker. The test records only the successful REST-verification timestamp in the broker snapshot.

FarmBot identity is split deliberately on the parent `threed_farmbots` record. `assetCode` (`asset_code`) preserves the App-facing identifier such as `FARMBOT-003`. Nullable `farmbotDeviceId` (`farmbot_device_id`) is the authoritative positive numeric ID returned by `GET /api/device`, while nullable `brokerDeviceId` (`broker_device_id`) is the corresponding JWT/MQTT identity such as `device_15297`. Child-table `farmbot_id` columns continue to reference the App database primary key `threed_farmbots.id`.

The connection test requires the accepted REST ID and JWT identity to satisfy `brokerDeviceId === "device_" + farmbotDeviceId`, then binds both fields transactionally. Once bound, credential replacement and refresh reject tokens for another broker device. Generic CRUD ignores canonical identity fields so browser input cannot create or rewrite the relationship. A different physical FarmBot requires an explicit future reconnect workflow or a new App FarmBot record.

## Read-only peripheral discovery

`GET /api/threed/farmbots/:id/peripherals` authenticates the App user, resolves an owned encrypted credential, and performs only `GET https://my.farm.bot/api/peripherals`. It returns an allowlisted array of FarmBot peripheral database ID, label, pin, and mode. The Admin connection dialog displays this inventory through **Discover**.

The response is capped at 100 displayed records and reports the upstream total and whether the result was truncated. Additional upstream fields and malformed records are rejected by the parser. Discovery does not persist peripheral data, choose a watering peripheral, read pin state, or toggle hardware.

A future Water command must use an explicit owner-approved binding between an App action and one discovered peripheral. It must not infer a valve from a label or accept an arbitrary pin directly from a browser request.

## Peripheral action bindings

`threed_farmbot_peripheral_bindings` stores one owner-scoped binding per FarmBot and semantic action. Each row records the authoritative FarmBot peripheral database ID plus label, pin, and mode snapshots for review. Database checks require positive peripheral IDs, nonnegative pins, and mode 0 or 1; foreign keys cascade when the owner or App FarmBot is removed.

`/api/threed/farmbots/:id/peripheral-bindings` provides authenticated owner-scoped reads, assignment, and removal. The initial semantic-action allowlist contains only `water`. Assignment accepts only `semanticAction` and `peripheralId`; the server refetches the current FarmBot inventory and supplies all snapshots itself. An unavailable or browser-invented peripheral ID is rejected.

Replacing or clearing a FarmBot credential transactionally deletes its bindings because the replacement token may represent a different FarmBot account. Encryption-key rotation preserves bindings because it does not change the credential identity.

The Admin discovery list exposes **Assign to Water** and clearly states that physical commands remain disabled. Selecting a peripheral changes App configuration only; it does not read or toggle the pin.

`GET /api/threed/farmbots/:id/peripheral-bindings/validate?semanticAction=water` is the reusable read-only preflight boundary. It loads an owner-scoped active binding, decrypts the credential, refetches the current FarmBot peripheral inventory, and requires the upstream peripheral ID, label, pin, and mode to match the stored snapshot. Its explicit outcomes are current, inactive, missing, or changed.

The Admin dialog keeps the saved Water assignment visible even when discovery no longer returns that peripheral and exposes **Validate** separately from assignment. A successful validation means only that the App credential and configuration snapshots are current; it still does not authorize or execute a physical command.

The additive binding schema is active in production. During development, the approved `bun db:push` also reconciled existing schema drift by recreating three foreign-key constraints under canonical names and reasserting existing character-animation and layer-default definitions.

## Broker metadata snapshot

`threed_farmbot_broker_metadata` retains the current non-secret session snapshot associated with each encrypted credential: MQTT hostname, secure MQTT WebSocket URL, token-observed broker identity, vhost, token issue/expiration times, observation time, and last successful REST-verification time. The verified stable `device_…` identity also lives on `threed_farmbots`; the snapshot copy is retained during this incremental migration for backfill and diagnostics. The metadata row remains a one-to-one owner-scoped FarmBot relationship, not an unbounded session-history log.

The encrypted JWT remains the session connection source of truth and the MQTT password. Broker metadata is strictly decoded from that JWT; it is never accepted as independent browser input. Validation requires a bounded hostname, a `wss://` URL on the same host without embedded credentials, a valid broker identity, printable bounded vhost, and a valid issue-before-expiration range. Expired or malformed tokens cannot be newly stored.

Credential save/replace atomically replaces the snapshot and clears `restVerifiedAt`. Credential removal deletes the snapshot. A successful `GET /api/device` test upserts the snapshot and records REST verification, allowing credentials stored before this schema to acquire current metadata without a plaintext backfill. Encryption-key rotation preserves the snapshot.

`GET /api/threed/farmbots/:id/broker-metadata` is authenticated and owner-scoped. The Admin connection dialog displays the tracked metadata, observation time, and whether the associated token has passed the REST test. General FarmBot CRUD and map payloads do not include this table.

`POST /api/threed/farmbots/:id/credential/refresh` uses the stored JWT for FarmBot's authenticated `GET /api/tokens` operation. It accepts only a non-expired response with the same `device_…` broker identity, then atomically replaces the encrypted JWT and broker snapshot using a ciphertext compare-and-swap guard. FarmBot may return a different broker host, WebSocket URL, or vhost; those current claims replace the snapshot. Existing peripheral bindings are preserved because the broker device identity is unchanged. The refresh records REST verification but, by FarmBot API design, does not extend token expiration.

The Admin **Refresh** control invokes this REST-only operation. It does not open MQTT, contact the physical device, toggle a peripheral, or authorize a World Action.

The snapshot table is active in production. During development, Drizzle also reconciled known schema drift by recreating canonical foreign-key names and reasserting existing character-animation and layer-default definitions.

The parent-identity schema revision is active in production. The approved development push renamed `threed_farmbots.device_id` to `asset_code`, preserved existing values, and added nullable parent identity fields without dropping the existing metadata identity or truncating rows. Run **Test** once per configured FarmBot to populate and verify both parent identities from its stored credential. Removing the redundant snapshot identity remains a separate future cleanup only after backfill is proven.

## MQTT runtime boundary

FarmBot's message broker uses the JWT `bot` claim as the username and the encoded JWT as the password. Broker hosts can change, so each connection derives current values from the encrypted token and uses the persisted snapshot only for validation and diagnostics.

The App is deployed to Vercel, whose request lifecycle is not the owner of a durable MQTT session. The v0.18.1b read-only MQTT.js worker therefore runs as a separate long-running process with authenticated internal boundaries, bounded reconnect behavior, and exact `status` and `from_device` subscriptions.

`GET /api/threed/farmbots/:id/mqtt-readiness` is an authenticated, owner-scoped configuration preflight for the worker. It decrypts the credential server-side and compares its current claims with the verified parent identities and persisted snapshot. It fails closed for a missing credential, unverified or mismatched identity, expiration, missing or outdated snapshot, or missing REST verification. Its response contains only readiness, redacted identity/endpoint dates, and stable issue codes; it never returns the JWT.

The Admin **Readiness** control displays those results. “Ready” means only that stored configuration is eligible for a read-only worker session. The readiness check itself performs no upstream request, opens no MQTT socket, proves no physical-device connectivity, and authorizes no command.

The retained in-progress `FarmBotPoller` also fails closed at its internal `sendCommand()` boundary. Its legacy convenience methods cannot issue requests to an assumed REST command endpoint; physical commands must wait for a separately approved command-safety adapter.

The released Phase 2A–2D design and implementation are recorded in [FarmBot Adapter for ThreeD MQTT Services](FARMBOT_MQTT_WORKER.md). The worker supports an explicit `mqttjs` read-only transport, signed session grants, normalized persistence, Admin Start/Stop and activity views, and a limited authenticated project-scoped Dashboard summary. It contains no publish interface. Physical polling and commands remain disabled.

## ThreeD World Action targeting

A project-assigned FarmBot runtime marker can be selected from the Dashboard map DetailsCard and marked **Use as Action Target**, matching the existing Planting interaction. The client target carries only the App FarmBot database ID, marker identity, display name, and current ThreeD position. It supports the existing target focus, clear, stale-project-data cleanup, green scene pulse, and character action-completion context.

FarmBot targeting is animation-only at this stage. The established Water and Harvest persistence branches still explicitly require a Planting target, and no FarmBot API, MQTT socket, peripheral binding, pin operation, or hardware command is invoked when a character completes an action against a FarmBot target.

While a FarmBot is the current target, the character card limits its action palette to **Point**, **Point Gesture**, and **Talk**. These use the established semantic animation event path and do not represent or initiate physical FarmBot commands. Clearing the FarmBot target restores the existing full character action palette; Planting targets retain their established actions and persistence behavior.
