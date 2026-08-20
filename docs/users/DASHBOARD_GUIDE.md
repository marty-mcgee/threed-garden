# Dashboard Guide

The Dashboard at `/dashboard` presents project-scoped Music, ThreeD Garden, and Traffic data. Choose a project before evaluating its assets.

Expected behavior:

- Only modules enabled for the project are available.
- Only active assets assigned to the project are loaded.
- User-owned data, including Music albums, is not exposed to other users.
- ThreeD markers are generated at runtime from the project's available assets.

The Dashboard is primarily a visualization surface. Authenticated ThreeD world actions are a deliberate exception: supported actions persist their result only after the associated one-shot animation completes.

For character movement and world-action testing, see [ThreeD controls](THREED_CONTROLS.md).

In v0.18.1a, an active FarmBot assigned to the selected Project appears as a runtime ThreeD marker. Its DetailsCard can show the authenticated read-only MQTT connection state, freshness, recent status/message times, device position, and token expiry. The same marker can be used as an animation-only action target. Dashboard status does not expose credentials, broker/session identities, event history, worker controls, MQTT publishing, or physical FarmBot operation.
