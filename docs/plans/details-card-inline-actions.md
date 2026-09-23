# v0.20.4 — ThreeD Scene: DetailsCard Action Toolbar

Status: **User-approved release checkpoint; functionality User-confirmed**. Package `0.20.4`. Production deployment is not yet confirmed.

## Proof

The released DetailsCard placed Save, Move, and Delete in a separate large row below the existing action icons. The User requested one top icon row, retaining action colors. The orange-highlighted environment meshes are not a priority; the cyan cuboid is the existing Physics Sensor.

## Act

Models, Beds, FarmBots, Plantings, and Characters render their existing editor actions through `DetailsCardActions`. Following User clarification, this row sits above the card title, outside scrolling content. Buttons retain their colors and show icons with the short labels **Save**, **Move**, and **Delete**; active movement shows **Cancel**. Full accessible names and tooltips retain the asset type. Editors retain their drafts, disabled states, save payloads, movement callbacks, and deletion confirmations. Sensor geometry and runtime behavior are unchanged.

## Validate

TypeScript, the existing inspector rendering check, and `git diff --check` passed after the placement and label refinement. Functionality is User-confirmed; retain this production smoke checklist: select each asset type, verify the labeled toolbar appears above the title and stays visible while scrolling, edit and save a field, toggle Move, and cancel a deletion confirmation. Confirm the sensor inspector still hides parent asset actions.

## Resolution

Implemented as the v0.20.4 candidate. The User retains the build gate. Scenarios are deferred to [v0.20.5](v0.20.5.md).

## Production handoff

Release title: **v0.20.4 — ThreeD Scene: DetailsCard Action Toolbar**.

```text
feat(threed): v0.20.4 DetailsCard Action Toolbar

- Share the top action toolbar across Models, Beds, FarmBots, Plantings, and Characters
- Show Save, Move, and Delete labels alongside the existing colored icons
- Keep actions visible above scrolling inspector content
- Preserve editor validation, movement, and deletion confirmations
```

TypeScript and inspector validation passed for the final implementation. Run the User-owned `npm run build`, then commit and deploy through the normal production workflow. Include the new `DetailsCardActions.tsx` component with the five edited inspector files and this record. No schema commands or dependency installation are required. Retain the checks above for production smoke testing; screenshots establish visual acceptance, not every action's functional result.

References: [v0.20.3 release](../releases/v0.20.3.md), [Physics Sensors](../developers/THREED_PHYSICS_SENSORS.md).
