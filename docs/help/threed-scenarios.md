# ThreeD Scene Scenarios

To save a Scenario for a Project, open that Project in **Admin → Projects** and choose **Set up Scenario**, or open the Scene's **Setup → Scenarios** panel and choose **New Scenario**. Choose a starting idea or **Start from scratch**. Starting ideas suggest editable names and descriptions and show assigned Project asset counts when available. Counts are inventory hints, not readiness checks; choosing an idea does not add Scene assets or configure sensors. Select the Project's assigned ThreeD module, edit the name, purpose, and slug, then save. If no ThreeD module is available, assign one in the Project's Modules section first. Saved definitions appear in **Admin → ThreeD → Scenarios** and in the Scene's **Setup → Scenarios → Saved outlines** list. Both places use the same create/edit form; the Scene list also supports search and deletion. It reloads after a save and when you return from another tab. The Scene does not open a Scenario overlay automatically. Definitions do not create Scene objects or configure sensors automatically.

For a temporary setup checklist, open **Setup → Scenarios** in the Scene.

Choose a reference Scenario, then choose an assigned Model as its field or environment. These choices are temporary guidance, not saved Project settings.

## Soccer

Choose a Project Sensor Group. The checklist looks for an active movable-ball Model and at least two generic ball-entry counters in that group. Sensor names are yours to choose. Edit placement and group membership through Project Assets. Use **Environment → Show Sensors** to inspect session counts and reset them.

“Ready” means an assignment check passed; verify sensor placement and actual ball entry separately.

## Farming

The checklist looks for active Beds, Plantings and FarmBots. Select a FarmBot to read its recorded observation. Live, stale, disconnected and unavailable are equipment observation conditions, separate from asset setup. Guidance sends no equipment commands and does not change Scene positions.

Closing guidance clears its choices and stops its observation polling. Project Assets remains independently available.

Implementation and browser checklist: [v0.20.5 plan](../plans/v0.20.5.md).

**Setup → Project Tour** opens the separate getting-started overlay. Opening either overlay closes the other. Setup, Environment and Add to Scene dropdowns do not hide Project Assets or the selected DetailsCard.
