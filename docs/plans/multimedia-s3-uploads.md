# Multimedia S3 uploads — local checkpoint

## Contract

Uploads occur inside current Tracks, Media (including Album media forms), and Album cover-art create/edit forms. The App authenticates and issues an S3 PUT signature, the browser sends the file directly without a separate window, and the App verifies object size/type with HeadObject. Only then does the upload control populate the form's file URL. The user saves the existing form to register its relationship. No schema changes or module rename.

The prior session's Vercel Blob Track upload is removed. Existing ThreeD Blob flows are untouched. Existing URL registration is preserved. The current Music stream route redirects new private file references to the authenticated file endpoint instead of interpreting them as legacy S3 keys.

Current storage keys: `threed/users/{encodedUserId}/multimedia/{uuid}/{original filename}`. Existing URL fields store `/api/music/files?key=...`, never expiring S3 signatures. Reads require the uploading owner and redirect to a 15-minute GET signature with no-store responses. Public Album classification does not grant access to these new private files. Public sharing requires a later explicit policy.

Allowlist: MP3, WAV, FLAC, OGG, M4A; MP4, WebM, MOV; JPEG, PNG, WebP, GIF. Images capped at 20 MiB; audio/video at 512 MiB. These are initial application limits, not S3 limits. PUT signature binds declared Content-Length and Content-Type; completion checks both and the owner's key prefix. This verifies storage metadata, not codec decoding or malware safety. Single PUT only: no multipart resume yet.

## Server and bucket setup

Uses existing AWS SDK dependencies and the default credential provider chain, including existing server-only `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, optional session token, or deployment role. Requires `AWS_REGION` and `S3_BUCKET_NAME`. No environment file was inspected or edited and no AWS resource was created/modified.

The bucket must remain private (Block Public Access). Server identity needs `s3:PutObject` and `s3:GetObject` on `arn:aws:s3:::YOUR_BUCKET/threed/users/*/multimedia/*` (retain the older `multimedia/users/*` permissions for existing files); HeadObject uses GetObject permission. Additional KMS permissions may be needed for a KMS-encrypted bucket.

Example CORS to configure on the bucket (replace the production placeholder with the exact App origin):

```json
[
  {
    "AllowedOrigins": ["http://localhost:4444", "https://YOUR_APP_DOMAIN"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

References: [AWS presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html), [Vercel function payload limit](https://vercel.com/docs/functions/limitations). Large files bypass the Vercel function request body; authorization/completion requests contain JSON only.

## Lifecycle limits

Uploads and form registration are separate steps. An abandoned form, network failure after PUT, or replacement can leave an unreferenced object. Existing record deletion does not delete S3 objects. Automatic deletion is deliberately not applied to reusable/shared URLs. Pending-upload records, recovery and reference-aware cleanup need a subsequent design/schema approval if required. No live uploads or AWS changes performed by the agent. Fish generated-audio save integration remains subsequent work.

## Validation and manual review

`node src/lib/scripts/validate-music-s3.cjs` passes offline route/policy fixtures: authentication, owner key isolation, extension/type/size policy, signed length, completion mismatch and private redirect. `npm run typecheck` and `git diff --check` passed after the stream compatibility adjustment. Fixtures mock AWS and do not prove IAM, CORS or file playback.

- Tracks → Add Track: upload an MP3/WAV larger than 4 MiB, observe progress and verification, then save. Refresh and Play.
- Media → Add Media: upload MP4/WebM, save in an Album, reopen its file URL.
- Albums → Add/Edit Album: upload JPEG/PNG cover, save and inspect the cover.
- Confirm other signed-in users cannot read these private files.
- Missing configuration/CORS failures should show an error and leave the saved URL unchanged.

Production build remains the user's manual gate. Nothing committed or deployed.

## Upload feedback follow-up

User reported the browser-to-S3 network/CORS error displayed in white. The shared upload control now tracks error state explicitly: validation/request failures are red with `role="alert"`, successful upload feedback is green, and progress remains neutral. Retry clears the previous error state. TypeScript and diff checks passed. The underlying network/CORS failure is not yet diagnosed; browser Console reason requested without signed URLs. User changes to Sidebar and ThreeD Beds were preserved.

## Preflight/signing diagnosis

User reported OPTIONS 403 with missing Allow-Origin. The supplied signing credential was a placeholder; actual local credential values were not inspected. Bucket CORS and server credentials both need user configuration, followed by a dev-server restart and fresh upload attempt. Do not reuse or record the supplied signed URL.

The request also carried CRC32 for an empty body. Fixed signer configuration with `requestChecksumCalculation: 'WHEN_REQUIRED'` because the browser supplies the actual bytes later. The installed-SDK offline signing fixture now proves no empty CRC32 is attached and Content-Length remains signed. S3 fixture, TypeScript and diff checks passed. This code change does not fix bucket CORS or credentials; no live AWS request or configuration change performed.

## Original filenames and embedded playback

User confirmed a 27 MiB WAV upload, then reported that opening the file downloaded it and its S3 name was random. Track Play now opens an in-App audio dialog, with a red playback error for unsupported encoding/access failures. Closing the dialog removes the player. S3 GET signatures request inline disposition.

New object keys retain the exact valid filename under a unique directory: `multimedia/users/{owner}/{uuid}/{original filename}`. This preserves duplicate names without overwriting another upload. Names containing path separators/control characters or exceeding 255 characters are rejected. Completion verifies the exact filename. Existing UUID-only keys remain readable and are not renamed or migrated. Browser WAV codec support remains a live check; uploads do not transcode audio.

Validation: S3 fixtures (including original names, uppercase extensions, invalid path names and legacy key compatibility), TypeScript and diff checks passed. No live object changes. Test the existing WAV using the Track Play button; upload a new named file and confirm its S3 basename matches the source. Existing remote objects keep their prior names.

## Track deletion cleanup

User confirmed filename/playback changes and reported retained S3 object after deleting a Track. Track DELETE now loads the owned record, validates managed Multimedia key ownership, checks exact saved URL references across Tracks, Media and Album covers, and deletes an unshared object before removing the Track. S3 failure retains the Track and reports a retryable error. External/legacy unmanaged references are not deleted. Confirmation and success text distinguish file removal from shared-file retention. Server identity additionally needs `s3:DeleteObject` on the Multimedia prefix.

Offline `validate-music-track-delete.cjs`, TypeScript and diff checks passed. No live deletion. The already deleted test Track's orphan is not automatically identified or removed. Versioned buckets may retain historical versions under S3 policy. Database and S3 are not atomic: a database failure after S3 success can leave a record with a missing file; concurrent new references between inspection and deletion are not serialized. Exact saved URL reference checks do not identify arbitrary alternate URLs for the same object. Durable asset ownership/cleanup transactions remain a future schema-backed improvement.

## User-requested folder ordering

New uploads now use `threed/users/{userId}/multimedia/{uuid}/{original filename}` in the configured bucket (user confirmed `threedpublic`). The unique folder still prevents filename collisions. Older `multimedia/users/{userId}/...` references remain valid for playback and deletion; no existing S3 objects were moved. Update prefix-restricted IAM permissions for the new path while retaining old-path access as needed. S3 fixtures, Track deletion fixtures, TypeScript and diff checks passed.
