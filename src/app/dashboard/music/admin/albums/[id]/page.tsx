'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Music } from 'lucide-react';
import { toast } from 'sonner';
import { MediaManager } from '@/components/music/MediaManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = parseInt(params.id as string);
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    trackNumber: '',
    publicUrl: '',
  });

  useEffect(() => {
    fetchAlbum();
    fetchTracks();
  }, [albumId]);

  const fetchAlbum = async () => {
    const response = await fetch(`/api/music/albums?id=${albumId}`);
    if (response.ok) {
      const data = await response.json();
      setAlbum(data);
    }
  };

  const fetchTracks = async () => {
    const response = await fetch(`/api/music/tracks?albumId=${albumId}`);
    if (response.ok) {
      const data = await response.json();
      setTracks(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/music/tracks';
    const method = editingTrack ? 'PUT' : 'POST';
    const body = editingTrack
      ? {
          id: editingTrack.id,
          albumId,
          title: formData.title,
          duration: formData.duration ? parseInt(formData.duration) : null,
          trackNumber: formData.trackNumber ? parseInt(formData.trackNumber) : null,
          publicUrl: formData.publicUrl,
        }
      : {
          albumId,
          title: formData.title,
          duration: formData.duration ? parseInt(formData.duration) : null,
          trackNumber: formData.trackNumber ? parseInt(formData.trackNumber) : null,
          publicUrl: formData.publicUrl,
        };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      toast.success(editingTrack ? 'Track updated' : 'Track added');
      setIsDialogOpen(false);
      fetchTracks();
      resetForm();
    } else {
      toast.error('Failed to save track');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this track?')) return;
    
    const response = await fetch(`/api/music/tracks?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Track deleted');
      fetchTracks();
    } else {
      toast.error('Failed to delete track');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      duration: '',
      trackNumber: '',
      publicUrl: '',
    });
    setEditingTrack(null);
  };

  const openEdit = (track: Track) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      duration: track.duration?.toString() || '',
      trackNumber: track.trackNumber?.toString() || '',
      publicUrl: track.publicUrl,
    });
    setIsDialogOpen(true);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !album) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <p className="text-muted-foreground">{album.artist}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="media">Media Gallery</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracks">
            {/* Existing tracks management */}
          </TabsContent>
          
          <TabsContent value="links">
            {/* Existing links management */}
          </TabsContent>
          
          <TabsContent value="media">
            <MediaManager 
              albumId={album.id} 
              albumTitle={album.title}
              onMediaChange={() => {
                // Refresh album data
                router.refresh();
              }}
            />
          </TabsContent>
        </Tabs>

        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <img
              src={album.coverArt}
              alt={album.title}
              className="w-full rounded-lg mb-4"
            />
            {album.releaseYear && (
              <p className="text-sm">Released: {album.releaseYear}</p>
            )}
            {album.description && (
              <p className="text-sm text-muted-foreground mt-2">{album.description}</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tracks</CardTitle>
              <Button size="sm" onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Track
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {track.trackNumber && `${track.trackNumber}. `}{track.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(track.duration)} • {track.publicUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(track)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(track.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {tracks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No tracks yet. Click "Add Track" to add your first track.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Track Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTrack ? 'Edit Track' : 'Add Track to Album'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Track Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Track Number</Label>
                <Input
                  type="number"
                  value={formData.trackNumber}
                  onChange={(e) => setFormData({ ...formData, trackNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>S3 Key *</Label>
              <Input
                value={formData.publicUrl}
                onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
                placeholder="albums/1/track1.mp3"
                required
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower numbers appear first in the music library
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingTrack ? 'Update' : 'Add'}</Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}