# ThreeD DXF inspection and import

## Authorized scope

Inspect the Developer-supplied DWG/DXF, produce a local drawing preview, establish
scale and select plan geometry before mapping it into existing ThreeD contracts.
The original files remain unchanged. No new schema, dependency or live import is
authorized by this inspection.

## November 9 inspection

`CDP Drawings-08-07-23 1 pg 1.dxf` is a 43,271,432-byte ASCII AC1021 file.
The source contains 154,238 top-level entities: 150,489 LINE, 252 LWPOLYLINE,
1,066 MTEXT, 1,683 SOLID, 91 INSERT, 8 CIRCLE and 649 ARC records. Three layers
are present (`0`, `-62`, `-4`). Blocks include named furniture, plumbing,
appliances and plants. No 3DSOLID/3DFACE or nonzero Z/thickness fields were found
in the inspected entities and block geometry. SOLID records are planar fills.

A local preview expands nested block transforms and bases, samples arcs and
polyline bulges, outlines planar solids and approximates text placement.
It produced 237,161 line segments and 1,069 labels with no unhandled entity
types. This is not a complete CAD-fidelity renderer: text formatting, fills,
line styles and plotting semantics are not reproduced.

Native Edge rendered the local HTML successfully outside the sandbox after
sandbox browser startup failed. Visual inspection shows two site drawings with
contours and a detailed house drawing in the right-hand region. Region buttons,
pan and zoom are available in the local HTML; interaction acceptance is pending.
No server was started and no App record was created.

The private source, local inspection helper, SHA-256 receipt, SVG, interactive
HTML and rendered PNG stay under ignored
`reference/imports/dxf-cdp-2026-11-09/`; they are not production source or public
documentation images. Source hash:
`22af2836dba7d2e5f4d22dbf7e514d522e37250ffca32c086f14305244be6bc3`.

## Calibration and next work

The header declares insertion units as inches. However, repeated blocks have
1:240 scale, and the site drawings contain a 516.5-foot boundary represented by
approximately 25.84 drawing units. These independently suggest a sheet scale near
one drawing inch to twenty feet. The Developer subsequently confirmed the house
detail and **1 inch = 20 feet** scale. Conversion is therefore **6.096 metres per
drawing unit** for this selected drawing.
The header extents are invalid, so the preview uses expanded geometry bounds.

1. Completed: Developer selected the house detail in the right site and confirmed
   the 1 inch = 20 feet scale. A calibrated SVG, HTML, PNG and origin/scale receipt
   are retained beside the overview. The review window is 36.576 by 30.48 metres;
   these are crop dimensions, not measured house dimensions.
2. Review the selected region with an explicit source-to-metre calibration and
   retained origin. Report excluded annotations/geometry before import.
3. Choose the appropriate existing representation. This file is planar and does
   not directly supply independent 3D meshes for Assembly JSON. Plan reference
   geometry and semantic architecture reconstruction are distinct operations.
4. Any wall/floor conversion must use existing Project architecture identities,
   validated imports, staged review and atomic Undo. Heights, openings and
   intended wall outlines require review; no arbitrary extrusion or fabricated
   elevations.

App version remains 0.31.12. This inspection does not establish production release.

## Calibrated close-up review

The rendered house close-up contains overlapping floor-plan, roof-pattern,
site-contour, dimension and furnishing geometry. These cannot all be treated as
wall outlines. Layer -62 contains most source entities, so layer filtering alone
is insufficient. Further conversion must separate these drawing roles and retain
a staged omission review. No geometry was silently classified or extruded.
The chosen local origin is source (12, -10.5); source rotation is retained.
