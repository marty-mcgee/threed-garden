import { LayoutDashboard, FolderOpen, Plus, Star, Box, Carrot, Package, Hammer, FolderTree, Image, Clapperboard, Boxes, Building2, Layers, User, FlaskConical, ClipboardList, BookOpen, Sprout, Cuboid, Bean, ListTodo, Droplets, Drone, Car, AlertTriangle, FileText, TrafficCone, Grid3x2, Camera, Flame, Radio, Music, DiscAlbum, Music2, MicVocal, Link2, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WorkspaceModule } from '@/libraries/config/workspace-settings';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean; // ✅ If true, only match exact path (not children)
  relatedPaths?: string[];
  children?: Array<{
    exact?: boolean;
    title: string;
    href: string;
    icon: LucideIcon;
  }>;
}

export interface NavSection {
  title: string;
  module?: WorkspaceModule;
  icon: LucideIcon;
  items: NavItem[];
}

// ✅ Complete navigation with exact matching for root paths
export const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { title: 'Overview', href: '/admin', icon: Star, exact: true },
    ],
  },
  {
    title: 'Projects',
    icon: FolderOpen,
    items: [
      { title: 'All Projects', href: '/admin/projects', icon: Star, exact: false },
      { title: 'Create New', href: '/admin/projects/new', icon: Plus, exact: true },
    ],
  },
  {
    title: 'ThreeD',
    module: 'threed',
    icon: Box,
    items: [
      { title: 'Overview', href: '/admin/threed', icon: Carrot, exact: true },
      {
        title: 'Models',
        href: '/admin/threed/models',
        icon: Package,
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
          { title: 'All Models', href: '/admin/threed/models', icon: Star },
          { title: 'Create Model', href: '/admin/threed/models/new', icon: Plus },
          { title: 'Model Builder', href: '/admin/threed/models/builder', icon: Hammer },
          { title: 'Files', href: '/admin/threed/model-files', icon: FolderOpen },
          { title: 'Categories', href: '/admin/threed/model-categories', icon: FolderTree },
          { title: 'Textures', href: '/admin/threed/model-textures', icon: Image },
          { title: 'Animations', href: '/admin/threed/animations', icon: Clapperboard },
          { title: 'Animation Categories', href: '/admin/threed/animation-categories', icon: FolderTree },
          { title: 'Animation Slots', href: '/admin/threed/animation-slots', icon: Clapperboard },
          { title: 'Assembly Groups', href: '/admin/threed/assembly-groups', icon: Boxes },
        ],
      },
      { title: 'Designs', href: '/admin/threed/designs', icon: Building2 },
      { title: 'Characters', href: '/admin/threed/characters', icon: User, exact: false },
      { title: 'Plants', href: '/admin/threed/plants', icon: Sprout, exact: false },
      { title: 'Beds', href: '/admin/threed/beds', icon: Cuboid, exact: false },
      { title: 'Plantings', href: '/admin/threed/plantings', icon: Bean, exact: false },
      { title: 'Scenarios', href: '/admin/threed/scenarios', icon: BookOpen, exact: false },
      { 
        title: 'Simulations', 
        href: '/admin/threed/simulations', 
        icon: FlaskConical, 
        exact: false,
        relatedPaths: [
          '/admin/threed/simulation-results',
        ],
        children: [
          { title: 'All Simulations', href: '/admin/threed/simulations', icon: Star },
          { title: 'Create Simulation', href: '/admin/threed/simulations/new', icon: Plus },
          { title: 'Simulation Results', href: '/admin/threed/simulation-results', icon: ClipboardList },
        ]
      },
      { title: 'Layers', href: '/admin/threed/layers', icon: Layers, exact: false },
      { title: 'Tasks', href: '/admin/threed/tasks', icon: ListTodo, exact: false },
      { title: 'Waterings', href: '/admin/threed/watering-schedules', icon: Droplets, exact: false },
      { title: 'Harvests', href: '/admin/threed/harvests', icon: Carrot, exact: false },
      { title: 'FarmBots', href: '/admin/threed/farmbots', icon: Drone, exact: false },
    ],
  },
  {
    title: 'Traffic',
    module: 'traffic',
    icon: Car,
    items: [
      { title: 'Overview', href: '/admin/traffic', icon: Car, exact: true },
      { title: 'CHP-CAD Incidents', href: '/admin/traffic/chp-cad', icon: AlertTriangle, exact: false },
      { title: 'CHP Cases', href: '/admin/traffic/chp-cases', icon: FileText, exact: false },
      { title: 'CHP Centers', href: '/admin/traffic/chp-centers', icon: Building2, exact: false },
      { title: 'Caltrans Closures', href: '/admin/traffic/caltrans', icon: TrafficCone, exact: false },
      { title: 'Caltrans Districts', href: '/admin/traffic/caltrans-districts', icon: Grid3x2, exact: false },
      { title: 'Caltrans CCTV', href: '/admin/traffic/caltrans-cctv', icon: Camera, exact: false },
      { title: 'CalFire Incidents', href: '/admin/traffic/calfire', icon: Flame, exact: false },
      { title: 'Bay Area 511', href: '/admin/traffic/bay-area-511', icon: Radio, exact: false },
    ],
  },
  {
    title: 'Multimedia',
    module: 'multimedia',
    icon: Music,
    items: [
      { title: 'Overview', href: '/admin/multimedia', icon: Music, exact: true },
      { title: 'Albums', href: '/admin/multimedia/albums', icon: DiscAlbum, exact: false },
      { title: 'Tracks', href: '/admin/multimedia/tracks', icon: Music2, exact: false },
      { title: 'Lyrics', href: '/admin/multimedia/lyrics', icon: FileText, exact: false },
      { title: 'Speech', href: '/admin/multimedia/speech', icon: MicVocal, exact: false, children: [
        { title: 'All Speeches', href: '/admin/multimedia/speech', icon: Star, exact: false },
        { title: 'New Speech', href: '/admin/multimedia/speech/new', icon: Plus, exact: true },
      ] },
      { title: 'Media', href: '/admin/multimedia/media', icon: Image, exact: false },
      { title: 'Links', href: '/admin/multimedia/links', icon: Link2, exact: false },
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
