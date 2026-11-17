# ThreeD Terrain precision analysis

November 15, 2026. Analysis only; no runtime, schema, dependency or live-data changes. Baseline: clean main at `a40b13a5`, package/root lock 0.34.3, Developer-confirmed production. The localhost:5173 root returned HTTP 404 to a read-only request during this analysis. Findings use the checked-out reference source and Developer screenshot, not a live frame-rate measurement.

## Sampling and geometry

Reference `reference/terrains/src/geometry/useSquareSurface.ts` uses max(500 × Resolution, 20) samples per axis; its loops effectively round fractional counts upward. At the screenshot's 0.76 setting, this is 380 × 380 = 144,400 samples, matching the displayed count. Maximum is 500 × 500 = 250,000. Its footprint is approximately eight scene units, without a metre-based survey/measurement contract.

The App permits 129 × 129 = 16,641 height vertices, with 32,768 triangles. At an 800 m footprint, spacing is 6.25 m. Mapping the reference's 380 blocks across that same width would give approximately 2.11 m blocks; this is an illustrative equivalent, not the reference's real-world scale. The screenshot has 8.68 times as many samples as the App maximum (and about ten times as many as a 120 × 120 App grid).

Reference `src/components/Terrain.tsx` renders one instanced unit box per sample, not a continuous heightfield mesh. Its 144,400 boxes represent about 1,732,800 submitted base triangles before visibility/shadow-pass effects, versus the App's 32,768 mesh triangles. Instancing reduces draw calls, not geometry count. This is not evidence that copying its renderer is an appropriate performance choice for the persistent Project Scene and physics.

## Why the appearance differs

- Reference `useFbmNoise.ts` uses six-octave Perlin-based fBm with frequency and amplitude controls, then remaps and squares the result. App generation uses a tapered product of sine/cosine waves plus a detail wave. Increasing grid density samples that existing shape more finely; it does not create the reference's noise structure.
- Reference blocks each receive a selected band color; the App interpolates vertex colors across triangles. Sparse App triangles spread transitions and produce visible triangular boundaries. Per-fragment height-based band selection could sharpen boundaries without changing geometry resolution.
- Reference `useProceduralTerrain.ts` clamps visible height below sea level to sea level in color mode, while retaining the underlying height for color selection. App Sea Level currently changes color only: its valleys and collision geometry remain real terrain. Flat water presentation is a separate feature, not a numerical precision fix.
- The reference multiplies visible height by three after normalization into an approximately eight-unit footprint. It therefore presents stronger relief ratios than a physically scaled 800 m App Terrain with small relief. Reference colors also receive HSL saturation/depth adjustments and warm directional shadow lighting.
- Reference Detail controls lacunarity, while Fuzzyness controls octave amplitude decay. At the screenshot's Fuzzyness 0.01, persistence is 0.02, so later octaves contribute very little. Smooth hills are expected even with dense sampling.

## Numerical precision and reference limitations

App generated/sculpted heights are rounded to four decimal places in metres: a 0.1 mm storage increment. Render vertices use Float32 values. At local coordinates around 800 m, decimal rounding/floating-point precision is much smaller than the multi-metre sampling interval. The immediate limitation is spatial sampling and shading, not missing decimal places. This is not a claim of survey-grade accuracy or accuracy at arbitrary distant Project coordinates.

The reference is not an exact standard: its GUI assigns each color entry twice, overwriting threshold controls; Sea Level's displayed value is divided by two before storage; Snow's own threshold is not used by the color classifier. Its seed is quantized by the bundled noise implementation. No persistence/ownership/collision equivalence is established by its visual demo.

## Recommended sequence at analysis time

1. Separate color precision from geometry precision: evaluate continuous height-based fragment coloring for crisp, configurable bands, retaining current stored heights and collision mesh.
2. Offer an opt-in 257 × 257 height grid first: 66,049 vertices, 131,072 triangles and 3.125 m spacing across 800 m. Benchmark editor interaction, Project collision generation and mobile performance before considering 513 × 513.
3. Audit persistence and authoring budgets together with higher grids. The current Terrain POST cap is 300,000 bytes; editable history can retain a second full base-height array. Raising the UI limit alone would fail validation/save and increase geometry/history costs. Preserve old revisions and deterministic recipes.
4. Add a versioned seeded noise generator as a separate option if the goal includes natural landforms. Never reinterpret existing saved recipes or regenerate old Terrains automatically.
5. Treat flat water rendering as a separately specified presentation feature, preserving underlying terrain and explicit physics behavior.

Recommended first implementation is sharper height-based color bands plus a measured 257-grid trial, not replacing the App's terrain with hundreds of thousands of cubes. Any higher-grid persistence expansion requires explicit approval under AGENTS.md.

## Authorized follow-up

The Developer approved commencing these next steps. Sharp height bands and an opt-in 257 grid are implemented in the [v0.34.4 checkpoint](../releases/v0.34.4.md), which owns current validation and pending acceptance. The figures above describe the 0.34.3 baseline. Versioned noise and flat-water presentation remain deferred.
