// app/admin/projects/[id]/page.tsx - Updated with Create tabs and session storage

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Plus, Box, Car, Music, Edit, Trash2, Save, X, Loader2,
  CheckCircle, XCircle, MoreHorizontal, ChevronDown, ChevronRight,
  FolderOpen, Layers, Sprout, Package, User, AlertTriangle, Music2,
  Image, Link2, FileText, Route, Flame, Radio
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ✅ Import all CRUD Components
import { MusicAlbumCRUD } from '@/components/admin/music/albums/MusicAlbumCRUD';
import { MusicTracksCRUD } from '@/components/admin/music/tracks/MusicTracksCRUD';
import { MusicMediaCRUD } from '@/components/admin/music/media/MusicMediaCRUD';
import { MusicLinksCRUD } from '@/components/admin/music/links/MusicLinksCRUD';

import { ThreeDPlantsCRUD } from '@/components/admin/threed/plants/ThreeDPlantsCRUD';
import { ThreeDPlantingsCRUD } from '@/components/admin/threed/plantings/ThreeDPlantingsCRUD';
import { ThreeDBedsCRUD } from '@/components/admin/threed/beds/ThreeDBedsCRUD';
import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';
import { ThreeDCharactersCRUD } from '@/components/admin/threed/characters/ThreeDCharactersCRUD';
import { ThreeDTasksCRUD } from '@/components/admin/threed/tasks/ThreeDTasksCRUD';
import { ThreeDWateringSchedulesCRUD } from '@/components/admin/threed/watering-schedules/ThreeDWateringSchedulesCRUD';
import { ThreeDHarvestsCRUD } from '@/components/admin/threed/harvests/ThreeDHarvestsCRUD';
import { ThreeDFarmbotsCRUD } from '@/components/admin/threed/farmbots/ThreeDFarmbotsCRUD';
import { ThreeDLayersCRUD } from '@/components/admin/threed/layers/ThreeDLayersCRUD';

import { TrafficCHPCADCRUD } from '@/components/admin/traffic/chp-cad/TrafficCHPCADCRUD';
import { TrafficCHPCentersCRUD } from '@/components/admin/traffic/chp-centers/TrafficCHPCentersCRUD';
import { TrafficCHPCasesCRUD } from '@/components/admin/traffic/chp-cases/TrafficCHPCasesCRUD';
import { TrafficCaltransCRUD } from '@/components/admin/traffic/caltrans/TrafficCaltransCRUD';
import { TrafficCaltransCctvCRUD } from '@/components/admin/traffic/caltrans-cctv/TrafficCaltransCctvCRUD';
import { TrafficCaltransDistrictsCRUD } from '@/components/admin/traffic/caltrans-districts/TrafficCaltransDistrictsCRUD';
import { TrafficCalfireCRUD } from '@/components/admin/traffic/calfire/TrafficCalfireCRUD';
import { TrafficBayArea511CRUD } from '@/components/admin/traffic/bay-area-511/TrafficBayArea511CRUD';

import { ProjectAssetManager } from '@/components/admin/projects/ProjectAssetManager';

interface Project {
  id: number;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  userId: string;
}

interface Module {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  projectId: number;
  slug: string;
  createdAt: string;
}

type ModuleType = 'threed' | 'traffic' | 'music';

// ✅ Module configuration with ALL CRUD components listed
const moduleConfig: Record<ModuleType, { 
  icon: LucideIcon;
  color: string; 
  label: string; 
  borderColor: string;
  crudComponents: Array<{
    id: string;
    label: string;
    component: React.ComponentType<{ onModuleUpdate?: () => void }>;
    icon: LucideIcon;
  }>;
}> = {
  threed: { 
    icon: Box, 
    color: 'text-green-600', 
    label: 'ThreeD',
    borderColor: 'border-green-200',
    crudComponents: [
      { id: 'plants', label: 'Plants', component: ThreeDPlantsCRUD, icon: Sprout },
      { id: 'plantings', label: 'Plantings', component: ThreeDPlantingsCRUD, icon: Box },
      { id: 'beds', label: 'Beds', component: ThreeDBedsCRUD, icon: Box },
      { id: 'models', label: '3D Models', component: ThreeDModelsCRUD, icon: Package },
      { id: 'characters', label: 'Characters', component: ThreeDCharactersCRUD, icon: User },
      { id: 'layers', label: 'Layers', component: ThreeDLayersCRUD, icon: Layers },
      { id: 'tasks', label: 'Tasks', component: ThreeDTasksCRUD, icon: Sprout },
      { id: 'harvests', label: 'Harvests', component: ThreeDHarvestsCRUD, icon: User },
      { id: 'watering-schedules', label: 'Watering Schedules', component: ThreeDWateringSchedulesCRUD, icon: Package },
      { id: 'farmbots', label: 'FarmBots', component: ThreeDFarmbotsCRUD, icon: User },
    ],
  },
  traffic: { 
    icon: Car, 
    color: 'text-blue-600', 
    label: 'Traffic',
    borderColor: 'border-blue-200',
    crudComponents: [
      { id: 'chp-cad', label: 'CHP-CAD Incidents', component: TrafficCHPCADCRUD, icon: AlertTriangle },
      { id: 'chp-centers', label: 'CHP Centers', component: TrafficCHPCentersCRUD, icon: AlertTriangle },
      { id: 'chp-cases', label: 'CHP Cases', component: TrafficCHPCasesCRUD, icon: FileText },
      { id: 'caltrans', label: 'Caltrans Closures', component: TrafficCaltransCRUD, icon: Route },
      { id: 'caltrans-districts', label: 'Caltrans Districts', component: TrafficCaltransDistrictsCRUD, icon: Route },
      { id: 'caltrans-cctv', label: 'CCTV Cameras', component: TrafficCaltransCctvCRUD, icon: Route },
      { id: 'bay-area-511', label: 'Bay Area 511', component: TrafficBayArea511CRUD, icon: Radio },
      { id: 'calfire', label: 'CalFire Incidents', component: TrafficCalfireCRUD, icon: Flame },
    ],
  },
  music: { 
    icon: Music, 
    color: 'text-purple-600', 
    label: 'Music',
    borderColor: 'border-purple-200',
    crudComponents: [
      { id: 'albums', label: 'Albums', component: MusicAlbumCRUD, icon: Music },
      { id: 'tracks', label: 'Tracks', component: MusicTracksCRUD, icon: Music2 },
      { id: 'media', label: 'Media', component: MusicMediaCRUD, icon: Image },
      { id: 'links', label: 'Links', component: MusicLinksCRUD, icon: Link2 },
    ],
  },
};

// Session storage helpers
const STORAGE_KEY = 'project_module_expanded';
const CREATE_TAB_STORAGE_KEY = 'project_create_tab';

const getStoredExpandedState = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
  }
  return {};
};

const setStoredExpandedState = (state: Record<string, boolean>) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error writing to sessionStorage:', error);
  }
};

const getStoredCreateTab = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    const stored = sessionStorage.getItem(`${CREATE_TAB_STORAGE_KEY}_${key}`);
    return stored || '';
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return '';
  }
};

const setStoredCreateTab = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${CREATE_TAB_STORAGE_KEY}_${key}`, value);
  } catch (error) {
    console.error('Error writing to sessionStorage:', error);
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const { data: session, status } = useSession();
  const projectId = parseInt(params.id as string);
  
  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Record<ModuleType, Module[]>>({
    threed: [],
    traffic: [],
    music: [],
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewModuleDialog, setShowNewModuleDialog] = useState(false);
  const [newModuleData, setNewModuleData] = useState({
    type: 'threed' as ModuleType,
    name: '',
    description: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    isActive: true,
  });
  
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    return getStoredExpandedState();
  });

  const [activeModuleTab, setActiveModuleTab] = useState<Record<string, 'assets' | 'create'>>({});
  const [activeCreateTab, setActiveCreateTab] = useState<Record<string, string>>({});

  useEffect(() => {
    setStoredExpandedState(expandedModules);
  }, [expandedModules]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProject();
    }
  }, [projectId, session]);

  const fetchProject = async () => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      const projectRes = await fetch(`/api/project?id=${projectId}`);
      
      if (!projectRes.ok) {
        if (projectRes.status === 404) {
          showToast('Project not found or you do not have access to it', 'error');
          router.push('/admin');
          return;
        }
        if (projectRes.status === 401) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch project');
      }
      
      const projectData = await projectRes.json();
      
      if (!projectData.data) {
        showToast('Project not found', 'error');
        router.push('/admin');
        return;
      }

      if (projectData.data.userId !== session.user.id) {
        showToast('You do not have permission to view this project', 'error');
        router.push('/admin');
        return;
      }

      setProject(projectData.data);
      setFormData({
        name: projectData.data.name || '',
        description: projectData.data.description || '',
        isPublic: projectData.data.isPublic || false,
        isActive: projectData.data.isActive !== false,
      });

      const modulesRes = await fetch(`/api/project/modules?projectId=${projectId}`);
      
      if (modulesRes.status === 404) {
        setModules({ threed: [], traffic: [], music: [] });
      } else if (modulesRes.ok) {
        const modulesData = await modulesRes.json();
        const newModules = modulesData.data || { threed: [], traffic: [], music: [] };
        setModules(newModules);
        
        setExpandedModules(prev => {
          const currentState = { ...prev };
          const storedState = getStoredExpandedState();
          
          Object.entries(newModules).forEach(([type, moduleList]) => {
            (moduleList as Module[]).forEach((mod: Module) => {
              const uniqueKey = `${type}_module_${mod.id}`;
              if (!(uniqueKey in currentState)) {
                if (uniqueKey in storedState) {
                  currentState[uniqueKey] = storedState[uniqueKey];
                } else {
                  currentState[uniqueKey] = false;
                }
              }
            });
          });
          
          const validKeys = new Set<string>();
          Object.entries(newModules).forEach(([type, moduleList]) => {
            (moduleList as Module[]).forEach((mod: Module) => {
              validKeys.add(`${type}_module_${mod.id}`);
            });
          });
          
          Object.keys(currentState).forEach(key => {
            if (!validKeys.has(key)) {
              delete currentState[key];
            }
          });
          
          return currentState;
        });

        // ✅ Initialize create tabs from session storage
        Object.entries(newModules).forEach(([type, moduleList]) => {
          (moduleList as Module[]).forEach((mod: Module) => {
            const uniqueKey = `${type}_module_${mod.id}`;
            const storedTab = getStoredCreateTab(uniqueKey);
            const config = moduleConfig[type as ModuleType];
            const defaultTab = config.crudComponents[0]?.id || '';
            
            if (storedTab && config.crudComponents.some(c => c.id === storedTab)) {
              setActiveCreateTab(prev => ({ ...prev, [uniqueKey]: storedTab }));
            } else if (defaultTab) {
              setActiveCreateTab(prev => ({ ...prev, [uniqueKey]: defaultTab }));
            }
          });
        });
      } else {
        setModules({ threed: [], traffic: [], music: [] });
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load project', 'error');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async () => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/project?id=${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/sign-in');
          return;
        }
        throw new Error('Failed to update project');
      }
      
      showToast('Project updated successfully', 'success');
      setIsEditing(false);
      await fetchProject();
    } catch (error) {
      console.error('Error updating project:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleModuleStatus = async (type: ModuleType, moduleId: number, currentStatus: boolean) => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/${type}?id=${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/sign-in');
          return;
        }
        throw new Error('Failed to update module status');
      }
      
      showToast(`Module ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      await fetchProject();
    } catch (error) {
      console.error('Error toggling module status:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update module status', 'error');
    }
  };

  const createModule = async () => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }

    if (!newModuleData.name.trim()) {
      showToast('Module name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const createResponse = await fetch(`/api/${newModuleData.type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newModuleData.name,
          description: newModuleData.description,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create module');
      }

      const createData = await createResponse.json();
      const moduleId = createData.data.id;

      const addResponse = await fetch(`/api/project/modules?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newModuleData.type,
          moduleId: moduleId,
        }),
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.error || 'Failed to add module to project');
      }

      showToast(`${moduleConfig[newModuleData.type].label} module created and added successfully`, 'success');
      setShowNewModuleDialog(false);
      setNewModuleData({ type: 'threed', name: '', description: '' });
      await fetchProject();
    } catch (error) {
      console.error('Error creating module:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create module', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteModule = async (type: ModuleType, id: number, name: string) => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }

    if (!confirm(`Delete "${name}" module? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/project/modules?projectId=${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, moduleId: id }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/sign-in');
          return;
        }
        throw new Error('Failed to delete module');
      }
      
      showToast('Module deleted successfully', 'success');
      await fetchProject();
    } catch (error) {
      console.error('Error deleting module:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete module', 'error');
    }
  };

  const toggleModuleExpand = (type: ModuleType, moduleId: number) => {
    const uniqueKey = `${type}_module_${moduleId}`;
    setExpandedModules(prev => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey],
    }));
  };

  const setModuleTab = (type: ModuleType, moduleId: number, tab: 'assets' | 'create') => {
    const uniqueKey = `${type}_module_${moduleId}`;
    setActiveModuleTab(prev => ({
      ...prev,
      [uniqueKey]: tab,
    }));
  };

  const getModuleTab = (type: ModuleType, moduleId: number): 'assets' | 'create' => {
    const uniqueKey = `${type}_module_${moduleId}`;
    return activeModuleTab[uniqueKey] || 'assets';
  };

  const setCreateTab = (type: ModuleType, moduleId: number, tabId: string) => {
    const uniqueKey = `${type}_module_${moduleId}`;
    setActiveCreateTab(prev => ({ ...prev, [uniqueKey]: tabId }));
    setStoredCreateTab(uniqueKey, tabId);
  };

  const getCreateTab = (type: ModuleType, moduleId: number): string => {
    const uniqueKey = `${type}_module_${moduleId}`;
    const config = moduleConfig[type];
    const storedTab = activeCreateTab[uniqueKey];
    
    // If stored tab exists and is valid, use it
    if (storedTab && config.crudComponents.some(c => c.id === storedTab)) {
      return storedTab;
    }
    
    // Otherwise return the first available tab
    return config.crudComponents[0]?.id || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAllModules = (): { type: ModuleType; module: Module; uniqueKey: string }[] => {
    const result: { type: ModuleType; module: Module; uniqueKey: string }[] = [];
    (['threed', 'traffic', 'music'] as ModuleType[]).forEach(type => {
      (modules[type] || []).forEach(module => {
        const uniqueKey = `${type}_module_${module.id}`;
        result.push({ type, module, uniqueKey });
      });
    });
    return result;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to access this page</p>
          <Button className="mt-4" onClick={() => router.push('/auth/sign-in')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Project Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/admin')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const allModules = getAllModules();

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Project Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 flex-wrap">
            {project.name}
            <Badge variant={project.isActive ? 'default' : 'secondary'}>
              {project.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {project.isPublic && (
              <Badge variant="outline">Public</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {project.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>ID: {project.id}</span>
            <span>Slug: {project.slug}</span>
            <span>Created: {formatDate(project.createdAt)}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isSubmitting}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-name" className="text-sm">Project Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-description" className="text-sm">Description</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-public"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-public" className="text-sm">Public</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-active" className="text-sm">Active</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={updateProject} disabled={isSubmitting} size="sm">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules Section */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 className="text-xl font-bold">Project Modules</h2>
          <p className="text-sm text-muted-foreground">
            {allModules.length} module{allModules.length !== 1 ? 's' : ''} associated with this project
          </p>
        </div>
        <Dialog open={showNewModuleDialog} onOpenChange={setShowNewModuleDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Module Type</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={newModuleData.type}
                  onChange={(e) => setNewModuleData({ ...newModuleData, type: e.target.value as ModuleType })}
                  disabled={isSubmitting}
                >
                  <option value="threed">ThreeD</option>
                  <option value="traffic">Traffic</option>
                  <option value="music">Music</option>
                </select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g., My Garden"
                  value={newModuleData.name}
                  onChange={(e) => setNewModuleData({ ...newModuleData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Module description..."
                  value={newModuleData.description}
                  onChange={(e) => setNewModuleData({ ...newModuleData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <Button onClick={createModule} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Module'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Module Cards */}
      {allModules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-1">No Modules Yet</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Create your first module to start managing assets for this project.
            </p>
            <Button size="sm" onClick={() => setShowNewModuleDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allModules.map(({ type, module, uniqueKey }) => {
            const config = moduleConfig[type];
            const Icon = config.icon;
            const isExpanded = expandedModules[uniqueKey] || false;
            const activeTab = getModuleTab(type, module.id);

            return (
              <Card 
                key={uniqueKey}
                className={`border-l-4 ${config.borderColor}`}
              >
                {/* Module Header */}
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleModuleExpand(type, module.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{module.name}</h4>
                        <Badge variant={module.isActive ? 'default' : 'secondary'} className="flex-shrink-0">
                          {module.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="flex-shrink-0">
                          {config.label}
                        </Badge>
                      </div>
                      {module.description && (
                        <p className="text-sm text-muted-foreground truncate">{module.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleStatus(type, module.id, module.isActive);
                      }}
                    >
                      {module.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteModule(type, module.id, module.name)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" className="ml-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Module Content */}
                {isExpanded && (
                  <CardContent className="p-3 pt-0">
                    <Tabs 
                      value={activeTab} 
                      onValueChange={(value) => setModuleTab(type, module.id, value as 'assets' | 'create')}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-2">
                        <TabsTrigger value="assets" className="flex items-center gap-2 py-1.5 text-sm">
                          <Layers className="w-4 h-4" />
                          Manage Assigned Assets
                        </TabsTrigger>
                        <TabsTrigger value="create" className="flex items-center gap-2 py-1.5 text-sm">
                          <Plus className="w-4 h-4" />
                          Create New {config.label} Asset
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="assets" className="mt-0">
                        <ProjectAssetManager
                          projectId={projectId}
                          userId={session?.user?.id || ''}
                          moduleType={type}
                          moduleId={module.id}
                          onUpdate={fetchProject}
                        />
                      </TabsContent>

                      <TabsContent value="create" className="max-h-[70vh] overflow-y-auto pr-1 mt-0">
                        {/* ✅ CRUD Components with Tabs */}
                        <Tabs 
                          value={getCreateTab(type, module.id)} 
                          onValueChange={(value) => setCreateTab(type, module.id, value)}
                          className="w-full"
                        >
                          <TabsList className="flex flex-wrap gap-1 mb-2">
                            {config.crudComponents.map((crud) => {
                              const CrudIcon = crud.icon;
                              return (
                                <TabsTrigger 
                                  key={crud.id} 
                                  value={crud.id} 
                                  className="px-2 py-1 text-xs"
                                >
                                  <CrudIcon className="w-3 h-3 mr-1" />
                                  {crud.label}
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                          
                          {config.crudComponents.map((crud) => {
                            const CrudComponent = crud.component;
                            return (
                              <TabsContent key={crud.id} value={crud.id} className="mt-0">
                                {crud.id === 'layers' ? (
                                  <ThreeDLayersCRUD
                                    onModuleUpdate={fetchProject}
                                    userId={session?.user?.id}
                                    projectId={projectId}
                                  />
                                ) : (
                                  <CrudComponent onModuleUpdate={fetchProject} />
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
