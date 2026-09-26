'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Loader2, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ProjectSelectorItem {
  id: number | string;
  name: string;
  slug?: string | null;
  description?: string | null;
  assetCount?: number | null;
}

interface ProjectSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (projectId: string) => void;
  onCreateNew: () => void;
}

export function ProjectSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  onCreateNew,
}: ProjectSelectorDialogProps) {
  const [projects, setProjects] = useState<ProjectSelectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!open) return;

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

    void loadProjects();
  }, [open]);

  const normalizedSearchQuery = searchQuery.toLowerCase();
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(normalizedSearchQuery)
    || project.slug?.toLowerCase().includes(normalizedSearchQuery)
  );

  const handleSelect = (projectId: string) => {
    onSelect(projectId);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-md flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Project</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-8"
          />
        </div>
        <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p className="text-sm font-medium">
                {searchQuery ? 'No matching projects' : 'No projects found'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Button
                key={project.id}
                variant="ghost"
                className="h-auto w-full justify-start px-3 py-2 text-left"
                onClick={() => handleSelect(String(project.id))}
              >
                <div className="flex w-full items-center gap-3">
                  <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{project.name}</div>
                    {project.description && (
                      <div className="truncate text-xs text-muted-foreground">
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
        <div className="mt-4 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
