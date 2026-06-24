// lib/config/navigation.client.ts
import { getClientSettings, isServiceEnabledClient } from './settings.client';
import { ALL_NAV_ITEMS, SECTION_CONFIG, type NavItem, type NavSection } from './navigation';

export function buildNavigationClient(): NavSection[] {
  const settings = getClientSettings();
  const sections: NavSection[] = [];

  (['traffic', 'threed', 'music'] as const).forEach((module) => {
    const moduleEnabled = settings.modules[module].enabled;
    if (!moduleEnabled) return;

    const moduleItems = ALL_NAV_ITEMS.filter(item => item.module === module);
    const enabledItems = moduleItems.filter(item => {
      if (!item.service) return true;
      return isServiceEnabledClient(module, item.service);
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