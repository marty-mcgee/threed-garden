// src/app/dashboard/chp-live/page.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';  // Add this line

const CHPLiveContent = dynamicImport(
  () => import('./chpLiveContent'),
  { ssr: false, loading: () => <div className="p-12 text-center">Loading...</div> }
);

export default function CHPLivePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-12 text-center">Loading...</div>;
  }

  return <CHPLiveContent />;
}