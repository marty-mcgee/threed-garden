// app/layout.tsx
import type { Metadata } from "next";
// import { Providers } from "./providers";
// import "./globals.css";
// import { inter } from "./fonts";
// import { NowPlayingBar } from '@/components/music/NowPlayingBar';

export const metadata: Metadata = {
  title: "Marty McGee Tests",
  description: "Track Dragon: Music Management • Real-time Traffic • ThreeD Integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          {children}
      </body>
    </html>
  );
}