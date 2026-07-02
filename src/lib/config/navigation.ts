// lib/config/navigation.ts
import {
  MapPin,
  AlertTriangle,
  Radio,
  Car,
  Flame,
  BarChart3,
  ScanEye,
  Leaf,
  Box,
  BedDouble,
  Sprout,
  Calendar,
  Apple,
  Droplets,
  Cpu,
  TrendingUp,
  Activity,
  Carrot,
  LayoutDashboard,
  Music,
  Album,
  ListMusic,
  Link as LinkIcon,
  Image,
  Volume2,
  type LucideIcon
} from 'lucide-react';

export interface NavItem {
  path: string;
  name: string;
  icon: LucideIcon;
  color: string;
  module: 'traffic' | 'threed' | 'music';
  service?: string; // Optional: specific service within module
  enabled?: boolean; // Will be set by the navigation builder
}

export interface NavSection {
  module: 'traffic' | 'threed' | 'music';
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

// Define all possible navigation items with their module/service mapping
export const ALL_NAV_ITEMS: NavItem[] = [
  // Music
  { path: '/dashboard/music', name: 'Overview', icon: LayoutDashboard, color: 'orange', module: 'music' },
  { path: '/dashboard/music/albums', name: 'Albums', icon: Album, color: 'orange', module: 'music', service: 'albums' },
  { path: '/dashboard/music/tracks', name: 'Tracks', icon: ListMusic, color: 'orange', module: 'music', service: 'tracks' },
  { path: '/dashboard/music/links', name: 'Links', icon: LinkIcon, color: 'orange', module: 'music', service: 'links' },
  { path: '/dashboard/music/media', name: 'Media', icon: Image, color: 'orange', module: 'music', service: 'media' },
  
  // Traffic
  { path: '/dashboard/traffic', name: 'Overview', icon: LayoutDashboard, color: 'blue', module: 'traffic' },
  { path: '/dashboard/traffic/chp-live', name: 'CHP Live', icon: AlertTriangle, color: 'red', module: 'traffic', service: 'chpCad' },
  { path: '/dashboard/traffic/511org', name: 'Bay Area 511', icon: Radio, color: 'emerald', module: 'traffic', service: 'bayArea511' },
  { path: '/dashboard/traffic/caltrans', name: 'Caltrans', icon: Car, color: 'blue', module: 'traffic', service: 'caltrans' },
  { path: '/dashboard/traffic/calfire', name: 'CalFire', icon: Flame, color: 'orange', module: 'traffic', service: 'calfire' },
  { path: '/dashboard/traffic/chp-historical', name: 'CHP Historical', icon: BarChart3, color: 'purple', module: 'traffic', service: 'chpHistorical' },
  
  // ThreeD
  { path: '/dashboard/threed', name: 'Overview', icon: LayoutDashboard, color: 'green', module: 'threed' },
  { path: '/dashboard/threed/plants', name: 'Plants', icon: Leaf, color: 'green', module: 'threed', service: 'plants' },
  { path: '/dashboard/threed/models', name: 'Models', icon: Box, color: 'yellow', module: 'threed', service: 'models' },
  { path: '/dashboard/threed/characters', name: 'Characters', icon: Box, color: 'cyan', module: 'threed', service: 'characters' },
  { path: '/dashboard/threed/beds', name: 'Beds', icon: BedDouble, color: 'blue', module: 'threed', service: 'beds' },
  { path: '/dashboard/threed/plantings', name: 'Plantings', icon: Sprout, color: 'emerald', module: 'threed', service: 'plantings' },
  { path: '/dashboard/threed/tasks', name: 'Tasks', icon: Calendar, color: 'orange', module: 'threed', service: 'tasks' },
  { path: '/dashboard/threed/harvests', name: 'Harvests', icon: Apple, color: 'red', module: 'threed', service: 'harvests' },
  { path: '/dashboard/threed/weather', name: 'Weather', icon: Droplets, color: 'cyan', module: 'threed', service: 'weather' },
  { path: '/dashboard/threed/farmbots', name: 'FarmBots', icon: Cpu, color: 'purple', module: 'threed', service: 'farmbot' },
  { path: '/dashboard/threed/garden/analytics', name: 'Analytics', icon: TrendingUp, color: 'amber', module: 'threed', service: 'analytics' },
];

// Section configuration
export const SECTION_CONFIG: Record<'traffic' | 'threed' | 'music', { title: string; icon: LucideIcon }> = {
  traffic: { title: 'Traffic Services', icon: Car },
  threed: { title: 'ThreeD Garden', icon: Carrot },
  music: { title: 'Music Library', icon: Music },
};



// lib/config/navigation.ts (add these functions)

import { 
  getSettings, 
  isModuleEnabled, 
  isServiceEnabled, 
  type ModuleName 
} from './settings-old';


/**
 * Build navigation items based on current settings
 */
export function buildNavigation(): NavSection[] {
  const settings = getSettings();
  const sections: NavSection[] = [];

  // Process each module
  (['traffic', 'threed', 'music'] as ModuleName[]).forEach((module) => {
    const moduleEnabled = settings.modules[module].enabled;
    
    if (!moduleEnabled) return;

    // Get all items for this module
    const moduleItems = ALL_NAV_ITEMS.filter(item => item.module === module);
    
    // Filter items based on service settings
    const enabledItems = moduleItems.filter(item => {
      // Always show the overview (no service specified)
      if (!item.service) return true;
      
      // Check if the specific service is enabled
      return isServiceEnabled(module, item.service as any);
    });

    if (enabledItems.length === 0) return;

    sections.push({
      module,
      title: SECTION_CONFIG[module].title,
      icon: SECTION_CONFIG[module].icon,
      items: enabledItems,
    });
  });

  return sections;
}

/**
 * Get only enabled navigation items (flat list)
 */
export function getEnabledNavItems(): NavItem[] {
  const sections = buildNavigation();
  return sections.flatMap(section => section.items);
}

/**
 * Check if a path is in the navigation
 */
export function isNavPath(path: string): boolean {
  return ALL_NAV_ITEMS.some(item => item.path === path);
}

/**
 * Get the current nav section for a path
 */
export function getCurrentSection(path: string): NavSection | undefined {
  const sections = buildNavigation();
  return sections.find(section => 
    section.items.some(item => item.path === path)
  );
}