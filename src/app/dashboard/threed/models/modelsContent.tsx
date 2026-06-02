// src/app/dashboard/threed/models/modelsContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ModelPreview } from '@/components/threed/ModelPreview';
import {
  Upload,
  Trash2,
  Edit,
  Eye,
  Star,
  FolderOpen,
  FileImage,
  File,
  X,
  Plus,
  Archive,
  Download,
  RefreshCw,
  Sparkles,
  Users,
  Flower2,
  Bug,
} from 'lucide-react';

interface ModelFile {
  id: number;
  modelId: number;
  fileName: string;
  fileType: string;
  textureType?: string;
  filePath: string;
  fileSize: number;
  isBinaryBuffer: boolean;
  loadOrder: number;
  createdAt: string;
}

interface Model {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  fileSize: number;
  scale: string;
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  hasLOD: boolean;
  lodLevels: any;
  animations: string[];
  defaultAnimation: string | null;
  hasExternalFiles: boolean;
  textureCount: number;
  isActive: boolean;
  isDefault: boolean;
  usedByPlants: boolean;
  usedByCharacters: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  files?: ModelFile[];
  mainModelFile?: ModelFile;
  textures?: ModelFile[];
  binaries?: ModelFile[];
  plant?: {
    id: number;
    commonName: string;
    scientificName: string;
    plantId: string;
  };
  character?: {
    id: number;
    name: string;
    characterId: string;
    type: string;
  };
}

interface Plant {
  id: number;
  plantId: string;
  commonName: string;
  scientificName: string;
  type: string;
}

interface Character {
  id: number;
  characterId: string;
  name: string;
  description: string;
  type: string;
}

interface UploadFileSet {
  mainModel: File | null;
  textures: File[];
  binaries: File[];
}

export default function ModelsContent() {
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isFilesDialogOpen, setIsFilesDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [addingFiles, setAddingFiles] = useState(false);
  
  // Association type: 'plant', 'character', or 'none'
  const [associationType, setAssociationType] = useState<'plant' | 'character' | 'none'>('plant');
  
  // Form state
  const [formData, setFormData] = useState({
    plantId: '',
    characterId: '',
    modelName: '',
    modelType: 'glb',
    scale: '1.0',
    rotationY: '0',
    offsetX: '0',
    offsetY: '0',
    offsetZ: '0',
    isDefault: false,
    hasLOD: false,
    animations: '[]',
    defaultAnimation: '',
    metadata: '{}',
  });
  
  const [uploadFiles, setUploadFiles] = useState<UploadFileSet>({
    mainModel: null,
    textures: [],
    binaries: [],
  });

  // Fetch models, plants, and characters on load
  useEffect(() => {
    fetchModels();
    fetchPlants();
    fetchCharacters();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/threed/models?limit=100');
      const data = await response.json();
      
      console.log('📦 Full API response:', data);
      
      if (data.success) {
        let modelsData = data.data;
        
        // If data is wrapped in an object with a models property
        if (modelsData && modelsData.models) {
          modelsData = modelsData.models;
        }
        
        // If data is an array of objects where each has a 'model' property
        if (modelsData && modelsData.length > 0 && modelsData[0].model) {
          modelsData = modelsData.map((item: any) => item.model);
        }
        
        console.log('📦 Processed models data:', modelsData);
        setModels(modelsData || []);
      } else {
        console.error('API error:', data.error);
        showToast('Failed to load models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      showToast('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/threed/plants?limit=1000&includeModel=false');
      const data = await response.json();
      if (data.success) {
        let plantsData = data.data;
        if (plantsData.length > 0 && plantsData[0].plant) {
          plantsData = plantsData.map((item: any) => item.plant);
        }
        setPlants(plantsData);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/threed/characters?limit=1000');
      const data = await response.json();
      if (data.success) {
        let charactersData = data.data;
        if (charactersData.length > 0 && charactersData[0].character) {
          charactersData = charactersData.map((item: any) => item.character);
        }
        setCharacters(charactersData);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const handleMainModelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.gltf', '.glb', '.fbx', '.obj'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(extension)) {
        showToast(`Main model must be GLTF, GLB, FBX, or OBJ format`);
        return;
      }
      setUploadFiles(prev => ({ ...prev, mainModel: file }));
      setFormData(prev => ({ ...prev, modelName: file.name.replace(extension, '') }));
    }
  };

  const handleTextureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const validFiles = files.filter(file => {
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return validExtensions.includes(extension);
    });
    
    if (validFiles.length !== files.length) {
      showToast('Some files were skipped. Textures must be JPG, PNG, or WEBP format.');
    }
    
    setUploadFiles(prev => ({ 
      ...prev, 
      textures: [...prev.textures, ...validFiles] 
    }));
  };

  const handleBinarySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validExtensions = ['.bin'];
    const validFiles = files.filter(file => {
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return validExtensions.includes(extension);
    });
    
    setUploadFiles(prev => ({ 
      ...prev, 
      binaries: [...prev.binaries, ...validFiles] 
    }));
  };

  const removeTexture = (index: number) => {
    setUploadFiles(prev => ({
      ...prev,
      textures: prev.textures.filter((_, i) => i !== index)
    }));
  };

  const removeBinary = (index: number) => {
    setUploadFiles(prev => ({
      ...prev,
      binaries: prev.binaries.filter((_, i) => i !== index)
    }));
  };

  const handleUpload = async () => {
    if (!uploadFiles.mainModel) {
      showToast('Please select a main model file');
      return;
    }

    if (associationType === 'plant' && !formData.plantId) {
      showToast('Please select a plant for this model');
      return;
    }

    if (associationType === 'character' && !formData.characterId) {
      showToast('Please select a character for this model');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadFormData = new FormData();
    
    // Add all files
    uploadFormData.append('files', uploadFiles.mainModel);
    uploadFiles.textures.forEach(file => {
      uploadFormData.append('files', file);
    });
    uploadFiles.binaries.forEach(file => {
      uploadFormData.append('files', file);
    });
    
    // Add metadata based on association type
    if (associationType === 'plant') {
      uploadFormData.append('plantId', formData.plantId);
      uploadFormData.append('isDefault', formData.isDefault.toString());
    } else if (associationType === 'character') {
      uploadFormData.append('characterId', formData.characterId);
    }
    
    uploadFormData.append('modelName', formData.modelName);
    uploadFormData.append('modelType', formData.modelType);
    uploadFormData.append('associationType', associationType);
    uploadFormData.append('scale', formData.scale);
    uploadFormData.append('rotationY', formData.rotationY);
    uploadFormData.append('offsetX', formData.offsetX);
    uploadFormData.append('offsetY', formData.offsetY);
    uploadFormData.append('offsetZ', formData.offsetZ);
    uploadFormData.append('hasLOD', formData.hasLOD.toString());
    uploadFormData.append('animations', formData.animations);
    uploadFormData.append('defaultAnimation', formData.defaultAnimation);
    uploadFormData.append('metadata', formData.metadata);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/threed/models', {
        method: 'POST',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      if (data.success) {
        const associationText = associationType === 'plant' ? 'plant' : associationType === 'character' ? 'character' : 'no entity';
        showToast(`Model uploaded successfully and associated with ${associationText}!`);
        setIsUploadDialogOpen(false);
        resetForm();
        fetchModels();
      } else {
        showToast(data.error || 'Failed to upload model');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload model');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch(`/api/threed/models/${selectedModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: formData.modelName,
          scale: formData.scale,
          rotationY: formData.rotationY,
          offsetX: formData.offsetX,
          offsetY: formData.offsetY,
          offsetZ: formData.offsetZ,
          isDefault: formData.isDefault,
          hasLOD: formData.hasLOD,
          animations: JSON.parse(formData.animations),
          defaultAnimation: formData.defaultAnimation || null,
          isActive: true,
          metadata: JSON.parse(formData.metadata),
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model updated successfully');
        setIsEditDialogOpen(false);
        fetchModels();
      } else {
        showToast(data.error || 'Failed to update model');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('Failed to update model');
    }
  };

  const handleDelete = async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch(`/api/threed/models/${selectedModel.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchModels();
      } else {
        showToast(data.error || 'Failed to delete model');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete model');
    }
  };

  const handleSetDefault = async (model: Model) => {
    try {
      const response = await fetch(`/api/threed/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`${model.modelName} is now the default model`);
        fetchModels();
      } else {
        showToast(data.error || 'Failed to set default model');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      showToast('Failed to set default model');
    }
  };

  // Add these functions to your ModelsContent component
  const handleAddFilesToModel = async () => {
    if (!selectedModel) return;
    
    const hasFilesToAdd = uploadFiles.textures.length > 0 || uploadFiles.binaries.length > 0;
    if (!hasFilesToAdd) {
      showToast('Please select at least one texture or binary file to add');
      return;
    }

    setAddingFiles(true);
    setUploadProgress(0);

    const uploadFormData = new FormData();
    
    uploadFiles.textures.forEach(file => {
      uploadFormData.append('files', file);
    });
    uploadFiles.binaries.forEach(file => {
      uploadFormData.append('files', file);
    });

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/threed/models/${selectedModel.id}/files`, {
        method: 'POST',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      if (data.success) {
        showToast(`Added ${uploadFiles.textures.length + uploadFiles.binaries.length} files to model!`);
        // Reset file selection
        setUploadFiles(prev => ({
          ...prev,
          textures: [],
          binaries: [],
        }));
        // Refresh model data
        await fetchModels();
        // Refresh selected model data
        const updatedModel = models.find(m => m.id === selectedModel.id);
        if (updatedModel) {
          setSelectedModel(updatedModel);
        }
      } else {
        showToast(data.error || 'Failed to add files');
      }
    } catch (error) {
      console.error('Add files error:', error);
      showToast('Failed to add files: ' + error.message);
    } finally {
      setAddingFiles(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!selectedModel) return;
    
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const response = await fetch(`/api/threed/models/${selectedModel.id}/files/${fileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Deleted ${fileName}`);
        await fetchModels();
        // Refresh selected model data
        const updatedModel = models.find(m => m.id === selectedModel.id);
        if (updatedModel) {
          setSelectedModel(updatedModel);
        }
      } else {
        showToast(data.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      showToast('Failed to delete file');
    }
  };

  const resetForm = () => {
    setFormData({
      plantId: '',
      characterId: '',
      modelName: '',
      modelType: 'glb',
      scale: '1.0',
      rotationY: '0',
      offsetX: '0',
      offsetY: '0',
      offsetZ: '0',
      isDefault: false,
      hasLOD: false,
      animations: '[]',
      defaultAnimation: '',
      metadata: '{}',
    });
    setUploadFiles({
      mainModel: null,
      textures: [],
      binaries: [],
    });
    setAssociationType('plant');
  };

  const openEditDialog = (model: Model) => {
    setSelectedModel(model);
    setFormData({
      plantId: '',
      characterId: '',
      modelName: model.modelName,
      modelType: model.modelType,
      scale: model.scale,
      rotationY: model.rotationY,
      offsetX: model.offsetX,
      offsetY: model.offsetY,
      offsetZ: model.offsetZ,
      isDefault: model.isDefault,
      hasLOD: model.hasLOD,
      animations: JSON.stringify(model.animations),
      defaultAnimation: model.defaultAnimation || '',
      metadata: JSON.stringify(model.metadata, null, 2),
    });
    setIsEditDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTextureTypeIcon = (textureType?: string) => {
    switch(textureType) {
      case 'normalMap': return '🔵';
      case 'roughness': return '⚫';
      case 'metallic': return '⚪';
      case 'emissive': return '💡';
      case 'occlusion': return '🌑';
      default: return '🎨';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">3D Models Library</h2>
          <p className="text-muted-foreground mt-1">
            Manage GLTF/GLB/FBX models for your garden plants and characters
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload 3D Model</DialogTitle>
              <DialogDescription>
                Upload your main GLTF/GLB/FBX model along with any texture and binary files
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Association Type Selection */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Associate With</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssociationType('plant')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      associationType === 'plant' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Flower2 className="w-4 h-4" />
                    <span className="text-sm">Plant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssociationType('character')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      associationType === 'character' 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Character</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssociationType('none')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      associationType === 'none' 
                        ? 'border-gray-500 bg-gray-50 dark:bg-gray-800 text-gray-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">None</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {associationType === 'plant' && 'Associate this model with a plant. It can be used as the plant\'s 3D representation.'}
                  {associationType === 'character' && 'Associate this model with a character. Characters can have animations and movement.'}
                  {associationType === 'none' && 'Store this model without associating it to any plant or character yet.'}
                </p>
              </div>

              {/* Plant Selection */}
              {associationType === 'plant' && (
                <div className="space-y-2 border rounded-lg p-4">
                  <Label className="text-base font-semibold">Select Plant *</Label>
                  <Select
                    value={formData.plantId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, plantId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id.toString()}>
                          {plant.commonName} - {plant.scientificName || 'No scientific name'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault">Set as default model for this plant</Label>
                  </div>
                </div>
              )}

              {/* Character Selection */}
              {associationType === 'character' && (
                <div className="space-y-2 border rounded-lg p-4">
                  <Label className="text-base font-semibold">Select Character *</Label>
                  <Select
                    value={formData.characterId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, characterId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((character) => (
                        <SelectItem key={character.id} value={character.id.toString()}>
                          {character.name} ({character.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Main Model File */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Main Model File *</Label>
                <Input
                  type="file"
                  accept=".gltf,.glb,.fbx,.obj"
                  onChange={handleMainModelSelect}
                  className="cursor-pointer"
                />
                {uploadFiles.mainModel && (
                  <p className="text-sm text-green-600">
                    ✓ {uploadFiles.mainModel.name} ({formatFileSize(uploadFiles.mainModel.size)})
                  </p>
                )}
              </div>

              {/* Model Name */}
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={formData.modelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                  placeholder="Enter model name"
                />
              </div>

              {/* Texture Files */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Texture Files (Optional)</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleTextureSelect}
                  className="cursor-pointer"
                />
                {uploadFiles.textures.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm font-medium">Selected textures:</p>
                    {uploadFiles.textures.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>📷 {file.name} ({formatFileSize(file.size)})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTexture(idx)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Binary Files */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Binary Files (Optional)</Label>
                <Input
                  type="file"
                  accept=".bin"
                  multiple
                  onChange={handleBinarySelect}
                  className="cursor-pointer"
                />
                {uploadFiles.binaries.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm font-medium">Selected binary files:</p>
                    {uploadFiles.binaries.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>🔧 {file.name} ({formatFileSize(file.size)})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBinary(idx)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Tabs defaultValue="transform" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="transform">Transform</TabsTrigger>
                  <TabsTrigger value="animation">Animation</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transform" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scale</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.scale}
                        onChange={(e) => setFormData(prev => ({ ...prev, scale: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rotation Y (degrees)</Label>
                      <Input
                        type="number"
                        step="15"
                        value={formData.rotationY}
                        onChange={(e) => setFormData(prev => ({ ...prev, rotationY: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset X</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.offsetX}
                        onChange={(e) => setFormData(prev => ({ ...prev, offsetX: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset Y</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.offsetY}
                        onChange={(e) => setFormData(prev => ({ ...prev, offsetY: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset Z</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.offsetZ}
                        onChange={(e) => setFormData(prev => ({ ...prev, offsetZ: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="animation" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Animations (JSON array)</Label>
                    <Textarea
                      value={formData.animations}
                      onChange={(e) => setFormData(prev => ({ ...prev, animations: e.target.value }))}
                      placeholder='["idle", "walk", "run"]'
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Animation</Label>
                    <Input
                      value={formData.defaultAnimation}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultAnimation: e.target.value }))}
                      placeholder="idle"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasLOD"
                      checked={formData.hasLOD}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasLOD: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="hasLOD">Has Level of Detail (LOD)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Metadata (JSON)</Label>
                    <Textarea
                      value={formData.metadata}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
                      placeholder='{"author": "Name", "license": "CC-BY"}'
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!uploadFiles.mainModel || uploading}>
                {uploading ? 'Uploading...' : 'Upload Model'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Models Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your 3D Models</CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No models uploaded</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by uploading your first 3D model
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Model
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Scale</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.modelName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.modelType?.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(model.fileSize)}</TableCell>
                      <TableCell>{model.scale}x</TableCell>
                      <TableCell>
                        {model.usedByPlants && <Badge variant="secondary" className="mr-1">Plant</Badge>}
                        {model.usedByCharacters && <Badge variant="secondary">Character</Badge>}
                        {!model.usedByPlants && !model.usedByCharacters && (
                          <Badge variant="outline">Unused</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>📦 1</span>
                          {model.textureCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileImage className="h-3 w-3" />
                              {model.textureCount}
                            </span>
                          )}
                          {model.binaries && model.binaries.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Archive className="h-3 w-3" />
                              {model.binaries.length}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-1"
                            onClick={() => {
                              setSelectedModel(model);
                              setIsFilesDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.isActive ? "default" : "secondary"}>
                          {model.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(model.filePath, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(model)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedModel(model);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files Dialog */}
      <Dialog open={isFilesDialogOpen} onOpenChange={setIsFilesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Model Files: {selectedModel?.modelName}</DialogTitle>
            <DialogDescription>
              All files associated with this 3D model
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Main Model File */}
            {selectedModel?.mainModelFile && (
              <div className="border rounded-lg p-3">
                <Label className="font-semibold">Main Model File</Label>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-2">
                    <span>🎯</span>
                    <span className="text-sm">{selectedModel.mainModelFile.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedModel.mainModelFile.fileSize)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(selectedModel.mainModelFile?.filePath, '_blank')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Texture Files */}
            {selectedModel?.textures && selectedModel.textures.length > 0 && (
              <div className="border rounded-lg p-3">
                <Label className="font-semibold">Texture Files</Label>
                <div className="space-y-2 mt-2">
                  {selectedModel.textures.map((texture, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{getTextureTypeIcon(texture.textureType)}</span>
                        <span className="text-sm">{texture.fileName}</span>
                        <Badge variant="outline" className="text-xs">
                          {texture.textureType || 'baseColor'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(texture.fileSize)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(texture.filePath, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Binary Files */}
            {selectedModel?.binaries && selectedModel.binaries.length > 0 && (
              <div className="border rounded-lg p-3">
                <Label className="font-semibold">Binary Buffer Files</Label>
                <div className="space-y-2 mt-2">
                  {selectedModel.binaries.map((binary, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>🔧</span>
                        <span className="text-sm">{binary.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(binary.fileSize)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(binary.filePath, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {/* Enhanced Edit Dialog with File Management */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Model: {selectedModel?.modelName}</DialogTitle>
            <DialogDescription>
              Update model properties, transform settings, and manage associated files
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="transform">Transform</TabsTrigger>
              <TabsTrigger value="animation">Animation</TabsTrigger>
              <TabsTrigger value="files">Files ({selectedModel?.files?.length || 0})</TabsTrigger>
            </TabsList>
            
            {/* Properties Tab */}
            <TabsContent value="properties" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={formData.modelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Model Type</Label>
                <select
                  value={formData.modelType}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="glb">GLB</option>
                  <option value="gltf">GLTF</option>
                  <option value="fbx">FBX</option>
                  <option value="obj">OBJ</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={selectedModel?.isActive}
                  onChange={(e) => {
                    if (selectedModel) {
                      setSelectedModel({ ...selectedModel, isActive: e.target.checked });
                      setFormData(prev => ({ ...prev, isActive: e.target.checked }));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="editIsActive">Active (visible and usable)</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Metadata (JSON)</Label>
                <Textarea
                  value={formData.metadata}
                  onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
                  rows={4}
                  placeholder='{"author": "Name", "license": "CC-BY", "tags": ["vegetable", "plant"]}'
                />
              </div>
            </TabsContent>
            
            {/* Transform Tab */}
            <TabsContent value="transform" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scale</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.scale}
                    onChange={(e) => setFormData(prev => ({ ...prev, scale: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Global scale multiplier</p>
                </div>
                <div className="space-y-2">
                  <Label>Rotation Y (degrees)</Label>
                  <Input
                    type="number"
                    step="15"
                    value={formData.rotationY}
                    onChange={(e) => setFormData(prev => ({ ...prev, rotationY: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Y-axis rotation offset</p>
                </div>
                <div className="space-y-2">
                  <Label>Offset X</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.offsetX}
                    onChange={(e) => setFormData(prev => ({ ...prev, offsetX: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Offset Y</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.offsetY}
                    onChange={(e) => setFormData(prev => ({ ...prev, offsetY: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Offset Z</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.offsetZ}
                    onChange={(e) => setFormData(prev => ({ ...prev, offsetZ: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="editHasLOD"
                  checked={formData.hasLOD === true}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasLOD: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="editHasLOD">Has Level of Detail (LOD) variants</Label>
              </div>
            </TabsContent>
            
            {/* Animation Tab */}
            <TabsContent value="animation" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Animations (JSON array)</Label>
                <Textarea
                  value={formData.animations}
                  onChange={(e) => setFormData(prev => ({ ...prev, animations: e.target.value }))}
                  rows={3}
                  placeholder='["idle", "walk", "run", "jump"]'
                />
                <p className="text-xs text-muted-foreground">
                  List of available animations for this model
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Default Animation</Label>
                <Input
                  value={formData.defaultAnimation}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultAnimation: e.target.value }))}
                  placeholder="idle"
                />
              </div>
            </TabsContent>
            
            {/* Files Management Tab */}
            <TabsContent value="files" className="space-y-4 py-4">
              {/* Existing Files Section */}
              {selectedModel?.files && selectedModel.files.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Existing Files</Label>
                  {selectedModel.files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {file.fileType === 'model' && <span>🎯</span>}
                          {file.fileType === 'texture' && <span>{getTextureTypeIcon(file.textureType)}</span>}
                          {file.fileType === 'binary' && <span>🔧</span>}
                          <div>
                            <p className="text-sm font-medium">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.fileType} • {formatFileSize(file.fileSize)} • 
                              {file.fileType === 'texture' && ` ${file.textureType || 'baseColor'}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.filePath, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {file.fileType !== 'model' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id, file.fileName)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No files associated with this model</p>
              )}
              
              {/* Add New Files Section */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-semibold mb-2 block">Add New Files</Label>
                
                {/* Add Textures */}
                <div className="space-y-2 border rounded-lg p-4 mb-3">
                  <Label className="font-medium">Add Texture Files</Label>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleTextureSelect}
                    className="cursor-pointer"
                  />
                  {uploadFiles.textures.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-sm font-medium">Textures to add:</p>
                      {uploadFiles.textures.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>📷 {file.name} ({formatFileSize(file.size)})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTexture(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload additional texture files (base color, normal maps, roughness, metallic, emissive, occlusion)
                  </p>
                </div>

                {/* Add Binary Files */}
                <div className="space-y-2 border rounded-lg p-4 mb-3">
                  <Label className="font-medium">Add Binary Files</Label>
                  <Input
                    type="file"
                    accept=".bin"
                    multiple
                    onChange={handleBinarySelect}
                    className="cursor-pointer"
                  />
                  {uploadFiles.binaries.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-sm font-medium">Binary files to add:</p>
                      {uploadFiles.binaries.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>🔧 {file.name} ({formatFileSize(file.size)})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBinary(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload binary buffer files (.bin) if your model uses external buffers
                  </p>
                </div>

                {/* Add Files Button */}
                {(uploadFiles.textures.length > 0 || uploadFiles.binaries.length > 0) && (
                  <div className="mt-4">
                    <Button 
                      onClick={handleAddFilesToModel} 
                      disabled={addingFiles}
                      className="w-full"
                    >
                      {addingFiles ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Adding Files... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add {uploadFiles.textures.length + uploadFiles.binaries.length} File(s) to Model
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedModel?.modelName}"? This action cannot be undone.
              {selectedModel?.usedByPlants && (
                <p className="mt-2 text-red-500 font-semibold">
                  Warning: This model is used by one or more plants. Deleting it will remove the model from those plants.
                </p>
              )}
              {selectedModel?.usedByCharacters && (
                <p className="mt-2 text-red-500 font-semibold">
                  Warning: This model is used by one or more characters. Deleting it will remove the model from those characters.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}