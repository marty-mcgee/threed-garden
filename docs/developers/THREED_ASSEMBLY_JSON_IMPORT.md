# JSON to ThreeD Models and Assembly Groups

**Admin > ThreeD > Assembly Groups > Add Assembly Group > Import JSON** reads a
portable geometry document. Local review converts each named part into a reusable
GLB Model and previews the complete arrangement. **Create Models and Assembly**
uses the existing authenticated Model upload/create and Assembly save paths.

Choose a JSON file, or select one of the three bundled examples and choose **Load
example**. Choose source units, review the preview, then create the Models and
Assembly. The saved Assembly opens in the existing visual editor and can be placed
through **Project > Add > Assembly Group**.

## Examples converted from the supplied JSCAD designs

| JSON file | Models | Triangles |
| --- | ---: | ---: |
| [Fortunate Cabin](../../public/examples/assembly-groups/fortunate-cabin-v001.json) | 8 | 528 |
| [McGee Home Garage](../../public/examples/assembly-groups/mcgee-home-garage-v001.json) | 2 | 156 |
| [McGee Home Garden](../../public/examples/assembly-groups/mcgee-home-garden-v001.json) | 10 | 1,332 |

These geometry documents were prepared from the Developer's three MIT-licensed
OpenJSCAD sources using their matching local v1 engine. Active named inputs to the
final `union()` become Model groups. Empty and commented-out groups are omitted.
Original polygon colors and opacity are retained. The groups keep their own
surfaces, including overlaps/internal faces that a final Boolean union would
remove; separate editable Models require retaining those source groups.

The original `main()` transforms are retained: Cabin scales by `1/8` and translates
by `[-30, -30, 0]`; Garage and Garden scale by `1/12`. All three use Z up.
Their JSON declares `units: null`, requiring an explicit choice for the resulting
scaled coordinates. Garage and Garden convert inch-based coordinates to feet in
`main()`; choose **Feet** for their full-size layouts. Cabin retains its authored
1:8 scale; choose the units intended for that scaled output. No auto-rescaling to
full size occurs.

The local conversion checked that each JSON's combined bounds match its original
script's `main()` union result. This checks dimensions and placement bounds, not
identical Boolean surface topology. Source/output SHA-256 receipts and the
one-time conversion tool are retained in ignored
`reference/imports/jscad-assembly-2026-11-08/`.

JSCAD source is used to prepare these example JSON documents. The App imports
geometry data and does not evaluate the source scripts.

## Template and contract

Start with the complete, importable [two-Model template](../../public/examples/assembly-groups/template.json).
It contains two 12-inch boxes, with the second translated 24 inches along X.

```json
{
  "format": "threed-assembly",
  "formatVersion": 1,
  "name": "My Assembly",
  "units": "inches",
  "upAxis": "z",
  "parts": [
    {
      "label": "My Model",
      "transform": {
        "position": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": 1
      },
      "meshes": [
        {
          "positions": [0, 0, 0, 12, 0, 0, 0, 12, 0],
          "color": [0.2, 0.6, 0.8, 1]
        }
      ]
    }
  ]
}
```

- Each part becomes one Model and one Assembly component. A part can contain
  several colored meshes. The snippet above is one triangle; use the complete
  template for solid boxes.
- `positions` contains unindexed triangles: nine XYZ numbers per triangle, in
  winding order. `color` contains RGBA numbers from 0 through 1.
- Transforms use source-unit translations, XYZ Euler rotations in radians and a
  positive uniform scale. Source transforms and the Y/Z up-axis conversion are
  baked once. GLBs are centered on X/Z and grounded locally; Assembly offsets
  reconstruct the source arrangement, including original negative elevations.
- Units are `inches`, `feet`, `millimetres`, `centimetres`, `metres`, or `null` to
  require a review-time choice. The existing 0.3048 metres per Scene unit
  calibration is retained.
- Limits: 32 MiB JSON, 100 parts, 1,000 meshes total, 100 meshes per part and
  250,000 triangles total. Coordinates must be finite and bounded; invalid,
  collapsed or incomplete triangles reject before any upload. Unknown fields,
  unsupported versions, scripts, URLs, ownership claims and saved Model IDs are
  rejected.

**Import JSON** creates geometry-bearing Models. **Import Draft** remains the
existing format referencing Models already saved in the App; the two formats have
separate validation and controls.

## Save and recovery

Review creates temporary GLBs/object URLs locally. Save requires the preview to
report readiness. Changing units clears that readiness and regenerates geometry.
The import dialog has a viewport-bounded, non-scrolling layout. Source controls,
settings, Models, preview, progress and actions remain visible during import.
The preview fits the remaining height. Model names use ten rows with page buttons
for larger imports instead of a scrolling list. Duplicate preview text,
measurements and empty recovery/message panels are removed. Source guidance is
in the header help tooltip; errors and recovery controls share the fixed progress
area. Controls disable in place without adding or removing sections.
The importer uses fresh owner-bound identities and retains completed uploads and
Model IDs while retrying the same import. Pause completes the current Model.
An uncertain create response requires matching its saved Model through the
existing exact owner/File/transform verification; it is never blindly recreated.
An uncertain Assembly save reconciles its known UUID before another save attempt.
Download the import receipt before closing partially completed work.

Generated GLBs up to 4 MiB use the shared Model uploader's existing authenticated
file-form endpoint. The original File bytes reach the server's inspection and
storage path through FormData, bound to the same signed owner/destination/size.
Both transports retain stored-byte completion verification. Larger files up to
32 MiB retain direct upload. Forced SDK multipart creation is avoided.
The Developer's browser SDK transfer produced an actually empty stored object;
completion correctly rejected it. Small-file form transfer avoids that observed
path without accepting an empty Model.

The implementation adds no schema, dependency or live migration. Persistence
validation is mocked. Actual upload, rendered appearance, Save/reopen and Project
placement acceptance belong to the Developer's App verification.
