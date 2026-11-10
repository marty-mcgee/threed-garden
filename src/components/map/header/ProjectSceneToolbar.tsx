'use client';

import type { Ref, RefObject } from 'react';
import { useToolbarMenuBounds } from './useToolbarMenuBounds';
import {
  Box,
  Boxes,
  BookOpen,
  CloudSun,
  PencilRuler,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Layers,
  ListTree,
  Loader2,
  Plus,
  Save,
  Settings,
  Sparkles,
  Sprout,
  Touchpad,
  User,
  Wrench,
} from 'lucide-react';

import { SceneOperationStatus, type SceneOperationStatusValue } from '@/components/map/panels/SceneOperationStatus';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MapViewMode } from '@/libraries/types/map';
import { ProjectMultimediaToolbarButton } from '@/components/map/panels/ProjectMultimediaOverlay';

interface ProjectSceneToolbarProps {
  canEditProject: boolean;
  multimediaOpen?: boolean;
  onToggleMultimedia?: () => void;
  multimediaTriggerRef?: RefObject<HTMLButtonElement | null>;
  weatherOpen?: boolean;
  onToggleWeather?: () => void;
  weatherTriggerRef?: RefObject<HTMLButtonElement | null>;
  measurementUnits?: 'imperial' | 'metric';
  onMeasurementUnitsChange?: (units: 'imperial' | 'metric') => void;
  designHistoryHostRef?: Ref<HTMLDivElement>;
  saveDisabled?: boolean;
  workspaceSaveMessage?: string;
  workspaceDirty?: boolean;
  selectedProjectId: string | null;
  viewMode: MapViewMode;
  onViewModeChange: (mode: MapViewMode) => void;
  presentationComplete: boolean;
  sceneAddMenuOpen: boolean;
  hasThreeDModule: boolean;
  onToggleSceneAddMenu: () => void;
  onOpenModelLibrary: () => void;
  onOpenAddShape: () => void;
  onOpenAssemblyPlacement: () => void;
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
  canEditProject,
  multimediaOpen = false,
  onToggleMultimedia,
  multimediaTriggerRef,
  weatherOpen = false,
  onToggleWeather,
  weatherTriggerRef,
  designHistoryHostRef,
  saveDisabled = false,
  workspaceSaveMessage = 'Save ThreeD Project',
  workspaceDirty = false,
  selectedProjectId,
  viewMode,
  onViewModeChange,
  presentationComplete,
  sceneAddMenuOpen,
  hasThreeDModule,
  onToggleSceneAddMenu,
  onOpenModelLibrary,
  onOpenAddShape,
  onOpenAssemblyPlacement,
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
  const addMenuBounds = useToolbarMenuBounds(sceneAddMenuOpen);
  const editHelp = 'Only the Project owner can use this action. Guests can explore this Project.';
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1">
      <div role="group" aria-label="Scene view mode" className="threed-view-modes flex items-center gap-0 rounded-lg border p-0">
        <Button variant={viewMode === 'design' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" aria-pressed={viewMode === 'design'} onClick={() => onViewModeChange('design')} title="ThreeD Design View" aria-label="ThreeD Design View">
          <PencilRuler className="h-3.5 w-3.5 text-cyan-400" />
        </Button>
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
        <Button ref={projectAssetsTriggerRef} type="button" variant={projectAssetsOpen ? 'secondary' : 'outline'} size="sm" className="h-7 gap-1 px-2 text-xs" aria-expanded={projectAssetsOpen} aria-controls="project-assets-panel" aria-label="Project Assets" title="Browse and focus Project ThreeD Assets" onClick={onToggleProjectAssets}>
          <ListTree className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Assets</span>
          <span className="text-[10px] text-muted-foreground">{projectAssetCount}</span>
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
            Add
            {sceneAddMenuOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>

          {sceneAddMenuOpen && (
            <div ref={addMenuBounds.ref} style={addMenuBounds.style} className="threed-workspace-panel threed-toolbar-dropdown-surface absolute right-0 top-full z-[2000] mt-1 max-h-[min(24rem,70dvh)] w-56 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border p-1.5 shadow-xl backdrop-blur-sm">
              <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">ThreeD Marker Type</div>
              {!canEditProject && <p className="px-2 py-1 text-xs text-muted-foreground">{editHelp}</p>}
              <div className="grid grid-cols-1 gap-0.5">
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} onClick={canEditProject ? onOpenAddShape : undefined}><Plus className="h-3.5 w-3.5" /> Shapes</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} onClick={canEditProject ? onOpenModelLibrary : undefined}><Box className="h-3.5 w-3.5" /> Models</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} onClick={canEditProject ? onOpenAssemblyPlacement : undefined}><Boxes className="h-3.5 w-3.5" /> Assembly Group</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} onClick={canEditProject ? onOpenCharacterLibrary : undefined}><User className="h-3.5 w-3.5" /> Characters</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} onClick={canEditProject ? onOpenFarmBotLibrary : undefined}><Settings className="h-3.5 w-3.5" /> FarmBots</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} onClick={canEditProject ? onOpenBedPlacement : undefined}><Plus className="h-3.5 w-3.5" /> Beds</Button>
                <Button type="button" variant="ghost" size="sm" className="threed-toolbar-menu-item" disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} onClick={canEditProject ? onOpenPlantingPlacement : undefined}><Sprout className="h-3.5 w-3.5" /> Plantings</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedProjectId && viewMode === '2d' && (
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={!canEditProject || !hasThreeDModule} title={canEditProject ? "Add a Model through the supporting 2D Map" : editHelp} onClick={canEditProject ? onOpenModelLibrary : undefined}>
          <Plus className="h-3.5 w-3.5" /> Add Model
        </Button>
      )}

      {selectedProjectId && (
        <DropdownMenu open={setupMenuOpen} onOpenChange={onSetupMenuOpenChange} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant={setupMenuOpen ? 'secondary' : 'outline'} size="sm"
              className="h-7 gap-1 px-2 text-xs" disabled={!presentationComplete || !hasThreeDModule}>
              <Wrench className="h-3.5 w-3.5" /> Tools
              {setupMenuOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="threed-workspace-panel threed-toolbar-dropdown-surface z-[2000] w-56 space-y-0.5 rounded-lg border-foreground/10 p-1.5 text-foreground shadow-xl backdrop-blur-sm">
            {!canEditProject && <p className="px-2 py-1 text-xs text-muted-foreground">{editHelp}</p>}
            <DropdownMenuItem disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} className="threed-toolbar-menu-item" onSelect={canEditProject ? onOpenProjectTour : undefined}><Sparkles className="h-3.5 w-3.5" /> Project Tour</DropdownMenuItem>
            <DropdownMenuItem disabled={!canEditProject} title={!canEditProject ? editHelp : undefined} className="threed-toolbar-menu-item" onSelect={canEditProject ? onOpenScenarios : undefined}><BookOpen className="h-3.5 w-3.5" /> Scenarios</DropdownMenuItem>
            <DropdownMenuItem className="threed-toolbar-menu-item" onSelect={() => window.dispatchEvent(new CustomEvent('threed:simulation-panel', { detail: { projectId: Number(selectedProjectId) } }))}><FlaskConical className="h-3.5 w-3.5" /> Simulations</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {selectedProjectId && (
        <div id="project-environment-controls-host" className="relative" hidden={viewMode === '2d'} />
      )}

      {selectedProjectId && onToggleWeather && <Button ref={weatherTriggerRef} type="button" variant={weatherOpen ? 'secondary' : 'outline'} size="sm" className="h-7 gap-1 px-2 text-xs" aria-expanded={weatherOpen} aria-controls="project-weather-overlay" onClick={onToggleWeather} aria-label="Project Weather" title="Project Weather"><CloudSun className="h-3.5 w-3.5" /><span className="hidden sm:inline">Weather</span></Button>}
      {selectedProjectId && onToggleMultimedia && <ProjectMultimediaToolbarButton open={multimediaOpen} onClick={onToggleMultimedia} triggerRef={multimediaTriggerRef} />}

      <SceneOperationStatus operation={activeOperation} viewMode={viewMode} onCancel={onCancelOperation} />




      {canEditProject && selectedProjectId && <span role="status" className="sr-only">{savingProject ? 'Saving Project' : workspaceSaveMessage}</span>}
      <div ref={designHistoryHostRef} data-testid="project-design-history" hidden={!canEditProject || viewMode !== 'design' || !selectedProjectId} className="min-w-0 max-w-full" />
      {selectedProjectId && (
        <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><span className="inline-flex" tabIndex={!canEditProject || savingProject || saveDisabled ? 0 : undefined} aria-disabled={!canEditProject || savingProject || saveDisabled || undefined}>
        <Button type="button" variant={savingProject ? 'secondary' : 'outline'} size="icon" className={`relative h-7 w-7 ${workspaceDirty ? 'ring-1 ring-green-400' : ''}`} disabled={!canEditProject || savingProject || saveDisabled} aria-label="Save ThreeD Project" title={canEditProject ? workspaceSaveMessage : editHelp} onClick={canEditProject ? onSaveProject : undefined}>
          {savingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-foreground dark:text-white" />}
          {workspaceDirty && <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />}
        </Button>
        </span></TooltipTrigger><TooltipContent>{!canEditProject ? editHelp : savingProject ? 'Saving Project. Later edits still need Save.' : workspaceSaveMessage}</TooltipContent></Tooltip></TooltipProvider>
      )}
    </div>
  );
}
