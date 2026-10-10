'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/libraries/utils';

export function WorkspaceSurfaceNav() {
  const pathname = usePathname();
  return (
        <nav aria-label="Workspace surfaces" className="flex shrink-0 items-center gap-0.5 rounded-md border border-foreground/10 bg-muted/50 p-0.5">
          <Button
            variant="ghost"
            size="xs"
            className={cn('h-7 px-2 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground', pathname?.startsWith('/dashboard') && 'bg-foreground/10 text-foreground')}
            asChild
          >
            <Link href="/dashboard" aria-label="Dashboard" aria-current={pathname?.startsWith('/dashboard') ? 'page' : undefined}>
              <Radio className="size-3.5" />
              <span className="hidden min-[420px]:inline">Dashboard</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className={cn('h-7 px-2 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground', pathname?.startsWith('/admin') && 'bg-foreground/10 text-foreground')}
            asChild
          >
            <Link href="/admin" aria-label="Admin" aria-current={pathname?.startsWith('/admin') ? 'page' : undefined}>
              <Settings className="size-3.5" />
              <span className="hidden min-[420px]:inline">Admin</span>
            </Link>
          </Button>
        </nav>
  );
}
