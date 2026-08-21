// components/admin/layout/AdminSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Box, 
  Car, 
  Music,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Home,
  Sprout,
  Package,
  User,
  AlertTriangle,
  FileText,
  Route,
  Flame,
  Radio,
  Music2,
  Image,
  Link2,
  Plus,
  Settings,
  CheckSquare,
  CheckCircle,
  Edit,
  Trash2,
  Loader2,
  ListTodo,
  MoreHorizontal,
  Search,
  Filter,
  Clock,
  X,
  Bean,
  Carrot,
  Droplets,
  Drone,
  Building2,
  Grid3x2,
  TrafficCone,
  Camera,
  Layers,
  MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/auth/SignOutButton';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean; // ✅ If true, only match exact path (not children)
}

interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

// ✅ Complete navigation with exact matching for root paths
const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { title: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Projects',
    icon: FolderOpen,
    items: [
      { title: 'All Projects', href: '/admin/projects', icon: FolderOpen, exact: false },
      { title: 'Create New', href: '/admin/projects/new', icon: Plus, exact: true },
    ],
  },
  {
    title: 'ThreeD',
    icon: Box,
    items: [
      { title: 'Overview', href: '/admin/threed', icon: Carrot, exact: true },
      { title: 'Plants', href: '/admin/threed/plants', icon: Sprout, exact: false },
      { title: 'Beds', href: '/admin/threed/beds', icon: Box, exact: false },
      { title: 'Plantings', href: '/admin/threed/plantings', icon: Bean, exact: false },
      { title: '3D Models', href: '/admin/threed/models', icon: Package, exact: false },
      { title: 'Characters', href: '/admin/threed/characters', icon: User, exact: false },
      { title: 'Layers', href: '/admin/threed/layers', icon: Layers, exact: false },
      { title: 'Tasks', href: '/admin/threed/tasks', icon: ListTodo, exact: false },
      { title: 'Waterings', href: '/admin/threed/watering-schedules', icon: Droplets, exact: false },
      { title: 'Harvests', href: '/admin/threed/harvests', icon: Carrot, exact: false },
      { title: 'Farmbots', href: '/admin/threed/farmbots', icon: Drone, exact: false },
    ],
  },
  {
    title: 'Traffic',
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
    title: 'Music',
    icon: Music,
    items: [
      { title: 'Overview', href: '/admin/music', icon: Music, exact: true },
      { title: 'Albums', href: '/admin/music/albums', icon: Music, exact: false },
      { title: 'Tracks', href: '/admin/music/tracks', icon: Music2, exact: false },
      { title: 'Media', href: '/admin/music/media', icon: Image, exact: false },
      { title: 'Links', href: '/admin/music/links', icon: Link2, exact: false },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      { title: 'Admin Settings', href: '/admin/settings', icon: Settings, exact: true },
    ],
  },
];

function getActiveNavItemHref(pathname: string): string | null {
  const matchingItems = navSections
    .flatMap((section) => section.items)
    .filter((item) => {
      if (item.exact) {
        return pathname === item.href;
      }

      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    })
    .sort((a, b) => b.href.length - a.href.length);

  return matchingItems[0]?.href ?? null;
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeItemHref = getActiveNavItemHref(pathname);

  // ✅ Determine which section should be expanded based on current path
  const getExpandedSections = () => {
    const expanded: Record<string, boolean> = {};
    
    navSections.forEach((section) => {
      const hasActiveChild = section.items.some((item) => item.href === activeItemHref);
      
      if (hasActiveChild) {
        expanded[section.title] = true;
      }
    });
    
    // ✅ Always expand Dashboard by default if nothing else is active
    if (Object.keys(expanded).length === 0) {
      expanded['Dashboard'] = true;
    }
    
    return expanded;
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // ✅ Initialize with correct expanded state based on current path
    if (typeof window !== 'undefined') {
      return getExpandedSections();
    }
    return { 'Dashboard': true };
  });

  // ✅ Update expanded sections when pathname changes
  useEffect(() => {
    setMounted(true);
    setExpandedSections(getExpandedSections());
  }, [pathname]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // ✅ Check if a nav item is active
  const isItemActive = (item: NavItem) => {
    return item.href === activeItemHref;
  };

  // ✅ Check if a section has any active child
  const hasActiveChild = (section: NavSection) => {
    return section.items.some((item) => isItemActive(item));
  };

  // Server-side placeholder
  if (!mounted) {
    return (
      <aside 
        className={cn(
          "flex flex-col h-screen bg-background border-r transition-all duration-300 fixed left-0 top-0 z-50",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-3">
          {!isCollapsed && <span className="text-lg font-bold">Admin</span>}
          <Button variant="ghost" size="icon" className="ml-auto">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="h-8 w-full rounded-md bg-muted/20 animate-pulse mb-1" />
              <div className="space-y-1 pl-4">
                {section.items.map((_, idx) => (
                  <div key={idx} className="h-7 w-3/4 rounded-md bg-muted/10 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-2 space-y-1">
          <div className="h-9 w-full rounded-md bg-muted/20 animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted/20 animate-pulse" />
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-background border-r transition-all duration-300 fixed left-0 top-0 z-50",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
        {!isCollapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin
          </span>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle}
          className="ml-auto hover:bg-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
        <ul className="space-y-1 px-2">
          {navSections.map((section) => {
            const isExpanded = expandedSections[section.title] || false;
            const SectionIcon = section.icon;
            const sectionHasActive = hasActiveChild(section);

            // Collapsed mode - show only icons
            if (isCollapsed) {
              return (
                <li key={section.title} className="relative group">
                  <Button
                    variant={sectionHasActive ? 'default' : 'ghost'}
                    className={cn(
                      "h-9 w-full justify-center px-0",
                      sectionHasActive && "bg-primary text-primary-foreground shadow-md"
                    )}
                    onClick={() => {
                      if (section.items.length > 0) {
                        router.push(section.items[0].href);
                      }
                    }}
                  >
                    <SectionIcon className="h-4 w-4 shrink-0" />
                  </Button>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {section.title}
                  </div>
                </li>
              );
            }

            // Expanded mode
            return (
              <li key={section.title}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 w-full justify-between gap-3 px-3",
                    sectionHasActive && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => toggleSection(section.title)}
                >
                  <span className="flex items-center gap-3">
                    <SectionIcon className={cn(
                      "h-4 w-4 shrink-0",
                      sectionHasActive && "text-primary"
                    )} />
                    <span>{section.title}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </Button>

                {isExpanded && (
                  <ul className="mt-1 space-y-0.5 pl-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item);
                      return (
                        <li key={item.href}>
                          <Button
                            variant={active ? 'default' : 'ghost'}
                            className={cn(
                              "h-8 w-full justify-start gap-3 px-3 text-sm",
                              active 
                                ? "bg-primary text-primary-foreground shadow-md" 
                                : "hover:bg-accent/50"
                            )}
                            onClick={() => router.push(item.href)}
                          >
                            <Icon className={cn(
                              "h-4 w-4 shrink-0",
                              active && "text-primary-foreground"
                            )} />
                            <span>{item.title}</span>
                            {active && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
                            )}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom of Sidebar */}
      <div className="border-t p-2 space-y-1 shrink-0">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-9",
            isCollapsed && "justify-center px-0"
          )}
          onClick={() => router.push('/')}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Go to Site</span>}
        </Button>
        <div className={cn(isCollapsed ? "flex justify-center" : "")}>
          <SignOutButton 
            variant="ghost" 
            size={isCollapsed ? "icon" : "default"} 
            showLabel={!isCollapsed}
            className={cn(
              "w-full justify-start gap-3 h-9",
              isCollapsed && "justify-center px-0"
            )}
          />
        </div>
      </div>
    </aside>
  );
}
