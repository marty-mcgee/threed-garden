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
