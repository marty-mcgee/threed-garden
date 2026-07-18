// app/admin/projects/[id]/page.tsx - Updated API calls
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft,
  Plus,
  Box,
  Car,
  Music,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';

// ✅ Import the "Music Album" CRUD component
import { MusicAlbumCRUD } from '@/components/admin/music/albums/MusicAlbumCRUD';
// ✅ Import the "ThreeD Plants" CRUD component
import { ThreeDPlantsCRUD } from '@/components/admin/threed/plants/ThreeDPlantsCRUD';
// ✅ Import the "Traffic CHP-CAD (Live Incidents)" CRUD component
import { TrafficCHPCADCRUD } from '@/components/admin/traffic/chp-cad/TrafficCHPCADCRUD';

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

const moduleConfig: Record<ModuleType, { icon: React.ElementType; color: string; label: string }> = {
  threed: { icon: Box, color: 'text-green-500', label: 'ThreeD' },
  traffic: { icon: Car, color: 'text-blue-500', label: 'Traffic' },
  music: { icon: Music, color: 'text-purple-500', label: 'Music' },
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
  
  const [expandedModules, setExpandedModules] = useState<Record<ModuleType, boolean>>({
    threed: false,
    traffic: false,
    music: true,
  });

  // ✅ Check authentication
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
      router.push('/auth/sign-in');
      return;
    }

    setLoading(true);
    try {
      // ✅ GET /api/project?id=1 - Get project
      const projectRes = await fetch(`/api/project?id=${projectId}`);
      if (!projectRes.ok) {
        if (projectRes.status === 401) {
          router.push('/auth/sign-in');
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

      // ✅ GET /api/project/modules?projectId=1 - Get modules
      const modulesRes = await fetch(`/api/project/modules?projectId=${projectId}`);
      if (!modulesRes.ok) {
        throw new Error('Failed to fetch modules');
      }
      const modulesData = await modulesRes.json();
      setModules(modulesData.data || { threed: [], traffic: [], music: [] });
    } catch (error) {
      console.error('Error fetching project:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load project', 'error');
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
      // ✅ PATCH /api/project?id=1 - Update project
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
      // ✅ PATCH /api/[module]?id=1 - Toggle module status
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
      // ✅ STEP 1: Create the module first
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

      // ✅ STEP 2: Add the module to the project using the junction table
      const addResponse = await fetch(`/api/project/modules?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newModuleData.type,
          moduleId: moduleId, // ✅ Now sending the numeric ID, not the name
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
      // ✅ DELETE /api/project/modules?projectId=1 - Remove module from project
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

  const toggleExpand = (type: ModuleType) => {
    setExpandedModules(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ToastComponent}

      <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Projects
      </Button>

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
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
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
                  <Label htmlFor="edit-public">Public</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={updateProject} disabled={isSubmitting}>
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
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules Section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Modules</h2>
          <p className="text-muted-foreground">
            Manage modules associated with this project
          </p>
        </div>
        <Dialog open={showNewModuleDialog} onOpenChange={setShowNewModuleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
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

      {/* Module Tables */}
      <div className="space-y-6">
        {(['threed', 'traffic', 'music'] as ModuleType[]).map((type) => {
          const config = moduleConfig[type];
          const Icon = config.icon;
          const moduleList = modules[type] || [];
          const isExpanded = expandedModules[type];

          return (
            <Card key={type}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(type)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${config.color}`} />
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {moduleList.length} {moduleList.length === 1 ? 'module' : 'modules'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {moduleList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No {config.label} modules yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        setNewModuleData({ type, name: '', description: '' });
                        setShowNewModuleDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add {config.label} Module
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Description</TableHead>
                          <TableHead className="hidden sm:table-cell">Created</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moduleList.map((mod) => (
                          <TableRow key={mod.id}>
                            <TableCell className="font-medium">{mod.name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {mod.description || '—'}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {formatDate(mod.createdAt)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                {mod.isActive ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm">
                                  {mod.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleModuleStatus(type, mod.id, mod.isActive)}
                                >
                                  {mod.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => deleteModule(type, mod.id, mod.name)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t">
                        {type === 'music' && (
                          <div className="space-y-4">
                            {moduleList.map((mod) => (
                              <div key={mod.id} className="ml-4 pl-4 border-l-2 border-purple-200">
                                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                                  Albums for: <span className="text-foreground">{mod.name}</span>
                                </h4>
                                <MusicAlbumCRUD
                                  // userId={session.user.id}
                                  onModuleUpdate={fetchProject}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {type === 'threed' && (
                          <div className="space-y-4">
                            {moduleList.map((mod) => (
                              <div key={mod.id} className="ml-4 pl-4 border-l-2 border-green-200">
                                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                                  Plants for: <span className="text-foreground">{mod.name}</span>
                                </h4>
                                <ThreeDPlantsCRUD
                                  // userId={session.user.id}
                                  onModuleUpdate={fetchProject}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {type === 'traffic' && (
                          <div className="space-y-4">
                            {moduleList.map((mod) => (
                              <div key={mod.id} className="ml-4 pl-4 border-l-2 border-blue-200">
                                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                                  CHP-CAD Incidents for: <span className="text-foreground">{mod.name}</span>
                                </h4>
                                <TrafficCHPCADCRUD
                                  // userId={session.user.id}
                                  onModuleUpdate={fetchProject}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}