// components/unified/UnifiedMap.tsx
export function UnifiedMap({ mode, data }: { mode: '2d' | '3d', data: UnifiedData }) {
  if (mode === '2d') {
    return <EnhancedLeafletMap incidents={data.traffic} />;
  }
  return <ThreeDGardenMap data={data} />;
}