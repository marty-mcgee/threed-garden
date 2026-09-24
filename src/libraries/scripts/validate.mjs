#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const scripts = 'src/libraries/scripts';
const nodeTs = ['node', '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--experimental-strip-types'];
const nodeReactServerTs = [
  'node',
  '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
  '--conditions=react-server',
  '--experimental-strip-types',
];

const node = (file) => ['node', `${scripts}/${file}`];
const ts = (file) => [...nodeTs, `${scripts}/${file}`];
const reactServerTs = (file) => [...nodeReactServerTs, `${scripts}/${file}`];

const tasks = {
  'shadcn-ui-boundary': [node('validate-shadcn-ui-boundary.mjs')],
  'dashboard-project-discovery': [node('validate-dashboard-project-discovery.cjs')],
  'dashboard-scene-route': [ts('validate-dashboard-scene-route.mts')],
  'workspace-settings': [
    node('validate-workspace-settings.cjs'),
    node('validate-workspace-settings-ui.cjs'),
  ],
  assets: [node('validate-static-assets.mjs')],
  'project-templates': [ts('validate-project-templates.mts')],

  'farmbot-crypto': [reactServerTs('validate-farmbot-credential-crypto.mts')],
  'farmbot-worker': [['node', '--import', 'tsx', 'src/libraries/services/threed/mqtt/integrations/farmbot/validate.mts']],
  'farmbot-mqtt-persistence': [ts('validate-farmbot-mqtt-persistence.mts')],
  'farmbot-command-policy': [ts('validate-farmbot-command-policy.mts')],

  'multimedia-admin-bulk': [node('validate-multimedia-admin-bulk.cjs')],
  'multimedia-admin-workspace': [node('validate-multimedia-admin-workspace.cjs')],
  'multimedia-s3': [node('validate-multimedia-s3.cjs')],
  'multimedia-speech-bulk': [node('validate-multimedia-speech-bulk.cjs')],
  'multimedia-speech-drafts': [node('validate-multimedia-speech-drafts.cjs')],
  'multimedia-speech-errors': [node('validate-multimedia-speech-errors.cjs')],
  'multimedia-speech-form': [node('validate-multimedia-speech-form.cjs')],
  'multimedia-speech-list': [node('validate-multimedia-speech-list.cjs')],
  'multimedia-speech-save': [node('validate-multimedia-speech-save.cjs')],
  'multimedia-speech-schema': [node('validate-multimedia-speech-schema.cjs')],
  'multimedia-speech-track': [node('validate-multimedia-speech-track.cjs')],
  'multimedia-speech-versions': [node('validate-multimedia-speech-versions.cjs')],
  'multimedia-speech': [node('validate-multimedia-speech.cjs')],
  'multimedia-track-delete': [node('validate-multimedia-track-delete.cjs')],

  'threed-hidden-collision-mount': [node('validate-threed-hidden-collision-mount.cjs')],
  'threed-ground-map': [ts('validate-threed-ground-map.mts')],
  'threed-bed-planting-bounds': [ts('validate-threed-bed-planting-bounds.mts')],
  'threed-runtime-markers': [['node', '--import', 'tsx', `${scripts}/validate-threed-runtime-markers.mts`]],
  'threed-inspectors': [['node', '--import', 'tsx', `${scripts}/validate-threed-inspectors.mts`]],
  'threed-sensors': [['node', '--import', 'tsx', `${scripts}/validate-threed-sensors.mts`], node('validate-threed-sensor-groups.cjs')],
  'threed-physics-events': [['node', '--import', 'tsx', `${scripts}/validate-threed-physics-events.mts`]],
  'threed-soccer-physics': [['node', '--import', 'tsx', `${scripts}/validate-threed-soccer-physics.mts`]],
  'threed-farmbot-live-state': [['node', '--import', 'tsx', `${scripts}/validate-threed-farmbot-live-state.mts`]],
  'threed-farmbot-coordinate-alignment': [['node', '--import', 'tsx', `${scripts}/validate-threed-farmbot-coordinate-alignment.mts`]],
  'threed-character-navigation': [
    ts('validate-threed-character-navigation.mts'),
    node('validate-threed-character-navigation-adapter.cjs'),
  ],
  'threed-character-teleport': [node('validate-threed-character-teleport.cjs')],
  'threed-orchestration': [ts('validate-threed-orchestration.mts')],
  'threed-library-placement': [ts('validate-threed-library-placement.mts')],
  'threed-scenarios': [ts('validate-threed-scenarios.mts')],
  'threed-library-collections': [ts('validate-threed-library-collections.mts')],
  'threed-project-session': [ts('validate-threed-project-session.mts')],
  'threed-mqtt': [['node', '--import', 'tsx', 'src/libraries/services/threed/mqtt/validate.mts']],
  'threed-model-import': [ts('validate-threed-model-import-contract.mts')],
  'threed-model-bulk-preparation': [ts('validate-threed-model-bulk-preparation.mts')],
  'threed-model-bulk-runner': [ts('validate-threed-model-bulk-runner.mts')],
  'threed-fbx-material-targets': [ts('validate-threed-fbx-material-targets.mts')],
  'threed-gltf-bundle': [ts('validate-threed-gltf-bundle.mts')],
  'threed-gltf-material-targets': [ts('validate-threed-gltf-material-targets.mts')],
  'threed-obj-bundle': [ts('validate-threed-obj-bundle.mts')],
  'threed-model-blob-paths': [ts('validate-threed-model-blob-paths.mts')],
  'threed-bulk-saved-texture': [ts('validate-threed-bulk-saved-texture.mts')],
  'threed-model-preview-batch': [node('validate-model-preview-batch.cjs'), ['node', '--import', 'tsx', `${scripts}/validate-model-preview-requirements.mts`]],
  'threed-model-bulk-preview': [ts('validate-threed-model-bulk-preview.mts')],
  'threed-model-list': [ts('validate-threed-model-list.mts')],
  'threed-animation-bulk': [node('validate-threed-animation-bulk.cjs')],
  'threed-character-animation-assignments': [node('validate-threed-character-animation-assignments.cjs')],
  'threed-animation-upload': [node('validate-threed-animation-upload.cjs')],
  'threed-assigned-character-animations': [node('validate-threed-assigned-character-animations.cjs')],
  'threed-animation-action-slots': [
    node('validate-threed-animation-action-slots.cjs'),
    node('validate-threed-animation-slots-workspace.cjs'),
  ],
  'threed-animation-presets': [
    node('validate-threed-animation-presets.cjs'),
    node('validate-threed-animation-presets-ui.cjs'),
  ],
  'threed-animation-categories': [
    node('validate-threed-animation-categories.cjs'),
    node('validate-threed-animation-categories-workspace.cjs'),
  ],
  'threed-animation-library': [node('validate-threed-animation-library.cjs')],
  'threed-model-list-api': [node('validate-threed-model-list-api.cjs')],
  'threed-database-failures': [node('validate-threed-database-failures.cjs')],
  'threed-character-position-save': [node('validate-threed-character-position-save.cjs')],
  'threed-character-preview-switch': [node('validate-threed-character-preview-switch.cjs')],
  'threed-character-animation-restart': [node('validate-threed-character-animation-restart.cjs')],
  'threed-harvest-list': [node('validate-threed-harvest-list.cjs')],
  'threed-watering-list': [node('validate-threed-watering-list.cjs')],
  'threed-farmbot-list': [node('validate-threed-farmbot-list.cjs')],
  'threed-layer-list': [node('validate-threed-layer-list.cjs')],
  'threed-character-list': [node('validate-threed-character-list.cjs')],
  'threed-planting-list': [node('validate-threed-planting-list.cjs')],
  'threed-bed-list': [node('validate-threed-bed-list.cjs')],
  'threed-plant-list': [node('validate-threed-plant-list.cjs')],
  'threed-category-list': [ts('validate-threed-category-list.mts')],
  'threed-texture-list': [ts('validate-threed-texture-list.mts')],
};

const ci = [
  'shadcn-ui-boundary',
  'assets',
  'workspace-settings',
  'threed-texture-list',
  'threed-watering-list',
  'threed-harvest-list',
  'threed-farmbot-list',
  'threed-layer-list',
  'threed-character-list',
  'threed-planting-list',
  'threed-bed-list',
  'threed-plant-list',
  'threed-category-list',
  'threed-model-list',
  'threed-animation-bulk',
  'threed-character-animation-assignments',
  'threed-animation-upload',
  'threed-animation-library',
  'threed-model-list-api',
  'threed-database-failures',
  'threed-character-position-save',
  'threed-assigned-character-animations',
  'threed-character-animation-restart',
  'threed-character-preview-switch',
  'threed-model-import',
  'threed-model-bulk-preparation',
  'threed-model-bulk-runner',
  'threed-gltf-bundle',
  'threed-gltf-material-targets',
  'threed-model-bulk-preview',
  'threed-obj-bundle',
  'threed-bulk-saved-texture',
  'threed-model-blob-paths',
  'threed-library-placement',
  'threed-project-session',
  'threed-runtime-markers',
  'threed-sensors',
  'threed-physics-events',
  'threed-soccer-physics',
  'threed-farmbot-live-state',
  'threed-farmbot-coordinate-alignment',
];

const unavailableFixtures = ['threed-fbx-material-targets'];
const runnableTasks = Object.keys(tasks).filter((name) => !unavailableFixtures.includes(name));

const groups = {
  all: runnableTasks,
  ci,
  dashboard: [
    'dashboard-project-discovery',
    'dashboard-scene-route',
    'workspace-settings',
    'project-templates',
    'threed-project-session',
  ],
  farmbot: Object.keys(tasks).filter((name) => name.startsWith('farmbot-') || name === 'threed-mqtt'),
  multimedia: Object.keys(tasks).filter((name) => name.startsWith('multimedia-')),
  threed: runnableTasks.filter((name) => name.startsWith('threed-')),
  'unavailable-fixtures': unavailableFixtures,
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const requested = args
  .filter((arg) => !arg.startsWith('--'))
  .flatMap((arg) => arg.split(','))
  .map((arg) => arg.replace(/^validate:/, '').trim())
  .filter(Boolean);

function printList() {
  console.log('Validation groups:');
  for (const [name, members] of Object.entries(groups)) {
    console.log(`  ${name.padEnd(12)} ${members.length} task${members.length === 1 ? '' : 's'}`);
  }
  console.log('\nValidation tasks:');
  for (const name of Object.keys(tasks)) console.log(`  ${name}`);
}

if (args.includes('--list')) {
  printList();
  process.exit(0);
}

if (requested.length === 0) {
  console.error('Choose one or more validation tasks or groups. Use --list to inspect available names.');
  process.exit(1);
}

const unknown = requested.filter((name) => !(name in tasks) && !(name in groups));
if (unknown.length > 0) {
  console.error(`Unknown validation selection: ${unknown.join(', ')}`);
  console.error('Use --list to inspect available names.');
  process.exit(1);
}

const selected = [];
for (const name of requested) {
  for (const task of groups[name] ?? [name]) {
    if (!selected.includes(task)) selected.push(task);
  }
}

console.log(`Running ${selected.length} validation task${selected.length === 1 ? '' : 's'}: ${selected.join(', ')}`);

for (const name of selected) {
  console.log(`\n━━ validate: ${name} ━━`);
  for (const command of tasks[name]) {
    console.log(`$ ${command.join(' ')}`);
    if (dryRun) continue;
    const result = spawnSync(command[0], command.slice(1), {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
    });
    if (result.error) {
      console.error(`Unable to start ${name}: ${result.error.message}`);
      process.exit(1);
    }
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

console.log(`\nPASS: ${selected.length} validation task${selected.length === 1 ? '' : 's'} completed.`);
