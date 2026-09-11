// components/admin/layout/AdminLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminFooter } from './AdminFooter';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const fixedWorkspace = pathname === '/admin/threed/models';

  // ✅ Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle responsive
  useEffect(() => {
    if (!mounted) return;
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (!mounted) return;
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile, mounted]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // ✅ Don't render sidebar on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("flex bg-[#020618] [--card-gap:1rem] [--card-padding-x:1rem] [--card-padding-y:1rem]", fixedWorkspace ? "h-dvh overflow-hidden" : "min-h-screen")}>
        <div className="min-h-0 min-w-0 flex-1 flex flex-col">
          <div className="h-14 border-b border-white/10 bg-[#020618]/85 backdrop-blur-xl" />
          <main className={cn("flex-1 p-2", fixedWorkspace && "min-h-0 overflow-hidden")}>
            {children}
          </main>
          <div className="border-t p-2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex bg-[#020618] [--card-gap:1rem] [--card-padding-x:1rem] [--card-padding-y:1rem]", fixedWorkspace ? "h-dvh overflow-hidden" : "min-h-screen")}>
      {/* Sidebar */}
      <AdminSidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar} 
      />

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div 
        className={cn(
          "min-h-0 min-w-0 flex-1 flex flex-col transition-all duration-300",
          !isMobile && (isCollapsed ? "ml-16" : "ml-64")
        )}
      >
        {fixedWorkspace ? <div className="shrink-0"><AdminHeader /></div> : <AdminHeader />}
        
        <main className={cn("flex-1 p-2", fixedWorkspace ? "min-h-0 overflow-hidden" : "overflow-y-auto")}>
          {children}
        </main>
        
        {fixedWorkspace ? <div className="shrink-0"><AdminFooter /></div> : <AdminFooter />}
      </div>
    </div>
  );
}
