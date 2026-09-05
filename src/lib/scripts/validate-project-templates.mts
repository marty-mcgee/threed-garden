import assert from 'node:assert/strict';

import {
  getProjectTemplate,
  PROJECT_TEMPLATE_KEYS,
  PROJECT_TEMPLATES,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../services/project/project-templates.ts';

const checks: Array<{ name: string; run: () => void }> = [
  {
    name: 'Project template keys and definitions remain unique and aligned',
    run: () => {
      assert.equal(new Set(PROJECT_TEMPLATE_KEYS).size, PROJECT_TEMPLATE_KEYS.length);
      assert.equal(new Set(PROJECT_TEMPLATES.map((template) => template.key)).size, PROJECT_TEMPLATES.length);
      assert.deepEqual(PROJECT_TEMPLATES.map((template) => template.key), [...PROJECT_TEMPLATE_KEYS]);
    },
  },
  {
    name: 'Blank Project creates no modules',
    run: () => assert.deepEqual(getProjectTemplate('blank')?.modules, []),
  },
  {
    name: 'ThreeD Starter creates only a ThreeD module foundation',
    run: () => assert.deepEqual(getProjectTemplate('threed-starter')?.modules, ['threed']),
  },
  {
    name: 'Complete App creates each supported module foundation exactly once',
    run: () => assert.deepEqual(
      getProjectTemplate('complete-app')?.modules,
      ['threed', 'traffic', 'music'],
    ),
  },
  {
    name: 'Unknown and malformed template identities fail closed',
    run: () => {
      assert.equal(getProjectTemplate('unknown'), null);
      assert.equal(getProjectTemplate(null), null);
      assert.equal(getProjectTemplate({ key: 'blank' }), null);
    },
  },
];

console.log('\nProject template contract validation');
console.log('────────────────────────────────────');
for (const check of checks) {
  check.run();
  console.log(`  ✓ ${check.name}`);
}
console.log('────────────────────────────────────');
console.log(`PASS  ${checks.length} validation groups completed`);
