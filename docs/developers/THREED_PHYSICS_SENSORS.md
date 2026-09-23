# Physics Sensors and Sensor Groups

A Physics Sensor Cuboid is an invisible detection volume attached to a Project Model, Bed, Planting or FarmBot. Its name is descriptive metadata. Names do not change detection or counting.

## Configure sensors

1. Select the owning asset in Project Assets. Its **Physics Sensors** section lists attached sensors. Select a nested sensor row to open its focused inspector without moving the camera.
2. Use **Add Sensor to [asset]** in the Project Assets footer (or **Add Sensor** in the parent card), then give the new sensor a useful name.
3. Choose **Trigger** for observation without a displayed count, or **Count Entries** for a counter.
4. Choose a detection filter:
   - **Movable balls** accepts the App's movable-ball Model bodies.
   - **Model bodies** accepts registered Model rigid bodies. This does not yet include Character bodies or external equipment readings.
5. Use **New Sensor Group** or the **Sensor Groups** list in the Project Assets footer. The group inspector provides naming and member navigation. Save the group, then choose it in each sensor’s settings. A group can include sensors attached to different owners in the same Project.
6. Place or move the cuboid in the Scene, or use **Transform Sensor · Mouse Handles** for Move XYZ, Rotate Y and Resize.
7. Use **Save Sensor** for form/membership changes or **Save Transform** for a transform draft. Group-name changes save separately and immediately.

Use the parent link to return to asset settings. **Zoom to Sensor** is explicit; ordinary inspector selection does not focus the camera. On narrow screens, the inspector overlays Project Assets; closing it reveals the list.

Numeric fields show at most three decimal places. Geometry keeps its existing precision until edited. Each dimension must be at least 0.05 Scene units.

**Resize** changes dimensions around the sensor center; it does not scale the owner. **Cancel** or Escape discards a transform draft. Invalid collections identify the sensor and field that must be corrected.

## Groups and counts

The Scene panel shows group names and each member's name/count. There is no two-member limit or special meaning assigned to names such as Home Goal and Away Goal.

One eligible body counts once on entry. It must leave before it can count again. Multiple colliders on one body do not count as multiple entries. Other sensor colliders are excluded.

**Reset Counts** clears current counts while preserving occupancy: an object already inside must exit and re-enter. Counts are session-local and reset on refresh or Project change. Sensor geometry, names, group membership and group names persist.

Renaming preserves identity and counters. Delete sensors through their owner's editor and save. To delete a group, first remove all sensor memberships and save those owners, then use **Delete Empty Group**.

## Existing Projects

Existing configured sensors retain their IDs, names and geometry through a read-only compatibility adapter. Previously configured counters appear in **Imported sensors**, which can be renamed. Saving a sensor writes neutral configuration. There are no automatic writes on loading a Project.

Older whole-Model sensor configurations remain supported as **Model Volume Sensor**. For multiple named sensors and selectable groups, use attached Physics Sensor Cuboids.

## Storage and validation

- Cuboids and membership: existing Project marker metadata, `physicsSensorCuboids`.
- Group IDs/names: existing Project metadata, `physicsSensorGroups`.
- Membership identity: Project marker ID plus sensor ID.
- No schema commands or new dependency are required.
- Group changes are owner-scoped. Group deletion and sensor membership saves lock the Project row; an assigned group cannot be deleted.
- Sensor events carry bounded structured sensor identity, rather than encoding IDs or names in event tags.

Run `npm run validate -- threed-sensors threed-physics-events threed-soccer-physics threed-runtime-markers` and `npm run typecheck`. The older named fixture covers compatibility; live Scene counting uses the generic sensor counter service. These checks do not replace browser or live persistence acceptance.

## Show or hide sensor counts

Use **Project Toolbar → Environment → Show Sensors** to open the right-side Physics Sensors panel. It starts hidden. Close it with its Close button or **Environment → Hide Sensors**. Counting continues while hidden; opening or closing this panel does not change physics-debug visibility or the Project Assets panel. Each Sensor Group can be folded independently.
