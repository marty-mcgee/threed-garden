'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Carrot, Moon, Radio, Settings, Sun } from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import NavDropdown from '@/components/navigation/NavDropdown';
import { useTheme } from '@/components/themes/provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/libraries/utils';

export function AppHeader({ surface }: { surface: 'dashboard' | 'admin' }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const userInitials = mounted
    ? session?.user?.name?.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
      || session?.user?.email?.[0]?.toUpperCase()
      || 'U'
    : 'U';
  const userDisplayName = mounted ? session?.user?.name || session?.user?.email : 'Loading…';
  const userEmail = mounted ? session?.user?.email : '';

  return (
    <header className="threed-app-header sticky top-0 z-40 h-12 border-b border-white/10">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2 sm:px-3">
        <div className="min-w-0">
          {surface === 'dashboard' ? (
            <Link href="/dashboard" className="flex w-fit min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-600 shadow-sm">
                <Carrot className="size-4 text-white" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-semibold leading-4 text-white">ThreeD Garden</span>
              </span>
            </Link>
          ) : (
            <span className="hidden truncate text-xs font-medium text-slate-400 sm:block">Workspace Administration</span>
          )}
        </div>

        <nav aria-label="Workspace surfaces" className="flex items-center gap-0.5 rounded-md border border-white/10 bg-black/20 p-0.5">
          <Button
            variant="ghost"
            size="xs"
            className={cn('h-7 px-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white', pathname?.startsWith('/dashboard') && 'bg-white/10 text-white')}
            asChild
          >
            <Link href="/dashboard" aria-current={pathname?.startsWith('/dashboard') ? 'page' : undefined}>
              <Radio className="size-3.5" />
              <span className="hidden min-[420px]:inline">Dashboard</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className={cn('h-7 px-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white', pathname?.startsWith('/admin') && 'bg-white/10 text-white')}
            asChild
          >
            <Link href="/admin" aria-current={pathname?.startsWith('/admin') ? 'page' : undefined}>
              <Settings className="size-3.5" />
              <span className="hidden min-[420px]:inline">Admin</span>
            </Link>
          </Button>
        </nav>

        <div className={cn("flex items-center justify-self-end", surface === 'admin' ? 'gap-2 [&>button]:size-8 [&>button]:shrink-0' : 'gap-0.5')}>
          <NavDropdown />
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={`Use ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Use ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {resolvedTheme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon />}
          </Button>

          {surface === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="rounded-full bg-white/10 text-xs text-white hover:bg-white/15" aria-label="Account menu">
                  {userInitials}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="threed-app-menu-surface w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="truncate text-sm font-medium leading-none">{userDisplayName}</p>
                    {userEmail && <p className="truncate text-xs leading-none text-slate-400">{userEmail}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-0" onSelect={event => event.preventDefault()}>
                  <SignOutButton variant="ghost" className="w-full justify-start text-red-300 hover:bg-red-950/40 hover:text-red-200" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
