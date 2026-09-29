-- Add saved Setup Guide selections to existing ThreeD Scenario definitions.
-- Review against the target database before execution; existing rows remain NULL.
BEGIN;
ALTER TABLE public.threed_scenarios ADD COLUMN setup jsonb;
COMMIT;
