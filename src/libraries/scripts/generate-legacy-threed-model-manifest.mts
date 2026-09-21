import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  parseThreeDModelImportManifest,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-import-manifest-core.ts';

const PILOT_CATEGORIES: Record<string, string[]> = {
  barbecue: ['garden', 'outdoor', 'equipment'],
  bench: ['garden', 'outdoor', 'furniture'],
  birchTreeWithLeaves: ['garden', 'plants', 'trees'],
  dirt: ['garden', 'landscape'],
  fenceGrid: ['garden', 'structures', 'fencing'],
  fenceGridGate: ['garden', 'structures', 'fencing'],
  flowerBox: ['garden', 'plants', 'containers'],
  flowers: ['garden', 'plants', 'flowers'],
  pumpkin: ['garden', 'plants', 'produce'],
  saplingTree: ['garden', 'plants', 'trees'],
};

function readOption(args: string[], name: string): string | undefined {
  const inline = args.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function titleCase(name: string) {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

async function main() {
  const args = process.argv.slice(2);
  const source = readOption(args, '--source');
  const output = readOption(args, '--output');
  if (!source || !output) {
    throw new Error('Required arguments: --source <legacy-home-design> --output <manifest.json>');
  }

  const sourceRoot = path.resolve(process.cwd(), source);
  const outputPath = path.resolve(process.cwd(), output);
  const objectsDirectory = path.join(sourceRoot, 'objects');
  if (path.dirname(outputPath) !== objectsDirectory) {
    throw new Error('Pilot manifest output must be written directly inside the legacy objects directory');
  }

  const [objectFiles, primaryMetadata, supplementalMetadata] = await Promise.all([
    readdir(objectsDirectory),
    readFile(path.join(sourceRoot, 'api/objects.json'), 'utf8'),
    readFile(path.join(sourceRoot, 'api/objects-1.json'), 'utf8'),
  ]);
  const availableFiles = new Set(objectFiles);
  const metadata = {
    ...JSON.parse(primaryMetadata) as Record<string, Record<string, unknown>>,
    ...JSON.parse(supplementalMetadata) as Record<string, Record<string, unknown>>,
  };

  async function dependenciesFor(name: string) {
    const sourceText = await readFile(path.join(objectsDirectory, `${name}.obj`), 'utf8');
    const materialFiles = [...sourceText.matchAll(/^mtllib\s+(.+)$/gmi)]
      .flatMap((match) => match[1].trim().split(/\s+/));
    const textures: string[] = [];
    for (const materialFile of materialFiles) {
      if (!availableFiles.has(materialFile)) throw new Error(`${name} references missing ${materialFile}`);
      const materialText = await readFile(path.join(objectsDirectory, materialFile), 'utf8');
      for (const line of materialText.split(/\r?\n/)) {
        const match = line.match(/^\s*(?:map_\w+|bump|disp|decal)\s+(.+)$/i);
        if (!match) continue;
        const texture = match[1].trim().split(/\s+/).at(-1)?.replace(/^"|"$/g, '') ?? '';
        if (!availableFiles.has(texture)) throw new Error(`${name} references missing ${texture}`);
        textures.push(texture);
      }
    }
    return [...new Set([...materialFiles, ...textures])].map((file) => `./${file}`);
  }

  const models = await Promise.all(Object.entries(PILOT_CATEGORIES).map(async ([name, categories]) => {
    if (!availableFiles.has(`${name}.obj`) || !availableFiles.has(`${name}_top.png`) || !metadata[name]) {
      throw new Error(`${name} is not a complete OBJ, preview, and metadata bundle`);
    }
    return {
      importKey: `legacy-home-design/${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll('_', '-').toLowerCase()}-v1`,
      modelName: titleCase(name),
      modelType: 'obj',
      sourceFile: `./${name}.obj`,
      thumbnailFile: `./${name}_top.png`,
      supportingFiles: await dependenciesFor(name),
      categories,
      metadata: {
        sourceCollection: 'legacy-threed/demo-home-design',
        legacyAssetName: name,
        author: metadata[name].author,
        license: metadata[name].license,
        originalDimensions: metadata[name].size,
        originalDimensionUnit: 'unverified',
        importReviewStatus: 'pre-import',
      },
    };
  }));

  const manifest = parseThreeDModelImportManifest({
    version: 1,
    defaults: { isPublic: false, isLibraryItem: true, isActive: true, status: 'active' },
    models,
  });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'w' });
  console.log(`Wrote ${manifest.models.length} validated pilot entries to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
