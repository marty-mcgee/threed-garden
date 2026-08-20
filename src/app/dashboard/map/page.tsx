// app/dashboard/map/page-v0130b.tsx - v0.13.0-beta "Smart Dashboard"
// Features: Rich Popups + Admin Links, Advanced Filtering, Interactive Stats, Live Data Indicator
'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Wifi,
  WifiOff,
  X,
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
import { UnifiedMapView } from '@/components/map/UnifiedMapView';
import { MapLayerConfig, MapViewMode, ThreeDActionTarget, UnifiedMapData } from '@/lib/types/map';
import {
  getTrafficIcon,
  getTrafficLabel,
  getThreeDIcon,
  getThreeDLabel,
} from '@/lib/utils/map-helpers';

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
    <div className="mt-2.5 border-t border-white/10 pt-2">
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

function DetailsCard({ selected, projectId, onClose, controlledCharacterId, onTakeControl, onReleaseControl, cameraMode, onCameraModeChange, onZoomCenter, actionTarget, onSetActionTarget, onClearActionTarget, onFocusActionTarget }: {
  selected: any;
  projectId: string | null;
  onClose: () => void;
  controlledCharacterId: number | null;
  onTakeControl: (id: number) => void;
  onReleaseControl: () => void;
  cameraMode?: string;
  onCameraModeChange?: (mode: string) => void;
  onZoomCenter?: () => void;
  actionTarget?: ThreeDActionTarget | null;
  onSetActionTarget?: (target: ThreeDActionTarget) => void;
  onClearActionTarget?: () => void;
  onFocusActionTarget?: () => void;
}) {
  if (!selected) return null;
  const d = selected.data || selected.metadata?.data || selected.metadata || {};
  const isIncident = selected.latitude != null || selected.severity || (selected.title && selected.location);
  const typeLabel = selected.type || (isIncident ? 'Traffic Incident' : 'Marker');
  const typeColor = selected.severity === 'critical' ? '#ef4444' :
    selected.severity === 'high' ? '#f97316' :
    selected.severity === 'medium' ? '#eab308' : '#22c55e';

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
  const isPlantingMarker = normalizedType === 'planting'
    || normalizedType === 'plantings'
    || normalizedType === 'threed_plantings';
  const isFarmBotMarker = normalizedType === 'farmbot'
    || normalizedType === 'farmbots'
    || normalizedType === 'threed_farmbots';
  if (isPlantingMarker) {
    if (d.plantName || d.commonName) metaRows.push({ label: 'Plant', value: d.plantName || d.commonName });
    if (d.growthStage) metaRows.push({ label: 'Stage', value: d.growthStage });
    if (d.health != null) metaRows.push({ label: 'Health', value: `${d.health}` });
    if (d.quantity) metaRows.push({ label: 'Qty', value: `${d.quantity}` });
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

  return (
    <div className="fixed top-20 left-4 z-[1000] bg-black/85 backdrop-blur-sm text-white p-3 rounded-lg border border-white/10 shadow-xl max-w-[260px] pointer-events-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-white truncate max-w-[170px]">
          {selected.name || selected.title || selected.label || 'Unknown'}
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Type badge + severity */}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 capitalize">{typeLabel}</span>
        {selected.severity && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: typeColor + '30', color: typeColor }}>
            {selected.severity}
          </span>
        )}
      </div>

      {/* GPS coordinates (incidents) */}
      {selected.lat != null && selected.lng != null && (
        <div className="text-[10px] text-white/40 mt-1.5 font-mono">
          📍 {Number(selected.lat).toFixed(4)}, {Number(selected.lng).toFixed(4)}
        </div>
      )}

      {/* Metadata grid */}
      {metaRows.length > 0 && (
        <div className="mt-2.5 border-t border-white/10 pt-2 space-y-0.5">
          {metaRows.map((r, i) => <KvRow key={i} label={r.label} value={r.value} />)}
        </div>
      )}

      {isFarmBotMarker && (
        <FarmBotMqttStatusSummary
          farmbotId={Number(d.id)}
          projectId={projectId}
        />
      )}

      {/* v0.16.2-beta: Manual zoom + center action */}
      {!isIncident && onZoomCenter && (
        <div className="mt-2.5 border-t border-white/10 pt-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onZoomCenter(); }}
            className="block w-full text-center text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-1.5 px-2 rounded transition-colors"
          >
            🎯 Zoom + Center
          </button>
        </div>
      )}

      {/* World Action Target — v0.16.6b World Actions v2 */}
      {!isIncident && (isPlantingMarker || isFarmBotMarker) && onSetActionTarget && (() => {
        const markerId = String(selected.id || '');
        const markerIdSuffix = markerId.match(/(\d+)$/)?.[1];
        const targetId = Number(d.id ?? markerIdSuffix);
        const targetType = isFarmBotMarker ? 'farmbot' : 'planting';
        const fallbackName = targetType === 'farmbot'
          ? `FarmBot #${targetId}`
          : `Planting #${targetId}`;
        const targetName = selected.name || selected.label || d.plantName || d.commonName
          || fallbackName;
        const isCurrentTarget = actionTarget?.type === targetType && actionTarget.id === targetId;

        return (
          <div className="mt-2.5 border-t border-white/10 pt-2.5 space-y-1.5">
            <div className="text-[10px] font-medium text-white/60">World Action Target</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!Number.isFinite(targetId) || !selected.position) return;
                const targetPosition = {
                  x: Number(selected.position.x),
                  y: Number(selected.position.y),
                  z: Number(selected.position.z),
                };
                if (!Object.values(targetPosition).every(Number.isFinite)) return;
                onSetActionTarget({
                  markerId: markerId || `${targetType}s-${targetId}`,
                  type: targetType,
                  id: targetId,
                  name: targetName,
                  position: targetPosition,
                });
              }}
              className={`block w-full text-center text-[11px] font-medium py-1.5 px-2 rounded transition-colors ${
                isCurrentTarget
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/75 hover:text-white'
              }`}
            >
              {isCurrentTarget ? '🎯 Current Action Target' : '🎯 Use as Action Target'}
            </button>
            {isCurrentTarget && onClearActionTarget && (
              <button
                onClick={(e) => { e.stopPropagation(); onClearActionTarget(); }}
                className="block w-full text-center text-[10px] text-white/45 hover:text-white/70 py-1"
              >
                Clear target
              </button>
            )}
          </div>
        );
      })()}

      {/* Description (incidents) — only if no metaRows covered it */}
      {isIncident && selected.description && !metaRows.length && (
        <div className="mt-2 text-[11px] text-white/50">
          {selected.description.slice(0, 100)}{selected.description.length > 100 ? '...' : ''}
        </div>
      )}

      {/* Character Actions — shared semantic animation controls */}
      {!isIncident && (type === 'characters' || type === 'character') && (
        <div className="mt-2.5 border-t border-white/10 pt-2.5 space-y-2.5">
          <div className="text-[10px] font-medium text-white/60">Character Actions</div>

          <div className="rounded bg-white/5 px-2 py-1.5 text-[10px] text-white/55">
            {actionTarget ? (
              <>
                <div>🎯 Target: <span className="text-emerald-300">{actionTarget.name}</span> <span className="text-white/30">({actionTarget.type} #{actionTarget.id})</span></div>
                {actionTarget.type === 'farmbot' && (
                  <div className="mt-1 text-amber-200/70">
                    FarmBot interactions are animation-only. Physical commands remain disabled.
                  </div>
                )}
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {onFocusActionTarget && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onFocusActionTarget(); }}
                      className="rounded bg-emerald-600/25 px-2 py-1 text-emerald-100 transition-colors hover:bg-emerald-600/45 hover:text-white"
                    >
                      Focus Target
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

          {(actionTarget?.type === 'farmbot' ? [
            {
              title: 'FarmBot Interaction',
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
          ]).map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="text-[9px] uppercase tracking-wide text-white/35">
                {group.title}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {group.actions.map(({ action, label }) => (
                  <button
                    key={action}
                    onClick={(e) => {
                      e.stopPropagation();

                      const charId = Number(d.id);
                      if (!Number.isFinite(charId)) return;

                      window.dispatchEvent(
                        new CustomEvent('garden-character-action', {
                          detail: {
                            characterId: charId,
                            action,
                            target: actionTarget
                              ? { ...actionTarget, actionRequestId: crypto.randomUUID() }
                              : null,
                          },
                        }),
                      );
                    }}
                    className="min-h-8 w-full rounded bg-emerald-600/25 px-2 py-1.5 text-center text-[10px] font-medium leading-tight text-emerald-100 transition-colors hover:bg-emerald-600/45 hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Character Controls — ecctrl runtime take-over (movable characters only) */}
      {!isIncident && (type === 'characters' || type === 'character') && (() => {
        if (d.isMovable !== true) return null;
        const charId = d.id;
        const isControlling = controlledCharacterId === charId;
        return (
          <div className="mt-2.5 border-t border-white/10 pt-2.5 space-y-2">
            {isControlling ? (
              <>
                <div className="text-[10px] text-blue-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                  <span>WASD / Space / Shift active</span>
                </div>
                {onCameraModeChange && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-white/50">Camera:</div>
                    <select
                      value={cameraMode || 'follow'}
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
                <button
                  onClick={(e) => { e.stopPropagation(); onReleaseControl(); }}
                  className="block w-full text-center text-[11px] font-medium bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-2 rounded transition-colors"
                >
                  ⏸️ Release Control
                </button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onTakeControl(charId); }}
                className="block w-full text-center text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-2 rounded transition-colors"
              >
                🎮 Take Control
              </button>
            )}
          </div>
        );
      })()}

      {/* Admin Edit link */}
      {(() => {
        const adminType = selected.type || (isIncident ? (selected._collection || 'chpCad') : 'plantings');
        const adminId = selected.metadata?.data?.id || selected.id;
        const routeMap: Record<string, string> = {
          plantings: '/admin/threed/plantings', planting: '/admin/threed/plantings',
          beds: '/admin/threed/beds', bed: '/admin/threed/beds',
          characters: '/admin/threed/characters', character: '/admin/threed/characters',
          farmbots: '/admin/threed/farmbots', farmbot: '/admin/threed/farmbots',
          chpCad: '/admin/traffic/chp-cad', chpCadIncidents: '/admin/traffic/chp-cad',
          chpCases: '/admin/traffic/chp-cases', chpCenters: '/admin/traffic/chp-centers',
          caltransLaneClosures: '/admin/traffic/caltrans', caltransClosures: '/admin/traffic/caltrans',
          caltransCctv: '/admin/traffic/caltrans-cctv', caltransDistricts: '/admin/traffic/caltrans-districts',
          bayArea511: '/admin/traffic/bay-area-511', bayArea511Events: '/admin/traffic/bay-area-511',
          calfireIncidents: '/admin/traffic/calfire', calfire: '/admin/traffic/calfire',
        };
        const adminRoute = routeMap[adminType] || (isIncident ? '/admin/traffic' : '/admin/threed/plantings');
        return (
          <div className="mt-2.5 border-t border-white/10 pt-2.5">
            <a
              href={`${adminRoute}?id=${adminId}`}
              target="_blank" rel="noopener noreferrer"
              className="block text-center text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-1.5 px-2 rounded transition-colors no-underline"
            >
              🔧 Edit in Admin
            </a>
          </div>
        );
      })()}
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  
  // ✅ State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdParam);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(!projectIdParam);
  const [data, setData] = useState<UnifiedMapData>(getDefaultMapData());
  const [isDefaultView, setIsDefaultView] = useState(!projectIdParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{ name: string; hasData: boolean } | null>(null);
  
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
  const [cameraMode, setCameraMode] = useState<string>('follow');
  const [focusRequest, setFocusRequest] = useState(0);
  const [actionTarget, setActionTarget] = useState<ThreeDActionTarget | null>(null);
  const [actionTargetFocusRequest, setActionTargetFocusRequest] = useState(0);
  const [layers, setLayers] = useState<MapLayerConfig>(getDefaultLayers());

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
      return { ...prev, position: { ...prev.position, x: pos.x, y: pos.y, z: pos.z } };
    });
  }, []);

  // v0.16.3-alpha: Selecting a different marker/incident disengages the currently
  // controlled character so only the newly engaged entity is the active focus.
  useEffect(() => {
    if (controlledCharacterId == null) return;
    const sel = selectedMarker || selectedIncident;
    if (!sel) return;
    const selCharId = sel.data?.id ?? sel.metadata?.data?.id ?? sel.id;
    const isChar = sel.type === 'characters' || sel.type === 'character';
    if (!isChar || selCharId !== controlledCharacterId) {
      setControlledCharacterId(null);
    }
  }, [selectedMarker, selectedIncident, controlledCharacterId]);

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
    setIsDefaultView(false);
    setFilterAssetType(null); // Reset filter on project change
    setActionTarget(null); // Action targets are scoped to the current project.
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
    const targetCollection = actionTarget.type === 'farmbot'
      ? data.threed.raw?.farmbots
      : data.threed.raw?.plantings;
    if (!targetCollection) return;

    const targetStillExists = targetCollection.some(
      (asset: any) => Number(asset.id) === actionTarget.id,
    );

    if (!targetStillExists) {
      setActionTarget(null);
      showToastRef.current(
        `Action target cleared: ${actionTarget.name} is no longer available`,
        'info',
      );
    }
  }, [
    actionTarget,
    data.threed.raw?.farmbots,
    data.threed.raw?.plantings,
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

      const actor = detail.characterName || `Character #${detail.characterId ?? '?'}`;
      const actionLabel = detail.action.replace(/([a-z])([A-Z])/g, '$1 $2');
      const isHarvestAction = ['pickFruit', 'pickFruit2', 'pickFruit3'].includes(detail.action);

      // ----------------------------------------------------
      // FIRST PERSISTED WORLD ACTION: TARGETED WATERING
      // ----------------------------------------------------
      if (
        detail.action === 'watering' &&
        detail.target?.type === 'planting' &&
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
                type: detail.target.type,
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
        detail.target?.type === 'planting' &&
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
                type: detail.target.type,
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
            name: `Project #${selectedProjectId}`,
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
    <div className="space-y-1.5">
      {ToastComponent}

      {/* Project Selector Dialog */}
      <ProjectSelectorDialog
        open={isProjectSelectorOpen}
        onOpenChange={setIsProjectSelectorOpen}
        onSelect={handleProjectSelect}
      />

      {/* ✅ Header with Live Data Status Indicator */}
      <div className="flex flex-wrap justify-between items-center gap-4 m-0">
        
        <div className="flex items-center gap-2">
          {/* <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            -||-
          </h1> */}
          <Badge 
            variant="outline" 
            className="text-xs cursor-pointer hover:bg-muted"
            onClick={() => setIsProjectSelectorOpen(true)}
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1" />
            {selectedProjectId ? projectInfo?.name || `Project #${selectedProjectId}` : '🔍 Select Project'}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Badge>

          {!hasRealData && selectedProjectId && (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              No Data
            </Badge>
          )}
        {/* </div>
        <div className="flex items-center gap-3 ml-9"> */}
          <p className="text-xs text-muted-foreground">
            {hasRealData ? (
              `${data.traffic.total || 0} traffic items • ${data.threed.total || 0} 3D items`
            ) : selectedProjectId ? (
              'No data available for this project'
            ) : (
              'Select a project to load data'
            )}
          </p>
          {/* ✅ Live Data Status Indicator */}
          {selectedProjectId && (
            <div className="flex items-center gap-1.5">

              {/* {isStale ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              ) : dataAge !== '--' ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : null} */}
              
              <Clock className={`w-3 h-3 ${isStale ? 'text-amber-600' : dataAge !== '--' ? 'text-green-600' : 'text-muted-foreground'}`} />

              <span 
                className={`text-xs ${isStale ? 'text-amber-600' : dataAge !== '--' ? 'text-green-600' : 'text-muted-foreground'}`} 
                title={lastUpdated?.toLocaleString() || 'Unknown'}
              >
                {dataAge !== '--' ? `Updated ${dataAge}` : ''}
              </span>
          
              <Button
                variant="ghost"
                // size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => router.push(`/admin/projects/${selectedProjectId}`)}
              >
                <Settings className="w-3 h-3" />
                Details
              </Button>
            
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
                      focusRequest={focusRequest}
                      actionTarget={actionTarget}
                      actionTargetFocusRequest={actionTargetFocusRequest}
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
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === '3d' && (
              <UnifiedMapView
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
                focusRequest={focusRequest}
                actionTarget={actionTarget}
                actionTargetFocusRequest={actionTargetFocusRequest}
              />
            )}

            {viewMode === '2d' && (
              <UnifiedMapView
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
        onTakeControl={(id) => setControlledCharacterId(id)}
        onReleaseControl={() => setControlledCharacterId(null)}
        cameraMode={cameraMode}
        onCameraModeChange={(mode) => setCameraMode(mode)}
        onZoomCenter={handleZoomCenter}
        actionTarget={actionTarget}
        onSetActionTarget={(target) => {
          setActionTarget(target);
          showToast(`Action target set: ${target.name}`, 'success');
        }}
        onClearActionTarget={() => {
          setActionTarget(null);
          showToast('Action target cleared', 'info');
        }}
        onFocusActionTarget={handleFocusActionTarget}
      />
      
    </div>
  );
}
