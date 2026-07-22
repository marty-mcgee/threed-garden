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
  LogOut,
  ChevronLeft,
  ChevronRight,
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
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Plus,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/auth/SignOutButton';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

// ✅ Complete navigation to ALL existing pages in your app
const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { title: 'Overview', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Projects',
    icon: FolderOpen,
    items: [
      { title: 'All Projects', href: '/admin', icon: FolderOpen },
      { title: 'Create New', href: '/admin/projects/new', icon: Plus },
    ],
  },
  {
    title: 'ThreeD',
    icon: Box,
    items: [
      { title: 'Plants', href: '/admin/threed/plants', icon: Sprout },
      { title: 'Beds', href: '/admin/threed/beds', icon: Box },
      { title: '3D Models', href: '/admin/threed/models', icon: Package },
      { title: 'Characters', href: '/admin/threed/characters', icon: User },
    ],
  },
  {
    title: 'Traffic',
    icon: Car,
    items: [
      { title: 'CHP-CAD Incidents', href: '/admin/traffic/chp-cad', icon: AlertTriangle },
      { title: 'CHP Cases', href: '/admin/traffic/chp-cases', icon: FileText },
      { title: 'Caltrans Closures', href: '/admin/traffic/caltrans', icon: Route },
      { title: 'CalFire Incidents', href: '/admin/traffic/calfire', icon: Flame },
      { title: 'Bay Area 511', href: '/admin/traffic/bay-area-511', icon: Radio },
    ],
  },
  {
    title: 'Music',
    icon: Music,
    items: [
      { title: 'Albums', href: '/admin/music/albums', icon: Music },
      { title: 'Tracks', href: '/admin/music/tracks', icon: Music2 },
      { title: 'Media', href: '/admin/music/media', icon: Image },
      { title: 'Links', href: '/admin/music/links', icon: Link2 },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      { title: 'Admin Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Dashboard': true,
    'Projects': true,
    'Music': true, // ✅ Music section expanded by default
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Auto-expand sections based on current path
    const currentSection = navSections.find(section => 
      section.items.some(item => pathname?.startsWith(item.href))
    );
    if (currentSection) {
      setExpandedSections(prev => ({
        ...prev,
        [currentSection.title]: true,
      }));
    }
  }, [pathname]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
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
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!isCollapsed && <span className="text-lg font-bold">Admin</span>}
          <Button variant="ghost" size="icon" className="ml-auto">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
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
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!isCollapsed && (
          <span className="text-lg font-bold">Admin</span>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navSections.map((section) => {
            const isExpanded = expandedSections[section.title] || false;
            const SectionIcon = section.icon;
            const hasActiveChild = section.items.some(item => isActive(item.href));

            // Collapsed mode - show only icons
            if (isCollapsed) {
              return (
                <li key={section.title} className="relative group">
                  <Button
                    variant={hasActiveChild ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-center px-0",
                      hasActiveChild && "bg-primary text-primary-foreground"
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
                    "w-full justify-between gap-3",
                    hasActiveChild && "bg-muted/50"
                  )}
                  onClick={() => toggleSection(section.title)}
                >
                  <span className="flex items-center gap-3">
                    <SectionIcon className="h-4 w-4 shrink-0" />
                    <span>{section.title}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 shrink-0" />
                  )}
                </Button>

                {isExpanded && (
                  <ul className="mt-1 space-y-1 pl-4">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Button
                            variant={active ? 'default' : 'ghost'}
                            className={cn(
                              "w-full justify-start gap-3 text-sm",
                              active && "bg-primary text-primary-foreground"
                            )}
                            onClick={() => router.push(item.href)}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
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
      <div className="border-t p-2 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
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
            className={cn(
              "w-full justify-start gap-3",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}