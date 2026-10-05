# ThreeD Scene Scenarios

For v0.22.24, Admin Add/Edit/View uses dedicated pages: `/admin/threed/scenarios/new`, `/admin/threed/scenarios/[id]` and `/admin/threed/scenarios/[id]/view`. Compact typography and colored icon actions follow the Admin Blueprint. The Project's compact Scenario workspace retains its guided form. Scenario bindings remain within their current Project; cross-Project application is a theoretical future capability only. Help sits beside the title; save/delete feedback uses Toast.

Scenarios describe structures and setup. Future **ThreeD Simulations** will run sets of Actions and collect responses from Sensors and other metadata; no Simulation runner is included in this version. See the [design and extension points](../plans/threed-simulations-design.md).

To create or edit a Scenario, open **Admin → ThreeD → Scenarios**, or use **Set up Scenario** from that Project in **Admin → Projects**. Choose a starting idea or **Start from scratch**, select an assigned ThreeD module, then save the name, purpose, setup choices, and slug. Starting ideas suggest editable text; they do not add Scene assets or configure sensors. The Admin workspace retains the Scenario management list. The Scene uses a focused **Templates (Choose a Scenario)** chooser to load an existing active Scenario for the Project. Definitions do not create Scene objects or configure sensors automatically.

After saving, a Scenario detail view shows the Project’s current active ThreeD asset inventory and one next action. Choose **View** on any saved outline to reopen it. Inventory counts describe Project assignments, not assets saved to that Scenario or proof of working interaction. **Open Project assets** leads to that Project’s Modules workspace, where you can add or review assignments.

For the setup checklist, open **Setup → Scenarios** in the Scene. The Setup Guide’s **Templates (Choose a Scenario)** button opens **Load Scenario**, a chooser of active Scenario outlines already saved for this Project. Selecting one loads its saved setup into the Guide for the current Scene session; it does not start a new Scenario or apply asset settings. Clear the selected outline with the adjacent button.

Choose a reference Scenario, then choose an assigned Model as its field or environment. The selections are saved on the Scenario when you save its Admin form. Setup Guide changes are kept with the Project when you choose **Save ThreeD Project**.

## Soccer

Choose a Project Sensor Group. The checklist looks for an active movable-ball Model and at least two generic ball-entry counters in that group. Sensor names are yours to choose. Edit placement and group membership through Project Assets. Use **Environment → Show Sensors** to inspect counts and reset them.

“Ready” means an assignment check passed; verify sensor placement and actual ball entry separately.

Each Sensor has a **Direction** setting in **Sensor Settings**. **Bi-directional** accepts entries from either side (for example, doorway Model traffic) and remains the default for existing sensors. For goals, choose **Uni-directional**, select **+Z → −Z**, **−Z → +Z**, **+X → −X**, or **−X → +X**, and **Save Sensor**. **Direction axes → Scene X/Z coordinates** is the default: +X → −X means the ball’s displayed X coordinate decreases, even when the sensor is rotated. Choose **Rotate direction with sensor** only when you want the accepted direction to turn with the sensor. The cyan arrow on the selected owner or in Physics Debug should point into the goal; reverse the direction as needed. One-way entries require movement in the selected direction. The body’s centre may already have crossed the sensor when the physics entry callback arrives. A body must fully leave before another entry can count. Direction does not change the Detect filter: Character doorway detection is not added by this setting.

For a manual kick, select a movable Character and choose **Take Control**. Select the placed ball Model and choose **Use as Action Target**. Approach with WASD, reopen the Character DetailsCard, and choose **Kick selected ball** under Animations. The button requires a loaded, active foot-kick mapping for that Character. The selected ball receives one bounded physical kick only after its one-shot animation finishes and the Character remains in range. Multiple balls made from the same Model remain separate targets. The Sensor counter changes only when a ball enters a goal; a kick itself does not score.

## Farming

The checklist looks for active Beds, Plantings and FarmBots. Select a FarmBot to read its recorded observation. Live, stale, disconnected and unavailable are equipment observation conditions, separate from asset setup. Guidance sends no equipment commands and does not change Scene positions.

Closing guidance stops its observation polling. Its choices remain available when reopened, and **Save ThreeD Project** keeps them for the next load. Project Assets remains independently available.

Implementation and browser checklist: [v0.20.5 plan](../plans/v0.20.5.md).

**Setup → Project Tour** opens the separate getting-started overlay. Opening either overlay closes the other. Setup, Environment and Add to Scene dropdowns do not hide Project Assets or the selected DetailsCard.

Saved Scenario setup can include a Soccer or Farming type, a Project Model, and (for Soccer) a Sensor Group. Loading a configured Scenario fills the Setup Guide; readiness checks still reflect the current Project assets. Older outlines have no saved setup until edited. If a saved Model or group is later removed, the guide shows the missing reference so you can choose a replacement.

When a loaded Scenario meets every setup check, choose **Start Scenario**. This closes the Scenarios panel and opens the 3D Scene with an instruction card. Soccer also opens **Physics Sensors** on the selected Sensor Group so you can move the ball into a goal and watch entry counts. The counter reset control resets all current counts, including groups not shown by the Scenario. Farming shows a prompt to explore the environment, Beds, and Plantings; its optional FarmBot observation remains in the Setup Guide. Starting does not move assets, reset counts, issue FarmBot commands, or prove that collisions work. Dismiss the instruction card when finished.

Scenario instructions and Physics Sensors sit below the Scene toolbar. They move beside open Project Assets or inspectors and wrap when space is limited. Project Assets dims the instruction card while keeping sensor counts visible. A central setup panel or Scene menu dims both cards; dimmed controls cannot receive clicks or keyboard focus. Closing the higher-priority panel restores full opacity without resetting counts.

**Save ThreeD Project** keeps the selected Scenario, Setup Guide choices, started status, and whether the Scenario instructions, Physics Sensors, and Scenarios panel are open. They return when that Project is loaded. It also saves current Physics Sensor counts, including **Goal Target: Score** and **Goal Target: Protect**, and restores them on load. A ball saved inside a sensor does not count again merely because the Project reloads; leaving and re-entering counts normally. **Reset All Counts** clears current counts; save the Project afterward to keep that reset. Unsaved changes to counts are lost on reload. Older saves without sensor state start at zero. **Environment → Show Physics Debug** shows the active Rapier collider wireframes together with the focused Sensor guides.
