// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Loader2 } from 'lucide-react';

export default function AdminPageLayout({
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

  // Loading state with suppressHydrationWarning
  if (!mounted || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 
          className="w-8 h-8 animate-spin text-primary" 
          suppressHydrationWarning 
        />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    return null;
  }

  // Render the new AdminLayout
  return <AdminLayout>{children}</AdminLayout>;
}