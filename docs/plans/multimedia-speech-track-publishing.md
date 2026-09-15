# Multimedia Speech — publish saved versions as Tracks

Development after user-confirmed v0.19.24 production. No new release number assigned.

Evidence: ready Speech versions already retain owner-scoped S3 keys/output metadata and nullable track_id; Albums and Tracks use integer owner-scoped IDs. Existing temporary SaveSpeechTrack uploads a new Blob, which would duplicate a version's saved audio. Track deletion already checks Speech history references.

Implemented POST `/api/multimedia/speech/[id]/versions/track`. Owner Speech and version rows are locked in a transaction. Only ready, owned storage references may publish; the chosen Album must belong to the owner. Track creation and version linkage commit together. Subsequent requests return the already-linked Track rather than creating another, even if submitted with different valid title/Album choices. No file transfer, Fish generation, accepted-version change or schema addition occurs. Archived Speech must be restored before new publication.

Version History now offers Save as Track for ready versions: title, paginated owner Album choices, Save Track, and a linked Track status. It reuses the exact stored audio URL and snapshots source text/voice/model metadata into the Track. Deleting the Track keeps the Speech audio through the existing reference check and clears track_id via its existing foreign key; refreshed history can then publish again.

Validation passed: TypeScript, actual publishing-route mock fixture (owner checks, ready state, Album ownership predicate, stored URL and repeated-request reuse), existing Track deletion fixture, version fixture, diff checks. These mocks do not simulate real transaction contention or S3 playback. No live writes/provider calls, build, package bump, commit or deployment.

Manual check: All Speeches → Versions → ready version → Save as Track → choose title/Album → Save Track. Verify it plays in Tracks and uses the existing S3 key. Reopen history and verify the linked Track appears. Delete a disposable linked Track, refresh history, and verify Speech playback remains. Then publish again if desired.

## Direct preview publishing

User accepted version-history publishing. Added the same Save as Track control directly beneath New Speech's saved audio preview. It targets the preview's version number and uses the title captured with that preview, so changing draft fields does not silently switch the audio being published. A version-specific React key resets the Track form for a newly generated version. The existing transactional endpoint still prevents duplicate publication from either entry point.

TypeScript, existing full-page handler and publishing-route fixtures, and diff checks passed. Manual check: generate a version on New Speech, choose Save as Track under its preview, select an Album, and save; then open Version History and confirm its Track link. No schema, release version, live writes, build or deployment changes.

## Release candidate v0.19.25

User accepted the checkpoint and requested production release. Prepared `v0.19.25 — Multimedia Speech: Saved Version Track Publishing`, package 0.19.25, with release notes and README. Recorded the earlier user-confirmed v0.19.24 deployment accurately. TypeScript and publishing/form/version/deletion fixtures passed during preparation. Manual build and deployment remain user-managed. No next-development version bump or unrelated feature scope is included.
