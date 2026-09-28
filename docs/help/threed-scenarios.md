# ThreeD Scene Scenarios

To save a Scenario for a Project, open that Project in **Admin → Projects** and choose **Set up Scenario**, or choose **Save a Scenario** from the Scene's **Setup → Scenarios** panel. Select the Project's assigned ThreeD module, then enter a name and slug and save. If no ThreeD module is available, assign one in the Project's Modules section first. Saved definitions appear in **Admin → ThreeD → Scenarios** and the Project Scene's read-only Scenario card; they do not create Scene objects or configure sensors automatically.

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
