-- v0.30.0 follow-up proposal: review before applying manually once.
-- The original threed-albums.sql is already applied. Do not rerun it.
-- Preserve all existing associations; support Assembly text/UUID identities.
-- This script has not been executed by the agent.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;

DO $precondition$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'threed_multimedia_albums'
        AND column_name = 'entity_id') IS DISTINCT FROM 'integer' THEN
    RAISE EXCEPTION 'Expected the original integer entity_id; inspect schema before applying';
  END IF;
END;
$precondition$;

ALTER TABLE threed_multimedia_albums
  DROP CONSTRAINT threed_multimedia_albums_entity;
ALTER TABLE threed_multimedia_albums
  ALTER COLUMN entity_id TYPE text USING entity_id::text;
ALTER TABLE threed_multimedia_albums
  ADD CONSTRAINT threed_multimedia_albums_entity CHECK (
    CASE
      WHEN module_type = 'assembly' THEN
        entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      WHEN entity_id ~ '^[1-9][0-9]{0,9}$' THEN entity_id::bigint <= 2147483647
      ELSE false
    END
  );

-- Existing parent triggers keep their identities and association-only behavior.
CREATE OR REPLACE FUNCTION public.cleanup_threed_multimedia_albums() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $cleanup$
BEGIN
  DELETE FROM public.threed_multimedia_albums
  WHERE module_type = TG_ARGV[0] AND entity_id = OLD.id::text;
  RETURN OLD;
END;
$cleanup$;
COMMIT;

-- Keep text identities on code rollback, especially after UUID associations exist.
-- Do not cast UUIDs to integers, discard relationships or rerun the CREATE script.
-- The Module type allowlist and Learn proposal are unchanged by this follow-up.
