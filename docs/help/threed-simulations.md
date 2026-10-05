# ThreeD Simulations

Open **Admin → ThreeD → Simulations** to plan Actions and Sensor Group observations for a Project. The list supports search, Project filtering, sorting, pagination and selected deletion. Use the colored View/Edit/Delete icons for an individual Simulation.

**Add Simulation** opens a dedicated page. Choose an owned Project and assigned ThreeD module, enter a name and slug, and optionally link a Scenario from that same Project/module. You can save an inactive empty draft. Project/module bindings are locked after creation.

In **Actions**, add a supported targeted Action, select a saved Character and target from the Project module, choose a timeout and Stop/Continue behavior, then use Up/Down to change its order. Planting Actions require Planting targets. If choices are missing, place/save those instances in the Project before selecting them here.

In **Observations**, select the Project Sensor Groups you want a future Simulation run to observe. Other metadata sources will be added separately. Action steps and observation choices are definitions; saving does not execute Actions, collect readings or reset counters. Active controls definition availability and requires an Action. Scene execution and results are future work.

Save keeps you on Edit; Cancel asks before discarding changes. Errors retain your draft. A revision conflict means another edit was saved first: review your draft and use Reload when ready to discard it and load the current record. View is read-only. Selected deletion affects the currently selected page records; partial failures appear through Toast and the refreshed list.

See the [implementation and review checklist](../plans/v0.22.25-simulation-admin.md).
