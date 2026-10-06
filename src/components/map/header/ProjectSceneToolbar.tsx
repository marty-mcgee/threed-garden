'use client';

import type { RefObject } from 'react';
import {
  Box,
  Boxes,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  onOpenAddShape: () => void;
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
  setupMenuOpen: boolean;
  onSetupMenuOpenChange: (open: boolean) => void;
  scenariosOpen: boolean;
  onOpenScenarios: () => void;
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
  onOpenAddShape,
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
  setupMenuOpen,
  onSetupMenuOpenChange,
  scenariosOpen,
  onOpenScenarios,
  projectTourOpen,
  onOpenProjectTour,
  savingProject,
  onSaveProject,
}: ProjectSceneToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <div role="group" aria-label="Scene view mode" className="threed-view-modes flex items-center gap-0 rounded-lg border p-0">
        <Button variant={viewMode === '3d' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" aria-pressed={viewMode === '3d'} onClick={() => onViewModeChange('3d')} title="3D View">
          <Box className="h-3.5 w-3.5" />
        </Button>
        <Button variant={viewMode === '2d' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" aria-pressed={viewMode === '2d'} onClick={() => onViewModeChange('2d')} title="2D View">
          <Touchpad className="h-3.5 w-3.5" />
        </Button>
        <Button variant={viewMode === 'combined' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" aria-pressed={viewMode === 'combined'} onClick={() => onViewModeChange('combined')} title="Combined View">
          <Layers className="h-3.5 w-3.5" />
        </Button>
      </div>

      {selectedProjectId && (
        <DropdownMenu open={setupMenuOpen} onOpenChange={onSetupMenuOpenChange} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant={setupMenuOpen ? 'secondary' : 'outline'} size="sm"
              className="h-7 gap-1 px-2 text-xs" disabled={!presentationComplete || !hasThreeDModule}>
              <Settings className="h-3.5 w-3.5" /> Setup
              {setupMenuOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="threed-workspace-panel threed-toolbar-dropdown-surface z-[2000] w-56 space-y-0.5 rounded-lg border-foreground/10 p-1.5 text-foreground shadow-xl backdrop-blur-sm">
            <DropdownMenuItem className="threed-toolbar-menu-item" onSelect={onOpenProjectTour}><ScanSearch className="h-3.5 w-3.5" /> Project Tour</DropdownMenuItem>
            <DropdownMenuItem className="threed-toolbar-menu-item" onSelect={onOpenScenarios}><Layers className="h-3.5 w-3.5" /> Open Scenario</DropdownMenuItem>
            <DropdownMenuItem className="threed-toolbar-menu-item" onSelect={() => window.dispatchEvent(new CustomEvent('threed:simulation-panel', { detail: { projectId: Number(selectedProjectId) } }))}><Layers className="h-3.5 w-3.5" /> Show / Hide Simulations</DropdownMenuItem>
            <DropdownMenuItem className="threed-toolbar-menu-item" asChild><a href="/dashboard/assembly-groups" target="_blank" rel="noopener noreferrer"><Boxes className="h-3.5 w-3.5" /> Assembly Groups</a></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            Add
            {sceneAddMenuOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>

          {sceneAddMenuOpen && (
            <div className="threed-workspace-panel threed-toolbar-dropdown-surface absolute right-0 top-full z-[2000] mt-1 max-h-[min(24rem,70dvh)] w-56 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border p-1.5 shadow-xl backdrop-blur-sm">
              <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">ThreeD Marker Type</div>
              <div className="grid grid-cols-1 gap-0.5">
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" onClick={onOpenAddShape}><Plus className="h-3.5 w-3.5" /> Shapes</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" onClick={onOpenModelLibrary}><Box className="h-3.5 w-3.5" /> Models</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" onClick={onOpenCharacterLibrary}><User className="h-3.5 w-3.5" /> Characters</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" onClick={onOpenFarmBotLibrary}><Settings className="h-3.5 w-3.5" /> FarmBots</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" onClick={onOpenBedPlacement}><Plus className="h-3.5 w-3.5" /> Beds</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" onClick={onOpenPlantingPlacement}><Sprout className="h-3.5 w-3.5" /> Plantings</Button>
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
          <span className="hidden sm:inline">Assets</span>
          <span className="text-[10px] text-muted-foreground">{projectAssetCount}</span>
        </Button>
      )}




      {selectedProjectId && (
        <Button type="button" variant={savingProject ? 'secondary' : 'outline'} size="icon" className="h-7 w-7" disabled={savingProject} aria-label="Save ThreeD Project" title="Save ThreeD Project markers and current view" onClick={onSaveProject}>
          {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-foreground dark:text-white" />}
        </Button>
      )}
    </div>
  );
}
