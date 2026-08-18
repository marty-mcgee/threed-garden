// app/admin/music/albums/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye, Music, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
  status: string;
  isPublic: boolean;
  sortOrder: number;
  tracks?: Track[];
  createdAt: string;
}

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
}

export default function AlbumsManagementPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedCoverIds, setFailedCoverIds] = useState<Set<number>>(() => new Set());
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    coverArt: '',
    releaseYear: '',
    description: '',
    status: 'draft',
    isPublic: false,
    sortOrder: '0',
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/music/albums?includeTracks=true');
      const data = await response.json();
      if (data.success) {
        setFailedCoverIds(new Set());
        setAlbums(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch albums', 'error');
        setAlbums([]);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      showToast('Failed to fetch albums', 'error');
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.artist || !formData.coverArt) {
      showToast('Title, artist, and cover art are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = '/api/music/albums';
      const method = editingAlbum ? 'PUT' : 'POST';
      const payload = {
        ...(editingAlbum && { id: editingAlbum.id }),
        title: formData.title,
        artist: formData.artist,
        coverArt: formData.coverArt,
        releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : null,
        description: formData.description || null,
        status: formData.status,
        isPublic: formData.isPublic,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast(editingAlbum ? 'Album updated successfully' : 'Album created successfully', 'success');
        setIsDialogOpen(false);
        resetForm();
        await fetchAlbums();
      } else {
        showToast(data.error || 'Failed to save album', 'error');
      }
    } catch (error) {
      console.error('Error saving album:', error);
      showToast('Failed to save album', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? All tracks will also be deleted.`)) return;
    
    try {
      const response = await fetch(`/api/music/albums?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Album deleted successfully', 'success');
        await fetchAlbums();
      } else {
        showToast(data.error || 'Failed to delete album', 'error');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      showToast('Failed to delete album', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist: '',
      coverArt: '',
      releaseYear: '',
      description: '',
      status: 'draft',
      isPublic: false,
      sortOrder: albums.length.toString(),
    });
    setEditingAlbum(null);
  };

  const openEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      artist: album.artist,
      coverArt: album.coverArt || '',
      releaseYear: album.releaseYear?.toString() || '',
      description: album.description || '',
      status: album.status || 'draft',
      isPublic: album.isPublic || false,
      sortOrder: album.sortOrder?.toString() || '0',
    });
    setIsDialogOpen(true);
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

  const sortedAlbums = [...albums].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Albums</h1>
          <p className="text-sm text-muted-foreground">Manage your music albums</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Album
        </Button>
      </div>

      {/* Album Grid */}
      {sortedAlbums.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No albums yet</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create your first album
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAlbums.map((album) => (
            <Card key={album.id} className="group overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  {album.coverArt?.trim() && !failedCoverIds.has(album.id) ? (
                    <Image
                      src={album.coverArt}
                      alt={album.title}
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover"
                      onError={() => {
                        setFailedCoverIds((current) => {
                          const next = new Set(current);
                          next.add(album.id);
                          return next;
                        });
                      }}
                    />
                  ) : (
                    <div className="flex h-48 w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                      <Music className="h-10 w-10 opacity-50" />
                      <span className="text-sm">No cover art</span>
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 ${getStatusVariant(album.status)}`}>
                    {album.status}
                  </Badge>
                  {album.isPublic && (
                    <Badge variant="outline" className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm">
                      Public
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{album.title}</h3>
                  <p className="text-sm text-muted-foreground">{album.artist}</p>
                  {album.releaseYear && (
                    <p className="text-xs text-muted-foreground mt-1">{album.releaseYear}</p>
                  )}
                  {album.description && (
                    <p className="text-sm mt-2 line-clamp-2">{album.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Music className="h-3 w-3" />
                    <span>{album.tracks?.length || 0} tracks</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/admin/music/albums/${album.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Tracks
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(album)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(album.id, album.title)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Album Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create New Album'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="coverArt">Cover Art URL *</Label>
              <Input
                id="coverArt"
                value={formData.coverArt}
                onChange={(e) => setFormData({ ...formData, coverArt: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="releaseYear">Release Year</Label>
                <Input
                  id="releaseYear"
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower numbers appear first
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isPublic">Make public</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingAlbum ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingAlbum ? 'Update Album' : 'Create Album'
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
