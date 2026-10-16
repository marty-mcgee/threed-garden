'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, ChevronDown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceSettings } from '@/components/settings/WorkspaceSettingsProvider';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { cn } from '@/libraries/utils';
import { activeAdminHref, navSections, readSidebarToggles } from './admin-navigation';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
}

export function AdminSidebar({ isCollapsed, onToggle, isMobile = false, isOpen = true }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const owner = session?.user?.id;
  const storageKey = owner ? `threed:admin-sidebar:v1:${owner}` : null;
  const [stored, setStored] = useState<{ key: string | null; toggles: Record<string, boolean> } | null>(null);
  const { preferences } = useWorkspaceSettings();
  const activeHref = activeAdminHref(pathname);
  const collapsed = !isMobile && isCollapsed;
  const visibleSections = navSections.filter(section => !section.module || preferences.modules[section.module]);
  const ready = stored !== null && stored.key === storageKey;
  const toggles = ready ? stored.toggles : {};

  useEffect(() => {
    let toggles = {};
    try { if (storageKey) toggles = readSidebarToggles(localStorage.getItem(storageKey)); } catch { /* Storage is optional. */ }
    setStored({ key: storageKey, toggles });
    const sync = (event: StorageEvent) => {
      if (storageKey && (event.key === storageKey || event.key === null)) {
        setStored({ key: storageKey, toggles: readSidebarToggles(event.newValue) });
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [storageKey]);

  function toggle(key: string, current: boolean) {
    const next = { ...toggles, [key]: !current };
    setStored({ key: storageKey, toggles: next });
    try { if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Retain session choices when storage is unavailable. */ }
  }

  return (
    <aside aria-label="Admin sidebar" hidden={isMobile && !isOpen} className={cn(
      'fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-border bg-background/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#111A28]/95',
      collapsed ? 'w-16' : 'w-64', isMobile && !isOpen && 'hidden',
    )}>
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        {!collapsed && <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-lg font-bold text-transparent">ThreeD Garden</span>}
        <Button variant="ghost" size="icon" onClick={onToggle} aria-label={isMobile ? 'Close Admin navigation' : collapsed ? 'Expand Admin navigation' : 'Collapse Admin navigation'} className="ml-auto">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav aria-label="Admin navigation" className="min-h-0 flex-1 overflow-y-auto py-2">
        {ready && <ul className="space-y-1 px-2">
          {visibleSections.map(section => {
            const Icon = section.icon;
            const active = section.items.some(item => item.children ? item.children.some(child => child.href === activeHref) : item.href === activeHref);
            const open = toggles[section.title] ?? active;
            if (collapsed) return <li key={section.title}>
              <Button variant={active ? 'default' : 'ghost'} className="h-9 w-full px-0" title={section.title} aria-label={'Open ' + section.title + ' navigation'} onClick={() => { if (!open) toggle(section.title, false); onToggle(); }}>
                <Icon className="h-4 w-4" />
              </Button>
            </li>;
            return <li key={section.title}>
              <Button variant="ghost" aria-expanded={open} onClick={() => toggle(section.title, open)} className={cn('h-9 w-full justify-between gap-2 px-3', active && 'bg-primary/10 font-medium text-primary')}>
                <span className="flex min-w-0 items-center gap-2"><Icon className="h-4 w-4 shrink-0" /><span>{section.title}</span></span>
                {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              </Button>
              {open && <ul className="ml-3 mt-1 space-y-0.5 border-l border-border pl-2 dark:border-white/10">
                {section.items.map(item => {
                  const ItemIcon = item.icon;
                  const itemActive = item.children ? item.children.some(child => child.href === activeHref) : item.href === activeHref;
                  const groupOpen = toggles[item.href] ?? itemActive;
                  const content = <><ItemIcon className="h-4 w-4 shrink-0" /><span className="min-w-0 whitespace-normal text-left">{item.title}</span></>;
                  return <li key={item.href}>
                    {item.children ? <>
                      <Button variant="ghost" aria-expanded={groupOpen} onClick={() => toggle(item.href, groupOpen)} className={cn('h-auto min-h-8 w-full justify-start gap-2 px-2 py-1.5 text-sm', itemActive && 'bg-primary/10 text-primary')}>
                        {content}{groupOpen ? <ChevronDown className="ml-auto h-3 w-3 shrink-0" /> : <ChevronRight className="ml-auto h-3 w-3 shrink-0" />}
                      </Button>
                      {groupOpen && <ul className="ml-2 space-y-0.5 border-l border-border pl-1 dark:border-white/10">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const selected = child.href === activeHref;
                          return <li key={child.href}><Button asChild variant="ghost" className={cn('h-auto min-h-7 w-full justify-start gap-2 px-2 py-1 text-xs', selected ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                            <Link href={child.href} aria-current={selected ? 'page' : undefined}><ChildIcon className="h-3.5 w-3.5 shrink-0" /><span className="whitespace-normal">{child.title}</span></Link>
                          </Button></li>;
                        })}
                      </ul>}
                    </> : <Button asChild variant={itemActive ? 'default' : 'ghost'} className="h-auto min-h-8 w-full justify-start gap-2 px-2 py-1.5 text-sm">
                      <Link href={item.href} aria-current={itemActive ? 'page' : undefined}>{content}</Link>
                    </Button>}
                  </li>;
                })}
              </ul>}
            </li>;
          })}
        </ul>}
      </nav>
      <div className="shrink-0 space-y-1 border-t p-2">
        <Button asChild variant="ghost" className={cn('h-9 w-full justify-start gap-3 text-muted-foreground', collapsed && 'justify-center px-0')}>
          <Link href="/" aria-label="Go to Site" title={collapsed ? 'Go to Site' : undefined}><Home className="h-4 w-4 shrink-0" />{!collapsed && <span>Go to Site</span>}</Link>
        </Button>
        <SignOutButton variant="ghost" size={collapsed ? 'icon' : 'default'} showLabel={!collapsed} className={cn('h-9 w-full justify-start gap-3', collapsed && 'justify-center px-0')} />
      </div>
    </aside>
  );
}
