# ThreeD Simulations

Open **Admin → ThreeD → Simulations** to plan Actions and Sensor Group observations for a Project. The list supports search, Project filtering, sorting, pagination and selected deletion. Use the colored View/Edit/Delete icons for an individual Simulation.

**Add Simulation** opens a dedicated page. Choose an owned Project and assigned ThreeD module, enter a name and slug, and optionally link a Scenario from that same Project/module. You can save an inactive empty draft. Project/module bindings are locked after creation.

For Soccer, choose the saved movable Character and target ball once in **Soccer participants**. Both Run-to-ball and Kick-ball Actions use those choices. Other Actions retain their own Character/target choices. In **Actions**, choose a timeout and Stop/Continue behavior and use Up/Down to change order. Planting Actions require Planting targets. If choices are missing, place/save those instances in the Project first.

In **Target Sensors**, select Project Sensor Groups. Keep **All Sensors in this group** selected, or uncheck it to choose individual Sensors. Existing group-wide observations keep working. Missing Character/ball/group/Sensor choices must be resolved before saving. Saving does not execute Actions, collect readings or reset counters. Active controls definition availability and requires an Action. Other Action types and metadata collectors remain separate future work.

Save keeps you on Edit; Cancel asks before discarding changes. Errors retain your draft. A revision conflict means another edit was saved first: review your draft and use Reload when ready to discard it and load the current record. View is read-only. Selected deletion affects the currently selected page records; partial failures appear through Toast and the refreshed list.

To run Soccer practice:

1. Open **ThreeD Soccer**, load **Practice Soccer** through **Setup → Scenarios**, satisfy its setup checks and choose **Start Scenario**.
2. Select the assigned **Farmer Kate** and choose **Take Control**. Select the movable ball and choose **Use as Action Target**.
3. Follow the Scenario card's preparation checklist and choose **Run to target ball then kick the ball**. If it has not been authored, select your Character/control and target ball first; **Prepare Soccer Simulation** then opens the dedicated Add page with both Actions and current bindings as an inactive draft. Review participants and target Sensors, enable Active and save, then return and refresh the Scene's choices.
4. Choose **Run**. The App captures a result record before movement. Kate runs through her existing Character controller, slows for the final approach and waits for confirmed arrival before requesting the mapped foot kick. Completion requires the exact ball's confirmed contact impulse. A miss reports failure.
5. Use **Stop** or Escape to interrupt. Movement keys, control/target/Layer changes, placement and Project changes also stop pending work. Review per-step responses and optional Sensor observations in the card.

The first runner supports **Run to target ball** and **Kick ball (foot contact)**, using the same saved Character and ball for all steps. A blocked/interrupted approach always stops; Continue applies to failed kicks. Missing rig/mapping or references block execution. The run rechecks saved ownership/module membership and revision; changed definitions require review before running again.

The card reports **Result #… saved** after completion, failure, cancellation or timeout is persisted. If a save fails, use **Retry result save**; it saves that same attempt without running Actions again. An abruptly closed browser may leave an unfinished record. Result-backed runs require the v0.22.27 result-table schema; the Developer applies it with `npm run db:generate` followed by `npm run db:push`. The App explains when it is missing.

Sensor summaries cover only the run window, stop when the run ends and do not reset shared counts. A successful kick does not certify a goal; later goal entries remain visible in Physics Sensors. Legacy saved guidance without exact Scenario/module bindings must be reloaded and started before running. Saving/restoring a Project or definition never automatically starts a run.

Character control and animation actions remain visible in the compact Scene inspector. Use its **Show Character settings** icon for position, physics, Model and default settings. Enable **Physics Debug** when you need Sensor/collider outlines; counters continue working while outlines are hidden.

See [result analysis and API notes](../developers/THREED_SIMULATIONS.md), [v0.22.27 implementation/activation checklist](../plans/v0.22.27-simulation-results-preparation.md), [Soccer milestone record](../plans/v0.22.26-soccer-scenario-simulation.md) and [definition Admin foundation](../plans/v0.22.25-simulation-admin.md).
