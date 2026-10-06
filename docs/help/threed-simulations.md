# ThreeD Simulations

Kick previews now respond to animated foot contact: the target Sphere rolls away locally and remains visible after the timeline completes. A missed target or unsupported foot animation reports guidance. Stop restores the saved preview positions; replay starts from those positions. Project Scene physics, Sensors and saved Results remain separate from this preview.

In a Project, choose **Setup → Show / Hide Simulations** to reopen or hide the controls. **Close Simulations** hides them and stops an active attempt. Owners can choose **Create Simulation** to use the front-end editor with the same form and Preview Canvas as Admin. Walk/Run previews approach the selected target; Stop restores saved positions. Preview movement is local; run in the Project Scene for physics, Sensor readings and Results.

**Scenario** means a plan: use **Open Scenario** to view its setup and guidance. **Simulation** means Actions and Results: use **Run Simulation** to execute Actions through participating ThreeD modules and collect their responses.

Released [v0.22.28](../releases/v0.22.28.md) removes Scenario links from Simulation definitions and Results. You can run a Simulation without opening a Scenario. The [corrected design](../plans/v0.22.28-independent-simulations.md) also calls for independent definitions with Project/modules chosen for each run; that broader refactor remains pending. Current forms still bind a definition to its Project/module.

## Current implementation

Local v0.22.29 adds an **Admin Preview Canvas** on Add/Edit/View. Choose participants and targets in the form to see their saved Project positions; click an **Action Timeline** step to highlight its connection. **Play Timeline** plays one mapped animation cycle per Action in order, and **Stop preview** cancels it. Missing sources or animation mappings explain why Play is unavailable. Orbit/zoom, Fit and Reset change the camera. Generic targets without a Model renderer appear as labeled target markers.

Expand **Animations & Actions** to preview existing loaded compatible clips and open the Character assignment editor or Animation Library. This preview does not move the Project Character, kick a physical ball, collect Sensors or save Results; use **Run Simulation** in the Project for those actions. Draft edits stop preview playback. See the [implementation and browser checklist](../plans/v0.22.29-simulation-admin-preview.md).

Open **Admin → ThreeD → Simulations** to plan Actions and Sensor Group observations for a Project. The list supports search, Project filtering, sorting, pagination and selected deletion. Use the colored View/Edit/Delete icons for an individual Simulation.

**Add Simulation** opens a dedicated page. Choose an owned Project and assigned ThreeD module, then enter a name and slug. There is no Scenario selector. You can save an inactive empty draft. If **Active** is on with no Actions, Save stays disabled and explains how to continue: add an Action, or turn Active off to save a draft. Current Project/module bindings are locked after creation.

For Soccer, choose the saved movable Character and target ball once in **Soccer participants**. Both Run-to-ball and Kick-ball Actions use those choices. Other Actions retain their own Character/target choices. In **Actions**, choose a timeout and Stop/Continue behavior and use Up/Down to change order. Planting Actions require Planting targets. If choices are missing, place/save those instances in the Project first.

In **Target Sensors**, select Project Sensor Groups. Keep **All Sensors in this group** selected, or uncheck it to choose individual Sensors. Existing group-wide observations keep working. Missing Character/ball/group/Sensor choices must be resolved before saving. Saving does not execute Actions, collect readings or reset counters. Active controls definition availability and requires an Action. Other Action types and metadata collectors remain separate future work.

Save keeps you on Edit; Cancel asks before discarding changes. Errors retain your draft. A revision conflict means another edit was saved first: review your draft and use Reload when ready to discard it and load the current record. View is read-only. Selected deletion affects the currently selected page records; partial failures appear through Toast and the refreshed list.

The v0.22.28 controls use **Open Scenario**, **Run Simulation**, **Stop Simulation** and **Refresh Simulations**. The Scenario chooser no longer filters the Simulation launcher. A gray Run button explains missing choices or unfinished placement/editing, and Refresh updates choices without running Actions or reloading the Scene. Preflight and result-save errors remain visible with details closed. Broader Project/module-independent definitions remain separate future work.

The approved public/private contract remains: authorized public visitors run locally in their browser; owner runs save database Results. The independent redesign must explicitly determine which definitions visitors may access. Publishing a Project must not expose the owner's unrelated private Simulation catalog, Admin pages or result history.

The first runner supports **Run to target ball** and **Kick ball (foot contact)**, using the same saved Character and ball for all steps. A blocked/interrupted approach always stops; Continue applies to failed kicks. Missing rig/mapping or references block execution. The run rechecks saved ownership/module membership and revision; changed definitions require review before running again.

For the Project owner, Simulation details reports **Result #… saved** after completion, failure, cancellation or timeout is persisted. If a save fails, use **Retry result save**; it saves that same attempt without running Actions again. An abruptly closed browser may leave an unfinished record. Result-backed runs require the v0.22.27 result-table schema; the Developer applies it with `npm run db:generate` followed by `npm run db:push`. The App explains when it is missing.

Sensor summaries cover only the run window, stop when the run ends and do not reset shared counts. A successful kick does not certify a goal; later goal entries remain visible in Physics Sensors. Only the Simulation's requested observation groups and Sensors are required. Opening/changing a Scenario does not prepare or interrupt a Simulation. Saving/restoring a Project or definition never automatically starts a run.

Character control and animation actions remain visible in the compact Scene inspector. Use its **Show Character settings** icon for position, physics, Model and default settings. Enable **Physics Debug** when you need Sensor/collider outlines; counters continue working while outlines are hidden.

See [independent Simulation design](../plans/v0.22.28-independent-simulations.md), [superseded launch investigation](../plans/v0.22.28-scene-simulation-launch.md), [result analysis and API notes](../developers/THREED_SIMULATIONS.md), [v0.22.27 implementation/activation checklist](../plans/v0.22.27-simulation-results-preparation.md), [Soccer milestone record](../plans/v0.22.26-soccer-scenario-simulation.md) and [definition Admin foundation](../plans/v0.22.25-simulation-admin.md).
