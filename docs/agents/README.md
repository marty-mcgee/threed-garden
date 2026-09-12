# Agent Documentation

Coding agents must read the root [AGENTS.md](../../AGENTS.md) and [CONTEXT.md](../../CONTEXT.md) before architectural work.

Source-of-truth order:

1. Current implementation and Drizzle schemas.
2. Root `AGENTS.md` safety and workflow requirements.
3. Root `CONTEXT.md` current checkpoint and architectural history.
4. Audience guides in `docs/`.
5. Historical context snapshots, which are reference material only.

Use [Safe change areas](SAFE_CHANGE_AREAS.md), [Task checklists](TASK_CHECKLISTS.md), and [Validation](VALIDATION.md) for every development step. If documentation conflicts with code, prove the current behavior and correct the documentation within the same scoped task.

Read [ThreeD character runtimes](../developers/THREED_CHARACTERS.md) before changing GardenCharacter, EcctrlCharacter, character routing, or Phase 5 orchestration.

Read [ThreeD Marker architecture](../developers/THREED_MARKERS.md) before changing Runtime Marker creation, marker identity, ThreeD Layers, marker visibility, Action Target resolution, or marker adapters.

The current production checkpoint is [v0.19.15](../releases/v0.19.15.md), commit `9157e06`; deployment and manual build are User-confirmed. The planned Admin page rollout is released. No next version is designated. Preserve specialized Model Files, read-only Waterings and embedded Project sizing; see the [handoff](../plans/v0.19.15-release.md) and [blueprint](../plans/admin-threed-workspace-blueprint.md).

The autonomous [ThreeD Animations Library](../developers/THREED_ANIMATIONS_LIBRARY.md), uploads, Character assignment editor and Character playback integration shipped in v0.19.14. Dedicated Model assignment editing and compatibility/retargeting remain separate work.
