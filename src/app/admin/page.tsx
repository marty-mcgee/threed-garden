// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Folder, 
  Box, 
  Car, 
  Music,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ModuleCounts {
  threed: number;
  traffic: number;
  music: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleCounts, setModuleCounts] = useState<Record<number, ModuleCounts>>({});
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // app/admin/page.tsx
  // The fetchProjects function already gets the correct project IDs
  // The issue is that fetchModuleCounts is called with the project.id from the response

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/project');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.data || []);
      
      // ✅ Fetch module counts for each project using the project.id from the response
      for (const project of data.data || []) {
        console.log(`🔍 Fetching modules for project ${project.id}:`, project);
        await fetchModuleCounts(project.id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  // app/admin/page.tsx - Updated fetchModuleCounts
  const fetchModuleCounts = async (projectId: number) => {
    try {
      const response = await fetch(`/api/project/modules?projectId=${projectId}`);
      
      // ✅ If response is not OK (500, 401, etc.), handle gracefully
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch modules for project ${projectId}: ${response.status}`);
        setModuleCounts(prev => ({ 
          ...prev, 
          [projectId]: { threed: 0, traffic: 0, music: 0 } 
        }));
        return;
      }
      
      const data = await response.json();
      
      // ✅ Handle case where data is empty or missing
      if (!data.success || !data.data) {
        console.log(`ℹ️ No module data for project ${projectId}`);
        setModuleCounts(prev => ({ 
          ...prev, 
          [projectId]: { threed: 0, traffic: 0, music: 0 } 
        }));
        return;
      }
      
      const counts = {
        threed: data.data.threed?.length || 0,
        traffic: data.data.traffic?.length || 0,
        music: data.data.music?.length || 0,
      };
      
      setModuleCounts(prev => ({ ...prev, [projectId]: counts }));
    } catch (error) {
      // ✅ Network errors handled gracefully
      console.warn(`⚠️ Network error fetching modules for project ${projectId}:`, error);
      setModuleCounts(prev => ({ 
        ...prev, 
        [projectId]: { threed: 0, traffic: 0, music: 0 } 
      }));
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated modules.')) return;
    
    setDeleting(id);
    try {
      // ✅ DELETE /api/project?id=1 - Delete a project
      const response = await fetch(`/api/project?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete project');
      }
      
      showToast('Project deleted successfully', 'success');
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete project', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ToastComponent}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and their modules
          </p>
        </div>
        <Button onClick={() => router.push('/admin/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <Folder className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.isActive).length}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Public</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.isPublic).length}</p>
              </div>
              <EyeOff className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Modules</p>
                <p className="text-2xl font-bold">
                  {Object.values(moduleCounts).reduce((sum, counts) => 
                    sum + counts.threed + counts.traffic + counts.music, 0
                  )}
                </p>
              </div>
              <Box className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No projects yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/admin/projects/new')}
              >
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const counts = moduleCounts[project.id] || { threed: 0, traffic: 0, music: 0 };
                const totalModules = counts.threed + counts.traffic + counts.music;
                
                return (
                  <div 
                    key={project.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      project.isActive ? 'hover:bg-muted/50' : 'opacity-60 bg-muted/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <Folder className={`w-5 h-5 flex-shrink-0 ${project.isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        <div className="min-w-0">
                          <h3 className="font-semibold flex items-center gap-2 truncate">
                            {project.name}
                            {!project.isActive && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">Inactive</Badge>
                            )}
                            {project.isPublic && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">Public</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {project.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Box className="w-3 h-3" />
                          {counts.threed} ThreeD
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {counts.traffic} Traffic
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {counts.music} Music
                        </Badge>
                        <Badge variant="secondary">
                          {totalModules} total modules
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/admin/projects/${project.id}`)}
                      >
                        Manage
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteProject(project.id)}
                        disabled={deleting === project.id}
                      >
                        {deleting === project.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}