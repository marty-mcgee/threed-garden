// app/dashboard/map/page.tsx - Complete with all functions

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Layers, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  MapPin, 
  Box, 
  Car, 
  AlertTriangle,
  Maximize2,
  Minimize2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  fetchUnifiedMapData, 
  fetchMapProjects,
  projectHasMapData,
  clearMapCache 
} from '@/lib/services/map/MapDataService';
import { 
  getDefaultMapData, 
  getDefaultLayers,
  DEFAULT_MAP_CENTER 
} from '@/lib/services/map/DefaultMapData';
import { UnifiedMapView } from '@/components/map/UnifiedMapView';
import { MapLayerConfig, MapViewMode, UnifiedMapData } from '@/lib/types/map';
import {
  getTrafficIcon,
  getTrafficLabel,
  getThreeDIcon,
  getThreeDLabel,
} from '@/lib/utils/map-helpers';

// ✅ Project selection component
function ProjectSelector({ onSelect, onClose }: { 
  onSelect: (projectId: string) => void; 
  onClose: () => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchMapProjects({ includeInactive: false });
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Select a Project</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">
            {searchQuery ? 'No matching projects' : 'No projects with map data'}
          </p>
          <p className="text-xs mt-1">
            {searchQuery ? 'Try a different search term' : 'Add assets to your projects to see them here'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.href = '/admin/projects'}
          >
            Go to Projects
          </Button>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredProjects.map((project) => (
            <Button
              key={project.id}
              variant="ghost"
              className="w-full justify-start text-left h-auto py-2 px-3"
              onClick={() => onSelect(String(project.id))}
            >
              <div className="flex items-center gap-3 w-full">
                <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {project.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {project.hasTraffic && (
                    <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-500">
                      🚗
                    </Badge>
                  )}
                  {project.hasThreeD && (
                    <Badge variant="outline" className="text-[10px] border-green-500 text-green-500">
                      📦
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {project.assetCount || 0}
                  </Badge>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UnifiedMapPage() {
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  
  // ✅ State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdParam);
  const [showProjectSelector, setShowProjectSelector] = useState(!projectIdParam);
  const [data, setData] = useState<UnifiedMapData | null>(null);
  const [isDefaultView, setIsDefaultView] = useState(!projectIdParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{ name: string; hasData: boolean } | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('combined');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [layers, setLayers] = useState<MapLayerConfig>(getDefaultLayers());

  // ✅ Handle project selection
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectSelector(false);
    setIsDefaultView(false);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('projectId', projectId);
    window.history.pushState({}, '', url.toString());
  };

  // ✅ Toggle layer visibility (show/hide on map)
  const toggleLayer = (category: 'traffic' | 'threed', layerId: string) => {
    setLayers(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [layerId]: {
          ...prev[category][layerId as keyof typeof prev.traffic],
          enabled: !prev[category][layerId as keyof typeof prev.traffic]?.enabled
        }
      }
    }));
  };

  // ✅ Toggle layer visibility (show/hide in UI)
  const toggleVisibility = (category: 'traffic' | 'threed', layerId: string) => {
    setLayers(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [layerId]: {
          ...prev[category][layerId as keyof typeof prev.traffic],
          visible: !prev[category][layerId as keyof typeof prev.traffic]?.visible
        }
      }
    }));
  };

  // ✅ Load data when project is selected or use default view
  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      // ✅ If no project selected, use default view
      if (!selectedProjectId) {
        const defaultData = getDefaultMapData();
        setData(defaultData);
        setProjectInfo({ name: 'Default View', hasData: true });
        setIsDefaultView(true);
        setLoading(false);
        return;
      }

      // ✅ Check if project has any map data
      try {
        const projectStatus = await projectHasMapData(selectedProjectId);
        setProjectInfo({
          name: `Project #${selectedProjectId}`,
          hasData: projectStatus.totalAssets > 0,
        });

        if (projectStatus.totalAssets === 0) {
          // ✅ Use default data but show project context
          const defaultData = getDefaultMapData();
          setData(defaultData);
          setLoading(false);
          return;
        }

        // ✅ Load full project data
        const result = await fetchUnifiedMapData(selectedProjectId);
        setData(result);
      } catch (checkError) {
        console.warn('Project check failed, using default view:', checkError);
        const defaultData = getDefaultMapData();
        setData(defaultData);
        setProjectInfo({ name: 'Default View (fallback)', hasData: true });
        setIsDefaultView(true);
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
      // ✅ Fallback to default data on error
      const defaultData = getDefaultMapData();
      setData(defaultData);
      showToast('Using default view - error loading data', 'warning');
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
    if (selectedProjectId) {
      clearMapCache(selectedProjectId);
    }
    await loadData();
    showToast('Data refreshed', 'success');
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ✅ No data available (shouldn't happen with default view)
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No Data Available</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please select a project or try refreshing.
            </p>
            <Button 
              className="mt-4"
              onClick={() => setShowProjectSelector(true)}
            >
              Select Project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* ✅ Header with Project Context */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setShowProjectSelector(true)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Unified Map
            </h1>
            <Badge 
              variant={isDefaultView ? 'secondary' : 'outline'} 
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => setShowProjectSelector(true)}
            >
              {isDefaultView ? '🔍 Default View' : projectInfo?.name || `Project #${selectedProjectId}`}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Badge>
            {isDefaultView && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Info className="w-3 h-3 mr-1" />
                Sample Data
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground ml-9">
            {data.traffic?.total || 0} traffic incidents • {data.threed?.total || 0} 3D markers
            {isDefaultView && ' • 🔍 Default view (sample data)'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <Button
              variant={viewMode === 'combined' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode('combined')}
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              Combined
            </Button>
            <Button
              variant={viewMode === '2d' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode('2d')}
            >
              <Car className="w-3.5 h-3.5 mr-1" />
              2D
            </Button>
            <Button
              variant={viewMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode('3d')}
            >
              <Box className="w-3.5 h-3.5 mr-1" />
              3D
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ✅ Layer Controls */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Traffic Layers */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Traffic:</span>
              {Object.entries(layers.traffic).map(([id, config]) => (
                <div key={id} className="flex items-center gap-1">
                  <Button
                    variant={config.enabled ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => toggleLayer('traffic', id)}
                  >
                    {getTrafficIcon(id)}
                    <span className="ml-1">{getTrafficLabel(id)}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleVisibility('traffic', id)}
                  >
                    {config.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="w-px h-6 bg-border" />

            {/* ThreeD Layers */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">3D:</span>
              {Object.entries(layers.threed).map(([id, config]) => (
                <div key={id} className="flex items-center gap-1">
                  <Button
                    variant={config.enabled ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => toggleLayer('threed', id)}
                  >
                    {getThreeDIcon(id)}
                    <span className="ml-1">{getThreeDLabel(id)}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleVisibility('threed', id)}
                  >
                    {config.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Map Container */}
      <Card className={isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
        <CardContent className={`p-0 overflow-hidden ${isFullscreen ? 'h-screen' : ''}`}>
          <UnifiedMapView
            data={data}
            layers={layers}
            viewMode={viewMode}
            onIncidentSelect={(incident) => setSelectedIncident(incident)}
            onMarkerSelect={(marker) => setSelectedMarker(marker)}
            selectedIncident={selectedIncident}
            selectedMarker={selectedMarker}
            height={isFullscreen ? '100vh' : '650px'}
          />
        </CardContent>
      </Card>

      {/* ✅ Legend and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Traffic Summary */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Traffic Summary</span>
              <Badge variant="secondary" className="text-xs">
                {data.traffic?.total || 0}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                CHP CAD: {data.traffic?.chpCad || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                CHP Cases: {data.traffic?.chpCases || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                CHP Centers: {data.traffic?.chpCenters || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Caltrans Closures: {data.traffic?.caltransClosures || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Caltrans CCTV: {data.traffic?.caltransCctv || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Caltrans Districts: {data.traffic?.caltransDistricts || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                511 Events: {data.traffic?.bayArea511 || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                CalFire: {data.traffic?.calfireIncidents || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ThreeD Summary */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">3D Summary</span>
              <Badge variant="secondary" className="text-xs">
                {data.threed?.total || 0}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Plants: {data.threed?.plantsCount || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Beds: {data.threed?.bedsCount || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Characters: {data.threed?.charactersCount || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                Markers: {data.threed?.markersCount || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Layers: {data.threed?.layersCount || 0}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                FarmBots: {data.threed?.farmbotsCount || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Layers */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active</span>
              <Badge variant="secondary" className="text-xs">
                {Object.values(layers).flatMap(cat => 
                  Object.values(cat).filter(l => l.enabled && l.visible)
                ).length} layers
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(layers).flatMap(([category, items]) =>
                Object.entries(items)
                  .filter(([_, config]) => config.enabled && config.visible)
                  .map(([id, _]) => (
                    <Badge key={`${category}-${id}`} variant="outline" className="text-[10px]">
                      {id}
                    </Badge>
                  ))
              )}
              {Object.values(layers).flatMap(cat =>
                Object.values(cat).filter(l => l.enabled && l.visible)
              ).length === 0 && (
                <span className="text-xs text-muted-foreground">No layers active</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Navigation */}
      <div className="flex justify-center gap-2">
        {isDefaultView ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setShowProjectSelector(true)}
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1" />
            Select a Project to see your data
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setShowProjectSelector(true)}
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1" />
              Change Project
            </Button>
            <span className="text-border">|</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => router.push(`/admin/projects/${selectedProjectId}`)}
            >
              Go to Project Details →
            </Button>
          </>
        )}
      </div>
    </div>
  );
}