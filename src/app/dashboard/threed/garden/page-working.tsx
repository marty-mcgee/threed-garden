// src/app/dashboard/threed/garden/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Box, Sprout } from 'lucide-react';

// Dynamically import the 3D viewer to avoid SSR issues
const GardenViewer = dynamic(() => import('@/components/threed/GardenViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-muted rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface GardenBed {
  id: number;
  name: string;
  shape: string;
  widthFeet: number;
  lengthFeet: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  color: string;
}

interface Planting {
  id: number;
  plantingId: string;
  plantName: string;
  plantType: string;
  quantity: number;
  positionX: number;
  positionZ: number;
  growthStage: string;
}

export default function Garden3DPage() {
  const { showToast, ToastComponent } = useToast();
  const [beds, setBeds] = useState<GardenBed[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<GardenBed | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Planting | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch beds
      const bedsRes = await fetch('/api/threed/beds?limit=100');
      const bedsData = await bedsRes.json();
      if (bedsData.success) {
        setBeds(bedsData.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          shape: item.shape,
          widthFeet: parseFloat(item.widthFeet || 4),
          lengthFeet: parseFloat(item.lengthFeet || 8),
          positionX: parseFloat(item.positionX || 0),
          positionY: parseFloat(item.positionY || 0),
          positionZ: parseFloat(item.positionZ || 0),
          color: item.color || '#8B5E3C',
        })));
      }
      
      // Fetch plantings with plant data
      const plantingsRes = await fetch('/api/threed/plantings?limit=500');
      const plantingsData = await plantingsRes.json();
      if (plantingsData.success) {
        setPlantings(plantingsData.data.map((item: any) => ({
          id: item.planting.id,
          plantingId: item.planting.plantingId,
          plantName: item.plant?.commonName || 'Unknown Plant',
          plantType: item.plant?.type || 'Vegetable',
          quantity: item.planting.quantity || 1,
          positionX: parseFloat(item.planting.positionX || 0),
          positionZ: parseFloat(item.planting.positionZ || 0),
          growthStage: item.planting.growthStage || 'vegetative',
        })));
      }
      
    } catch (error) {
      console.error('Error fetching garden data:', error);
      showToast('Failed to load garden data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const handleBedClick = (bed: GardenBed) => {
    setSelectedBed(bed);
    showToast(`Selected: ${bed.name}`, 'info');
  };
  
  const handlePlantClick = (plant: Planting) => {
    setSelectedPlant(plant);
    showToast(`${plant.plantName} - ${plant.growthStage} stage`, 'info');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">3D Garden View</h1>
          <p className="text-sm text-muted-foreground">
            {beds.length} beds • {plantings.length} plants
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Beds</p>
                <p className="text-2xl font-bold text-foreground">{beds.length}</p>
              </div>
              <Box className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Plants</p>
                <p className="text-2xl font-bold text-green-600">{plantings.reduce((sum, p) => sum + p.quantity, 0)}</p>
              </div>
              <Sprout className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Vegetative</p>
                <p className="text-2xl font-bold text-lime-600">{plantings.filter(p => p.growthStage === 'vegetative').length}</p>
              </div>
              <Sprout className="w-5 h-5 text-lime-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Fruiting/Flowering</p>
                <p className="text-2xl font-bold text-orange-600">{plantings.filter(p => p.growthStage === 'fruiting' || p.growthStage === 'flowering').length}</p>
              </div>
              <Sprout className="w-5 h-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 3D Garden Viewer */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-xl">
          {beds.length > 0 ? (
            <div className="h-[600px]">
              <GardenViewer
                beds={beds}
                plantings={plantings}
                onBedClick={handleBedClick}
                onPlantClick={handlePlantClick}
              />
            </div>
          ) : (
            <div className="h-[600px] bg-muted flex flex-col items-center justify-center">
              <Box className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No garden beds configured</p>
              <p className="text-sm text-muted-foreground mt-1">Create a bed to start your 3D garden</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Selection Panel */}
      {(selectedBed || selectedPlant) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Selected Item</h3>
            {selectedBed && (
              <div className="text-sm">
                <p><span className="font-medium">Bed:</span> {selectedBed.name}</p>
                <p><span className="font-medium">Dimensions:</span> {selectedBed.widthFeet}' × {selectedBed.lengthFeet}'</p>
                <p><span className="font-medium">Color:</span> <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: selectedBed.color }}></span></p>
              </div>
            )}
            {selectedPlant && (
              <div className="text-sm">
                <p><span className="font-medium">Plant:</span> {selectedPlant.plantName}</p>
                <p><span className="font-medium">Growth Stage:</span> {selectedPlant.growthStage}</p>
                <p><span className="font-medium">Quantity:</span> {selectedPlant.quantity}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}