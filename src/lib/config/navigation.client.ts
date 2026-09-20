// lib/config/navigation.client.ts
'use client';

import {
  MapPin, AlertTriangle, Radio, Car, Flame, BarChart3,
  ScanEye, Droplets, TrendingUp, Activity, Carrot,
  LayoutDashboard, Music, type LucideIcon
} from 'lucide-react';
import { defaultWorkspaceSettings, workspaceLinkVisible, workspaceModules, type WorkspaceSettings } from './workspace-settings';

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
  
  // Traffic
  { path: '/dashboard/traffic', name: 'Overview', icon: LayoutDashboard, color: 'blue', module: 'traffic' },
  { path: '/dashboard/traffic/chp-live', name: 'CHP Live', icon: AlertTriangle, color: 'red', module: 'traffic', service: 'chpCad' },
  { path: '/dashboard/traffic/511org', name: 'Bay Area 511', icon: Radio, color: 'emerald', module: 'traffic', service: 'bayArea511' },
  { path: '/dashboard/traffic/caltrans', name: 'Caltrans', icon: Car, color: 'blue', module: 'traffic', service: 'caltrans' },
  { path: '/dashboard/traffic/calfire', name: 'CalFire', icon: Flame, color: 'orange', module: 'traffic', service: 'calfire' },
  { path: '/dashboard/traffic/chp-historical', name: 'CHP Historical', icon: BarChart3, color: 'purple', module: 'traffic', service: 'chpHistorical' },
  
  // ThreeD
  { path: '/dashboard/map', name: 'Overview', icon: LayoutDashboard, color: 'green', module: 'threed' },
  { path: '/dashboard/threed/weather', name: 'Weather', icon: Droplets, color: 'cyan', module: 'threed', service: 'weather' },
  { path: '/dashboard/threed/garden/analytics', name: 'Analytics', icon: TrendingUp, color: 'amber', module: 'threed', service: 'analytics' },
];

export const SECTION_CONFIG: Record<'traffic' | 'threed' | 'music', { title: string; icon: LucideIcon }> = {
  traffic: { title: 'Traffic Services', icon: Car },
  threed: { title: 'ThreeD Garden', icon: Carrot },
  music: { title: 'Multimedia Library', icon: Music },
};

export function buildNavigationClient(settings: WorkspaceSettings = defaultWorkspaceSettings()): NavSection[] {
  const sections: NavSection[] = [];

  workspaceModules.forEach((module) => {
    const moduleEnabled = settings.modules[module];
    if (!moduleEnabled) return;

    const moduleItems = ALL_NAV_ITEMS.filter(item => item.module === module);
    const enabledItems = moduleItems.filter(item => {
      if (!item.service) return true;
      return workspaceLinkVisible(settings, module, item.service);
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
