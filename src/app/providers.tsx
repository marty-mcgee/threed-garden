// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import {
  ThemeProvider,
  type ThreeDResolvedTheme,
  type ThreeDTheme,
} from '@/components/themes/provider';

export function Providers({
  children,
  initialTheme,
  initialResolvedTheme,
}: {
  children: React.ReactNode;
  initialTheme: ThreeDTheme;
  initialResolvedTheme: ThreeDResolvedTheme;
}) {
  return (
    <ThemeProvider initialTheme={initialTheme} initialResolvedTheme={initialResolvedTheme}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
