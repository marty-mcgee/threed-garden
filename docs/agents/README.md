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

The current production checkpoint is [v0.19.14](../releases/v0.19.14.md), commit `a5491e9`; deployment is User-confirmed. The [v0.19.15 workspace candidate](../plans/v0.19.15-release.md) completes the planned Admin page rollout, with User-run production build passed; deployment pending. Use the [continuation record](../plans/admin-threed-workspace-continuation.md) and [blueprint](../plans/admin-threed-workspace-blueprint.md), preserving each page's specialized behavior.

The autonomous [ThreeD Animations Library](../developers/THREED_ANIMATIONS_LIBRARY.md), uploads, Character assignment editor and Character playback integration shipped in v0.19.14. Dedicated Model assignment editing and compatibility/retargeting remain separate work.
