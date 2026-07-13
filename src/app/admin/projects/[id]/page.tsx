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
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    isActive: true,
  });
  const [showNewModuleDialog, setShowNewModuleDialog] = useState(false);
  const [newModuleData, setNewModuleData] = useState({
    type: 'threed' as ModuleType,
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingModule, setDeletingModule] = useState<{ type: ModuleType; id: number } | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      // ✅ Using the correct Next.js 16 pattern - params is a Promise
      const projectRes = await fetch(`/api/project/${projectId}`);
      if (!projectRes.ok) {
        const error = await projectRes.json();
        throw new Error(error.error || 'Failed to fetch project');
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

      // ✅ Fetch modules using the correct pattern
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to update project');
      }
      
      showToast('Project updated successfully', 'success');
      setEditing(false);
      await fetchProject();
    } catch (error) {
      console.error('Error updating project:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update project', 'error');
    } finally {
      setIsSubmitting(false);
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to create module');
      }
      
      showToast('Module created successfully', 'success');
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

  const deleteModule = async (type: ModuleType, id: number) => {
    if (!confirm(`Delete this ${type} module?`)) return;

    setDeletingModule({ type, id });
    try {
      const response = await fetch(`/api/project/${projectId}/modules`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, moduleId: id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete module');
      }
      
      showToast('Module deleted successfully', 'success');
      await fetchProject();
    } catch (error) {
      console.error('Error deleting module:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete module', 'error');
    } finally {
      setDeletingModule(null);
    }
  };

  const moduleConfig = {
    threed: { icon: Box, color: 'text-green-500', label: 'ThreeD' },
    traffic: { icon: Car, color: 'text-blue-500', label: 'Traffic' },
    music: { icon: Music, color: 'text-purple-500', label: 'Music' },
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
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 flex-wrap">
            {project.name}
            {!project.isActive && (
              <Badge variant="secondary">Inactive</Badge>
            )}
            {project.isPublic && (
              <Badge variant="outline">Public</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">{project.description || 'No description'}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant="outline">ID: {project.id}</Badge>
            <span className="text-xs text-muted-foreground">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditing(!editing)} disabled={isSubmitting}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Edit Form */}
      {editing && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    disabled={isSubmitting}
                  />
                  <Label>Public</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label>Active</Label>
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
                <Button variant="outline" onClick={() => setEditing(false)} disabled={isSubmitting}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules Section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Modules</h2>
        <Dialog open={showNewModuleDialog} onOpenChange={setShowNewModuleDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
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

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(moduleConfig).map(([type, config]) => {
          const moduleList = modules[type as ModuleType] || [];
          const Icon = config.icon;
          
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  {config.label}
                  <Badge variant="secondary" className="ml-2">
                    {moduleList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moduleList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No {config.label} modules</p>
                ) : (
                  <div className="space-y-2">
                    {moduleList.map((mod) => (
                      <div key={mod.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="min-w-0">
                          <span className="text-sm font-medium">{mod.name}</span>
                          {mod.description && (
                            <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => deleteModule(type as ModuleType, mod.id)}
                          disabled={deletingModule?.type === type && deletingModule?.id === mod.id}
                        >
                          {deletingModule?.type === type && deletingModule?.id === mod.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 text-red-500" />
                          )}
                        </Button>
                      </div>
                    ))}
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