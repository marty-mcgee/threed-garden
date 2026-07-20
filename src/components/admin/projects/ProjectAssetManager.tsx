// components/admin/projects/ProjectAssetManager.tsx - Updated with module awareness

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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  moduleId: number; // ✅ NEW: The specific module ID
  onUpdate?: () => void;
}

const ASSET_TYPES = {
  music: {
    label: 'Music Albums',
    icon: Music,
    color: 'text-purple-500',
    assetType: 'music_albums',
    fetchEndpoint: '/api/music/albums',
    searchFields: ['title', 'artist'],
    displayFields: ['title', 'artist'],
    idField: 'id',
    nameField: 'title',
    moduleType: 'music',
  },
  threed: {
    label: 'Plants',
    icon: Sprout,
    color: 'text-green-500',
    assetType: 'threed_plants',
    fetchEndpoint: '/api/threed/plants',
    searchFields: ['name', 'scientificName'],
    displayFields: ['name', 'scientificName'],
    idField: 'id',
    nameField: 'name',
    moduleType: 'threed',
  },
  traffic: {
    label: 'CHP-CAD Incidents',
    icon: AlertTriangle,
    color: 'text-blue-500',
    assetType: 'traffic_chp_cad_incidents',
    fetchEndpoint: '/api/traffic/chp-cad',
    searchFields: ['incidentNumber', 'location'],
    displayFields: ['incidentNumber', 'location'],
    idField: 'id',
    nameField: 'incidentNumber',
    moduleType: 'traffic',
  },
};

export function ProjectAssetManager({ 
  projectId, 
  userId, 
  moduleType, 
  moduleId, // ✅ NEW: The specific module ID
  onUpdate 
}: ProjectAssetManagerProps) {
  const { showToast, ToastComponent } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigning, setAssigning] = useState<number | null>(null);

  const config = ASSET_TYPES[moduleType];
  const Icon = config.icon;

  useEffect(() => {
    fetchAssets();
  }, [projectId, moduleId, moduleType]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      // Fetch ALL assets of this type
      const response = await fetch(config.fetchEndpoint);
      const data = await response.json();
      
      if (!data.success) {
        showToast(data.error || `Failed to fetch ${config.label.toLowerCase()}`, 'error');
        setLoading(false);
        return;
      }

      const allAssets = data.data || [];
      
      // ✅ Check assignment status for each asset - now scoped to module
      const assetsWithAssignment = await Promise.all(
        allAssets.map(async (asset: any) => {
          const assigned = await checkAssetAssignment(asset[config.idField]);
          return {
            ...asset,
            id: asset[config.idField],
            name: asset[config.nameField],
            type: config.assetType,
            assigned,
          };
        })
      );

      setAssets(assetsWithAssignment);
    } catch (error) {
      console.error(`Error fetching ${config.label.toLowerCase()}:`, error);
      showToast(`Failed to fetch ${config.label.toLowerCase()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkAssetAssignment = async (assetId: number): Promise<boolean> => {
    try {
      // ✅ Include moduleId in the check
      const response = await fetch(
        `/api/project/assets?projectId=${projectId}&moduleId=${moduleId}&moduleType=${config.moduleType}&assetType=${config.assetType}&assetId=${assetId}&checkAssignment=true`
      );
      const data = await response.json();
      return data.assigned || false;
    } catch (error) {
      console.error('Error checking assignment:', error);
      return false;
    }
  };

  const handleAssign = async (assetId: number) => {
    setAssigning(assetId);
    try {
      // ✅ Include moduleId in the POST
      const response = await fetch('/api/project/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          moduleId,
          moduleType: config.moduleType,
          assetType: config.assetType,
          assetId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`${config.label} added to module successfully`, 'success');
        await fetchAssets();
        if (onUpdate) onUpdate();
      } else {
        showToast(data.error || `Failed to add ${config.label.toLowerCase()} to module`, 'error');
      }
    } catch (error) {
      console.error('Error assigning asset:', error);
      showToast(`Failed to add ${config.label.toLowerCase()} to module`, 'error');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (assetId: number) => {
    setAssigning(assetId);
    try {
      // ✅ Include moduleId in the DELETE
      const response = await fetch(
        `/api/project/assets?projectId=${projectId}&moduleId=${moduleId}&moduleType=${config.moduleType}&assetType=${config.assetType}&assetId=${assetId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast(`${config.label} removed from module successfully`, 'success');
        await fetchAssets();
        if (onUpdate) onUpdate();
      } else {
        showToast(data.error || `Failed to remove ${config.label.toLowerCase()} from module`, 'error');
      }
    } catch (error) {
      console.error('Error unassigning asset:', error);
      showToast(`Failed to remove ${config.label.toLowerCase()} from module`, 'error');
    } finally {
      setAssigning(null);
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return config.searchFields.some(field => 
      String(asset[field]).toLowerCase().includes(query)
    );
  });

  const assignedAssets = filteredAssets.filter(a => a.assigned);
  const unassignedAssets = filteredAssets.filter(a => !a.assigned);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Module Identifier */}
      <div className="text-xs text-muted-foreground">
        Module ID: {moduleId} • {config.label}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${config.label.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Assigned Assets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Assigned to This Module</span>
            <Badge variant="default">{assignedAssets.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedAssets.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No {config.label.toLowerCase()} assigned to this module
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Details</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {asset.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {config.displayFields.slice(1).map(field => 
                        asset[field] ? String(asset[field]) : ''
                      ).filter(Boolean).join(' • ')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleUnassign(asset.id)}
                        disabled={assigning === asset.id}
                      >
                        {assigning === asset.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span className="ml-1">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Available Assets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Available Assets</span>
            <Badge variant="secondary">{unassignedAssets.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unassignedAssets.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {searchQuery ? 'No matching assets found' : `No ${config.label.toLowerCase()} available`}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Details</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        {asset.name}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {config.displayFields.slice(1).map(field => 
                        asset[field] ? String(asset[field]) : ''
                      ).filter(Boolean).join(' • ')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleAssign(asset.id)}
                        disabled={assigning === asset.id}
                      >
                        {assigning === asset.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span className="ml-1">Add</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}