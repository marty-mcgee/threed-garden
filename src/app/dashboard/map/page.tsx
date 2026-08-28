// app/dashboard/map/page-v0130b.tsx - v0.13.0-beta "Smart Dashboard"
// Features: Rich Popups + Admin Links, Advanced Filtering, Interactive Stats, Live Data Indicator
'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Layers, 
  RefreshCw, 
  MapPin, 
  Box, 
  Car, 
  FolderOpen,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Search,
  Loader2,
  Plus,
  Filter,
  Clock,
  Save,
  Trash2,
  X,
  User,
  Sprout,
  ExternalLink,
  Crosshair,
  Gamepad2,
  Pause,
  ScanSearch,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDefaultMapData, getDefaultLayers } from '@/lib/services/map/DefaultMapData';
import {
  UnifiedMapView,
  type ProjectThreeDMarkerSnapshotProvider,
  type ThreeDRuntimeMarkerPositionResolver,
} from '@/components/map/UnifiedMapView';
import {
  MapLayerConfig,
  MapViewMode,
  ProjectThreeDMarkerRecord,
  ThreeDActionTarget,
  ThreeDCharacterOrchestrationRequest,
  UnifiedMapData,
} from '@/lib/types/map';
import type {
  ThreeDCharacterLibraryItem,
  ThreeDModelLibraryItem,
} from '@/lib/types/threed';
import {
  createThreeDOrchestrationLifecycleState,
  createThreeDCharacterOrchestrationRequest,
  planThreeDInteractionApproach,
  THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
  transitionThreeDOrchestrationLifecycleState,
  type ThreeDOrchestrationLifecycleState,
} from '@/lib/services/threed/orchestration/interaction-core';
import {
  THREED_GENERIC_TARGET_ACTIONS,
  createThreeDActionTarget,
  getThreeDActionTargetCapabilities,
  isMatchingThreeDActionTarget,
} from '@/lib/services/threed/orchestration/action-target-core';
import {
  getTrafficIcon,
  getTrafficLabel,
  getThreeDIcon,
  getThreeDLabel,
} from '@/lib/utils/map-helpers';
import { applyThreeDProjectClientTransaction } from '@/lib/services/threed/markers/project-marker-client-state-core';

// ✅ Project Selector Dialog Component
function ProjectSelectorDialog({ 
  open, 
  onOpenChange, 
  onSelect 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSelect: (projectId: string) => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
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
      loadProjects();
    }
  }, [open]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (projectId: string) => {
    onSelect(projectId);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Project</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex-1 overflow-y-auto mt-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">
                {searchQuery ? 'No matching projects' : 'No projects found'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Button
                key={project.id}
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-3"
                onClick={() => handleSelect(String(project.id))}
              >
                <div className="flex items-center gap-3 w-full">
                  <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-muted-foreground truncate">
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
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.location.href = '/admin/projects'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ✅ v0.16.0-centaur: Polished Details Card — key-value grid, position coords, clear controls
function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[10px] text-white/40 shrink-0 w-[52px] text-right">{label}</span>
      <span className="text-[11px] text-white/80">{value}</span>
    </div>
  );
}

interface FarmBotProjectMqttRuntime {
  connectionState: string;
  stateChangedAt: string;
  lastMessageAt: string | null;
  lastStatusAt: string | null;
  positionX: string | null;
  positionY: string | null;
  positionZ: string | null;
  tokenExpiresAt: string;
  isStale: boolean;
}

function formatMqttDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Never';
}

function FarmBotMqttStatusSummary({
  farmbotId,
  projectId,
}: {
  farmbotId: number;
  projectId: string | null;
}) {
  const [runtime, setRuntime] = useState<FarmBotProjectMqttRuntime | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !Number.isSafeInteger(farmbotId) || farmbotId < 1) {
      setRuntime(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    void fetch(
      `/api/threed/farmbots/${farmbotId}/mqtt-runtime?projectId=${encodeURIComponent(projectId)}`,
      { cache: 'no-store', signal: controller.signal }
    )
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error);
        setRuntime(result.data as FarmBotProjectMqttRuntime | null);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setRuntime(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [farmbotId, projectId]);

  const hasPosition = runtime
    && runtime.positionX !== null
    && runtime.positionY !== null
    && runtime.positionZ !== null;

  return (
    <div className="mt-2 rounded bg-white/[0.035] p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-white/60">MQTT Status</span>
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-white/40" />
        ) : runtime ? (
          <div className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${runtime.connectionState === 'connected' && !runtime.isStale ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[10px] capitalize text-white/70">{runtime.connectionState}</span>
            {runtime.isStale && <span className="text-[10px] text-amber-300">· Stale</span>}
          </div>
        ) : (
          <span className="text-[10px] text-white/35">No recorded status</span>
        )}
      </div>
      {runtime && (
        <div className="space-y-0.5">
          <KvRow label="Changed" value={formatMqttDate(runtime.stateChangedAt)} />
          <KvRow label="Message" value={formatMqttDate(runtime.lastMessageAt)} />
          <KvRow label="Status" value={formatMqttDate(runtime.lastStatusAt)} />
          <KvRow
            label="Device"
            value={hasPosition
              ? `X:${Number(runtime.positionX).toFixed(1)} Y:${Number(runtime.positionY).toFixed(1)} Z:${Number(runtime.positionZ).toFixed(1)}`
              : 'Position not recorded'}
          />
          <KvRow label="Token" value={`Expires ${formatMqttDate(runtime.tokenExpiresAt)}`} />
        </div>
      )}
    </div>
  );
}

function ModelInstancePlacementEditor({
  instanceId,
  initialName,
  initialScaleMultiplier,
  initialRotationY,
  initialPosition,
  baseModelScale,
  updating,
  deleting,
  moveActive,
  onSave,
  onDelete,
  onMoveToggle,
}: {
  instanceId: number;
  initialName: string;
  initialScaleMultiplier: number;
  initialRotationY: number;
  initialPosition: { x: number; y: number; z: number };
  baseModelScale: number;
  updating: boolean;
  deleting: boolean;
  moveActive: boolean;
  onSave: (input: {
    instanceName: string;
    scaleMultiplier: number;
    rotationY: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  onDelete: (instanceId: number, name: string) => void;
  onMoveToggle: (instanceId: number, name: string) => void;
}) {
  const [instanceName, setInstanceName] = useState(initialName);
  const [scaleMultiplier, setScaleMultiplier] = useState(String(initialScaleMultiplier));
  const [rotationYDegrees, setRotationYDegrees] = useState(String(
    Number((initialRotationY * 180 / Math.PI).toFixed(2)),
  ));
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));
  const parsedScale = Number(scaleMultiplier);
  const parsedRotationDegrees = Number(rotationYDegrees);
  const parsedPosition = [Number(positionX), Number(positionY), Number(positionZ)];
  const valid = instanceName.trim().length <= 120
    && Number.isFinite(parsedScale)
    && parsedScale >= 0.0001
    && parsedScale <= 10_000
    && Number.isFinite(parsedRotationDegrees)
    && parsedPosition.every((value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000);
  const busy = updating || deleting;

  return (
    <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100/75">
        <Box className="h-3.5 w-3.5" />
        Project Model Instance
      </div>
      <label className="block space-y-1">
        <span className="text-[10px] text-white/50">Instance name</span>
        <input
          value={instanceName}
          maxLength={120}
          disabled={busy}
          onChange={(event) => setInstanceName(event.target.value)}
          className="h-7 w-full rounded border border-white/10 bg-white/5 px-2 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <span className="text-[10px] text-white/50">Instance scale</span>
          <input
            type="number"
            min="0.0001"
            max="10000"
            step="any"
            value={scaleMultiplier}
            disabled={busy}
            onChange={(event) => setScaleMultiplier(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-2 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] text-white/50">Y rotation (°)</span>
          <input
            type="number"
            step="1"
            value={rotationYDegrees}
            disabled={busy}
            onChange={(event) => setRotationYDegrees(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-2 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['Position X', positionX, setPositionX],
          ['Position Y', positionY, setPositionY],
          ['Position Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">{label as string}</span>
            <input
              type="number"
              step="0.1"
              value={value as string}
              disabled={busy}
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <div className="text-[9px] text-white/35">
        Effective scale: {(baseModelScale * (Number.isFinite(parsedScale) ? parsedScale : 0)).toLocaleString()}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={!valid || busy}
          onClick={(event) => {
            event.stopPropagation();
            onSave({
              instanceName: instanceName.trim(),
              scaleMultiplier: parsedScale,
              rotationY: parsedRotationDegrees * Math.PI / 180,
              positionX: parsedPosition[0],
              positionY: parsedPosition[1],
              positionZ: parsedPosition[2],
            });
          }}
          className="flex items-center justify-center gap-1.5 rounded bg-cyan-600/35 px-2 py-1.5 text-[11px] font-medium text-cyan-100 transition-colors hover:bg-cyan-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Placement
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            onMoveToggle(instanceId, instanceName.trim() || `Model instance #${instanceId}`);
          }}
          className="flex items-center justify-center gap-1 rounded bg-amber-600/30 px-1.5 py-1.5 text-[10px] font-medium text-amber-100 transition-colors hover:bg-amber-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          <Crosshair className="h-3.5 w-3.5" />
          {moveActive ? 'Cancel Move' : 'Move Model'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            const name = instanceName.trim() || `Model instance #${instanceId}`;
            if (!window.confirm(`Delete "${name}" from this ThreeD Project?`)) return;
            onDelete(instanceId, name);
          }}
          className="flex items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {deleting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />}
          Delete Model
        </button>
      </div>
    </div>
  );
}

function BedInstanceEditor({
  markerId,
  initialWidthFeet,
  initialLengthFeet,
  initialHeightFeet,
  initialScale,
  initialColor,
  initialPosition,
  initialRotation,
  updating,
  deleting,
  onSave,
  onDelete,
  entityLabel = 'Bed',
}: {
  markerId: number;
  initialWidthFeet: number;
  initialLengthFeet: number;
  initialHeightFeet: number;
  initialScale: number;
  initialColor: string;
  initialPosition: { x: number; y: number; z: number };
  initialRotation: number;
  updating: boolean;
  deleting: boolean;
  onSave: (markerId: number, input: {
    widthFeet: number;
    lengthFeet: number;
    heightFeet: number;
    scale: number;
    color: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotation: number;
  }) => void;
  onDelete: (markerId: number, name: string) => void;
  entityLabel?: 'Bed' | 'FarmBot';
}) {
  const [widthFeet, setWidthFeet] = useState(String(initialWidthFeet));
  const [lengthFeet, setLengthFeet] = useState(String(initialLengthFeet));
  const [heightFeet, setHeightFeet] = useState(String(initialHeightFeet));
  const [scale, setScale] = useState(String(initialScale));
  const [color, setColor] = useState(initialColor);
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));
  const [rotationDegrees, setRotationDegrees] = useState(String(initialRotation));
  const dimensions = [Number(widthFeet), Number(lengthFeet), Number(heightFeet)];
  const positions = [Number(positionX), Number(positionY), Number(positionZ)];
  const parsedRotationDegrees = Number(rotationDegrees);
  const parsedScale = Number(scale);
  const valid = dimensions.every((value) => (
    Number.isFinite(value) && value >= 0.1 && value <= 1_000
  ))
    && positions.every((value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000)
    && Number.isFinite(parsedRotationDegrees)
    && Number.isFinite(parsedScale) && parsedScale >= 0.01 && parsedScale <= 1_000
    && /^#[0-9a-f]{6}$/i.test(color);
  const busy = updating || deleting;

  return (
    <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100/75">
        {entityLabel === 'FarmBot'
          ? <Settings className="h-3.5 w-3.5" />
          : <Layers className="h-3.5 w-3.5" />}
        Project {entityLabel} Instance
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['Width (ft)', widthFeet, setWidthFeet],
          ['Length (ft)', lengthFeet, setLengthFeet],
          ['Height (ft)', heightFeet, setHeightFeet],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">{label as string}</span>
            <input
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
              value={value as string}
              disabled={busy}
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['Position X', positionX, setPositionX],
          ['Position Y', positionY, setPositionY],
          ['Position Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">{label as string}</span>
            <input
              type="number"
              step="0.1"
              value={value as string}
              disabled={busy}
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <label className="block space-y-1">
          <span className="text-[9px] text-white/50">Y rotation (°)</span>
          <input type="number" step="1" value={rotationDegrees} disabled={busy}
            onChange={(event) => setRotationDegrees(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50" />
        </label>
        <label className="block space-y-1">
          <span className="text-[9px] text-white/50">Scale</span>
          <input type="number" min="0.01" max="1000" step="0.01" value={scale} disabled={busy}
            onChange={(event) => setScale(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50" />
        </label>
        <label className="block space-y-1">
          <span className="text-[9px] text-white/50">Color</span>
          <input type="color" value={color} disabled={busy}
            onChange={(event) => setColor(event.target.value)}
            className="h-7 w-full cursor-pointer rounded border border-white/10 bg-white/5 p-0.5 disabled:opacity-50" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
      <button
        type="button"
        disabled={!valid || busy}
        onClick={(event) => {
          event.stopPropagation();
          onSave(markerId, {
            widthFeet: dimensions[0],
            lengthFeet: dimensions[1],
            heightFeet: dimensions[2],
            scale: parsedScale,
            color,
            positionX: positions[0],
            positionY: positions[1],
            positionZ: positions[2],
            rotation: parsedRotationDegrees,
          });
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-amber-600/35 px-2 py-1.5 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
      >
        {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save {entityLabel} Instance
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          if (!window.confirm(`Remove this ${entityLabel} from this ThreeD Project?`)) return;
          onDelete(markerId, entityLabel);
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Remove {entityLabel}
      </button>
      </div>
    </div>
  );
}

function PlantingInstanceEditor({
  markerId,
  initialModelScale,
  initialPosition,
  updating,
  deleting,
  onSave,
  onDelete,
}: {
  markerId: number;
  initialModelScale: number;
  initialPosition: { x: number; y: number; z: number };
  updating: boolean;
  deleting: boolean;
  onSave: (markerId: number, input: {
    modelScale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  onDelete: (markerId: number, name: string) => void;
}) {
  const [modelScale, setModelScale] = useState(String(initialModelScale));
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));
  const parsed = {
    modelScale: Number(modelScale),
    positionX: Number(positionX),
    positionY: Number(positionY),
    positionZ: Number(positionZ),
  };
  const valid = Number.isFinite(parsed.modelScale)
    && parsed.modelScale >= 0.01
    && parsed.modelScale <= 1_000
    && [parsed.positionX, parsed.positionY, parsed.positionZ].every(
      (value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000,
    );

  return (
    <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100/75">
        <Sprout className="h-3.5 w-3.5" />
        Project Planting Instance
      </div>
      <label className="block space-y-1">
        <span className="text-[9px] text-white/50">Model scale</span>
        <input
          type="number"
          min="0.01"
          max="1000"
          step="0.01"
          value={modelScale}
          disabled={updating || deleting}
          onChange={(event) => setModelScale(event.target.value)}
          className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
        />
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['Position X', positionX, setPositionX],
          ['Position Y', positionY, setPositionY],
          ['Position Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">{label as string}</span>
            <input
              type="number"
              step="0.1"
              value={value as string}
              disabled={updating || deleting}
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={!valid || updating || deleting}
          onClick={(event) => {
            event.stopPropagation();
            onSave(markerId, parsed);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-emerald-600/35 px-2 py-1.5 text-[11px] font-medium text-emerald-100 transition-colors hover:bg-emerald-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Planting
        </button>
        <button
          type="button"
          disabled={updating || deleting}
          onClick={(event) => {
            event.stopPropagation();
            const name = 'this Planting';
            if (!window.confirm(`Delete ${name} from this ThreeD Project?`)) return;
            onDelete(markerId, name);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete Planting
        </button>
      </div>
    </div>
  );
}

function CharacterInstancePositionEditor({
  markerId,
  initialPosition,
  disabled,
  updating,
  deleting,
  onSave,
  onDelete,
}: {
  markerId: number;
  initialPosition: { x: number; y: number; z: number };
  disabled: boolean;
  updating: boolean;
  deleting: boolean;
  onSave: (markerId: number, position: { positionX: number; positionY: number; positionZ: number }) => void;
  onDelete: (markerId: number) => void;
}) {
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));
  const position = {
    positionX: Number(positionX),
    positionY: Number(positionY),
    positionZ: Number(positionZ),
  };
  const valid = Object.values(position).every(
    (value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000,
  );
  return (
    <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-100/75">
        <User className="h-3.5 w-3.5" />
        Project Character Instance
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['X', positionX, setPositionX],
          ['Y', positionY, setPositionY],
          ['Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">Position {label as string}</span>
            <input
              type="number"
              step="0.1"
              value={value as string}
              disabled={disabled || updating || deleting}
              onChange={(event) => (setter as (next: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
      <button
        type="button"
        disabled={!valid || disabled || updating || deleting}
        onClick={(event) => {
          event.stopPropagation();
          onSave(markerId, position);
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-violet-600/35 px-2 py-1.5 text-[11px] font-medium text-violet-100 transition-colors hover:bg-violet-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
      >
        {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save Position
      </button>
      <button
        type="button"
        disabled={disabled || updating || deleting}
        onClick={(event) => {
          event.stopPropagation();
          if (!window.confirm('Remove this Character from the ThreeD Project? The reusable Character will remain available in the Library.')) return;
          onDelete(markerId);
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Delete Character
      </button>
      </div>
      {disabled && (
        <p className="text-[9px] text-amber-200/75">Release Control before changing the Character position.</p>
      )}
    </div>
  );
}

function DetailsCard({ selected, projectId, onClose, controlledCharacterId, liveControlledCharacterPosition, onTakeControl, onReleaseControl, cameraMode, onCameraModeChange, onZoomCenter, actionTarget, orchestrationStatus, onSetActionTarget, onClearActionTarget, onFocusActionTarget, resolveRuntimeMarkerPosition, onUpdateModelInstance, updatingModelInstanceId, onDeleteModelInstance, deletingModelInstanceId, movingModelInstanceId, onMoveModelToggle, onUpdateBedInstance, updatingBedMarkerId, onDeleteBedInstance, deletingBedMarkerId, onUpdateFarmBotInstance, updatingFarmBotMarkerId, onDeleteFarmBotInstance, deletingFarmBotMarkerId, onUpdatePlantingInstance, updatingPlantingMarkerId, onDeletePlantingInstance, deletingPlantingMarkerId, onUpdateCharacterPosition, updatingCharacterMarkerId, onDeleteCharacterInstance, deletingCharacterMarkerId }: {
  selected: any;
  projectId: string | null;
  onClose: () => void;
  controlledCharacterId: number | null;
  liveControlledCharacterPosition: {
    characterId: number;
    position: { x: number; y: number; z: number };
  } | null;
  onTakeControl: (id: number) => void;
  onReleaseControl: () => void;
  cameraMode?: string;
  onCameraModeChange?: (mode: string) => void;
  onZoomCenter?: () => void;
  actionTarget?: ThreeDActionTarget | null;
  orchestrationStatus?: ThreeDOrchestrationLifecycleState | null;
  onSetActionTarget?: (target: ThreeDActionTarget) => void;
  onClearActionTarget?: () => void;
  onFocusActionTarget?: () => void;
  resolveRuntimeMarkerPosition?: ThreeDRuntimeMarkerPositionResolver;
  onUpdateModelInstance?: (instanceId: number, input: {
    instanceName: string;
    scaleMultiplier: number;
    rotationY: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  updatingModelInstanceId?: number | null;
  onDeleteModelInstance?: (instanceId: number, name: string) => void;
  deletingModelInstanceId?: number | null;
  movingModelInstanceId?: number | null;
  onMoveModelToggle?: (instanceId: number, name: string) => void;
  onUpdateBedInstance?: (markerId: number, input: {
    widthFeet: number;
    lengthFeet: number;
    heightFeet: number;
    scale: number;
    color: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotation: number;
  }) => void;
  updatingBedMarkerId?: number | null;
  onDeleteBedInstance?: (markerId: number, name: string) => void;
  deletingBedMarkerId?: number | null;
  onUpdateFarmBotInstance?: (markerId: number, input: {
    widthFeet: number;
    lengthFeet: number;
    heightFeet: number;
    scale: number;
    color: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotation: number;
  }) => void;
  updatingFarmBotMarkerId?: number | null;
  onDeleteFarmBotInstance?: (markerId: number, name: string) => void;
  deletingFarmBotMarkerId?: number | null;
  onUpdatePlantingInstance?: (markerId: number, input: {
    modelScale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  updatingPlantingMarkerId?: number | null;
  onDeletePlantingInstance?: (markerId: number, name: string) => void;
  deletingPlantingMarkerId?: number | null;
  onUpdateCharacterPosition?: (markerId: number, position: {
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  updatingCharacterMarkerId?: number | null;
  onDeleteCharacterInstance?: (markerId: number, name: string) => void;
  deletingCharacterMarkerId?: number | null;
}) {
  if (!selected) return null;
  const d = selected.data || selected.metadata?.data || selected.metadata || {};
  const isIncident = selected.latitude != null || selected.severity || (selected.title && selected.location);
  const typeLabel = selected.type || (isIncident ? 'Traffic Incident' : 'Marker');
  // Build key-value metadata rows from the data record
  const metaRows: { label: string; value: string }[] = [];

  // 3D position — prefer live RuntimeMarker position (updated by ecctrl), fallback to DB columns
  if (!isIncident) {
    const live = selected.position; // RuntimeMarker live position
    const dbX = d.positionX ?? d.position?.x;
    const dbY = d.positionY ?? d.position?.y;
    const dbZ = d.positionZ ?? d.position?.z;
    const px = live?.x != null ? live.x : dbX;
    const py = live?.y != null ? live.y : (dbY ?? 0);
    const pz = live?.z != null ? live.z : dbZ;
    if (px != null && pz != null) {
      metaRows.push({ label: 'Position', value: `X:${Number(px).toFixed(1)} Y:${Number(py).toFixed(1)} Z:${Number(pz).toFixed(1)}` });
    }
  }

  // Incident fields
  if (isIncident) {
    if (selected.location) metaRows.push({ label: 'Location', value: selected.location });
    if (selected.status) metaRows.push({ label: 'Status', value: selected.status });
  }

  // Marker type-specific
  const type = selected.type || '';
  const normalizedType = String(type).trim().toLowerCase();
  metaRows.unshift({ label: 'Module', value: typeLabel });
  if (selected.severity) {
    metaRows.push({ label: 'Severity', value: String(selected.severity) });
  }
  const isPlantingMarker = normalizedType === 'planting'
    || normalizedType === 'plantings'
    || normalizedType === 'threed_plantings';
  const isFarmBotMarker = normalizedType === 'farmbot'
    || normalizedType === 'farmbots'
    || normalizedType === 'threed_farmbots';
  const isCharacterMarker = type === 'characters' || type === 'character';
  const characterMarkerId = Number(d.projectMarkerId);
  const isProjectCharacterInstance = isCharacterMarker
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(characterMarkerId)
    && characterMarkerId > 0;
  const modelInstanceId = Number(d.instanceId);
  const isProjectModelInstance = (
    normalizedType === 'model' || normalizedType === 'models'
  ) && selected.metadata?.source === 'project-marker'
    && Number.isSafeInteger(modelInstanceId)
    && modelInstanceId > 0;
  const bedMarkerId = Number(d.projectMarkerId);
  const isProjectBedInstance = (normalizedType === 'bed' || normalizedType === 'beds')
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(bedMarkerId)
    && bedMarkerId > 0;
  const plantingMarkerId = Number(d.projectMarkerId);
  const isProjectPlantingInstance = isPlantingMarker
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(plantingMarkerId)
    && plantingMarkerId > 0;
  const farmBotMarkerId = Number(d.projectMarkerId);
  const isProjectFarmBotInstance = isFarmBotMarker
    && (selected.metadata?.source === 'project-marker' || selected.metadata?.source === 'project-snapshot')
    && Number.isSafeInteger(farmBotMarkerId)
    && farmBotMarkerId > 0;
  const selectedTargetCapabilities = getThreeDActionTargetCapabilities(normalizedType);
  const actionTargetCapabilities = actionTarget
    ? getThreeDActionTargetCapabilities(actionTarget.type)
    : null;
  const currentActionTargetPosition = actionTarget
    ? resolveRuntimeMarkerPosition?.(actionTarget.type, actionTarget.id)
      ?? actionTarget.position
    : null;
  const isEcctrlCharacter = isCharacterMarker && d.isMovable === true;
  const characterId = Number(d.id);
  const isSelectedCharacterControlled = isEcctrlCharacter
    && controlledCharacterId === characterId;
  const hasLiveControlledPosition = isSelectedCharacterControlled
    && liveControlledCharacterPosition?.characterId === characterId;
  let targetApproachPlan: ReturnType<typeof planThreeDInteractionApproach> | null = null;
  if (
    isEcctrlCharacter
    && hasLiveControlledPosition
    && actionTarget != null
    && liveControlledCharacterPosition
  ) {
    try {
      targetApproachPlan = planThreeDInteractionApproach({
        characterPosition: liveControlledCharacterPosition.position,
        targetPosition: currentActionTargetPosition ?? actionTarget.position,
      });
    } catch {
      targetApproachPlan = null;
    }
  }
  const targetInteractionReady = !isEcctrlCharacter
    || actionTarget == null
    || (
      hasLiveControlledPosition
      && targetApproachPlan?.arrived === true
    );
  const isCurrentOrchestration = orchestrationStatus
    && orchestrationStatus.characterId === characterId
    && orchestrationStatus.targetId === actionTarget?.id;
  const isOrchestrationRunning = isCurrentOrchestration
    && orchestrationStatus.phase === 'interacting';
  if (isPlantingMarker) {
    if (d.plantName || d.commonName) metaRows.push({ label: 'Plant', value: d.plantName || d.commonName });
    if (d.growthStage) metaRows.push({ label: 'Stage', value: d.growthStage });
    if (d.health != null) metaRows.push({ label: 'Health', value: `${d.health}` });
    if (d.plantedDate) metaRows.push({ label: 'Planted', value: new Date(d.plantedDate).toLocaleDateString() });
  }
  if (type === 'beds' || type === 'bed') {
    const w = d.widthFeet || d.width, l = d.lengthFeet || d.length || d.depth;
    if (w && l) metaRows.push({ label: 'Size', value: `${w}ft × ${l}ft` });
    if (d.soilType) metaRows.push({ label: 'Soil', value: d.soilType });
    if (d.sunExposure) metaRows.push({ label: 'Sun', value: d.sunExposure });
  }
  if (isFarmBotMarker) {
    if (d.status) metaRows.push({ label: 'Status', value: d.status });
    if (d.batteryLevel != null) metaRows.push({ label: 'Battery', value: `${d.batteryLevel}%` });
    if (d.assetCode) metaRows.push({ label: 'Asset code', value: d.assetCode });
    if (d.farmbotDeviceId) {
      metaRows.push({ label: 'FarmBot device', value: String(d.farmbotDeviceId) });
    }
    if (d.brokerDeviceId) metaRows.push({ label: 'Broker identity', value: d.brokerDeviceId });
    if (d.lastSeen) metaRows.push({ label: 'Last Seen', value: new Date(d.lastSeen).toLocaleString() });
  }
  if (type === 'characters' || type === 'character') {
    if (d.type || d.characterType) metaRows.push({ label: 'Type', value: d.type || d.characterType });
    if (d.movementType) metaRows.push({ label: 'Movement', value: d.movementType });
    if (d.movementSpeed != null) metaRows.push({ label: 'Speed', value: `${d.movementSpeed}` });
    if (d.defaultEmote && d.defaultEmote !== 'none') metaRows.push({ label: 'Emote', value: d.defaultEmote });
  }
  if (d.notes || d.description) metaRows.push({ label: 'Notes', value: (d.notes || d.description).slice(0, 80) });

  const selectedMarkerId = String(selected.id || '');
  const selectedMarkerIdSuffix = selectedMarkerId.match(/(\d+)$/)?.[1];
  const quickTargetId = Number(d.id ?? selectedMarkerIdSuffix);
  const quickTargetType = selectedTargetCapabilities?.markerType;
  const quickTargetName = selected.name || selected.label || d.plantName || d.commonName
    || (quickTargetType ? `${quickTargetType.replace(/s$/, '')} #${quickTargetId}` : 'Marker');
  const isQuickActionTarget = actionTarget != null
    && quickTargetType != null
    && isMatchingThreeDActionTarget(actionTarget, {
      markerType: quickTargetType,
      assetId: quickTargetId,
    });
  const adminType = selected.type || (isIncident ? (selected._collection || 'chpCad') : 'plantings');
  const adminId = isProjectModelInstance ? d.modelId : selected.metadata?.data?.id || selected.id;
  const adminRouteMap: Record<string, string> = {
    plantings: '/admin/threed/plantings', planting: '/admin/threed/plantings',
    beds: '/admin/threed/beds', bed: '/admin/threed/beds',
    characters: '/admin/threed/characters', character: '/admin/threed/characters',
    farmbots: '/admin/threed/farmbots', farmbot: '/admin/threed/farmbots',
    models: '/admin/threed/models', model: '/admin/threed/models',
    chpCad: '/admin/traffic/chp-cad', chpCadIncidents: '/admin/traffic/chp-cad',
    chpCases: '/admin/traffic/chp-cases', chpCenters: '/admin/traffic/chp-centers',
    caltransLaneClosures: '/admin/traffic/caltrans', caltransClosures: '/admin/traffic/caltrans',
    caltransCctv: '/admin/traffic/caltrans-cctv', caltransDistricts: '/admin/traffic/caltrans-districts',
    bayArea511: '/admin/traffic/bay-area-511', bayArea511Events: '/admin/traffic/bay-area-511',
    calfireIncidents: '/admin/traffic/calfire', calfire: '/admin/traffic/calfire',
  };
  const adminRoute = adminRouteMap[adminType] || (isIncident ? '/admin/traffic' : '/admin/threed/plantings');

  return (
    <div className="fixed left-3 top-12 z-[1000] max-h-[calc(100vh-4rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border border-white/10 bg-black/85 p-2 text-white shadow-xl backdrop-blur-sm pointer-events-auto [scrollbar-width:thin]">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-2 -mt-2 flex items-start justify-between gap-2 rounded-t-lg bg-black/95 px-2 pb-2 pt-0.5 backdrop-blur-sm">
        <div className="min-w-0 pb-1 pt-0.5">
          <div className="truncate text-sm font-semibold text-white">
            {selected.name || selected.title || selected.label || 'Unknown'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close marker details"
          title="Close marker details"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-1">
        {!isIncident && selectedTargetCapabilities && onSetActionTarget && (
          <button
            type="button"
            aria-label={isQuickActionTarget ? 'Clear Action Target' : 'Use as Action Target'}
            title={isQuickActionTarget ? 'Clear Action Target' : 'Use as Action Target'}
            aria-pressed={isQuickActionTarget}
            onClick={(event) => {
              event.stopPropagation();
              if (isQuickActionTarget && onClearActionTarget) {
                onClearActionTarget();
                return;
              }
              if (!quickTargetType || !Number.isFinite(quickTargetId)) return;
              const targetPosition = resolveRuntimeMarkerPosition?.(quickTargetType, quickTargetId)
                ?? (selected.position ? {
                  x: Number(selected.position.x),
                  y: Number(selected.position.y),
                  z: Number(selected.position.z),
                } : null);
              if (!targetPosition || !Object.values(targetPosition).every(Number.isFinite)) return;
              onSetActionTarget(createThreeDActionTarget({
                markerId: selectedMarkerId || `${quickTargetType}-${quickTargetId}`,
                markerType: quickTargetType,
                assetId: quickTargetId,
                name: String(quickTargetName),
                position: targetPosition,
              }));
            }}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isQuickActionTarget
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
        )}
        {!isIncident && onZoomCenter && (
          <button
            type="button"
            aria-label="Zoom and center marker"
            title="Zoom + Center"
            onClick={(event) => { event.stopPropagation(); onZoomCenter(); }}
            className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ScanSearch className="h-3.5 w-3.5" />
          </button>
        )}
        <a
          href={`${adminRoute}?id=${adminId}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Edit marker in Admin"
          title="Edit in Admin"
          className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-white/60 no-underline transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* GPS coordinates (incidents) */}
      {selected.lat != null && selected.lng != null && (
        <div className="text-[10px] text-white/40 mt-1.5 font-mono">
          📍 {Number(selected.lat).toFixed(4)}, {Number(selected.lng).toFixed(4)}
        </div>
      )}

      {/* Metadata grid */}
      {metaRows.length > 0 && (
        <div className="mt-2 space-y-0.5 rounded bg-white/[0.035] p-2">
          {metaRows.map((r, i) => <KvRow key={i} label={r.label} value={r.value} />)}
        </div>
      )}

      {isFarmBotMarker && (
        <FarmBotMqttStatusSummary
          farmbotId={Number(d.id)}
          projectId={projectId}
        />
      )}

      {/* Description (incidents) — only if no metaRows covered it */}
      {isIncident && selected.description && !metaRows.length && (
        <div className="mt-2 text-[11px] text-white/50">
          {selected.description.slice(0, 100)}{selected.description.length > 100 ? '...' : ''}
        </div>
      )}

      {/* Character Controls — ecctrl runtime take-over (movable characters only) */}
      {!isIncident && (type === 'characters' || type === 'character') && (() => {
        if (d.isMovable !== true) return null;
        const charId = d.id;
        const isControlling = controlledCharacterId === charId;
        return (
          <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
            {isControlling ? (
              <>
                {/* <div className="text-[10px] text-blue-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                  <span>WASD / Space / Shift active</span>
                </div> */}
                <button
                  onClick={(e) => { e.stopPropagation(); onReleaseControl(); }}
                  className="block w-full text-center text-[11px] font-medium bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-2 rounded transition-colors"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Pause className="h-3.5 w-3.5" />
                    Release Control
                  </span>
                </button>
                {onCameraModeChange && (
                  <div className="space-y-1">
                    {/* <div className="text-[10px] text-white/50">Camera:</div> */}
                    <select
                      value={cameraMode || 'stationary'}
                      onChange={(e) => { e.stopPropagation(); onCameraModeChange(e.target.value); }}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/80 focus:outline-none focus:border-white/30 appearance-none"
                    >
                      <option value="follow" className="bg-gray-800 text-white">🎥 Follow</option>
                      <option value="topdown" className="bg-gray-800 text-white">🔽 Top-Down</option>
                      <option value="firstperson" className="bg-gray-800 text-white">👁️ First-Person</option>
                      <option value="orbit" className="bg-gray-800 text-white">🛰️ Orbit</option>
                      <option value="stationary" className="bg-gray-800 text-white">📷 Stationary</option>
                    </select>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onTakeControl(charId); }}
                className="block w-full text-center text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-2 rounded transition-colors"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Take Control
                </span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Character Actions — shared semantic animation controls */}
      {!isIncident && (type === 'characters' || type === 'character') && (
        <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-1.5">
          {/* <div className="text-[10px] font-medium text-white/60">Character Actions</div> */}

          <div className="rounded bg-white/5 px-2 py-1.5 text-[10px] text-white/55">
            {actionTarget ? (
              <>
                <div>🎯 Target: <span className="text-emerald-300">{actionTarget.name}</span> <span className="text-white/30">({actionTarget.type} #{actionTarget.id})</span></div>
                {actionTarget.type === 'farmbots' && (
                  <div className="mt-1 text-amber-200/70">
                    FarmBot interactions are animation-only. Physical commands remain disabled.
                  </div>
                )}
                {isEcctrlCharacter && (
                  <div className={`mt-1 ${targetInteractionReady ? 'text-emerald-300/80' : 'text-amber-200/80'}`}>
                    {!isSelectedCharacterControlled
                      ? 'Take Control to calculate interaction range'
                      : !hasLiveControlledPosition
                        ? 'Waiting for live character position'
                        : targetApproachPlan
                      ? targetInteractionReady
                        ? `In interaction range (${targetApproachPlan.distanceToTarget.toFixed(1)} units)`
                        : `Move closer with WASD (${targetApproachPlan.distanceToTarget.toFixed(1)} units away)`
                      : 'Unable to calculate interaction range'}
                  </div>
                )}
                {isCurrentOrchestration && (
                  <div className={`mt-1 ${
                    orchestrationStatus.phase === 'completed'
                      ? 'text-emerald-300/80'
                      : orchestrationStatus.phase === 'cancelled'
                        ? 'text-amber-200/80'
                        : 'text-sky-200/80'
                  }`}>
                    Simulation: {orchestrationStatus.phase}
                  </div>
                )}
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {onFocusActionTarget && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onFocusActionTarget(); }}
                      className="rounded bg-emerald-600/25 px-2 py-1 text-emerald-100 transition-colors hover:bg-emerald-600/45 hover:text-white"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <ScanSearch className="h-3.5 w-3.5" />
                        Focus Target
                      </span>
                    </button>
                  )}
                  {onClearActionTarget && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClearActionTarget(); }}
                      className="rounded bg-white/5 px-2 py-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white/80"
                    >
                      Clear Target
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>🎯 Target: <span className="text-white/35">None — actions remain animation-only</span></>
            )}
          </div>

          {(actionTarget && actionTarget.type !== 'plantings' ? [
            {
              title: 'Interaction',
              actions: [
                { action: 'point', label: '👉 Point' },
                { action: 'pointGesture', label: '🫵 Point Gesture' },
                { action: 'talk', label: '💬 Talk' },
              ],
            },
          ] : [
            {
              title: 'Planting',
              actions: [
                { action: 'watering', label: '💧 Water' },
                { action: 'digAndPlantSeeds', label: '🪏 Dig + Seeds' },
                { action: 'plantAPlant', label: '🌱 Plant' },
                { action: 'plantTree', label: '🌳 Plant Tree' },
              ],
            },
            {
              title: 'Harvesting',
              actions: [
                { action: 'pullPlant', label: '🌿 Pull Plant' },
                { action: 'pullPlant2', label: '🌿 Pull Plant 2' },
                { action: 'pickFruit', label: '🍎 Pick Fruit' },
                { action: 'pickFruit2', label: '🍐 Pick Fruit 2' },
                { action: 'pickFruit3', label: '🍊 Pick Fruit 3' },
              ],
            },
            {
              title: 'Animal Care',
              actions: [
                { action: 'cowMilking', label: '🥛 Milk Cow' },
              ],
            },
            {
              title: 'Interaction',
              actions: [
                { action: 'point', label: '👉 Point' },
                { action: 'pointGesture', label: '🫵 Point Gesture' },
                { action: 'talk', label: '💬 Talk' },
              ],
            },
          ])
            .map((group) => ({
              ...group,
              actions: actionTargetCapabilities
                ? group.actions.filter(({ action }) => (
                  actionTargetCapabilities.genericActions.includes(action as any)
                  || actionTargetCapabilities.moduleActions.includes(action as any)
                ))
                : group.actions,
            }))
            .filter((group) => group.actions.length > 0)
            .map((group) => (
            <div key={group.title} className="space-y-0.5">
              <div className="text-[9px] uppercase tracking-wide text-white/35">
                {group.title}
              </div>

              <div className="grid grid-cols-3 gap-1">
                {group.actions.map(({ action, label }) => (
                  <button
                    key={action}
                    disabled={
                      Boolean(isOrchestrationRunning)
                      || (
                        actionTarget != null
                        && THREED_GENERIC_TARGET_ACTIONS.includes(action as any)
                        && !targetInteractionReady
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();

                      const charId = Number(d.id);
                      if (!Number.isFinite(charId)) return;

                      if (
                        actionTarget
                        && actionTargetCapabilities
                        && THREED_GENERIC_TARGET_ACTIONS.includes(action as any)
                      ) {
                        const request = createThreeDCharacterOrchestrationRequest({
                          requestId: crypto.randomUUID(),
                          characterId: charId,
                          action,
                          target: currentActionTargetPosition
                            ? { ...actionTarget, position: currentActionTargetPosition }
                            : actionTarget,
                        });
                        window.dispatchEvent(new CustomEvent(
                          THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
                          { detail: request },
                        ));
                        return;
                      }

                      window.dispatchEvent(new CustomEvent('garden-character-action', {
                        detail: {
                          characterId: charId,
                          action,
                          target: actionTarget
                            ? { ...actionTarget, actionRequestId: crypto.randomUUID() }
                            : null,
                        },
                      }));
                    }}
                    className="min-h-6 w-full rounded bg-emerald-600/25 px-1 py-1 text-center text-[9px] font-medium leading-tight text-emerald-100 transition-colors hover:bg-emerald-600/45 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isProjectModelInstance && onUpdateModelInstance && onDeleteModelInstance && onMoveModelToggle && (
        <ModelInstancePlacementEditor
          key={modelInstanceId}
          instanceId={modelInstanceId}
          initialName={String(d.instanceName || selected.name || '')}
          initialScaleMultiplier={Number(d.scaleMultiplier ?? 1)}
          initialRotationY={Number(d.rotationYInstance ?? 0)}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          baseModelScale={Number(d.scale ?? 1)}
          updating={updatingModelInstanceId === modelInstanceId}
          deleting={deletingModelInstanceId === modelInstanceId}
          moveActive={movingModelInstanceId === modelInstanceId}
          onSave={(input) => onUpdateModelInstance(modelInstanceId, input)}
          onDelete={onDeleteModelInstance}
          onMoveToggle={onMoveModelToggle}
        />
      )}

      {isProjectBedInstance && onUpdateBedInstance && onDeleteBedInstance && (
        <BedInstanceEditor
          key={bedMarkerId}
          markerId={bedMarkerId}
          initialWidthFeet={Number(d.widthFeet ?? d.width ?? 4)}
          initialLengthFeet={Number(d.lengthFeet ?? d.length ?? d.depth ?? 8)}
          initialHeightFeet={Number(d.heightFeet ?? 1)}
          initialScale={Number(d.scale ?? 1)}
          initialColor={String(d.color ?? selected.color ?? '#8B5E3C')}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          initialRotation={Number(d.rotation ?? 0)}
          updating={updatingBedMarkerId === bedMarkerId}
          deleting={deletingBedMarkerId === bedMarkerId}
          onSave={onUpdateBedInstance}
          onDelete={(markerId, name) => onDeleteBedInstance(
            markerId,
            String(selected.name || name),
          )}
        />
      )}

      {isProjectFarmBotInstance && onUpdateFarmBotInstance && onDeleteFarmBotInstance && (
        <BedInstanceEditor
          key={farmBotMarkerId}
          markerId={farmBotMarkerId}
          entityLabel="FarmBot"
          initialWidthFeet={Number(d.widthFeet ?? 3)}
          initialLengthFeet={Number(d.lengthFeet ?? 6)}
          initialHeightFeet={Number(d.heightFeet ?? 3)}
          initialScale={Number(d.scale ?? 1)}
          initialColor={String(d.color ?? selected.color ?? '#4B5563')}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          initialRotation={Number(d.rotation ?? 0)}
          updating={updatingFarmBotMarkerId === farmBotMarkerId}
          deleting={deletingFarmBotMarkerId === farmBotMarkerId}
          onSave={onUpdateFarmBotInstance}
          onDelete={(markerId, name) => onDeleteFarmBotInstance(
            markerId,
            String(selected.name || name),
          )}
        />
      )}

      {isProjectPlantingInstance && onUpdatePlantingInstance && onDeletePlantingInstance && (
        <PlantingInstanceEditor
          key={plantingMarkerId}
          markerId={plantingMarkerId}
          initialModelScale={Number(d.modelScale ?? 1)}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          updating={updatingPlantingMarkerId === plantingMarkerId}
          deleting={deletingPlantingMarkerId === plantingMarkerId}
          onSave={onUpdatePlantingInstance}
          onDelete={(markerId, name) => onDeletePlantingInstance(
            markerId,
            String(selected.name || d.plantName || d.commonName || name),
          )}
        />
      )}

      {isProjectCharacterInstance && onUpdateCharacterPosition && onDeleteCharacterInstance && (
        <CharacterInstancePositionEditor
          key={characterMarkerId}
          markerId={characterMarkerId}
          initialPosition={{
            x: Number(selected.position?.x ?? d.positionX ?? 0),
            y: Number(selected.position?.y ?? d.positionY ?? 0),
            z: Number(selected.position?.z ?? d.positionZ ?? 0),
          }}
          disabled={controlledCharacterId != null}
          updating={updatingCharacterMarkerId === characterMarkerId}
          deleting={deletingCharacterMarkerId === characterMarkerId}
          onSave={onUpdateCharacterPosition}
          onDelete={(markerId) => onDeleteCharacterInstance(
            markerId,
            String(selected.name || d.name || 'Character'),
          )}
        />
      )}

    </div>
  );
}

// ✅ Interactive Stats Card (clickable to filter)
function StatCard({
  label, 
  count, 
  color, 
  icon, 
  isActive, 
  onClick 
}: { 
  label: string; 
  count: number; 
  color: string; 
  icon: string; 
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-all select-none
        ${isActive ? 'ring-2 ring-primary bg-primary/5 scale-[1.02]' : 'hover:bg-muted/50'}`}
      onClick={onClick}
      title={`Click to ${isActive ? 'clear' : 'filter by'} ${label}`}
    >
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px] h-4 px-1 ml-auto">
        {count}
      </Badge>
    </div>
  );
}

export default function UnifiedMapPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <UnifiedMapPageInner />
    </Suspense>
  );
}

function UnifiedMapPageInner() {
  const { showToast, ToastComponent } = useToast();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  
  // ✅ State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdParam);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(!projectIdParam);
  const [isProjectSummaryOpen, setIsProjectSummaryOpen] = useState(false);
  const [data, setData] = useState<UnifiedMapData>(getDefaultMapData());
  const [isDefaultView, setIsDefaultView] = useState(!projectIdParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProjectMarkers, setSavingProjectMarkers] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{ name: string; hasData: boolean } | null>(null);
  const [projectThreeDModules, setProjectThreeDModules] = useState<Array<{
    id: number;
    name: string;
  }>>([]);
  const [isModelLibraryOpen, setIsModelLibraryOpen] = useState(false);
  const [isCharacterLibraryOpen, setIsCharacterLibraryOpen] = useState(false);
  const [isFarmBotLibraryOpen, setIsFarmBotLibraryOpen] = useState(false);
  const [isBedPlacementOpen, setIsBedPlacementOpen] = useState(false);
  const [isPlantingPlacementOpen, setIsPlantingPlacementOpen] = useState(false);
  const [libraryModels, setLibraryModels] = useState<ThreeDModelLibraryItem[]>([]);
  const [libraryCharacters, setLibraryCharacters] = useState<ThreeDCharacterLibraryItem[]>([]);
  const [libraryFarmBots, setLibraryFarmBots] = useState<any[]>([]);
  const [loadingLibraryModels, setLoadingLibraryModels] = useState(false);
  const [loadingLibraryCharacters, setLoadingLibraryCharacters] = useState(false);
  const [loadingLibraryFarmBots, setLoadingLibraryFarmBots] = useState(false);
  const [placementModel, setPlacementModel] = useState<ThreeDModelLibraryItem | null>(null);
  const [placementCharacter, setPlacementCharacter] = useState<ThreeDCharacterLibraryItem | null>(null);
  const [placementFarmBot, setPlacementFarmBot] = useState<any | null>(null);
  const [placementThreedId, setPlacementThreedId] = useState<number | null>(null);
  const [placementScaleMultiplier, setPlacementScaleMultiplier] = useState('1');
  const [placingModel, setPlacingModel] = useState(false);
  const [placingCharacter, setPlacingCharacter] = useState(false);
  const [placingFarmBot, setPlacingFarmBot] = useState(false);
  const [placingBed, setPlacingBed] = useState(false);
  const [placingPlanting, setPlacingPlanting] = useState(false);
  const [bedPlacementActive, setBedPlacementActive] = useState(false);
  const [bedPlacementDraft, setBedPlacementDraft] = useState({
    name: 'New Garden Bed',
    shape: 'rectangle',
    widthFeet: '4',
    lengthFeet: '8',
    heightFeet: '1',
    color: '#8B5E3C',
    rotation: '0',
    scale: '1',
  });
  const [plantingOptions, setPlantingOptions] = useState<any[]>([]);
  const [loadingPlantingOptions, setLoadingPlantingOptions] = useState(false);
  const [plantingPlacementActive, setPlantingPlacementActive] = useState(false);
  const [plantingPlacementDraft, setPlantingPlacementDraft] = useState({
    plantId: '',
    bedId: '',
    quantity: '1',
    spacingInches: '',
    modelScale: '1',
  });
  const [farmBotPlacementDraft, setFarmBotPlacementDraft] = useState({
    widthFeet: '3',
    lengthFeet: '6',
    heightFeet: '3',
    color: '#4B5563',
    rotation: '0',
    scale: '1',
  });
  const [updatingModelInstanceId, setUpdatingModelInstanceId] = useState<number | null>(null);
  const [deletingModelInstanceId, setDeletingModelInstanceId] = useState<number | null>(null);
  const [movingModelInstance, setMovingModelInstance] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [updatingBedMarkerId, setUpdatingBedMarkerId] = useState<number | null>(null);
  const [deletingBedMarkerId, setDeletingBedMarkerId] = useState<number | null>(null);
  const [updatingFarmBotMarkerId, setUpdatingFarmBotMarkerId] = useState<number | null>(null);
  const [deletingFarmBotMarkerId, setDeletingFarmBotMarkerId] = useState<number | null>(null);
  const [updatingPlantingMarkerId, setUpdatingPlantingMarkerId] = useState<number | null>(null);
  const [deletingPlantingMarkerId, setDeletingPlantingMarkerId] = useState<number | null>(null);
  const [updatingCharacterMarkerId, setUpdatingCharacterMarkerId] = useState<number | null>(null);
  const [deletingCharacterMarkerId, setDeletingCharacterMarkerId] = useState<number | null>(null);
  const placingModelRef = useRef(false);
  const placingCharacterRef = useRef(false);
  const placingFarmBotRef = useRef(false);
  const placingBedRef = useRef(false);
  const placingPlantingRef = useRef(false);
  
  // ✅ Live Data Status Indicator
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataAge, setDataAge] = useState<string>('--');
  const [isStale, setIsStale] = useState(false);
  
  // ✅ Default view ['3d','2d','combined']
  const [viewMode, setViewMode] = useState<MapViewMode>('3d');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [controlledCharacterId, setControlledCharacterId] = useState<number | null>(null);
  const [liveControlledCharacterPosition, setLiveControlledCharacterPosition] =
    useState<{
      characterId: number;
      position: { x: number; y: number; z: number };
    } | null>(null);
  const [cameraMode, setCameraMode] = useState<string>('stationary');
  const [focusRequest, setFocusRequest] = useState(0);
  const [actionTarget, setActionTarget] = useState<ThreeDActionTarget | null>(null);
  const [actionTargetFocusRequest, setActionTargetFocusRequest] = useState(0);
  const [orchestrationStatus, setOrchestrationStatus] =
    useState<ThreeDOrchestrationLifecycleState | null>(null);
  const [layers, setLayers] = useState<MapLayerConfig>(getDefaultLayers());
  const projectMarkerSnapshotProviderRef =
    useRef<ProjectThreeDMarkerSnapshotProvider | null>(null);
  const runtimeMarkerPositionResolverRef =
    useRef<ThreeDRuntimeMarkerPositionResolver | null>(null);

  const updateProjectThreeDMarkers = useCallback((
    update: (markers: ProjectThreeDMarkerRecord[]) => ProjectThreeDMarkerRecord[],
  ) => {
    setData((current) => {
      const raw = current.threed.raw;
      if (!raw) return current;
      const markers = raw.projectThreedMarkers ?? [];
      const nextMarkers = update(markers);
      if (nextMarkers === markers) return current;
      return {
        ...current,
        threed: {
          ...current.threed,
          raw: {
            ...raw,
            projectThreedMarkers: nextMarkers,
          },
          markersCount: nextMarkers.length,
        },
      };
    });
  }, []);

  const handleRejectedProjectMarkerDelete = useCallback(async (recordId: number) => {
    try {
      const response = await fetch(
        `/api/project/threed-markers?id=${recordId}&snapshotOnly=1`,
        { method: 'DELETE' },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Saved marker removal failed (${response.status})`);
      }
      updateProjectThreeDMarkers((markers) => markers.filter(
        (marker) => Number(marker.id) !== recordId,
      ));
      showToastRef.current('Invalid saved ThreeD marker removed; source asset preserved', 'success');
    } catch (error) {
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to remove saved ThreeD marker',
        'error',
      );
    }
  }, [updateProjectThreeDMarkers]);

  const handleRejectedCharacterMarkerRepair = useCallback(async (recordId: number) => {
    const raw = data.threed.raw;
    const marker = raw?.projectThreedMarkers?.find(
      (candidate) => Number(candidate.id) === recordId && candidate.markerType === 'characters',
    );
    const character = raw?.characters?.find(
      (candidate: Record<string, unknown>) => Number(candidate.id) === Number(marker?.sourceAssetId),
    ) as Record<string, unknown> | undefined;
    if (!marker || !character) {
      showToastRef.current('Character source position is unavailable', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/project/threed-markers?id=${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'characters',
          positionX: Number(character.positionX ?? 0),
          positionY: Number(character.positionY ?? 0),
          positionZ: Number(character.positionZ ?? 0),
          rotation: Number(marker.data?.rotation ?? character.rotation ?? 0),
          scaleMultiplier: Number(marker.data?.scaleMultiplier ?? 1),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character position repair failed (${response.status})`);
      }
      updateProjectThreeDMarkers((markers) => markers.map(
        (candidate) => Number(candidate.id) === recordId ? result.data : candidate,
      ));
      showToastRef.current('Character restored to its source position', 'success');
    } catch (error) {
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to restore Character position',
        'error',
      );
    }
  }, [data.threed.raw, updateProjectThreeDMarkers]);

  const handleProjectMarkerSnapshotProviderChange = useCallback((
    provider: ProjectThreeDMarkerSnapshotProvider | null,
  ) => {
    projectMarkerSnapshotProviderRef.current = provider;
  }, []);

  const handleRuntimeMarkerPositionResolverChange = useCallback((
    resolver: ThreeDRuntimeMarkerPositionResolver | null,
  ) => {
    runtimeMarkerPositionResolverRef.current = resolver;
  }, []);

  const resolveRuntimeMarkerPosition = useCallback<ThreeDRuntimeMarkerPositionResolver>((
    moduleType,
    assetId,
  ) => runtimeMarkerPositionResolverRef.current?.(moduleType, assetId) ?? null, []);

  const openModelLibrary = useCallback(async () => {
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsModelLibraryOpen(true);
    setIsProjectSummaryOpen(false);
    setSelectedMarker(null);
    if (libraryModels.length > 0 || loadingLibraryModels) return;

    setLoadingLibraryModels(true);
    try {
      const response = await fetch('/api/threed/models?scope=library&limit=100');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model Library failed (${response.status})`);
      }
      setLibraryModels(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Failed to load ThreeD Model Library', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD Model Library',
        'error',
      );
    } finally {
      setLoadingLibraryModels(false);
    }
  }, [libraryModels.length, loadingLibraryModels]);

  const openCharacterLibrary = useCallback(async () => {
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setPlacementCharacter(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsCharacterLibraryOpen(true);
    setIsProjectSummaryOpen(false);
    setSelectedMarker(null);
    if (libraryCharacters.length > 0 || loadingLibraryCharacters) return;

    setLoadingLibraryCharacters(true);
    try {
      const response = await fetch('/api/threed/characters?scope=library&limit=100');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character Library failed (${response.status})`);
      }
      setLibraryCharacters(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Failed to load ThreeD Character Library', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD Character Library',
        'error',
      );
    } finally {
      setLoadingLibraryCharacters(false);
    }
  }, [libraryCharacters.length, loadingLibraryCharacters]);

  const openFarmBotLibrary = useCallback(async () => {
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsFarmBotLibraryOpen(true);
    setIsProjectSummaryOpen(false);
    setSelectedMarker(null);
    if (libraryFarmBots.length > 0 || loadingLibraryFarmBots) return;

    setLoadingLibraryFarmBots(true);
    try {
      const response = await fetch('/api/threed/farmbots?isActive=true&limit=100');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `FarmBot Library failed (${response.status})`);
      }
      setLibraryFarmBots(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Failed to load ThreeD FarmBot Library', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD FarmBot Library',
        'error',
      );
    } finally {
      setLoadingLibraryFarmBots(false);
    }
  }, [libraryFarmBots.length, loadingLibraryFarmBots]);

  const openPlantingPlacement = useCallback(async () => {
    setIsFarmBotLibraryOpen(false);
    setPlacementFarmBot(null);
    setIsCharacterLibraryOpen(false);
    setPlacementCharacter(null);
    setIsModelLibraryOpen(false);
    setPlacementModel(null);
    setIsBedPlacementOpen(false);
    setBedPlacementActive(false);
    setIsPlantingPlacementOpen(true);
    setIsProjectSummaryOpen(false);
    setSelectedMarker(null);
    if (plantingOptions.length > 0 || loadingPlantingOptions) return;

    setLoadingPlantingOptions(true);
    try {
      const response = await fetch('/api/threed/plants?isActive=true&status=active&limit=100');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Plant list failed (${response.status})`);
      }
      const plants = Array.isArray(result.data) ? result.data : [];
      setPlantingOptions(plants);
      setPlantingPlacementDraft((current) => ({
        ...current,
        plantId: current.plantId || String(plants[0]?.id ?? ''),
      }));
    } catch (error) {
      console.error('Failed to load ThreeD Plants for placement', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to load ThreeD Plants',
        'error',
      );
    } finally {
      setLoadingPlantingOptions(false);
    }
  }, [loadingPlantingOptions, plantingOptions.length]);

  const handleSaveThreeDProject = useCallback(async () => {
    if (!selectedProjectId || savingProjectMarkers) return;
    const provider = projectMarkerSnapshotProviderRef.current;
    if (!provider) {
      showToastRef.current('ThreeD Project marker data is not ready to save', 'error');
      return;
    }

    setSavingProjectMarkers(true);
    try {
      const markers = provider();
      const response = await fetch('/api/project/threed-markers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(selectedProjectId),
          markers,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Project save failed (${response.status})`);
      }

      setLastUpdated(new Date());
      showToastRef.current(
        `ThreeD Project saved (${result.data.markerCount} markers)`,
        'success',
      );
    } catch (error) {
      console.error('Failed to save ThreeD Project marker snapshot', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to save ThreeD Project',
        'error',
      );
    } finally {
      setSavingProjectMarkers(false);
    }
  }, [savingProjectMarkers, selectedProjectId]);

  // Phase 5A compatibility bridge: establish the orchestration request
  // lifecycle while preserving immediate animation until proximity is gated.
  useEffect(() => {
    const handleOrchestrationRequest = (event: Event) => {
      const request = (event as CustomEvent<ThreeDCharacterOrchestrationRequest>).detail;
      if (!request || request.version !== 1) return;
      setOrchestrationStatus(createThreeDOrchestrationLifecycleState(request, Date.now()));
      window.dispatchEvent(new CustomEvent('garden-character-action', {
        detail: {
          characterId: request.characterId,
          action: request.action,
          target: request.target,
        },
      }));
    };

    window.addEventListener(
      THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
      handleOrchestrationRequest,
    );
    return () => window.removeEventListener(
      THREED_CHARACTER_ORCHESTRATION_REQUEST_EVENT,
      handleOrchestrationRequest,
    );
  }, []);

  useEffect(() => {
    if (!orchestrationStatus || orchestrationStatus.phase !== 'interacting') return;
    const timeout = window.setTimeout(() => {
      setOrchestrationStatus((current) => {
        if (
          !current
          || current.requestId !== orchestrationStatus.requestId
          || current.phase !== 'interacting'
        ) return current;
        return transitionThreeDOrchestrationLifecycleState(current, {
          requestId: orchestrationStatus.requestId,
          phase: 'cancelled',
          changedAt: Date.now(),
        });
      });
    }, 30000);
    return () => window.clearTimeout(timeout);
  }, [orchestrationStatus]);

  // v0.16.2-beta: Manual "zoom + center" request (button in DetailsCard).
  // Set the camera to stationary so any active character camera-follow stops
  // interfering with the requested focus of the newly selected marker.
  const handleZoomCenter = useCallback(() => {
    setCameraMode('stationary');
    setFocusRequest((n) => n + 1);
  }, []);

  const handleFocusActionTarget = useCallback(() => {
    if (!actionTarget) return;
    setCameraMode('stationary');
    setActionTargetFocusRequest((n) => n + 1);
  }, [actionTarget]);

  // v0.16.0-delta: Sync RuntimeMarker position when ecctrl character moves
  const handleControlChange = useCallback((_markerId: string, pos: { x: number; y: number; z: number }) => {
    setSelectedMarker((prev: any) => {
      if (!prev) return prev;
      const previousCharacterId = Number(prev.data?.id ?? prev.metadata?.data?.id);
      const isControlledCharacterSelection = (
        prev.type === 'characters' || prev.type === 'character'
      ) && controlledCharacterId != null
        && previousCharacterId === controlledCharacterId
        && prev.id === _markerId;
      if (!isControlledCharacterSelection) return prev;
      return { ...prev, position: { ...prev.position, x: pos.x, y: pos.y, z: pos.z } };
    });
    const markerCharacterId = Number(_markerId.match(/(\d+)$/)?.[1]);
    if (
      controlledCharacterId != null
      && markerCharacterId === controlledCharacterId
    ) {
      setLiveControlledCharacterPosition({
        characterId: controlledCharacterId,
        position: { x: pos.x, y: pos.y, z: pos.z },
      });
    }
  }, [controlledCharacterId]);

  // ✅ Advanced Filtering Panel State
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterAssetType, setFilterAssetType] = useState<string | null>(null); // Single type filter from stat card clicks

  // ✅ Panel resize state
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Asset type visibility state
  const [visibleAssetTypes] = useState<Set<string>>(
    new Set(['plantings', 'beds', 'characters', 'farmbots', 'models'])
  );

  // ✅ Live data age updater
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated) {
        const diffMs = Date.now() - lastUpdated.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) {
          setDataAge(`${diffSec}s ago`);
          setIsStale(false);
        } else if (diffSec < 3600) {
          setDataAge(`${Math.floor(diffSec / 60)}m ago`);
          setIsStale(diffSec > 300); // Stale after 5 minutes
        } else {
          setDataAge(`${Math.floor(diffSec / 3600)}h ago`);
          setIsStale(true);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // ✅ Handle project selection
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsProjectSummaryOpen(false);
    setIsDefaultView(false);
    setFilterAssetType(null); // Reset filter on project change
    setActionTarget(null); // Action targets are scoped to the current project.
    setOrchestrationStatus(null);
    setLiveControlledCharacterPosition(null);
    setProjectThreeDModules([]);
    setPlacementThreedId(null);
    setPlacementModel(null);
    setPlacementCharacter(null);
    setPlacementScaleMultiplier('1');
    setIsModelLibraryOpen(false);
    setIsCharacterLibraryOpen(false);
    setBedPlacementActive(false);
    setIsBedPlacementOpen(false);
    setPlantingPlacementActive(false);
    setIsPlantingPlacementOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set('projectId', projectId);
    window.history.pushState({}, '', url.toString());
  };

  // ✅ Toggle layer enable/disable
  const toggleLayer = (category: 'traffic' | 'threed', layerId: string) => {
    setLayers(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [layerId]: {
          ...prev[category][layerId as keyof typeof prev.traffic],
          enabled: !prev[category][layerId as keyof typeof prev.traffic]?.enabled
        }
      }
    }));
  };

  // ✅ Toggle layer visibility
  const toggleVisibility = (category: 'traffic' | 'threed', layerId: string) => {
    setLayers(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [layerId]: {
          ...prev[category][layerId as keyof typeof prev.traffic],
          visible: !prev[category][layerId as keyof typeof prev.traffic]?.visible
        }
      }
    }));
  };

  // ✅ Handle focus on marker
  const handleFocusMarker = useCallback((marker: any) => {
    setSelectedMarker(marker);
  }, []);

  // ✅ Interactive stat card click handler
  const handleStatCardClick = (typeLabel: string) => {
    // Toggle: if already active, clear filter; otherwise set it
    if (filterAssetType === typeLabel) {
      setFilterAssetType(null);
      showToast(`Showing all asset types`, 'info');
    } else {
      setFilterAssetType(typeLabel);
      showToast(`Filtered to: ${typeLabel}`, 'info');
    }
  };

  // ✅ Stabilize showToast via ref to prevent re-render loops
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Keep the client-side action target aligned with refreshed project data.
  // Filters do not affect raw project assets, so hiding a target never clears it.
  useEffect(() => {
    if (!actionTarget || loading) return;
    const targetCollection = data.threed.raw?.[actionTarget.type] ?? [];

    const targetStillExists = targetCollection.some((asset: any) =>
      isMatchingThreeDActionTarget(actionTarget, {
        markerType: actionTarget.type,
        assetId: Number(asset.id),
      }));

    if (!targetStillExists) {
      setActionTarget(null);
      setOrchestrationStatus(null);
      showToastRef.current(
        `Action target cleared: ${actionTarget.name} is no longer available`,
        'info',
      );
    }
  }, [
    actionTarget,
    data.threed.raw,
    loading,
  ]);

  // Persist supported targeted world actions only after the one-shot animation
  // reports completion. Animation-only actions still use the fallback below.
  // The write happens only AFTER GardenCharacter/EcctrlCharacter reports that
  // the requested one-shot animation actually finished.
  useEffect(() => {
    const handleActionComplete = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        characterId?: number;
        characterName?: string;
        action?: string;
        target?: ThreeDActionTarget | null;
      }>;

      const detail = customEvent.detail;
      if (!detail?.action) return;

      if (
        detail.target != null &&
        detail.target.actionRequestId
      ) {
        const completionId = detail.target.actionRequestId;
        setOrchestrationStatus((current) => {
          if (
            !current
            || current.requestId !== completionId
            || current.phase !== 'interacting'
          ) return current;
          return transitionThreeDOrchestrationLifecycleState(current, {
            requestId: completionId,
            phase: 'completed',
            changedAt: Date.now(),
          });
        });
      }

      const actor = detail.characterName || `Character #${detail.characterId ?? '?'}`;
      const actionLabel = detail.action.replace(/([a-z])([A-Z])/g, '$1 $2');
      const isHarvestAction = ['pickFruit', 'pickFruit2', 'pickFruit3'].includes(detail.action);

      // ----------------------------------------------------
      // FIRST PERSISTED WORLD ACTION: TARGETED WATERING
      // ----------------------------------------------------
      if (
        detail.action === 'watering' &&
        detail.target?.type === 'plantings' &&
        Number.isFinite(Number(detail.characterId)) &&
        Number.isFinite(Number(detail.target.id))
      ) {
        try {
          const response = await fetch('/api/threed/world-actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: detail.action,
              characterId: Number(detail.characterId),
              target: {
                type: 'planting',
                id: Number(detail.target.id),
              },
            }),
          });

          const result = await response.json().catch(() => null);

          if (!response.ok || !result?.success) {
            throw new Error(
              result?.error || `Watering persistence failed (${response.status})`,
            );
          }

          showToastRef.current(
            `${actor} watered ${detail.target.name} — watering recorded`,
            'success',
          );

          console.info('[WorldAction] Persisted targeted watering', {
            completion: detail,
            persistence: result,
          });
        } catch (error) {
          console.error('[WorldAction] Watering animation completed but persistence failed:', error);

          showToastRef.current(
            `${actor} completed watering, but the watering record could not be saved`,
            'error',
          );
        }

        return;
      }

      // ----------------------------------------------------
      // TARGETED FRUIT PICKING → PROJECT HARVEST RECORD
      // ----------------------------------------------------
      if (
        isHarvestAction &&
        selectedProjectId &&
        detail.target?.type === 'plantings' &&
        Number.isFinite(Number(detail.characterId)) &&
        Number.isFinite(Number(detail.target.id))
      ) {
        try {
          const response = await fetch('/api/threed/world-actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: detail.action,
              characterId: Number(detail.characterId),
              projectId: Number(selectedProjectId),
              completionId: detail.target.actionRequestId,
              target: {
                type: 'planting',
                id: Number(detail.target.id),
              },
            }),
          });

          const result = await response.json().catch(() => null);

          if (!response.ok || !result?.success) {
            throw new Error(
              result?.error || `Harvest persistence failed (${response.status})`,
            );
          }

          showToastRef.current(
            `${actor} picked fruit from ${detail.target.name} — harvest recorded`,
            'success',
          );

          console.info('[WorldAction] Persisted targeted harvest', {
            completion: detail,
            persistence: result,
          });
        } catch (error) {
          console.error('[WorldAction] Pick Fruit animation completed but persistence failed:', error);

          showToastRef.current(
            `${actor} completed ${actionLabel}, but the harvest record could not be saved`,
            'error',
          );
        }

        return;
      }

      // ----------------------------------------------------
      // ALL OTHER ACTIONS REMAIN ANIMATION-ONLY
      // ----------------------------------------------------
      if (detail.target) {
        showToastRef.current(
          `${actor} completed ${actionLabel} on ${detail.target.name} (${detail.target.type} #${detail.target.id})`,
          'success',
        );
        console.info('[WorldAction] Completed targeted animation-only action', detail);
      } else {
        showToastRef.current(`${actor} completed ${actionLabel}`, 'success');
        console.info('[WorldAction] Completed animation-only action', detail);
      }
    };

    window.addEventListener('garden-character-action-complete', handleActionComplete);
    return () => window.removeEventListener('garden-character-action-complete', handleActionComplete);
  }, [selectedProjectId]);

  // ✅ Load data from API route
  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      if (!selectedProjectId) {
        const defaultData = getDefaultMapData();
        setData(defaultData);
        setProjectInfo({ name: 'No Project Selected', hasData: false });
        setIsDefaultView(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/map/threed?projectId=${selectedProjectId}`);
        const result = await response.json();

        if (result.success) {
          // ✅ Split combined API response into separate threed vs traffic data
          const resultData = result.data || {};
          const threedModules = Array.isArray(result.projectContext?.threedModules)
            ? result.projectContext.threedModules.filter((module: any) => (
                Number.isSafeInteger(Number(module?.id))
                && Number(module.id) > 0
                && typeof module?.name === 'string'
              )).map((module: any) => ({
                id: Number(module.id),
                name: module.name,
              }))
            : [];
          setProjectThreeDModules(threedModules);
          setPlacementThreedId((current) => (
            current && threedModules.some((module: { id: number }) => module.id === current)
              ? current
              : threedModules[0]?.id ?? null
          ));
          
          const trafficRaw = {
            chpCadIncidents: (resultData.chpCadIncidents || []) as any[],
            chpCases: (resultData.chpCases || []) as any[],
            chpCenters: (resultData.chpCenters || []) as any[],
            caltransLaneClosures: (resultData.caltransLaneClosures || []) as any[],
            caltransCctvCameras: (resultData.caltransCctvCameras || []) as any[],
            caltransDistricts: (resultData.caltransDistricts || []) as any[],
            bayArea511Events: (resultData.bayArea511Events || []) as any[],
            calfireIncidents: (resultData.calfireIncidents || []) as any[],
          };
          
          const threedRaw = {
            plants: (resultData.plants || []) as any[],
            beds: (resultData.beds || []) as any[],
            characters: (resultData.characters || []) as any[],
            layers: (resultData.layers || []) as any[],
            farmbots: (resultData.farmbots || []) as any[],
            plantings: (resultData.plantings || []) as any[],
            tasks: (resultData.tasks || []) as any[],
            harvests: (resultData.harvests || []) as any[],
            weatherLogs: (resultData.weatherLogs || []) as any[],
            models: (resultData.models || []) as any[],
            projectThreedMarkers: (result.markerSnapshot || []) as any[],
          };
          
          const trafficTotal = Object.values(trafficRaw).reduce((sum, arr) => sum + arr.length, 0);
          const threedTotal = Object.values(threedRaw).reduce((sum, arr) => sum + arr.length, 0);

          // ✅ Pre-process: normalize position values (DB returns decimals as strings)
          const normalizePositions = <T extends Record<string, any[]>>(records: T): T => {
            const normalized: Record<string, any[]> = {};
            for (const [key, items] of Object.entries(records)) {
              normalized[key] = items.map((item: any) => {
                const n = { ...item };
                // Normalize traffic GPS columns
                if ('latitude' in n && n.latitude !== null) n.latitude = Number(n.latitude);
                if ('longitude' in n && n.longitude !== null) n.longitude = Number(n.longitude);
                if ('lat' in n && n.lat !== null) n.lat = Number(n.lat);
                if ('lng' in n && n.lng !== null) n.lng = Number(n.lng);
                // Normalize 3D position columns
                if ('positionX' in n && n.positionX !== null) n.positionX = Number(n.positionX);
                if ('positionY' in n && n.positionY !== null) n.positionY = Number(n.positionY);
                if ('positionZ' in n && n.positionZ !== null) n.positionZ = Number(n.positionZ);
                return n;
              });
            }
            return normalized as T;
          };

          const normalizedTraffic = normalizePositions(trafficRaw);
          const normalizedThreed = normalizePositions(threedRaw);

          const unifiedData: UnifiedMapData = {
            traffic: {
              raw: normalizedTraffic,
              total: trafficTotal,
              chpCadCount: normalizedTraffic.chpCadIncidents.length,
              chpCasesCount: normalizedTraffic.chpCases.length,
              chpCentersCount: normalizedTraffic.chpCenters.length,
              caltransClosuresCount: normalizedTraffic.caltransLaneClosures.length,
              caltransCctvCount: normalizedTraffic.caltransCctvCameras.length,
              caltransDistrictsCount: normalizedTraffic.caltransDistricts.length,
              bayArea511Count: normalizedTraffic.bayArea511Events.length,
              calfireIncidentsCount: normalizedTraffic.calfireIncidents.length,
            },
            threed: {
              raw: normalizedThreed,
              total: threedTotal,
              plantsCount: normalizedThreed.plants.length,
              bedsCount: normalizedThreed.beds.length,
              charactersCount: normalizedThreed.characters.length,
              markersCount: 0,
              layersCount: normalizedThreed.layers.length,
              farmbotsCount: normalizedThreed.farmbots.length,
              plantingsCount: normalizedThreed.plantings.length,
              tasksCount: normalizedThreed.tasks.length,
              harvestsCount: normalizedThreed.harvests.length,
              weatherLogsCount: normalizedThreed.weatherLogs.length,
              layers: [],
            },
          };

          setData(unifiedData);
          setLastUpdated(new Date());
          setProjectInfo({
            name: result.projectContext?.projectName || `Project #${selectedProjectId}`,
            hasData: result.total > 0,
          });
          setIsDefaultView(false);
        } else {
          const emptyData = getDefaultMapData();
          setData(emptyData);
          setProjectInfo({ name: 'Error Loading Data', hasData: false });
          setIsDefaultView(true);
          showToastRef.current(result.error || 'Failed to load data', 'error');
        }
      } catch (fetchError) {
        console.warn('API fetch failed:', fetchError);
        const emptyData = getDefaultMapData();
        setData(emptyData);
        setProjectInfo({ name: 'Error Loading Data', hasData: false });
        setIsDefaultView(true);
        showToastRef.current('Failed to load data', 'error');
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
      const emptyData = getDefaultMapData();
      setData(emptyData);
      showToastRef.current('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProjectId]);

  const handleModelPlacement = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    const scaleMultiplier = Number(placementScaleMultiplier);
    if (
      !selectedProjectId
      || !placementModel
      || !placementThreedId
      || placingModelRef.current
    ) return;
    if (
      !Number.isFinite(scaleMultiplier)
      || scaleMultiplier < 0.0001
      || scaleMultiplier > 10_000
    ) {
      showToastRef.current(
        'Instance scale must be between 0.0001 and 10,000',
        'error',
      );
      return;
    }

    placingModelRef.current = true;
    setPlacingModel(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(selectedProjectId),
          threedId: placementThreedId,
          modelId: placementModel.id,
          instanceName: placementModel.modelName,
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
          scaleMultiplier,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model placement failed (${response.status})`);
      }

      const createdMarker: ProjectThreeDMarkerRecord = {
        ...result.data,
        data: {
          ...placementModel,
          ...(result.data?.data ?? {}),
          modelId: placementModel.id,
        },
      };
      updateProjectThreeDMarkers((markers) => [...markers, createdMarker]);

      setPlacementModel(null);
      setPlacementScaleMultiplier('1');
      showToastRef.current(`${placementModel.modelName} placed in the ThreeD Scene`, 'success');
    } catch (error) {
      console.error('Failed to place ThreeD Model Library item', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD model',
        'error',
      );
    } finally {
      placingModelRef.current = false;
      setPlacingModel(false);
    }
  }, [
    placementModel,
    placementScaleMultiplier,
    placementThreedId,
    selectedProjectId,
    updateProjectThreeDMarkers,
  ]);

  const handleCharacterPlacement = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    if (
      !selectedProjectId
      || !placementCharacter
      || !placementThreedId
      || placingCharacterRef.current
    ) return;

    placingCharacterRef.current = true;
    setPlacingCharacter(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'characters',
          projectId: Number(selectedProjectId),
          threedId: placementThreedId,
          characterId: placementCharacter.id,
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
          rotation: 0,
          scaleMultiplier: Number(placementCharacter.scaleMultiplier ?? 1),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data?.marker) {
        throw new Error(result?.error || `Character placement failed (${response.status})`);
      }

      setData((current) => {
        const raw = current.threed.raw;
        if (!raw) return current;
        const projectThreedMarkers = [
          ...(raw.projectThreedMarkers ?? []),
          result.data.marker as ProjectThreeDMarkerRecord,
        ];
        return {
          ...current,
          threed: {
            ...current.threed,
            raw: {
              ...raw,
              characters: [...(raw.characters ?? []), result.data.character],
              projectThreedMarkers,
            },
            markersCount: projectThreedMarkers.length,
          },
        };
      });
      setPlacementCharacter(null);
      showToastRef.current(
        `${placementCharacter.name} placed with ${placementCharacter.libraryAccess.runtime} runtime`,
        'success',
      );
    } catch (error) {
      console.error('Failed to place ThreeD Character Library item', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD Character',
        'error',
      );
    } finally {
      placingCharacterRef.current = false;
      setPlacingCharacter(false);
    }
  }, [
    placementCharacter,
    placementThreedId,
    selectedProjectId,
  ]);

  const handleFarmBotPlacement = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    if (
      !selectedProjectId
      || !placementFarmBot
      || !placementThreedId
      || placingFarmBotRef.current
    ) return;

    placingFarmBotRef.current = true;
    setPlacingFarmBot(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'farmbots',
          projectId: Number(selectedProjectId),
          threedId: placementThreedId,
          farmbotId: Number(placementFarmBot.id),
          widthFeet: Number(farmBotPlacementDraft.widthFeet),
          lengthFeet: Number(farmBotPlacementDraft.lengthFeet),
          heightFeet: Number(farmBotPlacementDraft.heightFeet),
          color: farmBotPlacementDraft.color,
          rotation: Number(farmBotPlacementDraft.rotation),
          scale: Number(farmBotPlacementDraft.scale),
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data?.farmbot || !result.data?.marker) {
        throw new Error(result?.error || `FarmBot placement failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data.marker as ProjectThreeDMarkerRecord] },
        sources: { farmbots: { upsert: [result.data.farmbot] } },
      }));
      setPlacementFarmBot(null);
      setIsFarmBotLibraryOpen(false);
      showToastRef.current(`${placementFarmBot.name} placed in the ThreeD Scene`, 'success');
    } catch (error) {
      console.error('Failed to place ThreeD FarmBot Library item', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD FarmBot',
        'error',
      );
    } finally {
      placingFarmBotRef.current = false;
      setPlacingFarmBot(false);
    }
  }, [
    farmBotPlacementDraft,
    placementFarmBot,
    placementThreedId,
    selectedProjectId,
  ]);

  const handleBedPlacement = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    if (
      !selectedProjectId
      || !placementThreedId
      || !bedPlacementActive
      || placingBedRef.current
    ) return;

    placingBedRef.current = true;
    setPlacingBed(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'beds',
          projectId: Number(selectedProjectId),
          threedId: placementThreedId,
          ...bedPlacementDraft,
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data?.bed || !result.data?.marker) {
        throw new Error(result?.error || `Bed placement failed (${response.status})`);
      }

      setData((current) => {
        const raw = current.threed.raw;
        if (!raw) return current;
        const projectThreedMarkers = [
          ...(raw.projectThreedMarkers ?? []),
          result.data.marker as ProjectThreeDMarkerRecord,
        ];
        return {
          ...current,
          threed: {
            ...current.threed,
            raw: {
              ...raw,
              beds: [...(raw.beds ?? []), result.data.bed],
              projectThreedMarkers,
            },
            markersCount: projectThreedMarkers.length,
          },
        };
      });

      setBedPlacementActive(false);
      setIsBedPlacementOpen(false);
      showToastRef.current(`${bedPlacementDraft.name.trim()} placed in the ThreeD Scene`, 'success');
    } catch (error) {
      console.error('Failed to place ThreeD Bed', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD Bed',
        'error',
      );
    } finally {
      placingBedRef.current = false;
      setPlacingBed(false);
    }
  }, [
    bedPlacementActive,
    bedPlacementDraft,
    placementThreedId,
    selectedProjectId,
  ]);

  const handlePlantingPlacement = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    if (
      !selectedProjectId
      || !placementThreedId
      || !plantingPlacementActive
      || !plantingPlacementDraft.plantId
      || placingPlantingRef.current
    ) return;

    placingPlantingRef.current = true;
    setPlacingPlanting(true);
    try {
      const response = await fetch('/api/project/threed-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markerType: 'plantings',
          projectId: Number(selectedProjectId),
          threedId: placementThreedId,
          plantId: Number(plantingPlacementDraft.plantId),
          bedId: plantingPlacementDraft.bedId
            ? Number(plantingPlacementDraft.bedId)
            : null,
          quantity: Number(plantingPlacementDraft.quantity),
          spacingInches: plantingPlacementDraft.spacingInches
            ? Number(plantingPlacementDraft.spacingInches)
            : null,
          modelScale: Number(plantingPlacementDraft.modelScale),
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !Array.isArray(result.data?.plantings) || !Array.isArray(result.data?.markers)) {
        throw new Error(result?.error || `Planting placement failed (${response.status})`);
      }

      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: {
          upsert: result.data.markers as ProjectThreeDMarkerRecord[],
        },
        sources: {
          plantings: {
            upsert: result.data.plantings,
          },
        },
      }));

      const plantName = plantingOptions.find(
        (plant) => Number(plant.id) === Number(plantingPlacementDraft.plantId),
      )?.commonName ?? 'Planting';
      setPlantingPlacementActive(false);
      setIsPlantingPlacementOpen(false);
      showToastRef.current(
        `${result.data.plantings.length} ${plantName} Planting${result.data.plantings.length === 1 ? '' : 's'} added to the ThreeD Scene`,
        'success',
      );
    } catch (error) {
      console.error('Failed to place ThreeD Planting', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to place ThreeD Planting',
        'error',
      );
    } finally {
      placingPlantingRef.current = false;
      setPlacingPlanting(false);
    }
  }, [
    placementThreedId,
    plantingOptions,
    plantingPlacementActive,
    plantingPlacementDraft,
    selectedProjectId,
  ]);

  const handleUpdateModelInstance = useCallback(async (
    instanceId: number,
    input: {
      instanceName: string;
      scaleMultiplier: number;
      rotationY: number;
      positionX: number;
      positionY: number;
      positionZ: number;
    },
  ) => {
    if (updatingModelInstanceId != null || deletingModelInstanceId != null) return;
    setUpdatingModelInstanceId(instanceId);
    try {
      const response = await fetch(
        `/api/project/threed-markers?id=${instanceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model placement update failed (${response.status})`);
      }

      updateProjectThreeDMarkers((markers) => markers.map((marker) => (
        Number(marker.id) === instanceId
          ? {
              ...marker,
              ...result.data,
              data: {
                ...marker.data,
                ...(result.data?.data ?? {}),
              },
              metadata: {
                ...marker.metadata,
                ...(result.data?.metadata ?? {}),
              },
            }
          : marker
      )));

      setSelectedMarker(null);
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'models',
          assetId: instanceId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(
        `${input.instanceName || 'Model placement'} updated`,
        'success',
      );
    } catch (error) {
      console.error('Failed to update Project ThreeD Model instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update ThreeD Model placement',
        'error',
      );
    } finally {
      setUpdatingModelInstanceId(null);
    }
  }, [deletingModelInstanceId, updateProjectThreeDMarkers, updatingModelInstanceId]);

  const handleMoveModelInstance = useCallback(async (
    instanceId: number,
    position: { x: number; y: number; z: number },
  ): Promise<boolean> => {
    if (updatingModelInstanceId != null || deletingModelInstanceId != null) return false;
    setUpdatingModelInstanceId(instanceId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model position update failed (${response.status})`);
      }

      updateProjectThreeDMarkers((markers) => markers.map((marker) => (
        Number(marker.id) === instanceId
          ? {
              ...marker,
              ...result.data,
              data: {
                ...marker.data,
                ...(result.data?.data ?? {}),
              },
              metadata: {
                ...marker.metadata,
                ...(result.data?.metadata ?? {}),
              },
            }
          : marker
      )));
      setSelectedMarker((current: any) => (
        Number(current?.data?.instanceId ?? current?.data?.projectMarkerId) === instanceId
          ? {
              ...current,
              position,
              data: {
                ...(current.data ?? {}),
                positionX: position.x,
                positionY: position.y,
                positionZ: position.z,
              },
            }
          : current
      ));
      showToastRef.current('Model position updated', 'success');
      return true;
    } catch (error) {
      console.error('Failed to move Project ThreeD Model instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to move ThreeD Model',
        'error',
      );
      return false;
    } finally {
      setUpdatingModelInstanceId(null);
    }
  }, [deletingModelInstanceId, updateProjectThreeDMarkers, updatingModelInstanceId]);

  const handleMoveModelToggle = useCallback((instanceId: number, name: string) => {
    setMovingModelInstance((current) => (
      current?.id === instanceId ? null : { id: instanceId, name }
    ));
    setPlacementModel(null);
    setPlacementCharacter(null);
    setPlacementFarmBot(null);
    setBedPlacementActive(false);
    setPlantingPlacementActive(false);
  }, []);

  const handleThreeDModelReposition = useCallback(async (
    position: { x: number; y: number; z: number },
  ) => {
    if (!movingModelInstance) return;
    const moved = await handleMoveModelInstance(movingModelInstance.id, position);
    if (moved) setMovingModelInstance(null);
  }, [handleMoveModelInstance, movingModelInstance]);

  const handleUpdateCharacterPosition = useCallback(async (
    markerId: number,
    position: { positionX: number; positionY: number; positionZ: number },
  ) => {
    if (updatingCharacterMarkerId != null || controlledCharacterId != null) return;
    setUpdatingCharacterMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'characters', ...position }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character position update failed (${response.status})`);
      }
      updateProjectThreeDMarkers((markers) => markers.map((marker) => (
        Number(marker.id) === markerId
          ? {
              ...marker,
              ...result.data,
              data: {
                ...marker.data,
                ...(result.data?.data ?? {}),
              },
              metadata: {
                ...marker.metadata,
                ...(result.data?.metadata ?? {}),
              },
            }
          : marker
      )));
      setSelectedMarker((current: any) => current ? {
        ...current,
        position: {
          x: position.positionX,
          y: position.positionY,
          z: position.positionZ,
        },
        data: {
          ...(current.data ?? {}),
          positionX: position.positionX,
          positionY: position.positionY,
          positionZ: position.positionZ,
        },
      } : current);
      showToastRef.current('Character position updated', 'success');
    } catch (error) {
      console.error('Failed to update Project Character position', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Character position',
        'error',
      );
    } finally {
      setUpdatingCharacterMarkerId(null);
    }
  }, [controlledCharacterId, updateProjectThreeDMarkers, updatingCharacterMarkerId]);

  const handleDeleteCharacterInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (
      deletingCharacterMarkerId != null
      || updatingCharacterMarkerId != null
      || controlledCharacterId != null
    ) return;
    setDeletingCharacterMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Character deletion failed (${response.status})`);
      }
      const sourceAssetId = Number(result.data?.sourceAssetId);
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [markerId] },
        sources: Number.isSafeInteger(sourceAssetId) && sourceAssetId > 0
          ? { characters: { removeIds: [sourceAssetId] } }
          : undefined,
      }));
      setSelectedMarker(null);
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'characters',
          assetId: sourceAssetId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project Character instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete Project Character',
        'error',
      );
    } finally {
      setDeletingCharacterMarkerId(null);
    }
  }, [controlledCharacterId, deletingCharacterMarkerId, updatingCharacterMarkerId]);

  const handleUpdateBedInstance = useCallback(async (
    markerId: number,
    input: {
      widthFeet: number;
      lengthFeet: number;
      heightFeet: number;
      scale: number;
      color: string;
      positionX: number;
      positionY: number;
      positionZ: number;
      rotation: number;
    },
  ) => {
    if (updatingBedMarkerId != null || deletingBedMarkerId != null) return;
    setUpdatingBedMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'beds', ...input }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Bed instance update failed (${response.status})`);
      }

      updateProjectThreeDMarkers((markers) => markers.map((marker) => (
        Number(marker.id) === markerId
          ? {
              ...marker,
              ...result.data,
              data: { ...marker.data, ...(result.data?.data ?? {}) },
              metadata: { ...marker.metadata, ...(result.data?.metadata ?? {}) },
            }
          : marker
      )));
      setSelectedMarker(null);
      showToastRef.current('Project Bed instance updated', 'success');
    } catch (error) {
      console.error('Failed to update Project Bed instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Project Bed instance',
        'error',
      );
    } finally {
      setUpdatingBedMarkerId(null);
    }
  }, [deletingBedMarkerId, updateProjectThreeDMarkers, updatingBedMarkerId]);

  const handleDeleteBedInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (deletingBedMarkerId != null || updatingBedMarkerId != null) return;
    setDeletingBedMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Bed deletion failed (${response.status})`);
      }
      updateProjectThreeDMarkers((markers) => markers.filter(
        (marker) => Number(marker.id) !== markerId,
      ));
      const deletedBedId = Number(result.data?.sourceAssetId);
      setData((current) => {
        const raw = current.threed.raw;
        if (!raw || !Number.isSafeInteger(deletedBedId)) return current;
        return {
          ...current,
          threed: {
            ...current.threed,
            raw: {
              ...raw,
              beds: (raw.beds ?? []).filter(
                (bed: any) => Number(bed.id) !== deletedBedId,
              ),
            },
          },
        };
      });
      setSelectedMarker(null);
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'beds',
          assetId: Number(result.data?.sourceAssetId),
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project Bed instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete Project Bed instance',
        'error',
      );
    } finally {
      setDeletingBedMarkerId(null);
    }
  }, [deletingBedMarkerId, updateProjectThreeDMarkers, updatingBedMarkerId]);

  const handleUpdateFarmBotInstance = useCallback(async (
    markerId: number,
    input: {
      widthFeet: number;
      lengthFeet: number;
      heightFeet: number;
      scale: number;
      color: string;
      positionX: number;
      positionY: number;
      positionZ: number;
      rotation: number;
    },
  ) => {
    if (updatingFarmBotMarkerId != null || deletingFarmBotMarkerId != null) return;
    setUpdatingFarmBotMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'farmbots', ...input }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `FarmBot instance update failed (${response.status})`);
      }
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { upsert: [result.data as ProjectThreeDMarkerRecord] },
      }));
      setSelectedMarker(null);
      showToastRef.current('Project FarmBot instance updated', 'success');
    } catch (error) {
      console.error('Failed to update Project FarmBot instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Project FarmBot instance',
        'error',
      );
    } finally {
      setUpdatingFarmBotMarkerId(null);
    }
  }, [deletingFarmBotMarkerId, updatingFarmBotMarkerId]);

  const handleDeleteFarmBotInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (deletingFarmBotMarkerId != null || updatingFarmBotMarkerId != null) return;
    setDeletingFarmBotMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `FarmBot removal failed (${response.status})`);
      }
      const sourceAssetId = Number(result.data?.sourceAssetId);
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [markerId] },
        sources: Number.isSafeInteger(sourceAssetId) && sourceAssetId > 0
          ? { farmbots: { removeIds: [sourceAssetId] } }
          : undefined,
      }));
      setSelectedMarker(null);
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'farmbots',
          assetId: sourceAssetId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to remove Project FarmBot instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to remove Project FarmBot instance',
        'error',
      );
    } finally {
      setDeletingFarmBotMarkerId(null);
    }
  }, [deletingFarmBotMarkerId, updatingFarmBotMarkerId]);

  const handleUpdatePlantingInstance = useCallback(async (
    markerId: number,
    input: {
      modelScale: number;
      positionX: number;
      positionY: number;
      positionZ: number;
    },
  ) => {
    if (updatingPlantingMarkerId != null || deletingPlantingMarkerId != null) return;
    setUpdatingPlantingMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markerType: 'plantings', ...input }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Planting instance update failed (${response.status})`);
      }
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: {
          upsert: [result.data as ProjectThreeDMarkerRecord],
        },
      }));
      setSelectedMarker(null);
      showToastRef.current('Project Planting instance updated', 'success');
    } catch (error) {
      console.error('Failed to update Project Planting instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to update Project Planting instance',
        'error',
      );
    } finally {
      setUpdatingPlantingMarkerId(null);
    }
  }, [deletingPlantingMarkerId, updatingPlantingMarkerId]);

  const handleDeletePlantingInstance = useCallback(async (
    markerId: number,
    name: string,
  ) => {
    if (deletingPlantingMarkerId != null || updatingPlantingMarkerId != null) return;
    setDeletingPlantingMarkerId(markerId);
    try {
      const response = await fetch(`/api/project/threed-markers?id=${markerId}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Planting deletion failed (${response.status})`);
      }
      const deletedPlantingId = Number(result.data?.id);
      setData((current) => applyThreeDProjectClientTransaction(current, {
        markers: { removeRecordIds: [markerId] },
        sources: Number.isSafeInteger(deletedPlantingId) && deletedPlantingId > 0
          ? { plantings: { removeIds: [deletedPlantingId] } }
          : undefined,
      }));
      setSelectedMarker(null);
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'plantings',
          assetId: deletedPlantingId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project ThreeD Planting instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete ThreeD Planting',
        'error',
      );
    } finally {
      setDeletingPlantingMarkerId(null);
    }
  }, [deletingPlantingMarkerId, updatingPlantingMarkerId]);

  const handleDeleteModelInstance = useCallback(async (
    instanceId: number,
    name: string,
  ) => {
    if (deletingModelInstanceId != null) return;
    setDeletingModelInstanceId(instanceId);
    try {
      const response = await fetch(
        `/api/project/threed-markers?id=${instanceId}`,
        { method: 'DELETE' },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Model deletion failed (${response.status})`);
      }

      updateProjectThreeDMarkers((markers) => markers.filter(
        (marker) => Number(marker.id) !== instanceId,
      ));

      setSelectedMarker(null);
      setActionTarget((current) => current
        && isMatchingThreeDActionTarget(current, {
          markerType: 'models',
          assetId: instanceId,
        })
        ? null
        : current);
      setOrchestrationStatus(null);
      showToastRef.current(`${name} removed from the ThreeD Project`, 'success');
    } catch (error) {
      console.error('Failed to delete Project ThreeD Model instance', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToastRef.current(
        error instanceof Error ? error.message : 'Failed to delete ThreeD Model placement',
        'error',
      );
    } finally {
      setDeletingModelInstanceId(null);
    }
  }, [deletingModelInstanceId, updateProjectThreeDMarkers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setLastUpdated(new Date());
    showToast('Data refreshed', 'success');
  };

  // ✅ Drag handlers for panel resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const percentage = ((e.clientY - rect.top) / rect.height) * 100;
      setPanelHeight(Math.min(Math.max(percentage, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ✅ Loading state with skeleton UI
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap justify-between items-center gap-4 animate-pulse">
          <div>
            <div className="h-7 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-muted rounded-lg" />
            <div className="h-8 w-16 bg-muted rounded-lg" />
            <div className="h-8 w-20 bg-muted rounded-lg" />
          </div>
        </div>
        {/* <div className="border rounded-lg p-3 animate-pulse">
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-16 bg-muted rounded-full" />
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
        </div> */}
        {/* <div className="border rounded-lg p-3 animate-pulse">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
        </div> */}
        <div className="border rounded-lg animate-pulse">
          <div className="h-[650px] bg-muted/30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasRealData = data ? (data.traffic.total > 0 || data.threed.total > 0) : false;

  return (
    <div className="relative space-y-1.5">
      {ToastComponent}

      {/* Project Selector Dialog */}
      <ProjectSelectorDialog
        open={isProjectSelectorOpen}
        onOpenChange={setIsProjectSelectorOpen}
        onSelect={handleProjectSelect}
      />

      {/* ✅ Header with Live Data Status Indicator */}
      <div className="m-0 flex flex-wrap items-center justify-between gap-4 px-0.5 py-1">
        
        <div className="relative flex flex-col items-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs font-medium"
            aria-expanded={selectedProjectId ? isProjectSummaryOpen : undefined}
            onClick={() => {
              if (selectedProjectId) {
                setIsProjectSummaryOpen((open) => !open);
              } else {
                setIsProjectSelectorOpen(true);
              }
            }}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {selectedProjectId
              ? projectInfo?.name || `Project #${selectedProjectId}`
              : 'Select Project'}
            {isProjectSummaryOpen && selectedProjectId
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>

          {selectedProjectId && isProjectSummaryOpen && (
            <div className="absolute left-0 top-full z-[2000] mt-1 w-80 space-y-3 rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <FolderOpen className="h-3 w-3" />
                  Project Status
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {data.traffic.total || 0} traffic items
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {data.threed.total || 0} 3D items
                </Badge>
                {!hasRealData && (
                  <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                    No Data
                  </Badge>
                )}
                </div>

                <div className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1.5">
                <Clock className={`h-3 w-3 ${
                  isStale
                    ? 'text-amber-600'
                    : dataAge !== '--'
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                }`} />
                <span
                  className={`text-xs ${
                    isStale
                      ? 'text-amber-600'
                      : dataAge !== '--'
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                  }`}
                  title={lastUpdated?.toLocaleString() || 'Unknown'}
                >
                  {dataAge !== '--' ? `Updated ${dataAge}` : 'Update time unavailable'}
                </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Project Actions
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-8 w-full justify-start text-xs"
                  disabled={savingProjectMarkers}
                  onClick={handleSaveThreeDProject}
                >
                  {savingProjectMarkers
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Save className="h-3.5 w-3.5" />}
                  Save ThreeD Project
                </Button>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-xs"
                    onClick={() => setIsProjectSelectorOpen(true)}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-xs"
                    onClick={() => window.open(
                      `/admin/projects/${selectedProjectId}`,
                      '_blank',
                      'noopener,noreferrer'
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Add to Scene
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start text-xs"
                  disabled={projectThreeDModules.length === 0}
                  onClick={() => void openModelLibrary()}
                >
                  <Box className="h-3.5 w-3.5" />
                  Models
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start text-xs"
                  disabled={projectThreeDModules.length === 0}
                  onClick={() => void openCharacterLibrary()}
                >
                  <User className="h-3.5 w-3.5" />
                  Characters
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start text-xs"
                  disabled={projectThreeDModules.length === 0}
                  onClick={() => void openFarmBotLibrary()}
                >
                  <Settings className="h-3.5 w-3.5" />
                  FarmBots
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start text-xs"
                  disabled={projectThreeDModules.length === 0}
                  onClick={() => {
                    setIsFarmBotLibraryOpen(false);
                    setPlacementFarmBot(null);
                    setIsCharacterLibraryOpen(false);
                    setPlacementCharacter(null);
                    setIsModelLibraryOpen(false);
                    setPlacementModel(null);
                    setIsPlantingPlacementOpen(false);
                    setPlantingPlacementActive(false);
                    setIsBedPlacementOpen(true);
                    setIsProjectSummaryOpen(false);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Bed
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start text-xs"
                  disabled={projectThreeDModules.length === 0}
                  onClick={() => void openPlantingPlacement()}
                >
                  <Sprout className="h-3.5 w-3.5" />
                  Planting
                </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle - Icon Only */}
          <div className="flex items-center gap-1 border rounded-lg p-0">
            <Button
              variant={viewMode === 'combined' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('combined')}
              title="Combined View"
            >
              <Layers className={`w-3.5 h-3.5 ${viewMode === 'combined' ? '' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant={viewMode === '2d' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('2d')}
              title="2D View"
            >
              <Car className={`w-3.5 h-3.5 ${viewMode === '2d' ? '' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant={viewMode === '3d' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('3d')}
              title="3D View"
            >
              <Box className={`w-3.5 h-3.5 ${viewMode === '3d' ? '' : 'text-muted-foreground'}`} />
            </Button>
          </div>

          {/* Filter Toggle - Icon Only */}
          <Button
            variant={showFilterPanel ? 'secondary' : 'outline'}
            size="icon"
            className="h-7 w-7 relative"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title="Toggle filter panel"
          >
            <Filter className={`w-3.5 h-3.5 ${showFilterPanel ? '' : 'text-muted-foreground'}`} />
            {filterAssetType && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full" />
            )}
          </Button>

          {/* Refresh - Icon Only */}
          <Button 
            variant={refreshing ? 'secondary' : 'outline'}
            size="icon" 
            className="h-7 w-7" 
            onClick={handleRefresh} 
            disabled={refreshing} 
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      </div>

      {selectedProjectId && isModelLibraryOpen && (
        <div className="absolute left-1 top-9 z-40 w-[min(24rem,calc(100vw-1rem))] rounded-md border bg-background p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">ThreeD Model Library</h2>
              <p className="text-[11px] text-muted-foreground">
                Drag a model onto the active 2D Map or ThreeD Scene, or choose Place and click.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={placingModel}
              onClick={() => {
                setPlacementModel(null);
                setPlacementScaleMultiplier('1');
                setIsModelLibraryOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {projectThreeDModules.length > 1 && (
            <label className="mb-2 block text-xs">
              <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={placementThreedId ?? ''}
                onChange={(event) => setPlacementThreedId(Number(event.target.value))}
              >
                {projectThreeDModules.map((module) => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </label>
          )}

          {placementModel && (
            <div className="mb-2 space-y-2 rounded border border-cyan-500/40 bg-cyan-500/10 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span>
                  Placing <strong>{placementModel.modelName}</strong>
                  {placingModel ? '…' : ' — click a map or Scene destination'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px]"
                  disabled={placingModel}
                  onClick={() => {
                    setPlacementModel(null);
                    setPlacementScaleMultiplier('1');
                  }}
                >
                  Cancel
                </Button>
              </div>
              <label className="grid grid-cols-[1fr_7rem] items-center gap-2">
                <span>
                  Instance scale
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    (model base: {Number(placementModel.scale ?? 1)})
                  </span>
                </span>
                <Input
                  type="number"
                  min="0.0001"
                  max="10000"
                  step="any"
                  value={placementScaleMultiplier}
                  disabled={placingModel}
                  onChange={(event) => setPlacementScaleMultiplier(event.target.value)}
                  className="h-7 px-2 text-xs"
                  aria-label="Model instance scale multiplier"
                />
              </label>
            </div>
          )}

          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {loadingLibraryModels ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading models…
              </div>
            ) : libraryModels.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No active public Library models are available.
              </p>
            ) : libraryModels.map((model) => (
              <div
                key={model.id}
                draggable={Boolean(placementThreedId) && !placingModel}
                onDragStart={(event) => {
                  setPlacementModel(model);
                  setPlacementScaleMultiplier('1');
                  event.dataTransfer.effectAllowed = 'copy';
                  event.dataTransfer.setData('application/x-threed-model-id', String(model.id));
                  event.dataTransfer.setData('text/plain', model.modelName);
                }}
                className="flex cursor-grab items-center gap-2 rounded border p-2 active:cursor-grabbing"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-cyan-500/10 text-cyan-600">
                  <Box className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{model.modelName}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{model.modelType}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={!placementThreedId || placingModel}
                  draggable={false}
                  onClick={() => {
                    setPlacementModel(model);
                    setPlacementScaleMultiplier('1');
                  }}
                >
                  Place
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProjectId && isCharacterLibraryOpen && (
        <div className="absolute left-1 top-9 z-40 w-[min(24rem,calc(100vw-1rem))] rounded-md border bg-background p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">ThreeD Character Library</h2>
              <p className="text-[11px] text-muted-foreground">
                Select a Character, then click its unique spawn location in the ThreeD Scene.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={placingCharacter}
              onClick={() => {
                setPlacementCharacter(null);
                setIsCharacterLibraryOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {projectThreeDModules.length > 1 && (
            <label className="mb-2 block text-xs">
              <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={placementThreedId ?? ''}
                disabled={placingCharacter}
                onChange={(event) => setPlacementThreedId(Number(event.target.value))}
              >
                {projectThreeDModules.map((module) => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </label>
          )}

          {placementCharacter && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded border border-violet-500/40 bg-violet-500/10 p-2 text-xs">
              <span>
                Placing <strong>{placementCharacter.name}</strong>
                {' '}with {placementCharacter.libraryAccess.runtime} runtime
                {placingCharacter ? '…' : ' — click the ground'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-[10px]"
                disabled={placingCharacter}
                onClick={() => setPlacementCharacter(null)}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {loadingLibraryCharacters ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading Characters…
              </div>
            ) : libraryCharacters.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No eligible Character Library items are available. Character models must be active and classified for Character use.
              </p>
            ) : libraryCharacters.map((character) => {
              const isPlaced = (
                (data.threed.raw?.projectThreedMarkers ?? []).some(
                  (marker) => marker.markerType === 'characters'
                    && Number(marker.sourceAssetId) === Number(character.id),
                )
                || (data.threed.raw?.characters ?? []).some(
                  (projectCharacter) => Number(projectCharacter.id) === Number(character.id),
                )
              );
              return (
              <div key={character.id} className="flex items-center gap-2 rounded border p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-violet-500/10 text-violet-600">
                  {character.libraryAccess.runtime === 'ecctrl' ? '🎮' : '🧚'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{character.name}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {character.libraryAccess.runtime} · {character.type ?? 'character'}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={!placementThreedId || placingCharacter || isPlaced}
                  onClick={() => {
                    setPlacementCharacter(character);
                    setViewMode('3d');
                  }}
                >
                  {isPlaced ? 'Placed' : 'Place'}
                </Button>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedProjectId && isFarmBotLibraryOpen && (
        <div className="absolute left-1 top-9 z-40 w-[min(26rem,calc(100vw-1rem))] rounded-md border bg-background p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">ThreeD FarmBot Library</h2>
              <p className="text-[11px] text-muted-foreground">
                Select an existing FarmBot, set its Project dimensions, then click the Scene ground.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={placingFarmBot}
              onClick={() => {
                setPlacementFarmBot(null);
                setIsFarmBotLibraryOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {projectThreeDModules.length > 1 && (
            <label className="mb-2 block text-xs">
              <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={placementThreedId ?? ''}
                disabled={placingFarmBot}
                onChange={(event) => setPlacementThreedId(Number(event.target.value))}
              >
                {projectThreeDModules.map((module) => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </label>
          )}

          {placementFarmBot && (
            <div className="mb-2 grid grid-cols-2 gap-2 rounded border border-slate-500/40 bg-slate-500/10 p-2 text-xs">
              <div className="col-span-2 font-medium">
                Placing {placementFarmBot.name}{placingFarmBot ? '…' : ' — click the Scene ground'}
              </div>
              {([
                ['widthFeet', 'Width (ft)', '0.1'],
                ['lengthFeet', 'Length (ft)', '0.1'],
                ['heightFeet', 'Height (ft)', '0.1'],
                ['rotation', 'Y rotation', '0.1'],
                ['scale', 'Scale', '0.01'],
              ] as const).map(([field, label, step]) => (
                <label key={field}>
                  <span className="mb-1 block text-muted-foreground">{label}</span>
                  <Input
                    type="number"
                    step={step}
                    value={farmBotPlacementDraft[field]}
                    disabled={placingFarmBot}
                    className="h-8 text-xs"
                    onChange={(event) => setFarmBotPlacementDraft((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))}
                  />
                </label>
              ))}
              <label>
                <span className="mb-1 block text-muted-foreground">Color</span>
                <Input
                  type="color"
                  value={farmBotPlacementDraft.color}
                  disabled={placingFarmBot}
                  className="h-8 w-full p-1"
                  onChange={(event) => setFarmBotPlacementDraft((current) => ({
                    ...current,
                    color: event.target.value,
                  }))}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 self-end text-xs"
                disabled={placingFarmBot}
                onClick={() => setPlacementFarmBot(null)}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {loadingLibraryFarmBots ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading FarmBots…
              </div>
            ) : libraryFarmBots.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No active owned FarmBots are available.
              </p>
            ) : libraryFarmBots.map((farmbot) => {
              const isPlaced = (
                (data.threed.raw?.projectThreedMarkers ?? []).some(
                  (marker) => marker.markerType === 'farmbots'
                    && Number(marker.sourceAssetId) === Number(farmbot.id),
                )
                || (data.threed.raw?.farmbots ?? []).some(
                  (projectFarmBot) => Number(projectFarmBot.id) === Number(farmbot.id),
                )
              );
              return (
                <div key={farmbot.id} className="flex items-center gap-2 rounded border p-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-500/10">🤖</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{farmbot.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {farmbot.assetCode} · {farmbot.status ?? 'offline'}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={!placementThreedId || placingFarmBot || isPlaced}
                    onClick={() => {
                      setPlacementFarmBot(farmbot);
                      setViewMode('3d');
                    }}
                  >
                    {isPlaced ? 'Placed' : 'Place'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedProjectId && isBedPlacementOpen && (
        <div className="absolute left-1 top-9 z-40 w-[min(26rem,calc(100vw-1rem))] rounded-md border bg-background p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Add ThreeD Bed</h2>
              <p className="text-[11px] text-muted-foreground">
                Set the Bed parameters, then choose its location in the ThreeD Scene.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={placingBed}
              onClick={() => {
                setBedPlacementActive(false);
                setIsBedPlacementOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {projectThreeDModules.length > 1 && (
            <label className="mb-2 block text-xs">
              <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={placementThreedId ?? ''}
                disabled={bedPlacementActive || placingBed}
                onChange={(event) => setPlacementThreedId(Number(event.target.value))}
              >
                {projectThreeDModules.map((module) => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="col-span-2">
              <span className="mb-1 block text-muted-foreground">Bed name</span>
              <Input
                value={bedPlacementDraft.name}
                disabled={bedPlacementActive || placingBed}
                maxLength={100}
                className="h-8 text-xs"
                onChange={(event) => setBedPlacementDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))}
              />
            </label>
            <label>
              <span className="mb-1 block text-muted-foreground">Shape</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={bedPlacementDraft.shape}
                disabled
                onChange={(event) => setBedPlacementDraft((current) => ({
                  ...current,
                  shape: event.target.value,
                }))}
              >
                <option value="rectangle">rectangle</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-muted-foreground">Color</span>
              <Input
                type="color"
                value={bedPlacementDraft.color}
                disabled={bedPlacementActive || placingBed}
                className="h-8 w-full p-1"
                onChange={(event) => setBedPlacementDraft((current) => ({
                  ...current,
                  color: event.target.value,
                }))}
              />
            </label>
            {([
              ['widthFeet', 'Width (ft)', '0.1'],
              ['lengthFeet', 'Length (ft)', '0.1'],
              ['heightFeet', 'Height (ft)', '0.1'],
              ['rotation', 'Y rotation', '0.1'],
              ['scale', 'Scale', '0.01'],
            ] as const).map(([field, label, step]) => (
              <label key={field}>
                <span className="mb-1 block text-muted-foreground">{label}</span>
                <Input
                  type="number"
                  step={step}
                  value={bedPlacementDraft[field]}
                  disabled={bedPlacementActive || placingBed}
                  className="h-8 text-xs"
                  onChange={(event) => setBedPlacementDraft((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))}
                />
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
            {bedPlacementActive && (
              <span className="mr-auto text-[11px] text-cyan-600">
                Click the Scene ground to place the Bed.
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={placingBed}
              onClick={() => setBedPlacementActive(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              disabled={
                !placementThreedId
                || !bedPlacementDraft.name.trim()
                || bedPlacementActive
                || placingBed
              }
              onClick={() => {
                setBedPlacementActive(true);
                setViewMode('3d');
              }}
            >
              {placingBed ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Place Bed
            </Button>
          </div>
        </div>
      )}

      {selectedProjectId && isPlantingPlacementOpen && (
        <div className="absolute left-1 top-9 z-40 w-[min(26rem,calc(100vw-1rem))] rounded-md border bg-background p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Add ThreeD Planting</h2>
              <p className="text-[11px] text-muted-foreground">
                Select a Plant, then choose its location in the ThreeD Scene.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={placingPlanting}
              onClick={() => {
                setPlantingPlacementActive(false);
                setIsPlantingPlacementOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {projectThreeDModules.length > 1 && (
            <label className="mb-2 block text-xs">
              <span className="mb-1 block text-muted-foreground">ThreeD Module</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={placementThreedId ?? ''}
                disabled={plantingPlacementActive || placingPlanting}
                onChange={(event) => setPlacementThreedId(Number(event.target.value))}
              >
                {projectThreeDModules.map((module) => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="col-span-2">
              <span className="mb-1 block text-muted-foreground">Plant</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={plantingPlacementDraft.plantId}
                disabled={plantingPlacementActive || placingPlanting || loadingPlantingOptions}
                onChange={(event) => setPlantingPlacementDraft((current) => ({
                  ...current,
                  plantId: event.target.value,
                }))}
              >
                {loadingPlantingOptions && <option value="">Loading Plants…</option>}
                {!loadingPlantingOptions && plantingOptions.length === 0 && (
                  <option value="">No active Plants available</option>
                )}
                {plantingOptions.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.commonName}{plant.variety ? ` — ${plant.variety}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2">
              <span className="mb-1 block text-muted-foreground">Project Bed (optional)</span>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={plantingPlacementDraft.bedId}
                disabled={plantingPlacementActive || placingPlanting}
                onChange={(event) => setPlantingPlacementDraft((current) => ({
                  ...current,
                  bedId: event.target.value,
                }))}
              >
                <option value="">No Bed</option>
                {(data.threed.raw?.beds ?? []).map((bed: any) => (
                  <option key={bed.id} value={bed.id}>{bed.name || `Bed #${bed.id}`}</option>
                ))}
              </select>
            </label>
            {([
              ['quantity', 'Quantity', '1'],
              ['spacingInches', 'Spacing (in)', '1'],
              ['modelScale', 'Model scale', '0.01'],
            ] as const).map(([field, label, step]) => (
              <label key={field}>
                <span className="mb-1 block text-muted-foreground">{label}</span>
                <Input
                  type="number"
                  step={step}
                  value={plantingPlacementDraft[field]}
                  disabled={plantingPlacementActive || placingPlanting}
                  className="h-8 text-xs"
                  onChange={(event) => setPlantingPlacementDraft((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))}
                />
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
            {plantingPlacementActive && (
              <span className="mr-auto text-[11px] text-emerald-600">
                Click the Scene ground to place the Planting.
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={placingPlanting}
              onClick={() => setPlantingPlacementActive(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              disabled={
                !placementThreedId
                || !plantingPlacementDraft.plantId
                || plantingPlacementActive
                || placingPlanting
              }
              onClick={() => {
                setPlantingPlacementActive(true);
                setViewMode('3d');
              }}
            >
              {placingPlanting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Place Planting
            </Button>
          </div>
        </div>
      )}

      {/* ✅ v0.13.0-beta: Advanced Filtering Panel */}
      {showFilterPanel && (
        <Card className="border-primary/20">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>

              {/* Search/Text Filter */}
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search markers by name..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="h-7 text-xs w-44"
                />
                {filterText && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setFilterText('')}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Active Only Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={filterActiveOnly}
                  onCheckedChange={setFilterActiveOnly}
                  id="active-only"
                  className="scale-75"
                />
                <Label htmlFor="active-only" className="text-xs cursor-pointer">Active Only</Label>
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Asset Type Quick Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Type:</span>
                {['Plantings', 'Beds', 'Characters', 'FarmBots', 'Models', 'CHP CAD', 'CalFire'].map((type) => (
                  <Badge
                    key={type}
                    variant={filterAssetType === type ? 'default' : 'outline'}
                    className="text-[10px] cursor-pointer hover:bg-muted"
                    onClick={() => handleStatCardClick(type)}
                  >
                    {type}
                    {filterAssetType === type && <X className="w-2.5 h-2.5 ml-1" />}
                  </Badge>
                ))}
              </div>

              {/* Clear All */}
              {(filterText || filterActiveOnly || filterAssetType) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground ml-auto"
                  onClick={() => {
                    setFilterText('');
                    setFilterActiveOnly(false);
                    setFilterAssetType(null);
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Layer Controls */}
      {false && (
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* Traffic Layers */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Traffic:</span>
                {Object.entries(layers.traffic).map(([id, config]) => (
                  <div key={id} className="flex items-center gap-1">
                    <Button
                      variant={config.enabled ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => toggleLayer('traffic', id)}
                    >
                      {getTrafficIcon(id)}
                      <span className="ml-1">{getTrafficLabel(id)}</span>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="w-px h-6 bg-border" />

              {/* ThreeD Layers */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">ThreeD:</span>
                {Object.entries(layers.threed).map(([id, config]) => (
                  <div key={id} className="flex items-center gap-1">
                    <Button
                      variant={config.enabled ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => toggleLayer('threed', id)}
                    >
                      {getThreeDIcon(id)}
                      <span className="ml-1">{getThreeDLabel(id)}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Map Container */}
      <Card className={isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
        <CardContent className="p-0 overflow-hidden">
          <div style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 122px)' }}>
            
            {/* Pass cameraMode to combined view's 3D UnifiedMapView */}
            {viewMode === 'combined' && (
              <div 
                ref={containerRef}
                className="flex flex-col w-full h-full gap-0 p-0 relative"
              >
                <div 
                  className="min-h-0 transition-none"
                  style={{ height: `${panelHeight}%` }}
                >
                  <div className="relative w-full h-full rounded-t-lg overflow-hidden border border-white/10 bg-black/5">
                    <UnifiedMapView
                      projectId={selectedProjectId ? Number(selectedProjectId) : null}
                      data={data}
                      layers={layers}
                      viewMode="3d"
                      onIncidentSelect={(incident) => setSelectedIncident(incident)}
                      onMarkerSelect={(marker) => setSelectedMarker(marker)}
                      onFocusMarker={handleFocusMarker}
                      selectedIncident={selectedIncident}
                      selectedMarker={selectedMarker}
                      height="100%"
                      visibleAssetTypes={visibleAssetTypes}
                      filterText={filterText}
                      filterActiveOnly={filterActiveOnly}
                      filterAssetType={filterAssetType}
                      controlledCharacterId={controlledCharacterId}
                      cameraMode={cameraMode}
                      onCameraModeChange={setCameraMode}
                      focusRequest={focusRequest}
                      actionTarget={actionTarget}
                      actionTargetFocusRequest={actionTargetFocusRequest}
                      placementModel={placementModel}
                      onModelPlacement={handleModelPlacement}
                      movingModelName={movingModelInstance?.name ?? null}
                      onModelReposition={handleThreeDModelReposition}
                      placementCharacterName={placementCharacter?.name ?? null}
                      onCharacterPlacement={handleCharacterPlacement}
                      placementFarmBotName={placementFarmBot?.name ?? null}
                      onFarmBotPlacement={handleFarmBotPlacement}
                      placementBedName={bedPlacementActive ? bedPlacementDraft.name : null}
                      onBedPlacement={handleBedPlacement}
                      placementPlantingName={plantingPlacementActive
                        ? plantingOptions.find((plant) => String(plant.id) === plantingPlacementDraft.plantId)?.commonName ?? 'Planting'
                        : null}
                      onPlantingPlacement={handlePlantingPlacement}
                      onProjectMarkerSnapshotProviderChange={handleProjectMarkerSnapshotProviderChange}
                      onRuntimeMarkerPositionResolverChange={handleRuntimeMarkerPositionResolverChange}
                      onRejectedProjectMarkerDelete={handleRejectedProjectMarkerDelete}
                      onRejectedCharacterMarkerRepair={handleRejectedCharacterMarkerRepair}
                    />
                  </div>
                </div>
                
                <div 
                  className="flex-shrink-0 h-1.5 cursor-row-resize hover:bg-primary/50 transition-colors bg-border/50 my-0.5 rounded-full group"
                  onMouseDown={handleMouseDown}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
                  </div>
                </div>
                
                <div 
                  className="min-h-0 transition-none"
                  style={{ height: `${100 - panelHeight}%` }}
                >
                  <div className="relative w-full h-full rounded-b-lg overflow-hidden border border-white/10 bg-black/5">
                    <UnifiedMapView
                      projectId={selectedProjectId ? Number(selectedProjectId) : null}
                      data={data}
                      layers={layers}
                      viewMode="2d"
                      onIncidentSelect={(incident) => setSelectedIncident(incident)}
                      onMarkerSelect={(marker) => setSelectedMarker(marker)}
                      onFocusMarker={handleFocusMarker}
                      selectedIncident={selectedIncident}
                      selectedMarker={selectedMarker}
                      height="100%"
                      visibleAssetTypes={visibleAssetTypes}
                      filterText={filterText}
                      filterActiveOnly={filterActiveOnly}
                      filterAssetType={filterAssetType}
                      controlledCharacterId={controlledCharacterId}
                      placementModel={placementModel}
                      onModelPlacement={handleModelPlacement}
                      onModelMove={handleMoveModelInstance}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === '3d' && (
              <UnifiedMapView
                projectId={selectedProjectId ? Number(selectedProjectId) : null}
                data={data}
                layers={layers}
                viewMode="3d"
                onIncidentSelect={(incident) => setSelectedIncident(incident)}
                onMarkerSelect={(marker) => setSelectedMarker(marker)}
                onFocusMarker={handleFocusMarker}
                selectedIncident={selectedIncident}
                selectedMarker={selectedMarker}
                height="100%"
                visibleAssetTypes={visibleAssetTypes}
                filterText={filterText}
                filterActiveOnly={filterActiveOnly}
                filterAssetType={filterAssetType}
                controlledCharacterId={controlledCharacterId}
                onControlChange={handleControlChange}
                cameraMode={cameraMode}
                onCameraModeChange={setCameraMode}
                focusRequest={focusRequest}
                actionTarget={actionTarget}
                actionTargetFocusRequest={actionTargetFocusRequest}
                placementModel={placementModel}
                onModelPlacement={handleModelPlacement}
                movingModelName={movingModelInstance?.name ?? null}
                onModelReposition={handleThreeDModelReposition}
                placementCharacterName={placementCharacter?.name ?? null}
                onCharacterPlacement={handleCharacterPlacement}
                placementFarmBotName={placementFarmBot?.name ?? null}
                onFarmBotPlacement={handleFarmBotPlacement}
                placementBedName={bedPlacementActive ? bedPlacementDraft.name : null}
                onBedPlacement={handleBedPlacement}
                placementPlantingName={plantingPlacementActive
                  ? plantingOptions.find((plant) => String(plant.id) === plantingPlacementDraft.plantId)?.commonName ?? 'Planting'
                  : null}
                onPlantingPlacement={handlePlantingPlacement}
                onProjectMarkerSnapshotProviderChange={handleProjectMarkerSnapshotProviderChange}
                onRuntimeMarkerPositionResolverChange={handleRuntimeMarkerPositionResolverChange}
                onRejectedProjectMarkerDelete={handleRejectedProjectMarkerDelete}
                onRejectedCharacterMarkerRepair={handleRejectedCharacterMarkerRepair}
              />
            )}

            {viewMode === '2d' && (
              <UnifiedMapView
                projectId={selectedProjectId ? Number(selectedProjectId) : null}
                data={data}
                layers={layers}
                viewMode="2d"
                onIncidentSelect={(incident) => setSelectedIncident(incident)}
                onMarkerSelect={(marker) => setSelectedMarker(marker)}
                onFocusMarker={handleFocusMarker}
                selectedIncident={selectedIncident}
                selectedMarker={selectedMarker}
                height="100%"
                visibleAssetTypes={visibleAssetTypes}
                filterText={filterText}
                filterActiveOnly={filterActiveOnly}
                filterAssetType={filterAssetType}
                controlledCharacterId={controlledCharacterId}
                onControlChange={handleControlChange}
                placementModel={placementModel}
                onModelPlacement={handleModelPlacement}
                onModelMove={handleMoveModelInstance}
              />
            )}

          </div>
        </CardContent>
      </Card>

      {/* ✅ v0.15.2: Details Card — rendered outside map to avoid Leaflet interference */}
      <DetailsCard
        selected={selectedMarker || selectedIncident}
        projectId={selectedProjectId}
        onClose={() => { setSelectedMarker(null); setSelectedIncident(null); }}
        controlledCharacterId={controlledCharacterId}
        liveControlledCharacterPosition={liveControlledCharacterPosition}
        onTakeControl={(id) => {
          setLiveControlledCharacterPosition(null);
          setCameraMode('stationary');
          setControlledCharacterId(id);
        }}
        onReleaseControl={() => {
          setControlledCharacterId(null);
          setLiveControlledCharacterPosition(null);
        }}
        cameraMode={cameraMode}
        onCameraModeChange={(mode) => setCameraMode(mode)}
        onZoomCenter={handleZoomCenter}
        actionTarget={actionTarget}
        orchestrationStatus={orchestrationStatus}
        onSetActionTarget={(target) => {
          setActionTarget(target);
          setOrchestrationStatus(null);
          showToast(`Action target set: ${target.name}`, 'success');
        }}
        onClearActionTarget={() => {
          setActionTarget(null);
          setOrchestrationStatus(null);
          showToast('Action target cleared', 'info');
        }}
        onFocusActionTarget={handleFocusActionTarget}
        resolveRuntimeMarkerPosition={resolveRuntimeMarkerPosition}
        onUpdateModelInstance={handleUpdateModelInstance}
        updatingModelInstanceId={updatingModelInstanceId}
        onDeleteModelInstance={handleDeleteModelInstance}
        deletingModelInstanceId={deletingModelInstanceId}
        movingModelInstanceId={movingModelInstance?.id ?? null}
        onMoveModelToggle={handleMoveModelToggle}
        onUpdateBedInstance={handleUpdateBedInstance}
        updatingBedMarkerId={updatingBedMarkerId}
        onDeleteBedInstance={handleDeleteBedInstance}
        deletingBedMarkerId={deletingBedMarkerId}
        onUpdateFarmBotInstance={handleUpdateFarmBotInstance}
        updatingFarmBotMarkerId={updatingFarmBotMarkerId}
        onDeleteFarmBotInstance={handleDeleteFarmBotInstance}
        deletingFarmBotMarkerId={deletingFarmBotMarkerId}
        onUpdatePlantingInstance={handleUpdatePlantingInstance}
        updatingPlantingMarkerId={updatingPlantingMarkerId}
        onDeletePlantingInstance={handleDeletePlantingInstance}
        deletingPlantingMarkerId={deletingPlantingMarkerId}
        onUpdateCharacterPosition={handleUpdateCharacterPosition}
        updatingCharacterMarkerId={updatingCharacterMarkerId}
        onDeleteCharacterInstance={handleDeleteCharacterInstance}
        deletingCharacterMarkerId={deletingCharacterMarkerId}
      />
      
    </div>
  );
}
