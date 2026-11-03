/** Static presentation for the existing guide topics; database Markdown remains authoritative. */
export const guideIllustrations = {
  'first-project': {
    alt: 'Create an owned ThreeD Project, make one change, save and reopen to inspect it.',
    caption: 'Start with one small change you can save and verify.'
  },
  'draw-room': {
    alt: 'Connected walls become a finished floor and an open 3D room with a window.',
    caption: 'Draw architecture in Design and inspect the same room in the Scene.'
  },
  'add-model': {
    alt: 'One reusable House Model supplies two Project instances with independent placements.',
    caption: 'The Library holds reusable Models; Project Assets holds placed instances.'
  },
  'object-properties': {
    alt: 'A selected wall connects to Design Properties, with separate Metric and Imperial unit examples.',
    caption: 'Select the object before editing. A unit change does not resize it.'
  },
  'view-modes': {
    alt: 'Design combines Scene and editable plan; 3D shows the Scene; 2D shows a map; Combined shows Scene and map.',
    caption: 'Design contains the editable plan. The 2D surface is the geographic map.'
  },
  'save-reopen': {
    alt: 'Make a change, save the Project, wait for confirmation, then reopen and inspect the change.',
    caption: 'Explicit Save and reopen make a useful first verification.'
  },
  'design-json': {
    alt: 'Architectural JSON passes through import review with Merge or Replace architecture choices before Project Save.',
    caption: 'Review the import scope. Architectural JSON is not a complete Project backup.'
  },
  'model-files': {
    alt: 'Geometry and supporting files, Materials, loaded Model preview, Library thumbnail and Top View image have separate jobs.',
    caption: 'Inspect the actual loaded Model as well as its saved files and images.'
  },
  'ground-map': {
    alt: 'Ground Map alignment settings position a flat site image beneath existing House and Tree placements.',
    caption: 'Align the reference image around your placements, then save the Project.'
  },
  'character-actions': {
    alt: 'A Character, a selected Scene target and readiness checks lead to a supported Action.',
    caption: 'Character, target, compatible Animation and readiness must agree.'
  },
  'scenarios-simulations': {
    alt: 'Scenario guidance is separate from the Simulation path from saved definition through Actions to Results.',
    caption: 'Open Scenario provides guidance; Run Simulation executes supported Actions.'
  },
  'multimedia-lyrics': {
    alt: 'An eligible public Album contains ordered Tracks; independent active Lyrics use their saved assignments and ownership.',
    caption: 'Albums, Tracks and Lyrics retain their own relationships and visibility rules.'
  },
  'admin-navigation': {
    alt: 'Admin navigation leads to record management and eligible asset assignments for the Project workspace.',
    caption: 'Manage records in Admin; place and inspect assigned content in the Project.'
  },
  'app-settings': {
    alt: 'Shared Module appearance, account preferences and browser-local Settings are shown as three distinct scopes.',
    caption: 'Check who a setting affects and which Save control retains it.'
  },
  'manage-users': {
    alt: 'Super Admin account management includes creation, explicit profile or role saves, and protected soft deletion.',
    caption: 'Account management retains ownership boundaries and deletion protections.'
  },
  'project-multimedia': {
    alt: 'A Project Assets Album opens one Project Multimedia overlay with Track selection and playback controls.',
    caption: 'Project Assets and the Multimedia overlay share Album and Track selection.'
  },
  'top-modules': {
    alt: 'ThreeD App has four peer Top Modules: ThreeD, Multimedia, Traffic and Learn.',
    caption: 'Four peer Top Modules use the existing schema-defined relationships.'
  }
} as const;

export type GuideIllustrationTopic = keyof typeof guideIllustrations;

export function getGuideIllustration(topic: string) {
  if (!Object.hasOwn(guideIllustrations, topic)) return null;
  const key = topic as GuideIllustrationTopic;
  return {
    ...guideIllustrations[key],
    src: `/learn/illustrations/${key}.svg`,
    width: 1200,
    height: 640
  };
}
