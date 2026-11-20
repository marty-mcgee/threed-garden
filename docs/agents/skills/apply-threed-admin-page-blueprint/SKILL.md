---
name: apply-threed-admin-page-blueprint
description: Apply or review the ThreeD Admin Page Blueprint for an authorized Admin list, editor, or CRUD workflow in ThreeD, Multimedia, Traffic, or Learn. Use for compact list styling, sorting, saved row ordering, selection, Bulk Edit, CRUD dialogs, or a rollout audit.
---

# Apply ThreeD Admin Page Blueprint

1. Read [AGENTS.md](../../../../AGENTS.md), [CONTEXT.md](../../../../CONTEXT.md), and the [Blueprint and rollout plan](../../../plans/admin-threed-workspace-blueprint.md). Inspect the current diff. Start with the canonical route, then trace the record, schema, authorization, list query, writes, and any embedded or public callers.
2. Map the supported actions for the requested page. Use Tasks for sorting and selection, Assembly Groups and Terrains for saved rank and Active, and Waterings and Harvests for CRUD dialogs and scoped bulk updates. Use the common Admin header, controls, help tooltips, status states, and editor styles. Keep existing navigation, typed drafts, and the behavior of embedded callers.
3. Sort and filter the authorized result set before paging. Use stable tie-breakers and keep totals aligned with results. Clear page selection when its scope changes. Where manual order is supported, make the ascending Sort Order view easy to reach, provide drag and keyboard controls, and save moves within the authorized scope. Preserve the relative order of unaffected records.
4. Bulk Edit changes only opted-in fields on selected records. Validate ids, editability, relationships, and field values on the server. Use one transaction for an all-or-nothing batch, preserve conflict and deletion guards, and refresh the table after success. Confirm deletions and retain module-specific status, visibility, provenance, units, revisions, and history. Get explicit approval before expanding schema or persistence.
5. Test search and sorting across page boundaries, selection reset, drag and keyboard reorder where supported, save/reopen, mixed access, and failed mutations. Use the [validation ladder](../../VALIDATION.md) and mocked persistence. Record Developer acceptance, local verification, database migration status, and production status separately. Update the [Admin Guide](../../../users/ADMIN_GUIDE.md), rollout plan, and matching release record when the user-visible workflow changes.
