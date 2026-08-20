# Admin Guide

The Admin surface at `/admin` manages Projects, Settings, Music, ThreeD Garden, and Traffic data.

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

Open **ThreeD Garden → FarmBots**, then use **FarmBot Connection** for an owned FarmBot record:

1. Generate and store a credential with the FarmBot account login workflow, or store a current FarmBot JWT directly.
2. Select **Test** and confirm REST authentication, the FarmBot REST device ID, and the MQTT broker identity.
3. Select **Discover** under Configured peripherals and explicitly assign the correct peripheral to Water.
4. Select **Validate** to confirm the stored Water assignment still matches FarmBot.
5. Review the broker metadata and select **Readiness** to confirm the stored configuration is eligible for the read-only MQTT worker.
6. Open **MQTT Activity**, select **Start read-only**, and verify connected state, recent status/message times, and X/Y/Z position. Select **Stop** when the session is no longer needed.

Stored credentials are encrypted and are never displayed again. A connected read-only MQTT session proves broker connectivity and permits allowlisted status observation; it does not authorize control. v0.18.1a does not publish MQTT messages or send movement, Water, pin, or other physical commands.
