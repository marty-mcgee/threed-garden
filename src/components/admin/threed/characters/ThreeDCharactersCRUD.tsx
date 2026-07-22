// components/admin/threed/characters/ThreeDCharactersCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  User,
  MoreHorizontal
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

interface Character {
  id: number;
  name: string;
  description: string | null;
  characterType: string;
  modelId: number | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  animation: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ThreeDCharactersCRUDProps {
  onModuleUpdate?: () => void;
}

export function ThreeDCharactersCRUD({ onModuleUpdate }: ThreeDCharactersCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    characterType: 'human',
    modelId: '',
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
    animation: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/characters');
      const data = await response.json();
      if (data.success) {
        setCharacters(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch characters', 'error');
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
      showToast('Failed to fetch characters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      showToast('Character name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/threed/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          characterType: formData.characterType,
          modelId: formData.modelId ? parseInt(formData.modelId) : null,
          positionX: formData.positionX,
          positionY: formData.positionY,
          positionZ: formData.positionZ,
          rotationX: formData.rotationX,
          rotationY: formData.rotationY,
          rotationZ: formData.rotationZ,
          scale: formData.scale,
          animation: formData.animation || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Character created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          characterType: 'human',
          modelId: '',
          positionX: 0,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          animation: '',
          isActive: true,
        });
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
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threed/characters?id=${editingCharacter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          characterType: formData.characterType,
          modelId: formData.modelId ? parseInt(formData.modelId) : null,
          positionX: formData.positionX,
          positionY: formData.positionY,
          positionZ: formData.positionZ,
          rotationX: formData.rotationX,
          rotationY: formData.rotationY,
          rotationZ: formData.rotationZ,
          scale: formData.scale,
          animation: formData.animation || null,
          isActive: formData.isActive,
        }),
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

  const renderActions = (character: Character) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewCharacterDetails(character)}
      >
        <User className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openEditDialog(character)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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

  const viewCharacterDetails = (character: Character) => {
    const position = `(${character.positionX}, ${character.positionY}, ${character.positionZ})`;
    showToast(
      `${character.name} - Position: ${position}`,
      'info'
    );
  };

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description || '',
      characterType: character.characterType || 'human',
      modelId: character.modelId ? String(character.modelId) : '',
      positionX: character.positionX || 0,
      positionY: character.positionY || 0,
      positionZ: character.positionZ || 0,
      rotationX: character.rotationX || 0,
      rotationY: character.rotationY || 0,
      rotationZ: character.rotationZ || 0,
      scale: character.scale || 1,
      animation: character.animation || '',
      isActive: character.isActive !== false,
    });
  };

  const getCharacterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      human: 'Human',
      animal: 'Animal',
      robot: 'Robot',
      fantasy: 'Fantasy',
      creature: 'Creature',
      npc: 'NPC',
    };
    return types[type] || type;
  };

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Characters</span>
          <Badge variant="secondary" className="text-xs">
            {characters.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
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
              <div>
                <Label htmlFor="characterType">Character Type</Label>
                <Select
                  value={formData.characterType}
                  onValueChange={(value) => setFormData({ ...formData, characterType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select character type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human">Human</SelectItem>
                    <SelectItem value="animal">Animal</SelectItem>
                    <SelectItem value="robot">Robot</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="creature">Creature</SelectItem>
                    <SelectItem value="npc">NPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modelId">Model ID (optional)</Label>
                <Input
                  id="modelId"
                  type="number"
                  placeholder="3D Model ID"
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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
                      onChange={(e) => setFormData({ ...formData, positionX: parseFloat(e.target.value) || 0 })}
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
                      onChange={(e) => setFormData({ ...formData, positionY: parseFloat(e.target.value) || 0 })}
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
                      onChange={(e) => setFormData({ ...formData, positionZ: parseFloat(e.target.value) || 0 })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Rotation</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="rotationX" className="text-xs">RX</Label>
                    <Input
                      id="rotationX"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.rotationX}
                      onChange={(e) => setFormData({ ...formData, rotationX: parseFloat(e.target.value) || 0 })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rotationY" className="text-xs">RY</Label>
                    <Input
                      id="rotationY"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.rotationY}
                      onChange={(e) => setFormData({ ...formData, rotationY: parseFloat(e.target.value) || 0 })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rotationZ" className="text-xs">RZ</Label>
                    <Input
                      id="rotationZ"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formData.rotationZ}
                      onChange={(e) => setFormData({ ...formData, rotationZ: parseFloat(e.target.value) || 0 })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="scale">Scale</Label>
                <Input
                  id="scale"
                  type="number"
                  step="0.1"
                  placeholder="1"
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: parseFloat(e.target.value) || 1 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="animation">Animation</Label>
                <Input
                  id="animation"
                  placeholder="idle, walking, running"
                  value={formData.animation}
                  onChange={(e) => setFormData({ ...formData, animation: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
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

      {characters.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No characters yet</p>
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
                <TableHead className="hidden md:table-cell text-xs py-1">Position</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {characters.map((character) => (
                <TableRow key={character.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    {character.name}
                    {character.animation && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {character.animation}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-sm text-muted-foreground">
                    {getCharacterTypeLabel(character.characterType)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    ({character.positionX}, {character.positionY}, {character.positionZ})
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      {character.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs">
                        {character.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-right">
                    {renderActions(character)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editingCharacter} onOpenChange={(open) => !open && setEditingCharacter(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            <div>
              <Label htmlFor="edit-characterType">Character Type</Label>
              <Select
                value={formData.characterType}
                onValueChange={(value) => setFormData({ ...formData, characterType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select character type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="human">Human</SelectItem>
                  <SelectItem value="animal">Animal</SelectItem>
                  <SelectItem value="robot">Robot</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="creature">Creature</SelectItem>
                  <SelectItem value="npc">NPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-modelId">Model ID (optional)</Label>
              <Input
                id="edit-modelId"
                type="number"
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                disabled={isSubmitting}
              />
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
                    onChange={(e) => setFormData({ ...formData, positionX: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, positionY: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, positionZ: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Rotation</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="edit-rotationX" className="text-xs">RX</Label>
                  <Input
                    id="edit-rotationX"
                    type="number"
                    step="0.1"
                    value={formData.rotationX}
                    onChange={(e) => setFormData({ ...formData, rotationX: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rotationY" className="text-xs">RY</Label>
                  <Input
                    id="edit-rotationY"
                    type="number"
                    step="0.1"
                    value={formData.rotationY}
                    onChange={(e) => setFormData({ ...formData, rotationY: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rotationZ" className="text-xs">RZ</Label>
                  <Input
                    id="edit-rotationZ"
                    type="number"
                    step="0.1"
                    value={formData.rotationZ}
                    onChange={(e) => setFormData({ ...formData, rotationZ: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-scale">Scale</Label>
              <Input
                id="edit-scale"
                type="number"
                step="0.1"
                value={formData.scale}
                onChange={(e) => setFormData({ ...formData, scale: parseFloat(e.target.value) || 1 })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-animation">Animation</Label>
              <Input
                id="edit-animation"
                value={formData.animation}
                onChange={(e) => setFormData({ ...formData, animation: e.target.value })}
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