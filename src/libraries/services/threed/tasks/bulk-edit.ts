import { TaskPriority, TaskStatus, TaskType } from '@/libraries/types/threed';
import { isTaskSortOrder, taskSortOrderError } from './sort-order';

export interface BulkTaskChanges {
  assignedTo?: string | null;
  dueDate?: string | null;
  type?: TaskType | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  isActive?: boolean;
  sortOrder?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseBulkTaskEdit(body: unknown): { ids: number[]; changes: BulkTaskChanges } {
  if (!isRecord(body) || !Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 100 ||
      body.ids.some(id => !Number.isInteger(id) || id < 1 || id > 2_147_483_647) ||
      new Set(body.ids).size !== body.ids.length) {
    throw new Error('Select between 1 and 100 distinct Tasks.');
  }
  if (!isRecord(body.changes) || Object.keys(body.changes).length === 0) {
    throw new Error('Choose at least one field to change.');
  }

  const changes: BulkTaskChanges = {};
  for (const [key, value] of Object.entries(body.changes)) {
    switch (key) {
      case 'assignedTo': {
        if (value !== null && (typeof value !== 'string' || value.includes('\0') || [...value.trim()].length > 100)) {
          throw new Error('Assigned To must be 100 characters or fewer.');
        }
        changes.assignedTo = value?.trim() || null;
        break;
      }
      case 'dueDate':
        if (value !== null && !isDateOnly(value)) throw new Error('Choose a valid Due Date.');
        changes.dueDate = value;
        break;
      case 'type': {
        const type = Object.values(TaskType).find(option => option === value);
        if (value !== null && type === undefined) throw new Error('Choose a valid Task Type.');
        changes.type = type ?? null;
        break;
      }
      case 'priority': {
        const priority = Object.values(TaskPriority).find(option => option === value);
        if (priority === undefined) throw new Error('Choose a valid Priority.');
        changes.priority = priority;
        break;
      }
      case 'status': {
        const status = Object.values(TaskStatus).find(option => option === value);
        if (status === undefined) throw new Error('Choose a valid Status.');
        changes.status = status;
        break;
      }
      case 'isActive':
        if (typeof value !== 'boolean') throw new Error('Choose Active or Inactive.');
        changes.isActive = value;
        break;
      case 'sortOrder':
        if (!isTaskSortOrder(value)) throw new Error(taskSortOrderError);
        changes.sortOrder = value;
        break;
      default:
        throw new Error('The request includes a field that cannot be bulk edited.');
    }
  }
  return { ids: body.ids, changes };
}
