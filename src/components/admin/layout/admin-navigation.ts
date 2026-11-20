import { FolderTree, LayoutDashboard, Mountain, Star, Plus, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { moduleManagementRoutes, type ModuleKey } from '@/libraries/config/module-appearance';
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
        href: moduleManagementRoutes.users,
        moduleKey: 'users',
      },
      { title: 'Add User', href: '/admin/users/new', icon: Plus, action: 'create', exact: true },
    ],
  },
  {
    title: 'Projects',
    moduleKey: 'projects',
    items: [
      { title: 'All Projects', href: moduleManagementRoutes.projects, moduleKey: 'projects', exact: false },
      { title: 'Add Project', href: '/admin/projects/new', icon: Plus, action: 'create', exact: true },
    ],
  },
  {
    title: 'ThreeD',
    module: 'threed',
    moduleKey: 'threed',
    items: [
      { title: 'Overview', href: moduleManagementRoutes.threed, moduleKey: 'threed', exact: true },
      {
        title: 'Models',
        href: moduleManagementRoutes.models,
        moduleKey: 'models',
        exact: false,
        relatedPaths: [
          moduleManagementRoutes.assemblyGroups,
          moduleManagementRoutes.modelCategories,
          moduleManagementRoutes.modelFiles,
          moduleManagementRoutes.modelTextures,
          moduleManagementRoutes.animations,
          moduleManagementRoutes.animationSlots,
          moduleManagementRoutes.animationCategories,
        ],
        children: [
          { title: 'All Models', href: moduleManagementRoutes.models, moduleKey: 'models' },
          { title: 'Add Model', href: '/admin/threed/models/new', icon: Plus, action: 'create', exact: true },
          { title: 'Model Builder', href: moduleManagementRoutes.modelBuilder, moduleKey: 'modelBuilder' },
          { title: 'Files', href: moduleManagementRoutes.modelFiles, moduleKey: 'modelFiles' },
          { title: 'Categories', href: moduleManagementRoutes.modelCategories, moduleKey: 'modelCategories' },
          { title: 'Textures', href: moduleManagementRoutes.modelTextures, moduleKey: 'modelTextures' },
          {
            title: 'Assembly Groups',
            href: moduleManagementRoutes.assemblyGroups,
            moduleKey: 'assemblyGroups',
          },
          { title: 'Animations', href: moduleManagementRoutes.animations, moduleKey: 'animations' },
          { title: 'Animation Categories', href: moduleManagementRoutes.animationCategories, moduleKey: 'animationCategories' },
          { title: 'Animation Slots', href: moduleManagementRoutes.animationSlots, moduleKey: 'animationSlots' },
        ],
      },
      { title: 'Terrains', href: '/admin/threed/terrains', icon: Mountain, exact: false },
      { title: 'Designs', href: moduleManagementRoutes.designs, moduleKey: 'designs' },
      { title: 'Characters', href: moduleManagementRoutes.characters, moduleKey: 'characters', exact: false },
      { title: 'Scenarios', href: moduleManagementRoutes.scenarios, moduleKey: 'scenarios', exact: false },
      {
        title: 'Simulations',
        href: moduleManagementRoutes.simulations,
        moduleKey: 'simulations',
        exact: false,
        relatedPaths: [
          moduleManagementRoutes.simulationResults,
        ],
        children: [
          { title: 'All Simulations', href: moduleManagementRoutes.simulations, moduleKey: 'simulations' },
          { title: 'Add Simulation', href: '/admin/threed/simulations/new', icon: Plus, action: 'create', exact: true },
          { title: 'Simulation Results', href: moduleManagementRoutes.simulationResults, moduleKey: 'simulationResults' },
        ]
      },
      { title: 'Layers', href: moduleManagementRoutes.layers, moduleKey: 'layers', exact: false },
      { title: 'Plants', href: moduleManagementRoutes.plants, moduleKey: 'plants', exact: false },
      { title: 'Plantings', href: moduleManagementRoutes.plantings, moduleKey: 'plantings', exact: false },
      { title: 'Beds', href: moduleManagementRoutes.beds, moduleKey: 'beds', exact: false },
      { title: 'Waterings', href: moduleManagementRoutes.waterings, moduleKey: 'waterings', exact: false },
      { title: 'Harvests', href: moduleManagementRoutes.harvests, moduleKey: 'harvests', exact: false },
      { title: 'FarmBots', href: moduleManagementRoutes.farmbots, moduleKey: 'farmbots', exact: false },
      { title: 'Tasks', href: moduleManagementRoutes.tasks, moduleKey: 'tasks', exact: false },
    ],
  },
  {
    title: 'Traffic',
    module: 'traffic',
    moduleKey: 'traffic',
    items: [
      { title: 'Overview', href: moduleManagementRoutes.traffic, moduleKey: 'traffic', exact: true },
      { title: 'CHP-CAD Incidents', href: moduleManagementRoutes.chpCad, moduleKey: 'chpCad', exact: false },
      { title: 'CHP Cases', href: moduleManagementRoutes.chpCases, moduleKey: 'chpCases', exact: false },
      { title: 'CHP Centers', href: moduleManagementRoutes.chpCenters, moduleKey: 'chpCenters', exact: false },
      { title: 'Caltrans Closures', href: moduleManagementRoutes.caltrans, moduleKey: 'caltrans', exact: false },
      { title: 'Caltrans Districts', href: moduleManagementRoutes.caltransDistricts, moduleKey: 'caltransDistricts', exact: false },
      { title: 'Caltrans CCTV', href: moduleManagementRoutes.caltransCctv, moduleKey: 'caltransCctv', exact: false },
      { title: 'CalFire Incidents', href: moduleManagementRoutes.calfire, moduleKey: 'calfire', exact: false },
      { title: 'Bay Area 511', href: moduleManagementRoutes.bayArea511, moduleKey: 'bayArea511', exact: false },
    ],
  },
  {
    title: 'Multimedia',
    module: 'multimedia',
    moduleKey: 'multimedia',
    items: [
      { title: 'Overview', href: moduleManagementRoutes.multimedia, moduleKey: 'multimedia', exact: true },
      { title: 'Albums', href: moduleManagementRoutes.albums, moduleKey: 'albums', exact: false },
      { title: 'Tracks', href: moduleManagementRoutes.tracks, moduleKey: 'tracks', exact: false },
      { title: 'Lyrics', href: moduleManagementRoutes.lyrics, moduleKey: 'lyrics', exact: false },
      { title: 'Speech', href: moduleManagementRoutes.speech, moduleKey: 'speech', exact: false, children: [
        { title: 'All Speeches', href: moduleManagementRoutes.speech, moduleKey: 'speech', exact: false },
        { title: 'Add Speech', href: '/admin/multimedia/speech/new', icon: Plus, action: 'create', exact: true },
      ] },
      { title: 'Media', href: moduleManagementRoutes.media, moduleKey: 'media', exact: false },
      { title: 'Links', href: moduleManagementRoutes.links, moduleKey: 'links', exact: false },
    ],
  },
  {
    title: 'Learn',
    moduleKey: 'learn',
    items: [
      { title: 'All Guides', href: moduleManagementRoutes.learn, moduleKey: 'learn', documentNavigation: true },
      { title: 'Add Guide', href: '/admin/learn/new', icon: Plus, action: 'create', exact: true, documentNavigation: true },
      { title: 'Categories', href: '/admin/learn/categories', icon: FolderTree, exact: true, documentNavigation: true },
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
