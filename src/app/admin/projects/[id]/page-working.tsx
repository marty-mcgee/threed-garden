// app/admin/projects/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  MoreHorizontal
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

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      // Fetch project
      const projectRes = await fetch(`/api/project/${projectId}`);
      if (!projectRes.ok) {
        throw new Error('Failed to fetch project');
      }
      const projectData = await projectRes.json();
      
      if (!projectData.data) {
        showToast('Project not found', 'error');
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

      // Fetch modules
      const modulesRes = await fetch(`/api/project/${projectId}/modules`);
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
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
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
    try {
      const response = await fetch(`/api/${type}/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) {
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
    if (!newModuleData.name.trim()) {
      showToast('Module name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/project/${projectId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newModuleData.type,
          name: newModuleData.name,
          description: newModuleData.description,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create module');
      }
      
      showToast(`${moduleConfig[newModuleData.type].label} module created successfully`, 'success');
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
    if (!confirm(`Delete "${name}" module? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/project/${projectId}/modules`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, moduleId: id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete module');
      }
      
      showToast('Module deleted successfully', 'success');
      await fetchProject();
    } catch (error) {
      console.error('Error deleting module:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete module', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${config.color}`} />
                  <CardTitle className="text-lg">{config.label}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {moduleList.length} {moduleList.length === 1 ? 'module' : 'modules'}
                  </Badge>
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
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}