// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/dashboard/AdminDashboard';
import { Loader2 } from 'lucide-react';

interface DashboardData {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date | null;
  };
  stats: {
    projects: number;
    modules: {
      total: number;
      threed: number;
      traffic: number;
      music: number;
    };
    projectModules: {
      total: number;
      threed: number;
      traffic: number;
      music: number;
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
  }>;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // ✅ Handle authentication - just like other admin pages
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // ✅ Fetch dashboard data
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData();
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        console.error('Failed to fetch dashboard data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ✅ Not authenticated - layout will redirect
  if (status === 'unauthenticated' || !dashboardData) {
    return null;
  }

  return <AdminDashboard data={dashboardData} />;
}