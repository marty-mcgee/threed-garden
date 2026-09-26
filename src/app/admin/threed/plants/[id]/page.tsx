// app/admin/threed/plants/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sprout, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Plant {
  id: number;
  commonName: string;
  scientificName: string | null;
  variety: string | null;
  growthStage: string;
  plantType: string;
  status: string;
  description: string | null;
  waterNeeds: string;
  sunlightNeeds: string;
  isEdible: boolean;
  isPerennial: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const plantId = parseInt(params.id as string);
  
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlant();
  }, [plantId]);

  const fetchPlant = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/threed/plants?id=${plantId}`);
      const data = await response.json();
      if (data.success) {
        setPlant(data.data);
      } else {
        showToast(data.error || 'Failed to fetch plant', 'error');
      }
    } catch (error) {
      console.error('Error fetching plant:', error);
      showToast('Failed to fetch plant', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plant) return;
    if (!confirm(`Delete plant "${plant.commonName}"?`)) return;
    
    try {
      const response = await fetch(`/api/threed/plants?id=${plant.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Plant deleted successfully', 'success');
        router.push('/admin/threed/plants');
      } else {
        showToast(data.error || 'Failed to delete plant', 'error');
      }
    } catch (error) {
      console.error('Error deleting plant:', error);
      showToast('Failed to delete plant', 'error');
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'dormant': return 'secondary';
      case 'inactive': return 'outline';
      case 'dead': return 'destructive';
      default: return 'secondary';
    }
  };

  const getGrowthStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      seed: 'Seed',
      seedling: 'Seedling',
      vegetative: 'Vegetative',
      flowering: 'Flowering',
      fruiting: 'Fruiting',
      harvesting: 'Harvesting',
      dormant: 'Dormant',
    };
    return labels[stage] || stage;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plant not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/threed/plants')}>
          Back to Plants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/threed/plants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{plant.commonName}</h1>
          {plant.scientificName && (
            <p className="text-sm text-muted-foreground italic">{plant.scientificName}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Plant Details</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push(`/admin/threed/plants/${plant.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Common Name</p>
                <p className="font-medium">{plant.commonName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scientific Name</p>
                <p className="font-medium italic">{plant.scientificName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Variety</p>
                <p className="font-medium">{plant.variety || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plant Type</p>
                <p className="font-medium capitalize">{plant.plantType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth Stage</p>
                <Badge variant="outline">{getGrowthStageLabel(plant.growthStage)}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(plant.status)}>{plant.status}</Badge>
              </div>
            </div>

            {plant.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{plant.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Water Needs</p>
                <p className="font-medium capitalize">{plant.waterNeeds}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sunlight Needs</p>
                <p className="font-medium capitalize">{plant.sunlightNeeds.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Edible</p>
                <p className="font-medium">{plant.isEdible ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Perennial</p>
                <p className="font-medium">{plant.isPerennial ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm text-muted-foreground">
              <div>
                <span>Created: {formatDate(plant.createdAt)}</span>
              </div>
              <div>
                <span>Updated: {formatDate(plant.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline">
              <Sprout className="h-4 w-4 mr-2" />
              View in Garden
            </Button>
            <Button className="w-full" variant="outline">
              Add to Planting
            </Button>
            <Button className="w-full" variant="outline">
              Create Task
            </Button>
            <Button className="w-full" variant="outline">
              View Harvest History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}