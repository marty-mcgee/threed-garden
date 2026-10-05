# ThreeD Simulations

Open **Admin → ThreeD → Simulations** to plan Actions and Sensor Group observations for a Project. The list supports search, Project filtering, sorting, pagination and selected deletion. Use the colored View/Edit/Delete icons for an individual Simulation.

**Add Simulation** opens a dedicated page. Choose an owned Project and assigned ThreeD module, enter a name and slug, and optionally link a Scenario from that same Project/module. You can save an inactive empty draft. Project/module bindings are locked after creation.

In **Actions**, add a supported targeted Action, select a saved Character and target from the Project module, choose a timeout and Stop/Continue behavior, then use Up/Down to change its order. Planting Actions require Planting targets. If choices are missing, place/save those instances in the Project before selecting them here.

In **Observations**, select Project Sensor Groups to summarize during a Soccer run. Saving does not execute Actions, collect readings or reset counters. Active controls definition availability and requires an Action. Other Action types and metadata collectors remain separate future work.

Save keeps you on Edit; Cancel asks before discarding changes. Errors retain your draft. A revision conflict means another edit was saved first: review your draft and use Reload when ready to discard it and load the current record. View is read-only. Selected deletion affects the currently selected page records; partial failures appear through Toast and the refreshed list.

To run Soccer practice:

1. Open **ThreeD Soccer**, load **Practice Soccer** through **Setup → Scenarios**, satisfy its setup checks and choose **Start Scenario**.
2. Select the assigned **Farmer Kate** and choose **Take Control**. Select the movable ball and choose **Use as Action Target**.
3. In the Scenario card, choose **Run to target ball then kick the ball**. If it has not been authored, **Prepare Soccer Simulation** opens the dedicated Add page with both Actions and current bindings as an inactive draft. Review, enable Active and save, then return and refresh the Scene's choices.
4. Choose **Run**. Kate runs through her existing Character controller, slows for the final approach and waits for confirmed arrival before requesting the mapped foot kick. Completion requires the exact ball's confirmed contact impulse. A miss reports failure.
5. Use **Stop** or Escape to interrupt. Movement keys, control/target/Layer changes, placement and Project changes also stop pending work. Review per-step responses and optional Sensor observations in the card.

The first runner supports **Run to target ball** and **Kick ball (foot contact)**, using the same saved Character and ball for all steps. A blocked/interrupted approach always stops; Continue applies to failed kicks. Missing rig/mapping or references block execution. The run rechecks saved ownership/module membership and revision; changed definitions require review before running again.

Results remain in the Scene session. Sensor summaries cover only the run window, stop when the run ends and do not reset shared counts. A successful kick does not certify a goal; later goal entries remain visible in Physics Sensors. Legacy saved guidance without exact Scenario/module bindings must be reloaded and started before running. Saving/restoring a Project or definition never automatically starts a run.

See the [Soccer implementation notes and browser checklist](../plans/v0.22.26-soccer-scenario-simulation.md) and [definition Admin foundation](../plans/v0.22.25-simulation-admin.md).
