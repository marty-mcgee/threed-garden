# Dashboard Guide

The Dashboard at `/dashboard` presents project-scoped Music, ThreeD Garden, and Traffic data. Choose a project before evaluating its assets.

Expected behavior:

- Only modules enabled for the project are available.
- Only active assets assigned to the project are loaded.
- User-owned data, including Music albums, is not exposed to other users.
- ThreeD markers are generated at runtime from the project's available assets.

The Dashboard is primarily a visualization surface. Authenticated ThreeD world actions are a deliberate exception: supported actions persist their result only after the associated one-shot animation completes.

For character movement and world-action testing, see [ThreeD controls](THREED_CONTROLS.md).

In v0.18.0, an active FarmBot assigned to the selected Project appears as a runtime ThreeD marker. It can be selected and used as an animation-only action target. This does not connect to MQTT or operate the physical FarmBot.
