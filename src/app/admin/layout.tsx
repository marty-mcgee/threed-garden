// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in');
    }
  }, [status, router]);

  // ✅ Simple CSS spinner - no hydration issues
  if (!mounted || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-4 px-4 max-w-7xl">
      <div className="mb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div>
          <span className="text-sm text-muted-foreground mr-2">
            Signed in as {session.user?.name || session.user?.email}
          </span>
          <SignOutButton variant="outline" size="sm" />
        </div>
      </div>
      {children}
    </div>
  );
}