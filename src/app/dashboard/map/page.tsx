// app/dashboard/map/page-v0130b.tsx - v0.13.0-beta "Smart Dashboard"
// Features: Rich Popups + Admin Links, Advanced Filtering, Interactive Stats, Live Data Indicator
'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Layers, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  MapPin, 
  Box, 
  Car, 
  Maximize2,
  Minimize2,
  FolderOpen,
  ChevronRight,
  Search,
  Loader2,
  Plus,
  Filter,
  Clock,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDefaultMapData, getDefaultLayers } from '@/lib/services/map/DefaultMapData';
import { UnifiedMapView } from '@/components/map/UnifiedMapView';
import { MapLayerConfig, MapViewMode, UnifiedMapData } from '@/lib/types/map';
import {
  getTrafficIcon,
  getTrafficLabel,
  getThreeDIcon,
  getThreeDLabel,
} from '@/lib/utils/map-helpers';

// ✅ Project Selector Dialog Component
function ProjectSelectorDialog({ 
  open, 
  onOpenChange, 
  onSelect 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSelect: (projectId: string) => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      const loadProjects = async () => {
        try {
          const response = await fetch('/api/map/projects');
          const data = await response.json();
          setProjects(data.projects || []);
        } catch (error) {
          console.error('Failed to load projects:', error);
          setProjects([]);
        } finally {
          setLoading(false);
        }
      };
      loadProjects();
    }
  }, [open]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (projectId: string) => {
    onSelect(projectId);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Project</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex-1 overflow-y-auto mt-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">
                {searchQuery ? 'No matching projects' : 'No projects found'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Button
                key={project.id}
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-3"
                onClick={() => handleSelect(String(project.id))}
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
                  <Badge variant="secondary" className="text-[10px]">
                    {project.assetCount || 0}
                  </Badge>
                </div>
              </Button>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.location.href = '/admin/projects'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ✅ Interactive Stats Card (clickable to filter)
function StatCard({ 
  label, 
  count, 
  color, 
  icon, 
  isActive, 
  onClick 
}: { 
  label: string; 
  count: number; 
  color: string; 
  icon: string; 
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-all select-none
        ${isActive ? 'ring-2 ring-primary bg-primary/5 scale-[1.02]' : 'hover:bg-muted/50'}`}
      onClick={onClick}
      title={`Click to ${isActive ? 'clear' : 'filter by'} ${label}`}
    >
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px] h-4 px-1 ml-auto">
        {count}
      </Badge>
    </div>
  );
}

export default function UnifiedMapPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <UnifiedMapPageInner />
    </Suspense>
  );
}

function UnifiedMapPageInner() {
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  
  // ✅ State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdParam);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(!projectIdParam);
  const [data, setData] = useState<UnifiedMapData>(getDefaultMapData());
  const [isDefaultView, setIsDefaultView] = useState(!projectIdParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{ name: string; hasData: boolean } | null>(null);
  
  // ✅ Live Data Status Indicator
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataAge, setDataAge] = useState<string>('--');
  const [isStale, setIsStale] = useState(false);
  
  // ✅ Default to 3D view
  const [viewMode, setViewMode] = useState<MapViewMode>('3d');
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [layers, setLayers] = useState<MapLayerConfig>(getDefaultLayers());

  // ✅ Advanced Filtering Panel State
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterAssetType, setFilterAssetType] = useState<string | null>(null); // Single type filter from stat card clicks

  // ✅ Panel resize state
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Asset type visibility state
  const [visibleAssetTypes] = useState<Set<string>>(
    new Set(['plantings', 'beds', 'characters', 'farmbots'])
  );

  // ✅ Live data age updater
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated) {
        const diffMs = Date.now() - lastUpdated.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) {
          setDataAge(`${diffSec}s ago`);
          setIsStale(false);
        } else if (diffSec < 3600) {
          setDataAge(`${Math.floor(diffSec / 60)}m ago`);
          setIsStale(diffSec > 300); // Stale after 5 minutes
        } else {
          setDataAge(`${Math.floor(diffSec / 3600)}h ago`);
          setIsStale(true);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // ✅ Handle project selection
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsDefaultView(false);
    setFilterAssetType(null); // Reset filter on project change
    const url = new URL(window.location.href);
    url.searchParams.set('projectId', projectId);
    window.history.pushState({}, '', url.toString());
  };

  // ✅ Toggle layer enable/disable
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

  // ✅ Toggle layer visibility
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

  // ✅ Handle focus on marker
  const handleFocusMarker = useCallback((marker: any) => {
    setSelectedMarker(marker);
  }, []);

  // ✅ Interactive stat card click handler
  const handleStatCardClick = (typeLabel: string) => {
    // Toggle: if already active, clear filter; otherwise set it
    if (filterAssetType === typeLabel) {
      setFilterAssetType(null);
      showToast(`Showing all asset types`, 'info');
    } else {
      setFilterAssetType(typeLabel);
      showToast(`Filtered to: ${typeLabel}`, 'info');
    }
  };

  // ✅ Load data from API route
  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      if (!selectedProjectId) {
        const defaultData = getDefaultMapData();
        setData(defaultData);
        setProjectInfo({ name: 'No Project Selected', hasData: false });
        setIsDefaultView(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/map/threed?projectId=${selectedProjectId}`);
        const result = await response.json();

        if (result.success) {
          // ✅ Split combined API response into separate threed vs traffic data
          const resultData = result.data || {};
          
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
          
          const trafficTotal = Object.values(trafficRaw).reduce((sum, arr) => sum + arr.length, 0);
          const threedTotal = Object.values(threedRaw).reduce((sum, arr) => sum + arr.length, 0);

          const unifiedData: UnifiedMapData = {
            traffic: {
              raw: trafficRaw,
              total: trafficTotal,
              chpCadCount: trafficRaw.chpCadIncidents.length,
              chpCasesCount: trafficRaw.chpCases.length,
              chpCentersCount: trafficRaw.chpCenters.length,
              caltransClosuresCount: trafficRaw.caltransLaneClosures.length,
              caltransCctvCount: trafficRaw.caltransCctvCameras.length,
              caltransDistrictsCount: trafficRaw.caltransDistricts.length,
              bayArea511Count: trafficRaw.bayArea511Events.length,
              calfireIncidentsCount: trafficRaw.calfireIncidents.length,
            },
            threed: {
              raw: threedRaw,
              total: threedTotal,
              plantsCount: threedRaw.plants.length,
              bedsCount: threedRaw.beds.length,
              charactersCount: threedRaw.characters.length,
              markersCount: 0,
              layersCount: threedRaw.layers.length,
              farmbotsCount: threedRaw.farmbots.length,
              plantingsCount: threedRaw.plantings.length,
              tasksCount: threedRaw.tasks.length,
              harvestsCount: threedRaw.harvests.length,
              weatherLogsCount: threedRaw.weatherLogs.length,
              layers: [],
            },
          };

          setData(unifiedData);
          setLastUpdated(new Date());
          setProjectInfo({
            name: `Project #${selectedProjectId}`,
            hasData: result.total > 0,
          });
          setIsDefaultView(false);
        } else {
          const emptyData = getDefaultMapData();
          setData(emptyData);
          setProjectInfo({ name: 'Error Loading Data', hasData: false });
          setIsDefaultView(true);
          showToast(result.error || 'Failed to load data', 'error');
        }
      } catch (fetchError) {
        console.warn('API fetch failed:', fetchError);
        const emptyData = getDefaultMapData();
        setData(emptyData);
        setProjectInfo({ name: 'Error Loading Data', hasData: false });
        setIsDefaultView(true);
        showToast('Failed to load data', 'error');
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
      const emptyData = getDefaultMapData();
      setData(emptyData);
      showToast('Failed to load data', 'error');
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
    setLastUpdated(new Date());
    showToast('Data refreshed', 'success');
  };

  // ✅ Drag handlers for panel resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const percentage = ((e.clientY - rect.top) / rect.height) * 100;
      setPanelHeight(Math.min(Math.max(percentage, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ✅ Loading state with skeleton UI
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4 animate-pulse">
          <div>
            <div className="h-7 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-muted rounded-lg" />
            <div className="h-8 w-16 bg-muted rounded-lg" />
            <div className="h-8 w-20 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="border rounded-lg p-3 animate-pulse">
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
        </div>
        <div className="border rounded-lg p-3 animate-pulse">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
        </div>
        <div className="border rounded-lg animate-pulse">
          <div className="h-[650px] bg-muted/30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasRealData = data ? (data.traffic.total > 0 || data.threed.total > 0) : false;

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Project Selector Dialog */}
      <ProjectSelectorDialog
        open={isProjectSelectorOpen}
        onOpenChange={setIsProjectSelectorOpen}
        onSelect={handleProjectSelect}
      />

      {/* ✅ v0.13.0-beta: Header with Live Data Status Indicator */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Unified Map
            </h1>
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => setIsProjectSelectorOpen(true)}
            >
              {selectedProjectId ? projectInfo?.name || `Project #${selectedProjectId}` : '🔍 Select Project'}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Badge>
            {!hasRealData && selectedProjectId && (
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                No Data
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 ml-9">
            <p className="text-sm text-muted-foreground">
              {hasRealData ? (
                `${data.traffic.total || 0} traffic items • ${data.threed.total || 0} 3D items`
              ) : selectedProjectId ? (
                'No data available for this project'
              ) : (
                'Select a project to load data'
              )}
            </p>
            {/* ✅ Live Data Status Indicator */}
            {selectedProjectId && (
              <div className="flex items-center gap-1.5">
                {isStale ? (
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                ) : dataAge !== '--' ? (
                  <Wifi className="w-3.5 h-3.5 text-green-500" />
                ) : null}
                <span className={`text-xs ${isStale ? 'text-amber-600' : dataAge !== '--' ? 'text-green-600' : 'text-muted-foreground'}`} title={lastUpdated?.toLocaleString() || 'Unknown'}>
                  {dataAge !== '--' ? `Updated ${dataAge}` : ''}
                </span>
                <Clock className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
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

          {/* ✅ v0.13.0-beta: Filter Panel Toggle Button */}
          <Button
            variant={showFilterPanel ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title="Toggle filter panel"
          >
            <Filter className="w-3.5 h-3.5 mr-1" />
            Filter
            {filterAssetType && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                1
              </Badge>
            )}
          </Button>

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

      {/* ✅ v0.13.0-beta: Advanced Filtering Panel */}
      {showFilterPanel && (
        <Card className="border-primary/20">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>

              {/* Search/Text Filter */}
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search markers by name..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="h-7 text-xs w-44"
                />
                {filterText && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setFilterText('')}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Active Only Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={filterActiveOnly}
                  onCheckedChange={setFilterActiveOnly}
                  id="active-only"
                  className="scale-75"
                />
                <Label htmlFor="active-only" className="text-xs cursor-pointer">Active Only</Label>
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Asset Type Quick Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Type:</span>
                {['Plantings', 'Beds', 'Characters', 'FarmBots', 'CHP CAD', 'CalFire'].map((type) => (
                  <Badge
                    key={type}
                    variant={filterAssetType === type ? 'default' : 'outline'}
                    className="text-[10px] cursor-pointer hover:bg-muted"
                    onClick={() => handleStatCardClick(type)}
                  >
                    {type}
                    {filterAssetType === type && <X className="w-2.5 h-2.5 ml-1" />}
                  </Badge>
                ))}
              </div>

              {/* Clear All */}
              {(filterText || filterActiveOnly || filterAssetType) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground ml-auto"
                  onClick={() => {
                    setFilterText('');
                    setFilterActiveOnly(false);
                    setFilterAssetType(null);
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                </div>
              ))}
            </div>

            <div className="w-px h-6 bg-border" />

            {/* ThreeD Layers */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">ThreeD:</span>
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
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Map Container */}
      <Card className={isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
        <CardContent className="p-0 overflow-hidden">
          <div style={{ height: isFullscreen ? '100vh' : '650px' }}>
            
            {viewMode === 'combined' && (
              <div 
                ref={containerRef}
                className="flex flex-col w-full h-full gap-0 p-0 relative"
              >
                <div 
                  className="min-h-0 transition-none"
                  style={{ height: `${panelHeight}%` }}
                >
                  <div className="relative w-full h-full rounded-t-lg overflow-hidden border border-white/10 bg-black/5">
                    <UnifiedMapView
                      data={data}
                      layers={layers}
                      viewMode="3d"
                      onIncidentSelect={(incident) => setSelectedIncident(incident)}
                      onMarkerSelect={(marker) => setSelectedMarker(marker)}
                      onFocusMarker={handleFocusMarker}
                      selectedIncident={selectedIncident}
                      selectedMarker={selectedMarker}
                      height="100%"
                      visibleAssetTypes={visibleAssetTypes}
                      filterText={filterText}
                      filterActiveOnly={filterActiveOnly}
                      filterAssetType={filterAssetType}
                    />
                  </div>
                </div>
                
                <div 
                  className="flex-shrink-0 h-1.5 cursor-row-resize hover:bg-primary/50 transition-colors bg-border/50 my-0.5 rounded-full group"
                  onMouseDown={handleMouseDown}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
                  </div>
                </div>
                
                <div 
                  className="min-h-0 transition-none"
                  style={{ height: `${100 - panelHeight}%` }}
                >
                  <div className="relative w-full h-full rounded-b-lg overflow-hidden border border-white/10 bg-black/5">
                    <UnifiedMapView
                      data={data}
                      layers={layers}
                      viewMode="2d"
                      onIncidentSelect={(incident) => setSelectedIncident(incident)}
                      onMarkerSelect={(marker) => setSelectedMarker(marker)}
                      onFocusMarker={handleFocusMarker}
                      selectedIncident={selectedIncident}
                      selectedMarker={selectedMarker}
                      height="100%"
                      visibleAssetTypes={visibleAssetTypes}
                      filterText={filterText}
                      filterActiveOnly={filterActiveOnly}
                      filterAssetType={filterAssetType}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === '3d' && (
              <UnifiedMapView
                data={data}
                layers={layers}
                viewMode="3d"
                onIncidentSelect={(incident) => setSelectedIncident(incident)}
                onMarkerSelect={(marker) => setSelectedMarker(marker)}
                onFocusMarker={handleFocusMarker}
                selectedIncident={selectedIncident}
                selectedMarker={selectedMarker}
                height="100%"
                visibleAssetTypes={visibleAssetTypes}
                filterText={filterText}
                filterActiveOnly={filterActiveOnly}
                filterAssetType={filterAssetType}
              />
            )}

            {viewMode === '2d' && (
              <UnifiedMapView
                data={data}
                layers={layers}
                viewMode="2d"
                onIncidentSelect={(incident) => setSelectedIncident(incident)}
                onMarkerSelect={(marker) => setSelectedMarker(marker)}
                onFocusMarker={handleFocusMarker}
                selectedIncident={selectedIncident}
                selectedMarker={selectedMarker}
                height="100%"
                visibleAssetTypes={visibleAssetTypes}
                filterText={filterText}
                filterActiveOnly={filterActiveOnly}
                filterAssetType={filterAssetType}
              />
            )}

          </div>
        </CardContent>
      </Card>

      {/* ✅ v0.13.0-beta: Interactive Stats Cards */}
      {hasRealData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Traffic Summary - Interactive Stat Cards */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  Traffic Summary
                </span>
                <Badge variant="secondary" className="text-xs">
                  {data.traffic.total || 0}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <StatCard label="CHP CAD" count={data.traffic.chpCadCount || 0} color="bg-red-500" icon="🚨" isActive={filterAssetType === 'CHP CAD'} onClick={() => handleStatCardClick('CHP CAD')} />
                <StatCard label="CHP Cases" count={data.traffic.chpCasesCount || 0} color="bg-orange-500" icon="📋" isActive={filterAssetType === 'CHP Cases'} onClick={() => handleStatCardClick('CHP Cases')} />
                <StatCard label="CHP Centers" count={data.traffic.chpCentersCount || 0} color="bg-yellow-500" icon="🏢" isActive={filterAssetType === 'CHP Centers'} onClick={() => handleStatCardClick('CHP Centers')} />
                <StatCard label="Caltrans Closures" count={data.traffic.caltransClosuresCount || 0} color="bg-blue-500" icon="🚧" isActive={filterAssetType === 'Caltrans Closures'} onClick={() => handleStatCardClick('Caltrans Closures')} />
                <StatCard label="CCTV Cameras" count={data.traffic.caltransCctvCount || 0} color="bg-cyan-500" icon="📹" isActive={filterAssetType === 'CCTV'} onClick={() => handleStatCardClick('CCTV')} />
                <StatCard label="Districts" count={data.traffic.caltransDistrictsCount || 0} color="bg-indigo-500" icon="🏛️" isActive={filterAssetType === 'Districts'} onClick={() => handleStatCardClick('Districts')} />
                <StatCard label="511 Events" count={data.traffic.bayArea511Count || 0} color="bg-emerald-500" icon="📻" isActive={filterAssetType === '511 Events'} onClick={() => handleStatCardClick('511 Events')} />
                <StatCard label="CalFire" count={data.traffic.calfireIncidentsCount || 0} color="bg-rose-500" icon="🔥" isActive={filterAssetType === 'CalFire'} onClick={() => handleStatCardClick('CalFire')} />
              </div>
            </CardContent>
          </Card>

          {/* 3D Summary - Interactive Stat Cards */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" />
                  3D Summary
                </span>
                <Badge variant="secondary" className="text-xs">
                  {data.threed.total || 0}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <StatCard label="Plants" count={data.threed.plantsCount || 0} color="bg-green-500" icon="🌱" isActive={filterAssetType === 'Plants'} onClick={() => handleStatCardClick('Plants')} />
                <StatCard label="Beds" count={data.threed.bedsCount || 0} color="bg-amber-500" icon="🧑‍🌾" isActive={filterAssetType === 'Beds'} onClick={() => handleStatCardClick('Beds')} />
                <StatCard label="Characters" count={data.threed.charactersCount || 0} color="bg-purple-500" icon="🧚" isActive={filterAssetType === 'Characters'} onClick={() => handleStatCardClick('Characters')} />
                <StatCard label="FarmBots" count={data.threed.farmbotsCount || 0} color="bg-slate-500" icon="🤖" isActive={filterAssetType === 'FarmBots'} onClick={() => handleStatCardClick('FarmBots')} />
                <StatCard label="Plantings" count={data.threed.plantingsCount || 0} color="bg-emerald-600" icon="🌿" isActive={filterAssetType === 'Plantings'} onClick={() => handleStatCardClick('Plantings')} />
                <StatCard label="Layers" count={data.threed.layersCount || 0} color="bg-cyan-500" icon="📐" isActive={filterAssetType === 'Layers'} onClick={() => handleStatCardClick('Layers')} />
                <StatCard label="Tasks" count={data.threed.tasksCount || 0} color="bg-orange-600" icon="📝" isActive={filterAssetType === 'Tasks'} onClick={() => handleStatCardClick('Tasks')} />
                <StatCard label="Harvests" count={data.threed.harvestsCount || 0} color="bg-yellow-600" icon="🌾" isActive={filterAssetType === 'Harvests'} onClick={() => handleStatCardClick('Harvests')} />
                <StatCard label="Weather Logs" count={data.threed.weatherLogsCount || 0} color="bg-blue-400" icon="🌤️" isActive={filterAssetType === 'Weather Logs'} onClick={() => handleStatCardClick('Weather Logs')} />
              </div>
            </CardContent>
          </Card>

          {/* Active Layers Summary */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Active Layers
                </span>
                <Badge variant="secondary" className="text-xs">
                  {Object.values(layers).flatMap(cat => 
                    Object.values(cat).filter(l => l.enabled && l.visible)
                  ).length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
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
              {/* Clear filter hint */}
              {filterAssetType && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs text-muted-foreground"
                  onClick={() => { setFilterAssetType(null); setFilterText(''); setFilterActiveOnly(false); }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear "{filterAssetType}" filter
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ✅ Navigation */}
      <div className="flex justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setIsProjectSelectorOpen(true)}
        >
          <FolderOpen className="w-3.5 h-3.5 mr-1" />
          {selectedProjectId ? 'Change Project' : 'Select Project'}
        </Button>
        {selectedProjectId && (
          <>
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