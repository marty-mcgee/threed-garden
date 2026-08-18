import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = process.cwd();
const manifestPath = resolve(
  repositoryRoot,
  'src/lib/utils/externalCharacterAnimations.ts',
);
const manifestSource = readFileSync(manifestPath, 'utf8');
const configuredPaths = [
  ...manifestSource.matchAll(/filePath:\s*'([^']+)'/g),
].map((match) => match[1]);

if (configuredPaths.length === 0) {
  console.error('No static animation assets were found in the animation manifest.');
  process.exit(1);
}

const failures = [];

for (const filePath of configuredPaths) {
  const relativePath = `public/${filePath.replace(/^\/+/, '')}`;
  const absolutePath = resolve(repositoryRoot, relativePath);

  if (!existsSync(absolutePath)) {
    failures.push(`${filePath} (missing)`);
  }
}

if (failures.length > 0) {
  console.error('Invalid configured static animation assets:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Validated ${configuredPaths.length} configured static animation assets.`,
);
