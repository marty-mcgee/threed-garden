// src/app/dashboard/threed/characters/charactersContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  RefreshCw, Search, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Info, 
  Move, Volume2, MessageCircle, Sparkles, Clock, Cloud, EyeOff, MapPin, 
  Target, User, Camera, CircleDot, RotateCw, Loader2, Heart, Laugh, 
  Zap, Moon, Sun, CloudRain, Snowflake
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ModalConfirm } from '@/components/ui/modal-confirm';
import { DialogFooter } from '@/components/ui/dialog';
// threed components
import { ModelPreview } from '@/components/threed/ModelPreview';

interface Model {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  thumbnailUrl?: string;
  animations: string[];
}

interface Waypoint {
  x: number;
  y: number;
  z: number;
}

interface TeleportPosition {
  x: number;
  y: number;
  z: number;
  waitSeconds?: number;
}

interface Character {
  id: number;
  characterId: string;
  name: string;
  description: string;
  type: string;
  status: string;
  modelId: number | null;
  model?: Model;
  animations: string[];
  defaultAnimation: string;
  animationSpeed: number;
  movementType: string;
  movementPattern: string;
  movementRadius: number;
  movementSpeed: number;
  patrolWaypoints: Waypoint[];
  followTarget: string;
  followDistance: number;
  teleportPositions: TeleportPosition[];
  teleportInterval: number;
  interactable: boolean;
  interactionMessage: string;
  soundEffect: string;
  defaultEmote: string;
  emoteOnInteract: string;
  activeStartHour: number;
  activeEndHour: number;
  weatherSensitivity: string;
  bedId: number | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scale: number;
  scaleMultiplier: number;
  colorTint: string;
  visible: boolean;
  visibleDistance: number;
  isActive: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function CharactersContent() {
  const { showToast, ToastComponent } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [previewModelId, setPreviewModelId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  const [formData, setFormData] = useState({
    characterId: '',
    name: '',
    description: '',
    type: 'animal',
    status: 'active',
    modelId: null as number | null,
    animations: [] as string[],
    defaultAnimation: '',
    animationSpeed: 1.0,
    movementType: 'stationary',
    movementRadius: 5,
    movementSpeed: 0.5,
    patrolWaypoints: [] as Waypoint[],
    followTarget: '',
    followDistance: 2.0,
    teleportPositions: [] as TeleportPosition[],
    teleportInterval: 30,
    interactable: true,
    interactionMessage: '',
    soundEffect: '',
    defaultEmote: 'none',
    emoteOnInteract: 'happy',
    activeStartHour: 0,
    activeEndHour: 23,
    weatherSensitivity: 'all',
    bedId: null as number | null,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotation: 0,
    scale: 1.0,
    scaleMultiplier: 1.0,
    colorTint: '',
    visible: true,
    visibleDistance: 30,
    isActive: true,
    metadata: {},
  });

  // Helper for waypoint management
  const [newWaypoint, setNewWaypoint] = useState({ x: 0, y: 0, z: 0 });
  const [newTeleportPos, setNewTeleportPos] = useState({ x: 0, y: 0, z: 0, waitSeconds: 0 });

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/threed/characters?limit=500&includeModel=true');
      const data = await response.json();
      if (data.success) {
        let charactersData = data.data;
        if (charactersData.length > 0 && charactersData[0].character) {
          charactersData = charactersData.map((item: any) => item.character);
        }
        setCharacters(charactersData);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load characters', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch('/api/threed/models?limit=500');
      const data = await response.json();
      if (data.success) {
        setModels(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { 
    fetchCharacters();
    fetchModels();
  }, [fetchCharacters, fetchModels]);

  useEffect(() => {
    let filtered = [...characters];
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.characterId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }
    
    if (movementTypeFilter !== 'all') {
      filtered = filtered.filter(c => c.movementType === movementTypeFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredCharacters(filtered);
    setCurrentPage(0);
  }, [characters, searchTerm, typeFilter, movementTypeFilter]);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  
  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    return filteredCharacters.slice(start, start + pageSize);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const openEditModal = (character: Character) => {
    setSelectedCharacter(character);
    setFormData({
      characterId: character.characterId,
      name: character.name,
      description: character.description || '',
      type: character.type,
      status: character.status,
      modelId: character.modelId,
      animations: character.animations || [],
      defaultAnimation: character.defaultAnimation || '',
      animationSpeed: character.animationSpeed || 1.0,
      movementType: character.movementType || 'stationary',
      movementRadius: character.movementRadius || 5,
      movementSpeed: character.movementSpeed || 0.5,
      patrolWaypoints: character.patrolWaypoints || [],
      followTarget: character.followTarget || '',
      followDistance: character.followDistance || 2.0,
      teleportPositions: character.teleportPositions || [],
      teleportInterval: character.teleportInterval || 30,
      interactable: character.interactable !== false,
      interactionMessage: character.interactionMessage || '',
      soundEffect: character.soundEffect || '',
      defaultEmote: character.defaultEmote || 'none',
      emoteOnInteract: character.emoteOnInteract || 'happy',
      activeStartHour: character.activeStartHour || 0,
      activeEndHour: character.activeEndHour || 23,
      weatherSensitivity: character.weatherSensitivity || 'all',
      bedId: character.bedId,
      positionX: character.positionX || 0,
      positionY: character.positionY || 0,
      positionZ: character.positionZ || 0,
      rotation: character.rotation || 0,
      scale: character.scale || 1.0,
      scaleMultiplier: character.scaleMultiplier || 1.0,
      colorTint: character.colorTint || '',
      visible: character.visible !== false,
      visibleDistance: character.visibleDistance || 30,
      isActive: character.isActive !== false,
      metadata: character.metadata || {},
    });
    setIsEditModalOpen(true);
  };

  const handleAddCharacter = async () => {
    try {
      const response = await fetch('/api/threed/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Character added successfully', 'success');
        setIsAddModalOpen(false);
        resetForm();
        fetchCharacters();
      } else {
        showToast('Failed to add character', 'error');
      }
    } catch (error) {
      showToast('Failed to add character', 'error');
    }
  };

  const handleUpdateCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch(`/api/threed/characters?id=${selectedCharacter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Character updated successfully', 'success');
        setIsEditModalOpen(false);
        setSelectedCharacter(null);
        fetchCharacters();
      } else {
        showToast('Failed to update character', 'error');
      }
    } catch (error) {
      showToast('Failed to update character', 'error');
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch(`/api/threed/characters?id=${selectedCharacter.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        showToast('Character deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedCharacter(null);
        fetchCharacters();
      } else {
        showToast('Failed to delete character', 'error');
      }
    } catch (error) {
      showToast('Failed to delete character', 'error');
    }
  };

  const addWaypoint = () => {
    setFormData(prev => ({
      ...prev,
      patrolWaypoints: [...prev.patrolWaypoints, { ...newWaypoint }]
    }));
    setNewWaypoint({ x: 0, y: 0, z: 0 });
  };

  const removeWaypoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      patrolWaypoints: prev.patrolWaypoints.filter((_, i) => i !== index)
    }));
  };

  const addTeleportPosition = () => {
    setFormData(prev => ({
      ...prev,
      teleportPositions: [...prev.teleportPositions, { ...newTeleportPos }]
    }));
    setNewTeleportPos({ x: 0, y: 0, z: 0, waitSeconds: 0 });
  };

  const removeTeleportPosition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teleportPositions: prev.teleportPositions.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      characterId: '',
      name: '',
      description: '',
      type: 'animal',
      status: 'active',
      modelId: null,
      animations: [],
      defaultAnimation: '',
      animationSpeed: 1.0,
      movementType: 'stationary',
      movementRadius: 5,
      movementSpeed: 0.5,
      patrolWaypoints: [],
      followTarget: '',
      followDistance: 2.0,
      teleportPositions: [],
      teleportInterval: 30,
      interactable: true,
      interactionMessage: '',
      soundEffect: '',
      defaultEmote: 'none',
      emoteOnInteract: 'happy',
      activeStartHour: 0,
      activeEndHour: 23,
      weatherSensitivity: 'all',
      bedId: null,
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      rotation: 0,
      scale: 1.0,
      scaleMultiplier: 1.0,
      colorTint: '',
      visible: true,
      visibleDistance: 30,
      isActive: true,
      metadata: {},
    });
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      animal: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700',
      bird: 'bg-sky-100 dark:bg-sky-950/50 text-sky-700',
      insect: 'bg-lime-100 dark:bg-lime-950/50 text-lime-700',
      mythical: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700',
      human: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700',
      robot: 'bg-gray-100 dark:bg-gray-800 text-gray-700',
      decoration: 'bg-pink-100 dark:bg-pink-950/50 text-pink-700',
    };
    return styles[type] || 'bg-gray-100';
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'stationary': return <CircleDot className="w-3 h-3" />;
      case 'wander': return <Move className="w-3 h-3" />;
      case 'patrol': return <MapPin className="w-3 h-3" />;
      case 'circle': return <RotateCw className="w-3 h-3" />;
      case 'follow': return <Target className="w-3 h-3" />;
      case 'teleport': return <Zap className="w-3 h-3" />;
      default: return <CircleDot className="w-3 h-3" />;
    }
  };

  const getWeatherIcon = (sensitivity: string) => {
    switch (sensitivity) {
      case 'sunny_only': return <Sun className="w-3 h-3" />;
      case 'rainy_only': return <CloudRain className="w-3 h-3" />;
      case 'no_rain': return <Cloud className="w-3 h-3" />;
      case 'no_snow': return <Snowflake className="w-3 h-3" />;
      default: return <Cloud className="w-3 h-3" />;
    }
  };

  const getEmoteIcon = (emote: string) => {
    switch (emote) {
      case 'happy': return <Heart className="w-3 h-3 text-pink-500" />;
      case 'sad': return <span className="text-blue-400">😢</span>;
      case 'surprised': return <span className="text-yellow-500">😲</span>;
      case 'angry': return <span className="text-red-500">😠</span>;
      case 'wave': return <span className="text-green-500">👋</span>;
      case 'dance': return <span className="text-purple-500">💃</span>;
      case 'sleep': return <span className="text-gray-400">😴</span>;
      default: return null;
    }
  };

  const currentPageData = getCurrentPageData();
  const totalPages = Math.ceil(totalRecords / pageSize);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Characters</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total characters • Independent entities with animations, movement, and interactions
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Character
          </Button>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Types</option>
            <option value="animal">Animals</option>
            <option value="bird">Birds</option>
            <option value="insect">Insects</option>
            <option value="mythical">Mythical</option>
            <option value="human">Humans</option>
            <option value="robot">Robots</option>
            <option value="decoration">Decorations</option>
          </select>
          
          <select 
            value={movementTypeFilter} 
            onChange={(e) => setMovementTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Movement</option>
            <option value="stationary">Stationary</option>
            <option value="wander">Wander</option>
            <option value="patrol">Patrol</option>
            <option value="circle">Circle</option>
            <option value="follow">Follow</option>
            <option value="teleport">Teleport</option>
          </select>
          
          <Button size="sm" onClick={fetchCharacters}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{totalRecords}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Movable</p>
            <p className="text-2xl font-bold text-blue-600">{characters.filter(c => c.movementType !== 'stationary').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Animated</p>
            <p className="text-2xl font-bold text-purple-600">{characters.filter(c => c.defaultAnimation).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Interactable</p>
            <p className="text-2xl font-bold text-green-600">{characters.filter(c => c.interactable).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">With Models</p>
            <p className="text-2xl font-bold text-amber-600">{characters.filter(c => c.modelId).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Visible</p>
            <p className="text-2xl font-bold text-emerald-600">{characters.filter(c => c.visible).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-indigo-600">{characters.filter(c => c.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Characters Table */}
      <Card>
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left text-xs uppercase">Character</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Model</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Movement</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Animation</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Interaction</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Schedule</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((character) => (
                <React.Fragment key={character.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(character.id)}>
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(character.id)}>
                      <div className="font-medium cursor-pointer">{character.name}</div>
                      <div className="text-xs text-muted-foreground">{character.characterId}</div>
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(character.id)}>
                      <Badge className={getTypeBadge(character.type)} variant="secondary">
                        {character.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {character.model ? (
                        <Badge variant="outline" className="cursor-pointer" onClick={() => {
                          setPreviewModelId(character.modelId);
                          setIsPreviewOpen(true);
                        }}>
                          {character.model.modelName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {getMovementTypeIcon(character.movementType)}
                        <span className="text-xs capitalize">{character.movementType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {character.defaultAnimation ? (
                        <span className="text-xs">{character.defaultAnimation}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {character.interactable && (
                        <div className="flex items-center gap-1">
                          {getEmoteIcon(character.defaultEmote)}
                          <span className="text-xs">Click</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {character.activeStartHour !== 0 || character.activeEndHour !== 23 ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{character.activeStartHour}:00-{character.activeEndHour}:00</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">24/7</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${character.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {character.visible ? 'Visible' : 'Hidden'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${character.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {character.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(character)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedCharacter(character);
                          setIsDeleteModalOpen(true);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(character.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          {character.description && (
                            <div>
                              <p className="font-medium">Description</p>
                              <p className="text-muted-foreground">{character.description}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            <div>
                              <p className="font-medium text-xs">Position</p>
                              <p className="text-muted-foreground text-xs">X:{character.positionX} Y:{character.positionY} Z:{character.positionZ}</p>
                            </div>
                            <div>
                              <p className="font-medium text-xs">Scale/Rotation</p>
                              <p className="text-muted-foreground text-xs">Scale: {character.scale}x • Rot: {character.rotation}°</p>
                            </div>
                            <div>
                              <p className="font-medium text-xs">Movement</p>
                              <p className="text-muted-foreground text-xs">Speed: {character.movementSpeed} • Radius: {character.movementRadius}</p>
                            </div>
                            <div>
                              <p className="font-medium text-xs">Animation</p>
                              <p className="text-muted-foreground text-xs">Speed: {character.animationSpeed}x</p>
                            </div>
                          </div>
                          {character.interactionMessage && (
                            <div>
                              <p className="font-medium">Interaction Message</p>
                              <p className="text-muted-foreground">💬 {character.interactionMessage}</p>
                            </div>
                          )}
                          {character.soundEffect && (
                            <div>
                              <p className="font-medium">Sound Effect</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Volume2 className="w-3 h-3" />
                                {character.soundEffect}
                              </p>
                            </div>
                          )}
                          {character.patrolWaypoints && character.patrolWaypoints.length > 0 && (
                            <div>
                              <p className="font-medium">Patrol Waypoints ({character.patrolWaypoints.length})</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {character.patrolWaypoints.map((wp, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {i+1}: ({wp.x}, {wp.y}, {wp.z})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {character.teleportPositions && character.teleportPositions.length > 0 && (
                            <div>
                              <p className="font-medium">Teleport Positions ({character.teleportPositions.length})</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {character.teleportPositions.map((pos, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {i+1}: ({pos.x}, {pos.y}, {pos.z}) wait: {pos.waitSeconds}s
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal - Enhanced with all new features */}
      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      }} title={isAddModalOpen ? "Add New Character" : "Edit Character"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Basic Info Section */}
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold mb-2 block">Basic Information</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Character ID *</Label>
                <Input
                  value={formData.characterId}
                  onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                  placeholder="e.g., BUNNY-001"
                  readOnly={isEditModalOpen}
                  className={isEditModalOpen ? "bg-muted" : ""}
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Lucky the Bunny"
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="animal">Animal</option>
                  <option value="bird">Bird</option>
                  <option value="insect">Insect</option>
                  <option value="mythical">Mythical</option>
                  <option value="human">Human</option>
                  <option value="robot">Robot</option>
                  <option value="decoration">Decoration</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="sleeping">Sleeping</option>
                  <option value="moving">Moving</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 3D Model Selection */}
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold mb-2 block">3D Model</Label>
            <select
              value={formData.modelId || ''}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">None</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.modelName} ({model.modelType.toUpperCase()})
                </option>
              ))}
            </select>
            {formData.modelId && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setPreviewModelId(formData.modelId);
                  setIsPreviewOpen(true);
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview Model
              </Button>
            )}
          </div>
          
          {/* Position & Transform */}
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold mb-2 block">World Position & Transform</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>X</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionX}
                  onChange={(e) => setFormData({ ...formData, positionX: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Y</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionY}
                  onChange={(e) => setFormData({ ...formData, positionY: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Z</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionZ}
                  onChange={(e) => setFormData({ ...formData, positionZ: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Rotation (degrees)</Label>
                <Input
                  type="number"
                  step="15"
                  value={formData.rotation}
                  onChange={(e) => setFormData({ ...formData, rotation: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Scale</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Color Tint</Label>
                <Input
                  type="color"
                  value={formData.colorTint || '#ffffff'}
                  onChange={(e) => setFormData({ ...formData, colorTint: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          {/* Animation Section */}
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold mb-2 block">Animation</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Default Animation</Label>
                <select
                  value={formData.defaultAnimation}
                  onChange={(e) => setFormData({ ...formData, defaultAnimation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">None</option>
                  <option value="idle">Idle</option>
                  <option value="walk">Walk</option>
                  <option value="run">Run</option>
                  <option value="fly">Fly</option>
                  <option value="dance">Dance</option>
                  <option value="bounce">Bounce</option>
                </select>
              </div>
              <div>
                <Label>Animation Speed</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.animationSpeed}
                  onChange={(e) => setFormData({ ...formData, animationSpeed: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          {/* Movement Section */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Movement</Label>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <Label>Movement Type</Label>
                <select
                  value={formData.movementType}
                  onChange={(e) => setFormData({ ...formData, movementType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="stationary">Stationary</option>
                  <option value="wander">Wander</option>
                  <option value="patrol">Patrol</option>
                  <option value="circle">Circle</option>
                  <option value="follow">Follow</option>
                  <option value="teleport">Teleport</option>
                </select>
              </div>
              {formData.movementType !== 'stationary' && formData.movementType !== 'follow' && formData.movementType !== 'teleport' && (
                <>
                  <div>
                    <Label>Movement Radius</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.movementRadius}
                      onChange={(e) => setFormData({ ...formData, movementRadius: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Movement Speed</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.movementSpeed}
                      onChange={(e) => setFormData({ ...formData, movementSpeed: parseFloat(e.target.value) })}
                    />
                  </div>
                </>
              )}
              {formData.movementType === 'follow' && (
                <>
                  <div>
                    <Label>Follow Target</Label>
                    <select
                      value={formData.followTarget}
                      onChange={(e) => setFormData({ ...formData, followTarget: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select target</option>
                      <option value="camera">Camera</option>
                      <option value="player">Player</option>
                    </select>
                  </div>
                  <div>
                    <Label>Follow Distance</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.followDistance}
                      onChange={(e) => setFormData({ ...formData, followDistance: parseFloat(e.target.value) })}
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Patrol Waypoints */}
            {formData.movementType === 'patrol' && (
              <div className="mt-3 pt-3 border-t">
                <Label className="font-medium">Patrol Waypoints</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="X"
                    type="number"
                    step="0.5"
                    value={newWaypoint.x}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, x: parseFloat(e.target.value) })}
                    className="w-20"
                  />
                  <Input
                    placeholder="Y"
                    type="number"
                    step="0.5"
                    value={newWaypoint.y}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, y: parseFloat(e.target.value) })}
                    className="w-20"
                  />
                  <Input
                    placeholder="Z"
                    type="number"
                    step="0.5"
                    value={newWaypoint.z}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, z: parseFloat(e.target.value) })}
                    className="w-20"
                  />
                  <Button size="sm" onClick={addWaypoint}>Add</Button>
                </div>
                {formData.patrolWaypoints.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.patrolWaypoints.map((wp, i) => (
                      <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeWaypoint(i)}>
                        {i+1}: ({wp.x}, {wp.y}, {wp.z}) ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Teleport Positions */}
            {formData.movementType === 'teleport' && (
              <div className="mt-3 pt-3 border-t">
                <Label className="font-medium">Teleport Positions</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="X"
                    type="number"
                    step="0.5"
                    value={newTeleportPos.x}
                    onChange={(e) => setNewTeleportPos({ ...newTeleportPos, x: parseFloat(e.target.value) })}
                    className="w-16"
                  />
                  <Input
                    placeholder="Y"
                    type="number"
                    step="0.5"
                    value={newTeleportPos.y}
                    onChange={(e) => setNewTeleportPos({ ...newTeleportPos, y: parseFloat(e.target.value) })}
                    className="w-16"
                  />
                  <Input
                    placeholder="Z"
                    type="number"
                    step="0.5"
                    value={newTeleportPos.z}
                    onChange={(e) => setNewTeleportPos({ ...newTeleportPos, z: parseFloat(e.target.value) })}
                    className="w-16"
                  />
                  <Input
                    placeholder="Wait (sec)"
                    type="number"
                    step="1"
                    value={newTeleportPos.waitSeconds}
                    onChange={(e) => setNewTeleportPos({ ...newTeleportPos, waitSeconds: parseInt(e.target.value) })}
                    className="w-20"
                  />
                  <Button size="sm" onClick={addTeleportPosition}>Add</Button>
                </div>
                {formData.teleportPositions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.teleportPositions.map((pos, i) => (
                      <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTeleportPosition(i)}>
                        {i+1}: ({pos.x}, {pos.y}, {pos.z}) wait:{pos.waitSeconds}s ✕
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <Label>Teleport Interval (seconds)</Label>
                  <Input
                    type="number"
                    step="5"
                    value={formData.teleportInterval}
                    onChange={(e) => setFormData({ ...formData, teleportInterval: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Interaction Section */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Interaction</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="interactable"
                  checked={formData.interactable}
                  onChange={(e) => setFormData({ ...formData, interactable: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="interactable">Allow Interaction</Label>
              </div>
            </div>
            
            {formData.interactable && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Default Emote</Label>
                    <select
                      value={formData.defaultEmote}
                      onChange={(e) => setFormData({ ...formData, defaultEmote: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="none">None</option>
                      <option value="happy">Happy ❤️</option>
                      <option value="sad">Sad 😢</option>
                      <option value="surprised">Surprised 😲</option>
                      <option value="angry">Angry 😠</option>
                      <option value="wave">Wave 👋</option>
                      <option value="dance">Dance 💃</option>
                      <option value="sleep">Sleep 😴</option>
                    </select>
                  </div>
                  <div>
                    <Label>Emote on Interact</Label>
                    <select
                      value={formData.emoteOnInteract}
                      onChange={(e) => setFormData({ ...formData, emoteOnInteract: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="none">None</option>
                      <option value="happy">Happy ❤️</option>
                      <option value="sad">Sad 😢</option>
                      <option value="surprised">Surprised 😲</option>
                      <option value="wave">Wave 👋</option>
                      <option value="dance">Dance 💃</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Interaction Message</Label>
                  <Input
                    value={formData.interactionMessage}
                    onChange={(e) => setFormData({ ...formData, interactionMessage: e.target.value })}
                    placeholder="Click to interact with this character..."
                  />
                </div>
                <div className="mt-2">
                  <Label>Sound Effect (Optional)</Label>
                  <Input
                    value={formData.soundEffect}
                    onChange={(e) => setFormData({ ...formData, soundEffect: e.target.value })}
                    placeholder="/sounds/character.mp3"
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Schedule & Environment */}
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold mb-2 block">Schedule & Environment</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Active Start Hour</Label>
                <select
                  value={formData.activeStartHour}
                  onChange={(e) => setFormData({ ...formData, activeStartHour: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Active End Hour</Label>
                <select
                  value={formData.activeEndHour}
                  onChange={(e) => setFormData({ ...formData, activeEndHour: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Weather Sensitivity</Label>
                <select
                  value={formData.weatherSensitivity}
                  onChange={(e) => setFormData({ ...formData, weatherSensitivity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Weather</option>
                  <option value="sunny_only">Sunny Only</option>
                  <option value="rainy_only">Rainy Only</option>
                  <option value="no_rain">No Rain</option>
                  <option value="no_snow">No Snow</option>
                </select>
              </div>
              <div>
                <Label>Visible Distance</Label>
                <Input
                  type="number"
                  step="5"
                  value={formData.visibleDistance}
                  onChange={(e) => setFormData({ ...formData, visibleDistance: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible"
                  checked={formData.visible}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="visible">Visible</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active (Enabled)</Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Character description..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
            }}>Cancel</Button>
            <Button onClick={isAddModalOpen ? handleAddCharacter : handleUpdateCharacter}>
              {isAddModalOpen ? 'Add Character' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Model Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Model Preview">
        <div className="h-96">
          {previewModelId && (
            <ModelPreview
              modelUrl={models.find(m => m.id === previewModelId)?.filePath || ''}
              scale={1}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
        </DialogFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCharacter}
        title="Delete Character"
        message={`Are you sure you want to delete "${selectedCharacter?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}