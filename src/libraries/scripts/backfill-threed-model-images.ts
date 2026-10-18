/** One-time, owner-scoped legacy image backfill. Default mode never connects. */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PoolClient } from 'pg';

export interface ImagePair {
  asset: string;
  thumbnail: string | null;
  topView: string | null;
  topViewBytes: number | null;
}
export interface ModelRow {
  id: number;
  model_name: string;
  legacy_asset_name: string | null;
  thumbnail_url: string | null;
  image_top_view_url: string | null;
  has_external_files: boolean | null;
}
export interface ImageChange {
  model: ModelRow;
  pair: ImagePair;
  thumbnail: string | null;
  topView: string | null;
}

export async function scanImages(folder: string, baseUrl: string): Promise<ImagePair[]> {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw Error('--base-url must be a public HTTPS directory URL without credentials/query/hash');
  }
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  const files = new Set((await readdir(folder, { withFileTypes: true }))
    .filter(entry => entry.isFile()).map(entry => entry.name));
  const assets = [...new Set([...files].filter(file => file.endsWith('.png'))
    .map(file => file.replace(/(?:_top)?\.png$/, '')))].sort();
  const result: ImagePair[] = [];
  for (const asset of assets) {
    const top = `${asset}_top.png`, thumb = `${asset}.png`;
    if (top.length > 255 || `top-view/${top}`.length > 500
      || [top,thumb].some(file=>new URL(encodeURIComponent(file),base).href.length > 500)) {
      throw Error(`Image path exceeds Model File limits: ${asset}`);
    }
    let topViewBytes: number | null = null;
    for (const file of [thumb, top].filter(file => files.has(file))) {
      const absolute = path.join(folder, file), info = await stat(absolute);
      if (info.size < 33 || info.size > 4 * 1024 * 1024) throw Error(`Invalid PNG size: ${file}`);
      const bytes = await readFile(absolute);
      if (!Buffer.from([137,80,78,71,13,10,26,10]).equals(bytes.subarray(0,8))
        || bytes.toString('ascii',12,16) !== 'IHDR'
        || bytes.readUInt32BE(16) < 1 || bytes.readUInt32BE(16) > 4096
        || bytes.readUInt32BE(20) < 1 || bytes.readUInt32BE(20) > 4096) {
        throw Error(`Invalid PNG header/dimensions: ${file}`);
      }
      if (file === top) topViewBytes = info.size;
    }
    result.push({ asset, thumbnail: files.has(thumb) ? new URL(encodeURIComponent(thumb),base).href : null,
      topView: files.has(top) ? new URL(encodeURIComponent(top),base).href : null, topViewBytes });
  }
  if (!result.length) throw Error('No PNG image candidates found');
  return result;
}

export function planImages(pairs: ImagePair[], models: ModelRow[], mapping: Record<string, number> = {}) {
  const changes: ImageChange[] = [], unmatched: string[] = [], seen = new Set<number>();
  for (const key of Object.keys(mapping)) {
    if (!pairs.some(pair => pair.asset === key) || !Number.isSafeInteger(mapping[key]) || mapping[key] < 1) {
      throw Error(`Invalid explicit mapping: ${key}`);
    }
  }
  for (const pair of pairs) {
    const matches = models.filter(model => Object.hasOwn(mapping,pair.asset)
      ? model.id === mapping[pair.asset] : model.legacy_asset_name === pair.asset);
    if (matches.length > 1) throw Error(`Ambiguous owned Model match: ${pair.asset}`);
    if (!matches.length) {
      if (Object.hasOwn(mapping,pair.asset)) throw Error(`Mapped Model not found for this owner: ${pair.asset}`);
      unmatched.push(pair.asset); continue;
    }
    const model = matches[0];
    if (seen.has(model.id)) throw Error(`Multiple assets map to Model ${model.id}`);
    seen.add(model.id);
    // NULL and the empty string are empty; preserve every other existing value.
    const thumbnail = !model.thumbnail_url ? pair.thumbnail : null;
    const topView = !model.image_top_view_url ? pair.topView : null;
    if (thumbnail || topView) changes.push({ model, pair, thumbnail, topView });
  }
  return { changes, unmatched, matched: seen.size };
}

export async function applyChanges(client: Pick<PoolClient,'query'>, userId: string, changes: ImageChange[]) {
  for (const change of changes) {
    const { model, pair, thumbnail, topView } = change;
    const locked = await client.query<ModelRow>(
      `SELECT id, model_name, metadata->>'legacyAssetName' AS legacy_asset_name,
       thumbnail_url, image_top_view_url, has_external_files
       FROM threed_models WHERE id=$1 AND user_id=$2 FOR UPDATE`, [model.id,userId]);
    const current = locked.rows[0];
    if (!current || current.thumbnail_url !== model.thumbnail_url
      || current.image_top_view_url !== model.image_top_view_url
      || current.legacy_asset_name !== model.legacy_asset_name) throw Error(`Model ${model.id} changed; preview again`);
    if (topView) {
      const attached = await client.query(
        `SELECT id FROM threed_model_files WHERE model_id=$1 AND user_id=$2
         AND file_type='top-view' AND file_path=$3`, [model.id,userId,topView]);
      if (!attached.rows.length) await client.query(
        `INSERT INTO threed_model_files
         (user_id,model_id,file_name,relative_path,file_type,file_path,file_size,is_binary_buffer,load_order)
         VALUES ($1,$2,$3,$4,'top-view',$5,$6,false,0)`,
        [userId,model.id,`${pair.asset}_top.png`,`top-view/${pair.asset}_top.png`,topView,pair.topViewBytes]);
    }
    const updated = await client.query(
      `UPDATE threed_models SET
       thumbnail_url=CASE WHEN $3::text IS NOT NULL AND (thumbnail_url IS NULL OR thumbnail_url='') THEN $3 ELSE thumbnail_url END,
       image_top_view_url=CASE WHEN $4::text IS NOT NULL AND (image_top_view_url IS NULL OR image_top_view_url='') THEN $4 ELSE image_top_view_url END,
       has_external_files=CASE WHEN $4::text IS NOT NULL THEN true ELSE has_external_files END,
       updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING id`, [model.id,userId,thumbnail,topView]);
    if (updated.rowCount !== 1) throw Error(`Model ${model.id} update failed`);
  }
}

async function main(args: string[]) {
  if (args.includes('--help')) {
    console.log('backfill-threed-model-images.ts --base-url <https://host/home-design/objects/> --report <new.json> [--folder <path>] [--mapping <asset-to-model-id.json>] [--user-id <owner> --preview-db | --user-id <owner> --apply]');
    return;
  }
  const values = new Map<string,string>(), flags = new Set<string>();
  for (let i=0;i<args.length;i++) {
    const arg=args[i];
    if (['--apply','--preview-db'].includes(arg)) { flags.add(arg); continue; }
    if (!['--folder','--base-url','--report','--user-id','--mapping'].includes(arg)
      || !args[i+1] || args[i+1].startsWith('--') || values.has(arg)) throw Error(`Invalid/duplicate argument: ${arg}`);
    values.set(arg,args[++i]);
  }
  if (flags.size > 1) throw Error('Choose --preview-db or --apply');
  const base=values.get('--base-url'), report=values.get('--report'), owner=values.get('--user-id');
  if (!base || !report) throw Error('--base-url and --report are required (see --help)');
  if (flags.size && !owner?.trim()) throw Error('--user-id is required for database modes');
  const folder=path.resolve(values.get('--folder') ?? 'public/home-design/objects');
  const pairs=await scanImages(folder,base);
  const mapping: Record<string,number> = values.has('--mapping')
    ? JSON.parse(await readFile(values.get('--mapping')!,'utf8')) : {};
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) throw Error('Mapping must be an asset-to-Model-ID JSON object');
  const output=path.resolve(report);
  // Refuse to overwrite a prior preview/receipt. Reserve report before DB access.
  await writeFile(output,JSON.stringify({ status:'inventory',folder,pairs },null,2)+'\n',{flag:'wx'});
  if (!flags.size) { console.log(`Offline inventory: ${pairs.length} assets. Report: ${output}`); return; }
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is required for database modes');
  const { default: pg } = await import('pg');
  const pool=new pg.Pool({ connectionString:process.env.DATABASE_URL, max:1, connectionTimeoutMillis:10000 });
  let client: PoolClient | undefined;
  try {
    client=await pool.connect();
    await client.query(flags.has('--apply') ? 'BEGIN' : 'BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout='30s'");
    await client.query("SET LOCAL lock_timeout='5s'");
    const models=await client.query<ModelRow>(
      `SELECT id,model_name,metadata->>'legacyAssetName' AS legacy_asset_name,
       thumbnail_url,image_top_view_url,has_external_files FROM threed_models WHERE user_id=$1 ORDER BY id`,[owner]);
    if (!models.rows.length) throw Error('No Models found for this owner');
    const plan=planImages(pairs,models.rows,mapping);
    const summary={ userId:owner, folder, ...plan };
    await writeFile(output,JSON.stringify({ status:'preview',...summary },null,2)+'\n');
    if (flags.has('--apply')) {
      await applyChanges(client,owner!,plan.changes);
      await writeFile(output,JSON.stringify({ status:'commit-pending',...summary },null,2)+'\n');
      await client.query('COMMIT');
      await writeFile(output,JSON.stringify({ status:'applied',...summary },null,2)+'\n');
    } else await client.query('ROLLBACK');
    console.log(`${flags.has('--apply')?'Applied':'Preview'}: ${plan.changes.length} Models; ${plan.unmatched.length} unmatched assets. Report: ${output}`);
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(()=>{});
    // Do not print driver messages/connection details; commit-pending needs manual review.
    throw Error(error instanceof Error && !('code' in error) ? error.message : 'Database operation failed; inspect the report and database before retrying');
  } finally { client?.release(); await pool.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error=>{ console.error(error instanceof Error ? error.message : 'Image backfill failed'); process.exitCode=1; });
}
