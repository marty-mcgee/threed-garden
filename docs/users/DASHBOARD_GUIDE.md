# Dashboard Guide

Dashboard helps you find available Projects and open their workspaces. **Learn ThreeD** at `/learn` offers guided tasks; [Getting Started](GETTING_STARTED.md) covers your first Project.

## Open or create a Project

At `/dashboard`, use **Create Project** to start from a template, or open an existing Project. The Project list is ordered newest-created first, not by recent activity.

The ThreeD workspace is `/dashboard/scene`. Use **Select Project** when no Project is open, or the current Project name to open its menu. That menu includes **Choose Project**, **New Project**, **Save ThreeD Project**, **Project Assets**, **Project Tour** and **Project Settings & Admin**.

Sign in and create your own Project to edit and save. Other people's public Projects are for authorized exploration. Private records and assets retain their ownership checks.

## Find your way around

| Control | Purpose |
| --- | --- |
| **3D, Design, 2D, Combined** | Switch views of the same Project. Design includes the editable architectural plan; 2D is the geographic Map. |
| **Assets** | Open Project Assets to select instances already in this Project. |
| **Add** | Place Shapes, Models, Characters, FarmBots, Beds or Plantings using their available workflows. In 2D-only mode, use **Add Model** for Map placement. |
| **Setup → Project Tour** | Review initial Project guidance. |
| **Setup → Scenarios / Simulations** | Open plan guidance or supported Action runs. |
| **Environment** | Adjust Scene presentation, Ground Map, camera and Layers. |
| **Weather** | View the Project's Weather overlay. |
| **Save** | Save the complete supported ThreeD Project snapshot. |

Hover or focus an icon to read its tooltip. An active placement/repositioning operation appears in the header; its X cancels that operation. **Setup → Reset Overlay Positions** restores overlay placement when panels are difficult to find.

Modules must be enabled for the Project, and assets must meet their module's activity, assignment and access requirements. An Active Library record does not appear in every Project automatically.

<a id="threed-design-beta"></a>

## Draw and edit in Design

1. Open your Project and choose **Design**. Project Assets and Design Properties occupy the left side; the Scene is above the plan on the right. Drag the horizontal divider to resize the rows.
2. Use the tools at the **upper-right inside the 2D canvas**. **Wall** places connected wall segments; **Floor** completes a polygon after at least three corners. Finish Floor, Enter or the first corner finishes it; Escape cancels the draft.
3. Place **Door** or **Window** on a wall with enough space. **Roof** supports Flat, Shed and Gable forms; **Skylight** and **Roof Cutout** place supported openings on a host roof.
4. Select an architectural object in either view or under **Project Assets → Architecture**, then edit its supported **Design Properties**. Drawing defaults affect new geometry; selected-object Properties edit existing geometry.
5. Choose **Design settings → Project measurement units**. Imperial uses inch inputs and foot rulers; Metric uses centimetre inputs and metre rulers. Rotation uses degrees. Changing units does not resize objects.
6. Use **Undo** or **Redo** to review an edit, then **Save ThreeD Project**.

Named levels control architectural elevation and visibility. Position, dimensions, rotation and flips appear only where supported; invalid host/opening changes are rejected together. Architecture remains part of the Project, with no separate Design Save.

Drag blank plan space to pan without changing tools. Pan, Alt-drag and middle-drag also work over objects; wheel zoom follows the pointer. **Fit Plan**, **Zoom to Selection** and **Reset View** help recover your view. See [ThreeD controls](THREED_CONTROLS.md#2d-design-tools-and-navigation) for shortcuts.

## Place and inspect Models

Choose **Add → Models** to open the **ThreeD Model Library**. Filter by collection, readiness or name. **Inspect** opens a preview; **Place** adds an instance to the Project. Follow its placement controls, or use **Place at Coordinates** when available.

Use **Project Assets** to select an existing instance. Its **DetailsCard** offers the supported placement, object/environment, collision, Sensor and Model information controls. Help icons explain each section. Native architectural objects use **Design Properties** instead.

**No collection** and **No thumbnail** describe Library metadata, not missing Scene objects. **Ready** means required setup records are present; actual file loading and the preview still determine whether geometry and materials display. OBJ materials can use solid colors from an MTL file without image Texture assignments.

Manage reusable Model Files, required dependencies, Materials and preview images in Admin. Model **Top View Image** provides the plan representation; a Library thumbnail serves a different purpose. See the [Admin guide](ADMIN_GUIDE.md) and [Model administration details](../developers/THREED_MODEL_ADMIN.md#model-editor-layout).

## Save and reopen

Choose **Save ThreeD Project** in the Project menu or the Save icon at the right of the toolbar. A green ring and yellow dot indicate unsaved workspace changes. Wait for **ThreeD Project saved** before leaving.

Save retains supported Scene content, architecture and workspace preferences together. Camera or inspector changes can be captured by explicit Save without independently changing the unsaved badge. Edits made while a Save is pending may still need another Save.

If saving fails, keep the page open and read the error before retrying. Reopen the same Project and inspect your change: a saved architectural object should remain editable. Architectural Export JSON can preserve that part of your work, but is not a complete Project backup.

## Import or export architectural content

**Export JSON** downloads supported editable architecture. **Import JSON** opens a dialog that validates the file before changing the Project:

1. Select the Design JSON or supported legacy plan.
2. Choose **Merge architectural content** or **Replace architectural content only**.
3. Review converted counts, validation messages and any omitted content. If shown, acknowledge **Import supported architecture only**.
4. Select **Import**, inspect the result and **Save ThreeD Project**.

Merge adds architecture with fresh IDs; replacement changes architecture only and retains unrelated Models and Scene content. Cancel and invalid files leave existing content unchanged. Import is undoable.

A legacy plan import does not restore catalog Models, their assets or every old drawing feature. Review its omission list rather than assuming a full conversion. See [Design storage and import details](../developers/THREED_DESIGNS.md) and [architecture capability boundaries](../plans/design-architecture-capabilities.md).

## Characters, Scenarios and Simulations

Movable Characters expose **Take Control** and **Release Control** in their DetailsCard. Use the [Character controls](THREED_CONTROLS.md#characters) guide for movement, compatible Animation assignments and supported target interactions.

A **Scenario** is a plan: **Setup → Scenarios → Open Scenario** displays setup guidance. A **Simulation** executes supported Actions and collects Results: open **Setup → Simulations**, choose a saved definition and use **Run Simulation**. A Scenario is not required.

The current Scene runner supports Run to target ball and Kick ball with one Character and one ball. Owner runs save Results; public visitor runs remain local. **Retry result save** saves the same attempt without rerunning Actions. Read the [Scenario guide](../help/threed-scenarios.md) and [Simulation guide](../help/threed-simulations.md) before preparing a run.

## Ground Maps and FarmBots

Use **Environment → Ground Map · Edit settings** to upload and align a flat reference image, then Save Project. It does not generate terrain or buildings. [Ground Map instructions](THREED_GROUND_MAPS.md) explain image limits, alignment and attribution.

An assigned FarmBot's DetailsCard can display **Live FarmBot State**, including connection state, observation times and device position when available. FarmBot target actions animate a Character only. These views do not operate physical equipment or publish commands.

## Other Dashboard modules

**Multimedia** at `/dashboard/multimedia` combines eligible public Albums, Tracks and playback. Available Media, Links and Lyrics follow their saved relationships and visibility. Manage your records in **Admin → Multimedia**.

**Traffic** at `/dashboard/traffic` combines a map and list. Source controls show or hide provider records. Selecting a list record focuses its marker; selecting a marker reveals its list record. Providers load independently, so one unavailable source does not hide the others.

## When something is missing

- **An object:** clear Project Assets search, check its module/assignment and activity, then inspect Layers. For architecture, check the active level and use Locate or Fit Plan.
- **A Model's appearance:** inspect loading errors and Required files in Admin; placing another copy does not repair a missing dependency.
- **A Character Action:** check the active Action Slot, assignment, compatible rig and loaded clip; Take Control does not assign animations.
- **A Simulation:** save an active supported definition with valid Project participants, then Refresh Simulations.
- **Permission to save:** confirm you are signed in and own the Project.

Release history and verification evidence belong in [release records](../releases/README.md). The previous Dashboard guide is preserved in [documentation history](../releases/history/2026-10-27/README.md).
