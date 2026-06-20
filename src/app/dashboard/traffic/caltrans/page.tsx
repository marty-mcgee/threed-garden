// src/app/dashboard/caltrans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';  // Add this line

const Content = dynamicImport(
  () => import('./caltransContent'),
  { ssr: false, loading: () => <div className="p-12 text-center">Loading Caltrans data...</div> }
);

export default function CaltransPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  return <Content />;
}