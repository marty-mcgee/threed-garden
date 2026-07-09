// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from "@/components/themes/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}