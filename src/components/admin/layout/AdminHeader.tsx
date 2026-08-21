// components/admin/layout/AdminHeader.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Search, Bell, Radio, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { SignOutButton } from '@/components/auth/SignOutButton';

export function AdminHeader() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // ✅ Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user initials from name or email
  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() || 'U';

  // ✅ Prevent hydration mismatch by using mounted state
  const userDisplayName = mounted ? (session?.user?.name || session?.user?.email) : 'Loading...';
  const userEmail = mounted ? session?.user?.email : '';

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3">
        {/* Left: Search (optional) */}
        <div className="hidden w-full max-w-xs md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Center: Surface Switcher */}
        <div className="hidden items-center gap-1 rounded-lg border p-0.5 sm:flex">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs text-muted-foreground"
            asChild
          >
            <Link href="/dashboard">
              <Radio className="mr-1 h-3.5 w-3.5" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-3 text-xs"
            asChild
          >
            <Link href="/admin">
              <Settings className="mr-1 h-3.5 w-3.5" />
              Admin
            </Link>
          </Button>
        </div>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center justify-self-end gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">{userInitials}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userDisplayName}
                  </p>
                  {userEmail && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-0" onClick={(e) => {
                e.preventDefault();
                const btn = e.currentTarget.querySelector('button');
                if (btn) btn.click();
              }}>
                <SignOutButton variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
