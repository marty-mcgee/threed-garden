# ThreeD Scene Scenarios

To create or edit a Scenario, open **Admin → ThreeD → Scenarios**, or use **Set up Scenario** from that Project in **Admin → Projects**. Choose a starting idea or **Start from scratch**, select an assigned ThreeD module, then save the name, purpose, setup choices, and slug. Starting ideas suggest editable text; they do not add Scene assets or configure sensors. The Admin workspace retains the Scenario management list. The Scene uses a focused **Templates (Choose a Scenario)** chooser to load an existing active Scenario for the Project. Definitions do not create Scene objects or configure sensors automatically.

After saving, a Scenario detail view shows the Project’s current active ThreeD asset inventory and one next action. Choose **View** on any saved outline to reopen it. Inventory counts describe Project assignments, not assets saved to that Scenario or proof of working interaction. **Open Project assets** leads to that Project’s Modules workspace, where you can add or review assignments.

For the setup checklist, open **Setup → Scenarios** in the Scene. The Setup Guide’s **Templates (Choose a Scenario)** button opens **Load Scenario**, a chooser of active Scenario outlines already saved for this Project. Selecting one loads its saved setup into the Guide for the current Scene session; it does not start a new Scenario or apply asset settings. Clear the selected outline with the adjacent button.

Choose a reference Scenario, then choose an assigned Model as its field or environment. The selections are saved on the Scenario when you save its Admin form. Setup Guide changes are kept with the Project when you choose **Save ThreeD Project**.

## Soccer

Choose a Project Sensor Group. The checklist looks for an active movable-ball Model and at least two generic ball-entry counters in that group. Sensor names are yours to choose. Edit placement and group membership through Project Assets. Use **Environment → Show Sensors** to inspect session counts and reset them.

“Ready” means an assignment check passed; verify sensor placement and actual ball entry separately.

## Farming

The checklist looks for active Beds, Plantings and FarmBots. Select a FarmBot to read its recorded observation. Live, stale, disconnected and unavailable are equipment observation conditions, separate from asset setup. Guidance sends no equipment commands and does not change Scene positions.

Closing guidance stops its observation polling. Its choices remain available when reopened, and **Save ThreeD Project** keeps them for the next load. Project Assets remains independently available.

Implementation and browser checklist: [v0.20.5 plan](../plans/v0.20.5.md).

**Setup → Project Tour** opens the separate getting-started overlay. Opening either overlay closes the other. Setup, Environment and Add to Scene dropdowns do not hide Project Assets or the selected DetailsCard.

Saved Scenario setup can include a Soccer or Farming type, a Project Model, and (for Soccer) a Sensor Group. Loading a configured Scenario fills the Setup Guide; readiness checks still reflect the current Project assets. Older outlines have no saved setup until edited. If a saved Model or group is later removed, the guide shows the missing reference so you can choose a replacement.

When a loaded Scenario meets every setup check, choose **Start Scenario**. This closes the Scenarios panel and opens the 3D Scene with an instruction card. Soccer also opens **Physics Sensors** on the selected Sensor Group so you can move the ball into a goal and watch entry counts. The counter reset control resets all session counts, including groups not shown by the Scenario. Farming shows a prompt to explore the environment, Beds, and Plantings; its optional FarmBot observation remains in the Setup Guide. Starting does not move assets, reset counts, issue FarmBot commands, or prove that collisions work. Dismiss the instruction card when finished.

Scenario instructions and Physics Sensors sit below the Scene toolbar. They move beside open Project Assets or inspectors and wrap when space is limited. Project Assets dims the instruction card while keeping sensor counts visible. A central setup panel or Scene menu dims both cards; dimmed controls cannot receive clicks or keyboard focus. Closing the higher-priority panel restores full opacity without resetting session counts.

**Save ThreeD Project** keeps the selected Scenario, Setup Guide choices, started status, and whether the Scenario instructions, Physics Sensors, and Scenarios panel are open. They return when that Project is loaded. Sensor counts remain session-only and start at zero after a reload. **Environment → Show Physics Debug** shows the active Rapier collider wireframes together with the focused Sensor guides.
