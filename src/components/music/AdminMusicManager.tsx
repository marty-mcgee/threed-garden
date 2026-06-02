'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Music, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
  status: string;
  isPublic: boolean;
}

interface Track {
  id: number;
  albumId: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
  lyrics: string | null;
}

export function AdminMusicManager() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [isTrackDialogOpen, setIsTrackDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [albumForm, setAlbumForm] = useState({
    title: '',
    artist: '',
    coverArt: '',
    releaseYear: '',
    description: '',
    status: 'draft',
    isPublic: false,
  });
  const [trackForm, setTrackForm] = useState({
    title: '',
    duration: '',
    trackNumber: '',
    publicUrl: '',
    lyrics: '',
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (selectedAlbum) {
      fetchTracks(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  const fetchAlbums = async () => {
    const response = await fetch('/api/music/albums');
    if (response.ok) {
      const data = await response.json();
      setAlbums(data);
      if (data.length > 0 && !selectedAlbum) {
        setSelectedAlbum(data[0]);
      }
    }
  };

  const fetchTracks = async (albumId: number) => {
    const response = await fetch(`/api/music/tracks?albumId=${albumId}`);
    if (response.ok) {
      const data = await response.json();
      setTracks(data);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/music/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...albumForm,
        releaseYear: albumForm.releaseYear ? parseInt(albumForm.releaseYear) : null,
      }),
    });

    if (response.ok) {
      toast.success('Album created successfully');
      setIsAlbumDialogOpen(false);
      fetchAlbums();
      resetAlbumForm();
    } else {
      toast.error('Failed to create album');
    }
  };

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum) return;

    const response = await fetch('/api/music/albums', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingAlbum.id,
        ...albumForm,
        releaseYear: albumForm.releaseYear ? parseInt(albumForm.releaseYear) : null,
      }),
    });

    if (response.ok) {
      toast.success('Album updated successfully');
      setIsAlbumDialogOpen(false);
      fetchAlbums();
      resetAlbumForm();
    } else {
      toast.error('Failed to update album');
    }
  };

  const handleDeleteAlbum = async (id: number) => {
    if (!confirm('Are you sure you want to delete this album? All tracks will also be deleted.')) return;

    const response = await fetch(`/api/music/albums?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Album deleted successfully');
      fetchAlbums();
      if (selectedAlbum?.id === id) {
        setSelectedAlbum(null);
        setTracks([]);
      }
    } else {
      toast.error('Failed to delete album');
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum) return;

    const response = await fetch('/api/music/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        albumId: selectedAlbum.id,
        title: trackForm.title,
        duration: trackForm.duration ? parseInt(trackForm.duration) : null,
        trackNumber: trackForm.trackNumber ? parseInt(trackForm.trackNumber) : null,
        publicUrl: trackForm.publicUrl,
        lyrics: trackForm.lyrics || null,
      }),
    });

    if (response.ok) {
      toast.success('Track created successfully');
      setIsTrackDialogOpen(false);
      fetchTracks(selectedAlbum.id);
      resetTrackForm();
    } else {
      toast.error('Failed to create track');
    }
  };

  const handleDeleteTrack = async (id: number) => {
    if (!confirm('Are you sure you want to delete this track?')) return;

    const response = await fetch(`/api/music/tracks?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Track deleted successfully');
      if (selectedAlbum) {
        fetchTracks(selectedAlbum.id);
      }
    } else {
      toast.error('Failed to delete track');
    }
  };

  const resetAlbumForm = () => {
    setAlbumForm({
      title: '',
      artist: '',
      coverArt: '',
      releaseYear: '',
      description: '',
      status: 'draft',
      isPublic: false,
    });
    setEditingAlbum(null);
  };

  const resetTrackForm = () => {
    setTrackForm({
      title: '',
      duration: '',
      trackNumber: '',
      publicUrl: '',
      lyrics: '',
    });
    setEditingTrack(null);
  };

  const openEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    setAlbumForm({
      title: album.title,
      artist: album.artist,
      coverArt: album.coverArt,
      releaseYear: album.releaseYear?.toString() || '',
      description: album.description || '',
      status: album.status,
      isPublic: album.isPublic,
    });
    setIsAlbumDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Music Library Manager</h2>
        <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAlbumForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Album
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create New Album'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingAlbum ? handleUpdateAlbum : handleCreateAlbum} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Artist *</Label>
                <Input
                  value={albumForm.artist}
                  onChange={(e) => setAlbumForm({ ...albumForm, artist: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cover Art URL *</Label>
                <Input
                  value={albumForm.coverArt}
                  onChange={(e) => setAlbumForm({ ...albumForm, coverArt: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                  required
                />
              </div>
              <div>
                <Label>Release Year</Label>
                <Input
                  type="number"
                  value={albumForm.releaseYear}
                  onChange={(e) => setAlbumForm({ ...albumForm, releaseYear: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={albumForm.status}
                  onChange={(e) => setAlbumForm({ ...albumForm, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={albumForm.isPublic}
                    onChange={(e) => setAlbumForm({ ...albumForm, isPublic: e.target.checked })}
                  />
                  Make album public
                </label>
              </div>
              <Button type="submit">{editingAlbum ? 'Update' : 'Create'} Album</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Albums List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Albums</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {albums.map((album) => (
              <div
                key={album.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedAlbum?.id === album.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                }`}
                onClick={() => setSelectedAlbum(album)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{album.title}</h4>
                    <p className="text-sm text-muted-foreground">{album.artist}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {album.releaseYear} • {album.status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditAlbum(album);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAlbum(album.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tracks Management */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {selectedAlbum ? `Tracks: ${selectedAlbum.title}` : 'Select an album'}
              </CardTitle>
              {selectedAlbum && (
                <Dialog open={isTrackDialogOpen} onOpenChange={setIsTrackDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={resetTrackForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Track
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Track to {selectedAlbum.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTrack} className="space-y-4">
                      <div>
                        <Label>Track Title *</Label>
                        <Input
                          value={trackForm.title}
                          onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Track Number</Label>
                        <Input
                          type="number"
                          value={trackForm.trackNumber}
                          onChange={(e) => setTrackForm({ ...trackForm, trackNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={trackForm.duration}
                          onChange={(e) => setTrackForm({ ...trackForm, duration: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>S3 Key *</Label>
                        <Input
                          value={trackForm.publicUrl}
                          onChange={(e) => setTrackForm({ ...trackForm, publicUrl: e.target.value })}
                          placeholder="albums/1/track1.mp3"
                          required
                        />
                      </div>
                      <div>
                        <Label>Lyrics (optional)</Label>
                        <Textarea
                          value={trackForm.lyrics}
                          onChange={(e) => setTrackForm({ ...trackForm, lyrics: e.target.value })}
                        />
                      </div>
                      <Button type="submit">Add Track</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="flex justify-between items-center p-3 rounded-lg bg-accent/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {track.trackNumber && `${track.trackNumber}. `}{track.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '--:--'} • {track.publicUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingTrack(track);
                        setTrackForm({
                          title: track.title,
                          duration: track.duration?.toString() || '',
                          trackNumber: track.trackNumber?.toString() || '',
                          publicUrl: track.publicUrl,
                          lyrics: track.lyrics || '',
                        });
                        setIsTrackDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteTrack(track.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {tracks.length === 0 && selectedAlbum && (
                <p className="text-center text-muted-foreground py-8">
                  No tracks yet. Click "Add Track" to add your first track.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}