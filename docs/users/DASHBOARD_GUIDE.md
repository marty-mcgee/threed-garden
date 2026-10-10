# Dashboard Guide

Current production: **[v0.24.0-centaur — ThreeD Designs: Workspace tools and state](../releases/v0.24.0-centaur.md)**, Developer-confirmed October 10, 2026. Package/root lockfile remain `0.24.0-centaur`. Includes canvas-local tools, staged JSON import, Project workspace snapshot support and compact colored Properties headers. Authenticated Save/reopen, post-deployment verification and exact deployed SHA remain unconfirmed. This records release confirmation only; no Git write or deployment is authorized. Earlier checkpoint statements below are historical.

The Dashboard at `/dashboard` presents project-scoped Multimedia, ThreeD Garden, and Traffic data. Choose a project before evaluating its assets.

ThreeD visualization is centered on `/dashboard/scene`; the former `/dashboard/threed` entry redirects there. ThreeD record creation and editing belong in `/admin/threed`, rather than duplicate Dashboard CRUD pages.

Multimedia uses one Dashboard page at `/dashboard/multimedia`, combining the album library, track lists, and player. Album, Track, Media, Link, and Speech management belongs in `/admin/multimedia`.

Traffic uses `/dashboard/traffic` as its combined map and list overview. Its compact source buttons show or hide CHP Incidents, CHP Historical, Caltrans, CalFire, and Bay Area 511.org records without leaving the page. The incident list appears below the map; selecting a list record focuses its map marker, while selecting a marker highlights and reveals its list record. Each provider is loaded independently, so an unavailable source is reported without hiding data returned by the other sources. The provider-specific Dashboard pages remain available for focused review.

On the Dashboard Map, the compact Project name control at the upper left expands to show item
counts, update freshness, the Project selector, and the Admin Details link.

Expected behavior:

- Only modules enabled for the project are available.
- Only active assets assigned to the project are loaded.
- User-owned data, including Multimedia albums, is not exposed to other users.
- ThreeD markers are generated at runtime from the project's available assets.

The Dashboard is primarily a visualization surface. Authenticated ThreeD world actions are a deliberate exception: supported actions persist their result only after the associated one-shot animation completes.

For character movement and world-action testing, see [ThreeD controls](THREED_CONTROLS.md).

## ThreeD Design beta

In the released [v0.24.0-beta checkpoint](../releases/v0.24.0-beta.md), open an existing Project at `/dashboard/scene` and choose **Design** in the Project toolbar. This edits architectural content in that Project's Scene; switching between 3D, 2D, Combined and Design retains the same Project.

The accepted layout has Project Assets above Design Properties on the left and the 3D Scene above the 2D Plan on the right. Open Assets using its existing toolbar control. Drag the horizontal divider to resize the rows; Properties scrolls internally. In the prepared centaur checkpoint, Drawing/Fit/Frame/Reset icons sit inside the upper-left Plan, clear of its rulers; Undo/Redo/import/export sit beside the existing Project Save on the right. Hover or focus an icon for its Tooltip. No additional Plan header or separate Design Save is needed.

Draw connected walls, close a floor, add hosted doors/windows, manage named levels and create Flat/Shed/Gable roofs with cutouts/skylights. Select architectural geometry in either view to show its supported properties. Length inputs use inches; X/Z rulers show feet. Position, dimensions, elevation, rotation and geometry flips appear only where applicable; drawing defaults are separate from selected-object settings. Invalid host/opening edits are rejected together and Undo/Redo preserves history.

Use Pan, middle-drag or Alt-drag; wheel zoom anchors to the pointer. Fit Plan frames the active level, Zoom to Selection uses the selected geometry, and Reset View restores the original Plan view. Endpoint/grid snapping, Shift axis constraints, Escape cancellation, Delete/Backspace and Undo/Redo shortcuts are supported; text inputs retain their normal editing keys.

Export JSON for architectural portability. Before Import, explicitly choose **Merge architectural content** or **Replace architectural content only**. Imports validate first and assign fresh IDs; replacement affects architecture only, preserving unrelated Models and Scene content. Imported edits use Project Save.

Import JSON opens a dialog: choose a file, select merge or architecture-only replacement, review validation and press Import. Cancel leaves the Project unchanged. Compact Properties sections have colored icons and help tooltips. Project Save captures Design preferences, supported active DetailsCard references and camera settings alongside architecture. Design preferences/sections mark the draft dirty; camera/inspector-only changes require explicit Save without independently changing that badge.

**Persistence verification limit:** the Developer accepted the layout, and automated mocked Save/load checks passed. Real authenticated architecture Save/reload remains unverified after an earlier disappearing-content report. Do not rely solely on a Save success message. For acceptance, draw a room/floor/door beside an existing Model, Save, reload, and confirm both remain and the room is still editable with no unsaved warning. No new schema script is needed. See [storage/source details and limitations](../developers/THREED_DESIGNS.md).

In v0.18.1b, an active FarmBot assigned to the selected Project appears as a runtime ThreeD marker. Its DetailsCard can show the authenticated read-only MQTT connection state, freshness, recent status/message times, device position, and token expiry. The same marker can be used as an animation-only action target. Dashboard status does not expose credentials, broker/session identities, event history, worker controls, MQTT publishing, or physical FarmBot operation.
