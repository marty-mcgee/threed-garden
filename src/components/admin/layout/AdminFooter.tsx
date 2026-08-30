// components/admin/layout/AdminFooter.tsx
'use client';

import { Github, Heart, Zap } from 'lucide-react';

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t p-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>© {currentYear} Marty McGee Neon</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">v0.19.1-echo</span>
      </div>
      <div className="flex items-center gap-4">
        <a 
          href="https://github.com/marty-mcgee/marty-mcgee-neon" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <span className="flex items-center gap-1">
          Built with <Heart className="h-3 w-3 text-green-500 fill-green-500" /> using ThreeD
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-yellow-500" />
          <span className="hidden sm:inline">Fast</span>
        </span>
      </div>
    </footer>
  );
}
