-- Manual repair for the already-applied threed-albums.sql cleanup trigger.
-- No table/column changes. No Models, Assemblies or associations are deleted here.
-- Compatible with both the original integer and proposed text entity_id column.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_threed_multimedia_albums() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $cleanup$
BEGIN
  DELETE FROM public.threed_multimedia_albums
  WHERE module_type = TG_ARGV[0] AND entity_id::text = OLD.id::text;
  RETURN OLD;
END;
$cleanup$;
COMMIT;

-- Existing triggers are retained. UUID Assembly IDs cannot match integer Album
-- identities; those deletes safely find no associations in the original schema.
-- Integer parent IDs still match exactly. This does not enable UUID associations
-- or require the broader threed-albums-entity-identity.sql proposal.
