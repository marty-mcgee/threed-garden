'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Music, Play } from 'lucide-react';
import { toast } from 'sonner';

// Import Badge if not already imported
import { Badge } from '@/components/ui/badge';

interface Track {
  id: number;
  albumId: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
  lyrics: string | null;
  playCount: number;
}

interface Album {
  id: number;
  title: string;
  artist: string;
}

export default function TracksManagementPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({
    albumId: '',
    title: '',
    duration: '',
    trackNumber: '',
    publicUrl: '', // Add this
    lyrics: '',
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (selectedAlbumId) {
      fetchTracks(selectedAlbumId);
    } else if (albums.length > 0 && !selectedAlbumId) {
      setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  const fetchAlbums = async () => {
    const response = await fetch('/api/music/albums');
    if (response.ok) {
      const data = await response.json();
      setAlbums(data);
      if (data.length > 0) {
        setSelectedAlbumId(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchTracks = async (albumId: number) => {
    const response = await fetch(`/api/music/tracks?albumId=${albumId}`);
    if (response.ok) {
      const data = await response.json();
      setTracks(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/music/tracks';
    const method = editingTrack ? 'PUT' : 'POST';
    const body = editingTrack
      ? {
          id: editingTrack.id,
          albumId: parseInt(formData.albumId),
          title: formData.title,
          duration: formData.duration ? parseInt(formData.duration) : null,
          trackNumber: formData.trackNumber ? parseInt(formData.trackNumber) : null,
          publicUrl: formData.publicUrl,
          lyrics: formData.lyrics || null,
        }
      : {
          albumId: parseInt(formData.albumId),
          title: formData.title,
          duration: formData.duration ? parseInt(formData.duration) : null,
          trackNumber: formData.trackNumber ? parseInt(formData.trackNumber) : null,
          publicUrl: formData.publicUrl,
          lyrics: formData.lyrics || null,
        };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      toast.success(editingTrack ? 'Track updated' : 'Track created');
      setIsDialogOpen(false);
      if (selectedAlbumId) {
        fetchTracks(selectedAlbumId);
      }
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
      if (selectedAlbumId) {
        fetchTracks(selectedAlbumId);
      }
    } else {
      toast.error('Failed to delete track');
    }
  };

  const resetForm = () => {
    setFormData({
      albumId: selectedAlbumId?.toString() || '',
      title: '',
      duration: '',
      trackNumber: '',
      publicUrl: '',
      lyrics: '',
    });
    setEditingTrack(null);
  };

  const openEdit = (track: Track) => {
    setEditingTrack(track);
    setFormData({
      albumId: track.albumId.toString(),
      title: track.title,
      duration: track.duration?.toString() || '',
      trackNumber: track.trackNumber?.toString() || '',
      publicUrl: track.publicUrl,
      lyrics: track.lyrics || '',
    });
    setIsDialogOpen(true);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading tracks...</div>;
  }

  const selectedAlbum = albums.find(a => a.id === selectedAlbumId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tracks</h1>
          <p className="text-muted-foreground mt-1">Manage your music tracks</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Track
        </Button>
      </div>

      {/* Album Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Select Album:</Label>
            <Select
              value={selectedAlbumId?.toString()}
              onValueChange={(value) => setSelectedAlbumId(parseInt(value))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose an album" />
              </SelectTrigger>
              <SelectContent>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id.toString()}>
                    {album.title} - {album.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tracks List */}
      {selectedAlbum && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedAlbum.title} - Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 text-center">
                      <span className="text-sm font-medium">{track.trackNumber || '-'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{track.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(track.duration)} • {track.publicUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        {track.playCount} plays
                      </Badge>
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
      )}

      {/* Track Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTrack ? 'Edit Track' : 'Add New Track'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Album</Label>
              <Select
                value={formData.albumId}
                onValueChange={(value) => setFormData({ ...formData, albumId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id.toString()}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label>Public URL *</Label>
              <Input
                value={formData.publicUrl}
                onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
                placeholder="albums/1/track1.mp3"
                required
              />
            </div>
            <div>
              <Label>Lyrics (optional)</Label>
              <Textarea
                value={formData.lyrics}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingTrack ? 'Update' : 'Create'}</Button>
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
