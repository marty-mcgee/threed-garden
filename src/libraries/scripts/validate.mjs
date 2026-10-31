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
  'threed-multimedia': [node('validate-threed-multimedia.cjs')],
  'threed-multimedia-browser': [node('validate-threed-multimedia-browser.cjs')],
  'threed-project-presentation-browser': [node('validate-project-presentation-browser.cjs')],
  'learn-data-structure': [
    [...node('generate-schema-visualization.cjs'), '--check'],
    node('validate-learn-data-structure.cjs'),
  ],
  'threed-albums': [node('validate-threed-albums.cjs'), node('validate-threed-albums-ui.cjs'), node('validate-threed-album-context.cjs')],
  learn: [node('validate-learn-guides.cjs'), node('validate-learn-admin-ui.cjs'), node('validate-learn-public.cjs')],
  'legacy-texture-download': [node('validate-legacy-texture-download.cjs')],
  'model-taxonomy': [node('validate-model-taxonomy.cjs')],
  'model-renaming': [node('validate-model-renaming.cjs'), node('validate-obj-title-names.cjs')],
  'obj-model-names': [node('validate-obj-model-names.cjs')],
  'admin-overview': [node('validate-admin-overview.cjs'), node('validate-admin-overview-review.cjs')],
  'multimedia-dashboard': [node('validate-multimedia-dashboard.cjs')],
  'multimedia-parent-moves': [node('validate-multimedia-parent-moves.cjs')],
  'multimedia-order-display': [node('validate-multimedia-order-display.cjs')],
  'multimedia-editor': [node('validate-multimedia-editor.cjs')],
  'multimedia-lyrics': [node('validate-multimedia-lyrics.cjs'), node('validate-multimedia-lyrics-ui.cjs'), node('validate-track-lyrics.cjs'), node('validate-public-lyrics.cjs')],
  'multimedia-authority': [node('validate-multimedia-authority.cjs')],
  'project-weather': [node('validate-project-weather.cjs')],
  'threed-model-image-backfill': [ts('validate-threed-model-image-backfill.mts')],
  'shadcn-ui-browser': [node('validate-shadcn-primitives-browser.cjs')],
  'repository-maintenance': [node('validate-repository-maintenance.cjs'), node('validate-farmbot-status-summary.cjs')],
  'design-appearance-top-view': [node('validate-model-top-view-export.cjs'), node('validate-design-appearance-top-view.cjs'), node('validate-model-top-view-compatibility.cjs')],
  'admin-sidebar': [node('validate-admin-sidebar.cjs')],
  'threed-designs': [node('validate-threed-designs.cjs'), node('validate-admin-designs.cjs')],
  'project-configurations': [node('validate-project-measurement-units.cjs'), node('validate-project-configurations-ui.cjs'), node('validate-project-multimedia-create.cjs')],
  'legacy-design-recovery': [node('validate-legacy-recovery-geometry.cjs'), node('validate-legacy-recovery-files.cjs'), node('validate-legacy-recovery-apply.cjs')],
  'threed-home-design': [node('validate-threed-home-design.cjs'), node('validate-design-sloped-walls.cjs')],
  'threed-home-design-browser': [node('validate-threed-home-design-browser.cjs')],
  'drizzle-workflow': [node('validate-drizzle-workflow.cjs')],
  'threed-browser-fbx-textures': [
    ['node', '--import', 'tsx', `${scripts}/validate-browser-fbx-textures.mts`],
    node('validate-threed-requirement-texture-link.cjs'),
  ],
  'application-foundations': [node('validate-application-foundations.cjs')],
  'theme-provider': [node('validate-theme-provider.cjs')],
  'workspace-access-panels': [node('validate-workspace-access-panels.cjs')],
  'character-library-design': [node('validate-character-library-design.cjs')],
  'render-failsafe': [node('validate-render-failsafe.cjs')],
  'threed-scene-resources': [node('validate-threed-scene-resources.cjs')],
  'shadcn-ui-boundary': [node('validate-shadcn-ui-boundary.mjs')],
  'dashboard-project-discovery': [node('validate-dashboard-project-discovery.cjs')],
  'dashboard-scene-route': [ts('validate-dashboard-scene-route.mts')],
  'signup': [node('validate-signup.cjs'),node('validate-signup-ui.cjs'),node('validate-signin-ui.cjs')],
  'users-admin': [node('validate-super-admin-bootstrap.cjs'),node('validate-user-roles.cjs'),node('validate-users-admin.cjs'),node('validate-users-admin-ui.cjs'),node('validate-user-access.cjs')],
  'module-appearance': [node('validate-module-appearance.cjs'),node('validate-module-appearance-ui.cjs')],
  'workspace-settings': [
    node('validate-workspace-settings.cjs'),
    node('validate-workspace-settings-ui.cjs'),
    node('validate-settings-sections.cjs'),
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
  'threed-character-introduction': [node('validate-threed-character-introduction.cjs')],
  'threed-ground-map': [ts('validate-threed-ground-map.mts')],
  'threed-bed-planting-bounds': [ts('validate-threed-bed-planting-bounds.mts')],
  'threed-runtime-markers': [['node', '--import', 'tsx', `${scripts}/validate-threed-runtime-markers.mts`]],
  'threed-overlay-layout': [node('validate-scene-selection.cjs'), node('validate-workspace-save-feedback.cjs'), node('validate-project-overlay-layout.cjs'), node('validate-project-presentation.cjs'), node('validate-scene-view-presets.cjs'), ['node', '--import', 'tsx', `${scripts}/validate-threed-project-settings.mts`]],
  'threed-inspectors': [['node', '--import', 'tsx', `${scripts}/validate-threed-inspectors.mts`]],
  'threed-sensors': [['node', '--import', 'tsx', `${scripts}/validate-threed-sensors.mts`], node('validate-threed-sensor-groups.cjs')],
  'threed-physics-events': [['node', '--import', 'tsx', `${scripts}/validate-threed-physics-events.mts`]],
  'threed-soccer-physics': [['node', '--import', 'tsx', `${scripts}/validate-threed-soccer-physics.mts`]],
  'threed-soccer-kick': [['node', '--import', 'tsx', `${scripts}/validate-threed-soccer-kick.mts`]],
  'threed-model-placement-physics': [node('validate-threed-model-placement-physics.cjs')],
  'threed-character-ball-contact': [node('validate-threed-character-ball-contact.cjs')],
  'threed-action-collision': [node('validate-threed-action-collision.cjs')],
  'threed-farmbot-live-state': [['node', '--import', 'tsx', `${scripts}/validate-threed-farmbot-live-state.mts`]],
  'threed-farmbot-coordinate-alignment': [['node', '--import', 'tsx', `${scripts}/validate-threed-farmbot-coordinate-alignment.mts`]],
  'threed-character-navigation': [
    ts('validate-threed-character-navigation.mts'),
    node('validate-threed-character-navigation-adapter.cjs'),
  ],
  'threed-character-teleport': [node('validate-threed-character-teleport.cjs')],
  'threed-orchestration': [ts('validate-threed-orchestration.mts')],
  'threed-library-placement': [ts('validate-threed-library-placement.mts'), node('validate-model-library-placement-overlay.cjs')],
  'threed-scenarios': [ts('validate-threed-scenarios.mts')],
  'threed-scenario-admin': [node('validate-threed-scenario-admin.cjs'), node('validate-threed-scenario-editor.cjs')],
  'threed-simulation-schema': [node('validate-threed-simulation-schema.cjs')],
  'threed-simulation-admin': [node('validate-threed-simulation-admin.cjs'), node('validate-threed-simulation-editor.cjs'), node('validate-threed-simulation-preview.cjs')],
  'threed-soccer-simulation': [node('validate-threed-soccer-simulation.cjs')],
  'threed-simulation-launch': [node('validate-threed-simulation-launch.cjs')],
  'threed-simulation-results': [node('validate-threed-simulation-results-schema.cjs'), node('validate-threed-simulation-results.cjs'), node('validate-threed-simulation-results-admin.cjs')],
  'threed-library-collections': [ts('validate-threed-library-collections.mts')],
  'threed-project-session': [['node', '--import', 'tsx', `${scripts}/validate-threed-project-session.mts`], node('validate-public-scene-api.cjs'), node('validate-project-asset-warnings.cjs'), ['node', '--import', 'tsx', `${scripts}/validate-scene-loading-policy.mts`]],
  'threed-mqtt': [['node', '--import', 'tsx', 'src/libraries/services/threed/mqtt/validate.mts']],
  'threed-assembly-persistence': [['node', '--conditions=react-server', '--import', 'tsx', `${scripts}/validate-assembly-persistence.mts`]],
  'threed-assembly-group': [ts('validate-assembly-group.mts')],
  'threed-model-import': [ts('validate-threed-model-import-contract.mts')],
  'threed-model-bulk-preparation': [ts('validate-threed-model-bulk-preparation.mts')],
  'threed-model-bulk-runner': [ts('validate-threed-model-bulk-runner.mts')],
  'threed-fbx-material-targets': [ts('validate-threed-fbx-material-targets.mts')],
  'threed-gltf-bundle': [ts('validate-threed-gltf-bundle.mts')],
  'threed-gltf-material-targets': [ts('validate-threed-gltf-material-targets.mts')],
  'threed-obj-bundle': [ts('validate-threed-obj-bundle.mts')],
  'threed-model-blob-paths': [ts('validate-threed-model-blob-paths.mts')],
  'threed-bulk-saved-texture': [ts('validate-threed-bulk-saved-texture.mts')],
  'threed-model-preview-batch': [ts('validate-model-texture-readiness.mts'), node('validate-model-preview-batch.cjs'), ['node', '--import', 'tsx', `${scripts}/validate-model-preview-requirements.mts`]],
  'threed-model-bulk-preview': [ts('validate-threed-model-bulk-preview.mts')],
  'threed-model-list': [ts('validate-threed-model-list.mts'), node('validate-model-list-url.cjs'), node('validate-admin-list-query.cjs')],
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
  'threed-model-admin-form': [node('validate-threed-model-admin-form.cjs')],
  'threed-model-builder': [node('validate-threed-model-builder.cjs'), node('validate-threed-model-builder-registration.cjs'), node('validate-threed-model-builder-ui.cjs')],
  'threed-model-builder-browser': [node('validate-threed-model-builder-browser.cjs')],
  'threed-model-pbr': [node('validate-model-pbr.cjs')],
  'threed-model-direct-upload': [ts('validate-threed-model-direct-upload.mts')],
  'threed-character-editor': [node('validate-threed-character-editor.cjs'), node('validate-character-admin-conventions.cjs')],
  'threed-model-file-requirements': [node('validate-threed-model-file-requirements.cjs')],
  'model-thumbnail-attachment': [node('validate-model-thumbnail-attachment.cjs')],
  'threed-model-embedded-images': [ts('validate-model-embedded-images.mts'), node('validate-model-embedded-images-api.cjs'), node('validate-model-embedded-image-registration.cjs'), node('validate-model-embedded-images-ui.cjs')],
  'threed-model-file-workspace': [node('validate-threed-model-file-workspace.cjs'), node('validate-model-file-preview.cjs')],
  'threed-model-editor-tabs': [node('validate-threed-model-editor-tabs.cjs'), node('validate-model-source.cjs')],
  'threed-model-file-list': [node('validate-threed-model-file-list.cjs')],
  'threed-model-restoration-eligibility': [node('validate-threed-model-restoration-eligibility.cjs')],
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
  'threed-multimedia',
  'learn-data-structure',
  'multimedia-lyrics',
  'admin-overview',
  'multimedia-dashboard',
  'multimedia-parent-moves',
  'multimedia-order-display',
  'multimedia-editor',
  'multimedia-authority',
  'project-weather',
  'repository-maintenance',
  'threed-designs',
  'project-configurations',
  'admin-sidebar',
  'learn',
  'design-appearance-top-view',
  'legacy-design-recovery',
  'drizzle-workflow',
  'threed-character-introduction',
  'application-foundations',
  'theme-provider',
  'workspace-access-panels',
  'character-library-design',
  'render-failsafe',
  'threed-scene-resources',
  'shadcn-ui-boundary',
  'assets',
  'workspace-settings',
  'module-appearance',
  'threed-albums',
  'users-admin',
  'signup',
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
  'threed-model-admin-form',
  'threed-model-builder',
  'threed-home-design',
  'threed-model-pbr',
  'threed-model-direct-upload',
  'threed-character-editor',
  'threed-model-file-requirements',
  'model-thumbnail-attachment',
  'threed-model-embedded-images',
  'threed-model-file-workspace',
  'threed-model-editor-tabs',
  'threed-model-file-list',
  'threed-model-restoration-eligibility',
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
  'threed-browser-fbx-textures',
  'threed-obj-bundle',
  'legacy-texture-download',
  'model-taxonomy',
  'model-renaming',
  'obj-model-names',
  'threed-bulk-saved-texture',
  'threed-model-blob-paths',
  'threed-library-placement',
  'threed-project-session',
  'threed-runtime-markers',
  'threed-sensors',
  'threed-physics-events',
  'threed-soccer-physics',
  'threed-soccer-kick',
  'threed-model-placement-physics',
  'threed-character-ball-contact',
  'threed-action-collision',
  'threed-scenario-admin',
  'threed-simulation-schema',
  'threed-simulation-admin',
  'threed-soccer-simulation',
  'threed-simulation-launch',
  'threed-overlay-layout',
  'threed-simulation-results',
  'threed-scenarios',
  'threed-farmbot-live-state',
  'threed-farmbot-coordinate-alignment',
];

const unavailableFixtures = ['threed-fbx-material-targets'];
// Native Chromium/WebGL is optional and intentionally separate from portable CI/all.
const runnableTasks = Object.keys(tasks).filter((name) => !unavailableFixtures.includes(name) && !['threed-model-builder-browser', 'threed-home-design-browser', 'shadcn-ui-browser', 'threed-multimedia-browser', 'threed-project-presentation-browser'].includes(name));

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
