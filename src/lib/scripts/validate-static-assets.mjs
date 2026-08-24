import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = process.cwd();
let completedValidationSteps = 0;
const validationStep = (label) => {
  completedValidationSteps += 1;
  console.log(`  ✓ ${label}`);
};

console.log('\nThreeD static asset validation');
console.log('─'.repeat(40));
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
validationStep(`Animation manifest contains ${configuredPaths.length} configured assets`);

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
validationStep('Every configured asset exists under public/');

const requiredDracoDecoderPaths = [
  '/assets/draco/draco_decoder.js',
  '/assets/draco/draco_decoder.wasm',
  '/assets/draco/draco_wasm_wrapper.js',
];

for (const filePath of requiredDracoDecoderPaths) {
  const relativePath = `public/${filePath.replace(/^\/+/, '')}`;
  if (!existsSync(resolve(repositoryRoot, relativePath))) {
    failures.push(`${filePath} (missing)`);
  }
}

if (failures.length > 0) {
  console.error('Invalid configured ThreeD static assets:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}
validationStep('Required GLTF DRACO decoder assets exist under public/');

console.log('─'.repeat(40));
console.log(`PASS  ${completedValidationSteps} validation groups completed`);
console.log(
  `Validated ${configuredPaths.length} animation assets and ${requiredDracoDecoderPaths.length} DRACO decoder assets.\n`,
);
