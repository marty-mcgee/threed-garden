// app/layout.tsx
import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { Providers } from "./providers";
import "./globals.css";
import { inter } from "./fonts";
// import { NowPlayingBar } from '@/components/multimedia/NowPlayingBar';

export const metadata: Metadata = {
  title: "ThreeD Garden",
  description: "Create and explore interactive 3D gardens with models, characters, physics, maps, and multimedia.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storedTheme = (await cookies()).get('threed-theme')?.value;
  const initialTheme = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
    ? storedTheme
    : 'dark';
  // A server cannot inspect the browser's color-scheme media query. System
  // therefore begins from the App's dark default and synchronizes on mount.
  const initialResolvedTheme = initialTheme === 'light' ? 'light' : 'dark';

  return (
    <html
      lang="en"
      className={`${inter.variable} ${initialResolvedTheme}`}
      suppressHydrationWarning
    >
      <body>
        <Providers initialTheme={initialTheme} initialResolvedTheme={initialResolvedTheme}>
          {children}

          {/* Global player - always visible */}
          {/* <NowPlayingBar /> */}
        </Providers>
      </body>
    </html>
  );
}
