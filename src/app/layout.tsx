// app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/themes/provider"
import "./globals.css";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: "Marty McGee Dashboard",
  description: "Track Dragon: Music Management • Real-time Traffic • ThreeD Integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
