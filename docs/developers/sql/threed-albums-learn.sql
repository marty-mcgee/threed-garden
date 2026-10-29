-- v0.30.0 follow-up: the original threed-albums.sql is already applied.
-- Apply this file once, manually. Existing associations are preserved.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;
ALTER TABLE threed_multimedia_albums DROP CONSTRAINT threed_multimedia_albums_type;
ALTER TABLE threed_multimedia_albums ADD CONSTRAINT threed_multimedia_albums_type
  CHECK (module_type IN ('learn', 'model', 'character', 'plant', 'planting', 'bed', 'farmbot', 'scenario', 'simulation', 'design', 'layer', 'task', 'harvest', 'watering', 'model_file', 'model_category', 'texture', 'ground_map', 'animation', 'animation_file', 'animation_category', 'animation_slot', 'animation_preset', 'assembly'));
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.learn_guides
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('learn');
COMMIT;
-- Retain this type and its relationships during code rollback. Do not rerun the original CREATE script.
