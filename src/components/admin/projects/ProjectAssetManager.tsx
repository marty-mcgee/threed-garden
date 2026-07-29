// components/admin/projects/ProjectAssetManager.tsx - Updated with complete traffic asset configs

'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Loader2, 
  CheckCircle,
  Music,
  Sprout,
  AlertTriangle,
  Search,
  Box,
  Package,
  User,
  FileText,
  Route,
  Flame,
  Radio,
  Music2,
  Image,
  Link2,
  Building2,
  Camera,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';

interface Asset {
  id: number;
  name: string;
  type: string;
  description?: string;
  assigned: boolean;
  [key: string]: any;
}

interface ProjectAssetManagerProps {
  projectId: number;
  userId: string;
  moduleType: 'music' | 'threed' | 'traffic';
  moduleId: number;
  onUpdate?: () => void;
}

// ✅ Session storage key
const ASSET_TAB_STORAGE_KEY = 'project_asset_selected_tab';

// ✅ Complete asset type configuration for all module children
const ASSET_TYPES = {
  // ===== MUSIC MODULE =====
  music: {
    label: 'Music',
    icon: Music,
    color: 'text-purple-500',
    moduleType: 'music',
    types: [
      { value: 'music_albums', label: 'Albums' },
      { value: 'music_tracks', label: 'Tracks' },
      { value: 'music_media', label: 'Media' },
      { value: 'music_links', label: 'Links' },
    ],
    assetConfigs: [
      {
        id: 'music_albums',
        label: 'Albums',
        icon: Music,
        assetType: 'music_albums',
        fetchEndpoint: '/api/music/albums',
        searchFields: ['title', 'artist'],
        displayFields: ['title', 'artist', 'year'],
        idField: 'id',
        nameField: 'title',
      },
      {
        id: 'music_tracks',
        label: 'Tracks',
        icon: Music2,
        assetType: 'music_tracks',
        fetchEndpoint: '/api/music/tracks',
        searchFields: ['title'],
        displayFields: ['title', 'duration'],
        idField: 'id',
        nameField: 'title',
      },
      {
        id: 'music_media',
        label: 'Media',
        icon: Image,
        assetType: 'music_media',
        fetchEndpoint: '/api/music/media',
        searchFields: ['fileName'],
        displayFields: ['fileName', 'fileType'],
        idField: 'id',
        nameField: 'fileName',
      },
      {
        id: 'music_links',
        label: 'Links',
        icon: Link2,
        assetType: 'music_links',
        fetchEndpoint: '/api/music/links',
        searchFields: ['title', 'url'],
        displayFields: ['title', 'url'],
        idField: 'id',
        nameField: 'title',
      },
    ],
  },

  // ===== THREED MODULE =====
  threed: {
    label: 'ThreeD',
    icon: Box,
    color: 'text-green-500',
    moduleType: 'threed',
    types: [
      { value: 'threed_plants', label: 'Plants' },
      { value: 'threed_beds', label: 'Beds' },
      { value: 'threed_layers', label: 'Layers' },
      { value: 'threed_markers', label: 'Markers' },
      { value: 'threed_models', label: '3D Models' },
      { value: 'threed_characters', label: 'Characters' },
      { value: 'threed_tasks', label: 'Tasks' },
      { value: 'threed_harvests', label: 'Harvests' },
      { value: 'threed_weather_logs', label: 'Weather Logs' },
      { value: 'threed_farmbots', label: 'FarmBots' },
      { value: 'threed_watering_schedules', label: 'Watering Schedules' },
    ],
    assetConfigs: [
      {
        id: 'threed_plants',
        label: 'Plants',
        icon: Sprout,
        assetType: 'threed_plants',
        fetchEndpoint: '/api/threed/plants',
        searchFields: ['commonName', 'scientificName'],
        displayFields: ['commonName', 'scientificName', 'plantType'],
        idField: 'id',
        nameField: 'commonName',
      },
      {
        id: 'threed_beds',
        label: 'Beds',
        icon: Box,
        assetType: 'threed_beds',
        fetchEndpoint: '/api/threed/beds',
        searchFields: ['name'],
        displayFields: ['name', 'bedType'],
        idField: 'id',
        nameField: 'name',
      },
      {
        id: 'threed_models',
        label: '3D Models',
        icon: Package,
        assetType: 'threed_models',
        fetchEndpoint: '/api/threed/models',
        searchFields: ['modelName'],
        displayFields: ['modelName', 'modelType'],
        idField: 'id',
        nameField: 'modelName',
      },
      {
        id: 'threed_characters',
        label: 'Characters',
        icon: User,
        assetType: 'threed_characters',
        fetchEndpoint: '/api/threed/characters',
        searchFields: ['name'],
        displayFields: ['name', 'characterType'],
        idField: 'id',
        nameField: 'name',
      },
      {
        id: 'threed_layers',
        label: 'Layers',
        icon: Box,
        assetType: 'threed_layers',
        fetchEndpoint: '/api/threed/layers',
        searchFields: ['name'],
        displayFields: ['name', 'layerType'],
        idField: 'id',
        nameField: 'name',
      },
      {
        id: 'threed_markers',
        label: 'Markers',
        icon: MapPin,
        assetType: 'threed_markers',
        fetchEndpoint: '/api/threed/markers',
        searchFields: ['name'],
        displayFields: ['name', 'markerType'],
        idField: 'id',
        nameField: 'name',
      },
      {
        id: 'threed_tasks',
        label: 'Tasks',
        icon: FileText,
        assetType: 'threed_tasks',
        fetchEndpoint: '/api/threed/tasks',
        searchFields: ['title'],
        displayFields: ['title', 'status'],
        idField: 'id',
        nameField: 'title',
      },
      {
        id: 'threed_harvests',
        label: 'Harvests',
        icon: Package,
        assetType: 'threed_harvests',
        fetchEndpoint: '/api/threed/harvests',
        searchFields: ['harvestId'],
        displayFields: ['harvestId', 'quantity'],
        idField: 'id',
        nameField: 'harvestId',
      },
      // {
      //   id: 'threed_weather_logs',
      //   label: 'Weather Logs',
      //   icon: AlertTriangle,
      //   assetType: 'threed_weather_logs',
      //   fetchEndpoint: '/api/threed/weather-logs',
      //   searchFields: ['recordedAt'],
      //   displayFields: ['recordedAt', 'temperature'],
      //   idField: 'id',
      //   nameField: 'recordedAt',
      // },
      {
        id: 'threed_watering_schedules',
        label: 'Watering Schedules',
        icon: AlertTriangle,
        assetType: 'threed_watering_schedules',
        fetchEndpoint: '/api/threed/watering-schedules',
        searchFields: ['scheduleId'],
        displayFields: ['scheduleId', 'frequency'],
        idField: 'id',
        nameField: 'scheduleId',
      },
      {
        id: 'threed_farmbots',
        label: 'FarmBots',
        icon: Box,
        assetType: 'threed_farmbots',
        fetchEndpoint: '/api/threed/farmbots',
        searchFields: ['name'],
        displayFields: ['name', 'status'],
        idField: 'id',
        nameField: 'name',
      },
    ],
  },

  // ===== TRAFFIC MODULE =====
  traffic: {
    label: 'Traffic',
    icon: AlertTriangle,
    color: 'text-blue-500',
    moduleType: 'traffic',
    types: [
      { value: 'traffic_chp_cad_incidents', label: 'CHP-CAD Incidents' },
      { value: 'traffic_chp_centers', label: 'CHP Centers' },
      { value: 'traffic_chp_cases', label: 'CHP Cases' },
      { value: 'traffic_caltrans_lane_closures', label: 'Caltrans Closures' },
      { value: 'traffic_caltrans_districts', label: 'Caltrans Districts' },
      { value: 'traffic_caltrans_cctv_cameras', label: 'CCTV Cameras' },
      { value: 'traffic_bay_area_511_events', label: 'Bay Area 511 Events' },
      { value: 'traffic_calfire_incidents', label: 'CalFire Incidents' },
    ],
    assetConfigs: [
      // ✅ CHP-CAD Incidents
      {
        id: 'traffic_chp_cad_incidents',
        label: 'CHP-CAD Incidents',
        icon: AlertTriangle,
        assetType: 'traffic_chp_cad_incidents',
        fetchEndpoint: '/api/traffic/chp-cad',
        searchFields: ['title', 'incidentId', 'location'],
        displayFields: ['incidentId', 'location', 'status'],
        idField: 'id',
        nameField: 'title',
      },
      // ✅ CHP Centers
      {
        id: 'traffic_chp_centers',
        label: 'CHP Centers',
        icon: Building2,
        assetType: 'traffic_chp_centers',
        fetchEndpoint: '/api/traffic/chp-centers',
        searchFields: ['name', 'centerId', 'city'],
        displayFields: ['centerId', 'city', 'county'],
        idField: 'id',
        nameField: 'name',
      },
      // ✅ CHP Cases
      {
        id: 'traffic_chp_cases',
        label: 'CHP Cases',
        icon: FileText,
        assetType: 'traffic_chp_cases',
        fetchEndpoint: '/api/traffic/chp-cases',
        searchFields: ['title', 'caseId'],
        displayFields: ['caseId', 'type'],
        idField: 'id',
        nameField: 'title',
      },
      // ✅ Caltrans Lane Closures
      {
        id: 'traffic_caltrans_lane_closures',
        label: 'Caltrans Closures',
        icon: Route,
        assetType: 'traffic_caltrans_lane_closures',
        fetchEndpoint: '/api/traffic/caltrans',
        searchFields: ['title', 'closureId', 'route'],
        displayFields: ['closureId', 'route', 'county'],
        idField: 'id',
        nameField: 'title',
      },
      // ✅ Caltrans Districts
      {
        id: 'traffic_caltrans_districts',
        label: 'Caltrans Districts',
        icon: Building2,
        assetType: 'traffic_caltrans_districts',
        fetchEndpoint: '/api/traffic/caltrans-districts',
        searchFields: ['name', 'districtId'],
        displayFields: ['districtId', 'districtNumber', 'region'],
        idField: 'id',
        nameField: 'name',
      },
      // ✅ CCTV Cameras
      {
        id: 'traffic_caltrans_cctv_cameras',
        label: 'CCTV Cameras',
        icon: Camera,
        assetType: 'traffic_caltrans_cctv_cameras',
        fetchEndpoint: '/api/traffic/caltrans-cctv',
        searchFields: ['name', 'cameraId'],
        displayFields: ['cameraId', 'city', 'county'],
        idField: 'id',
        nameField: 'name',
      },
      // ✅ Bay Area 511 Events
      {
        id: 'traffic_bay_area_511_events',
        label: 'Bay Area 511',
        icon: Radio,
        assetType: 'traffic_bay_area_511_events',
        fetchEndpoint: '/api/traffic/bay-area-511',
        searchFields: ['title', 'eventId', 'location'],
        displayFields: ['eventId', 'location', 'eventType'],
        idField: 'id',
        nameField: 'title',
      },
      // ✅ CalFire Incidents
      {
        id: 'traffic_calfire_incidents',
        label: 'CalFire Incidents',
        icon: Flame,
        assetType: 'traffic_calfire_incidents',
        fetchEndpoint: '/api/traffic/calfire',
        searchFields: ['title', 'incidentId', 'location'],
        displayFields: ['incidentId', 'location', 'status'],
        idField: 'id',
        nameField: 'title',
      },
    ],
  },
};

// ✅ Helper functions for session storage
const getStoredAssetTab = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    const stored = sessionStorage.getItem(`${ASSET_TAB_STORAGE_KEY}_${key}`);
    return stored || '';
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return '';
  }
};

const setStoredAssetTab = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${ASSET_TAB_STORAGE_KEY}_${key}`, value);
  } catch (error) {
    console.error('Error writing to sessionStorage:', error);
  }
};

export function ProjectAssetManager({ 
  projectId, 
  userId, 
  moduleType, 
  moduleId,
  onUpdate 
}: ProjectAssetManagerProps) {
  const { showToast, ToastComponent } = useToast();
  const [selectedAssetType, setSelectedAssetType] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigning, setAssigning] = useState<number | null>(null);

  const moduleConfig = ASSET_TYPES[moduleType];
  const ModuleIcon = moduleConfig.icon;

  // ✅ Generate a unique storage key for this module instance
  const storageKey = `${moduleType}_module_${moduleId}`;

  // ✅ Load selected tab from session storage on mount
  useEffect(() => {
    const storedTab = getStoredAssetTab(storageKey);
    const defaultTab = moduleConfig.assetConfigs[0]?.id || '';
    
    if (storedTab && moduleConfig.assetConfigs.some(c => c.id === storedTab)) {
      setSelectedAssetType(storedTab);
    } else {
      setSelectedAssetType(defaultTab);
    }
  }, [moduleType, moduleId]);

  // ✅ Save selected tab to session storage whenever it changes
  useEffect(() => {
    if (selectedAssetType) {
      setStoredAssetTab(storageKey, selectedAssetType);
    }
  }, [selectedAssetType, storageKey]);

  // ✅ Get current asset config
  const currentAssetConfig = moduleConfig.assetConfigs.find(
    config => config.id === selectedAssetType
  );

  useEffect(() => {
    if (currentAssetConfig) {
      fetchAssets();
    }
  }, [projectId, moduleId, moduleType, selectedAssetType]);

  const fetchAssets = async () => {
    if (!currentAssetConfig) return;
    
    setLoading(true);
    try {
      const config = currentAssetConfig;
      const response = await fetch(config.fetchEndpoint);
      const data = await response.json();
      
      if (!data.success) {
        showToast(data.error || `Failed to fetch ${config.label.toLowerCase()}`, 'error');
        setLoading(false);
        return;
      }

      const allAssets = data.data || [];
      
      const assetsWithAssignment = await Promise.all(
        allAssets.map(async (asset: any) => {
          const assigned = await checkAssetAssignment(asset[config.idField]);
          return {
            ...asset,
            id: asset[config.idField],
            name: asset[config.nameField] || `Asset #${asset[config.idField]}`,
            type: config.assetType,
            assigned,
          };
        })
      );

      setAssets(assetsWithAssignment);
    } catch (error) {
      console.error(`Error fetching assets:`, error);
      showToast(`Failed to fetch assets`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkAssetAssignment = async (assetId: number): Promise<boolean> => {
    if (!currentAssetConfig) return false;
    
    try {
      const response = await fetch(
        `/api/project/assets?projectId=${projectId}&moduleId=${moduleId}&moduleType=${moduleType}&assetType=${currentAssetConfig.assetType}&assetId=${assetId}&checkAssignment=true`
      );
      const data = await response.json();
      return data.assigned || false;
    } catch (error) {
      console.error('Error checking assignment:', error);
      return false;
    }
  };

  const handleAssign = async (assetId: number) => {
    if (!currentAssetConfig) return;
    
    setAssigning(assetId);
    try {
      const response = await fetch('/api/project/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          moduleId,
          moduleType: moduleType,
          assetType: currentAssetConfig.assetType,
          assetId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`${currentAssetConfig.label} added to module successfully`, 'success');
        await fetchAssets();
        if (onUpdate) onUpdate();
      } else {
        showToast(data.error || `Failed to add ${currentAssetConfig.label.toLowerCase()} to module`, 'error');
      }
    } catch (error) {
      console.error('Error assigning asset:', error);
      showToast(`Failed to add ${currentAssetConfig.label.toLowerCase()} to module`, 'error');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (assetId: number) => {
    if (!currentAssetConfig) return;
    
    setAssigning(assetId);
    try {
      const response = await fetch(
        `/api/project/assets?projectId=${projectId}&moduleId=${moduleId}&moduleType=${moduleType}&assetType=${currentAssetConfig.assetType}&assetId=${assetId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast(`${currentAssetConfig.label} removed from module successfully`, 'success');
        await fetchAssets();
        if (onUpdate) onUpdate();
      } else {
        showToast(data.error || `Failed to remove ${currentAssetConfig.label.toLowerCase()} from module`, 'error');
      }
    } catch (error) {
      console.error('Error unassigning asset:', error);
      showToast(`Failed to remove ${currentAssetConfig.label.toLowerCase()} from module`, 'error');
    } finally {
      setAssigning(null);
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (!searchQuery || !currentAssetConfig) return true;
    const query = searchQuery.toLowerCase();
    return currentAssetConfig.searchFields.some(field => 
      String(asset[field]).toLowerCase().includes(query)
    );
  });

  const assignedAssets = filteredAssets.filter(a => a.assigned);
  const unassignedAssets = filteredAssets.filter(a => !a.assigned);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ✅ No asset types available
  if (moduleConfig.assetConfigs.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No asset types available for this module
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ToastComponent}

      {/* ✅ Asset Type Selector - Sub-tabs for different asset types */}
      <div className="flex flex-wrap gap-1 border-b pb-1">
        {moduleConfig.assetConfigs.map((config) => {
          const Icon = config.icon;
          const isActive = selectedAssetType === config.id;
          return (
            <Button
              key={config.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={`text-xs h-7 px-2 ${isActive ? '' : config.color}`}
              onClick={() => setSelectedAssetType(config.id)}
            >
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {currentAssetConfig && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={`Search ${currentAssetConfig.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* ✅ Assigned Assets - TIGHTENED SPACING */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b">
              <span className="text-xs font-medium">Assigned to This Module</span>
              <Badge variant="default" className="text-xs">{assignedAssets.length}</Badge>
            </div>
            <div className="p-0">
              {assignedAssets.length === 0 ? (
                <div className="text-center py-2 text-muted-foreground text-xs">
                  No {currentAssetConfig.label.toLowerCase()} assigned
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs py-1">Name</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs py-1">Details</TableHead>
                      <TableHead className="text-right text-xs py-1">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedAssets.map((asset) => (
                      <TableRow key={asset.id} className="hover:bg-muted/50">
                        <TableCell className="py-1 text-sm font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          {asset.name}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-1 text-xs text-muted-foreground">
                          {currentAssetConfig.displayFields.slice(1).map(field => 
                            asset[field] ? String(asset[field]) : ''
                          ).filter(Boolean).join(' • ')}
                        </TableCell>
                        <TableCell className="py-1 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleUnassign(asset.id)}
                            disabled={assigning === asset.id}
                          >
                            {assigning === asset.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            <span className="ml-1">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* ✅ Available Assets - TIGHTENED SPACING */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b">
              <span className="text-xs font-medium">Available Assets</span>
              <Badge variant="secondary" className="text-xs">{unassignedAssets.length}</Badge>
            </div>
            <div className="p-0">
              {unassignedAssets.length === 0 ? (
                <div className="text-center py-2 text-muted-foreground text-xs">
                  {searchQuery ? 'No matching assets found' : `No ${currentAssetConfig.label.toLowerCase()} available`}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs py-1">Name</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs py-1">Details</TableHead>
                      <TableHead className="text-right text-xs py-1">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedAssets.map((asset) => {
                      const Icon = currentAssetConfig.icon;
                      return (
                        <TableRow key={asset.id} className="hover:bg-muted/50">
                          <TableCell className="py-1 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${moduleConfig.color}`} />
                              {asset.name}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-1 text-xs text-muted-foreground">
                            {currentAssetConfig.displayFields.slice(1).map(field => 
                              asset[field] ? String(asset[field]) : ''
                            ).filter(Boolean).join(' • ')}
                          </TableCell>
                          <TableCell className="py-1 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleAssign(asset.id)}
                              disabled={assigning === asset.id}
                            >
                              {assigning === asset.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              <span className="ml-1">Add</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}