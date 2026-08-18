# ThreeD Controls

Open `/dashboard/map`, choose a project, and select a ThreeD marker to open its Details Card.

## Characters

- Autonomous `GardenCharacter` characters wander according to their configured movement behavior.
- Movable `EcctrlCharacter` characters expose **Take Control** and **Release Control**.
- While controlling a character, use `WASD` to move. The configured controller also supports running and jumping.
- Idle, walk, run, and task animations use the configured semantic Animation Action Mapping and external FBX clips.

## Targeted world actions

Select a valid planting target and choose a supported action from the character's Details Card. Water and Pick Fruit run as one-shot animations. Persistence occurs only after animation completion; a success toast confirms the saved result.

Selection and action targeting are separate state. Releasing character control must not silently execute an action.

If an animation runs but persistence fails, record the toast/console error, character, project, and target before retrying.
