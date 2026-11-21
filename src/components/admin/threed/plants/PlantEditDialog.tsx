'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ModelFileList } from '@/components/admin/threed/models/ModelFileList';
import { EntityAlbumsSection } from '../multimedia/EntityAlbumsSection';
import {
  PLANT_STATUS_OPTIONS,
  PLANT_TYPE_OPTIONS,
  SUNLIGHT_OPTIONS,
  WATER_NEEDS_OPTIONS,
  plantFormData,
  plantFormPayload,
  usePlantModels,
  type Plant,
} from './plant-form';

interface PlantEditDialogProps {
  plant: Plant;
  onClose: () => void;
  onSaved: (updated: Plant) => void;
}

export function PlantEditDialog({ plant, onClose, onSaved }: PlantEditDialogProps) {
  const [initial] = useState(() => plantFormData(plant));
  const [formData, setFormData] = useState(initial);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saving = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const models = usePlantModels(true);
  const selectedModel = models.find(model => String(model.id) === formData.modelId)
    ?? (String(plant.modelId) === formData.modelId ? plant.model : null);

  async function handleUpdate() {
    if (saving.current) return;
    if (!formData.plantId.trim() || !formData.commonName.trim()) {
      setError('Plant ID and Common Name are required.');
      return;
    }

    saving.current = true;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/threed/plants?id=${plant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plantFormPayload(formData, initial)),
      });
      const result = await response.json();
      if (!response.ok || !result.success || result.data?.id !== plant.id) {
        throw new Error(result.error || 'Could not confirm the Plant update.');
      }
      onSaved({
        ...result.data,
        model: selectedModel?.id === result.data.modelId ? selectedModel : null,
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Failed to update Plant.');
    } finally {
      saving.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving.current) onClose(); }}>
      <DialogContent
        showCloseButton={!isSubmitting}
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement) trigger.current = document.activeElement;
        }}
        onCloseAutoFocus={event => {
          if (trigger.current?.isConnected) {
            event.preventDefault();
            trigger.current.focus();
          }
        }}
        className="w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90dvh] gap-3 overflow-y-auto p-4"
      >
        <DialogHeader>
          <DialogTitle>Edit Plant</DialogTitle>
        </DialogHeader>
        <div className="grid min-w-0 grid-cols-1 items-start gap-3 pt-1 md:grid-cols-2 [&_input]:h-8 [&_input]:text-xs [&_textarea]:min-h-16 [&_textarea]:text-xs [&_label]:text-xs [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:text-xs [&>div]:min-w-0">
          <div>
            <Label htmlFor="edit-plantId">Plant ID *</Label>
            <Input
              id="edit-plantId"
              value={formData.plantId}
              onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="edit-commonName">Common Name *</Label>
            <Input
              id="edit-commonName"
              value={formData.commonName}
              onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-scientificName">Scientific Name</Label>
              <Input
                id="edit-scientificName"
                value={formData.scientificName}
                onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-variety">Variety</Label>
              <Input
                id="edit-variety"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-family">Family</Label>
              <Input
                id="edit-family"
                value={formData.family}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select
                disabled={isSubmitting}
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PLANT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                disabled={isSubmitting}
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PLANT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-modelId">Model</Label>
              <Select
                disabled={isSubmitting}
                value={formData.modelId}
                onValueChange={(value) => setFormData({ ...formData, modelId: value })}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {plant.modelId != null && !models.some(model => model.id === plant.modelId) && (
                    <SelectItem value={String(plant.modelId)}>{plant.model?.modelName ?? `Model #${plant.modelId}`}</SelectItem>
                  )}
                  {models.map((model) => (
                    <SelectItem key={model.id} value={String(model.id)}>
                      {model.modelName} ({model.modelType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected model files */}
          {selectedModel && (
            <ModelFileList
              files={selectedModel.files ?? []}
              emptyText="No files attached to this model (add them in Models)"
            />
          )}

          {/* Growth Parameters */}
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">Growth Parameters</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="edit-growthHabit" className="text-xs">Growth Habit</Label>
                <Input
                  id="edit-growthHabit"
                  value={formData.growthHabit}
                  onChange={(e) => setFormData({ ...formData, growthHabit: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <Label htmlFor="edit-daysToMaturity" className="text-xs">Days to Maturity</Label>
                  <Input
                    id="edit-daysToMaturity"
                    type="number"
                    min="0"
                    value={formData.daysToMaturity}
                    onChange={(e) => setFormData({ ...formData, daysToMaturity: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-daysToGermination" className="text-xs">Days to Germination</Label>
                  <Input
                    id="edit-daysToGermination"
                    type="number"
                    min="0"
                    value={formData.daysToGermination}
                    onChange={(e) => setFormData({ ...formData, daysToGermination: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-daysToHarvest" className="text-xs">Days to Harvest</Label>
                  <Input
                    id="edit-daysToHarvest"
                    type="number"
                    min="0"
                    value={formData.daysToHarvest}
                    onChange={(e) => setFormData({ ...formData, daysToHarvest: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spacing */}
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">Spacing (inches)</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mt-2">
              <div>
                <Label htmlFor="edit-spacingInches" className="text-xs">Spacing</Label>
                <Input
                  id="edit-spacingInches"
                  type="number"
                  min="0"
                  value={formData.spacingInches}
                  onChange={(e) => setFormData({ ...formData, spacingInches: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-rowSpacingInches" className="text-xs">Row Spacing</Label>
                <Input
                  id="edit-rowSpacingInches"
                  type="number"
                  min="0"
                  value={formData.rowSpacingInches}
                  onChange={(e) => setFormData({ ...formData, rowSpacingInches: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-plantingDepthInches" className="text-xs">Planting Depth</Label>
                <Input
                  id="edit-plantingDepthInches"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.plantingDepthInches}
                  onChange={(e) => setFormData({ ...formData, plantingDepthInches: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Environmental Needs */}
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">Environmental Needs</Label>
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-sunlight" className="text-xs">Sunlight</Label>
                  <Select
                    disabled={isSubmitting}
                    value={formData.sunlight}
                    onValueChange={(value) => setFormData({ ...formData, sunlight: value })}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Select sunlight" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUNLIGHT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-waterNeeds" className="text-xs">Water Needs</Label>
                  <Select
                    disabled={isSubmitting}
                    value={formData.waterNeeds}
                    onValueChange={(value) => setFormData({ ...formData, waterNeeds: value })}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Select water needs" />
                    </SelectTrigger>
                    <SelectContent>
                      {WATER_NEEDS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-soilType" className="text-xs">Soil Type</Label>
                  <Input
                    id="edit-soilType"
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-soilPH" className="text-xs">Soil pH</Label>
                  <Input
                    id="edit-soilPH"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={formData.soilPH}
                    onChange={(e) => setFormData({ ...formData, soilPH: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-hardinessZone" className="text-xs">Hardiness Zone</Label>
                  <Input
                    id="edit-hardinessZone"
                    value={formData.hardinessZone}
                    onChange={(e) => setFormData({ ...formData, hardinessZone: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-frostTolerant"
                      checked={formData.frostTolerant}
                      onCheckedChange={(checked) => setFormData({ ...formData, frostTolerant: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-frostTolerant" className="text-xs">Frost Tolerant</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-perennial"
                      checked={formData.perennial}
                      onCheckedChange={(checked) => setFormData({ ...formData, perennial: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-perennial" className="text-xs">Perennial</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">Images</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="edit-imageUrl" className="text-xs">Image URL</Label>
                <Input
                  id="edit-imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-thumbnailUrl" className="text-xs">Thumbnail URL</Label>
                <Input
                  id="edit-thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">Descriptions</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="edit-description" className="text-xs">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-careInstructions" className="text-xs">Care Instructions</Label>
                <Textarea
                  id="edit-careInstructions"
                  value={formData.careInstructions}
                  onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-harvestInstructions" className="text-xs">Harvest Instructions</Label>
                <Textarea
                  id="edit-harvestInstructions"
                  value={formData.harvestInstructions}
                  onChange={(e) => setFormData({ ...formData, harvestInstructions: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Companion Planting */}
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">Companion Planting</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="edit-companionPlants" className="text-xs">Companion Plants</Label>
                <Input
                  id="edit-companionPlants"
                  value={formData.companionPlants}
                  onChange={(e) => setFormData({ ...formData, companionPlants: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-avoidPlants" className="text-xs">Avoid Plants</Label>
                <Input
                  id="edit-avoidPlants"
                  value={formData.avoidPlants}
                  onChange={(e) => setFormData({ ...formData, avoidPlants: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Source & Raw Data */}
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">Source & Data</Label>
            <div className="space-y-2 mt-2">
              <div>
                <Label htmlFor="edit-source" className="text-xs">Source</Label>
                <Input
                  id="edit-source"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-rawData" className="text-xs">Raw Data (JSON)</Label>
                <Input
                  id="edit-rawData"
                  value={formData.rawData}
                  onChange={(e) => setFormData({ ...formData, rawData: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="rounded-md border p-3">
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

          {error && <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            <Button variant="outline" size="sm" disabled={isSubmitting} onClick={onClose}>Cancel</Button>
            <Button variant="success" onClick={handleUpdate} className="h-8 text-xs" disabled={isSubmitting}>
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
        </div>
        <EntityAlbumsSection moduleType="plant" entityId={plant.id} disabled={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
