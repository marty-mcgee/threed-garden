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
      <div className="min-h-screen flex">
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b bg-background/95" />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
          <div className="border-t py-3 px-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
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
          "flex-1 flex flex-col transition-all duration-300",
          !isMobile && (isCollapsed ? "ml-16" : "ml-64")
        )}
      >
        <AdminHeader onMenuClick={toggleSidebar} isCollapsed={isCollapsed} />
        
        <main className="flex-1 p-1 md:p-2 overflow-y-auto">
          {children}
        </main>
        
        <AdminFooter />
      </div>
    </div>
  );
}