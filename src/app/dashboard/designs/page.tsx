import { Suspense } from 'react';
import { DesignStandalone } from '@/components/threed/design/DesignStandalone';
export default function DesignsPage() {
  return <div className="h-[calc(100dvh-83px)] min-h-0 p-2"><Suspense fallback={<p>Loading ThreeD Designs…</p>}><DesignStandalone /></Suspense></div>;
}
