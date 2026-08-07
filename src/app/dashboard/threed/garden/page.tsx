// src/app/dashboard/threed/garden/page.tsx — v0.15.3 "Unified 3D Scene Integration"
// Now uses the same rich ThreeDScene rendering engine as the Unified Map page
'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Box, Sprout, Sun, Droplets, Thermometer, MapPin, AlertCircle, Loader2, FolderOpen } from 'lucide-react';
import { getDefaultMapData, getDefaultLayers } from '@/lib/services/map/DefaultMapData';
import { MapLayerConfig, MapViewMode, UnifiedMapData } from '@/lib/types/map';

// ✅ Dynamically import UnifiedMapView to avoid SSR issues with Three.js
const UnifiedMapView = dynamic(
  () => import('@/components/map/UnifiedMapView').then((mod) => mod.UnifiedMapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-muted/20 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function Garden3DPage() {
  const { showToast, ToastComponent } = useToast();
  const [data, setData] = useState<UnifiedMapData>(getDefaultMapData());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [layers] = useState<MapLayerConfig>(getDefaultLayers());
  const [projectInfo, setProjectInfo] = useState<{ name: string; hasData: boolean } | null>(null);

  // ✅ Force 3D view mode for garden page
  const viewMode: MapViewMode = '3d';
  
  // ✅ Asset type visibility — show all ThreeD types
  const visibleAssetTypes = new Set(['plantings', 'beds', 'characters', 'farmbots']);

  // ✅ Check URL for projectId param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('projectId');
      if (projectId) setSelectedProjectId(projectId);
    }
  }, []);

  // ✅ Normalize position values (DB returns decimals as strings)
  const normalizePositions = (records: Record<string, any[]>) => {
    const normalized: Record<string, any[]> = {};
    for (const [key, items] of Object.entries(records)) {
      normalized[key] = items.map((item: any) => {
        const n = { ...item };
        if ('positionX' in n && n.positionX !== null) n.positionX = Number(n.positionX);
        if ('positionY' in n && n.positionY !== null) n.positionY = Number(n.positionY);
        if ('positionZ' in n && n.positionZ !== null) n.positionZ = Number(n.positionZ);
        if ('latitude' in n && n.latitude !== null) n.latitude = Number(n.latitude);
        if ('longitude' in n && n.longitude !== null) n.longitude = Number(n.longitude);
        return n;
      });
    }
    return normalized;
  };

  // ✅ Load data — same pipeline as map page
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (!selectedProjectId) {
        const defaultData = getDefaultMapData();
        setData(defaultData);
        setProjectInfo({ name: 'No Project Selected', hasData: false });
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/map/threed?projectId=${selectedProjectId}`);
      const result = await response.json();

      if (result.success) {
        const resultData = result.data || {};
        
        const threedRaw = {
          plants: (resultData.plants || []) as any[],
          beds: (resultData.beds || []) as any[],
          characters: (resultData.characters || []) as any[],
          layers: (resultData.layers || []) as any[],
          farmbots: (resultData.farmbots || []) as any[],
          plantings: (resultData.plantings || []) as any[],
          tasks: (resultData.tasks || []) as any[],
          harvests: (resultData.harvests || []) as any[],
          weatherLogs: (resultData.weatherLogs || []) as any[],
        };
        
        const trafficRaw = {
          chpCadIncidents: (resultData.chpCadIncidents || []) as any[],
          chpCases: (resultData.chpCases || []) as any[],
          chpCenters: (resultData.chpCenters || []) as any[],
          caltransLaneClosures: (resultData.caltransLaneClosures || []) as any[],
          caltransCctvCameras: (resultData.caltransCctvCameras || []) as any[],
          caltransDistricts: (resultData.caltransDistricts || []) as any[],
          bayArea511Events: (resultData.bayArea511Events || []) as any[],
          calfireIncidents: (resultData.calfireIncidents || []) as any[],
        };

        const normalizedThreed = normalizePositions(threedRaw);
        const normalizedTraffic = normalizePositions(trafficRaw);
        
        const threedTotal = Object.values(normalizedThreed).reduce((sum, arr) => sum + arr.length, 0);
        const trafficTotal = Object.values(normalizedTraffic).reduce((sum, arr) => sum + arr.length, 0);

        const unifiedData: UnifiedMapData = {
          traffic: {
            raw: normalizedTraffic as UnifiedMapData['traffic']['raw'],
            total: trafficTotal,
            chpCadCount: normalizedTraffic.chpCadIncidents.length,
            chpCasesCount: normalizedTraffic.chpCases.length,
            chpCentersCount: normalizedTraffic.chpCenters.length,
            caltransClosuresCount: normalizedTraffic.caltransLaneClosures.length,
            caltransCctvCount: normalizedTraffic.caltransCctvCameras.length,
            caltransDistrictsCount: normalizedTraffic.caltransDistricts.length,
            bayArea511Count: normalizedTraffic.bayArea511Events.length,
            calfireIncidentsCount: normalizedTraffic.calfireIncidents.length,
          },
          threed: {
            raw: normalizedThreed as UnifiedMapData['threed']['raw'],
            total: threedTotal,
            plantsCount: normalizedThreed.plants.length,
            bedsCount: normalizedThreed.beds.length,
            charactersCount: normalizedThreed.characters.length,
            markersCount: 0,
            layersCount: normalizedThreed.layers.length,
            farmbotsCount: normalizedThreed.farmbots.length,
            plantingsCount: normalizedThreed.plantings.length,
            tasksCount: normalizedThreed.tasks.length,
            harvestsCount: normalizedThreed.harvests.length,
            weatherLogsCount: normalizedThreed.weatherLogs.length,
            layers: [],
          },
        };

        setData(unifiedData);
        setProjectInfo({
          name: `Project #${selectedProjectId}`,
          hasData: result.total > 0,
        });
        showToast('Garden data loaded', 'success');
      } else {
        showToast(result.error || 'Failed to load data', 'error');
      }
    } catch (error) {
      console.error('Error fetching garden data:', error);
      showToast('Failed to load garden data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProjectId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Stats from loaded data
  const totalBeds = data.threed.bedsCount;
  const totalPlantings = data.threed.plantingsCount;
  const totalFarmbots = data.threed.farmbotsCount;
  const totalCharacters = data.threed.charactersCount;
  const totalThreeD = data.threed.total;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">3D Garden Explorer</h1>
            {selectedProjectId && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Project #{selectedProjectId}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {totalThreeD > 0 ? (
              `${totalBeds} beds • ${totalPlantings} plantings • ${totalCharacters} characters • ${totalFarmbots} farmbots`
            ) : selectedProjectId ? (
              'No data available for this project'
            ) : (
              'Add ?projectId=X to the URL to load project data'
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRotate(!autoRotate)}>
            {autoRotate ? '⏸️ Pause Rotation' : '▶️ Auto-Rotate'}
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      
      {/* Warning if no project selected */}
      {!selectedProjectId && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              No project selected. The 3D Garden loads data from a project's ThreeD assets.
              Select a project from the Unified Map page or add <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">?projectId=X</code> to the URL.
            </p>
          </div>
        </div>
      )}
      
      {/* Warning if no data */}
      {selectedProjectId && totalThreeD === 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-400">
              No ThreeD assets found for this project. Add beds, plantings, characters, or farmbots in the admin panel.
            </p>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Beds</p>
                <p className="text-2xl font-bold text-foreground">{totalBeds}</p>
              </div>
              <Box className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Plantings</p>
                <p className="text-2xl font-bold text-green-600">{totalPlantings}</p>
              </div>
              <Sprout className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Characters</p>
                <p className="text-2xl font-bold text-purple-600">{totalCharacters}</p>
              </div>
              <span className="text-2xl">🧚</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">FarmBots</p>
                <p className="text-2xl font-bold text-slate-600">{totalFarmbots}</p>
              </div>
              <span className="text-2xl">🤖</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 3D Scene */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div style={{ height: '650px' }}>
            <UnifiedMapView
              data={data}
              layers={layers}
              viewMode="3d"
              onIncidentSelect={(incident) => setSelectedIncident(incident)}
              onMarkerSelect={(marker) => setSelectedMarker(marker)}
              selectedIncident={selectedIncident}
              selectedMarker={selectedMarker}
              height="100%"
              visibleAssetTypes={visibleAssetTypes}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => window.location.href = '/dashboard/map'}
        >
          <FolderOpen className="w-3.5 h-3.5 mr-1" />
          Go to Unified Map
        </Button>
      </div>
    </div>
  );
}