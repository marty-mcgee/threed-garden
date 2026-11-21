// app/admin/threed/plants/[id]/page.tsx
'use client';

import { EntityAlbumsSection } from '@/components/admin/threed/multimedia/EntityAlbumsSection';
import { PlantEditDialog } from '@/components/admin/threed/plants/PlantEditDialog';
import type { Plant } from '@/components/admin/threed/plants/plant-form';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sprout, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const plantId = /^\d+$/.test(id) ? Number(id) : NaN;
  return <PlantDetail key={id} plantId={plantId} />;
}

function PlantDetail({ plantId }: { plantId: number }) {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!Number.isSafeInteger(plantId) || plantId < 1) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    async function load() {
      try {
        const response = await fetch(`/api/threed/plants?id=${plantId}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (response.status === 404) return;
        const result = await response.json();
        if (!response.ok || !result.success || result.data?.id !== plantId) {
          throw new Error(result.error || 'Could not load this Plant.');
        }
        if (!controller.signal.aborted) setPlant(result.data);
      } catch (failure) {
        if (!controller.signal.aborted) {
          setLoadError(failure instanceof Error ? failure.message : 'Could not load this Plant.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [plantId, attempt]);

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

  const getStatusVariant = (status: Plant['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
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
        {loadError ? (
          <>
            <p role="alert" className="text-destructive">{loadError}</p>
            <Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry</Button>
          </>
        ) : <p className="text-muted-foreground">Plant not found</p>}
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
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
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
                <p className="font-medium capitalize">{plant.type ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth Habit</p>
                <Badge variant="outline">{plant.growthHabit || '—'}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(plant.status)}>{plant.status ?? '—'}</Badge>
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
                <p className="font-medium capitalize">{plant.waterNeeds || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sunlight Needs</p>
                <p className="font-medium capitalize">{plant.sunlight || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frost Tolerant</p>
                <p className="font-medium">{plant.frostTolerant == null ? '—' : plant.frostTolerant ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Perennial</p>
                <p className="font-medium">{plant.perennial == null ? '—' : plant.perennial ? 'Yes' : 'No'}</p>
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
            <Button className="w-full" variant="success">
              Create Task
            </Button>
            <Button className="w-full" variant="outline">
              View Harvest History
            </Button>
          </CardContent>
        </Card>
      </div>
      {editing ? (
        <PlantEditDialog
          plant={plant}
          onClose={() => setEditing(false)}
          onSaved={updated => {
            setPlant(updated);
            setEditing(false);
            showToast('Plant updated successfully', 'success');
          }}
        />
      ) : (
        <EntityAlbumsSection moduleType="plant" entityId={plant.id} entityName={plant.commonName} />
      )}
    </div>
  );
}
