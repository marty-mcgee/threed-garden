BEGIN;
CREATE TABLE IF NOT EXISTS threed_duplicate_receipts (
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  request_key uuid NOT NULL,
  kind text NOT NULL,
  source_id integer NOT NULL CHECK (source_id > 0),
  name text NOT NULL,
  destination_id integer,
  PRIMARY KEY (user_id, request_key)
);
-- Drain duplication requests on v0.38.0 instances before applying this migration.
LOCK TABLE project IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE threed_duplicate_receipts
  ADD COLUMN IF NOT EXISTS request_hash text,
  ALTER COLUMN source_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS threed_duplicate_receipts_content_check,
  DROP CONSTRAINT IF EXISTS threed_duplicate_receipts_kind_check,
  ADD CONSTRAINT threed_duplicate_receipts_kind_check
    CHECK (kind IN ('project', 'model', 'character', 'terrain')),
  ADD CONSTRAINT threed_duplicate_receipts_content_check CHECK (
    (kind = 'project' AND request_hash IS NOT NULL AND request_hash ~ '^[0-9a-f]{64}$')
    OR (kind <> 'project' AND source_id IS NOT NULL AND request_hash IS NULL)
  );

-- A deleted parent leaves a null source_project_id. The original request hash
-- still identifies the source, submitted name and snapshot after a rename.
INSERT INTO threed_duplicate_receipts
  (user_id, request_key, kind, source_id, name, destination_id, request_hash)
SELECT user_id, duplicate_request_key, 'project', source_project_id, name, id, duplicate_request_hash
FROM project WHERE duplicate_request_key IS NOT NULL
ON CONFLICT (user_id, request_key) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM project p
    WHERE p.duplicate_request_key IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM threed_duplicate_receipts r
      WHERE r.user_id = p.user_id AND r.request_key = p.duplicate_request_key
        AND r.kind = 'project' AND r.destination_id = p.id
        AND r.request_hash = p.duplicate_request_hash
    )
  ) THEN
    RAISE EXCEPTION 'Conflicting duplication receipts. No changes were applied.';
  END IF;
END;
$$;
UPDATE project SET duplicate_request_key = NULL, duplicate_request_hash = NULL
WHERE duplicate_request_key IS NOT NULL;
COMMIT;
