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
import ThreeDGarden from '@/components/threed/ThreeDGarden'; // Regular import, NOT dynamic

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

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setDebugInfo('Fetching data...');
      
      // Fetch beds
      const bedsRes = await fetch('/api/threed/beds?limit=100&showAll=true');
      const bedsData = await bedsRes.json();
      
      if (bedsData.success) {
        const mappedBeds = bedsData.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          shape: item.shape || 'rectangle',
          widthFeet: parseFloat(item.widthFeet || 4),
          lengthFeet: parseFloat(item.lengthFeet || 8),
          positionX: parseFloat(item.positionX || 0),
          positionY: parseFloat(item.positionY || 0),
          positionZ: parseFloat(item.positionZ || 0),
          color: item.color || '#8B5E3C',
        }));
        setBeds(mappedBeds);
        setDebugInfo(`Loaded ${mappedBeds.length} beds`);
        console.log('✅ Beds loaded:', mappedBeds);
      }
      
      // Fetch plantings with plant data
      const plantingsRes = await fetch('/api/threed/plantings?limit=500');
      const plantingsData = await plantingsRes.json();
      
      console.log('Raw plantings data:', plantingsData);
      
      if (plantingsData.success && plantingsData.data) {
        // 🔧 FIX: Properly extract the data from the nested structure
        const mappedPlantings = plantingsData.data.map((item: any) => {
          // The API returns { planting: {...}, plant: {...}, bed: {...} }
          const planting = item.planting;
          const plant = item.plant;
          
          return {
            id: planting.id,
            plantId: planting.plantId,
            plantName: plant?.commonName || 'Unknown Plant',
            plantType: plant?.type || 'Vegetable',
            quantity: planting.quantity || 1,
            positionX: parseFloat(planting.positionX || 0),
            positionY: parseFloat(planting.positionY || 0),
            positionZ: parseFloat(planting.positionZ || 0),
            growthStage: planting.growthStage || 'vegetative',
            daysToMaturity: plant?.daysToMaturity || 60,
            bedId: planting.bedId,
            modelType: plant?.modelType || null,
            customColor: plant?.foliageColor || null,
          };
        });
        
        setPlantings(mappedPlantings);
        setDebugInfo(`Loaded ${mappedPlantings.length} plantings`);
        console.log('✅ Plantings loaded:', mappedPlantings);
        
        // Log the first planting for debugging
        if (mappedPlantings.length > 0) {
          console.log('Sample planting:', mappedPlantings[0]);
        }
      } else {
        setDebugInfo(`Plantings load failed: ${plantingsData.error || 'No data'}`);
      }
      
      // Fetch current weather
      try {
        const weatherRes = await fetch('/api/threed/weather?limit=1');
        const weatherData = await weatherRes.json();
        if (weatherData.success && weatherData.data && weatherData.data.length > 0) {
          const latest = weatherData.data[0];
          setWeather({
            temperature: latest.temperature,
            condition: latest.temperature > 80 ? 'sunny' : 'cloudy',
            rainfall: latest.rainfallInches || 0,
          });
        }
      } catch (weatherErr) {
        console.warn('Weather fetch failed:', weatherErr);
      }
      
    } catch (error) {
      console.error('Error fetching garden data:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      showToast('Failed to load garden data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

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