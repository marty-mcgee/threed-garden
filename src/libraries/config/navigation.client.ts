'use client';

import {
  AlertTriangle, Radio, Car, Flame, BarChart3,
  Droplets, TrendingUp, Carrot,
  LayoutDashboard, Music, type LucideIcon
} from 'lucide-react';
import {
  defaultWorkspaceSettings,
  workspaceLinkDefinitions,
  workspaceLinkVisible,
  workspaceModules,
  type WorkspaceLinkKey,
  type WorkspaceModule,
  type WorkspaceSettings,
} from './workspace-settings';

interface NavItem {
  path: string;
  name: string;
  icon: LucideIcon;
  module: WorkspaceModule;
  service?: WorkspaceLinkKey;
}

interface NavSection {
  module: WorkspaceModule;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

// Menu order and icons are specific to this surface.
const linkIcons = {
  chpCad: AlertTriangle,
  bayArea511: Radio,
  caltrans: Car,
  calfire: Flame,
  chpHistorical: BarChart3,
  weather: Droplets,
  analytics: TrendingUp,
} satisfies Record<WorkspaceLinkKey, LucideIcon>;

const navigationLinks: NavItem[] = (Object.keys(linkIcons) as WorkspaceLinkKey[]).map(service => {
  const { path, label, module } = workspaceLinkDefinitions[service];
  return {
    path,
    name: service === 'analytics' ? 'Analytics' : label,
    icon: linkIcons[service],
    module,
    service,
  };
});

const sectionConfig = {
  traffic: {
    title: 'Traffic Services',
    icon: Car,
    overviewPath: '/dashboard/traffic',
  },
  threed: {
    title: 'ThreeD Garden',
    icon: Carrot,
    overviewPath: '/dashboard/scene',
  },
  multimedia: {
    title: 'Multimedia Library',
    icon: Music,
    overviewPath: '/dashboard/multimedia',
  },
} satisfies Record<WorkspaceModule, { title: string; icon: LucideIcon; overviewPath: `/${string}` }>;

export function buildNavigationClient(settings: WorkspaceSettings = defaultWorkspaceSettings()): NavSection[] {
  const sections: NavSection[] = [];

  workspaceModules.forEach((module) => {
    if (!settings.modules[module]) return;
    const { title, icon, overviewPath } = sectionConfig[module];
    const items = navigationLinks.filter(item => item.module === module && workspaceLinkVisible(settings, module, item.service));

    sections.push({
      module,
      title,
      icon,
      items: [
        {
          path: overviewPath,
          name: 'Overview',
          icon: LayoutDashboard,
          module,
        },
        ...items,
      ],
    });
  });

  return sections;
}
