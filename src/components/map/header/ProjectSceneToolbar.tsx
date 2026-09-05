'use client';

import type { RefObject } from 'react';
import {
  Box,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  ListTree,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ScanSearch,
  Settings,
  Sparkles,
  Sprout,
  Touchpad,
  User,
} from 'lucide-react';

import { SceneOperationStatus, type SceneOperationStatusValue } from '@/components/map/panels/SceneOperationStatus';
import { Button } from '@/components/ui/button';
import type { MapViewMode } from '@/lib/types/map';

interface ProjectSceneToolbarProps {
  selectedProjectId: string | null;
  viewMode: MapViewMode;
  onViewModeChange: (mode: MapViewMode) => void;
  projectSetupOpen: boolean;
  presentationComplete: boolean;
  onToggleProjectSetup: () => void;
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
  hasEnvironment: boolean;
  onOpenEnvironment: () => void;
  savingProject: boolean;
  onSaveProject: () => void;
  filterPanelOpen: boolean;
  hasAssetTypeFilter: boolean;
  onToggleFilterPanel: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export function ProjectSceneToolbar({
  selectedProjectId,
  viewMode,
  onViewModeChange,
  projectSetupOpen,
  presentationComplete,
  onToggleProjectSetup,
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
  hasEnvironment,
  onOpenEnvironment,
  savingProject,
  onSaveProject,
  filterPanelOpen,
  hasAssetTypeFilter,
  onToggleFilterPanel,
  refreshing,
  onRefresh,
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
          variant={projectSetupOpen ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={!presentationComplete}
          aria-expanded={projectSetupOpen}
          aria-controls="project-setup-panel"
          title={presentationComplete ? 'Open Project setup guidance' : 'Project setup guidance is available after the ThreeD Scene loads'}
          onClick={onToggleProjectSetup}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Setup</span>
        </Button>
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
            <div className="absolute right-0 top-full z-[2000] mt-1 w-52 rounded-lg border bg-background/95 p-1.5 shadow-xl backdrop-blur-sm">
              <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ThreeD Marker Type</div>
              <div className="grid grid-cols-2 gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-8 justify-start text-xs" onClick={onOpenModelLibrary}><Box className="h-3.5 w-3.5" /> Models</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 justify-start text-xs" onClick={onOpenCharacterLibrary}><User className="h-3.5 w-3.5" /> Characters</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 justify-start text-xs" onClick={onOpenFarmBotLibrary}><Settings className="h-3.5 w-3.5" /> FarmBots</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 justify-start text-xs" onClick={onOpenBedPlacement}><Plus className="h-3.5 w-3.5" /> Bed</Button>
                <Button type="button" variant="ghost" size="sm" className="col-span-2 h-8 justify-start text-xs" onClick={onOpenPlantingPlacement}><Sprout className="h-3.5 w-3.5" /> Planting</Button>
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

      {selectedProjectId && hasEnvironment && (
        <Button type="button" variant="outline" size="icon" className="h-7 w-7" aria-label="Open Project Environment Details" title="Open Project Environment Details" onClick={onOpenEnvironment}>
          <ScanSearch className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}

      {selectedProjectId && (
        <Button type="button" variant={savingProject ? 'secondary' : 'outline'} size="icon" className="h-7 w-7" disabled={savingProject} aria-label="Save ThreeD Project" title="Save ThreeD Project markers and current view" onClick={onSaveProject}>
          {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-muted-foreground" />}
        </Button>
      )}

      <Button variant={filterPanelOpen ? 'secondary' : 'outline'} size="icon" className="relative h-7 w-7" onClick={onToggleFilterPanel} title="Toggle filter panel">
        <Filter className={`h-3.5 w-3.5 ${filterPanelOpen ? '' : 'text-muted-foreground'}`} />
        {hasAssetTypeFilter && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" />}
      </Button>

      <Button variant={refreshing ? 'secondary' : 'outline'} size="icon" className="h-7 w-7" onClick={onRefresh} disabled={refreshing} title="Refresh data">
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : 'text-muted-foreground'}`} />
      </Button>
    </div>
  );
}
