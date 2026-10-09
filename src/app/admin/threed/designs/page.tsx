import { Suspense } from 'react';
import { DesignStandalone } from '@/components/threed/design/DesignStandalone';
export default function DesignsPage() {
  return <Suspense fallback={<p>Loading ThreeD Designs…</p>}><DesignStandalone /></Suspense>;
}
