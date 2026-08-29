# ThreeD Controls

Open `/dashboard/map`, choose a project, and select a ThreeD marker to open its Details Card.

## Dashboard workspace header

- Select the Project name to view status, save the complete Project, change Projects, or open its Admin page.
- Use the view buttons to switch between Combined, 2D, and 3D modes.
- In 3D or Combined mode, select **Add to Scene** to open the existing Model, Character, FarmBot, Bed, or Planting placement workflow.
- In 2D-only mode, **Add Model** retains the Map-supported Model placement workflow.
- While a marker is awaiting placement or a Model is awaiting repositioning, the header shows the active operation. Select its X button to cancel that complete Scene operation.
- Use the Save icon for quick access to the same **Save ThreeD Project** transaction available in the Project menu. Filter and Refresh remain separate header actions.

The Scene **Controls** menu remains responsible for camera presentation, Layers, environment, legend, grid, gizmo, and Physics Debug. The Details Card remains responsible for the selected marker's actions and editing.

## Characters

- Autonomous `GardenCharacter` characters use their configured NPC movement behavior, which may include wandering, patrol, circle, follow, teleport, or stationary behavior.
- Movable `EcctrlCharacter` characters expose **Take Control** and **Release Control**.
- While controlling a character, use `WASD` to move. The configured controller also supports running and jumping.
- Idle, walk, run, and task animations use the configured semantic Animation Action Mapping and external FBX clips.

## Targeted world actions

Select a valid planting target and choose a supported action from the character's Details Card. Water and Pick Fruit run as one-shot animations. Persistence occurs only after animation completion; a success toast confirms the saved result.

Every rendered ThreeD Marker can be selected with **Use as Action Target**. This includes Plantings, Beds, Characters, FarmBots, and Models. The current target keeps a green pulse after another marker is selected. Beds, Characters, FarmBots, and Models expose Point, Point Gesture, and Talk; Plantings also expose their supported farming and harvesting actions.

Selection and action targeting are separate state. Releasing character control must not silently execute an action.

If an animation runs but persistence fails, record the toast/console error, character, project, and target before retrying.

## FarmBot action targeting

Select an assigned FarmBot marker and choose **Use as Action Target**. The marker receives the persistent green target pulse, and the character Details Card offers **Point**, **Point Gesture**, and **Talk** under FarmBot Interaction.

These actions animate the character only. They do not call the ThreeD World Action persistence route, connect to MQTT, change a peripheral, or operate the physical FarmBot. Use **Focus Target** to return the camera to it or **Clear Target** to restore the character's full action palette.

During the Phase 5 simulation, use a movable EcctrlCharacter and approach the FarmBot with WASD. While the FarmBot remains the action target, `W` moves toward it, `S` moves away, and `A`/`D` strafe relative to that path regardless of camera mode, orbit, perspective, or zoom. Clearing the target restores ordinary camera-relative WASD. The DetailsCard reports the current distance and enables FarmBot interaction buttons only after the character enters interaction range. GardenCharacter remains autonomous and does not automatically approach a FarmBot target.
