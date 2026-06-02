// src/app/dashboard/threed/plant-models/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
// import { plantModels, getPlantModel } from '@/components/threed/PlantModels';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

export default function PlantModelsAdminPage() {
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // const plantList = Object.keys(plantModels);
  
  return (
    <div className="space-y-6">
      {/* <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">3D Plant Models Library</h1>
          <p className="text-sm text-muted-foreground">
            {plantList.length} plant models available • Add custom growth stages
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Plant Model
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {plantList.map((plantName) => {
          const model = plantModels[plantName];
          const stages = Object.keys(model.growthStages);
          return (
            <Card key={plantName} className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {model.type === 'Vegetable' ? '🥕' : model.type === 'Herb' ? '🌿' : model.type === 'Fruit' ? '🍓' : '🌻'}
                  </div>
                  <h3 className="font-semibold capitalize">{plantName}</h3>
                  <p className="text-xs text-muted-foreground">{model.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stages.length} growth stages</p>
                  <div className="flex gap-1 mt-3 justify-center">
                    {stages.map(stage => (
                      <span key={stage} className="w-2 h-2 rounded-full bg-green-500" title={stage} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div> */}
      
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-3">How to Use</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Plant models are automatically selected based on plant name matching.</p>
            <p>2. Each plant has growth stages: seed → seedling → vegetative → flowering → fruiting → mature.</p>
            <p>3. Growth stage determines plant height, foliage density, and fruit presence.</p>
            <p>4. To add a new plant model, edit <code className="bg-muted px-1 rounded">src/components/threed/PlantModels.tsx</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}