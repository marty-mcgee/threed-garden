# ThreeD FarmBot Integration Plan

Status: v0.18.7a is the current production release. Its ThreeD Model Library, ThreeD Marker snapshot, and Action Target behavior preserve the v0.18.3b FarmBot safety boundary through Phase 4L-K. MQTT publishing and physical device commands remain disabled. Any later command-linked orchestration requires separate approval.

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

Status: complete in the v0.18.2b release candidate. The command and recovery schemas were approved and applied. Authorization stops at `validated`; delivery and recovery lifecycle methods remain dormant. MQTT publishing and physical operations are not enabled.

- Define a small semantic command allowlist; never accept raw CeleryScript or arbitrary command names from a client.
- Add server-owned coordinate, duration, pin, and device-state limits.
- Add command idempotency, per-device concurrency control, timeouts, acknowledgements, and an audit record.
- Design emergency stop as an independent high-priority operation.
- Keep ThreeD animation completion separate from physical command success.

Phase 3A currently provides only a pure semantic-intent parser and lifecycle transition model. It accepts no pin, duration, coordinate, MQTT topic, CeleryScript, or arbitrary command name from a caller. It has no API or worker caller and does not enable the existing fail-closed command routes. Emergency stop remains outside the normal command lifecycle.

Phase 3B declares `threed_farmbot_commands` as an additive audit/request-state table after explicit schema approval. The user generated, reviewed, and applied it to the intended database. It stores scoped identities, idempotency, lifecycle timestamps, optional server-resolved Water binding snapshots, RPC correlation, and redacted outcomes without raw payloads. At that checkpoint it had no writer; application does not authorize dispatch or hardware.

Phase 3C adds a server-only initial-request repository. It re-validates semantic intent and requires the authenticated owner, active Project, active ThreeD relationship, active Project Asset assignment, and active owned FarmBot before an initial `requested` record can be inserted. Idempotent retries return the matching existing record; conflicting reuse fails closed. No route calls the repository, and no lifecycle transition, MQTT publish, worker command, or physical operation is added.

Phase 3D adds pure Water validation preparation: a 60-second request lifetime, active-command exclusion, current binding validation, exact output-mode peripheral snapshots, a server-owned 5-second duration capped at 10 seconds, and a SHA-256 fingerprint. Its server repository can use the existing FarmBot REST inventory check and atomically persist either `validated` or a bounded `rejected` result after repeating scope, binding, request-state, expiry, and concurrency checks under a FarmBot-scoped transaction lock. It does not publish MQTT, deliver a worker command, acknowledge a result, or enable hardware; dispatch, acknowledgement, emergency stop, and physical testing remain separate steps.

Phase 3E enables the authenticated generic command route for request-and-validation only. It accepts a strict size-limited envelope, creates or reuses an owner/Project/FarmBot-scoped Water audit record, validates the current REST peripheral binding, and returns a limited status with `deliveryEnabled: false`. It does not call ThreeD MQTT, the worker, or FarmBot command APIs. The direct Water and Move routes remain disabled.

Phase 3F-A prepares the FarmBot adapter's offline delivery contract using the official `from_clients` RPC format. Only a validated server record can produce the fixed Water-on, 5-second wait, Water-off sequence and server-derived RPC label. Matching `rpc_ok` and `rpc_error` results can be interpreted in memory. The read-only transport, worker server, health capability, App route, and database lifecycle are unchanged; nothing publishes this envelope.

Phase 3F-B adds an offline 15-second acknowledgement deadline and a separate Water-off recovery envelope. Recovery requires proof of prior dispatch and uses its own RPC label and a single digital-off instruction. It remains disconnected from scheduling, persistence, transport, and the worker. Live publishing remains disabled.

Phase 3F-C adds exact lifecycle preparation and dormant durable writers for acceptance, dispatch, acknowledgement/rejection, completion, and timeout. The repository derives the primary RPC label from the stored server command UUID, locks per FarmBot, and repeats active Project assignment checks before acceptance and dispatch. No route or worker calls these methods; MQTT publishing and physical operation remain disabled.

Phase 3F-D declares durable Water-off recovery audit fields on `threed_farmbot_commands`. Recovery has a separate state, RPC label, bounded error code, and ordered required/dispatched/resolved timestamps. Database checks reject partial lifecycle records. No raw recovery payload is stored, and this schema preparation does not connect recovery to the repository, worker, transport, or hardware. The declaration requires a reviewed Drizzle migration and an intentional database push before it exists in a database.

The user generated and applied that schema. Phase 3F-E adds pure recovery lifecycle transitions and dormant repository writers. The lifecycle core owns the server-derived recovery RPC label shared with the FarmBot adapter. Recovery requires proof of prior dispatch and proceeds through `required`, `dispatched`, then `confirmed` or `failed`; resolution requires the exact stored label. No route, scheduler, response observer, worker, or transport calls these methods, so live publishing remains disabled.

### Phase 4 — Single Water pilot

Status: approved. Phase 4A begins with a dormant signed worker-request contract; no publish or physical operation is enabled by that increment.

- Permit only the Water semantic action for one verified, project-assigned FarmBot.
- Require the current owner, Project assignment, verified device identity, current Water binding, worker health, and command-safety checks.
- Report accepted, acknowledged, completed, timed-out, and rejected states separately.
- Do not infer success from the character animation or from sending a message.

Phase 4A defines the strict internal Water request accepted by a future signed worker route. The request contains only server-resolved command identity, owner/device scope, the fixed pin/duration snapshot, fingerprint, RPC label, and expiry. It accepts no caller-provided MQTT topic or CeleryScript. The parser is not connected to the worker server, registry, transport, or App client, so worker health remains command-disabled.

Phase 4B connects that parser to a signed internal worker endpoint, but only through a disabled executor. Before reaching the executor, the endpoint requires a matching FarmBot URL, owner, broker identity, connected session, and fresh status. The production worker has no enabled executor or transport publisher, valid requests return `503`, and health remains `commandsEnabled: false`. The App has no client caller for this endpoint.

Phase 4C adds a dormant server-only App client for the signed command endpoint. It validates the complete semantic request again, requires the path FarmBot ID to match, and signs only the normalized snapshot. No App route or command workflow calls it. It cannot bypass the disabled worker executor and does not add MQTT publishing.

Phase 4D adds process-local worker idempotency and per-FarmBot concurrency protection. A command UUID is claimed before execution, while a FarmBot can have only one active command. Active, changed, and uncertain retries fail; the known commands-disabled failure releases its claim because no delivery occurred. Phase 4G-E later permits only an exact completed retry to recover the original receipt. This is defense in depth beside the durable database audit and does not survive a worker restart. Automatic retry remains prohibited.

Phase 4E adds offline acknowledgement correlation. A successful future executor result registers the exact command and RPC label with the worker gate, and the existing normalized `from_device` path offers matching `rpc_ok`/`rpc_error` responses to it. FarmBot and RPC identity must both match, and settlement is one-time. Correlated results are not yet reported to the App or database; the production executor is still disabled.

Phase 4F-A adds the App receiving half of acknowledgement reporting. A signed worker-only endpoint accepts a strict 1 KiB normalized acknowledgement, verifies owner/command/FarmBot scope, and invokes the existing locked database transition. Matching retries are idempotent. The worker does not call this endpoint yet, and no raw broker data is accepted.

Phase 4F-B adds the worker sending half. The correlation gate records its one-time normalized result in a queued HMAC-signed sink that retries failed App delivery with bounded backoff and flushes on shutdown. It reuses the existing worker-to-App URL and key. The disabled executor means this path has no normal runtime input yet, and publishing remains unavailable.

Phase 4G-A makes the dormant App command client validate the worker's acceptance response before later orchestration can trust it. The response must contain only the matching command UUID, matching server-derived RPC label, and a valid acceptance timestamp. This client remains uncalled; no audit transition or MQTT publish follows from this increment.

Phase 4G-B adds a pure adapter mapper from an accepted audit record and verified broker identity to the strict worker request. It prevents a future coordinator from manually assembling or widening the worker payload. The mapper has no database access or caller and causes no transition, network request, or publish.

Phase 4G-C adds a dormant owner-scoped repository read that retrieves the accepted audit record and canonical broker identity under the per-FarmBot lock after repeating active Project assignment checks. It requires an unexpired accepted Water record and does not mutate state or contact the worker.

Phase 4G-D composes the delivery-context read, strict accepted-record mapper, signed client, and strict worker response in a dormant server-only handoff. It rechecks identity at each boundary and reports worker acceptance only. It has no route caller and does not mark the command dispatched; the disabled executor still prevents MQTT or hardware delivery.

Phase 4G-E makes a completed worker handoff receipt recoverable after a lost HTTP response. The process-local gate returns the original normalized receipt only when every field of the signed command snapshot matches. Active, changed, and uncertain retries still fail, and the executor is never called twice for an exact completed retry.

Phase 4G-F adds a dormant audit-continuity writer that records a verified worker receipt as dispatch using the exact stored RPC label and worker timestamp. Acceptance and delivery-context loading authorize the operation before handoff; this post-handoff write remains recordable after Project deactivation so an external attempt cannot lose its audit outcome. It has no caller yet.

Phase 4G-G composes the worker handoff and dispatch audit writer in a dormant server-only coordinator. It validates the receipt before writing and validates the persisted post-dispatch record afterward. The result represents recorded dispatch only, not FarmBot acknowledgement or Water completion. No route calls it, and the worker executor remains disabled.

Phase 4G-H adds the dormant top-level pilot sequence from an existing validated audit record through acceptance and dispatch coordination. It verifies each returned lifecycle boundary and exposes no browser payload or route. Failure before a verified worker receipt leaves the command accepted rather than falsely dispatched. The disabled executor still prevents MQTT and hardware delivery.

Phase 4I-A connects normalized worker acknowledgement ingestion to the existing completion transition. A matching `rpc_ok` records acknowledgement and completion at the response time; `rpc_error` remains rejected and does not complete. Exact retries are idempotent, and the route keeps its private authentication and scope checks. This does not enable command execution or publishing.

Phase 4I-B adds a dormant timeout coordinator that records the 15-second acknowledgement timeout before making Water-off recovery required. Both repository steps can continue safely after a partial failure. This creates only an audit obligation: there is no scheduler, recovery handoff, MQTT publish, or physical Water-off action yet.

Phase 4I-C defines the pure strict worker request for that Water-off obligation. It is derived only from the required recovery audit and verified broker identity and carries no caller-provided topic, CeleryScript, duration, pin value, or mode. Recovery has no expiry so the safety obligation remains actionable, but no endpoint or publisher consumes it yet.

Phase 4I-D connects that strict request to a separate signed worker `/recoveries` endpoint. The endpoint repeats path identity and fresh owner/broker session checks, then invokes only a disabled recovery executor in production. It does not reuse the normal command gate, has no App caller, returns `503` for a valid request, leaves worker health command-disabled, and cannot publish MQTT or operate hardware.

Phase 4I-E adds the dormant server-only App client for that recovery endpoint. It revalidates path/body identity and the strict request before signing, then requires an exact matching recovery receipt and bounded worker timestamp. No route, scheduler, timeout coordinator, repository workflow, World Action, or browser component calls it. The worker executor remains disabled and no MQTT publish or physical operation is possible.

Phase 4I-F adds the dormant owner-scoped repository read for recovery delivery context. Under the per-FarmBot lock it requires the durable required-recovery lifecycle and canonical broker identity. Unlike normal command authorization, it deliberately does not repeat active Project assignment or FarmBot activation checks: Water-off is a post-dispatch safety obligation that must survive later deactivation. The read has no caller and performs no transition, network request, publish, or physical action.

Phase 4I-G composes the recovery context, strict mapper, signed client, and strict receipt into a dormant server-only handoff. Identity is checked before and after the worker boundary. Its result proves only worker acceptance and does not mark recovery dispatched or claim broker/device acknowledgement. No route, scheduler, timeout workflow, World Action, or browser component calls it; the worker executor remains disabled and publishing is unavailable.

Phase 4I-H replaces the unused permissive recovery-dispatch writer with a verified-receipt audit writer. It requires the exact stored recovery label and worker timestamp, writes `required → dispatched` under the per-FarmBot lock, and permits only exact retry after dispatch or resolution. It remains recordable after deactivation for audit continuity, has no caller, and does not contact MQTT or hardware.

Phase 4I-I composes the dormant recovery handoff and verified dispatch writer. The coordinator validates the receipt before writing and validates the persisted recovery identity, state, and timestamp afterward. Its result records worker acceptance only, not MQTT or device acknowledgement. The server wrapper has no route or scheduler caller, the worker recovery executor remains disabled, and publishing remains unavailable.

Phase 4I-J makes the worker fail closed on an invalid recovery executor receipt. Before returning `202`, it requires exactly the submitted command UUID, recovery label, and a bounded ISO worker timestamp; invalid results receive a limited `502`. Production still uses only the disabled executor, and this step adds no execution gate, publish method, physical operation, or caller.

Phase 4I-K adds process-local recovery idempotency and per-FarmBot recovery concurrency. Active and changed duplicates fail, exact completed retries recover the original receipt, uncertain failures remain claimed, and only disabled execution releases its claim. This gate covers recovery requests only; shared arbitration with normal Water remains mandatory before enabling either executor. Both remain disabled and publishing is unavailable.

Phase 4I-L gives the normal Water and Water-off recovery gates one shared process-local per-FarmBot arbiter. Either active flow blocks the other before executor entry, while each gate continues to own its separate identity and retry rules. The arbiter does not replace durable database locking or survive restart. Both executors remain disabled and publishing is unavailable.

Phase 4I-M adds one-time recovery RPC correlation. The provider response path offers normalized RPC responses to both gates; only the exact FarmBot and recovery label settle the pending recovery. `rpc_ok` becomes confirmed and `rpc_error` becomes failed with a bounded code. The result is not yet reported to the App or database, both executors remain disabled, and publishing remains unavailable.

Phase 4I-N adds the App receiving half for recovery acknowledgement. A separate 1 KiB HMAC-protected endpoint accepts only normalized confirmed/failed recovery identity and time, verifies owner/FarmBot scope, and uses the locked recovery lifecycle writer. Exact resolved retries are idempotent. The worker has no recovery reporter yet, both executors remain disabled, and no raw MQTT data or publish behavior is added.

Phase 4I-O adds the worker sending half through a separate queued recovery reporter. The recovery gate queues only its one-time correlated normalized result. The reporter signs the strict payload for the recovery acknowledgement endpoint, retains failed deliveries for bounded retry, and flushes during worker shutdown. It reuses the App base URL and worker-to-App HMAC key; partial configuration fails closed. Both production executors remain disabled, and no MQTT publisher or physical action is added.

Phase 4I-P makes recovery reporting require a strict App persistence receipt before removing a queued result. The response must contain only success plus the exact command UUID and confirmed/failed recovery state expected by the worker. Malformed, extra, or mismatched successful HTTP responses remain queued for retry. The receipt proves App ingestion only; execution and MQTT publishing remain disabled.

Phase 4J applies the same receipt rule to normal command acknowledgements. An acknowledged Water RPC must persist through completion, while a rejected RPC must persist as rejected; the returned command UUID and final state must match exactly. A malformed or mismatched successful HTTP response stays queued for retry. This adds no timeout runner, executor, publisher, or physical operation.

Phase 4K-A defines a strict normalized timeout report for future worker deadline monitoring. It carries only owner/FarmBot/command identity, the derived RPC label, acceptance time, timeout-observation time, and fixed `ack_timeout` reason. The timeout must occur at least 15 seconds after worker acceptance. The contract has no producer, timer, App endpoint, repository caller, or recovery trigger yet, and publishing remains disabled.

Phase 4K-B adds the private App receiving boundary for that report. HMAC and replay checks precede a coordinator that matches owner, FarmBot, primary RPC label, and worker acceptance time against the stored dispatch audit. Only a dispatched or exact already-timed-out command may proceed to the existing timeout-and-recovery-required writer. There is no worker reporter or deadline monitor yet, so normal runtime cannot invoke this path; recovery dispatch and publishing remain disabled.

Phase 4K-C adds the dormant worker sending half. Its separate signed queue retains timeout reports across failed requests and malformed or mismatched successful responses. Removal requires the matching command in `timed_out` state plus the deterministic recovery label and an allowed recovery lifecycle state. The queue has no execution-gate caller or deadline monitor yet, and no automatic recovery or publish behavior is enabled.

Phase 4K-D connects a process-local 15-second deadline monitor only after a validated worker execution receipt. A matching RPC response cancels its deadline; a timeout removes correlation and queues one timeout report so a late response cannot also complete the command. Worker shutdown flushes both queues. Pending timers do not survive restart, so durable reconciliation remains a required later step. The disabled production executor means no timer starts in normal runtime, and publishing remains unavailable.

Phase 4K-E adds a dormant App-side restart reconciliation path. A bounded oldest-first repository query finds dispatched audits beyond the 15-second deadline, and a strict coordinator applies the existing timeout-and-recovery-required transition. Commands resolved during the query/transition race are skipped without stopping the batch. Nothing calls the reconciler yet; it adds no route, worker database access, schema, automatic recovery, or publishing.

Phase 4K-F exposes that reconciliation only through a private HMAC endpoint and a non-overlapping worker runner. The runner requests at most 50 oldest overdue audits at startup and every 30 seconds, waits for active work during shutdown, and receives aggregate counts only. The App retains all database ownership. Reconciliation can record timeout and recovery-required audit state, but cannot dispatch recovery, publish MQTT, or operate hardware.

Phase 4L-A defines the first offline emergency Water-off worker contract. It is independent from normal commands, timeout recovery, character animation, and World Action completion. The server-generated emergency UUID produces a separate RPC label, the pin must already be server-resolved, and the exact request lifetime is 60 seconds. The contract has no route, audit writer, executor, client, publisher, or UI caller. A durable emergency audit requires separate schema review and approval.

Phase 4L-B adds the separately approved and applied `threed_farmbot_emergency_actions` audit table. Phase 4L-C adds only its pure lifecycle policy: server-owned request identity, current active Water binding validation, fixed mode-0 peripheral snapshots, ordered requested-to-acknowledged/failed transitions, and pre-acceptance rejected/expired terminal paths. Exact RPC correlation is required. No repository writer, App route, worker handoff, MQTT publish operation, UI control, or hardware behavior is enabled.

Phase 4L-D adds the dormant server-only emergency audit repository. It requires FarmBot ownership but no Project assignment, uses the normal command repository's per-FarmBot advisory lock, stores current active Water binding snapshots during validation, and conditionally persists each lifecycle step under owner and prior-state scope. It has no caller outside its own module, so it cannot create an emergency request during normal App or worker operation. Routes, worker handoff, MQTT publishing, UI controls, and physical behavior remain later approval boundaries.

Phase 4L-E adds an accepted emergency delivery-context read and a strict pure worker-request mapper. The read requires owner scope, the shared FarmBot lock, accepted/unexpired lifecycle proof, complete mode-0 Water snapshots, and canonical broker identity. The mapper revalidates the accepted record through the existing emergency request parser. Neither piece submits to the worker or records dispatch, and there is still no route, publisher, UI control, or physical operation.

Phase 4L-F adds only the dormant App client side of a future signed emergency endpoint. The submission builder fixes the path to `/internal/v1/farmbots/:id/emergencies`, repeats path/body identity validation, and signs the strict normalized request with the established worker HMAC client. Its response parser requires the matching emergency UUID, RPC label, and bounded acceptance time. The worker has no matching route and the submit function has no caller, so execution, dispatch persistence, MQTT publishing, UI access, and physical behavior remain unavailable.

Phase 4L-G adds the matching worker route behind a dedicated disabled emergency executor. Worker HMAC authentication, replay protection, exact JSON, a 1 KiB limit, strict path/body identity, and a connected fresh owner/broker session are required before executor entry. Production always returns `503` for a valid emergency request. Injected results are also identity- and timestamp-validated, but no enabled executor, execution gate, publisher, App handoff caller, UI control, or hardware behavior exists.

Phase 4L-H adds process-local emergency UUID idempotency and enrolls emergency execution in the shared per-FarmBot device arbiter. Exact completed retries recover the stored receipt, changed duplicates fail, disabled execution releases its unused claim, and uncertain failures remain claimed. Emergency, normal Water, and recovery cannot enter their executors concurrently for the same FarmBot. The gate is memory-only; the production executor remains disabled and no acknowledgement, publisher, App caller, UI, or physical behavior is enabled.

Phase 4L-I adds one-time in-memory emergency RPC correlation after a validated executor receipt. Only the exact FarmBot and deterministic emergency label can settle; `rpc_ok` maps to acknowledged and `rpc_error` to failed with a bounded code. Unknown, mismatched, malformed-time, and repeated responses do not produce a result. The normalized response remains part of existing MQTT event persistence, but the emergency result has no App reporter or database writer caller yet. Production execution and publishing remain disabled.

Phase 4L-J adds the receiving side of future emergency result persistence at `POST /api/internal/threed-mqtt/farmbot/emergencies/acknowledgements`. The route uses the established worker-to-App HMAC and replay boundary, accepts only the strict 1 KiB normalized acknowledgement, verifies owner/FarmBot/emergency identity, and records only the exact acknowledged or failed terminal transition. The worker has no emergency reporter or sink and does not call this endpoint, so production execution, MQTT publishing, UI access, and physical behavior remain disabled.

Phase 4L-K adds the worker reporting side behind a dedicated queue. An exactly correlated emergency RPC result is signed and sent to the Phase 4L-J endpoint; failed delivery and invalid or mismatched successful receipts remain queued for bounded retry. Shutdown flushes the queue, while missing configuration selects a disabled sink and partial configuration fails startup. The queue is process-local, and the disabled production emergency executor means normal runtime cannot create an acknowledgement. MQTT publishing, UI access, and physical behavior remain disabled.

### Phase 5 — ThreeD interaction expansion

Status: Phase 5A–5D simulation is released in production through v0.18.6a. Command delivery and physical behavior remain future approval gates.

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
