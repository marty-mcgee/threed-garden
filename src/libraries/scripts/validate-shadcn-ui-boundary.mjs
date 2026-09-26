#!/usr/bin/env node

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sourceRoot = path.join(root, 'src');
const uiRoot = path.join(sourceRoot, 'components', 'ui');
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts']);
const primitiveImportPattern = /(?:from\s*|import\s*\(|require\s*\()\s*['"](@radix-ui\/[^'"]+|radix-ui)['"]/g;

async function collectSourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(fullPath));
    } else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const componentsJson = JSON.parse(await fs.readFile(path.join(root, 'components.json'), 'utf8'));
const declaredDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.optionalDependencies,
  ...packageJson.peerDependencies,
};

assert.equal(
  typeof declaredDependencies['radix-ui'],
  'string',
  'package.json must declare radix-ui as the single direct UI primitive dependency',
);

const individualRadixDependencies = Object.keys(declaredDependencies)
  .filter((name) => name.startsWith('@radix-ui/'));
assert.deepEqual(
  individualRadixDependencies,
  [],
  `package.json must not declare individual Radix dependencies: ${individualRadixDependencies.join(', ')}`,
);

assert.equal(componentsJson.aliases?.ui, '@/components/ui', 'components.json must keep the shadcn UI alias');
assert.equal(componentsJson.aliases?.utils, '@/libraries/utils', 'components.json must keep the shared utility alias');
assert.equal(componentsJson.tailwind?.css, 'src/app/globals.css', 'components.json must keep the global Blueprint stylesheet');

const violations = [];
for (const filePath of await collectSourceFiles(sourceRoot)) {
  const source = await fs.readFile(filePath, 'utf8');
  const relativePath = path.relative(root, filePath);
  const isUiWrapper = filePath === uiRoot || filePath.startsWith(`${uiRoot}${path.sep}`);

  for (const match of source.matchAll(primitiveImportPattern)) {
    const dependency = match[1];
    if (dependency.startsWith('@radix-ui/')) {
      violations.push(`${relativePath}: individual primitive import ${dependency}`);
    } else if (!isUiWrapper) {
      violations.push(`${relativePath}: radix-ui import outside src/components/ui`);
    }
  }
}

assert.deepEqual(
  violations,
  [],
  `shadcn/ui dependency boundary violations:\n${violations.join('\n')}`,
);

console.log('✓ package.json uses one direct Radix primitive dependency');
console.log('✓ shadcn aliases and Blueprint stylesheet are configured');
console.log('✓ primitive imports are confined to src/components/ui');
console.log('PASS: shadcn/ui dependency boundary validated.');
