import { createHash, randomUUID } from 'node:crypto';
import { open, readFile, realpath, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { user } from '../../../schema/auth';
import { project, projectAssets, projectThreed, projectThreedMarkers } from '../../../schema/project';
import { threed, threedModelFiles, threedModels } from '../../../schema/threed';
import { parseProjectThreeDMarkerSnapshot } from '../markers/project-marker-snapshot-core';
import { parseThreeDProjectViewState } from '../markers/project-view-state-core';
import { newDesign } from './document';
import { importProjectArchitecture, parseProjectArchitecture, readProjectArchitecture } from './project-architecture';
import { defaultDesignWorkspace } from './workspace-state';
import { assertLegacyRecoveryDirectDatabaseUrl } from './legacy-recovery-connection';
import { applyLegacyRecovery, isLegacyRecoveryBlobUrl, type LegacyRecoveryApplyOptions, type LegacyRecoveryJournal, type LegacyRecoveryUpload } from './legacy-recovery-apply';
import type { LegacyRecoveryAsset, LegacyRecoveryFile, LegacyRecoveryPackage, LegacyRecoveryReceipt } from './legacy-recovery-contract';

export interface LegacyRecoveryDatabaseOptions extends LegacyRecoveryApplyOptions {
  databaseUrl: string; blobToken: string; root: string; journalPath: string;
}
const canonical = (value: unknown) => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const review = (): never => { throw new Error('An existing recovery differs from the prepared package. Review it manually; no existing records will be overwritten.'); };
const contentType = (file: LegacyRecoveryFile) => ({ '.obj': 'model/obj', '.mtl': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.bmp': 'image/bmp' }[path.extname(file.path).toLowerCase()] ?? 'application/octet-stream');
function relativePath(asset: LegacyRecoveryAsset, file: LegacyRecoveryFile) {
  const primary = asset.files.find(file => file.role === 'model');
  if (!primary || asset.files.filter(file => file.role === 'model').length !== 1 || !primary.path.endsWith('.obj')) throw new Error('Each prepared asset requires one OBJ primary.');
  const relative = path.posix.relative(path.posix.dirname(primary.path), file.path);
  if (!relative || relative.startsWith('../') || relative.length > 356 || path.posix.dirname(relative).length > 100) throw new Error('Supporting files must remain inside their prepared Model bundle.');
  return relative;
}

/** Live adapter: invoked only after the CLI has explicitly accepted --apply and verified the staged package. */
export async function applyLegacyRecoveryToDatabase(pkg: LegacyRecoveryPackage, options: LegacyRecoveryDatabaseOptions): Promise<LegacyRecoveryReceipt> {
  if (!options.databaseUrl || !options.blobToken) throw new Error('DATABASE_URL and BLOB_READ_WRITE_TOKEN are required for explicit apply.');
  assertLegacyRecoveryDirectDatabaseUrl(options.databaseUrl);
  const root = path.resolve(options.root), journalPath = path.resolve(options.journalPath);
  let sequence = 0;
  const imported = importProjectArchitecture(newDesign(), pkg.architecture, 'replace', () => `recovered-${createHash('sha256').update(`${options.userId}:${pkg.fingerprint}:${++sequence}`).digest('hex').slice(0, 32)}`);
  const architecture = parseProjectArchitecture({ version: 1, document: imported });
  for (const asset of pkg.assets) for (const file of asset.files) relativePath(asset, file);
  const markerInput = (models: LegacyRecoveryReceipt['models']) => parseProjectThreeDMarkerSnapshot(pkg.placements.map(placement => {
    const model = models.find(model => model.key === placement.variantKey);
    if (!model) throw new Error('A prepared placement references a missing variant.');
    return { markerId: `models-recovered-${createHash('sha256').update(`${pkg.fingerprint}:${placement.legacyId}`).digest('hex').slice(0, 32)}`,
      moduleType: 'models', assetId: model.modelId, name: placement.name, position: placement.position, positionSource: 'asset',
      color: '#06b6d4', icon: '🧊', label: placement.name, isVisible: true, isActive: true,
      // Existing Project Model instance rotation fields are radians; scale is baked into staged geometry.
      data: { modelId: model.modelId, rotationX: placement.rotation.x, rotationYInstance: placement.rotation.y, rotationZ: placement.rotation.z, scaleMultiplier: 1 },
      metadata: { source: 'project-marker', placementRole: 'object', legacyRecoveryFingerprint: pkg.fingerprint, legacyId: placement.legacyId, legacyLevelId: placement.levelId },
    };
  }));
  const pool = new pg.Pool({ connectionString: options.databaseUrl, max: 1, connectionTimeoutMillis: 15_000 });
  const client = await pool.connect().catch(async error => { await pool.end(); throw error; });
  const db = drizzle(client);
  const lock = `legacy-recovery:${options.userId}:${pkg.fingerprint}`;
  async function findCommitted(reader: Pick<typeof db, 'select'> = db): Promise<LegacyRecoveryReceipt | null> {
    const rows = await reader.select().from(project).where(and(eq(project.userId, options.userId), sql`${project.metadata}->>'legacyRecoveryFingerprint' = ${pkg.fingerprint}`));
    if (!rows.length) return null;
    if (rows.length !== 1) return review();
    const saved = rows[0], raw = object(saved.metadata).legacyRecoveryReceipt;
    if (!raw || typeof raw !== 'object') return review();
    const receipt = raw as LegacyRecoveryReceipt;
    if (receipt.version !== 1 || receipt.fingerprint !== pkg.fingerprint || receipt.userId !== options.userId || receipt.projectId !== saved.id
      || !Array.isArray(receipt.models) || receipt.models.length !== pkg.assets.length || receipt.markerCount !== pkg.placements.length
      || saved.name !== options.projectName || saved.isPublic || !saved.isActive || Number(saved.metersPerSceneUnit) !== 1
      || canonical(readProjectArchitecture(saved.config)) !== canonical(architecture)) return review();
    const links = await reader.select().from(projectThreed).where(and(eq(projectThreed.projectId, saved.id), eq(projectThreed.userId, options.userId)));
    if (links.length !== 1 || !links[0].isActive || links[0].threedId !== receipt.threedId) return review();
    const modules = await reader.select().from(threed).where(and(eq(threed.id, receipt.threedId), eq(threed.userId, options.userId)));
    if (modules.length !== 1 || !modules[0].isActive || modules[0].isPublic || modules[0].projectId !== saved.id) return review();
    const models = receipt.models.length ? await reader.select().from(threedModels).where(and(eq(threedModels.userId, options.userId), inArray(threedModels.id, receipt.models.map(model => model.modelId)))) : [];
    if (models.length !== pkg.assets.length) return review();
    for (const asset of pkg.assets) {
      const model = models.find(model => model.id === receipt.models.find(item => item.key === asset.key)?.modelId);
      if (!model || model.modelType !== 'obj' || model.modelName !== asset.modelName || model.isPublic || !model.isActive || model.status !== 'active'
        || Number(model.scale) !== 1 || Number(model.rotationY) !== 0 || Number(model.offsetX) !== 0 || Number(model.offsetY) !== 0 || Number(model.offsetZ) !== 0
        || object(model.metadata).legacyRecoveryFingerprint !== pkg.fingerprint || object(model.metadata).legacyVariantKey !== asset.key) return review();
      const files = await reader.select().from(threedModelFiles).where(and(eq(threedModelFiles.modelId, model.id), eq(threedModelFiles.userId, options.userId)));
      if (files.length !== asset.files.length) return review();
      for (const source of asset.files) {
        const file = files.find(file => file.relativePath === relativePath(asset, source));
        if (!file || file.fileSize !== source.bytes || file.fileType !== source.role || object(file.metadata).sha256 !== source.sha256
          || (source.role === 'model' && file.id !== model.mainModelFileId)) return review();
        if (!isLegacyRecoveryBlobUrl(file.filePath, options.userId, pkg.fingerprint, source)) return review();
      }
    }
    const assignments = await reader.select().from(projectAssets).where(and(eq(projectAssets.projectId, saved.id), eq(projectAssets.userId, options.userId)));
    if (assignments.length !== pkg.assets.length || models.some(model => !assignments.some(item => item.moduleId === receipt.threedId && item.assetType === 'threed_models' && item.assetId === model.id && item.moduleType === 'threed' && item.isActive))) return review();
    const markers = await reader.select().from(projectThreedMarkers).where(and(eq(projectThreedMarkers.projectId, saved.id), eq(projectThreedMarkers.userId, options.userId)));
    const expected = markerInput(receipt.models);
    if (markers.length !== expected.length) return review();
    for (const marker of expected) {
      const stored = markers.find(row => row.markerId === marker.markerId);
      if (!stored || stored.threedId !== receipt.threedId || stored.sourceAssetId !== marker.assetId || stored.markerType !== 'models'
        || stored.name !== marker.name || !stored.isVisible || !stored.isActive
        || Number(stored.positionX) !== Number(marker.position.x.toFixed(3)) || Number(stored.positionY) !== Number(marker.position.y.toFixed(3)) || Number(stored.positionZ) !== Number(marker.position.z.toFixed(3))
        || canonical(stored.data) !== canonical(marker.data) || canonical(stored.metadata) !== canonical(marker.metadata)) return review();
    }
    return { ...receipt, operation: 'existing' };
  }
  try {
    return await applyLegacyRecovery(pkg, options, {
      withLock: async work => { await client.query('SELECT pg_advisory_lock(hashtext($1))', [lock]); try { return await work(); } finally { await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lock]); } },
      ownerExists: async () => (await db.select({ id: user.id }).from(user).where(eq(user.id, options.userId)).limit(1)).length === 1,
      findCommitted: () => findCommitted(),
      readJournal: async () => { try { return JSON.parse(await readFile(journalPath, 'utf8')) as LegacyRecoveryJournal; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; } },
      writeJournal: async value => {
        const temp = `${journalPath}.${randomUUID()}.tmp`, handle = await open(temp, 'wx');
        try { await handle.writeFile(JSON.stringify(value, null, 2) + '\n'); await handle.sync(); } finally { await handle.close(); }
        await rename(temp, journalPath);
      },
      upload: async (file, pathname) => {
        const absolute = path.resolve(root, file.path);
        if (!absolute.startsWith(root + path.sep)) throw new Error('Prepared file escapes its recovery directory.');
        const [realRoot, realFile] = await Promise.all([realpath(root), realpath(absolute)]);
        if (!realFile.startsWith(realRoot + path.sep)) throw new Error('Prepared file resolves outside its recovery directory.');
        const info = await stat(realFile);
        if (!info.isFile() || info.size !== file.bytes) throw new Error('Prepared file changed before upload.');
        const bytes = await readFile(realFile);
        if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('Prepared file changed before upload.');
        return (await put(pathname, bytes, { token: options.blobToken, access: 'public', addRandomSuffix: false, allowOverwrite: false, contentType: contentType(file) })).url;
      },
      commit: async (uploads: LegacyRecoveryUpload[]) => db.transaction(async tx => {
        const createdAt = new Date(), metadata = { legacyRecoveryFingerprint: pkg.fingerprint, sourcePlanSha256: pkg.sourcePlanSha256 };
        const [created] = await tx.insert(project).values({ userId: options.userId, name: options.projectName, slug: `recovery-${randomUUID()}`, isPublic: false, isActive: true, metersPerSceneUnit: '1.000000', config: {}, metadata }).returning();
        const [module] = await tx.insert(threed).values({ userId: options.userId, projectId: created.id, name: `${options.projectName} ThreeD`, slug: `recovery-module-${randomUUID()}`, isPublic: false, isActive: true, metadata }).returning();
        await tx.insert(projectThreed).values({ userId: options.userId, projectId: created.id, threedId: module.id, isActive: true });
        const mapped: LegacyRecoveryReceipt['models'] = [];
        for (const asset of pkg.assets) {
          const [model] = await tx.insert(threedModels).values({ userId: options.userId, modelName: asset.modelName, modelType: 'obj', scale: '1.00', rotationY: '0.00', offsetX: '0.00', offsetY: '0.00', offsetZ: '0.00',
            isPublic: false, isLibraryItem: true, isActive: true, status: 'active', hasExternalFiles: asset.files.length > 1, textureCount: asset.files.filter(file => file.role === 'texture').length,
            metadata: { ...metadata, legacyVariantKey: asset.key, legacyName: asset.legacyName, sourceScale: asset.scale, author: asset.attribution.author, license: asset.attribution.license } }).returning({ id: threedModels.id });
          let primaryId: number | undefined;
          for (const [index, source] of asset.files.entries()) {
            const uploaded = uploads.find(file => file.path === source.path);
            if (!uploaded) throw new Error('A prepared upload was not confirmed.');
            const [file] = await tx.insert(threedModelFiles).values({ userId: options.userId, modelId: model.id, fileName: path.posix.basename(source.path), relativePath: relativePath(asset, source), fileType: source.role,
              filePath: uploaded.url, fileSize: source.bytes, loadOrder: index, metadata: { ...metadata, sha256: source.sha256, preparedPath: source.path } }).returning({ id: threedModelFiles.id });
            if (source.role === 'model') primaryId = file.id;
          }
          if (!primaryId) throw new Error('Recovery primary File was not created.');
          await tx.update(threedModels).set({ mainModelFileId: primaryId }).where(and(eq(threedModels.id, model.id), eq(threedModels.userId, options.userId)));
          await tx.insert(projectAssets).values({ userId: options.userId, projectId: created.id, moduleId: module.id, moduleType: 'threed', assetType: 'threed_models', assetId: model.id, isActive: true, config: {} });
          mapped.push({ key: asset.key, modelId: model.id });
        }
        const markers = markerInput(mapped);
        if (markers.length) await tx.insert(projectThreedMarkers).values(markers.map(marker => ({ userId: options.userId, projectId: created.id, threedId: module.id,
          markerType: 'models' as const, sourceAssetId: marker.assetId, markerId: marker.markerId, name: marker.name,
          positionX: marker.position.x.toFixed(3), positionY: marker.position.y.toFixed(3), positionZ: marker.position.z.toFixed(3), positionSource: 'asset' as const,
          color: marker.color, icon: marker.icon, label: marker.label, isVisible: true, isActive: true, data: marker.data, metadata: marker.metadata, savedAt: createdAt })));
        const receipt: LegacyRecoveryReceipt = { version: 1, fingerprint: pkg.fingerprint, userId: options.userId, projectId: created.id, threedId: module.id, models: mapped, markerCount: markers.length, operation: 'created' };
        const viewState = parseThreeDProjectViewState({ version: 1, savedAt: createdAt.toISOString(), viewMode: 'design', panelHeight: 50, cameraMode: 'stationary',
          design: { ...defaultDesignWorkspace(), levelId: imported.levels[0].id }, workspace: { selectedMarkerId: null, panel: 'assets', assetSearch: '', assetType: 'all' } });
        const [stored] = await tx.update(project).set({ config: { threeDArchitecture: architecture, threeDViewState: viewState }, metadata: { ...metadata, legacyRecoveryReceipt: receipt } })
          .where(and(eq(project.id, created.id), eq(project.userId, options.userId))).returning({ config: project.config });
        if (!stored || canonical(readProjectArchitecture(stored.config)) !== canonical(architecture)) throw new Error('Recovery architecture was not confirmed.');
        // Verify the complete relational result before commit; a mismatch rolls back every new DB record.
        const verified = await findCommitted(tx);
        if (!verified || verified.projectId !== created.id) throw new Error('Recovery records were not confirmed.');
        return receipt;
      }),
    });
  } finally { client.release(); await pool.end(); }
}
