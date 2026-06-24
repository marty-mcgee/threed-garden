// components/navigation/NavMenu.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildNavigation, type NavSection } from '@/lib/config/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NavMenuProps {
  className?: string;
}

export function NavMenu({ className }: NavMenuProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['traffic', 'threed', 'music'])
  );
  
  const sections = buildNavigation();

  const toggleSection = (module: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(path) ?? false;
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-64 bg-background border-r min-h-screen p-4", className)}>
      <div className="space-y-6">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.module);
          const hasActiveItem = section.items.some(item => isActive(item.path));

          return (
            <div key={section.module} className="space-y-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.module)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  hasActiveItem && "bg-accent/50"
                )}
              >
                <section.icon className="w-4 h-4 mr-2" />
                <span className="flex-1 text-left">{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Section Items */}
              {isExpanded && (
                <div className="ml-4 space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.path);
                    const colorClasses = {
                      red: 'border-red-500 bg-red-50 dark:bg-red-950/20',
                      blue: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
                      green: 'border-green-500 bg-green-50 dark:bg-green-950/20',
                      emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
                      purple: 'border-purple-500 bg-purple-50 dark:bg-purple-950/20',
                      orange: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
                      yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
                      cyan: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20',
                      amber: 'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                    };

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          active && [
                            "border-l-4",
                            colorClasses[item.color as keyof typeof colorClasses] || 'border-primary bg-accent/50'
                          ]
                        )}
                      >
                        <item.icon className={cn(
                          "w-4 h-4 mr-2",
                          active ? `text-${item.color}-500` : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          active ? "font-medium" : "text-muted-foreground"
                        )}>
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}