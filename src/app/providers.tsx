// app/providers.tsx
'use client';

import { PanelAppearanceProvider } from '@/components/settings/PanelAppearance';
import { ModuleAppearanceProvider } from '@/components/settings/ModuleAppearanceProvider';
import { SessionProvider } from 'next-auth/react';
import { WorkspaceSettingsProvider } from '@/components/settings/WorkspaceSettingsProvider';
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
        <ModuleAppearanceProvider><WorkspaceSettingsProvider><PanelAppearanceProvider>{children}</PanelAppearanceProvider></WorkspaceSettingsProvider></ModuleAppearanceProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
