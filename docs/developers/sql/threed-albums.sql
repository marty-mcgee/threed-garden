-- v0.30.0: shared ThreeD Sub-Module / Multimedia Album relationships.
-- Replaces the UNAPPLIED three-junction proposal. Apply manually once.
-- Project Albums continue to use project_assets; no Track relationships are added.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;
CREATE TABLE threed_multimedia_albums (
  id serial PRIMARY KEY,
  module_type text NOT NULL,
  entity_id integer NOT NULL,
  album_id integer NOT NULL REFERENCES multimedia_albums(id) ON DELETE CASCADE,
  sort_order integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT threed_multimedia_albums_type CHECK (module_type IN ('model', 'character', 'plant', 'planting', 'bed', 'farmbot', 'scenario', 'simulation', 'design', 'layer', 'task', 'harvest', 'watering', 'model_file', 'model_category', 'texture', 'ground_map', 'animation', 'animation_file', 'animation_category', 'animation_slot', 'animation_preset', 'assembly')),
  CONSTRAINT threed_multimedia_albums_entity CHECK (entity_id > 0),
  CONSTRAINT threed_multimedia_albums_sort CHECK (sort_order BETWEEN -10000 AND 10000)
);
CREATE UNIQUE INDEX threed_multimedia_albums_pair ON threed_multimedia_albums(module_type, entity_id, album_id);
CREATE INDEX threed_multimedia_albums_album ON threed_multimedia_albums(album_id);

-- Polymorphic entity IDs have no entity FK. Application writes validate/lock
-- owned entities; these triggers clean associations on ALL parent delete paths.
CREATE FUNCTION public.cleanup_threed_multimedia_albums() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $cleanup$
BEGIN
  DELETE FROM public.threed_multimedia_albums
  WHERE module_type = TG_ARGV[0] AND entity_id = OLD.id;
  RETURN OLD;
END;
$cleanup$;
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_models
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('model');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_characters
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('character');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_plants
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('plant');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_plantings
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('planting');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_beds
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('bed');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_farmbots
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('farmbot');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_scenarios
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('scenario');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_simulations
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('simulation');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_designs
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('design');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_layers
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('layer');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_tasks
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('task');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_harvests
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('harvest');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_watering_schedules
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('watering');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_model_files
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('model_file');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_model_categories
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('model_category');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_model_textures
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('texture');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_ground_maps
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('ground_map');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_animations
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('animation');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_animation_files
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('animation_file');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_animation_categories
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('animation_category');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_animation_action_slots
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('animation_slot');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_animation_presets
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('animation_preset');
CREATE TRIGGER cleanup_multimedia_albums AFTER DELETE ON public.threed_assembly
FOR EACH ROW EXECUTE FUNCTION public.cleanup_threed_multimedia_albums('assembly');
COMMIT;
-- Retain populated relationships on code rollback. No data or live SQL is run by the agent.
