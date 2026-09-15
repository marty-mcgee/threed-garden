# Historical exploration — ThreeD Help + AI Audio Foundation

Superseded by [v0.19.23 — ThreeD Audio](v0.19.23.md). Help is outside the current milestone.

> **Paused for redesign by user request.** The v0.19.23 Help prototype was removed from the working tree, restoring the released UI. No code from this prototype was committed or pushed by the agent. Entries below are historical exploration, not current implementation or an approved UI design. Further implementation is paused.


Status: staged development authorized by user after production v0.19.22. User designated v0.19.23 and approved the general staged approach. Schema additions require explicit approval; live updates remain separate. No credentials, paid generation, storage provisioning or publication performed.

## Evidence and design

- Model Files had a local Help Dialog with inline text; Bulk Import had no corresponding Help entry point. Repeated explanation should move to discoverable, contextual Help.
- `src/lib/services/project/project-tour-core.ts` already defines state-derived Environment → Model → Character setup guidance. Preserve this rather than replacing the Scene tour.
- `src/lib/schema/music/index.ts`: musicTracks has owner, optional album, fileUrl/fileType/fileSize, status (active/inactive/processing), lyrics and metadata. These may support saved speech assets, but provider job lifecycle and replay-safe generation need a reviewed contract.
- `/api/music/tracks` distinguishes owner/public access; `/api/music/media` authenticates and scopes records by owner. Existing Music playback and album ownership must be preserved.
- `src/lib/services/music/S3.ts` currently interprets fileUrl as an S3 key for signing. Generated-file URLs must not be assumed compatible without inspecting the stream endpoint and existing uploads. No new storage provider is selected.

## Stage 1 — contextual Help foundation (implemented)

Shared `ThreeDHelp` Dialog with a topic catalog for Model Files and Bulk Import. Each entry point provides current task guidance. All topics uses collapsed explanations; Walk me through offers a numbered sequence with Previous/Next/Done. This is guided reading, not a visual spotlight tour or automatic completion tracking. Closing Help returns users to existing controls. The page does not perform CRUD from Help.

Acceptance: open Help on Model Files with/without primary registration and on an empty/populated Bulk Import queue; inspect the contextual hint, expand topics, navigate the walkthrough, close and reopen to confirm reset. Check nested Bulk Import Help closes without closing its importer and keyboard focus returns to Help. TypeScript and diff checks passed; browser acceptance pending.

## Stage 2 — Help section and visual guidance

Add a discoverable ThreeD Help index with search and stable topic links, using the existing Admin/Scene navigation patterns after inspection. Expand topic coverage based on user friction. Add opt-in visual tours with stable target identifiers, missing-target handling, viewport tracking, keyboard navigation and reduced-motion behavior. No tour may save, place, generate or delete on behalf of the user. Retain Project tour progress separately from reading progress.

## Stage 3 — Fish Audio adapter and Music asset contract

Official sources verified during planning:
- https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
- https://docs.fish.audio/developer-guide/getting-started/quickstart

The documented TTS endpoint is POST https://api.fish.audio/v1/tts with bearer authentication and a model header; it accepts text and a voice reference. Documented output includes MP3, WAV/PCM and Opus. Model choices and pricing must be reverified when implementing, not frozen from this planning snapshot.

Next evidence work: inspect Music upload/stream/deletion ownership end-to-end; define an independent server-only Fish adapter and mock transport tests. Define text/voice/format bounds, response byte/time limits, provider error mapping and abort handling. No secret enters client props or logs. Actual generation starts only from an explicit Generate action; retry cannot silently incur duplicate provider charges. The user supplies credentials through their existing deployment configuration, not chat.

Produce a concrete persistence proposal before schema work: source text, voice/provider/model/settings, generation status/error, immutable output file reference, ownership, and retry/idempotency identity. Decide whether existing track metadata suffices or a generation record is needed. Document upload-failure cleanup and preserve completed audio when regeneration fails. Review proposed schema separately with user; do not apply a migration as part of UI development.

## Stage 4 — Speech creation in Music

Text input → voice selection → explicit Generate → progress → audio preview → explicit Save to Music. Show source/settings and saved file identity; reuse existing player where compatible. Costs/quotas should be accurate or marked unavailable, never invented. Support cancellation and bounded failure feedback. Defer cloning and realtime/multi-speaker behavior until the core generation/save path is verified.

## Stage 5 — tutorial media and ThreeD assignments

Attach authored screenshots/videos and saved Music narration to Help topics. Add captions/transcripts, user-started playback and accessible alternatives. Do not invent tutorial URLs or ship placeholder video controls. Later consider Character dialogue and Scene audio assignment; preserve animation/world mutation boundaries and keep audio independent of physics/task completion.

## Release gates

Narrow automated checks, TypeScript, browser review of each stage, and the user's manual production build. Current first-stage changes have no schema/API/Scene-runtime changes. No Git publication until requested.
