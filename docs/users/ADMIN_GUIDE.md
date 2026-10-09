# Admin Guide

Current production: **[v0.24.0-alpha — 3D Object Builder + Home Design Tools](../releases/v0.24.0-alpha.md)**, Developer-confirmed October 9, 2026. The local-document Home Design and Model Builder tools below are included; detailed App/live acceptance remains separately tracked.

Local v0.24.0-alpha adds **ThreeD → Models → Home Design**. Draw walls/floors in 2D while 3D geometry updates live. Finish Floor or Enter saves the floor and returns to Select. Choose Door/Window and click a host wall to add a real opening; drag it along that wall or edit its dimensions/sill in inches. Add/name levels and set their elevations; the 2D plan edits the Active level, while Show all levels in 3D controls the preview. Wall/floor offsets are relative to their level. Select shapes in either view, drag yellow shared corners and use Undo/Redo. Draw Roof footprints and edit Flat/Shed/Gable type, pitch, direction, thickness and eave offset. Finish Roof or Enter returns to Select. Choose Roof Cutout/Skylight and click inside a roof for a 24 x 36 inch opening; drag it or edit dimensions/offsets in inches. Keep one inch from roof edges/other openings; gable skylights also need one inch from the ridge. Select the intended roof first when roofs overlap. Show roofs in 3D hides roofs and skylights to inspect rooms below. Export/import version 5 JSON for local recovery; versions 1-4 upgrade automatically without adding new geometry. This prototype does not save a Project/register a Model. See [drawing, opening, level and roof steps](../developers/THREED_HOME_DESIGN.md#acceptance).

The Admin surface at `/admin` manages Projects, Settings, Music, ThreeD Garden, and Traffic data.

Use [Personal workspace Settings](SETTINGS.md) for appearance and navigation preferences, Save/Discard behavior and their scope.

The local v0.24.0-alpha adds **ThreeD → Models → Model Builder**. Adjust the Cottage dimensions in inches, choose **Generate Preview**, then download the metre-based GLB/manifest or capture a PNG. **Save as New Model** creates a private, inactive Model with managed PBR textures. Review and activate it before placing it through a Project's Model Library. Generation does not replace an existing Model or add it to a Project. See the [Builder workflow and limitations](../developers/THREED_MODEL_BUILDER.md#builder-workflow).

## Project setup

1. Create or edit a project.
2. Enable the modules the project uses.
3. Open the Project Asset Manager.
4. Assign the specific active assets that should appear in that project.
5. Save, then verify the project from the Dashboard.

An asset being active does not assign it to a project. Project/module relationships and the `project_assets` assignments determine what a project may load.

## Module administration

- Music manages albums, tracks, links, and media. Music records are owner-scoped.
- ThreeD Garden manages plants, plantings, beds, characters, tasks, watering schedules, harvests, FarmBots, models, model files, model animations, and layers.
- Traffic manages its data sources and map content through the Traffic section.

Use the sidebar as the canonical navigation for available admin pages. Avoid editing database rows by hand when an Admin workflow exists.

## FarmBot connection setup

Open **ThreeD Garden → FarmBots**, then choose **FarmBot Connection** or **MQTT Activity**
from a FarmBot record. The selected section expands directly beneath that record and uses the
available page width; opening one section closes the other.

Use **FarmBot Connection** for an owned FarmBot record:

1. Generate and store a credential with the FarmBot account login workflow, or store a current FarmBot JWT directly.
2. Select **Test** and confirm REST authentication, the FarmBot REST device ID, and the MQTT broker identity.
3. Select **Discover** under Configured peripherals and explicitly assign the correct peripheral to Water.
4. Select **Validate** to confirm the stored Water assignment still matches FarmBot.
5. Review the broker metadata and select **Readiness** to confirm the stored configuration is eligible for the read-only MQTT worker.
6. Open **MQTT Activity**, select **Start read-only**, and verify connected state, recent status/message times, and X/Y/Z position. Select **Stop** when the session is no longer needed.

Stored credentials are encrypted and are never displayed again. A connected read-only MQTT session proves broker connectivity and permits allowlisted status observation; it does not authorize control. v0.18.1b does not publish MQTT messages or send movement, Water, pin, or other physical commands.
