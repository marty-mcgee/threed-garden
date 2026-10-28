# ThreeD Controls

Open `/dashboard/scene`, choose a Project, and select a ThreeD marker to open its **DetailsCard**. Sign in and own the Project to edit and save its content. For a first session, start with [Getting Started](GETTING_STARTED.md).

## Dashboard workspace header

- Select the Project name to view status, save the complete Project, change Projects, or open its Admin page.
- Use the view buttons in their displayed order: **3D, Design, 2D, Combined**. Design contains the editable architectural plan; 2D is the geographic Map.
- Use **Setup → Project Tour** for guided Project setup and Help. The Project menu also opens the Tour.
- Use **Environment** for the environment preset, Ground Map, sunlight, ground plane, camera presentation, legend, grid, Physics Debug, gizmo, incidents, saved views, and Scene Layers.
- In 3D, Design or Combined mode, select **Add** to choose Shapes, Models, Characters, FarmBots, Beds or Plantings. In the Model Library, use **All Models** or a collection, then optionally narrow results by readiness or name. Collections describe reusable Library Models; Project Assets lists instances already placed in the Project. **Inspect** previews a reusable Model; **Place** adds another instance.
- In 2D-only mode, **Add Model** retains the Map-supported Model placement workflow.
- While a marker is awaiting placement or a Model is awaiting repositioning, the header shows the active operation. Select its X button to cancel that complete Scene operation.
- Use the far-right Save icon for quick access to the same **Save ThreeD Project** transaction available in the Project menu. Project Assets and individual Libraries provide their own scoped search and filtering, while Scene Layers control module visibility.
- Use **Setup → Scenarios** for plan guidance and **Setup → Simulations** for supported Action runs. Use **Setup → Reset Overlay Positions** when you need to restore panel placement.

When a nested Physics Sensor is selected in Project Assets, its focused inspector presents the parent asset, **Place it in the Scene** controls, detection and group settings, then precise geometry fields. **Save Sensor** appears after a changed form value; **Remove sensor** is an optional action at the bottom. See [Physics Sensors and Sensor Groups](../developers/THREED_PHYSICS_SENSORS.md) for the full workflow.

The toolbar separates Project guidance from live Scene presentation: **Project Tour** owns setup/Help and **Environment** owns Scene presentation. The **DetailsCard** remains responsible for the selected marker's actions and editing. See [ThreeD Ground Maps](THREED_GROUND_MAPS.md) for image-ground setup and alignment.

## 2D Design tools and navigation

In Design mode, the drawing toolbar is inside the upper-right of the 2D canvas, clear of the X/Z rulers. Groups are **Select, Pan | Wall, Floor, Roof | Door, Window | Skylight, Roof Cutout | Fit Plan, Zoom to Selection, Reset View**. Hover or focus a button for its tooltip.

Drag a blank area to pan with any tool; a normal click still selects, draws or places an opening. Panning retains the active tool, selected entity and unfinished drawing points. Select and Pan remain separate tools. Use Pan, Alt-drag or middle-drag to pan even when starting over an object. Wheel zoom stays anchored to the pointer; use Fit Plan or Zoom to Selection to frame content. Save Project uses the existing architecture and workspace snapshot.

Choose **Design settings → Project measurement units** for Imperial or Metric. Length inputs use inches or centimetres; X/Z rulers use feet or metres. Rotation uses degrees. This is a display/input preference, not a change to object size, Scene calibration or physics.

Floor and Roof drafts need at least three corners. Finish the draft with its Finish control, Enter or the first corner. Escape cancels unfinished drawing. Shift constrains drawing to X/Z axes. Delete/Backspace removes the selected architectural entity; Ctrl/Cmd-Z undoes, and Ctrl/Cmd-Shift-Z or Ctrl/Cmd-Y redoes. These shortcuts leave text-field editing alone. **Drawing defaults** affect new geometry; **Properties** edits the selected object.

## Characters

- Autonomous `GardenCharacter` characters use their configured NPC movement behavior, which may include wandering, patrol, circle, follow, teleport, or stationary behavior.
- Movable `EcctrlCharacter` characters expose **Take Control** and **Release Control**.
- While controlling a character, use `WASD` to move. The configured controller also supports running and jumping.
- Idle, walk, run, and task animations use the configured semantic Animation Action Mapping and external FBX clips.

### When Character actions are active

The DetailsCard reports **Animations · Loaded** when the Character runtime exposes loaded actions. This does not mean that every displayed Action Slot is available. An action becomes active only when all of these conditions are satisfied:

- The Action Slot is active in **Admin → ThreeD → Animation Slots**.
- The Character has a Character-level animation assignment, or its assigned Model provides an inherited animation default. A Character assignment takes precedence over its Model default.
- The assigned animation and clip are active and their source file loads successfully.
- The animation's authored track targets exist on the Character's skeleton. The App validates this binding; it does not automatically retarget an incompatible animation.
- The loaded runtime exposes the clip under the Action Slot's action key.

Importing an animation into the Library does not assign it to a Character. Use **Admin → ThreeD → Characters → Animations & Actions** to preview a clip against the Character, then assign it to an active Action Slot. **Take Control** enables Ecctrl movement; it does not activate animation assignments. Targeted world actions can additionally require Character control, a valid target, interaction range, and no interaction already running.

If the DetailsCard says **Loaded** but lists a category as **Inactive**, check whether its Action Slots match available loaded actions. Check the Character override, its Model defaults, the slot's active state, the animation record/file, and skeleton compatibility. Legacy bundled action fallbacks are limited to Models that have been explicitly verified; the current verified Farmer Female fallback is not automatically assumed compatible with Farmer Male or other rigs.

## Targeted world actions

Select a valid Planting target and choose a supported action from the Character's DetailsCard. Water and Pick Fruit run as one-shot animations. Their persistence occurs only after animation completion; read the completion or error feedback before retrying.

Every rendered ThreeD Marker can be selected with **Use as Action Target**. This includes Plantings, Beds, Characters, FarmBots, and Models. The current target keeps a green pulse after another marker is selected. Beds, Characters, FarmBots, and Models expose Point, Point Gesture, and Talk; Plantings also expose their supported farming and harvesting actions.

Selection and action targeting are separate state. Releasing character control must not silently execute an action.

If an animation runs but persistence fails, record the toast/console error, character, project, and target before retrying.

For a movable ball target, mapped foot-kick animations can move the ball on animated foot contact. The separate **Kick selected ball** control applies an assisted kick after its animation. Both require the supported Character/target, compatible mapping and range. A kick does not itself score a goal; a qualifying Sensor entry does. See [Scenarios](../help/threed-scenarios.md#soccer) and [Simulations](../help/threed-simulations.md) for setup and recorded runs.

## FarmBot action targeting

Select an assigned FarmBot marker and choose **Use as Action Target**. The marker receives the persistent green target pulse, and the Character's DetailsCard offers **Point**, **Point Gesture**, and **Talk** under FarmBot Interaction.

These actions animate the character only. They do not call the ThreeD World Action persistence route, connect to MQTT, change a peripheral, or operate the physical FarmBot. Use **Focus Target** to return the camera to it or **Clear Target** to restore the character's full action palette.

Use a movable EcctrlCharacter and approach the FarmBot with WASD. While the FarmBot remains the action target, `W` moves toward it, `S` moves away, and `A`/`D` strafe relative to that path regardless of camera mode, orbit, perspective, or zoom. Clearing the target restores ordinary camera-relative WASD. The DetailsCard reports the current distance and enables FarmBot interaction buttons only after the Character enters interaction range. GardenCharacter remains autonomous and does not automatically approach a FarmBot target.

**Live FarmBot State** separately shows recorded connection state, observation times and device position when available. Live, stale, disconnected and unavailable describe observation conditions; they do not prove equipment readiness or authorize physical commands.
