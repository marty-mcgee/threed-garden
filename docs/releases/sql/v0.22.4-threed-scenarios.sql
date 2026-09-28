-- v0.22.4: additive ThreeD Scenarios definition only.
-- Review against the target production database before execution.
BEGIN;

CREATE TABLE public.threed_scenarios (
  id serial PRIMARY KEY,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  project_id integer NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  threed_id integer NOT NULL REFERENCES public.threed(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_threed_scenarios_project_threed_slug
  ON public.threed_scenarios (project_id, threed_id, slug);
CREATE INDEX idx_threed_scenarios_owner_project
  ON public.threed_scenarios (user_id, project_id);
CREATE INDEX idx_threed_scenarios_threed_id
  ON public.threed_scenarios (threed_id);

COMMIT;
