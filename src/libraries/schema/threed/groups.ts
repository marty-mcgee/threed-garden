import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { project, projectThreedMarkers, projectThreeDMarkerTypeEnum } from '../project';

export const threedGroups = pgTable('threed_groups', {
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  id: uuid('id').notNull().defaultRandom(),
  name: text('name').notNull(),
}, table => [
  primaryKey({ columns: [table.projectId, table.id] }),
  check('threed_groups_name_nonempty', sql`length(trim(${table.name})) > 0`),
]);

export const threedGroupDesignMembers = pgTable('threed_group_design_members', {
  projectId: integer('project_id').notNull(),
  groupId: uuid('group_id').notNull(),
  // Stable object ID in the Project's authoritative Design document.
  entityId: text('entity_id').notNull(),
}, table => [
  primaryKey({ columns: [table.projectId, table.groupId, table.entityId] }),
  foreignKey({
    name: 'threed_group_design_members_group_fk',
    columns: [table.projectId, table.groupId],
    foreignColumns: [threedGroups.projectId, threedGroups.id],
  }).onDelete('cascade'),
  check('threed_group_design_members_entity_nonempty', sql`length(trim(${table.entityId})) > 0`),
]);

export const threedGroupModelMembers = pgTable('threed_group_model_members', {
  projectId: integer('project_id').notNull(),
  groupId: uuid('group_id').notNull(),
  markerId: text('marker_id').notNull(),
  markerType: projectThreeDMarkerTypeEnum('marker_type').notNull().default('models'),
}, table => [
  primaryKey({ columns: [table.projectId, table.groupId, table.markerId] }),
  foreignKey({
    name: 'threed_group_model_members_group_fk',
    columns: [table.projectId, table.groupId],
    foreignColumns: [threedGroups.projectId, threedGroups.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'threed_group_model_members_placement_fk',
    columns: [table.projectId, table.markerId, table.markerType],
    foreignColumns: [projectThreedMarkers.projectId, projectThreedMarkers.markerId, projectThreedMarkers.markerType],
  }).onDelete('cascade'),
  check('threed_group_model_members_model_only', sql`${table.markerType} = 'models'`),
]);
