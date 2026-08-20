# Agent Validation Guide

This repository uses a narrow-first validation ladder. Agents should prove the relevant behavior with the smallest useful check before escalating to slower or broader commands.

## Validation order

1. Inspect `git diff --check` for whitespace and patch errors.
2. Run `npm run validate:assets` when character animation assets or their manifest change.
3. Run `npm run validate:farmbot-crypto` when FarmBot credential cryptography changes.
4. Run `npm run typecheck`; TypeScript errors are release-blocking.
5. Run `npm run validate:threed-mqtt` when the provider-neutral MQTT transport or worker authentication changes.
6. Run `npm run validate:farmbot-worker` when the FarmBot MQTT adapter, grants, status parsing, persistence mapping, or lifecycle changes.
7. Run `npm run validate:farmbot-mqtt-persistence` when normalized worker events, persistence rules, or MQTT Admin activity changes.
8. Run `npm run validate:farmbot-command-policy` when Phase 3 semantic intent, lifecycle states, idempotency rules, or command safety policy changes.
9. Run a file-scoped lint command only when an ESLint executable/configuration is available.
10. Run targeted tests when a matching test exists.
11. Run `npm run build` only when the change affects bundling, routing, server/client boundaries, or release readiness.
12. Perform the relevant manual regression checklist for interactive ThreeD behavior.

## Commands

```bash
git diff --check
npm run validate:assets
npm run validate:farmbot-crypto
npm run validate:threed-mqtt
npm run validate:farmbot-worker
npm run validate:farmbot-mqtt-persistence
npm run validate:farmbot-command-policy
npm run typecheck
npm run build
```

The FarmBot validation also covers strict broker-claim parsing and rejects a refreshed token whose `device_…` broker identity differs from the stored credential. Broker host, secure WebSocket URL, and vhost changes are allowed because FarmBot may move broker sessions while retaining device identity.

The ThreeD MQTT validation is provider-neutral and offline. It checks shared HMAC tamper/replay rejection plus MQTT.js connection options, exact QoS 0 subscriptions, message forwarding, topic-list rejection, safe broker error classification, and cleanup using neutral fabricated integration data. It also scans the generic MQTT service imports and fails if that directory depends on FarmBot or OpenFarm.

The FarmBot worker validation is also offline. It checks FarmBot connection-grant identity and expiry rules, owner-bound single-session behavior, lifecycle limits, exact FarmBot read-only topics, bounded position parsing, credential-redacted status, persistence behavior, and the loopback internal HTTP boundary. It does not load a stored credential, connect to Neon or FarmBot, open MQTT, or operate hardware.

For the separately approved local live read-only test, start the App and worker in separate terminals, verify worker health reports `mqttTransport: mqttjs` and `commandsEnabled: false`, then use Admin **MQTT Activity → Start read-only**. Confirm current status and position records appear, raw payloads and credentials do not appear, and **Stop** closes the session. Do not proceed if the worker reports any publish or command capability.

For the Phase 2D Dashboard display, sign in as the Project owner, open a Project with an actively assigned FarmBot, select its marker, and confirm the DetailsCard shows MQTT connection state, freshness, last message/status times, device position, and token expiry. Confirm a stopped/stale session is labeled stale. In the Network panel, verify the runtime request includes the selected `projectId` and its response omits broker identity, worker session ID, credentials, and event history. An unassigned FarmBot ID, another owner's Project ID, or an inactive Project Asset/module relationship must return not found. Confirm the public `/api/map/threed` response still contains no MQTT runtime data.

The MQTT persistence validation is also offline. It checks batch limits, UUIDs, owner/broker scope fields, normalized lifecycle and position events, payload fingerprints, and rejection of raw or invalid shapes. After the approved schema is applied, open **MQTT Activity** for an owned FarmBot and verify empty state, current runtime, filters, pagination, refresh, and history cleanup. Confirm another user receives no runtime or history, and confirm general FarmBot/map responses do not include these records.

The Phase 3 command-policy validation is offline and has no database, MQTT connection, or hardware access. It requires a versioned `water` semantic intent with a positive Project ID and UUID v4 idempotency key; rejects emergency stop on the normal path plus raw command names, pins, durations, topics, and CeleryScript; and verifies that lifecycle states cannot skip dispatch acknowledgement or leave a terminal state.

For the Phase 3B command-audit schema, inspect the `db:generate` output before applying it. The proposal should only create `threed_farmbot_commands` with its indexes, checks, and foreign keys. It must not drop, rename, truncate, or rewrite existing FarmBot/MQTT tables. Confirm the table has no credential, raw MQTT topic/payload, CeleryScript, arbitrary JSON, or emergency-stop field. Run `db:push` only against the intended development database after that review.

It also covers the pure MQTT readiness evaluator. A ready result requires a configured non-expired credential, verified `REST ID ↔ device_<ID>` parent identity, an exact token/snapshot match, and a REST-verification timestamp.

For the Admin refresh workflow, manually open **FarmBot Connection**, note the broker snapshot, select **Refresh**, and confirm the observation/REST-verification times update without changing the saved Water assignment. Confirm the displayed expiration is not extended. This is a REST-only check; it does not establish MQTT or physical-device connectivity.

Select **Readiness** and confirm a verified current configuration reports **Ready**. Replacing a credential should clear the displayed result until it is checked again; an untested replacement should report REST verification as required. This check is local and must not produce a FarmBot network request, MQTT connection, or hardware action.

For FarmBot World Action targeting, load a project with an assigned active FarmBot and character. Select the FarmBot, choose **Use as Action Target**, and verify the current-target label, green scene pulse, Focus Target, and Clear Target behavior. Run a character action and confirm the completion toast identifies the FarmBot as an animation-only target. In the Network panel, confirm this does not call `/api/threed/world-actions`, a FarmBot command route, MQTT, or a peripheral endpoint. Then retest a Planting-targeted Water action to ensure its established post-animation persistence still works.

While that FarmBot remains targeted, confirm the character card shows only the **FarmBot Interaction** group with **Point**, **Point Gesture**, and **Talk**. Confirm Planting, Harvesting, and Animal Care groups are hidden. Clear the target and verify the full action palette returns, then select a Planting target and verify its action palette and established Water persistence remain unchanged.

For the FarmBot parent-identity schema revision, inspect the `db:push` proposal before accepting it. Confirm `threed_farmbots.device_id` is renamed to `asset_code`, existing asset-code values are preserved, nullable `farmbot_device_id` and `broker_device_id` are added to `threed_farmbots`, and the existing snapshot-owned broker column is retained during backfill. Afterward, use **Test** and verify the parent row stores the REST ID and exactly `device_<REST ID>`. Reopen the dialog and confirm the verified identity is displayed and the Water assignment remains intact.

`npm run typecheck` is the canonical full TypeScript command and expands to `tsc --noEmit --pretty false`.

`npm run validate:assets` verifies that every file in the external character animation manifest exists under `public/`. It must pass in a clean Git checkout before deployment; in CI, successful validation after `actions/checkout` also proves the required assets are tracked by Git.

`npm run validate:farmbot-crypto` exercises the server-side FarmBot credential envelope, persistence conversion, versioned key-provider policy, token-response validation, limited JWT metadata decoding, strict broker-metadata validation, allowlisted read-only device/peripheral parsing, and fail-closed peripheral-binding snapshot validation without using a real credential, database, network connection, or hardware device.

After applying the broker-metadata schema to an approved development database, run the REST connection test and verify that the Admin snapshot and database row show current MQTT/MQTT-WebSocket metadata with a new `restVerifiedAt`. Confirm that general FarmBot and map responses still omit this data.

After applying the FarmBot peripheral-binding schema to an approved development database, manually verify assignment, reassignment, removal, and automatic invalidation after credential replacement. Assignment must not invoke a hardware route or change a FarmBot pin.

## v0.18.1a production regression checks

- Verify credential login/store/replace/clear never returns the JWT or encrypted envelope to the browser.
- Run **Test**, **Discover**, Water assignment, **Validate**, broker **Refresh**, and **Readiness** against an owned FarmBot.
- Confirm a different user cannot read or modify that FarmBot's credential, peripheral assignment, broker metadata, or readiness result.
- Confirm general FarmBot CRUD and `/api/map/threed` responses omit credential and broker metadata fields.
- Confirm authenticated command, polling, Water, and movement routes return `503` and the retained poller command boundary rejects before making a request.
- Confirm FarmBot targeting remains animation-only and Planting-targeted Water and Pick Fruit behavior remain unchanged.
- Confirm the read-only worker connects only after an explicit Start request, subscribes only to `status` and `from_device`, and stops cleanly.
- Confirm Admin and Dashboard show current normalized status while raw payloads, credentials, broker/session identities, and private worker configuration remain hidden from general browser responses.
- Confirm no MQTT publish interface or physical command is present in the v0.18.1a release.

## GitHub Actions

`.github/workflows/validation.yml` runs for pull requests and pushes to `main`.

- Production animation asset validation is a blocking check.
- TypeScript type checking is a blocking validation step.
- Vercel remains the production-build gate because its build uses the configured deployment environment.

## TypeScript baseline

The pre-existing v0.17.0 TypeScript baseline was repaired and released in v0.17.2. A successful change now requires:

- `npm run typecheck` exits successfully with no diagnostics; and
- the production build remains successful when the validation ladder calls for it.

Do not suppress new diagnostics or make TypeScript non-blocking to land unrelated work.

## ThreeD release-blocking manual checks

- Farmer FBX model renders.
- External FBX animations load.
- Idle, walk, and run work.
- `GardenCharacter` autonomous movement works.
- `EcctrlCharacter` Take/Release Control and WASD work.
- Task animations return cleanly to locomotion.
- DetailsCard opens and targeting controls work.
- Targeted Water persists after animation completion.
- Targeted Pick Fruit creates one project-scoped harvest record.

## Reporting

Every completed change should report:

- files changed and responsibility of each change;
- commands run and exact outcomes;
- unrelated worktree changes observed but not modified;
- assumptions, remaining risks, and manual checks still required.
