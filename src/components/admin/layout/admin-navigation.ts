import { LayoutDashboard, Star, Plus, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModuleKey } from '@/libraries/config/module-appearance';
import type { WorkspaceModule } from '@/libraries/config/workspace-settings';

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  moduleKey?: ModuleKey;
  action?: 'create';
  documentNavigation?: boolean;
  exact?: boolean; // ✅ If true, only match exact path (not children)
  relatedPaths?: string[];
  children?: Array<{
    action?: 'create';
    exact?: boolean;
    title: string;
    href: string;
    icon?: LucideIcon;
    moduleKey?: ModuleKey;
  }>;
}

export interface NavSection {
  title: string;
  module?: WorkspaceModule;
  icon?: LucideIcon;
  moduleKey?: ModuleKey;
  items: NavItem[];
}

// ✅ Complete navigation with exact matching for root paths
// Module keys resolve saved App Settings; utility actions retain their own icons.
export const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { title: 'Overview', href: '/admin', icon: Star, exact: true },
    ],
  },
  {
    title: 'Users',
    moduleKey: 'users',
    items: [
      {
        title: 'All Users', 
        href:'/admin/users', 
        moduleKey: 'users',
      },
      { title: 'Add User', href: '/admin/users/new', icon: Plus, action: 'create', exact: true },
    ],
  },
  {
    title: 'Projects',
    moduleKey: 'projects',
    items: [
      { title: 'All Projects', href: '/admin/projects', moduleKey: 'projects', exact: false },
      { title: 'Add Project', href: '/admin/projects/new', icon: Plus, action: 'create', exact: true },
    ],
  },
  {
    title: 'ThreeD',
    module: 'threed',
    moduleKey: 'threed',
    items: [
      { title: 'Overview', href: '/admin/threed', moduleKey: 'threed', exact: true },
      {
        title: 'Models',
        href: '/admin/threed/models',
        moduleKey: 'models',
        exact: false,
        relatedPaths: [
          '/admin/threed/assembly-groups',
          '/admin/threed/model-categories',
          '/admin/threed/model-files',
          '/admin/threed/model-textures',
          '/admin/threed/animations',
          '/admin/threed/animation-slots',
          '/admin/threed/animation-categories',
        ],
        children: [
          { title: 'All Models', href: '/admin/threed/models', moduleKey: 'models' },
          { title: 'Add Model', href: '/admin/threed/models/new', icon: Plus, action: 'create', exact: true },
          { title: 'Model Builder', href: '/admin/threed/models/builder', moduleKey: 'modelBuilder' },
          { title: 'Files', href: '/admin/threed/model-files', moduleKey: 'modelFiles' },
          { title: 'Categories', href: '/admin/threed/model-categories', moduleKey: 'modelCategories' },
          { title: 'Textures', href: '/admin/threed/model-textures', moduleKey: 'modelTextures' },
          { title: 'Animations', href: '/admin/threed/animations', moduleKey: 'animations' },
          { title: 'Animation Categories', href: '/admin/threed/animation-categories', moduleKey: 'animationCategories' },
          { title: 'Animation Slots', href: '/admin/threed/animation-slots', moduleKey: 'animationSlots' },
          { title: 'Assembly Groups', href: '/admin/threed/assembly-groups', moduleKey: 'assemblyGroups' },
        ],
      },
      { title: 'Designs', href: '/admin/threed/designs', moduleKey: 'designs' },
      { title: 'Characters', href: '/admin/threed/characters', moduleKey: 'characters', exact: false },
      { title: 'Plants', href: '/admin/threed/plants', moduleKey: 'plants', exact: false },
      { title: 'Beds', href: '/admin/threed/beds', moduleKey: 'beds', exact: false },
      { title: 'Plantings', href: '/admin/threed/plantings', moduleKey: 'plantings', exact: false },
      { title: 'Scenarios', href: '/admin/threed/scenarios', moduleKey: 'scenarios', exact: false },
      { 
        title: 'Simulations', 
        href: '/admin/threed/simulations', 
        moduleKey: 'simulations',
        exact: false,
        relatedPaths: [
          '/admin/threed/simulation-results',
        ],
        children: [
          { title: 'All Simulations', href: '/admin/threed/simulations', moduleKey: 'simulations' },
          { title: 'Add Simulation', href: '/admin/threed/simulations/new', icon: Plus, action: 'create', exact: true },
          { title: 'Simulation Results', href: '/admin/threed/simulation-results', moduleKey: 'simulationResults' },
        ]
      },
      { title: 'Layers', href: '/admin/threed/layers', moduleKey: 'layers', exact: false },
      { title: 'Tasks', href: '/admin/threed/tasks', moduleKey: 'tasks', exact: false },
      { title: 'Waterings', href: '/admin/threed/watering-schedules', moduleKey: 'waterings', exact: false },
      { title: 'Harvests', href: '/admin/threed/harvests', moduleKey: 'harvests', exact: false },
      { title: 'FarmBots', href: '/admin/threed/farmbots', moduleKey: 'farmbots', exact: false },
    ],
  },
  {
    title: 'Traffic',
    module: 'traffic',
    moduleKey: 'traffic',
    items: [
      { title: 'Overview', href: '/admin/traffic', moduleKey: 'traffic', exact: true },
      { title: 'CHP-CAD Incidents', href: '/admin/traffic/chp-cad', moduleKey: 'chpCad', exact: false },
      { title: 'CHP Cases', href: '/admin/traffic/chp-cases', moduleKey: 'chpCases', exact: false },
      { title: 'CHP Centers', href: '/admin/traffic/chp-centers', moduleKey: 'chpCenters', exact: false },
      { title: 'Caltrans Closures', href: '/admin/traffic/caltrans', moduleKey: 'caltrans', exact: false },
      { title: 'Caltrans Districts', href: '/admin/traffic/caltrans-districts', moduleKey: 'caltransDistricts', exact: false },
      { title: 'Caltrans CCTV', href: '/admin/traffic/caltrans-cctv', moduleKey: 'caltransCctv', exact: false },
      { title: 'CalFire Incidents', href: '/admin/traffic/calfire', moduleKey: 'calfire', exact: false },
      { title: 'Bay Area 511', href: '/admin/traffic/bay-area-511', moduleKey: 'bayArea511', exact: false },
    ],
  },
  {
    title: 'Multimedia',
    module: 'multimedia',
    moduleKey: 'multimedia',
    items: [
      { title: 'Overview', href: '/admin/multimedia', moduleKey: 'multimedia', exact: true },
      { title: 'Albums', href: '/admin/multimedia/albums', moduleKey: 'albums', exact: false },
      { title: 'Tracks', href: '/admin/multimedia/tracks', moduleKey: 'tracks', exact: false },
      { title: 'Lyrics', href: '/admin/multimedia/lyrics', moduleKey: 'lyrics', exact: false },
      { title: 'Speech', href: '/admin/multimedia/speech', moduleKey: 'speech', exact: false, children: [
        { title: 'All Speeches', href: '/admin/multimedia/speech', moduleKey: 'speech', exact: false },
        { title: 'Add Speech', href: '/admin/multimedia/speech/new', icon: Plus, action: 'create', exact: true },
      ] },
      { title: 'Media', href: '/admin/multimedia/media', moduleKey: 'media', exact: false },
      { title: 'Links', href: '/admin/multimedia/links', moduleKey: 'links', exact: false },
    ],
  },
  {
    title: 'Learn',
    moduleKey: 'learn',
    items: [
      { title: 'All Guides', href: '/admin/learn', moduleKey: 'learn', documentNavigation: true },
      { title: 'Add Guide', href: '/admin/learn/new', icon: Plus, action: 'create', exact: true, documentNavigation: true },
      { title: 'Learn ThreeD', href: '/learn', moduleKey: 'learn', exact: true },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      { title: 'App Settings', href: '/admin/settings', icon: Settings, exact: true },
    ],
  },
];

export function activeAdminHref(pathname: string): string | null {
  return navSections.flatMap(section => section.items.flatMap(item => item.children ?? [item]))
    .filter(item => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}

export function readSidebarToggles(raw: string | null): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const allowed = new Set(navSections.flatMap(section => [section.title, ...section.items.filter(item => item.children).map(item => item.href)]));
    return Object.fromEntries(Object.entries(value).filter(([key, value]) => allowed.has(key) && typeof value === 'boolean'));
  } catch { return {}; }
}
