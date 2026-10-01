// src/app/dashboard/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThreeDProjectLoadingPresentation } from '@/components/map/presentation/ThreeDProjectLoadingPresentation';
import { AppHeader } from '@/components/layout/AppHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isScenePage = usePathname() === '/dashboard/scene';
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AppHeader surface="dashboard" />

      {/* Main Content */}
      <div className={isScenePage ? "relative w-full p-0" : "w-full px-0 md:px-0.5 lg:px-1 py-0"}>
        {/* Page Content */}
        <div className="bg-background/50 backdrop-blur-sm">
          {isClientMounted ? children : (
            <ThreeDProjectLoadingPresentation
              progress={5}
              label="Starting Project workspace…"
              className={isScenePage ? "h-[calc(100dvh-48px)]" : "h-[calc(100dvh-83px)]"}
            />
          )}
        </div>
        
        {/* Footer */}
        <footer className={isScenePage ? "pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-transparent px-2 py-1 text-center text-[10px] text-foreground [text-shadow:0_0_3px_var(--background)]" : "py-1.5 text-center text-xs text-muted-foreground"}>
          <p className={isScenePage ? "text-inherit" : "text-gray-600"}>
            Built by Marty McGee w TypeScript, React, Next.js, Neon, Drizzle ORM, Postgres, Radix-UI, Three.js, React-Three, Rap Physics
            @ <a href="https://github.com/marty-mcgee/threed-garden" target="_blank" className={isScenePage ? "pointer-events-auto text-inherit underline" : "text-gray-600"}>github</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
