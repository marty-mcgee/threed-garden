import 'server-only';
import { head } from '@vercel/blob';
import { and, asc, eq, getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { db } from '@/libraries/db/client';
import { threedModelFiles, threedModels, threedModelTextures } from '@/libraries/schema/threed';
import { project, projectAssets, projectThreedMarkers } from '@/libraries/schema/project';
import {
  ELIGIBILITY_LIMITS, EligibilityInspectionError, createInspectionDeadline,
  fingerprintGlobalReferences, fingerprintOwnedSource, inspectDependencySource,
  inspectSnapshot, isOwnedRestorationSourceUrl, observeStorage,
  resolveEligibilityState, validateSnapshotBounds, withInspectionDeadline,
  type EligibilityCheckState, type EligibilityContext, type EligibilityFinding,
  type EligibilityRecord, type EligibilityResult, type EligibilitySnapshot,
  type InspectionDeadline,
} from './model-file-restoration-eligibility-core';

export interface RestorationEligibilityContext { userId: string; modelId: number; fileId: number }
const READ_PHASE_MS = 2_000;
const TIMESTAMP_FORMAT = 'YYYY-MM-DD"T"HH24:MI:SS.US';
const finding = (code: string, message: string): EligibilityFinding => ({ code, message });
const unique = (values: EligibilityFinding[]) => [...new Map(values.map(value => [value.code, value])).values()];
const tables: Array<{ key: keyof EligibilitySnapshot['references']; table: PgTable; id: PgColumn }> = [
  { key: 'files', table: threedModelFiles, id: threedModelFiles.id },
  { key: 'textures', table: threedModelTextures, id: threedModelTextures.id },
  { key: 'models', table: threedModels, id: threedModels.id },
  { key: 'markers', table: projectThreedMarkers, id: projectThreedMarkers.id },
  { key: 'projectAssets', table: projectAssets, id: projectAssets.id },
  { key: 'projects', table: project, id: project.id },
];

/** Preserve every column, replacing native timestamps before any pg/Date mapping. */
function nativeRecord(table: PgTable): SQL<EligibilityRecord> {
  const timestamps = Object.values(getTableColumns(table)).filter(column => column.columnType.startsWith('PgTimestamp'));
  const pairs = timestamps.map(column => sql`${column.name}::text, to_char(${column}, ${TIMESTAMP_FORMAT})`);
  return sql<EligibilityRecord>`to_jsonb(${table}) || jsonb_build_object(${sql.join(pairs, sql`, `)})`;
}

function camelRecord(value: unknown): EligibilityRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Date) {
    throw new EligibilityInspectionError('REFERENCE_REPRESENTATION_UNKNOWN', 'The complete reference capture is unavailable.');
  }
  // Only schema column names are mapped. Nested raw JSON must retain its keys.
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), entry]));
}

function boundedInteger(value: unknown): number {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) {
    throw new EligibilityInspectionError('REFERENCE_REPRESENTATION_UNKNOWN', 'The complete reference capture is unavailable.');
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new EligibilityInspectionError('REFERENCE_BOUNDS_EXCEEDED', 'The complete reference capture exceeds its bounds.');
  return result;
}

/** A started read transaction finishes/rolls back before timeout is reported. */
export async function captureRestorationEligibilitySnapshot(context: RestorationEligibilityContext): Promise<EligibilitySnapshot | null> {
  const started = performance.now();
  let phaseStarted = false, expired = false;
  const checkBudget = () => {
    if (expired || performance.now() - started >= READ_PHASE_MS) {
      throw new EligibilityInspectionError('SNAPSHOT_TIMEOUT', 'The complete read-only capture exceeded its time budget.');
    }
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<{ kind: 'expired' }>(resolve => {
    timer = setTimeout(() => { expired = true; resolve({ kind: 'expired' }); }, READ_PHASE_MS);
  });
  const operation = db.transaction(async tx => {
    phaseStarted = true;
    // The current Pool adapter cannot cancel queued checkout. A late callback
    // starts no SELECTs and immediately rolls its read-only transaction back.
    checkBudget();
    await tx.execute(sql`SET LOCAL statement_timeout = '2000ms'`);
    checkBudget();
    await tx.execute(sql`SET LOCAL lock_timeout = '100ms'`);
    checkBudget();
    const [ownedModel] = await tx.select({ id: threedModels.id }).from(threedModels)
      .where(and(eq(threedModels.id, context.modelId), eq(threedModels.userId, context.userId))).limit(1);
    checkBudget();
    if (!ownedModel) return null;
    const [ownedFile] = await tx.select({ id: threedModelFiles.id }).from(threedModelFiles)
      .where(and(eq(threedModelFiles.id, context.fileId), eq(threedModelFiles.modelId, context.modelId), eq(threedModelFiles.userId, context.userId))).limit(1);
    checkBudget();
    if (!ownedFile) return null;

    const counts = new Map<keyof EligibilitySnapshot['references'], number>();
    let combinedBytes = 0;
    // Count and byte bounds for all six complete tables precede materialization.
    for (const entry of tables) {
      checkBudget();
      const [aggregate] = await tx.select({
        count: sql<string>`count(*)::text`,
        bytes: sql<string>`coalesce(sum(octet_length((${nativeRecord(entry.table)})::text)), 0)::text`,
      }).from(entry.table);
      checkBudget();
      const count = boundedInteger(aggregate?.count), bytes = boundedInteger(aggregate?.bytes);
      combinedBytes += bytes;
      if (count > ELIGIBILITY_LIMITS.tableRecords || combinedBytes > ELIGIBILITY_LIMITS.jsonBytes) {
        throw new EligibilityInspectionError('REFERENCE_BOUNDS_EXCEEDED', 'The complete reference capture exceeds its bounds.');
      }
      counts.set(entry.key, count);
    }
    const references: EligibilitySnapshot['references'] = { files: [], textures: [], models: [], markers: [], projectAssets: [], projects: [] };
    for (const entry of tables) {
      checkBudget();
      const rows = await tx.select({ record: nativeRecord(entry.table) }).from(entry.table)
        .orderBy(asc(entry.id)).limit(ELIGIBILITY_LIMITS.tableRecords + 1);
      checkBudget();
      if (rows.length !== counts.get(entry.key) || rows.length > ELIGIBILITY_LIMITS.tableRecords) {
        throw new EligibilityInspectionError('REFERENCE_CAPTURE_INCOMPLETE', 'The complete reference capture is unavailable.');
      }
      references[entry.key] = rows.map(row => camelRecord(row.record));
    }
    const model = references.models.find(row => row.id === context.modelId && row.userId === context.userId);
    const file = references.files.find(row => row.id === context.fileId && row.modelId === context.modelId && row.userId === context.userId);
    if (!model || !file) return null;
    const snapshot: EligibilitySnapshot = {
      model, file, references,
      // Retained legacy/uncertain attachments still participate in dependency
      // proof and ambiguity checks; only exact owned rows may be fetched.
      files: references.files.filter(row => row.modelId === context.modelId),
    };
    validateSnapshotBounds(snapshot);
    checkBudget();
    return snapshot;
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' });
  try {
    const first = await Promise.race([operation.then(value => ({ kind: 'captured' as const, value })), deadline]);
    if (first.kind === 'expired') {
      if (phaseStarted) {
        // Do not abandon an executing transaction. statement_timeout bounds
        // its current query; await rollback/driver release before replying.
        await operation.catch(() => undefined);
      } else {
        // Handle eventual late checkout failure without accepting its result.
        void operation.catch(() => undefined);
      }
      checkBudget();
      throw new EligibilityInspectionError('SNAPSHOT_TIMEOUT', 'The complete read-only capture exceeded its time budget.');
    }
    checkBudget();
    return first.value;
  } catch (error) {
    if (expired || performance.now() - started >= READ_PHASE_MS) {
      throw new EligibilityInspectionError('SNAPSHOT_TIMEOUT', 'The complete read-only capture exceeded its time budget.');
    }
    throw error;
  } finally { clearTimeout(timer); }
}

/** The installed SDK's read-write credential carries its store ID in this segment. */
export function restorationStoreId(token: unknown): string | null {
  if (typeof token !== 'string') return null;
  const match = /^vercel_blob_rw_([a-zA-Z0-9]{1,100})_([a-zA-Z0-9_-]+)$/.exec(token);
  return match?.[1].toLowerCase() ?? null;
}

function provedDeclarationUrl(source: EligibilityRecord, snapshot: EligibilitySnapshot, context: EligibilityContext): string | null {
  if (source.userId !== context.userId || source.modelId !== context.modelId || typeof source.filePath !== 'string') return null;
  if (!snapshot.files.some(file => file.id === source.id && file.filePath === source.filePath)) return null;
  return isOwnedRestorationSourceUrl(source.filePath, context) ? source.filePath : null;
}

async function readDeclaration(url: string, material: boolean, deadline: InspectionDeadline, budget: { bytes: number }): Promise<Uint8Array> {
  return withInspectionDeadline(async signal => {
    const response = await fetch(url, { signal, redirect: 'error', cache: 'no-store' });
    if (!response.ok || !response.body) throw new EligibilityInspectionError('DEPENDENCY_SOURCE_UNAVAILABLE', 'A saved dependency declaration could not be read.');
    const cap = Math.min(material ? ELIGIBILITY_LIMITS.materialBytes : ELIGIBILITY_LIMITS.declarationBytes,
      ELIGIBILITY_LIMITS.declarationBytes - budget.bytes);
    const length = response.headers.get('content-length');
    if (cap <= 0 || length && /^\d+$/.test(length) && Number(length) > cap) {
      await response.body.cancel().catch(() => undefined);
      throw new EligibilityInspectionError('DEPENDENCY_BOUNDS_EXCEEDED', 'Dependency declarations exceed their inspection bounds.');
    }
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    const cancel = () => { void reader.cancel().catch(() => undefined); };
    signal.addEventListener('abort', cancel, { once: true });
    let size = 0;
    try {
      while (true) {
        if (signal.aborted || deadline.now() >= deadline.expiresAt) throw new EligibilityInspectionError('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.');
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength; budget.bytes += next.value.byteLength;
        if (size > cap || budget.bytes > ELIGIBILITY_LIMITS.declarationBytes) {
          await reader.cancel().catch(() => undefined);
          throw new EligibilityInspectionError('DEPENDENCY_BOUNDS_EXCEEDED', 'Dependency declarations exceed their inspection bounds.');
        }
        chunks.push(next.value);
      }
    } finally {
      signal.removeEventListener('abort', cancel);
      try { reader.releaseLock(); } catch { /* An aborted pending read remains canceled. */ }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  }, deadline);
}

function safeFailure(error: unknown, fallback: string): EligibilityFinding {
  return error instanceof EligibilityInspectionError
    ? finding(error.code, error.message)
    : finding(fallback, 'This part of the complete read-only inspection is unavailable.');
}

export async function diagnoseModelFileRestoration(context: RestorationEligibilityContext): Promise<EligibilityResult | null> {
  const before = await captureRestorationEligibilitySnapshot(context);
  if (!before) return null;
  const token = process.env.BLOB_READ_WRITE_TOKEN, storeId = restorationStoreId(token);
  const fullContext: EligibilityContext = { ...context, storeId: storeId ?? '' };
  const assessment = inspectSnapshot(before, fullContext);
  const blockers = [...assessment.blockers], uncertainty = [...assessment.uncertainty];
  const checks: EligibilityResult['checks'] = {
    target: assessment.target, references: assessment.references, storage: 'not_checked', dependencies: 'not_checked', consistency: 'not_checked',
  };
  let availability: EligibilityResult['availability'] = 'unknown';
  let observedAt = new Date().toISOString();
  if (!storeId) {
    // Credential absence proves neither saved-object ownership nor absence.
    const independentTargetBlocker = blockers.some(value => value.code !== 'STORAGE_IDENTITY_UNPROVED');
    for (let index = blockers.length - 1; index >= 0; index--) if (blockers[index].code === 'STORAGE_IDENTITY_UNPROVED') blockers.splice(index, 1);
    if (!independentTargetBlocker) checks.target = 'unknown';
    uncertainty.push(finding('STORAGE_IDENTITY_UNAVAILABLE', 'Configured authenticated storage identity is unavailable.'));
  } else if (assessment.target === 'clear' && assessment.ownedUrl) {
    // Snapshot A's transaction is already released. This deadline covers all external work.
    const deadline = createInspectionDeadline();
    const observation = await observeStorage((url, options) => head(url, { token, abortSignal: options.abortSignal }), assessment.ownedUrl, deadline);
    availability = observation.availability; observedAt = observation.observedAt;
    blockers.push(...observation.blockers); uncertainty.push(...observation.uncertainty);
    checks.storage = availability === 'missing' ? 'clear' : availability === 'present' ? 'blocked' : 'unknown';
    const queue = [...assessment.dependencySources], seen = new Set<unknown>(), budget = { bytes: 0 };
    let dependencyStatus: EligibilityCheckState = 'clear';
    for (let index = 0; index < queue.length; index++) {
      const source = queue[index];
      if (seen.has(source.id)) continue;
      seen.add(source.id);
      const name = typeof source.fileName === 'string' ? source.fileName : '';
      if (!/\.(?:glb|gltf|obj|mtl)$/i.test(name)) {
        dependencyStatus = 'unknown';
        uncertainty.push(finding('DEPENDENCY_UNSUPPORTED', 'A retained geometry format lacks complete supported dependency proof.'));
        continue;
      }
      const url = provedDeclarationUrl(source, before, fullContext);
      if (!url) {
        dependencyStatus = 'unknown';
        uncertainty.push(finding('DEPENDENCY_SOURCE_UNAVAILABLE', 'A dependency declaration lacks proved immutable owned storage identity.'));
        continue;
      }
      try {
        const bytes = await readDeclaration(url, /\.mtl$/i.test(name), deadline, budget);
        const dependency = inspectDependencySource(source, bytes, assessment.attachments, assessment.ownedUrl);
        blockers.push(...dependency.blockers); uncertainty.push(...dependency.uncertainty);
        // Parsing is synchronous and can outlast the timer's event-loop turn.
        // Its findings remain visible, but elapsed work cannot grant candidacy.
        if (deadline.now() >= deadline.expiresAt) {
          throw new EligibilityInspectionError('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.');
        }
        if (dependency.status === 'unknown') dependencyStatus = 'unknown';
        else if (dependency.status === 'blocked' && dependencyStatus !== 'unknown') dependencyStatus = 'blocked';
        queue.push(...dependency.materials);
      } catch (error) {
        dependencyStatus = 'unknown';
        uncertainty.push(safeFailure(error, 'DEPENDENCY_SOURCE_UNAVAILABLE'));
        if (deadline.now() >= deadline.expiresAt) break;
      }
    }
    if (deadline.now() >= deadline.expiresAt) {
      dependencyStatus = 'unknown';
      uncertainty.push(finding('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.'));
    }
    checks.dependencies = dependencyStatus;
  }

  let revision = fingerprintOwnedSource(before);
  try {
    const after = await captureRestorationEligibilitySnapshot(context);
    if (!after) return null;
    const afterRevision = fingerprintOwnedSource(after);
    const changed = revision !== afterRevision || fingerprintGlobalReferences(before) !== fingerprintGlobalReferences(after);
    checks.consistency = changed ? 'stale' : 'unchanged';
    if (changed) uncertainty.push(finding('OBSERVED_STATE_CHANGED', 'Saved resource or reference state changed during inspection. Refresh this File before another check.'));
    const current = inspectSnapshot(after, fullContext);
    // Keep independently discovered current blockers without disclosing source records.
    blockers.push(...current.blockers.filter(value => storeId || value.code !== 'STORAGE_IDENTITY_UNPROVED'));
    uncertainty.push(...current.uncertainty);
    revision = afterRevision;
  } catch (error) {
    checks.consistency = 'unknown';
    uncertainty.push(safeFailure(error, 'REFERENCE_CAPTURE_UNAVAILABLE'));
  }
  const finalBlockers = unique(blockers), finalUncertainty = unique(uncertainty);
  const state = resolveEligibilityState(checks, finalBlockers, finalUncertainty);
  // Scope limits describe every observation; they do not change proof state.
  const reportedUncertainty = [...finalUncertainty,
    finding('OBSERVATION_LIMITS', 'Matching database observations cannot rule out changes that were reversed between checks, changes after the check, or an object being recreated in storage.'),
    finding('CANDIDATE_NOT_VALIDATED', 'The expected format comes from the saved filename and file type. No replacement image or file has been checked.'),
  ];
  return {
    modelId: context.modelId, fileId: context.fileId, observedAt, revision,
    state, availability, checks,
    blockers: finalBlockers, uncertainty: reportedUncertainty,
    restoreAllowed: false, candidateValidation: 'not_performed',
  };
}
