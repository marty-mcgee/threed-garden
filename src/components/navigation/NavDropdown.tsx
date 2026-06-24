// components/navigation/NavDropdown.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildNavigationClient } from '@/lib/config/navigation.client';
import type { NavSection } from '@/lib/config/navigation.client';
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
  const [sections, setSections] = useState<NavSection[]>([]);

  useEffect(() => {
    // Build navigation on the client
    setSections(buildNavigationClient());
  }, []);

  if (sections.length === 0) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(path) ?? false;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <span className="sr-only">Navigation Menu</span>
          <svg
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
      <DropdownMenuContent align="end" className="w-56">
        {sections.map((section, index) => (
          <div key={section.module}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2">
              <section.icon className="w-4 h-4" />
              <span>{section.title}</span>
            </DropdownMenuLabel>
            {section.items.map((item) => (
              <DropdownMenuItem key={item.path} asChild>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 pl-6",
                    isActive(item.path) && "bg-accent font-medium"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4",
                    isActive(item.path) ? `text-${item.color}-500` : "text-muted-foreground"
                  )} />
                  <span>{item.name}</span>
                  {isActive(item.path) && (
                    <ChevronRight className="w-3 h-3 ml-auto" />
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