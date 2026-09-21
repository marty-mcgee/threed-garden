'use client';

import type { RefObject } from 'react';
import {
  Box,
  ChevronDown,
  ChevronUp,
  Layers,
  ListTree,
  Loader2,
  Plus,
  Save,
  ScanSearch,
  Settings,
  Sprout,
  Touchpad,
  User,
} from 'lucide-react';

import { SceneOperationStatus, type SceneOperationStatusValue } from '@/components/map/panels/SceneOperationStatus';
import { Button } from '@/components/ui/button';
import type { MapViewMode } from '@/libraries/types/map';

interface ProjectSceneToolbarProps {
  selectedProjectId: string | null;
  viewMode: MapViewMode;
  onViewModeChange: (mode: MapViewMode) => void;
  presentationComplete: boolean;
  sceneAddMenuOpen: boolean;
  hasThreeDModule: boolean;
  onToggleSceneAddMenu: () => void;
  onOpenModelLibrary: () => void;
  onOpenCharacterLibrary: () => void;
  onOpenFarmBotLibrary: () => void;
  onOpenBedPlacement: () => void;
  onOpenPlantingPlacement: () => void;
  activeOperation: SceneOperationStatusValue | null;
  onCancelOperation: () => void;
  projectAssetsTriggerRef: RefObject<HTMLButtonElement | null>;
  projectAssetsOpen: boolean;
  projectAssetCount: number;
  onToggleProjectAssets: () => void;
  projectTourOpen: boolean;
  onOpenProjectTour: () => void;
  savingProject: boolean;
  onSaveProject: () => void;
}

export function ProjectSceneToolbar({
  selectedProjectId,
  viewMode,
  onViewModeChange,
  presentationComplete,
  sceneAddMenuOpen,
  hasThreeDModule,
  onToggleSceneAddMenu,
  onOpenModelLibrary,
  onOpenCharacterLibrary,
  onOpenFarmBotLibrary,
  onOpenBedPlacement,
  onOpenPlantingPlacement,
  activeOperation,
  onCancelOperation,
  projectAssetsTriggerRef,
  projectAssetsOpen,
  projectAssetCount,
  onToggleProjectAssets,
  projectTourOpen,
  onOpenProjectTour,
  savingProject,
  onSaveProject,
}: ProjectSceneToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border p-0">
        <Button variant={viewMode === '3d' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => onViewModeChange('3d')} title="3D View">
          <Box className={`h-3.5 w-3.5 ${viewMode === '3d' ? '' : 'text-muted-foreground'}`} />
        </Button>
        <Button variant={viewMode === '2d' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => onViewModeChange('2d')} title="2D View">
          <Touchpad className={`h-3.5 w-3.5 ${viewMode === '2d' ? '' : 'text-muted-foreground'}`} />
        </Button>
        <Button variant={viewMode === 'combined' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => onViewModeChange('combined')} title="Combined View">
          <Layers className={`h-3.5 w-3.5 ${viewMode === 'combined' ? '' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      {selectedProjectId && (
        <Button
          type="button"
          variant={projectTourOpen ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={!presentationComplete || !hasThreeDModule}
          aria-expanded={projectTourOpen}
          aria-controls="project-setup-panel"
          title="Open Project Tour, Help, and Setup"
          onClick={onOpenProjectTour}
        >
          <ScanSearch className="h-3.5 w-3.5" />
          <span>Project Tour</span>
          {projectTourOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      )}

      {selectedProjectId && viewMode !== '2d' && (
        <div id="project-environment-controls-host" className="relative" />
      )}

      {selectedProjectId && viewMode !== '2d' && (
        <div className="relative">
          <Button
            type="button"
            variant={sceneAddMenuOpen ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={!hasThreeDModule}
            aria-expanded={sceneAddMenuOpen}
            title="Add a ThreeD Marker to the Scene"
            onClick={onToggleSceneAddMenu}
          >
            <Plus className="h-3.5 w-3.5" />
            Add to Scene
            {sceneAddMenuOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>

          {sceneAddMenuOpen && (
            <div className="threed-workspace-panel threed-toolbar-dropdown-surface absolute right-0 top-full z-[2000] mt-1 max-h-[min(24rem,70dvh)] w-56 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border p-1.5 shadow-xl backdrop-blur-sm">
              <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">ThreeD Marker Type</div>
              <div className="grid grid-cols-1 gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-8 w-full justify-start text-xs" onClick={onOpenModelLibrary}><Box className="h-3.5 w-3.5" /> Models</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-full justify-start text-xs" onClick={onOpenCharacterLibrary}><User className="h-3.5 w-3.5" /> Characters</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-full justify-start text-xs" onClick={onOpenFarmBotLibrary}><Settings className="h-3.5 w-3.5" /> FarmBots</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-full justify-start text-xs" onClick={onOpenBedPlacement}><Plus className="h-3.5 w-3.5" /> Bed</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-full justify-start text-xs" onClick={onOpenPlantingPlacement}><Sprout className="h-3.5 w-3.5" /> Planting</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedProjectId && viewMode === '2d' && (
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={!hasThreeDModule} title="Add a Model through the supporting 2D Map" onClick={onOpenModelLibrary}>
          <Plus className="h-3.5 w-3.5" /> Add Model
        </Button>
      )}

      <SceneOperationStatus operation={activeOperation} viewMode={viewMode} onCancel={onCancelOperation} />

      {selectedProjectId && (
        <Button ref={projectAssetsTriggerRef} type="button" variant={projectAssetsOpen ? 'secondary' : 'outline'} size="sm" className="h-7 gap-1 px-2 text-xs" aria-expanded={projectAssetsOpen} aria-controls="project-assets-panel" aria-label="Project Assets" title="Browse and focus Project ThreeD Assets" onClick={onToggleProjectAssets}>
          <ListTree className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Project Assets</span>
          <span className="text-[10px] text-muted-foreground">{projectAssetCount}</span>
        </Button>
      )}




      {selectedProjectId && (
        <Button type="button" variant={savingProject ? 'secondary' : 'outline'} size="icon" className="h-7 w-7" disabled={savingProject} aria-label="Save ThreeD Project" title="Save ThreeD Project markers and current view" onClick={onSaveProject}>
          {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-muted-foreground" />}
        </Button>
      )}
    </div>
  );
}
