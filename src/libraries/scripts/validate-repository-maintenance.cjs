// Offline documentation/navigation and reproducible-install contracts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');

const files = ['README.md', 'AGENTS.md', 'CONTEXT.md', 'docs/README.md',
  'docs/agents/README.md', 'docs/releases/README.md',
  'docs/plans/repository-maintenance-2026-10-17.md',
  'docs/releases/history/2026-10-17/README.md'];
function headingIds(text) {
  const counts = new Map();
  const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, heading]) => {
    const id = heading.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-');
    const count = counts.get(id) || 0;
    counts.set(id, count + 1);
    return count ? `${id}-${count}` : id;
  });
  const explicit = [...text.matchAll(/<a\b[^>]*\b(?:id|name)\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(([, id]) => id);
  return new Set([...headings, ...explicit]);
}
let links = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /^# /, `${file} starts with its purpose, not release narration`);
  for (const [, destination] of text.matchAll(/\]\(([^\s)]+)\)/g)) {
    if (/^(?:[a-z]+:|\/)/i.test(destination)) continue;
    const [relative, hash] = destination.split('#');
    const target = relative ? path.resolve(path.dirname(file), decodeURIComponent(relative)) : path.resolve(file);
    assert(fs.existsSync(target), `${file}: missing ${destination}`);
    if (hash && target.endsWith('.md')) {
      assert(headingIds(fs.readFileSync(target, 'utf8')).has(decodeURIComponent(hash)), `${file}: missing heading ${destination}`);
    }
    links++;
  }
}
const readme = fs.readFileSync('README.md', 'utf8');
assert.match(readme, /^# 🥕 ThreeD App\n/);
const productImage = readme.indexOf('![ThreeD Garden');
const capabilities = readme.indexOf('## ✨ What can you create?');
assert(productImage >= 0 && capabilities > productImage, 'Approved product image precedes capabilities');
const homepage = fs.readFileSync('src/app/page.tsx', 'utf8');
assert.match(homepage, /id="garden-demo"/, 'Demo link corresponds to the existing Home anchor');
assert(fs.existsSync('src/app/learn/page.tsx'), 'Learn route exists');

const workflow = fs.readFileSync('.github/workflows/validation.yml', 'utf8');
assert.match(workflow, /run: npm ci\s/);
assert.match(workflow, /git diff --exit-code -- package-lock\.json/);
assert.match(workflow, /run: npm run typecheck/);
assert.match(workflow, /run: npm run validate -- ci/);
const manifest = JSON.parse(fs.readFileSync('package.json'));
const lock = JSON.parse(fs.readFileSync('package-lock.json'));
assert.equal(manifest.version, lock.version);
assert.equal(manifest.version, lock.packages[''].version);
const sharp = lock.packages['node_modules/@img/sharp-wasm32'];
assert(semver.satisfies(lock.packages['node_modules/@emnapi/runtime'].version,
  sharp.dependencies['@emnapi/runtime']), 'Optional Sharp runtime must have a compatible locked entry');
console.log(`PASS: ${links} documentation paths/anchors, product navigation and CI/optional-runtime lock contracts`);
