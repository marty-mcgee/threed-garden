# ThreeD Project Scenarios — staged experience plan

**Planning document.** The product promise is: **Give your Project a purpose, then bring it to life.** A User should be able to save a useful Scenario outline in under a minute, see it in the Project Scene, and understand one concrete next step. Later stages can connect that outline to assets, behavior, and presentation without making the first save depend on those capabilities.

## Current foundation

- `/admin/threed/scenarios` saves owner-scoped Scenario definitions: Project, assigned ThreeD module, name, slug, description, and active state. Its API checks Project/module ownership. The Scene has a read-only card for active definitions.
- **Setup → Scenarios** separately offers temporary Soccer/Farming guidance based on Project markers and Sensor Groups. Choices clear when guidance closes; its “Ready” checks are setup hints, not proof of runtime behavior or saved Scenario configuration.
- The local v0.22.8 preparation adds **Set up Scenario** to Project Modules and **Save a Scenario** to the Scene panel, carrying an owned Project into the existing Admin form. See [v0.22.8 Scenario setup](v0.22.8-scenario-setup.md). These edits are uncommitted and are the first implementation stage, not a completed guided flow.

## User journey and screen direction

**Entry:** A Project page and its Scene use one primary invitation, **Create Scenario**. Existing Scenarios appear nearby so the User can resume one instead of creating a duplicate. A first-time empty state says what a Scenario does in one sentence and offers a direct action.

**Choose an outcome:** A small gallery shows *Explore a farm*, *Practice soccer*, *Monitor activity*, and *Start from scratch*. Each card has a simple visual, a concrete outcome, and an indication of what the current Project already has. These are starting prompts, not claims that templates create assets or configure sensors. The gallery should be skippable.

**Save the outline:** A focused form asks for name and short purpose, using the Project and its assigned ThreeD module as context. The slug can be derived from the name and remains editable for advanced use. Saving is available before optional setup is complete. If no ThreeD module is assigned, show a direct **Add ThreeD module** route back to Project Modules.

**Continue in the Scene:** A compact Scenario card shows the name, purpose, and one **Continue setup** action. A fuller detail view can show existing Models, Characters, and Sensors as a checklist with a specific next action for each gap. A readiness label must describe exactly what was checked; it must never imply that the Scene interaction was tested.

**Present or share:** Only after a Scenario has an intentional presentation state should the UI offer a participant-facing overview or share link. The overview should say what visitors can do, what can be observed, and what counts as success. A saved definition alone is not a runnable or shareable experience.

## Implementation stages

| Stage | User-facing result | Implementation boundary | Acceptance |
| --- | --- | --- | --- |
| 1. Find and save (v0.22.8 candidate) | Create from Project or Scene with Project preselected; see the saved definition in Admin and Scene. | Use the existing Scenario table/API and assigned-module check. Keep Scene guidance temporary and the card read-only. | Project → form → save and Scene → form → save work; unowned or malformed Project IDs never preselect; missing module has a useful route; no Scene objects or sensors are created. |
| 2. Choose a purpose | Skippable outcome gallery and clearer first-run empty state lead into the same save form. | Start with presentation/configuration in the client. If a chosen purpose must persist, propose and approve its data contract before writing schema or API code. No implicit asset creation. | Every card explains its outcome and requirements; start-from-scratch works; keyboard/mobile use is practical; saved fields remain truthful. |
| 3. Guided continuation | After save, the User sees a Scenario detail view with current Project inventory and one next action. | Reuse owner-scoped Project asset data and existing pure Soccer/Farming checks where appropriate. Keep inventory observations distinct from saved Scenario settings. No new physics or FarmBot commands. | Empty, partial, and populated Projects show accurate actions; missing assets link to the correct Project workspace; a checklist does not claim runtime success. |
| 4. Scenario-specific setup | The User deliberately selects which assets, Sensor Group, and behaviors belong to this Scenario, and can resume that setup later. | Requires a separately reviewed ownership/persistence design for Scenario-to-Project-instance references, stale/deleted assets, and revisions. Any database schema change is an explicit approval gate. Preserve stable marker identity, Project scope, persistent Canvas/Rapier world, and existing Character paths. | Saved choices reload accurately; cross-Project references are rejected; removed assets become actionable gaps; changing one Scenario does not mutate another or the reusable source Model. |
| 5. Run and present | A participant-facing entry point explains the activity and reports observed outcomes. | Define runtime state, observation provenance, and share/access policy before implementation. Keep physical FarmBot operation and MQTT outside this scope unless separately approved. | “Ready,” “running,” and “complete” are backed by actual behavior; permissions and share links are tested; a presentation cannot silently edit the Project. |

Each stage is a reviewable checkpoint. Release/version names after v0.22.8 are intentionally unassigned. The next stage should be selected after observing the previous stage in a browser with a Project that has no ThreeD module, one with a module but few assets, and one with a working Soccer or Farming setup.

## Product and validation decisions

- Use **Scenario outline** or **saved definition** until Scenario-specific assignments and runtime exist. Label temporary guidance as temporary. Reserve **Ready** for an explicitly defined check and **Playable** for verified interaction.
- Measure whether Users reach the first save, where they leave the flow, whether they return to continue, and which missing-asset actions they use. Do not add telemetry or collect participant data without a separate privacy and instrumentation review.
- Keep the Admin list for management; let Project and Scene surfaces lead the creation journey. A Scene card should remain small enough to avoid covering the 3D work area, with an accessible route to detail.
- For each implementation stage: inspect the current contract and affected files, define its narrow acceptance, run the relevant Scenario and Project validation tasks plus TypeScript, then run the repository build gate for release preparation. Browser-check navigation, mobile layout, ownership, and Scene behavior. Document observed limits before any production handoff.
