# Dashboard Guide

The Dashboard at `/dashboard` presents project-scoped Music, ThreeD Garden, and Traffic data. Choose a project before evaluating its assets.

ThreeD visualization is centered on `/dashboard/map`; the former `/dashboard/threed` entry redirects there. ThreeD record creation and editing belong in `/admin/threed`, rather than duplicate Dashboard CRUD pages.

Music uses one Dashboard page at `/dashboard/music`, combining the album library, track lists, and player. Album and Track creation or editing belongs in `/admin/music`.

Traffic uses `/dashboard/traffic` as its combined map and list overview. Its compact source buttons show or hide CHP Incidents, CHP Historical, Caltrans, CalFire, and Bay Area 511.org records without leaving the page. The incident list appears below the map; selecting a list record focuses its map marker, while selecting a marker highlights and reveals its list record. Each provider is loaded independently, so an unavailable source is reported without hiding data returned by the other sources. The provider-specific Dashboard pages remain available for focused review.

On the Dashboard Map, the compact Project name control at the upper left expands to show item
counts, update freshness, the Project selector, and the Admin Details link.

Expected behavior:

- Only modules enabled for the project are available.
- Only active assets assigned to the project are loaded.
- User-owned data, including Music albums, is not exposed to other users.
- ThreeD markers are generated at runtime from the project's available assets.

The Dashboard is primarily a visualization surface. Authenticated ThreeD world actions are a deliberate exception: supported actions persist their result only after the associated one-shot animation completes.

For character movement and world-action testing, see [ThreeD controls](THREED_CONTROLS.md).

In v0.18.1b, an active FarmBot assigned to the selected Project appears as a runtime ThreeD marker. Its DetailsCard can show the authenticated read-only MQTT connection state, freshness, recent status/message times, device position, and token expiry. The same marker can be used as an animation-only action target. Dashboard status does not expose credentials, broker/session identities, event history, worker controls, MQTT publishing, or physical FarmBot operation.
