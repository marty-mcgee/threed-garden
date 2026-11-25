-- v0.38.0. Apply before deploying Project Save As. Existing Projects keep null provenance.
-- Use shared Ground Maps only after all serving App instances use reference-aware cleanup.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

ALTER TABLE project
  ADD COLUMN source_project_id integer,
  ADD COLUMN duplicate_request_key uuid,
  ADD COLUMN duplicate_request_hash text,
  ADD CONSTRAINT project_source_fk
    FOREIGN KEY (source_project_id) REFERENCES project(id) ON DELETE SET NULL,
  ADD CONSTRAINT project_duplicate_request_valid CHECK (
    (duplicate_request_key IS NULL AND duplicate_request_hash IS NULL)
    OR (user_id IS NOT NULL AND duplicate_request_key IS NOT NULL
      AND duplicate_request_hash IS NOT NULL AND duplicate_request_hash ~ '^[0-9a-f]{64}$')
  );
CREATE INDEX idx_project_source ON project(source_project_id);
CREATE UNIQUE INDEX idx_project_duplicate_request ON project(user_id, duplicate_request_key);

-- Each Project still owns at most one row. Copies can reference the same image.
CREATE INDEX idx_threed_ground_maps_file_path ON threed_ground_maps(file_path);
DROP INDEX IF EXISTS idx_threed_ground_maps_owner_path;

-- Upload and duplicate now use the table's serial allocator concurrently.
-- Only advance a sequence that is behind IDs inserted by an older import.
SELECT setval('threed_ground_maps_id_seq', saved.highest_id, true)
  FROM (SELECT max(id) AS highest_id FROM threed_ground_maps) AS saved,
       threed_ground_maps_id_seq AS seq
 WHERE saved.highest_id > seq.last_value
    OR (saved.highest_id = seq.last_value AND NOT seq.is_called);
COMMIT;
