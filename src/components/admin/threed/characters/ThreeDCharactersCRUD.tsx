// components/admin/threed/characters/ThreeDCharactersCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Box,
  Plus,
  Clapperboard,
  Edit,
  Trash2,
  Loader2,
  Users,
  MoreHorizontal,
  Eye,
  EyeOff,
  MapPin,
  Play,
  Pause,
  Move,
  Clock,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { ModelFileList, ModelFileRow } from '@/components/admin/threed/models/ModelFileList';

import { CharacterAnimationAssignments } from '@/components/admin/threed/animations/CharacterAnimationAssignments';

// ✅ Types
interface Model {
  id: number;
  modelName: string;
  modelType: string;
  filePath?: string | null;
  metadata?: {
    animationMap?: Record<string, string>;
    [key: string]: unknown;
  } | null;
  files?: ModelFileRow[];
}

interface Character {
  id: number;
  characterId: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  status: string;
  modelId: number | null;
  animations: string[];
  defaultAnimation: string | null;
  animationSpeed: string;
  isMovable: boolean;
  movementType: string;
  movementPattern: string | null;
  movementRadius: string | null;
  movementSpeed: string;
  patrolWaypoints: any[];
  followTarget: string | null;
  followDistance: string;
  teleportPositions: any[];
  teleportInterval: number | null;
  interactable: boolean;
  interactionMessage: string | null;
  soundEffect: string | null;
  defaultEmote: string;
  emoteOnInteract: string;
  activeStartHour: number | null;
  activeEndHour: number | null;
  weatherSensitivity: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  rotation: string;
  scale: string;
  scaleMultiplier: string;
  colorTint: string | null;
  visible: boolean;
  visibleDistance: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  model?: Model;
}

interface FormData {
  characterId: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  status: string;
  modelId: string;
  animations: string;
  defaultAnimation: string;
  animationSpeed: string;
  isMovable: boolean;
  movementType: string;
  movementPattern: string;
  movementRadius: string;
  movementSpeed: string;
  patrolWaypoints: string;
  followTarget: string;
  followDistance: string;
  teleportPositions: string;
  teleportInterval: string;
  interactable: boolean;
  interactionMessage: string;
  soundEffect: string;
  defaultEmote: string;
  emoteOnInteract: string;
  activeStartHour: string;
  activeEndHour: string;
  weatherSensitivity: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  rotation: string;
  scale: string;
  scaleMultiplier: string;
  colorTint: string;
  visible: boolean;
  visibleDistance: string;
  metadata: string;
}

// ✅ Options
const CHARACTER_TYPE_OPTIONS = [
  { value: 'animal', label: 'Animal' },
  { value: 'bird', label: 'Bird' },
  { value: 'insect', label: 'Insect' },
  { value: 'mythical', label: 'Mythical' },
  { value: 'human', label: 'Human' },
  { value: 'robot', label: 'Robot' },
  { value: 'decoration', label: 'Decoration' },
];

const CHARACTER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
  { value: 'sleeping', label: 'Sleeping' },
  { value: 'moving', label: 'Moving' },
  { value: 'hidden', label: 'Hidden' },
];

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'stationary', label: 'Stationary' },
  { value: 'wander', label: 'Wander' },
  { value: 'patrol', label: 'Patrol' },
  { value: 'circle', label: 'Circle' },
  { value: 'follow', label: 'Follow' },
  { value: 'teleport', label: 'Teleport' },
];

const ANIMATION_OPTIONS = [
  { value: 'idle', label: 'Idle' },
  { value: 'walk', label: 'Walk' },
  { value: 'run', label: 'Run' },
  { value: 'fly', label: 'Fly' },
  { value: 'dance', label: 'Dance' },
  { value: 'sway', label: 'Sway' },
  { value: 'float', label: 'Float' },
  { value: 'spin', label: 'Spin' },
  { value: 'bounce', label: 'Bounce' },
];

const EMOTE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'happy', label: 'Happy' },
  { value: 'sad', label: 'Sad' },
  { value: 'surprised', label: 'Surprised' },
  { value: 'angry', label: 'Angry' },
  { value: 'wave', label: 'Wave' },
  { value: 'dance', label: 'Dance' },
  { value: 'sleep', label: 'Sleep' },
];

const WEATHER_SENSITIVITY_OPTIONS = [
  { value: 'all', label: 'All Weather' },
  { value: 'sunny_only', label: 'Sunny Only' },
  { value: 'rainy_only', label: 'Rainy Only' },
  { value: 'no_rain', label: 'No Rain' },
  { value: 'no_snow', label: 'No Snow' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-700 dark:text-green-400';
    case 'idle': return 'text-blue-700 dark:text-blue-400';
    case 'sleeping': return 'text-purple-700 dark:text-purple-400';
    case 'moving': return 'text-orange-700 dark:text-orange-400';
    case 'hidden': return 'text-gray-700 dark:text-gray-400';
    default: return 'text-gray-700 dark:text-gray-400';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'animal': return 'border-amber-500/50 text-amber-700 dark:text-amber-400';
    case 'bird': return 'border-sky-500/50 text-sky-700 dark:text-sky-400';
    case 'insect': return 'border-lime-500/50 text-lime-700 dark:text-lime-400';
    case 'mythical': return 'border-purple-500/50 text-purple-700 dark:text-purple-400';
    case 'human': return 'border-pink-500/50 text-pink-700 dark:text-pink-400';
    case 'robot': return 'border-slate-500/50 text-slate-700 dark:text-slate-400';
    case 'decoration': return 'border-gray-500/50 text-gray-700 dark:text-gray-400';
    default: return 'border-gray-500/50 text-gray-700 dark:text-gray-400';
  }
};

function hasVerifiedExternalAnimations(model?: Model): boolean {
  if (!model) return false;

  const name = model.modelName.toLowerCase();
  const path = (model.filePath ?? '').toLowerCase();

  return name.includes('farmer_female') ||
    name.includes('farmer female') ||
    path.includes('sk_chr_farmer_female_01.fbx');
}

function CharacterRuntimeReadiness({ model, isMovable }: { model?: Model; isMovable: boolean }) {
  const usesVerifiedLibrary = hasVerifiedExternalAnimations(model);
  const mappedActions = Object.keys(model?.metadata?.animationMap ?? {});
  const rendererName = isMovable ? 'EcctrlCharacter' : 'GardenCharacter';

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Gamepad2 className="h-3.5 w-3.5 text-purple-500" />
          Runtime readiness
        </div>
        <Badge variant="outline" className="text-[10px]">{rendererName}</Badge>
      </div>

      {!model ? (
        <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Select a model before expecting the character to render in the ThreeD scene.
        </div>
      ) : usesVerifiedLibrary ? (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-start gap-1.5 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Verified external FBX profile: idle, walk, run, and farming task sources are configured.
          </div>
          <p className="text-muted-foreground">
            When those assets load successfully, targeted Water can use the one-shot watering clip. World mutation still occurs only after animation completion.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            This model does not match the verified Farmer Female external animation library.
          </div>
          <p className="text-muted-foreground">
            Runtime animation depends on embedded clips and the model&apos;s semantic mapping
            {mappedActions.length > 0 ? ` (${mappedActions.length} mapped action${mappedActions.length === 1 ? '' : 's'})` : ''}.
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {isMovable
          ? 'Movable routes to EcctrlCharacter for Take Control and WASD.'
          : 'Not movable routes to GardenCharacter and its configured autonomous movement.'}
      </p>
    </div>
  );
}

export function ThreeDCharactersCRUD({ onModuleUpdate, scrollRecords = false }: { onModuleUpdate?: () => void; scrollRecords?: boolean }) {
  const { showToast, ToastComponent } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [animationCharacter, setAnimationCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const fetchCharacters = () => setRevision(value => value + 1);
  function resetList() { setPage(0); setSelected(new Set()); setLoading(true); }


  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    characterId: '',
    name: '',
    description: '',
    type: 'animal',
    isActive: true,
    status: 'active',
    modelId: '',
    animations: '[]',
    defaultAnimation: '',
    animationSpeed: '1.0',
    isMovable: false,
    movementType: 'stationary',
    movementPattern: '',
    movementRadius: '',
    movementSpeed: '0.5',
    patrolWaypoints: '[]',
    followTarget: '',
    followDistance: '2.0',
    teleportPositions: '[]',
    teleportInterval: '',
    interactable: true,
    interactionMessage: '',
    soundEffect: '',
    defaultEmote: 'none',
    emoteOnInteract: 'happy',
    activeStartHour: '',
    activeEndHour: '',
    weatherSensitivity: 'all',
    positionX: '0',
    positionY: '0',
    positionZ: '0',
    rotation: '0',
    scale: '1',
    scaleMultiplier: '1',
    colorTint: '',
    visible: true,
    visibleDistance: '30.0',
    metadata: '{}',
  });

  // ✅ Fetch data
  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(''); setSelected(new Set());
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search: searchQuery, sort: sort.key, direction: sort.direction });
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/threed/characters?${params}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch Characters');
        if (controller.signal.aborted) return;
        setCharacters(data.data); setTotal(Number(data.pagination.total));
        if (page > 0 && page * pageSize >= data.pagination.total) setPage(Math.max(0, Math.ceil(data.pagination.total / pageSize) - 1));
      } catch (error) {
        if (!controller.signal.aborted) { setLoadError(error instanceof Error ? error.message : 'Failed to fetch Characters'); setCharacters([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, searchQuery, sort, revision]);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/threed/models?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setModels(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    }
  };

  const filteredCharacters = characters;

  // Pre-queried model files for the currently selected model (threed_model_files).
  const selectedModel = models.find((m) => String(m.id) === formData.modelId);

  const handleCreate = async () => {
    if (!formData.characterId) {
      showToast('Character ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Character name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        animations: JSON.parse(formData.animations),
        patrolWaypoints: JSON.parse(formData.patrolWaypoints),
        teleportPositions: JSON.parse(formData.teleportPositions),
        metadata: JSON.parse(formData.metadata),
        modelId: formData.modelId ? parseInt(formData.modelId) : null,
        activeStartHour: formData.activeStartHour ? parseInt(formData.activeStartHour) : null,
        activeEndHour: formData.activeEndHour ? parseInt(formData.activeEndHour) : null,
        teleportInterval: formData.teleportInterval ? parseInt(formData.teleportInterval) : null,
        positionX: formData.positionX || '0',
        positionY: formData.positionY || '0',
        positionZ: formData.positionZ || '0',
        rotation: formData.rotation || '0',
        scale: formData.scale || '1',
        scaleMultiplier: formData.scaleMultiplier || '1',
        visibleDistance: formData.visibleDistance || '30.0',
        animationSpeed: formData.animationSpeed || '1.0',
        movementSpeed: formData.movementSpeed || '0.5',
        followDistance: formData.followDistance || '2.0',
      };

      const response = await fetch('/api/threed/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Character created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchCharacters();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create character', 'error');
      }
    } catch (error) {
      console.error('Error creating character:', error);
      showToast('Failed to create character', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCharacter) return;
    if (!formData.characterId) {
      showToast('Character ID is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('Character name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        animations: JSON.parse(formData.animations),
        patrolWaypoints: JSON.parse(formData.patrolWaypoints),
        teleportPositions: JSON.parse(formData.teleportPositions),
        metadata: JSON.parse(formData.metadata),
        modelId: formData.modelId ? parseInt(formData.modelId) : null,
        activeStartHour: formData.activeStartHour ? parseInt(formData.activeStartHour) : null,
        activeEndHour: formData.activeEndHour ? parseInt(formData.activeEndHour) : null,
        teleportInterval: formData.teleportInterval ? parseInt(formData.teleportInterval) : null,
        positionX: formData.positionX || '0',
        positionY: formData.positionY || '0',
        positionZ: formData.positionZ || '0',
        rotation: formData.rotation || '0',
        scale: formData.scale || '1',
        scaleMultiplier: formData.scaleMultiplier || '1',
        visibleDistance: formData.visibleDistance || '30.0',
        animationSpeed: formData.animationSpeed || '1.0',
        movementSpeed: formData.movementSpeed || '0.5',
        followDistance: formData.followDistance || '2.0',
      };

      const response = await fetch(`/api/threed/characters?id=${editingCharacter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Character updated successfully', 'success');
        setEditingCharacter(null);
        await fetchCharacters();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update character', 'error');
      }
    } catch (error) {
      console.error('Error updating character:', error);
      showToast('Failed to update character', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (bulkBusy || isSubmitting) return;
    if (!confirm(`Delete character "${name}"? This action cannot be undone.`)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threed/characters?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Character deleted successfully', 'success');
        await fetchCharacters();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete character', 'error');
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      showToast('Failed to delete character', 'error');
    } finally { setIsSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({
      characterId: '',
      name: '',
      description: '',
      type: 'animal',
      isActive: true,
      status: 'active',
      modelId: '',
      animations: '[]',
      defaultAnimation: '',
      animationSpeed: '1.0',
      isMovable: false,
      movementType: 'stationary',
      movementPattern: '',
      movementRadius: '',
      movementSpeed: '0.5',
      patrolWaypoints: '[]',
      followTarget: '',
      followDistance: '2.0',
      teleportPositions: '[]',
      teleportInterval: '',
      interactable: true,
      interactionMessage: '',
      soundEffect: '',
      defaultEmote: 'none',
      emoteOnInteract: 'happy',
      activeStartHour: '',
      activeEndHour: '',
      weatherSensitivity: 'all',
      positionX: '0',
      positionY: '0',
      positionZ: '0',
      rotation: '0',
      scale: '1',
      scaleMultiplier: '1',
      colorTint: '',
      visible: true,
      visibleDistance: '30.0',
      metadata: '{}',
    });
  };

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      characterId: character.characterId || '',
      name: character.name,
      description: character.description || '',
      type: character.type || 'animal',
      isActive: character.isActive ?? true,
      status: character.status || 'active',
      modelId: character.modelId ? String(character.modelId) : '',
      animations: JSON.stringify(character.animations || []),
      defaultAnimation: character.defaultAnimation || '',
      animationSpeed: character.animationSpeed || '1.0',
      isMovable: character.isMovable ?? false,
      movementType: character.movementType || 'stationary',
      movementPattern: character.movementPattern || '',
      movementRadius: character.movementRadius || '',
      movementSpeed: character.movementSpeed || '0.5',
      patrolWaypoints: JSON.stringify(character.patrolWaypoints || []),
      followTarget: character.followTarget || '',
      followDistance: character.followDistance || '2.0',
      teleportPositions: JSON.stringify(character.teleportPositions || []),
      teleportInterval: character.teleportInterval ? String(character.teleportInterval) : '',
      interactable: character.interactable ?? true,
      interactionMessage: character.interactionMessage || '',
      soundEffect: character.soundEffect || '',
      defaultEmote: character.defaultEmote || 'none',
      emoteOnInteract: character.emoteOnInteract || 'happy',
      activeStartHour: character.activeStartHour ? String(character.activeStartHour) : '',
      activeEndHour: character.activeEndHour ? String(character.activeEndHour) : '',
      weatherSensitivity: character.weatherSensitivity || 'all',
      positionX: character.positionX || '0',
      positionY: character.positionY || '0',
      positionZ: character.positionZ || '0',
      rotation: character.rotation || '0',
      scale: character.scale || '1',
      scaleMultiplier: character.scaleMultiplier || '1',
      colorTint: character.colorTint || '',
      visible: character.visible ?? true,
      visibleDistance: character.visibleDistance || '30.0',
      metadata: JSON.stringify(character.metadata || {}),
    });
  };

  async function deleteSelected() {
    const targets = characters.filter(character => selected.has(character.id));
    if (bulkBusy || loading || isSubmitting || !targets.length || !confirm(`Delete ${targets.length} selected Characters? This action cannot be undone.`)) return;
    setBulkBusy(true); setBulkNotice('');
    let deleted = 0;
    const failures: string[] = [];
    for (const character of targets) {
      try {
        const response = await fetch(`/api/threed/characters?id=${character.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
        deleted++;
      } catch (error) { failures.push(`${character.name}: ${error instanceof Error ? error.message : 'Delete failed'}`); }
    }
    setBulkNotice(`Deleted ${deleted} of ${targets.length} Characters.${failures.length ? ` ${failures.join('; ')} Check the refreshed list before retrying.` : ''}`);
    setBulkBusy(false); setSelected(new Set()); fetchCharacters();
    if (deleted) onModuleUpdate?.();
  }
  function heading(key: string, title: string) {
    const Icon = sort.key === key ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button disabled={loading || bulkBusy} className="inline-flex items-center gap-1" onClick={() => { resetList(); setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{title}<Icon className="h-3 w-3" aria-hidden="true" /></button></TableHead>;
  }

  const renderActions = (character: Character) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" disabled={bulkBusy || isSubmitting} title="Assign Animations" aria-label={`Assign animations to ${character.name}`} onClick={() => setAnimationCharacter(character)}><Clapperboard className="h-4 w-4" /><span className="ml-1 text-xs">Animations</span></Button>
      <Button variant="ghost" size="sm" disabled={bulkBusy || isSubmitting} aria-label={`Edit ${character.name}`} onClick={() => openEditDialog(character)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {character.positionX && character.positionZ && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                ({character.positionX}, {character.positionZ})
              </span>
            </DropdownMenuItem>
          )}
          {character.isMovable && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Move className="w-3 h-3" />
                {getOptionLabel(MOVEMENT_TYPE_OPTIONS, character.movementType)}
              </span>
            </DropdownMenuItem>
          )}
          {character.model && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Model: {character.model.modelName}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(character.id, character.name)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className={scrollRecords ? 'flex h-full min-h-0 flex-col gap-2' : 'space-y-2'}>
      {ToastComponent}
      <AdminWorkspaceHeader icon={Users} title="Characters" description="Manage your 3D characters and creatures" className="shrink-0 [&>a]:text-[11px] [&>div:first-child>svg]:text-purple-500">
        <Badge variant="secondary" className="text-xs">{loading || loadError ? '—' : total}</Badge>
        <Input aria-label="Search Characters" placeholder="Search Characters by name, ID or description…" disabled={bulkBusy} value={searchQuery} onChange={event => { resetList(); setSearchQuery(event.target.value); }} className="h-7 min-w-48 flex-1 text-xs" />
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={bulkBusy} className="h-7 px-2 text-[11px]">
              <Plus className="w-3 h-3 mr-1" />
              Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="characterId">Character ID *</Label>
                <Input
                  id="characterId"
                  placeholder="e.g., CHAR-001"
                  value={formData.characterId}
                  onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Character Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Gardener Joe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Character description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHARACTER_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHARACTER_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <div>
                  <Label htmlFor="modelId">Model</Label>
                  <Select
                    value={formData.modelId}
                    onValueChange={(value) => setFormData({ ...formData, modelId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={String(model.id)}>
                          {model.modelName} ({model.modelType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedModel && (
                  <ModelFileList
                    files={selectedModel.files ?? []}
                    emptyText="No files attached to this model (add them in Models)"
                  />
                )}
                <CharacterRuntimeReadiness model={selectedModel} isMovable={formData.isMovable} />
              </div>

              {/* Animation */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Animation</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="animations" className="text-xs">Animations (JSON array)</Label>
                    <Input
                      id="animations"
                      placeholder='["idle", "walk"]'
                      value={formData.animations}
                      onChange={(e) => setFormData({ ...formData, animations: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="defaultAnimation" className="text-xs">Default Animation</Label>
                      <Select
                        value={formData.defaultAnimation}
                        onValueChange={(value) => setFormData({ ...formData, defaultAnimation: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select animation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {ANIMATION_OPTIONS.map((anim) => (
                            <SelectItem key={anim.value} value={anim.value}>
                              {anim.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="animationSpeed" className="text-xs">Animation Speed</Label>
                      <Input
                        id="animationSpeed"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.animationSpeed}
                        onChange={(e) => setFormData({ ...formData, animationSpeed: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Movement */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Movement</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isMovable"
                      checked={formData.isMovable}
                      onCheckedChange={(checked) => setFormData({ ...formData, isMovable: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isMovable">Movable</Label>
                  </div>
                  <div>
                    <Label htmlFor="movementType" className="text-xs">Movement Type</Label>
                    <Select
                      value={formData.movementType}
                      onValueChange={(value) => setFormData({ ...formData, movementType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select movement" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOVEMENT_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="movementSpeed" className="text-xs">Movement Speed</Label>
                      <Input
                        id="movementSpeed"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.movementSpeed}
                        onChange={(e) => setFormData({ ...formData, movementSpeed: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="movementRadius" className="text-xs">Movement Radius</Label>
                      <Input
                        id="movementRadius"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g., 5"
                        value={formData.movementRadius}
                        onChange={(e) => setFormData({ ...formData, movementRadius: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="patrolWaypoints" className="text-xs">Patrol Waypoints (JSON)</Label>
                    <Input
                      id="patrolWaypoints"
                      placeholder='[{"x":0,"y":0,"z":0}]'
                      value={formData.patrolWaypoints}
                      onChange={(e) => setFormData({ ...formData, patrolWaypoints: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Interaction */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Interaction</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="interactable"
                      checked={formData.interactable}
                      onCheckedChange={(checked) => setFormData({ ...formData, interactable: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="interactable">Interactable</Label>
                  </div>
                  <div>
                    <Label htmlFor="interactionMessage" className="text-xs">Interaction Message</Label>
                    <Input
                      id="interactionMessage"
                      placeholder="Message when interacted with"
                      value={formData.interactionMessage}
                      onChange={(e) => setFormData({ ...formData, interactionMessage: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="defaultEmote" className="text-xs">Default Emote</Label>
                      <Select
                        value={formData.defaultEmote}
                        onValueChange={(value) => setFormData({ ...formData, defaultEmote: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select emote" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMOTE_OPTIONS.map((emote) => (
                            <SelectItem key={emote.value} value={emote.value}>
                              {emote.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="emoteOnInteract" className="text-xs">Emote on Interact</Label>
                      <Select
                        value={formData.emoteOnInteract}
                        onValueChange={(value) => setFormData({ ...formData, emoteOnInteract: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select emote" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMOTE_OPTIONS.map((emote) => (
                            <SelectItem key={emote.value} value={emote.value}>
                              {emote.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="soundEffect" className="text-xs">Sound Effect</Label>
                    <Input
                      id="soundEffect"
                      placeholder="Sound effect filename"
                      value={formData.soundEffect}
                      onChange={(e) => setFormData({ ...formData, soundEffect: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* 3D Position */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">3D Position</Label>
                <p className="text-xs text-muted-foreground mb-2">Position in 3D space</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="positionX" className="text-xs">X</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionY" className="text-xs">Y</Label>
                    <Input
                      id="positionY"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionZ" className="text-xs">Z</Label>
                    <Input
                      id="positionZ"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="rotation" className="text-xs">Rotation</Label>
                    <Input
                      id="rotation"
                      type="number"
                      step="1"
                      placeholder="0"
                      value={formData.rotation}
                      onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scale" className="text-xs">Scale</Label>
                    <Input
                      id="scale"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="1"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Appearance</Label>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="colorTint" className="text-xs">Color Tint</Label>
                      <Input
                        id="colorTint"
                        placeholder="#ffffff"
                        value={formData.colorTint}
                        onChange={(e) => setFormData({ ...formData, colorTint: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scaleMultiplier" className="text-xs">Scale Multiplier</Label>
                      <Input
                        id="scaleMultiplier"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.scaleMultiplier}
                        onChange={(e) => setFormData({ ...formData, scaleMultiplier: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="visible"
                      checked={formData.visible}
                      onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="visible">Visible</Label>
                  </div>
                  <div>
                    <Label htmlFor="visibleDistance" className="text-xs">Visible Distance</Label>
                    <Input
                      id="visibleDistance"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.visibleDistance}
                      onChange={(e) => setFormData({ ...formData, visibleDistance: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule & Weather */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Schedule & Weather</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="activeStartHour" className="text-xs">Active Start Hour (0-23)</Label>
                    <Input
                      id="activeStartHour"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="6"
                      value={formData.activeStartHour}
                      onChange={(e) => setFormData({ ...formData, activeStartHour: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="activeEndHour" className="text-xs">Active End Hour (0-23)</Label>
                    <Input
                      id="activeEndHour"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="20"
                      value={formData.activeEndHour}
                      onChange={(e) => setFormData({ ...formData, activeEndHour: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label htmlFor="weatherSensitivity" className="text-xs">Weather Sensitivity</Label>
                  <Select
                    value={formData.weatherSensitivity}
                    onValueChange={(value) => setFormData({ ...formData, weatherSensitivity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sensitivity" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEATHER_SENSITIVITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="metadata">Metadata (JSON)</Label>
                <Input
                  id="metadata"
                  placeholder='{"key": "value"}'
                  value={formData.metadata}
                  onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Active Status */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Character'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <AdminWorkspaceLink href="/admin/threed/models" icon={Box}>Models</AdminWorkspaceLink>
        <AdminWorkspaceLink href="/admin/threed/animations" icon={Clapperboard}>Animations</AdminWorkspaceLink>
      </AdminWorkspaceHeader>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? 'Loading…' : loadError ? 'Characters unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Characters`}</span><span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={loading || bulkBusy || isSubmitting || !!loadError || !selected.size} onClick={() => void deleteSelected()}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={bulkBusy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Characters per page" className="rounded border bg-background p-1 text-[11px]" value={pageSize} disabled={loading || bulkBusy} onChange={event => { resetList(); setPageSize(Number(event.target.value)); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          {(['First', 'Previous', 'Page', 'Next', 'Last'] as const).map(label => label === 'Page' ? <span key={label}>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span> : <Button key={label} size="sm" variant="outline" className="h-7 text-[11px]" disabled={loading || bulkBusy || !!loadError || (label === 'First' || label === 'Previous' ? page === 0 : (page + 1) * pageSize >= total)} onClick={() => { setSelected(new Set()); setLoading(true); setPage(label === 'First' ? 0 : label === 'Previous' ? page - 1 : label === 'Next' ? page + 1 : Math.max(0, Math.ceil(total / pageSize) - 1)); }}>{label}</Button>)}
        </div>
      </div>
      {bulkNotice && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{bulkNotice}</p>}

      <div className={scrollRecords ? 'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible' : 'overflow-auto rounded-lg border'} role="region" aria-label="Character records" tabIndex={0}>
          <Table className="min-w-[850px]">
            <TableHeader className={scrollRecords ? 'sticky top-0 z-10 bg-background' : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"><input type="checkbox" aria-label="Select Characters on this page" disabled={loading || bulkBusy || !!loadError || !characters.length} checked={characters.length > 0 && characters.every(character => selected.has(character.id))} ref={input => { if (input) input.indeterminate = characters.some(character => selected.has(character.id)) && !characters.every(character => selected.has(character.id)); }} onChange={event => setSelected(event.target.checked ? new Set(characters.map(character => character.id)) : new Set())} /></TableHead>
                {heading('name', 'Name')}
                {heading('characterId', 'ID')}
                {heading('type', 'Type')}
                {heading('position', 'Position')}
                {heading('status', 'Status')}
                {heading('active', 'Active')}
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="py-4 text-sm"><span role="status">Loading Characters…</span></TableCell></TableRow> : loadError ? <TableRow><TableCell colSpan={8} className="py-4 text-sm"><span role="alert" className="text-destructive">{loadError}</span><Button size="sm" variant="outline" className="ml-2 h-7 text-[11px]" onClick={() => void fetchCharacters()}>Retry</Button></TableCell></TableRow> : filteredCharacters.length === 0 ? <TableRow><TableCell colSpan={8} className="py-4 text-sm">No Characters found.</TableCell></TableRow> : filteredCharacters.map((character) => (
                <TableRow key={character.id} className="hover:bg-muted/50">
                  <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${character.name}`} checked={selected.has(character.id)} disabled={bulkBusy || loading} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(character.id); else next.delete(character.id); return next; })} /></TableCell>
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      {character.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {character.characterId || '—'}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    <Badge variant="outline" className={`bg-transparent text-[10px] ${getTypeColor(character.type)}`}>
                      {getOptionLabel(CHARACTER_TYPE_OPTIONS, character.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                    {character.positionX && character.positionZ ? (
                      `(${character.positionX}, ${character.positionZ})`
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    <span className={`text-[10px] ${getStatusColor(character.status)}`}>
                      {getOptionLabel(CHARACTER_STATUS_OPTIONS, character.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {character.isActive ? <Check aria-label="Active" className="mx-auto h-4 w-4 text-green-500" /> : <X aria-label="Inactive" className="mx-auto h-4 w-4 text-gray-500" />}
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(character)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      <Dialog open={!!animationCharacter} onOpenChange={open => !open && setAnimationCharacter(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Animations — {animationCharacter?.name}</DialogTitle></DialogHeader>
          {animationCharacter && <CharacterAnimationAssignments key={animationCharacter.id} characterId={animationCharacter.id} />}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCharacter} onOpenChange={(open) => !open && setEditingCharacter(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-characterId">Character ID *</Label>
              <Input
                id="edit-characterId"
                value={formData.characterId}
                onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">Character Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARACTER_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARACTER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <div>
                <Label htmlFor="edit-modelId">Model</Label>
                <Select
                  value={formData.modelId}
                  onValueChange={(value) => setFormData({ ...formData, modelId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={String(model.id)}>
                        {model.modelName} ({model.modelType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedModel && (
                <ModelFileList
                  files={selectedModel.files ?? []}
                  emptyText="No files attached to this model (add them in Models)"
                />
              )}
              <CharacterRuntimeReadiness model={selectedModel} isMovable={formData.isMovable} />
            </div>

            {/* Animation */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Animation</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-animations" className="text-xs">Animations (JSON array)</Label>
                  <Input
                    id="edit-animations"
                    value={formData.animations}
                    onChange={(e) => setFormData({ ...formData, animations: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-defaultAnimation" className="text-xs">Default Animation</Label>
                    <Select
                      value={formData.defaultAnimation}
                      onValueChange={(value) => setFormData({ ...formData, defaultAnimation: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select animation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {ANIMATION_OPTIONS.map((anim) => (
                          <SelectItem key={anim.value} value={anim.value}>
                            {anim.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-animationSpeed" className="text-xs">Animation Speed</Label>
                    <Input
                      id="edit-animationSpeed"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.animationSpeed}
                      onChange={(e) => setFormData({ ...formData, animationSpeed: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Movement */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Movement</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-isMovable"
                    checked={formData.isMovable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isMovable: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-isMovable">Movable</Label>
                </div>
                <div>
                  <Label htmlFor="edit-movementType" className="text-xs">Movement Type</Label>
                  <Select
                    value={formData.movementType}
                    onValueChange={(value) => setFormData({ ...formData, movementType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOVEMENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-movementSpeed" className="text-xs">Movement Speed</Label>
                    <Input
                      id="edit-movementSpeed"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.movementSpeed}
                      onChange={(e) => setFormData({ ...formData, movementSpeed: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-movementRadius" className="text-xs">Movement Radius</Label>
                    <Input
                      id="edit-movementRadius"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.movementRadius}
                      onChange={(e) => setFormData({ ...formData, movementRadius: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-patrolWaypoints" className="text-xs">Patrol Waypoints (JSON)</Label>
                  <Input
                    id="edit-patrolWaypoints"
                    value={formData.patrolWaypoints}
                    onChange={(e) => setFormData({ ...formData, patrolWaypoints: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Interaction */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Interaction</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-interactable"
                    checked={formData.interactable}
                    onCheckedChange={(checked) => setFormData({ ...formData, interactable: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-interactable">Interactable</Label>
                </div>
                <div>
                  <Label htmlFor="edit-interactionMessage" className="text-xs">Interaction Message</Label>
                  <Input
                    id="edit-interactionMessage"
                    value={formData.interactionMessage}
                    onChange={(e) => setFormData({ ...formData, interactionMessage: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-defaultEmote" className="text-xs">Default Emote</Label>
                    <Select
                      value={formData.defaultEmote}
                      onValueChange={(value) => setFormData({ ...formData, defaultEmote: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select emote" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOTE_OPTIONS.map((emote) => (
                          <SelectItem key={emote.value} value={emote.value}>
                            {emote.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-emoteOnInteract" className="text-xs">Emote on Interact</Label>
                    <Select
                      value={formData.emoteOnInteract}
                      onValueChange={(value) => setFormData({ ...formData, emoteOnInteract: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select emote" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOTE_OPTIONS.map((emote) => (
                          <SelectItem key={emote.value} value={emote.value}>
                            {emote.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-soundEffect" className="text-xs">Sound Effect</Label>
                  <Input
                    id="edit-soundEffect"
                    value={formData.soundEffect}
                    onChange={(e) => setFormData({ ...formData, soundEffect: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* 3D Position */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">3D Position</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-positionX" className="text-xs">X</Label>
                  <Input
                    id="edit-positionX"
                    type="number"
                    step="0.01"
                    value={formData.positionX}
                    onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionY" className="text-xs">Y</Label>
                  <Input
                    id="edit-positionY"
                    type="number"
                    step="0.01"
                    value={formData.positionY}
                    onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positionZ" className="text-xs">Z</Label>
                  <Input
                    id="edit-positionZ"
                    type="number"
                    step="0.01"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-rotation" className="text-xs">Rotation</Label>
                  <Input
                    id="edit-rotation"
                    type="number"
                    step="1"
                    value={formData.rotation}
                    onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-scale" className="text-xs">Scale</Label>
                  <Input
                    id="edit-scale"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Appearance</Label>
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-colorTint" className="text-xs">Color Tint</Label>
                    <Input
                      id="edit-colorTint"
                      value={formData.colorTint}
                      onChange={(e) => setFormData({ ...formData, colorTint: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-scaleMultiplier" className="text-xs">Scale Multiplier</Label>
                    <Input
                      id="edit-scaleMultiplier"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.scaleMultiplier}
                      onChange={(e) => setFormData({ ...formData, scaleMultiplier: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-visible"
                    checked={formData.visible}
                    onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="edit-visible">Visible</Label>
                </div>
                <div>
                  <Label htmlFor="edit-visibleDistance" className="text-xs">Visible Distance</Label>
                  <Input
                    id="edit-visibleDistance"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.visibleDistance}
                    onChange={(e) => setFormData({ ...formData, visibleDistance: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Schedule & Weather */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Schedule & Weather</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-activeStartHour" className="text-xs">Active Start Hour</Label>
                  <Input
                    id="edit-activeStartHour"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.activeStartHour}
                    onChange={(e) => setFormData({ ...formData, activeStartHour: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-activeEndHour" className="text-xs">Active End Hour</Label>
                  <Input
                    id="edit-activeEndHour"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.activeEndHour}
                    onChange={(e) => setFormData({ ...formData, activeEndHour: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="edit-weatherSensitivity" className="text-xs">Weather Sensitivity</Label>
                <Select
                  value={formData.weatherSensitivity}
                  onValueChange={(value) => setFormData({ ...formData, weatherSensitivity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_SENSITIVITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-metadata">Metadata (JSON)</Label>
              <Input
                id="edit-metadata"
                value={formData.metadata}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Active Status */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>

            <Button onClick={handleUpdate} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
