# CONTEXT.md Update — v0.16.6a / v0.16.6b

Use the following updates in the repository `CONTEXT.md`.

## 1. Replace the document status line near the top

```md
Last Updated: August 16, 2026
Current Version: v0.16.6b "World Actions v2" — ✅ Released / Stable Checkpoint
Previous Version: v0.16.6a "Character Animations + Actions — Animation Action Mapping" — ✅ Released to Production
```

## 2. Add these rows to "Complete Version History"

```md
| v0.16.6a | 2026-08-16 | Character Animations + Actions — Animation Action Mapping: verified external FBX animation library, semantic action mapping, GardenCharacter + EcctrlCharacter integration, DetailsCard action buttons, clean one-shot task → locomotion crossfades |
| v0.16.6b | 2026-08-16 | World Actions v2 — persistent action targeting + targeted Water workflow; planting target selection, animation-completion reporting, authenticated watering-history persistence |
```

## 3. Add this release section after the v0.16.5 material

```md
---

## ✅ v0.16.6a "Character Animations + Actions — Animation Action Mapping" — Released to Production

### Goal

Make original FBX Character Models usable with separate FBX animation files in the React Three Fiber / Drei runtime, without depending on Blender/GLB conversion as the animation-authoring pipeline.

### Verified Architecture

```text
FBX Character Model
  + external FBX animation files
        ↓
externalCharacterAnimations loader
        ↓
normalized semantic clip names
        ↓
AnimationMap
        ↓
GardenCharacter / EcctrlCharacter
        ↓
idle / walk / run + one-shot task actions
```

### Verified Features

| Feature | Status | Description |
| --- | --- | --- |
| External FBX animations | ✅ Working | Separate Farmer animation FBX files load independently of the base Farmer FBX model |
| Semantic animation mapping | ✅ Working | App-facing action names resolve to normalized animation clips rather than raw FBX clip names |
| Locomotion | ✅ Working | `idle`, `walk`, and `run` work for Farmer characters |
| GardenCharacter integration | ✅ Working | Autonomous `wander` movement uses walk animation and temporarily yields to task actions |
| EcctrlCharacter integration | ✅ Working | WASD / Shift / camera behavior remains intact while task actions temporarily own the animation mixer |
| Repeated task actions | ✅ Working | Water / planting / harvesting / interaction animations can be triggered repeatedly |
| Smooth task return | ✅ Working | Task animation holds its final pose while locomotion crossfades back, preventing the FBX bind/T-pose flash |
| DetailsCard actions | ✅ Working | Character actions are grouped into Planting, Harvesting, Animal Care, and Interaction |
| Take / Release Control | ✅ Working | Existing Ecctrl control flow remains intact |

### Character Action Categories

- Planting: Water, Dig + Plant Seeds, Plant, Plant Tree
- Harvesting: Pull Plant, Pull Plant 2, Pick Fruit, Pick Fruit 2, Pick Fruit 3
- Animal Care: Milk Cow
- Interaction: Point, Point Gesture, Talk

### Important Architecture Decision

The animation subsystem is intentionally separated from world/database behavior.

`CharacterTaskAction` represents **what the character should animate**. Future gameplay/API layers may decide what world-state mutation corresponds to that action.

---

## ✅ v0.16.6b "World Actions v2" — Stable Checkpoint

### Goal

Prove that a semantic character animation can be associated with a selected world target and that a world-side operation can occur only after the one-shot animation completes.

### Verified Flow

```text
Select Planting
      ↓
Use as Action Target
      ↓
Select Farmer
      ↓
Water
      ↓
watering animation plays once
      ↓
animation completion event
      ↓
POST /api/threed/world-actions
      ↓
authenticated / ownership-checked server action
      ↓
threed_watering_history record
      ↓
Farmer returns to locomotion
```

### Verified Features

| Feature | Status | Description |
| --- | --- | --- |
| Persistent action target | ✅ Working | A selected planting can remain the current action target while the user selects a Farmer |
| Actor / action / target context | ✅ Working | Character action requests carry the Farmer, semantic action, and optional planting target |
| GardenCharacter completion | ✅ Working | Autonomous Farmer reports completion after the actual AnimationMixer one-shot finishes |
| EcctrlCharacter completion | ✅ Working | Controlled Farmer reports completion and resumes normal movement |
| Targeted Water action | ✅ Working | Water animation executes against the selected planting target |
| Water persistence | ✅ Working | `watering` persists through `/api/threed/world-actions` after animation completion |
| Authentication | ✅ Working | World-action route uses the existing server `auth()` convention |
| Ownership validation | ✅ Working | Character and planting are checked against the authenticated user before persistence |
| Failure isolation | ✅ Working | Animation / locomotion recovery does not depend on database success |

### Files Added / Updated

| File | Change |
| --- | --- |
| `src/app/dashboard/map/page.tsx` | Added persistent planting action target, DetailsCard target display, completion listener, and targeted Water persistence request |
| `src/app/api/threed/world-actions/route.ts` | New authenticated World Actions endpoint for targeted watering |
| `src/components/threed/shared/GardenCharacter.tsx` | Reports semantic task completion with target context |
| `src/components/threed/shared/EcctrlCharacter.tsx` | Reports semantic task completion with target context |
| `src/components/map/UnifiedMapView.tsx` | Threads semantic action request/completion context |
| `src/components/map/ThreeDScene.tsx` | Routes semantic action requests to the matching character |

### Scope Boundary / Deferred Work

v0.16.6b intentionally stops at the verified Water workflow.

The later experimental `Pick Fruit → threed_harvests` persistence work is **not part of the stable v0.16.6b checkpoint**. Fruit-picking animations remain valid character actions, but harvest-table persistence should be revisited after the broader API/schema architecture is more mature.

This keeps the proven FBX animation system isolated from unfinished application persistence design.

---
```

## 4. Update Production Status

Add or update these rows:

```md
| Character FBX Models | ✅ Working |
| External FBX Animations | ✅ Working |
| Semantic Animation Mapping | ✅ Working |
| GardenCharacter Task Actions | ✅ Working |
| EcctrlCharacter Task Actions | ✅ Working |
| DetailsCard Character Actions | ✅ Working |
| World Action Targeting | ✅ Working |
| Targeted Water World Action | ✅ Working |
| Harvest Persistence | ⏸️ Deferred — API/schema still evolving |
```

## 5. API Architecture addition

Under `api/threed/`, document:

```text
api/
└── threed/
    ├── route.ts
    └── world-actions/
        └── route.ts    # POST — authenticated semantic world actions; v0.16.6b supports targeted watering
```

## Stable checkpoint note

For rollback / future development, treat these as separate milestones:

- **v0.16.6a** = stable FBX model + external animation mapping architecture.
- **v0.16.6b** = v0.16.6a plus World Actions v2 target context and verified targeted Water persistence.
- Experimental fruit-harvest persistence after v0.16.6b is deferred and should not be required by the animation architecture.
