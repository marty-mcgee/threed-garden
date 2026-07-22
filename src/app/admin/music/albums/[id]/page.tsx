// app/admin/music/albums/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Edit, Trash2, Music, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Import sub-components for the tabs
import { MediaManager } from '@/components/admin/music/media/MediaManager';
import { MusicLinksCRUD } from '@/components/admin/music/links/MusicLinksCRUD';

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
  status: string;
}

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

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const albumId = parseInt(params.id as string);
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    trackNumber: '',
    publicUrl: '',
    status: 'active',
  });

  useEffect(() => {
    fetchAlbum();
    fetchTracks();
  }, [albumId]);

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/music/albums?id=${albumId}`);
      const data = await response.json();
      if (data.success) {
        setAlbum(data.data);
      } else {
        showToast(data.error || 'Failed to fetch album', 'error');
      }
    } catch (error) {
      console.error('Error fetching album:', error);
      showToast('Failed to fetch album', 'error');
    }
  };

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/music/tracks?albumId=${albumId}`);
      const data = await response.json();
      if (data.success) {
        setTracks(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch tracks', 'error');
        setTracks([]);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      showToast('Failed to fetch tracks', 'error');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.publicUrl) {
      showToast('Title and audio URL are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = '/api/music/tracks';
      const method = editingTrack ? 'PUT' : 'POST';
      const payload = {
        ...(editingTrack && { id: editingTrack.id }),
        albumId,
        title: formData.title,
        duration: formData.duration ? parseInt(formData.duration) : null,
        trackNumber: formData.trackNumber ? parseInt(formData.trackNumber) : null,
        publicUrl: formData.publicUrl,
        status: formData.status || 'active',
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast(editingTrack ? 'Track updated successfully' : 'Track added successfully', 'success');
        setIsDialogOpen(false);
        resetForm();
        await fetchTracks();
        await fetchAlbum();
      } else {
        showToast(data.error || 'Failed to save track', 'error');
      }
    } catch (error) {
      console.error('Error saving track:', error);
      showToast('Failed to save track', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete track "${title}"?`)) return;
    
    try {
      const response = await fetch(`/api/music/tracks?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Track deleted successfully', 'success');
        await fetchTracks();
        await fetchAlbum();
      } else {
        showToast(data.error || 'Failed to delete track', 'error');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      showToast('Failed to delete track', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      duration: '',
      trackNumber: '',
      publicUrl: '',
      status: 'active',
    });
    setEditingTrack(null);
  };

  const openEdit = (track: Track) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      duration: track.duration?.toString() || '',
      trackNumber: track.trackNumber?.toString() || '',
      publicUrl: track.publicUrl || '',
      status: track.status || 'active',
    });
    setIsDialogOpen(true);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Album not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/music/albums')}>
          Back to Albums
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/music/albums')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{album.title}</h1>
          <p className="text-sm text-muted-foreground">{album.artist}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Album Info Sidebar */}
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <img
              src={album.coverArt}
              alt={album.title}
              className="w-full rounded-lg mb-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-album.jpg';
              }}
            />
            {album.releaseYear && (
              <p className="text-sm">Released: {album.releaseYear}</p>
            )}
            {album.description && (
              <p className="text-sm text-muted-foreground mt-2">{album.description}</p>
            )}
            <div className="mt-4 flex flex-col gap-1 text-sm">
              <span>Status: <Badge variant={getStatusVariant(album.status)}>{album.status}</Badge></span>
              <span>Public: {album.isPublic ? 'Yes' : 'No'}</span>
              <span>Tracks: {tracks.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-3">
          <Tabs defaultValue="tracks" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="media">Media Gallery</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tracks" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Track List</CardTitle>
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
                  {tracks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No tracks yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          resetForm();
                          setIsDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add your first track
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {track.trackNumber && `${track.trackNumber}. `}{track.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatDuration(track.duration)}</span>
                                <Badge variant={track.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                  {track.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(track)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(track.id, track.title)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="links" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <MusicLinksCRUD onModuleUpdate={fetchAlbum} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="media" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <MediaManager 
                    albumId={album.id} 
                    albumTitle={album.title}
                    onMediaChange={() => {
                      fetchAlbum();
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Track Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrack ? 'Edit Track' : 'Add Track to Album'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="track-title">Track Title *</Label>
              <Input
                id="track-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="track-number">Track Number</Label>
                <Input
                  id="track-number"
                  type="number"
                  value={formData.trackNumber}
                  onChange={(e) => setFormData({ ...formData, trackNumber: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="180"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="publicUrl">Audio URL *</Label>
              <Input
                id="publicUrl"
                value={formData.publicUrl}
                onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
                disabled={isSubmitting}
                placeholder="https://example.com/track.mp3"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                S3 URL or any publicly accessible audio file URL
              </p>
            </div>
            <div>
              <Label htmlFor="track-status">Status</Label>
              <select
                id="track-status"
                className="w-full p-2 border rounded-md bg-background"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="processing">Processing</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingTrack ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingTrack ? 'Update Track' : 'Add Track'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}