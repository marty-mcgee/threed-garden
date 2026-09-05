'use client';

import type { RefObject } from 'react';
import {
  Clock,
  ExternalLink,
  FolderOpen,
  ListTree,
  Loader2,
  Plus,
  Save,
  ScanSearch,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ProjectHeaderEnvironmentItem {
  id: string;
  name: string;
}

export function ProjectHeaderMenu({
  containerRef,
  selectedProjectId,
  projectName,
  isOpen,
  trafficItemCount,
  threeDItemCount,
  hasRealData,
  isStale,
  dataAge,
  lastUpdated,
  savingProject,
  projectAssetCount,
  projectAssetsOpen,
  environments,
  onTrigger,
  onChooseProject,
  onCreateProject,
  onSaveProject,
  onOpenProjectAssets,
  onOpenEnvironment,
  onOpenProjectSettings,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  selectedProjectId: string | null;
  projectName?: string | null;
  isOpen: boolean;
  trafficItemCount: number;
  threeDItemCount: number;
  hasRealData: boolean;
  isStale: boolean;
  dataAge: string;
  lastUpdated: Date | null;
  savingProject: boolean;
  projectAssetCount: number;
  projectAssetsOpen: boolean;
  environments: ProjectHeaderEnvironmentItem[];
  onTrigger: () => void;
  onChooseProject: () => void;
  onCreateProject: () => void;
  onSaveProject: () => void;
  onOpenProjectAssets: () => void;
  onOpenEnvironment: (id: string) => void;
  onOpenProjectSettings: () => void;
}) {
  return (
    <div ref={containerRef} className="relative flex flex-col items-start">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs font-medium"
        aria-expanded={selectedProjectId ? isOpen : undefined}
        onClick={onTrigger}
      >
        <FolderOpen className="h-3.5 w-3.5" />
        {selectedProjectId ? projectName || `Project #${selectedProjectId}` : 'Select Project'}
        {isOpen && selectedProjectId
          ? <ChevronDown className="h-3.5 w-3.5" />
          : <ChevronRight className="h-3.5 w-3.5" />}
      </Button>

      {selectedProjectId && isOpen && (
        <div className="absolute left-0 top-full z-[2000] mt-1 w-72 space-y-2 rounded-lg border bg-background/80 p-2.5 shadow-xl backdrop-blur-md">
          <div className="space-y-1.5 px-1">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <FolderOpen className="h-3 w-3" />
              Project Status
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">{trafficItemCount} traffic items</Badge>
              <Badge variant="outline" className="text-[10px]">{threeDItemCount} 3D items</Badge>
              {!hasRealData && <Badge variant="secondary" className="text-[10px] text-muted-foreground">No Data</Badge>}
            </div>
            <div className="flex items-center gap-1.5 py-0.5">
              <Clock className={`h-3 w-3 ${isStale ? 'text-amber-600' : dataAge !== '--' ? 'text-green-600' : 'text-muted-foreground'}`} />
              <span
                className={`text-xs ${isStale ? 'text-amber-600' : dataAge !== '--' ? 'text-green-600' : 'text-muted-foreground'}`}
                title={lastUpdated?.toLocaleString() || 'Unknown'}
              >
                {dataAge !== '--' ? `Updated ${dataAge}` : 'Update time unavailable'}
              </span>
            </div>
          </div>

          <div className="border-t pt-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Project Navigation</div>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <Button type="button" variant="secondary" size="sm" className="h-8 justify-start px-2 text-xs" onClick={onChooseProject}>
                <FolderOpen className="h-3.5 w-3.5" /> Choose Project
              </Button>
              <Button type="button" size="sm" className="h-8 justify-start bg-cyan-600 px-2 text-xs text-white hover:bg-cyan-500" onClick={onCreateProject}>
                <Plus className="h-3.5 w-3.5" /> New Project
              </Button>
            </div>
          </div>

          <div className="space-y-0.5 border-t pt-2">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Scene Workspace</div>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-full justify-start px-2 text-xs" disabled={savingProject} onClick={onSaveProject}>
              {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save ThreeD Project
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-full justify-start px-2 text-xs" aria-controls="project-assets-panel" aria-expanded={projectAssetsOpen} onClick={onOpenProjectAssets}>
              <ListTree className="h-3.5 w-3.5" />
              Project Assets
              <span className="ml-auto text-[10px] text-muted-foreground">{projectAssetCount}</span>
            </Button>
            {environments.map((environment) => (
              <Button key={environment.id} type="button" variant="ghost" size="sm" className="h-7 w-full justify-start px-2 text-xs" onClick={() => onOpenEnvironment(environment.id)}>
                <ScanSearch className="h-3.5 w-3.5" />
                Environment Details
                {environments.length > 1 && <span className="min-w-0 truncate text-muted-foreground">— {environment.name}</span>}
              </Button>
            ))}
          </div>

          <div className="border-t pt-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 w-full justify-start px-2 text-xs text-muted-foreground" onClick={onOpenProjectSettings}>
              <ExternalLink className="h-3.5 w-3.5" /> Project Settings &amp; Admin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
