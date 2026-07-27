// components/admin/threed/characters/ThreeDCharactersCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  User,
  MoreHorizontal,
  Search,
  Filter,
  X,
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

// ✅ Import types from lib
import {
  ThreeDCharacter,
  ThreeDCharacterFormData,
  CharacterType,
  CharacterStatus,
  CharacterAnimation,
  CharacterMovementType,
  CharacterEmote,
  CharacterWeatherSensitivity,
  ThreeDModel,
  CHARACTER_TYPE_OPTIONS,
  CHARACTER_STATUS_OPTIONS,
  CHARACTER_ANIMATION_OPTIONS,
  CHARACTER_MOVEMENT_TYPE_OPTIONS,
  CHARACTER_EMOTE_OPTIONS,
  CHARACTER_WEATHER_SENSITIVITY_OPTIONS,
} from '@/lib/types/threed';

interface ThreeDCharactersCRUDProps {
  threedId?: number;
  onModuleUpdate?: () => void;
}

// ✅ Helper to get label from value
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

export function ThreeDCharactersCRUD({ threedId, onModuleUpdate }: ThreeDCharactersCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [characters, setCharacters] = useState<ThreeDCharacter[]>([]);
  const [models, setModels] = useState<ThreeDModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<ThreeDCharacter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // ✅ Form state with selected models
  const [formData, setFormData] = useState<ThreeDCharacterFormData & { selectedModels: ThreeDModel[] }>({
    name: '',
    description: '',
    type: CharacterType.HUMAN,
    status: CharacterStatus.ACTIVE,

    // ✅ Model selection
    modelIds: '',
    selectedModels: [],

    // Animation
    animations: '',
    defaultAnimation: '',
    animationSpeed: '1',

    // Movement
    isMovable: false,
    movementType: '',
    movementPattern: '',
    movementRadius: '',
    movementSpeed: '',
    patrolWaypoints: '',
    followTarget: '',
    followDistance: '',
    teleportPositions: '',
    teleportInterval: '',

    // Interaction
    interactable: false,
    interactionMessage: '',
    soundEffect: '',
    defaultEmote: '',
    emoteOnInteract: '',

    // Time-based
    activeStartHour: '',
    activeEndHour: '',

    // Weather
    weatherSensitivity: '',

    // Positioning
    bedId: '',
    positionX: '0',
    positionY: '0',
    positionZ: '0',
    rotation: '0',
    scale: '1',
    scaleMultiplier: '1',
    colorTint: '',

    // Visibility
    visible: true,
    visibleDistance: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCharacters();
    fetchModels();
  }, [threedId]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (threedId) params.append('moduleId', String(threedId));

      const response = await fetch(`/api/threed/characters?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCharacters(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch characters', 'error');
        setCharacters([]);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
      showToast('Failed to fetch characters', 'error');
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/threed/models?isActive=true');
      const data = await response.json();
      if (data.success) {
        setModels(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    }
  };

  const filteredCharacters = characters.filter((character) =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (character.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // ✅ Toggle model selection
  const toggleModelSelection = (model: ThreeDModel) => {
    setFormData((prev) => {
      const isSelected = prev.selectedModels.some((m) => m.id === model.id);

      let newSelected: ThreeDModel[];
      if (isSelected) {
        newSelected = prev.selectedModels.filter((m) => m.id !== model.id);
      } else {
        newSelected = [...prev.selectedModels, model];
      }

      const modelIdsString = newSelected.map((m) => m.id).join(',');

      return {
        ...prev,
        selectedModels: newSelected,
        modelIds: modelIdsString,
      };
    });
  };

  // ✅ Get model objects from modelAssociations for edit dialog
  const getSelectedModelsFromAssociations = (associations: any[]): ThreeDModel[] => {
    if (!associations || associations.length === 0) return [];
    return associations
      .map((assoc) => {
        if (assoc.model) {
          return assoc.model;
        }
        const model = models.find((m) => m.id === assoc.modelId);
        return model;
      })
      .filter(Boolean) as ThreeDModel[];
  };

  const handleCreate = async () => {
    if (!formData.name) {
      showToast('Character name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description || null,
        type: formData.type,
        status: formData.status,

        modelIds: formData.modelIds || '',

        animations: formData.animations || '',
        defaultAnimation: formData.defaultAnimation || null,
        animationSpeed: formData.animationSpeed ? parseFloat(formData.animationSpeed) : 1,

        isMovable: formData.isMovable,
        movementType: formData.movementType || null,
        movementPattern: formData.movementPattern || null,
        movementRadius: formData.movementRadius ? parseFloat(formData.movementRadius) : null,
        movementSpeed: formData.movementSpeed ? parseFloat(formData.movementSpeed) : 0.5,
        patrolWaypoints: formData.patrolWaypoints ? formData.patrolWaypoints.split(',').map(s => s.trim()) : [],
        followTarget: formData.followTarget || null,
        followDistance: formData.followDistance ? parseFloat(formData.followDistance) : 2,
        teleportPositions: formData.teleportPositions ? formData.teleportPositions.split(',').map(s => s.trim()) : [],
        teleportInterval: formData.teleportInterval ? parseInt(formData.teleportInterval) : null,

        interactable: formData.interactable,
        interactionMessage: formData.interactionMessage || null,
        soundEffect: formData.soundEffect || null,

        defaultEmote: formData.defaultEmote || null,
        emoteOnInteract: formData.emoteOnInteract || null,

        activeStartHour: formData.activeStartHour ? parseInt(formData.activeStartHour) : null,
        activeEndHour: formData.activeEndHour ? parseInt(formData.activeEndHour) : null,

        weatherSensitivity: formData.weatherSensitivity || null,

        bedId: formData.bedId ? parseInt(formData.bedId) : null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        rotation: formData.rotation ? parseFloat(formData.rotation) : 0,
        scale: formData.scale ? parseFloat(formData.scale) : 1,
        scaleMultiplier: formData.scaleMultiplier ? parseFloat(formData.scaleMultiplier) : 1,
        colorTint: formData.colorTint || null,

        visible: formData.visible,
        visibleDistance: formData.visibleDistance ? parseFloat(formData.visibleDistance) : 30,

        isActive: formData.isActive,
      };

      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

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
    if (!formData.name) {
      showToast('Character name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description || null,
        type: formData.type,
        status: formData.status,

        modelIds: formData.modelIds || '',

        animations: formData.animations || '',
        defaultAnimation: formData.defaultAnimation || null,
        animationSpeed: formData.animationSpeed ? parseFloat(formData.animationSpeed) : 1,

        isMovable: formData.isMovable,
        movementType: formData.movementType || null,
        movementPattern: formData.movementPattern || null,
        movementRadius: formData.movementRadius ? parseFloat(formData.movementRadius) : null,
        movementSpeed: formData.movementSpeed ? parseFloat(formData.movementSpeed) : 0.5,
        patrolWaypoints: formData.patrolWaypoints ? formData.patrolWaypoints.split(',').map(s => s.trim()) : [],
        followTarget: formData.followTarget || null,
        followDistance: formData.followDistance ? parseFloat(formData.followDistance) : 2,
        teleportPositions: formData.teleportPositions ? formData.teleportPositions.split(',').map(s => s.trim()) : [],
        teleportInterval: formData.teleportInterval ? parseInt(formData.teleportInterval) : null,

        interactable: formData.interactable,
        interactionMessage: formData.interactionMessage || null,
        soundEffect: formData.soundEffect || null,

        defaultEmote: formData.defaultEmote || null,
        emoteOnInteract: formData.emoteOnInteract || null,

        activeStartHour: formData.activeStartHour ? parseInt(formData.activeStartHour) : null,
        activeEndHour: formData.activeEndHour ? parseInt(formData.activeEndHour) : null,

        weatherSensitivity: formData.weatherSensitivity || null,

        bedId: formData.bedId ? parseInt(formData.bedId) : null,
        positionX: formData.positionX ? parseFloat(formData.positionX) : 0,
        positionY: formData.positionY ? parseFloat(formData.positionY) : 0,
        positionZ: formData.positionZ ? parseFloat(formData.positionZ) : 0,
        rotation: formData.rotation ? parseFloat(formData.rotation) : 0,
        scale: formData.scale ? parseFloat(formData.scale) : 1,
        scaleMultiplier: formData.scaleMultiplier ? parseFloat(formData.scaleMultiplier) : 1,
        colorTint: formData.colorTint || null,

        visible: formData.visible,
        visibleDistance: formData.visibleDistance ? parseFloat(formData.visibleDistance) : 30,

        isActive: formData.isActive,
      };

      if (threedId) {
        payload.moduleId = threedId;
        payload.moduleType = 'threed';
      }

      console.log('[Characters CRUD] Updating with payload:', payload);

      const response = await fetch(`/api/threed/characters?id=${editingCharacter.id}`, {
        method: 'PUT',
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
    if (!confirm(`Delete character "${name}"? This action cannot be undone.`)) return;

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
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: CharacterType.HUMAN,
      status: CharacterStatus.ACTIVE,
      modelIds: '',
      selectedModels: [],
      animations: '',
      defaultAnimation: '',
      animationSpeed: '1',
      isMovable: false,
      movementType: '',
      movementPattern: '',
      movementRadius: '',
      movementSpeed: '',
      patrolWaypoints: '',
      followTarget: '',
      followDistance: '',
      teleportPositions: '',
      teleportInterval: '',
      interactable: false,
      interactionMessage: '',
      soundEffect: '',
      defaultEmote: '',
      emoteOnInteract: '',
      activeStartHour: '',
      activeEndHour: '',
      weatherSensitivity: '',
      bedId: '',
      positionX: '0',
      positionY: '0',
      positionZ: '0',
      rotation: '0',
      scale: '1',
      scaleMultiplier: '1',
      colorTint: '',
      visible: true,
      visibleDistance: '',
      isActive: true,
    });
  };

  const openEditDialog = (character: ThreeDCharacter) => {
    console.log('[Characters CRUD] Opening edit dialog for character:', character);

    const selectedModels = getSelectedModelsFromAssociations(character.modelAssociations || []);
    const modelIdsString = selectedModels.map((m) => String(m.id)).join(',');

    console.log('[Characters CRUD] Selected models:', selectedModels);
    console.log('[Characters CRUD] Model IDs string:', modelIdsString);

    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description || '',
      type: character.type || CharacterType.HUMAN,
      status: character.status || CharacterStatus.ACTIVE,
      modelIds: modelIdsString,
      selectedModels: selectedModels,
      animations: character.animations?.join(', ') || '',
      defaultAnimation: character.defaultAnimation || '',
      animationSpeed: character.animationSpeed ? String(character.animationSpeed) : '1',
      isMovable: character.isMovable || false,
      movementType: character.movementType || '',
      movementPattern: character.movementPattern || '',
      movementRadius: character.movementRadius ? String(character.movementRadius) : '',
      movementSpeed: character.movementSpeed ? String(character.movementSpeed) : '',
      patrolWaypoints: character.patrolWaypoints?.join(', ') || '',
      followTarget: character.followTarget || '',
      followDistance: character.followDistance ? String(character.followDistance) : '',
      teleportPositions: character.teleportPositions?.join(', ') || '',
      teleportInterval: character.teleportInterval ? String(character.teleportInterval) : '',
      interactable: character.interactable || false,
      interactionMessage: character.interactionMessage || '',
      soundEffect: character.soundEffect || '',
      defaultEmote: character.defaultEmote || '',
      emoteOnInteract: character.emoteOnInteract || '',
      activeStartHour: character.activeStartHour ? String(character.activeStartHour) : '',
      activeEndHour: character.activeEndHour ? String(character.activeEndHour) : '',
      weatherSensitivity: character.weatherSensitivity || '',
      bedId: character.bedId ? String(character.bedId) : '',
      positionX: character.positionX ? String(character.positionX) : '0',
      positionY: character.positionY ? String(character.positionY) : '0',
      positionZ: character.positionZ ? String(character.positionZ) : '0',
      rotation: character.rotation ? String(character.rotation) : '0',
      scale: character.scale ? String(character.scale) : '1',
      scaleMultiplier: character.scaleMultiplier ? String(character.scaleMultiplier) : '1',
      colorTint: character.colorTint || '',
      visible: character.visible !== undefined ? character.visible : true,
      visibleDistance: character.visibleDistance ? String(character.visibleDistance) : '',
      isActive: character.isActive !== undefined ? character.isActive : true,
    });
  };

  const getTypeLabel = (type: string) => {
    return getOptionLabel(CHARACTER_TYPE_OPTIONS, type);
  };

  const renderActions = (character: ThreeDCharacter) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(character)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {character.modelAssociations && character.modelAssociations.length > 0 && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground">
                Models: {character.modelAssociations.length}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Characters</span>
          <Badge variant="secondary" className="text-xs">
            {filteredCharacters.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="name">Character Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Farmer Joe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
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

              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Character Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as CharacterType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select character type" />
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
                    onValueChange={(value) => setFormData({ ...formData, status: value as CharacterStatus })}
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

              {/* ✅ Model Selection */}
              <div>
                <Label>Associated Models</Label>
                <div className="mt-1">
                  {formData.selectedModels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {formData.selectedModels.map((model) => (
                        <Badge
                          key={model.id}
                          variant="secondary"
                          className="flex items-center gap-1 text-xs"
                        >
                          {model.modelName} ({model.modelType})
                          <button
                            type="button"
                            onClick={() => toggleModelSelection(model)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Select
                    value=""
                    onValueChange={(value) => {
                      const model = models.find((m) => String(m.id) === value);
                      if (model) {
                        toggleModelSelection(model);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model to associate..." />
                    </SelectTrigger>
                    <SelectContent>
                      {models
                        .filter((m) => !formData.selectedModels.some((sm) => sm.id === m.id))
                        .map((model) => (
                          <SelectItem key={model.id} value={String(model.id)}>
                            {model.modelName} ({model.modelType})
                          </SelectItem>
                        ))}
                      {models.length === 0 && (
                        <SelectItem value="none" disabled>
                          No models available
                        </SelectItem>
                      )}
                      {models.length > 0 && formData.selectedModels.length === models.length && (
                        <SelectItem value="all" disabled>
                          All models selected
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select models to associate with this character
                  </p>
                </div>
              </div>

              {/* Animation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="animations">Animations (comma-separated)</Label>
                  <Input
                    id="animations"
                    placeholder="idle, walk, run"
                    value={formData.animations}
                    onChange={(e) => setFormData({ ...formData, animations: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultAnimation">Default Animation</Label>
                  <Select
                    value={formData.defaultAnimation || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, defaultAnimation: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default animation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CHARACTER_ANIMATION_OPTIONS.map((anim) => (
                        <SelectItem key={anim.value} value={anim.value}>
                          {anim.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="animationSpeed">Animation Speed</Label>
                <Input
                  id="animationSpeed"
                  type="number"
                  step="0.1"
                  placeholder="1"
                  value={formData.animationSpeed}
                  onChange={(e) => setFormData({ ...formData, animationSpeed: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Movement */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="movementType">Movement Type</Label>
                  <Select
                    value={formData.movementType || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, movementType: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CHARACTER_MOVEMENT_TYPE_OPTIONS.map((movement) => (
                        <SelectItem key={movement.value} value={movement.value}>
                          {movement.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isMovable">
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="isMovable"
                        checked={formData.isMovable}
                        onCheckedChange={(checked) => setFormData({ ...formData, isMovable: checked })}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="isMovable">Movable</Label>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="movementSpeed">Movement Speed</Label>
                  <Input
                    id="movementSpeed"
                    type="number"
                    step="0.1"
                    placeholder="0.5"
                    value={formData.movementSpeed}
                    onChange={(e) => setFormData({ ...formData, movementSpeed: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="movementRadius">Movement Radius</Label>
                  <Input
                    id="movementRadius"
                    type="number"
                    step="0.1"
                    placeholder="5"
                    value={formData.movementRadius}
                    onChange={(e) => setFormData({ ...formData, movementRadius: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Emotes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultEmote">Default Emote</Label>
                  <Select
                    value={formData.defaultEmote || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, defaultEmote: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default emote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CHARACTER_EMOTE_OPTIONS.map((emote) => (
                        <SelectItem key={emote.value} value={emote.value}>
                          {emote.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emoteOnInteract">Emote on Interact</Label>
                  <Select
                    value={formData.emoteOnInteract || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, emoteOnInteract: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select emote on interact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CHARACTER_EMOTE_OPTIONS.map((emote) => (
                        <SelectItem key={emote.value} value={emote.value}>
                          {emote.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weather Sensitivity */}
              <div>
                <Label htmlFor="weatherSensitivity">Weather Sensitivity</Label>
                <Select
                  value={formData.weatherSensitivity || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, weatherSensitivity: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CHARACTER_WEATHER_SENSITIVITY_OPTIONS.map((weather) => (
                      <SelectItem key={weather.value} value={weather.value}>
                        {weather.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Positioning */}
              <div>
                <Label>3D Position</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="positionX" className="text-xs">X</Label>
                    <Input
                      id="positionX"
                      type="number"
                      step="0.5"
                      placeholder="0"
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
                      step="0.5"
                      placeholder="0"
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
                      step="0.5"
                      placeholder="0"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rotation">Rotation</Label>
                  <Input
                    id="rotation"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.rotation}
                    onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="scale">Scale</Label>
                  <Input
                    id="scale"
                    type="number"
                    step="0.1"
                    placeholder="1"
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Interaction */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interactable">
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="interactable"
                        checked={formData.interactable}
                        onCheckedChange={(checked) => setFormData({ ...formData, interactable: checked })}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="interactable">Interactable</Label>
                    </div>
                  </Label>
                </div>
                <div>
                  <Label htmlFor="visible">
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="visible"
                        checked={formData.visible}
                        onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="visible">Visible</Label>
                    </div>
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="interactionMessage">Interaction Message</Label>
                <Input
                  id="interactionMessage"
                  placeholder="Hello there!"
                  value={formData.interactionMessage}
                  onChange={(e) => setFormData({ ...formData, interactionMessage: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive">Active</Label>
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
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CHARACTER_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CHARACTER_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterStatus('all');
            setFilterType('all');
            fetchCharacters();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* ✅ Characters Table - Shows Model Associations */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No characters found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first character
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Type</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Models</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCharacters.map((character) => (
                <TableRow key={character.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    {character.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {getTypeLabel(character.type)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    {character.modelAssociations && character.modelAssociations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {character.modelAssociations.map((assoc) => (
                          <Badge key={assoc.id} variant="outline" className="text-[10px]">
                            {assoc.model?.modelName || `Model #${assoc.modelId}`}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${character.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {character.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(character)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingCharacter} onOpenChange={(open) => !open && setEditingCharacter(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
                <Label htmlFor="edit-type">Character Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CharacterType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select character type" />
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
                  onValueChange={(value) => setFormData({ ...formData, status: value as CharacterStatus })}
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

            {/* ✅ Model Selection - Edit mode */}
            <div>
              <Label>Associated Models</Label>
              <div className="mt-1">
                {formData.selectedModels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.selectedModels.map((model) => (
                      <Badge
                        key={model.id}
                        variant="secondary"
                        className="flex items-center gap-1 text-xs"
                      >
                        {model.modelName} ({model.modelType})
                        <button
                          type="button"
                          onClick={() => toggleModelSelection(model)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <Select
                  value=""
                  onValueChange={(value) => {
                    const model = models.find((m) => String(m.id) === value);
                    if (model) {
                      toggleModelSelection(model);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model to associate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {models
                      .filter((m) => !formData.selectedModels.some((sm) => sm.id === m.id))
                      .map((model) => (
                        <SelectItem key={model.id} value={String(model.id)}>
                          {model.modelName} ({model.modelType})
                        </SelectItem>
                      ))}
                    {models.length === 0 && (
                      <SelectItem value="none" disabled>
                        No models available
                      </SelectItem>
                    )}
                    {models.length > 0 && formData.selectedModels.length === models.length && (
                      <SelectItem value="all" disabled>
                        All models selected
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.selectedModels.length > 0
                    ? `${formData.selectedModels.length} model(s) associated`
                    : 'No models associated'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-animations">Animations</Label>
                <Input
                  id="edit-animations"
                  value={formData.animations}
                  onChange={(e) => setFormData({ ...formData, animations: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-defaultAnimation">Default Animation</Label>
                <Select
                  value={formData.defaultAnimation || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, defaultAnimation: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default animation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CHARACTER_ANIMATION_OPTIONS.map((anim) => (
                      <SelectItem key={anim.value} value={anim.value}>
                        {anim.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-movementType">Movement Type</Label>
                <Select
                  value={formData.movementType || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, movementType: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select movement type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CHARACTER_MOVEMENT_TYPE_OPTIONS.map((movement) => (
                      <SelectItem key={movement.value} value={movement.value}>
                        {movement.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-isMovable">
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      id="edit-isMovable"
                      checked={formData.isMovable}
                      onCheckedChange={(checked) => setFormData({ ...formData, isMovable: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-isMovable">Movable</Label>
                  </div>
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-defaultEmote">Default Emote</Label>
                <Select
                  value={formData.defaultEmote || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, defaultEmote: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default emote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CHARACTER_EMOTE_OPTIONS.map((emote) => (
                      <SelectItem key={emote.value} value={emote.value}>
                        {emote.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-weatherSensitivity">Weather Sensitivity</Label>
                <Select
                  value={formData.weatherSensitivity || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, weatherSensitivity: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CHARACTER_WEATHER_SENSITIVITY_OPTIONS.map((weather) => (
                      <SelectItem key={weather.value} value={weather.value}>
                        {weather.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>3D Position</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="edit-positionX" className="text-xs">X</Label>
                  <Input
                    id="edit-positionX"
                    type="number"
                    step="0.5"
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
                    step="0.5"
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
                    step="0.5"
                    value={formData.positionZ}
                    onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-rotation">Rotation</Label>
                <Input
                  id="edit-rotation"
                  type="number"
                  step="0.1"
                  value={formData.rotation}
                  onChange={(e) => setFormData({ ...formData, rotation: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-scale">Scale</Label>
                <Input
                  id="edit-scale"
                  type="number"
                  step="0.1"
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-interactable">
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      id="edit-interactable"
                      checked={formData.interactable}
                      onCheckedChange={(checked) => setFormData({ ...formData, interactable: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-interactable">Interactable</Label>
                  </div>
                </Label>
              </div>
              <div>
                <Label htmlFor="edit-visible">
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      id="edit-visible"
                      checked={formData.visible}
                      onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-visible">Visible</Label>
                  </div>
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-interactionMessage">Interaction Message</Label>
              <Input
                id="edit-interactionMessage"
                value={formData.interactionMessage}
                onChange={(e) => setFormData({ ...formData, interactionMessage: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-isActive">Active</Label>
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