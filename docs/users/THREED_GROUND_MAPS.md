# ThreeD Ground Maps

ThreeD Ground Maps let a Project owner use a PNG, JPG or WebP map screenshot as the visible flat ground beneath a ThreeD Scene. This is useful for placing Models, Characters, Beds, Plantings and FarmBots against an existing property, site or map reference.

## Open Ground Map controls

1. Open `/dashboard/scene` and choose a Project with an active ThreeD module.
2. In 3D, Design or Combined view, select **Environment** in the Project Toolbar.
3. Select **Ground Map · Edit settings** to open its inspector.

**Setup → Project Tour** is the separate setup and Help workflow. **Environment** contains the live Scene presentation controls.

## Upload an image

Before uploading, enter the image provider in **Source** and any required credit in **Attribution**. These values are stored with the upload. The attribution is displayed over the Scene while that uploaded image is visible. The User remains responsible for the source provider's screenshot, attribution and reuse terms.

Select **Upload Ground Map Image**, then choose a PNG, JPG or static WebP file. The maximum file size is 16 MB and the decoded image may contain at most 16,777,216 pixels. A successful upload becomes the Project's current Ground Map asset and preserves its original aspect ratio for the initial Scene dimensions.

The upload is private to the authenticated Project owner. Replacing an image registers the replacement before removing the previous Blob. Removing the Ground Map image returns the Project to Procedural ground.

To change saved Source or Attribution, enter the corrected values before **Replace Ground Map Image**. Typing them after an upload and choosing Project Save does not update the image's saved credit.

## Align the Ground Map

Choose **Uploaded Image** under **Ground Visual**, then adjust:

- **Width (Scene units)** and **Length (Scene units)** for the image footprint.
- **Center X (Scene units)** and **Center Z (Scene units)** to move the image beneath existing Project assets.
- **Elevation (Scene units)** to avoid visual overlap with another ground surface.
- **Rotation (degrees)** to align image north and Project axes.
- **Opacity** to compare the image with ThreeD objects while aligning it.

**Align North-Up + Center** centers the image on the current Project origin and applies the Project's established geographic heading. Numeric fields remain authoritative for fine adjustment.

These controls explicitly use Scene units. The Imperial/Metric preference for Design inputs does not change the Ground Map's physical calibration or move existing objects.

Use **Procedural** to show the normal generated ground or **Hidden** to hide the ground visual. These display modes retain a fixed flat physics and placement surface so Characters and placement tools continue to work.

## Save and restore

Select the far-right Save icon in the Project Toolbar or **Save ThreeD Project** in the Project menu. Explicit Project Save stores the selected Ground Map asset and its center, dimensions, height, rotation, opacity and visual mode. Reloading the Project restores those values.

Uploading or replacing an image registers the asset, but alignment changes are Project view state and require **Save ThreeD Project**.

## Current boundaries

- The image is a flat color texture. It does not create terrain height, buildings, roads or collision geometry from pixels.
- Ground Map physics is a flat fixed plane aligned with the visible image.
- Existing Runtime Marker coordinates do not move when the image is aligned.
- Environment Models can coexist with an uploaded Ground Map.
- Live provider tiles, automatic map downloads, two-point Leaflet calibration, photogrammetry and image-to-mesh conversion are outside this release.

Related references:

- [ThreeD Controls](THREED_CONTROLS.md)
- [Dashboard Guide](DASHBOARD_GUIDE.md)
- [ThreeD Marker architecture](../developers/THREED_MARKERS.md)
- [v0.19.42 development plan](../plans/v0.19.42.md)
