// src/app/dashboard/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { ThreeDProjectLoadingPresentation } from '@/components/map/presentation/ThreeDProjectLoadingPresentation';
import { AppHeader } from '@/components/layout/AppHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AppHeader surface="dashboard" />

      {/* Main Content */}
      <div className="w-full px-0 md:px-0.5 lg:px-1 py-0">
        {/* Page Content */}
        <div className="bg-background/50 backdrop-blur-sm">
          {isClientMounted ? children : (
            <ThreeDProjectLoadingPresentation
              progress={5}
              label="Starting Project workspace…"
              className="h-[calc(100dvh-86px)]"
              showProjectHeader
            />
          )}
        </div>
        
        {/* Footer */}
        <footer className="py-1.5 text-center text-xs text-muted-foreground">
          <p className="text-gray-600">
            Built by Marty McGee w TypeScript, React, Next.js, Neon, Drizzle ORM, Postgres, radix-ui, Three.js, R3F Fiber, Drei, Rap Physics, 3D Object Libraries
            @ <a href="https://github.com/marty-mcgee/marty-mcgee-neon" target="_blank" className="text-gray-600">github/threed</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
