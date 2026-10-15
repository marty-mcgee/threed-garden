// components/navigation/NavDropdown.tsx
'use client';

import { useWorkspaceSettings } from '@/components/settings/WorkspaceSettingsProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Check, FolderOpen, Home } from 'lucide-react';
import { cn } from '@/libraries/utils';
import { buildNavigationClient } from '@/libraries/config/navigation.client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function NavDropdown() {
  const pathname = usePathname();
  const { preferences } = useWorkspaceSettings();
  const sections = buildNavigationClient(preferences);

  const primaryLinks = [
    { path: '/', name: 'Home', icon: Home },
    { path: '/dashboard', name: 'ThreeD Projects', icon: FolderOpen },
    { path: '/learn', name: 'Learn ThreeD', icon: BookOpen },
  ];
  const activePath = [...primaryLinks, ...sections.flatMap(section => section.items)]
    .filter(item => pathname === item.path || (item.path !== '/' && item.path !== '/dashboard' && pathname?.startsWith(item.path + '/')))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const isActive = (path: string) => path === activePath;
  const sectionColors = {
    threed: 'text-green-600 dark:text-green-400',
    traffic: 'text-sky-600 dark:text-sky-400',
    multimedia: 'text-violet-600 dark:text-violet-400',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative data-[state=open]:bg-accent" title="Navigation menu">
          <span className="sr-only">Navigation Menu</span>
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} collisionPadding={8} aria-label="ThreeD App navigation" className="threed-app-menu-surface w-72 max-w-[calc(100vw-1rem)] overscroll-contain rounded-xl p-2 shadow-lg">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground">Explore ThreeD</DropdownMenuLabel>
        {primaryLinks.map(item => (
          <DropdownMenuItem key={item.path} asChild>
            <Link href={item.path} aria-current={isActive(item.path) ? 'page' : undefined} className={cn('min-h-10 cursor-pointer gap-3 rounded-md px-3 py-2', isActive(item.path) && 'bg-green-500/10 font-medium text-green-700 dark:text-green-300')}>
              <item.icon className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <span className="flex-1">{item.name}</span>
              {isActive(item.path) && <Check className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" />}
            </Link>
          </DropdownMenuItem>
        ))}
        {sections.length > 0 && <DropdownMenuSeparator className="mx-1 my-2" />}
        {sections.map((section, index) => (
          <div key={section.module}>
            {index > 0 && <DropdownMenuSeparator className="mx-1 my-2" />}
            <DropdownMenuLabel className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <section.icon className={cn("size-4", sectionColors[section.module])} aria-hidden="true" />
              <span>{section.title}</span>
            </DropdownMenuLabel>
            {section.items.map((item) => (
              <DropdownMenuItem key={item.path} asChild>
                <Link
                  href={item.path}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                    isActive(item.path) && "bg-green-500/10 font-medium text-green-700 dark:text-green-300"
                  )}
                >
                  <item.icon className={cn(
                    "size-4",
                    sectionColors[section.module]
                  )} aria-hidden="true" />
                  <span>{item.name}</span>
                  {isActive(item.path) && (
                    <Check className="ml-auto size-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
