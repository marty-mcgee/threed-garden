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
  const { data: session, status } = useSession();
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
  const loginStatus = !mounted || status === 'loading'
    ? 'Checking login…'
    : status === 'authenticated' ? 'Signed in' : 'Signed out';
  const [gravatar, setGravatar] = useState<{ email: string; url: string } | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail || status !== 'authenticated') return;
    let cancelled = false;
    const email = userEmail;
    const loadGravatar = async () => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()));
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (!cancelled) setGravatar({ email, url: `https://www.gravatar.com/avatar/${hash}?s=64&d=404` });
    };
    void loadGravatar().catch(() => { /* Initials remain available if hashing is unavailable. */ });
    return () => { cancelled = true; };
  }, [userEmail, status]);
  const avatarUrl = mounted && status === 'authenticated' && gravatar?.email === userEmail
    ? gravatar?.url : undefined;

  return (
    <header className="threed-app-header sticky top-0 z-40 h-12 border-b border-foreground/10">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2 sm:px-3">
        <div className="min-w-0">
          {surface === 'dashboard' ? (
            <Link href="/dashboard" className="flex w-fit min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-600 shadow-sm">
                <Carrot className="size-4 text-white" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-semibold leading-4 text-foreground">ThreeD Garden</span>
              </span>
            </Link>
          ) : (
            <span className="hidden truncate text-xs font-medium text-muted-foreground sm:block">Workspace Administration</span>
          )}
        </div>

        <nav aria-label="Workspace surfaces" className="flex items-center gap-0.5 rounded-md border border-foreground/10 bg-muted/50 p-0.5">
          <Button
            variant="ghost"
            size="xs"
            className={cn('h-7 px-2 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground', pathname?.startsWith('/dashboard') && 'bg-foreground/10 text-foreground')}
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
            className={cn('h-7 px-2 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground', pathname?.startsWith('/admin') && 'bg-foreground/10 text-foreground')}
            asChild
          >
            <Link href="/admin" aria-current={pathname?.startsWith('/admin') ? 'page' : undefined}>
              <Settings className="size-3.5" />
              <span className="hidden min-[420px]:inline">Admin</span>
            </Link>
          </Button>
        </nav>

        {/* Optical spacing: the 24px avatar needs 4px more separation than the 16px icons. */}
        <div className="flex items-center justify-self-end gap-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={`Use ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Use ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {resolvedTheme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon />}
          </Button>

          <NavDropdown />

          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative ml-1 shrink-0 rounded-full p-1 text-xs text-foreground hover:bg-foreground/15" aria-label={`Account menu — ${loginStatus}`} title={loginStatus}>
                  {avatarUrl && avatarUrl !== failedAvatarUrl
                    ? <img src={avatarUrl} alt="" width={24} height={24} className="size-6 rounded-full object-cover" referrerPolicy="no-referrer" onError={() => setFailedAvatarUrl(avatarUrl)} />
                    : <span className="flex size-6 items-center justify-center rounded-full bg-foreground/10">{userInitials}</span>}
                  <span aria-hidden="true" className={cn('absolute bottom-1 right-1 size-2 rounded-full border border-slate-900', mounted && status === 'authenticated' ? 'bg-green-400' : 'bg-slate-400')} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="threed-app-menu-surface w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="truncate text-sm font-medium leading-none">{userDisplayName || 'Guest'}</p>
                    <p className="text-xs text-muted-foreground" role="status">{loginStatus}</p>
                    {userEmail && <p className="truncate text-xs leading-none text-muted-foreground">{userEmail}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {mounted && status === 'authenticated' ? (
                  <DropdownMenuItem className="p-0" onSelect={event => event.preventDefault()}>
                    <SignOutButton variant="ghost" className="w-full justify-start text-red-700 dark:text-red-300 hover:bg-red-950/40 hover:text-red-200" />
                  </DropdownMenuItem>
                ) : status === 'unauthenticated' && (
                  <DropdownMenuItem asChild><Link href="/auth/sign-in">Sign in</Link></DropdownMenuItem>
                )}
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
