import {
  loadThreeDModelImportFilePlan,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-import-file-plan.ts';
import {
  ThreeDModelImportManifestError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/threed/models/model-import-manifest-core.ts';

function readOption(args: string[], name: string): string | undefined {
  const inline = args.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const requestedFile = readOption(process.argv.slice(2), '--file');
  if (!requestedFile) throw new Error('Missing required --file <manifest.json> argument');
  const filePlan = await loadThreeDModelImportFilePlan(requestedFile);

  let modelBytes = 0;
  let previewBytes = 0;
  let supportingBytes = 0;
  let supportingFileCount = 0;
  for (const model of filePlan.models) {
    modelBytes += model.source.size;
    if (model.thumbnail) previewBytes += model.thumbnail.size;
    for (const supporting of model.supporting) {
      supportingBytes += supporting.size;
      supportingFileCount += 1;
    }
  }

  const uniqueCategories = new Set(filePlan.plan.models.flatMap((model) => model.categories));
  console.log(`ThreeD Model import manifest: ${filePlan.manifestPath}`);
  console.log(`Validated Models: ${filePlan.plan.models.length}`);
  console.log(`Referenced Categories: ${uniqueCategories.size}`);
  console.log(`Model bytes: ${modelBytes}`);
  console.log(`Preview bytes: ${previewBytes}`);
  console.log(`Supporting files: ${supportingFileCount}`);
  console.log(`Supporting bytes: ${supportingBytes}`);
  console.log('Dry run complete. No database connection was opened, no files were uploaded, and no records were written.');
}

main().catch((error: unknown) => {
  if (error instanceof ThreeDModelImportManifestError) {
    console.error(error.message);
    for (const issue of error.issues) console.error(`- ${issue}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
