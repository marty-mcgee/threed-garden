// src/app/dashboard/threed/garden/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Box, Sprout, Sun, Droplets, Thermometer, MapPin, AlertCircle } from 'lucide-react';

// // Dynamically import the 3D viewer to avoid SSR issues
// const ThreeDGarden = dynamic(() => import('@/components/threed/ThreeDGarden'), {
//   ssr: false,
//   loading: () => (
//     <div className="w-full h-[800px] bg-muted rounded-xl flex items-center justify-center">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//     </div>
//   ),
// });
import { ThreeDGarden } from '@/components/threed/ThreeDGarden'; // Regular import, NOT dynamic

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

interface GardenPlanting {
  id: number;
  plantId: number;
  plantName: string;
  plantType: string;
  quantity: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  growthStage: string;
  daysToMaturity: number;
  bedId: number;
  modelType?: string;
  customColor?: string;
}

export default function Garden3DPage() {
  const { showToast, ToastComponent } = useToast();
  const [beds, setBeds] = useState<GardenBed[]>([]);
  const [plantings, setPlantings] = useState<GardenPlanting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBed, setSelectedBed] = useState<GardenBed | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<GardenPlanting | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // ✅ v0.15.1: Use project-scoped API when project is selected, individual APIs otherwise
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setDebugInfo('Fetching data...');

      // Helper to parse position columns
      const px = (item: any) => parseFloat(String(item.positionX ?? item.position?.x ?? 0));
      const py = (item: any) => parseFloat(String(item.positionY ?? item.position?.y ?? 0));
      const pz = (item: any) => parseFloat(String(item.positionZ ?? item.position?.z ?? 0));

      if (selectedProjectId) {
        // ✅ Project-scoped — use /api/map/threed (returns beds + plantings + weatherLogs)
        const response = await fetch(`/api/map/threed?projectId=${selectedProjectId}`);
        const result = await response.json();
        if (!result.success) {
          setDebugInfo(`API error: ${result.error || 'Unknown'}`);
          showToast(result.error || 'Failed to load data', 'error');
          setLoading(false); setRefreshing(false);
          return;
        }
        const rawData = result.data || {};

        setBeds((rawData.beds || []).map((item: any) => ({
          id: item.id, name: item.name, shape: item.shape || 'rectangle',
          widthFeet: parseFloat(String(item.widthFeet || 4)), lengthFeet: parseFloat(String(item.lengthFeet || 8)),
          positionX: px(item), positionY: py(item), positionZ: pz(item),
          color: item.color || '#8B5E3C',
        })));

        setPlantings((rawData.plantings || []).map((item: any) => ({
          id: item.id, plantId: item.plantId || item.id,
          plantName: item.commonName || item.name || `Planting #${item.id}`,
          plantType: item.type || 'Vegetable', quantity: item.quantity || 1,
          positionX: px(item), positionY: py(item), positionZ: pz(item),
          growthStage: item.growthStage || 'vegetative',
          daysToMaturity: item.daysToMaturity || 60,
          bedId: item.bedId || item.bed_id || null,
          modelType: item.modelType || null, customColor: item.color || null,
        })));

        const wl = rawData.weatherLogs || [];
        if (wl.length > 0) {
          setWeather({ temperature: parseFloat(String(wl[0].temperature || 70)), condition: 'sunny', rainfall: 0 });
        }
      } else {
        // ✅ No project selected — fetch from individual public APIs
        const [bedsRes, plantingsRes, weatherRes] = await Promise.all([
          fetch('/api/threed/beds?limit=100&showAll=true'),
          fetch('/api/threed/plantings?limit=500&showAll=true'),
          fetch('/api/threed/weather?limit=1').catch(() => null),
        ]);

        const bedsData = await bedsRes.json();
        const plantingsData = await plantingsRes.json();

        if (bedsData.success) {
          setBeds((bedsData.data || []).map((item: any) => ({
            id: item.id, name: item.name, shape: item.shape || 'rectangle',
            widthFeet: parseFloat(String(item.widthFeet || 4)), lengthFeet: parseFloat(String(item.lengthFeet || 8)),
            positionX: px(item), positionY: py(item), positionZ: pz(item),
            color: item.color || '#8B5E3C',
          })));
        }

        if (plantingsData.success && plantingsData.data) {
          setPlantings((Array.isArray(plantingsData.data) ? plantingsData.data : []).map((item: any) => {
            const planting = item.planting || item;
            const plant = item.plant || {};
            return {
              id: planting.id, plantId: planting.plantId,
              plantName: plant.commonName || planting.plantName || `Planting #${planting.id}`,
              plantType: plant.type || 'Vegetable', quantity: planting.quantity || 1,
              positionX: px(planting), positionY: py(planting), positionZ: pz(planting),
              growthStage: planting.growthStage || 'vegetative',
              daysToMaturity: plant.daysToMaturity || 60,
              bedId: planting.bedId || null,
              modelType: plant.modelType || null, customColor: planting.color || null,
            };
          }));
        }

        if (weatherRes && weatherRes.ok) {
          const wd = await weatherRes.json().catch(() => null);
          if (wd.success && wd.data?.length > 0) {
            const t = parseFloat(String(wd.data[0].temperature || 70));
            setWeather({ temperature: t, condition: t > 80 ? 'sunny' : 'cloudy', rainfall: 0 });
          }
        }
      }
      
      setDebugInfo(`${beds.length} beds, ${plantings.length} plantings loaded`);
      showToast('Garden data loaded', 'success');
      
    } catch (error) {
      console.error('Error fetching garden data:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      showToast('Failed to load garden data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, selectedProjectId, beds.length, plantings.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBedSelect = (bed: GardenBed) => {
    setSelectedBed(bed);
    setSelectedPlant(null);
    showToast(`Selected: ${bed.name}`, 'info');
  };

  const handlePlantSelect = (plant: GardenPlanting) => {
    setSelectedPlant(plant);
    setSelectedBed(null);
    showToast(`${plant.plantName} - ${plant.growthStage} stage`, 'info');
  };

  // Calculate stats
  const totalBeds = beds.length;
  const totalPlants = plantings.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const activePlantings = plantings.filter(p => p.growthStage !== 'harvested').length;
  const uniqueBeds = new Set(plantings.map(p => p.bedId).filter(Boolean)).size;

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
          <h1 className="text-2xl font-bold text-foreground">3D Garden Explorer</h1>
          <p className="text-sm text-muted-foreground">
            {totalBeds} beds • {totalPlants} plants • {activePlantings} active plantings
          </p>
          {debugInfo && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {debugInfo}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      
      {/* Warning if no beds or plantings */}
      {beds.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              No garden beds found. Create a bed to see your 3D garden.
            </p>
          </div>
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/threed/beds'}>
              Go to Beds
            </Button>
          </div>
        </div>
      )}
      
      {plantings.length === 0 && beds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-400">
              No plantings found. Create a planting to see plants in your 3D garden.
            </p>
          </div>
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/threed/plantings'}>
              Go to Plantings
            </Button>
          </div>
        </div>
      )}
      
      {/* Weather Widget */}
      {weather && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">{weather.temperature}°F</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{weather.rainfall || 0}" rain</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium capitalize">{weather.condition}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Current Conditions</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Beds</p>
                <p className="text-2xl font-bold text-foreground">{totalBeds}</p>
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
                <p className="text-2xl font-bold text-green-600">{totalPlants}</p>
              </div>
              <Sprout className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Active Plantings</p>
                <p className="text-2xl font-bold text-blue-600">{activePlantings}</p>
              </div>
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Beds with Plants</p>
                <p className="text-2xl font-bold text-purple-600">{uniqueBeds}</p>
              </div>
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 3D Garden Viewer */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ThreeDGarden
            beds={beds}
            plantings={plantings}
            weather={weather}
            onBedSelect={handleBedSelect}
            onPlantSelect={handlePlantSelect}
          />
        </CardContent>
      </Card>
      
      {/* Selection Panel */}
      {(selectedBed || selectedPlant) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Selected Item</h3>
            {selectedBed && (
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Bed:</span> {selectedBed.name}</p>
                <p><span className="font-medium">Dimensions:</span> {selectedBed.widthFeet}' × {selectedBed.lengthFeet}'</p>
                <p><span className="font-medium">Color:</span> <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: selectedBed.color }} /></p>
                <p><span className="font-medium">Position:</span> ({selectedBed.positionX}, {selectedBed.positionZ})</p>
              </div>
            )}
            {selectedPlant && (
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Plant:</span> {selectedPlant.plantName}</p>
                <p><span className="font-medium">Type:</span> {selectedPlant.plantType}</p>
                <p><span className="font-medium">Growth Stage:</span> {selectedPlant.growthStage}</p>
                <p><span className="font-medium">Quantity:</span> {selectedPlant.quantity}</p>
                <p><span className="font-medium">Position:</span> ({selectedPlant.positionX}, {selectedPlant.positionZ})</p>
                {selectedPlant.daysToMaturity && (
                  <p><span className="font-medium">Days to Maturity:</span> {selectedPlant.daysToMaturity}</p>
                )}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                if (selectedBed) window.location.href = '/dashboard/threed/beds';
                if (selectedPlant) window.location.href = '/dashboard/threed/plantings';
              }}>
                Manage {selectedBed ? 'Bed' : 'Planting'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}