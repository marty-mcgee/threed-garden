/**
 * Local offline inspection artifacts, not a GLB exporter.
 * node --import tsx src/libraries/scripts/build-threed-cottage.ts --input dimensions.json --output ./cottage-output
 * Omit --input for defaults. Output must be a new or empty directory; files are never replaced.
 * Browser Builder export encodes PNGs and creates the portable textured GLB.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import * as path from 'node:path';
import { Mesh } from 'three';
import { createCottage } from '../services/threed/model-builder/cottage';
import { normalizeCottageParameters } from '../services/threed/model-builder/parameters';

async function main() {
  const args = process.argv.slice(2), options: Record<string,string> = {};
  if (args.includes('--help')) { console.log('Usage: node --import tsx src/libraries/scripts/build-threed-cottage.ts [--input dimensions.json] --output <new-or-empty-directory>\nWrites deterministic geometry.json, raw RGBA texture files and generation-report.json. GLB/PNG encoding requires the browser Builder.'); return; }
  for (let i = 0; i < args.length; i += 2) {
    if (!['--input','--output'].includes(args[i]) || !args[i+1] || args[i+1].startsWith('--') || options[args[i]]) throw new Error('Use optional --input <JSON file> and required --output <directory>, each once.');
    options[args[i]] = args[i+1];
  }
  if (!options['--output']) throw new Error('Missing --output <new-or-empty-directory>.');
  let parameters = normalizeCottageParameters();
  if (options['--input']) {
    const raw = await readFile(path.resolve(options['--input']));
    if (raw.byteLength > 64*1024) throw new Error('Cottage parameter JSON must be at most 64 KiB.');
    parameters = normalizeCottageParameters(JSON.parse(raw.toString('utf8')));
  }
  const output = path.resolve(options['--output']);
  await mkdir(output,{ recursive: true });
  if ((await readdir(output)).length) throw new Error('Output directory must be empty. Choose a new directory to preserve previous artifacts.');
  const bundle = createCottage(parameters);
  try {
    const artifacts: Array<{ path: string; mimeType: string; bytes: number; sha256: string }> = [];
    async function emit(relativePath: string, mimeType: string, bytes: Uint8Array) {
      await writeFile(path.join(output,relativePath),bytes,{ flag: 'wx' });
      artifacts.push({ path: relativePath, mimeType, bytes: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    const meshes = bundle.root.children.filter((node): node is Mesh => node instanceof Mesh).map(node => ({
      id: node.name, materialId: node.userData.builderMaterialId as string,
      attributes: Object.fromEntries(Object.entries(node.geometry.attributes).map(([name,attribute]) => [name,{ itemSize: attribute.itemSize, values: Array.from(attribute.array) }])),
      indices: Array.from(node.geometry.index!.array),
    }));
    await emit('geometry.json','application/json',Buffer.from(JSON.stringify({ outputUnits: 'metres', up: '+Y', front: '-Z', meshes })));
    await mkdir(path.join(output,'textures'));
    for (const texture of bundle.textures) await emit(`textures/${texture.id}.rgba`,'application/octet-stream',texture.pixels);
    const report = {
      reportVersion: 1, generator: bundle.identity, parameters: bundle.parameters, bounds: bundle.bounds, geometry: bundle.stats,
      output: 'Offline geometry and unencoded RGBA inspection artifacts. Export PNGs and textured GLB through the browser Builder.',
      textures: bundle.textures.map(t => ({ id: t.id, role: t.role, width: t.width, height: t.height, format: 'RGBA8', colorSpace: t.colorSpace, path: `textures/${t.id}.rgba` })),
      materials: bundle.materials.map(({ id,name,textureBindings,baseColor,roughness,metalness,opacity,doubleSided,normalScale,aoStrength }) => ({ id,name,textureBindings,baseColor,roughness,metalness,opacity,doubleSided,normalScale,aoStrength })),
      artifacts,
    };
    await writeFile(path.join(output,'generation-report.json'),`${JSON.stringify(report,null,2)}\n`,{ flag: 'wx' });
    console.log(`Generated ${bundle.stats.meshCount} named parts, ${bundle.stats.triangleCount} triangles and ${bundle.textures.length} raw textures in ${output}. Browser export is required for GLB.`);
  } finally { bundle.dispose(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Cottage generation failed.'); process.exitCode = 1; });
