import type {
  ProjectThreeDMarkerRecord,
  UnifiedMapData,
} from '../../../types/map';

export type ThreeDProjectSourceCollection =
  | 'beds'
  | 'characters'
  | 'farmbots'
  | 'models'
  | 'plantings';

interface ThreeDProjectSourceChange {
  upsert?: readonly Record<string, unknown>[];
  removeIds?: readonly number[];
}

export interface ThreeDProjectClientTransaction {
  markers?: {
    replace?: readonly ProjectThreeDMarkerRecord[];
    upsert?: readonly ProjectThreeDMarkerRecord[];
    removeRecordIds?: readonly number[];
  };
  sources?: Partial<Record<ThreeDProjectSourceCollection, ThreeDProjectSourceChange>>;
}

const SOURCE_COUNT_KEYS: Partial<Record<ThreeDProjectSourceCollection, keyof UnifiedMapData['threed']>> = {
  beds: 'bedsCount',
  characters: 'charactersCount',
  farmbots: 'farmbotsCount',
  plantings: 'plantingsCount',
};

function recordId(record: object): number | null {
  const id = Number((record as { id?: unknown }).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function upsertRecords<T extends object>(
  current: readonly T[],
  incoming: readonly T[],
  merge: (existing: T, next: T) => T,
): T[] {
  if (incoming.length === 0) return current as T[];
  const result = [...current];
  const indexes = new Map<number, number>();
  result.forEach((record, index) => {
    const id = recordId(record);
    if (id !== null) indexes.set(id, index);
  });
  incoming.forEach((record) => {
    const id = recordId(record);
    if (id === null) throw new Error('ThreeD Project client transaction requires a positive record ID');
    const index = indexes.get(id);
    if (index === undefined) {
      indexes.set(id, result.length);
      result.push(record);
    } else {
      result[index] = merge(result[index], record);
    }
  });
  return result;
}

function removeRecords<T extends object>(
  current: readonly T[],
  removeIds: readonly number[],
): T[] {
  if (removeIds.length === 0) return current as T[];
  const ids = new Set(removeIds);
  return current.filter((record) => {
    const id = recordId(record);
    return id === null || !ids.has(id);
  });
}

function mergeMarker(
  existing: ProjectThreeDMarkerRecord,
  incoming: ProjectThreeDMarkerRecord,
): ProjectThreeDMarkerRecord {
  return {
    ...existing,
    ...incoming,
    data: { ...(existing.data ?? {}), ...(incoming.data ?? {}) },
    metadata: { ...(existing.metadata ?? {}), ...(incoming.metadata ?? {}) },
  };
}

export function applyThreeDProjectClientTransaction(
  current: UnifiedMapData,
  transaction: ThreeDProjectClientTransaction,
): UnifiedMapData {
  const raw = current.threed.raw;
  if (!raw) return current;

  let nextRaw = raw;
  let nextThreeD = current.threed;

  if (transaction.markers) {
    let markers = transaction.markers.replace
      ? upsertRecords([], transaction.markers.replace, mergeMarker)
      : raw.projectThreedMarkers ?? [];
    if (!transaction.markers.replace) {
      markers = removeRecords(markers, transaction.markers.removeRecordIds ?? []);
      markers = upsertRecords(markers, transaction.markers.upsert ?? [], mergeMarker);
    }
    nextRaw = { ...nextRaw, projectThreedMarkers: markers };
    nextThreeD = { ...nextThreeD, markersCount: markers.length };
  }

  for (const collection of Object.keys(transaction.sources ?? {}) as ThreeDProjectSourceCollection[]) {
    const change = transaction.sources?.[collection];
    if (!change) continue;
    let records = raw[collection] as Record<string, unknown>[];
    records = removeRecords(records ?? [], change.removeIds ?? []);
    records = upsertRecords(records, change.upsert ?? [], (existing, incoming) => ({
      ...existing,
      ...incoming,
    }));
    nextRaw = { ...nextRaw, [collection]: records };
    const countKey = SOURCE_COUNT_KEYS[collection];
    if (countKey) nextThreeD = { ...nextThreeD, [countKey]: records.length };
  }

  return {
    ...current,
    threed: {
      ...nextThreeD,
      raw: nextRaw,
    },
  };
}
