// components/admin/layout/AdminFooter.tsx
'use client';

import { Github, Heart, Zap } from 'lucide-react';

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-3 px-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span>© {currentYear} Marty McGee</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">v0.9.0</span>
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
          Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> using Next.js
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-yellow-500" />
          <span className="hidden sm:inline">Fast</span>
        </span>
      </div>
    </footer>
  );
}