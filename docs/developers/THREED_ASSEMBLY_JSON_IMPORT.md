# JSON to ThreeD Models and Assembly Groups

**Admin > ThreeD > Assembly Groups > Add Assembly Group > Import JSON** reads a
portable geometry document. Local review converts each named part into a reusable
GLB Model and previews the complete arrangement. **Create Models and Assembly**
uses the existing authenticated Model upload/create and Assembly save paths.

Choose a JSON file, or select a bundled example and choose **Load
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

## Slices examples

The twelve examples from the supplied OpenJSCAD slices folder use their authored
default parameters. Each returns one finished solid and therefore imports as one
Model in an Assembly Group. Source geometry, Z-up orientation and polygon colors
are preserved; units remain an explicit choice. These are fixed geometry exports,
not parametric editors. Source author: Eduard Bespalov, MIT License.

| JSON file | Models | Triangles |
| --- | ---: | ---: |
| [Slices: Double Screw](../../public/examples/assembly-groups/slices-double-screw.json) | 1 | 1,724 |
| [Slices: Four to Three - Rounded](../../public/examples/assembly-groups/slices-four2three-round.json) | 1 | 2,516 |
| [Slices: Four to Three](../../public/examples/assembly-groups/slices-four2three.json) | 1 | 274 |
| [Slices: Jar barrel](../../public/examples/assembly-groups/slices-jar-barrel.json) | 1 | 4,928 |
| [Slices: Jar](../../public/examples/assembly-groups/slices-jar.json) | 1 | 4,928 |
| [Slices: Non Affine Transformation](../../public/examples/assembly-groups/slices-non-aff.json) | 1 | 96 |
| [Slices: Rose Curve](../../public/examples/assembly-groups/slices-rose.json) | 1 | 3,000 |
| [Slices: Screw](../../public/examples/assembly-groups/slices-screw.json) | 1 | 1,724 |
| [Slices: Slices (single screw evolution)](../../public/examples/assembly-groups/slices-slices.json) | 1 | 500 |
| [Slices: Spring](../../public/examples/assembly-groups/slices-spring.json) | 1 | 2,156 |
| [Slices: Three to Four](../../public/examples/assembly-groups/slices-three2four.json) | 1 | 274 |
| [Slices: Torus - Multicolor](../../public/examples/assembly-groups/slices-tor.json) | 1 | 864 |

Conversion receipts retain source/output hashes, default parameters and matched
source bounds under ignored reference/imports/jscad-assembly-2026-11-08.

## Remaining OpenJSCAD library examples

Forty additional examples are selectable as **JSCAD:** entries. Root examples
and the recursive include/Platonics entry points were inspected; include-only
helpers and the already-converted juice/slices folders are not duplicated.
Returned solid arrays retain independent Models and placement; a single returned
solid remains one Model. Defaults use authored default/initial/choice values.
Randomized examples use a fixed seed (314159), giving a reproducible snapshot.
Units remain explicit; source authors and licenses appear in LICENSE.txt.

| Example | Models | Triangles |
| --- | ---: | ---: |
| [Axis Coupler](../../public/examples/assembly-groups/jscad-axis-coupler.json) | 1 | 870 |
| [Balloons](../../public/examples/assembly-groups/jscad-balloons.json) | 1 | 7,879 |
| [Benchmark SCAD Compatibility](../../public/examples/assembly-groups/jscad-benchmark.json) | 1 | 960 |
| [Benchmark](../../public/examples/assembly-groups/jscad-benchmark_csg.json) | 1 | 12 |
| [Bunch of Cubes](../../public/examples/assembly-groups/jscad-bunch-cubes.json) | 100 | 1,200 |
| [Celtic Knot Ring](../../public/examples/assembly-groups/jscad-celtic-knot-ring.json) | 1 | 43,568 |
| [Center](../../public/examples/assembly-groups/jscad-center.json) | 24 | 8,886 |
| [Colors](../../public/examples/assembly-groups/jscad-colors.json) | 18 | 2,344 |
| [Dodecahedron](../../public/examples/assembly-groups/jscad-dodecahedron.json) | 1 | 36 |
| [Example 001](../../public/examples/assembly-groups/jscad-example001.json) | 1 | 1,360 |
| [Example 002](../../public/examples/assembly-groups/jscad-example002.json) | 1 | 304 |
| [Example 003](../../public/examples/assembly-groups/jscad-example003.json) | 1 | 192 |
| [Example 004](../../public/examples/assembly-groups/jscad-example004.json) | 1 | 776 |
| [Example 005](../../public/examples/assembly-groups/jscad-example005.json) | 1 | 1,420 |
| [Expand](../../public/examples/assembly-groups/jscad-expand.json) | 1 | 764 |
| [Gear](../../public/examples/assembly-groups/jscad-gear.json) | 1 | 668 |
| [Grille](../../public/examples/assembly-groups/jscad-grille.json) | 1 | 3,728 |
| [Hull](../../public/examples/assembly-groups/jscad-hull.json) | 2 | 800 |
| [iPhone 4 Dock](../../public/examples/assembly-groups/jscad-iphone4-case.json) | 1 | 266 |
| [Lamp Shade](../../public/examples/assembly-groups/jscad-lamp-shade.json) | 1 | 5,378 |
| [Linear Extrude](../../public/examples/assembly-groups/jscad-linear_extrude.json) | 4 | 996 |
| [OpenJSCAD.org Logo](../../public/examples/assembly-groups/jscad-logo.json) | 1 | 1,404 |
| [Lookup](../../public/examples/assembly-groups/jscad-lookup.json) | 41 | 2,624 |
| [Name Plate](../../public/examples/assembly-groups/jscad-name_plate.json) | 1 | 4,950 |
| [Polyhedron](../../public/examples/assembly-groups/jscad-polyhedron.json) | 1 | 24 |
| [Primitives](../../public/examples/assembly-groups/jscad-primitives.json) | 12 | 4,640 |
| [Rectangular Extrude](../../public/examples/assembly-groups/jscad-rectangular_extrude.json) | 3 | 192 |
| [Rotate Extrude](../../public/examples/assembly-groups/jscad-rotate_extrude.json) | 9 | 2,936 |
| [Rounded Cube](../../public/examples/assembly-groups/jscad-rounded-cube.json) | 1 | 108 |
| [S Hook](../../public/examples/assembly-groups/jscad-s-hook.json) | 1 | 884 |
| [Servo Motor](../../public/examples/assembly-groups/jscad-servo.json) | 1 | 792 |
| [Simplex Vector Font](../../public/examples/assembly-groups/jscad-simplex.json) | 1 | 1,948 |
| [Sphere](../../public/examples/assembly-groups/jscad-sphere.json) | 8 | 4,884 |
| [Stepper Motor](../../public/examples/assembly-groups/jscad-stepper-motor.json) | 1 | 1,584 |
| [Vector Text Rendering](../../public/examples/assembly-groups/jscad-text.json) | 1 | 2,768 |
| [Torus()](../../public/examples/assembly-groups/jscad-torus.json) | 9 | 2,600 |
| [Transparency](../../public/examples/assembly-groups/jscad-transparency.json) | 10 | 1,048 |
| [Transparency 2](../../public/examples/assembly-groups/jscad-transparency2.json) | 2 | 1,924 |
| [Recursive Include Example](../../public/examples/assembly-groups/jscad-include-test-main.json) | 1 | 928 |
| [Platonics](../../public/examples/assembly-groups/jscad-platonics-main.json) | 5 | 80 |

Not bundled in this batch:

- `benchmark_cag.jscad`: output includes 2D CAG geometry; no arbitrary extrusion added.
- `chain_hull.jscad`: output includes 2D CAG geometry; no arbitrary extrusion added.
- `cnc-cutout.jscad`: output includes 2D CAG geometry; no arbitrary extrusion added.
- `globe.jscad`: Unsupported number of Models: 4989.
- `umbilical_torus.jscad`: source states CC BY-SA without version; attribution/license review needed before bundling.

The App's 100-component limit is unchanged. No 2D shapes are silently extruded,
no large array is truncated, and alternate parameter values are not substituted
for authored defaults. Conversion receipts preserve source/include hashes,
parameter values and matching source bounds. These offline results do not
establish App visual/save acceptance.

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
