# Scenario setup persistence proposal

## Proven gap

The current `threed_scenarios` table and `/api/threed/scenarios` POST/PATCH payload store only Project and ThreeD module identity, name, slug, description, and active state. The Admin form does not collect Scenario kind, Field/Environment Model, or Sensor Group. The Scene Setup Guide holds those choices in local React state. Therefore loading an existing Scenario can recover its outline text but cannot recover guide selections. Existing records such as “Soccer Practice” have no saved setup to backfill safely from their names or descriptions.

## Approved contract and implementation

The approved change adds one nullable `setup` JSONB column to `threed_scenarios`. `null` means a legacy outline with no saved guide configuration. A version 1 object holds `kind: 'soccer' | 'farming'`, `environmentMarkerId: string | null`, and `sensorGroupId: string | null`. The environment ID is the stable Project `marker_id`, not a reusable Model ID. A Sensor Group ID is meaningful only for Soccer and must belong to the Scenario's Project. The existing table's owner, Project, and ThreeD-module references remain authoritative; no new table, foreign-key cascade, Scene mutation, or Physics behavior is proposed.

Admin create/edit now offer the same guide choices and save this object with the outline. The Scene should load the object into the Setup Guide, preselecting kind, environment marker, and Sensor Group. If a referenced Model or group was removed or is inactive, keep the stored ID but show an actionable missing-reference state; do not silently select another asset. Setup checks still inspect current Project assets and remain observations, not persisted proof of runtime behavior. Loading must not modify Project assets, markers, Sensor Groups, or reusable Models.

The API validates the bounded JSON structure and owner/Project scope before writing. PATCH should preserve existing setup when it is omitted; an explicit `null` clears it. Existing Scenario rows remain `null` after migration and need one deliberate setup save before they can populate the guide. No inference from title, slug, or description is safe. The prepared `docs/releases/sql/threed-scenario-setup.sql` migration adds the nullable column without rewriting existing rows; rollback drops the column only after any new setup data is exported or deemed disposable.

## Verification and rollout

Add offline tests for valid/invalid setup payloads, cross-Project Model and Sensor Group rejection, preservation on outline-only edits, legacy `null`, stale-reference display, and independent Scenarios in one Project. Run Scenario/Project validation, TypeScript, and an isolated build. Browser-check Admin create/edit → Scene load/preselection, missing Model/group, two Scenarios in one Project, and a legacy outline. The migration is prepared but has not been applied to any database. Apply it before deploying this code, after review. Existing Scenario rows remain setup `null`; edit and save each one to select its actual setup.
