# ThreeD Scene Scenarios

A **Scenario** is a plan for a Project's setup and exploration. **Open Scenario** displays that plan and its guidance. A **Simulation** separately runs supported Actions and collects Results; it does not require an open Scenario. See the [Simulation guide](threed-simulations.md).

## Create or edit a plan

1. Open **Admin → ThreeD → Scenarios**, or **Set up Scenario** from an owned Project in Admin.
2. Choose a starting idea or **Start from scratch**, then select the Project's assigned ThreeD module.
3. Enter the name, purpose and slug. Choose the saved setup: Soccer or Farming, an assigned field/environment Model and, for Soccer, a Sensor Group.
4. Save the Scenario. Use **View** to review it or **Edit Scenario** to change it.

Starting ideas suggest editable text. Saving a Scenario does not add Scene objects, configure Sensors, move assets or execute Actions. Bindings remain within the Scenario's Project; cross-Project reuse is not implemented.

The detail view shows the Project's current active ThreeD asset inventory. Its counts describe Project assignments, not assets stored inside the Scenario or proof of working interaction. Use the Project workspace action to place and review assets.

## Open a saved Scenario in the Scene

1. Open the Project at `/dashboard/scene`.
2. Choose **Setup → Scenarios**, then **Choose Scenario**. The chooser lists active saved Scenarios for this Project.
3. Review the loaded **Scenario type**, **Field Model** or **Environment Model**, and **Sensor Group** where applicable.
4. Resolve missing or inactive references. The Setup checks describe available assignments; check actual placement and interaction separately.
5. When setup is ready, choose **Open Scenario**.

**Change Scenario** selects another plan; **Clear selected Scenario** clears the current choice. Older Scenarios without saved setup need **Edit Scenario** before their Model/group choices can be restored.

Opening a Scenario displays guidance in the current view. Soccer also opens **Physics Sensors** for its selected group. Farming prompts exploration of the environment, Beds and Plantings. Opening does not execute a Simulation, move assets, reset counts or issue FarmBot commands.

Setup Guide changes are kept with the Project by **Save ThreeD Project**. Editing the saved Scenario definition uses its Admin form; selecting a plan in the Scene is not an automatic rewrite of that definition.

## Soccer

Choose a Project Sensor Group. The setup checklist looks for an active movable-ball Model and at least two generic ball-entry counters in that group. Sensor names are yours to choose. Edit placement and group membership through **Project Assets**; use **Environment → Show Sensors** to inspect counts.

“Ready” means the assignment checks passed. Verify actual Sensor placement and ball entry separately.

### Directional Sensor counts

Each Sensor has a **Direction** setting in **Sensor Settings**:

- **Bi-directional** accepts entries from either side and is the default for existing Sensors.
- **Uni-directional** accepts the chosen **+Z → −Z**, **−Z → +Z**, **+X → −X** or **−X → +X** direction.
- **Direction axes → Scene X/Z coordinates** keeps direction tied to Scene axes even when the Sensor rotates.
- **Rotate direction with sensor** turns the accepted direction with that Sensor.

Choose the appropriate settings and **Save Sensor**. The cyan direction arrow on the selected owner or in Physics Debug should point into the goal. Reverse the direction if needed.

The body's centre may already have crossed the Sensor when the entry callback arrives. A body must fully leave before another entry counts. Direction does not change the Detect filter; this setting does not add Character doorway detection.

### Try a manual ball interaction

1. Select a movable Character and choose **Take Control**.
2. Select the placed ball Model and **Use as Action Target**.
3. Approach with WASD, then reopen the Character's DetailsCard.
4. Use a compatible loaded foot-kick action, or **Kick selected ball** when available.

Mapped foot-kick actions move the targeted ball on animated foot contact. The separate **Kick selected ball** button applies an assisted kick after its animation. The Character, mapping, range and exact ball target must remain valid. Multiple balls made from the same Model are separate instances.

A kick does not itself score. The Sensor counter changes only after a qualifying ball entry. Use a [Simulation](threed-simulations.md) when you want a supported sequence with run-window observations and Results.

## Farming and FarmBot observations

The checklist looks for active Beds, Plantings and FarmBots. Select a FarmBot to read its recorded observation. Live, stale, disconnected and unavailable are observation conditions, separate from asset setup or physical readiness.

Guidance sends no equipment commands and does not change Scene positions. FarmBot Character-target actions are animation-only. Closing guidance stops its observation polling; its choices remain available when reopened.

## Keep guidance and counts

**Save ThreeD Project** keeps the selected Scenario, Setup Guide choices, opened-plan status and supported panel visibility. It also captures current Physics Sensor counts, including **Goal Target: Score** and **Goal Target: Protect**.

A ball saved inside a Sensor does not count again merely because the Project reloads; leaving and re-entering counts normally. **Reset All Counts** clears current counts, including groups outside the selected Scenario. Save the Project afterward to keep that reset. Unsaved count changes are lost on reload; older snapshots without Sensor state start at zero.

**Environment → Show Physics Debug** displays active collider wireframes and focused Sensor guides. Counts can continue while those outlines are hidden.

**Setup → Project Tour** opens separate getting-started guidance. Opening it closes the Scenarios panel, and opening Scenarios closes the Tour. Project Assets remains independently available. Instruction and Sensor overlays adjust around open panels; dimmed controls cannot receive input until the higher-priority panel closes.

Related details: [ThreeD controls](../users/THREED_CONTROLS.md), [Physics Sensors and Sensor Groups](../developers/THREED_PHYSICS_SENSORS.md), and the [Scenario implementation record](../plans/v0.20.5.md).
