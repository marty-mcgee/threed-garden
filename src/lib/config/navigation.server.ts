// lib/config/navigation.server.ts
import 'server-only';
import {
  MapPin, AlertTriangle, Radio, Car, Flame, BarChart3,
  ScanEye, Leaf, Box, BedDouble, Sprout, Calendar, Apple,
  Droplets, Cpu, TrendingUp, Activity, Carrot,
  LayoutDashboard, Music, Album, ListMusic, Link as LinkIcon,
  Image, Volume2, type LucideIcon
} from 'lucide-react';
import { getServerSettings, isServiceEnabledServer } from './settings.server';
import type { ModuleName } from './settings';

export interface NavItem {
  path: string;
  name: string;
  icon: LucideIcon;
  color: string;
  module: 'traffic' | 'threed' | 'music';
  service?: string;
}

export interface NavSection {
  module: 'traffic' | 'threed' | 'music';
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

// All possible navigation items
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

export const SECTION_CONFIG: Record<'traffic' | 'threed' | 'music', { title: string; icon: LucideIcon }> = {
  traffic: { title: 'Traffic Services', icon: Car },
  threed: { title: 'ThreeD Garden', icon: Carrot },
  music: { title: 'Music Library', icon: Music },
};

/**
 * Build navigation items based on current settings - SERVER ONLY
 */
export function buildNavigationServer(): NavSection[] {
  const settings = getServerSettings();
  const sections: NavSection[] = [];

  (['traffic', 'threed', 'music'] as ModuleName[]).forEach((module) => {
    const moduleEnabled = settings.modules[module].enabled;
    if (!moduleEnabled) return;

    const moduleItems = ALL_NAV_ITEMS.filter(item => item.module === module);
    const enabledItems = moduleItems.filter(item => {
      if (!item.service) return true;
      return isServiceEnabledServer(module, item.service);
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