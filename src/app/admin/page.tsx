// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/dashboard/AdminDashboard';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardData {
  review?: {
    models: { withoutTextureAssignments: number; withoutTopView: number; withoutThumbnail: number };
    characters: { withoutModel: number; withoutLibraryAnimations: number };
    projects: { withActiveScenarios: number; withActiveSimulations: number; withUnfinalizedRuns: number };
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date | null;
  };
  stats: {
    models: number;
    characters: number;
    projects: number;
    modules: {
      total: number;
      threed: number;
      traffic: number;
      multimedia: number;
    };
    projectModules: {
      total: number;
      threed: number;
      traffic: number;
      multimedia: number;
    };
    assets: {
      total: number;
      byModuleType: Array<{ moduleType: string; count: number }>;
    };
  };
  recentProjects: Array<{
    id: number;
    name: string;
    description: string | null;
    slug: string;
    isActive: boolean;
    isPublic: boolean;
    createdAt: Date | null;
    updatedAt: Date | null;
  }>;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const userId = session?.user?.id;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    setDashboardData(null);
    setError('');
    if (status !== 'authenticated' || !userId) return;
    const controller = new AbortController();
    setLoading(true);
    async function load() {
      try {
        const response = await fetch('/api/admin/dashboard', { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success || !result.data || result.data.user?.id !== userId) throw new Error('Overview could not be loaded. Please try again.');
        if (!controller.signal.aborted) setDashboardData(result.data);
      } catch {
        if (!controller.signal.aborted) setError('Overview could not be loaded. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [status, userId, attempt]);

  if (status === 'unauthenticated') return null;
  if (status === 'loading' || loading) return <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />Loading Overview?</div>;
  if (error) return <section className="rounded-xl border border-destructive/30 bg-card p-6"><h1 className="mb-3 text-xl font-semibold">Overview</h1><p role="alert" className="mb-4 flex items-center gap-2 text-sm text-destructive"><AlertTriangle aria-hidden="true" className="size-4 shrink-0" />{error}</p><Button type="button" variant="outline" onClick={() => { setLoading(true); setAttempt(value => value + 1); }}><RotateCcw aria-hidden="true" className="size-4" />Retry Overview</Button></section>;
  if (!dashboardData || dashboardData.user.id !== userId) return null;
  return <AdminDashboard data={dashboardData} />;
}
