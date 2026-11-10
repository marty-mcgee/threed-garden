// app/layout.tsx
import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { cache } from 'react';
import { Providers } from "./providers";
import "./globals.css";
import { inter } from "./fonts";
import AppPageTitle from '@/components/layout/AppPageTitle';
import { readMetaTags } from '@/libraries/services/settings/meta-tags';
import { appTitlePrefix, defaultMetaTags, metaTagsMetadata } from '@/libraries/config/meta-tags';
// import { NowPlayingBar } from '@/components/multimedia/NowPlayingBar';

const readPageMetaTags = cache(async () => {
  try { return await readMetaTags(); }
  catch {
    // Optional metadata must not make the App unavailable during a Settings outage.
    console.warn('App meta tags unavailable; using established metadata defaults.');
    return defaultMetaTags();
  }
});

export async function generateMetadata(): Promise<Metadata> {
  return metaTagsMetadata(await readPageMetaTags());
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storedTheme = (await cookies()).get('threed-theme')?.value;
  const titlePrefix = appTitlePrefix(await readPageMetaTags());
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
        <AppPageTitle titlePrefix={titlePrefix}>
        <Providers initialTheme={initialTheme} initialResolvedTheme={initialResolvedTheme}>
          {children}

          {/* Global player - always visible */}
          {/* <NowPlayingBar /> */}
        </Providers>
        </AppPageTitle>
      </body>
    </html>
  );
}
