'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { cn } from '@/libraries/utils';
import { workspaceSurfaces } from '@/libraries/config/module-appearance';

export function WorkspaceSurfaceNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace surfaces" className="flex shrink-0 items-center gap-0.5 rounded-md border border-foreground/10 bg-muted/50 p-0.5">
      {workspaceSurfaces.map(({ label, href, moduleKey }) => {
        const isActive = pathname === href || pathname?.startsWith(href + '/');

        return (
          <Button
            key={href}
            variant="ghost"
            size="xs"
            className={cn(
              'h-7 px-2 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground',
              isActive && 'bg-foreground/10 text-foreground',
            )}
            asChild
          >
            <Link href={href} aria-label={label} aria-current={isActive ? 'page' : undefined}>
              <ModuleIcon moduleKey={moduleKey} className="size-3.5" inheritColor />
              <span className="hidden min-[420px]:inline">{label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
