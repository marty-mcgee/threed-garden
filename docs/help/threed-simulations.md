# ThreeD Simulations

A **Simulation** runs supported Actions through a Project's participating ThreeD modules and collects their responses. A **Scenario** is a separate plan: **Open Scenario** displays guidance; **Run Simulation** executes Actions. You can run a Simulation without opening a Scenario.

## Prepare a definition

1. Open **Admin → ThreeD → Simulations** and choose **Add Simulation**. From a Project's **Setup → Simulations** controls, **Create Simulation** opens the same Admin creation workflow with the available Project context.
2. Choose an owned Project and its assigned ThreeD module, then enter a name and slug.
3. Choose saved Project participants. For Soccer, use the same movable Character and target ball for **Run to target ball** and **Kick ball (foot contact)**.
4. In **Actions**, set order, timeouts and Stop/Continue behavior. A blocked or interrupted approach always stops; Continue applies to failed kicks.
5. Optionally, in **Target Sensors**, choose Project Sensor Groups to observe. Keep **All Sensors in this group** selected, or choose individual Sensors. Actions can run without observations.
6. Save the definition. Enable **Active** when it has valid Actions and is ready to offer in the Scene launcher.

Place and save the required instances in the Project before selecting them in a definition. Missing Character, ball, group or Sensor references must be resolved before saving. Project/module bindings are locked after creation.

An inactive empty draft can be saved. With **Active** on and no Actions, Save explains that an Action is required. Saving a definition never executes Actions, collects readings or resets counts.

The Scene runner currently supports **Run to target ball** and **Kick ball** with one Character and one ball. Other Action types can exist in definitions but are not listed as runnable in this launcher. Broader Action execution and cross-Project definitions remain outside the current workflow.

## Preview before running

The editor's **Preview Canvas** shows the selected participants at their saved Project positions. Select an **Action Timeline** step to highlight its connection, then **Play Timeline** to preview compatible mapped animations. **Stop preview** cancels playback and restores saved preview positions; Fit and Reset change only the camera.

Walk/Run previews approach their selected target. Supported kick previews react to animated foot contact: the Sphere moves locally and stays visible when the timeline finishes. A missed target or unsupported foot animation reports guidance. Replay starts from the saved preview positions.

Expand **Animation Clip Previews** to inspect compatible loaded clips and reach the Character's **Animations & Actions** editor or Animation Library. Missing sources, mappings or incompatible rigs explain unavailable playback. Local preview clip choices do not change saved mappings or the definition; draft edits stop preview playback.

Preview movement remains inside this Canvas. It does not change the Project Scene, collect its Sensor readings or save Results. Use **Run Simulation** in the actual Project for those operations.

## Run in the Project

1. Open the Project at `/dashboard/scene`, then **Setup → Simulations**.
2. Select an available saved Simulation. Use **Refresh Simulations** after changing a definition; refresh does not run Actions or reload the Scene.
3. Read any disabled-state guidance. Finish placement or editing and resolve missing participants, mappings or Sensors.
4. Choose **Run Simulation**. Read the current Action and completion, failure, cancellation or timeout feedback.
5. Use **Stop Simulation** to cancel pending work. **Close Simulations** also stops an active attempt and hides the controls; reopen them through Setup.

The runner checks current saved references, ownership/module membership and revision before execution. A changed definition needs review before running again. Missing rigs, mappings or required references block the run.

Opening or changing a Scenario does not prepare or interrupt a Simulation. Saving or restoring a Project or definition never starts a run automatically.

## Review Results

For the Project owner, a run record is captured before Actions execute and the attempt is finalized after completion, failure, cancellation or timeout. **Result #… saved. View report** opens its report when persistence succeeds.

If saving fails, read the visible error and use **Retry result save**. This saves the same attempt without rerunning Actions. Closing the browser abruptly can leave an unfinished record; it must not be interpreted as a completed run.

Use **Admin → ThreeD → Simulations → Results**, or the **View saved Results** row action, to review captured reports. Results are immutable and read-only; editing the definition does not rewrite past Results.

Authorized public visitors run locally in their browser without writing database Results. Public Project access does not expose the owner's unrelated private definitions, Admin workspace or result history.

## Understand Sensor observations

Sensor summaries cover the run window and stop when the run ends. They do not reset shared counts. Only the definition's requested groups and Sensors are required.

A successful kick does not certify a goal or prove an Action caused a Sensor event. Later ball entries may remain visible in Physics Sensors after a run has finished. Enable **Physics Debug** when you need collider/Sensor outlines; counts continue while outlines are hidden.

## Edit, retry or troubleshoot

- **No available Simulation:** save a supported definition with Active enabled, valid participants and the current Project/module binding, then refresh the launcher.
- **Unavailable animation:** check the Character's active Action Slot and compatible assigned clip. Library import alone does not create the assignment.
- **Revision conflict:** retain or review your draft, then use Reload only when ready to discard it and load the current saved version.
- **Save error:** errors retain the definition draft. For a failed Result save, use its dedicated retry rather than starting another run.
- **Missing storage support:** report the displayed error to the App operator. Database setup is not a learner action.
- **Delete:** selected deletion applies to selected page records; review partial-failure feedback. Results remain separate from definition editing.

Definitions open at their canonical Admin Edit pages; old detail/View links redirect there. Cancel asks before discarding changes; successful Save keeps you on Edit.

See [Character controls](../users/THREED_CONTROLS.md#characters), [Scenario guidance](threed-scenarios.md) and [Simulation implementation and result analysis](../developers/THREED_SIMULATIONS.md). Historical plans and release verification belong in the linked developer documentation and [release records](../releases/README.md).
