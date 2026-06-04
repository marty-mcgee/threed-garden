'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Eye, Music } from 'lucide-react';
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
  sortOrder: number;
  tracks?: Track[];
}

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
}

export default function AlbumsManagementPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
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
    const response = await fetch('/api/music/albums?includeTracks=true');
    if (response.ok) {
      const data = await response.json();
      setAlbums(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/music/albums';
    const method = editingAlbum ? 'PUT' : 'POST';
    const body = editingAlbum
      ? { 
          id: editingAlbum.id, 
          ...formData, 
          releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : null,
          sortOrder: parseInt(formData.sortOrder)
        }
      : { 
          ...formData, 
          releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : null,
          sortOrder: parseInt(formData.sortOrder)
        };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      toast.success(editingAlbum ? 'Album updated' : 'Album created');
      setIsDialogOpen(false);
      fetchAlbums();
      resetForm();
    } else {
      toast.error('Failed to save album');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this album? All tracks will also be deleted.')) return;
    
    const response = await fetch(`/api/music/albums?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Album deleted');
      fetchAlbums();
    } else {
      toast.error('Failed to delete album');
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
      coverArt: album.coverArt,
      releaseYear: album.releaseYear?.toString() || '',
      description: album.description || '',
      status: album.status,
      isPublic: album.isPublic,
      sortOrder: album.sortOrder?.toString() || '0',
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading albums...</div>;
  }

  // Sort albums by sortOrder for display in admin
  const sortedAlbums = [...albums].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Albums</h1>
          <p className="text-muted-foreground mt-1">Manage your music albums</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Album
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAlbums.map((album) => (
          <Card key={album.id} className="group">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={album.coverArt}
                  alt={album.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className={`absolute top-2 right-2 ${getStatusColor(album.status)}`}>
                  {album.status}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{album.title}</h3>
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
                    onClick={() => router.push(`/dashboard/music/admin/albums/${album.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Tracks
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(album)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(album.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Album Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create New Album'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Artist *</Label>
              <Input
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Cover Art URL *</Label>
              <Input
                value={formData.coverArt}
                onChange={(e) => setFormData({ ...formData, coverArt: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                required
              />
            </div>
            <div>
              <Label>Release Year</Label>
              <Input
                type="number"
                value={formData.releaseYear}
                onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <div>
              <Label>Status</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                Make album public
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingAlbum ? 'Update' : 'Create'}</Button>
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