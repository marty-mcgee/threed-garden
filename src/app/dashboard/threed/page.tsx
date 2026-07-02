// app/dashboard/threed/page.tsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { ThreeDGarden } from '@/components/threed/ThreeDGarden';
import { LayerToggles } from '@/components/threed/controls/LayerToggles';
import { fetchThreeDData } from '@/lib/services/threed/DataService';
import { ThreeDData, LayerVisibility } from '@/lib/types/threed';

export default function ThreeDPage() {
  const { showToast, ToastComponent } = useToast();
  const [data, setData] = useState<ThreeDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [layers, setLayers] = useState<LayerVisibility>({
    traffic: true,
    garden: true,
    farmbots: true,
    weather: true,
  });

  const loadData = useCallback(async () => {
    try {
      const result = await fetchThreeDData();
      setData(result);
    } catch (error) {
      console.error('Failed to load 3D data:', error);
      showToast('Failed to load 3D data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    showToast('Data refreshed', 'success');
  };

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Toggle auto-rotate with Space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        setAutoRotate(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">ThreeD Garden</h1>
          <p className="text-sm text-muted-foreground">
            {data.traffic?.length || 0} incidents • {data.plants?.length || 0} plants • {data.farmbots?.length || 0} FarmBots
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
          >
            <span className="mr-1.5">🔄</span>
            Auto {autoRotate ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Layer Toggles */}
      <LayerToggles layers={layers} onToggle={toggleLayer} />

      {/* 3D Scene */}
      <div className="rounded-lg overflow-hidden border bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
        <ThreeDGarden
          data={data}
          layers={layers}
          autoRotate={autoRotate}
          height="700px"
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex justify-center text-xs text-muted-foreground">
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd> to toggle auto-rotation
        </span>
      </div>
    </div>
  );
}