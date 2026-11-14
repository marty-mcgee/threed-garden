// Actual public Project captures shared by Home and Dashboard.
export const PROJECT_SHOWCASE = [
  {
    id: 17,
    title: 'ThreeD Plan Demo: Fun House',
    theme: 'Explore an architectural idea',
    description: 'See buildings and a structural frame alongside the linked Design plan.',
    featured_image: '/home/showcase/project-design.png',
    alt: 'Actual Fun House Project showing a house and structural frame above its linked Design plan.',
  },
  {
    id: 5,
    title: 'ThreeD Garden Project',
    theme: 'Arrange a space',
    description: 'Explore a garden setting with buildings, reusable Models and a corresponding plan.',
    featured_image: '/home/showcase/garden-project.png',
    alt: 'Actual Garden Project with buildings and garden Models in a 3D Scene above their Design footprints.',
  },
  {
    id: 15,
    title: 'ThreeD Soccer',
    theme: 'Discover an interactive Scene',
    description: 'Look around a soccer Project with Characters, a field and Terrain. Available interactions depend on the Project setup.',
    featured_image: '/home/showcase/soccer-project.png',
    alt: 'Actual Soccer Project showing the field, Characters and raised Terrain above the linked plan.',
  },
];

// All captured Project defaults; Home retains its curated three-card showcase.
export const PROJECT_CAPTURES = [
  ...PROJECT_SHOWCASE,
  {
    id: 16,
    title: 'ThreeD Physics: Bouncy Castle v001',
    featured_image: '/home/showcase/bouncy-castle-project.png',
    alt: 'Actual Bouncy Castle Project showing a soccer field, walls and architectural elements above its Design plan.',
  },
  {
    id: 14,
    title: 'ThreeD App Tour',
    featured_image: '/home/showcase/app-tour-project.png',
    alt: 'Actual App Tour Project showing a Character and Terrain on a soccer field above its linked Design plan.',
  },
  {
    id: 8,
    title: 'ThreeD Farm Project',
    featured_image: '/home/showcase/farm-project.png',
    alt: 'Actual Farm Project showing its 3D Scene above the linked Design plan.',
  },
];
